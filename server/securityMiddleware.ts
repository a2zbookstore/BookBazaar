import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { securityEvents } from '@shared/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

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

// Known malicious IPs (update this list with real attackers)
const BLOCKED_IPS = new Set([
  // TOP TIER THREATS - 5+ attack attempts
  '107.173.39.76',      // 12 attacks: .env files + .git config (MOST DANGEROUS)
  '172.245.214.59',     // 6 attacks: .env + .git config
  '103.215.74.213',     // 6 attacks: profiler + server-status
  '93.123.109.180',     // 5 attacks: profiler + server-status

  // HIGH THREATS - 3-4 attack attempts
  '195.178.110.132',    // 4 attacks: profiler + server-status (analyzed 2026-04-28)
  '103.153.182.11',     // 3 attacks: profiler + server-status
  '185.213.174.123',    // 3 attacks: .env files

  // MEDIUM THREATS - 2 attack attempts
  '145.223.120.224',    // 2 attacks: phpinfo
  '34.93.124.35',       // 2 attacks: .git files
  '93.123.109.79',      // 2 attacks: .git config

  // LOW THREATS - Single attack attempts (still blocked permanently)
  '195.178.110.105',    // Profiler access attempt
  '103.168.67.107',     // Profiler access attempt
  '195.178.110.133',    // Profiler access attempt
  '45.148.10.166',      // Profiler access attempt
  '88.151.32.195',      // .git config access
  '103.153.183.126',    // Server-status access
  '103.215.74.60',      // Profiler access attempt
  '103.215.75.70',      // Profiler access attempt
  '110.38.226.66',      // .git config access
  '103.215.74.185',     // Profiler access attempt
]);

// Rate limiting map
const requestCounts = new Map<string, { count: number; firstRequest: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 200; // Increased from 50 to allow normal app usage

export async function securityMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const path = req.path;
  const userAgent = req.get('user-agent') || 'unknown';

  // Skip rate limiting for static assets and health checks
  const skipRateLimit = path.startsWith('/assets') ||
    path.startsWith('/uploads') ||
    path.startsWith('/attached_assets') ||
    path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/);

  // Check if IP is blocked
  if (BLOCKED_IPS.has(ip)) {
    console.log(`🚫 Blocked IP attempted access: ${ip} -> ${path}`);
    await logSecurityEvent(ip, path, userAgent, 'BLOCKED_IP');
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
        if (requestData.count > MAX_REQUESTS_PER_WINDOW) {
          console.log(`🚨 Rate limit exceeded: ${ip} (${requestData.count} requests)`);
          await logSecurityEvent(ip, path, userAgent, 'RATE_LIMIT_EXCEEDED');
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

    // If 3+ sensitive file access attempts in the last hour, auto-block
    if (recentEvents.length >= 3) {
      BLOCKED_IPS.add(ip);
      console.log(`🔒 Auto-blocked suspicious IP: ${ip} (${recentEvents.length} sensitive file attempts)`);
      await logSecurityEvent(ip, '', '', 'AUTO_BLOCKED');
    }
  } catch (error) {
    console.error('Failed to check suspicious IP:', error);
  }
}

// Export function to manually block an IP
export function blockIP(ip: string) {
  BLOCKED_IPS.add(ip);
  console.log(`🔒 Manually blocked IP: ${ip}`);
}

// Export function to unblock an IP
export function unblockIP(ip: string) {
  BLOCKED_IPS.delete(ip);
  console.log(`🔓 Unblocked IP: ${ip}`);
}
