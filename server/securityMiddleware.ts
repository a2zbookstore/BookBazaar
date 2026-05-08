import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { securityEvents, blockedIps } from '@shared/schema';
import { eq, and, gte, sql, or, isNull } from 'drizzle-orm';

// Patterns for sensitive files that should never be accessible
const BLOCKED_PATTERNS = [
  /^\/\.env/i,                    // .env files
  /^\/\.aws/i,                    // AWS credentials
  /^\/\.ssh/i,                    // SSH keys and config
  /^\/\.git/i,                    // Git config
  /^\/terraform\./i,              // Terraform files
  /^\/\.terraform/i,              // Terraform directory
  /^\/serverless\.yml/i,          // Serverless config
  /^\/wp-config\.php/i,           // WordPress config attempts
  /^\/config\.php/i,              // Generic config files
  /^\/\.docker/i,                 // Docker config
  /^\/\.kube/i,                   // Kubernetes config
  /\/id_rsa/i,                    // SSH private keys
  /\/id_dsa/i,
  /\/id_ecdsa/i,
  /\/id_ed25519/i,
  /\/authorized_keys/i,
  /\/known_hosts/i,
  // Server info/status pages - reconnaissance attempts
  /^\/server-status/i,            // Apache server status
  /^\/server-info/i,              // Apache server info
  /^\/nginx_status/i,             // Nginx status page
  /^\/status/i,                   // Generic status pages
  /^\/_profiler/i,                // Symfony profiler
  /^\/phpinfo/i,                  // PHP info pages
  /^\/php-fpm-status/i,           // PHP-FPM status
  /^\/health$/i,                  // Health check (if not needed publicly)
  /^\/metrics/i,                  // Prometheus/monitoring endpoints
];

// Whitelist - IPs that bypass all security checks
// Add your office IP, CI/CD servers, monitoring services, etc.
const WHITELISTED_IPS = new Set<string>([
  // Example: '203.0.113.1',  // Your office IP
  // Example: '198.51.100.50', // CI/CD server
]);

// Known malicious IPs - these will be migrated to database on first run
// After migration, new blocks go directly to database
const INITIAL_BLOCKED_IPS = [
  // TOP TIER THREATS - 5+ attack attempts
  { ip: '107.173.39.76', reason: '12 attacks: .env files + .git config (MOST DANGEROUS)', attackCount: 12 },
  { ip: '172.245.214.59', reason: '6 attacks: .env + .git config', attackCount: 6 },
  { ip: '103.215.74.213', reason: '6 attacks: profiler + server-status', attackCount: 6 },
  { ip: '93.123.109.180', reason: '5 attacks: profiler + server-status', attackCount: 5 },

  // HIGH THREATS - 3-4 attack attempts
  { ip: '195.178.110.132', reason: '4 attacks: profiler + server-status', attackCount: 4 },
  { ip: '103.153.182.11', reason: '3 attacks: profiler + server-status', attackCount: 3 },
  { ip: '185.213.174.123', reason: '3 attacks: .env files', attackCount: 3 },

  // MEDIUM THREATS - 2 attack attempts
  { ip: '145.223.120.224', reason: '2 attacks: phpinfo', attackCount: 2 },
  { ip: '34.93.124.35', reason: '2 attacks: .git files', attackCount: 2 },
  { ip: '93.123.109.79', reason: '2 attacks: .git config', attackCount: 2 },

  // LOW THREATS - Single attack attempts (30-day temporary blocks)
  { ip: '195.178.110.105', reason: 'Profiler access attempt', attackCount: 1 },
  { ip: '103.168.67.107', reason: 'Profiler access attempt', attackCount: 1 },
  { ip: '195.178.110.133', reason: 'Profiler access attempt', attackCount: 1 },
  { ip: '45.148.10.166', reason: 'Profiler access attempt', attackCount: 1 },
  { ip: '88.151.32.195', reason: '.git config access', attackCount: 1 },
  { ip: '103.153.183.126', reason: 'Server-status access', attackCount: 1 },
  { ip: '103.215.74.60', reason: 'Profiler access attempt', attackCount: 1 },
  { ip: '103.215.75.70', reason: 'Profiler access attempt', attackCount: 1 },
  { ip: '110.38.226.66', reason: '.git config access', attackCount: 1 },
  { ip: '103.215.74.185', reason: 'Profiler access attempt', attackCount: 1 },
];

// Track if we've migrated IPs to database
let ipsMigrated = false;

// Rate limiting map
const requestCounts = new Map<string, { count: number; firstRequest: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 500; // Optimized for modern SPA with parallel requests and analytics

export async function securityMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Get real IP address (handles proxies/load balancers)
  // Only use X-Forwarded-For if you trust your reverse proxy!
  const ip = (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.ip ||
    req.socket.remoteAddress ||
    'unknown'
  );
  const path = req.path;
  const userAgent = req.get('user-agent') || 'unknown';

  // Skip ALL security checks for whitelisted IPs (your office, CI/CD, etc.)
  if (WHITELISTED_IPS.has(ip)) {
    return next();
  }

  // Migrate initial blocked IPs to database (runs once on first request)
  if (!ipsMigrated) {
    migrateBlockedIPsToDatabase().catch(err => 
      console.error('Failed to migrate blocked IPs:', err)
    );
    ipsMigrated = true;
  }

  // Skip rate limiting for static assets, analytics, and background requests
  const skipRateLimit = path.startsWith('/assets') ||
    path.startsWith('/uploads') ||
    path.startsWith('/attached_assets') ||
    path.startsWith('/api/analytics') ||  // Analytics heartbeat shouldn't count
    path.startsWith('/api/session') ||     // Session updates are background
    path === '/favicon.ico' ||
    path === '/manifest.json' ||
    path === '/robots.txt' ||
    path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp)$/);  

  // Check if IP is blocked in database
  const isBlocked = await isIPBlocked(ip);
  if (isBlocked) {
    console.log(`🚫 Blocked IP attempted access: ${ip} -> ${path}`);
    await logSecurityEvent(ip, path, userAgent, 'BLOCKED_IP');
    
    // Update last attempt timestamp
    await db.update(blockedIps)
      .set({ lastAttempt: new Date() })
      .where(eq(blockedIps.ip, ip))
      .catch(() => {}); // Ignore errors
    
    return res.status(403).send('Forbidden');
  }

  // Check for sensitive file patterns
  const isSensitiveFile = BLOCKED_PATTERNS.some(pattern => pattern.test(path));
  if (isSensitiveFile) {
    console.log(`🚨 SECURITY ALERT: Attempted access to sensitive file: ${ip} -> ${path}`);
    await logSecurityEvent(ip, path, userAgent, 'SENSITIVE_FILE_ACCESS');

    // Auto-block IPs that try to access multiple sensitive files
    await checkAndBlockSuspiciousIP(ip);

    return res.status(404).send('Not Found'); // Return 404 to not reveal file existence
  }

  // Rate limiting (skip for static assets)
  if (!skipRateLimit) {
    const now = Date.now();
    const requestData = requestCounts.get(ip);

    if (requestData) {
      if (now - requestData.firstRequest < RATE_LIMIT_WINDOW) {
        requestData.count++;
        
        // Add rate limit headers for client visibility
        res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
        res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS_PER_WINDOW - requestData.count).toString());
        res.setHeader('X-RateLimit-Reset', (requestData.firstRequest + RATE_LIMIT_WINDOW).toString());
        
        if (requestData.count > MAX_REQUESTS_PER_WINDOW) {
          console.log(`🚨 Rate limit exceeded: ${ip} (${requestData.count} requests)`);
          await logSecurityEvent(ip, path, userAgent, 'RATE_LIMIT_EXCEEDED');
          
          // Add Retry-After header (seconds until reset)
          const resetTime = Math.ceil((requestData.firstRequest + RATE_LIMIT_WINDOW - now) / 1000);
          res.setHeader('Retry-After', resetTime.toString());
          
          return res.status(429).send('Too Many Requests');
        }
      } else {
        // Reset counter
        requestCounts.set(ip, { count: 1, firstRequest: now });
      }
    } else {
      requestCounts.set(ip, { count: 1, firstRequest: now });
    }
  }

  next();
}

async function logSecurityEvent(
  ip: string,
  path: string,
  userAgent: string,
  eventType: string
) {
  try {
    await db.insert(securityEvents).values({
      ip,
      path,
      userAgent,
      eventType,
    });
  } catch (error) {
    // Silently handle database errors (e.g., table doesn't exist in development)
    // Security middleware will still work, just won't log to database
    if (process.env.NODE_ENV === 'development') {
      // Only log once per session in development to avoid spam
      if (!(global as any).__securityDbWarningShown) {
        console.warn('⚠️  Security events database table not available. Event logging disabled.');
        console.warn('   Run database migration in production to enable security event logging.');
        (global as any).__securityDbWarningShown = true;
      }
    } else {
      console.error('Failed to log security event:', error);
    }
  }
}

async function checkAndBlockSuspiciousIP(ip: string) {
  try {
    // Check if this IP has attempted to access sensitive files multiple times
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentEvents = await db
      .select()
      .from(securityEvents)
      .where(
        and(
          eq(securityEvents.ip, ip),
          eq(securityEvents.eventType, 'SENSITIVE_FILE_ACCESS'),
          gte(securityEvents.createdAt, oneHourAgo)
        )
      )
      .limit(5);

    // If 3+ sensitive file access attempts in the last hour, auto-block for 30 days
    if (recentEvents.length >= 3) {
      const blockedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      
      await db.insert(blockedIps).values({
        ip,
        reason: `Auto-blocked: ${recentEvents.length} sensitive file access attempts in 1 hour`,
        autoBlocked: true,
        attackCount: recentEvents.length,
        blockedUntil,
        lastAttempt: new Date(),
      }).onConflictDoUpdate({
        target: blockedIps.ip,
        set: {
          attackCount: sql`${blockedIps.attackCount} + ${recentEvents.length}`,
          lastAttempt: new Date(),
          blockedUntil, // Extend block
          reason: `Auto-blocked: Multiple sensitive file access attempts (total: ${recentEvents.length}+)`,
        },
      });
      
      console.log(`🔒 Auto-blocked suspicious IP: ${ip} (${recentEvents.length} sensitive file attempts) until ${blockedUntil.toISOString()}`);
      await logSecurityEvent(ip, '', '', 'AUTO_BLOCKED');
    }
  } catch (error) {
    console.error('Failed to check suspicious IP:', error);
  }
}

// Check if IP is blocked in database
async function isIPBlocked(ip: string): Promise<boolean> {
  try {
    const result = await db
      .select()
      .from(blockedIps)
      .where(
        and(
          eq(blockedIps.ip, ip),
          or(
            isNull(blockedIps.blockedUntil),  // Permanent block
            gte(blockedIps.blockedUntil, new Date())  // Temporary block still active
          )
        )
      )
      .limit(1);
    
    return result.length > 0;
  } catch (error) {
    console.error('Error checking blocked IP:', error);
    return false; // Fail open (don't block on database error)
  }
}

// Migrate initial blocked IPs to database (runs once on startup)
async function migrateBlockedIPsToDatabase() {
  try {
    for (const ipData of INITIAL_BLOCKED_IPS) {
      // Block permanently if high threat (3+ attacks), 30 days if low threat (1-2 attacks)
      const blockedUntil = ipData.attackCount >= 3 ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      await db.insert(blockedIps).values({
        ip: ipData.ip,
        reason: ipData.reason,
        autoBlocked: false,
        attackCount: ipData.attackCount,
        blockedUntil,
        lastAttempt: new Date(),
      }).onConflictDoNothing(); // Skip if already exists
    }
    console.log(`✅ Migrated ${INITIAL_BLOCKED_IPS.length} blocked IPs to database`);
  } catch (error) {
    console.error('Failed to migrate blocked IPs:', error);
  }
}

// Export function to manually block an IP
export async function blockIP(ip: string, reason: string = 'Manually blocked by admin') {
  try {
    await db.insert(blockedIps).values({
      ip,
      reason,
      autoBlocked: false,
      attackCount: 0,
      blockedUntil: null, // Permanent
      lastAttempt: new Date(),
    }).onConflictDoUpdate({
      target: blockedIps.ip,
      set: {
        reason,
        blockedUntil: null, // Make permanent
        lastAttempt: new Date(),
      },
    });
    console.log(`🔒 Manually blocked IP: ${ip}`);
  } catch (error) {
    console.error('Failed to block IP:', error);
  }
}

// Export function to unblock an IP
export async function unblockIP(ip: string) {
  try {
    await db.delete(blockedIps).where(eq(blockedIps.ip, ip));
    console.log(`🔓 Unblocked IP: ${ip}`);
  } catch (error) {
    console.error('Failed to unblock IP:', error);
  }
}

// Export function to add IP to whitelist (requires code change to persist)
export function addToWhitelist(ip: string) {
  WHITELISTED_IPS.add(ip);
  console.log(`✅ Added IP to whitelist: ${ip}`);
  console.warn('⚠️  Whitelist is in-memory only. Add to WHITELISTED_IPS constant to persist.');
}

// Export function to remove from whitelist
export function removeFromWhitelist(ip: string) {
  WHITELISTED_IPS.delete(ip);
  console.log(`❌ Removed IP from whitelist: ${ip}`);
}
