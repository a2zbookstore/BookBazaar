import { db } from "./db";
import {
  analyticsPageViews,
  analyticsSessions,
  analyticsEvents,
  analyticsDailyStats,
  users,
  type InsertPageView,
  type InsertSession,
  type InsertEvent
} from "@shared/schema";
import { eq, sql, and, gte, lte, desc, isNotNull } from "drizzle-orm";
import type { Request } from "express";
import { nanoid } from "nanoid";

// Resolve userId from either email/phone session auth (req.session.userId)
// or Replit OAuth (req.user.id) — whichever is present.
function getRequestUserId(req: Request): string | null {
  return (
    (req.session as any)?.userId ||
    (req as any).user?.claims?.sub ||
    (req as any).user?.id ||
    null
  );
}

// Helper to parse user agent
function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();
  
  // Device type
  let deviceType = 'desktop';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    deviceType = 'tablet';
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
    deviceType = 'mobile';
  }
  
  // Browser
  let browser = 'Other';
  if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';
  
  // OS
  let os = 'Other';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  
  return { deviceType, browser, os };
}

// Get or create session
export async function getOrCreateSession(req: Request): Promise<string> {
  // Get session ID from cookie or create new one
  let sessionId = req.session?.analyticsSessionId;
  
  if (!sessionId) {
    sessionId = nanoid();
    if (req.session) {
      req.session.analyticsSessionId = sessionId;
    }
  }
  
  // Check if session exists in database
  const existingSession = await db
    .select()
    .from(analyticsSessions)
    .where(eq(analyticsSessions.sessionId, sessionId))
    .limit(1);
  
  if (existingSession.length === 0) {
    // Create new session
    const userAgent = req.headers['user-agent'] || '';
    const { deviceType, browser, os } = parseUserAgent(userAgent);
    const referrer = req.headers['referer'] || req.headers['referrer'] || '';
    
    // Parse UTM parameters
    const url = new URL(req.url, `http://${req.headers.host}`);
    const utmSource = url.searchParams.get('utm_source') || undefined;
    const utmMedium = url.searchParams.get('utm_medium') || undefined;
    const utmCampaign = url.searchParams.get('utm_campaign') || undefined;
    
    await db.insert(analyticsSessions).values({
      sessionId,
      userId: getRequestUserId(req),
      browser,
      os,
      landingPage: req.path,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      country: (req as any).userLocation?.country || null,
      city: (req as any).userLocation?.city || null,
    });
  } else {
    // Update last activity and backfill userId if user just logged in
    const currentUserId = getRequestUserId(req);

    const updatePayload: Record<string, any> = {
      lastActivity: new Date(),
      pageViewCount: sql`${analyticsSessions.pageViewCount} + 1`,
    };
    // If the session has no userId but the request has one, backfill it
    if (currentUserId && !existingSession[0].userId) {
      updatePayload.userId = currentUserId;
    }
    await db
      .update(analyticsSessions)
      .set(updatePayload)
      .where(eq(analyticsSessions.sessionId, sessionId));
  }
  
  return sessionId;
}

// Heartbeat: keep session alive from SPA client, backfill userId on login
export async function updateSessionHeartbeat(
  req: Request,
  currentPage?: string
) {
  try {
    let sessionId = req.session?.analyticsSessionId;
    if (!sessionId) return;

    const currentUserId = getRequestUserId(req);

    const existing = await db
      .select({ userId: analyticsSessions.userId })
      .from(analyticsSessions)
      .where(eq(analyticsSessions.sessionId, sessionId))
      .limit(1);

    if (existing.length === 0) return;

    const updatePayload: Record<string, any> = {
      lastActivity: new Date(),
    };
    if (currentPage) {
      // store the current page as a lightweight page view record (no duplicate full tracking)
      updatePayload.landingPage = updatePayload.landingPage; // keep existing
    }
    // backfill userId if user has since logged in
    if (currentUserId && !existing[0].userId) {
      updatePayload.userId = currentUserId;
    }

    await db
      .update(analyticsSessions)
      .set(updatePayload)
      .where(eq(analyticsSessions.sessionId, sessionId));
  } catch (error) {
    console.error('Heartbeat update error:', error);
  }
}
export async function trackPageView(req: Request, sessionId: string) {
  try {
    const userAgent = req.headers['user-agent'] || '';
    const { deviceType, browser, os } = parseUserAgent(userAgent);
    
    // Get IP address (handle proxies)
    const ipAddress = 
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';
    
    const pageView: InsertPageView = {
      sessionId,
      userId: getRequestUserId(req),
      pagePath: req.path,
      pageTitle: req.path, // Can be enhanced with actual page titles
      referrer: (req.headers['referer'] || req.headers['referrer'] || '') as string,
      userAgent,
      ipAddress,
      country: (req as any).userLocation?.country || null,
      city: (req as any).userLocation?.city || null,
      deviceType,
      browser,
      os,
    };
    
    await db.insert(analyticsPageViews).values(pageView);
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
}

// Track custom event
export async function trackEvent(
  sessionId: string,
  eventType: string,
  eventCategory: string,
  eventData: any = {},
  userId?: string,
  pagePath?: string
) {
  try {
    const event: InsertEvent = {
      sessionId,
      userId: userId || null,
      eventType,
      eventCategory,
      eventData,
      pagePath: pagePath || null,
    };
    
    await db.insert(analyticsEvents).values(event);
  } catch (error) {
    console.error('Error tracking event:', error);
  }
}

// Get analytics overview
export async function getAnalyticsOverview(startDate: Date, endDate: Date) {
  // Total page views
  const pageViews = await db
    .select({ count: sql<number>`count(*)` })
    .from(analyticsPageViews)
    .where(
      and(
        gte(analyticsPageViews.createdAt, startDate),
        lte(analyticsPageViews.createdAt, endDate)
      )
    );
  
  // Unique visitors (sessions)
  const visitors = await db
    .select({ count: sql<number>`count(distinct ${analyticsSessions.sessionId})` })
    .from(analyticsSessions)
    .where(
      and(
        gte(analyticsSessions.firstVisit, startDate),
        lte(analyticsSessions.firstVisit, endDate)
      )
    );
  
  // New vs returning visitors
  const newVisitors = await db
    .select({ count: sql<number>`count(*)` })
    .from(analyticsSessions)
    .where(
      and(
        gte(analyticsSessions.firstVisit, startDate),
        lte(analyticsSessions.firstVisit, endDate),
        eq(analyticsSessions.pageViewCount, 1)
      )
    );
  
  // Top pages
  const topPages = await db
    .select({
      path: analyticsPageViews.pagePath,
      views: sql<number>`count(*)`,
    })
    .from(analyticsPageViews)
    .where(
      and(
        gte(analyticsPageViews.createdAt, startDate),
        lte(analyticsPageViews.createdAt, endDate)
      )
    )
    .groupBy(analyticsPageViews.pagePath)
    .orderBy(desc(sql`count(*)`))
    .limit(10);
  
  // Top countries
  const topCountries = await db
    .select({
      country: analyticsSessions.country,
      count: sql<number>`count(*)`,
    })
    .from(analyticsSessions)
    .where(
      and(
        gte(analyticsSessions.firstVisit, startDate),
        lte(analyticsSessions.firstVisit, endDate),
        sql`${analyticsSessions.country} IS NOT NULL`
      )
    )
    .groupBy(analyticsSessions.country)
    .orderBy(desc(sql`count(*)`))
    .limit(10);
  
  // Device breakdown
  const deviceBreakdown = await db
    .select({
      deviceType: analyticsSessions.deviceType,
      count: sql<number>`count(*)`,
    })
    .from(analyticsSessions)
    .where(
      and(
        gte(analyticsSessions.firstVisit, startDate),
        lte(analyticsSessions.firstVisit, endDate)
      )
    )
    .groupBy(analyticsSessions.deviceType);
  
  // Browser breakdown
  const browserBreakdown = await db
    .select({
      browser: analyticsSessions.browser,
      count: sql<number>`count(*)`,
    })
    .from(analyticsSessions)
    .where(
      and(
        gte(analyticsSessions.firstVisit, startDate),
        lte(analyticsSessions.firstVisit, endDate)
      )
    )
    .groupBy(analyticsSessions.browser);
  
  return {
    totalPageViews: Number(pageViews[0]?.count || 0),
    totalVisitors: Number(visitors[0]?.count || 0),
    newVisitors: Number(newVisitors[0]?.count || 0),
    returningVisitors: Number(visitors[0]?.count || 0) - Number(newVisitors[0]?.count || 0),
    topPages,
    topCountries,
    deviceBreakdown,
    browserBreakdown,
  };
}

// Get real-time visitors (last 5 minutes)
export async function getRealTimeVisitors() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  const activeVisitors = await db
    .select({ count: sql<number>`count(distinct ${analyticsSessions.sessionId})` })
    .from(analyticsSessions)
    .where(gte(analyticsSessions.lastActivity, fiveMinutesAgo));
  
  // Active pages
  const activePages = await db
    .select({
      path: analyticsPageViews.pagePath,
      count: sql<number>`count(*)`,
    })
    .from(analyticsPageViews)
    .where(gte(analyticsPageViews.createdAt, fiveMinutesAgo))
    .groupBy(analyticsPageViews.pagePath)
    .orderBy(desc(sql`count(*)`))
    .limit(5);
  
  return {
    activeVisitors: Number(activeVisitors[0]?.count || 0),
    activePages,
  };
}

// Get daily stats for a date range
export async function getDailyStats(startDate: Date, endDate: Date) {
  const stats = await db
    .select({
      date: sql<string>`DATE(${analyticsSessions.firstVisit})`,
      visitors: sql<number>`count(distinct ${analyticsSessions.sessionId})`,
      pageViews: sql<number>`count(${analyticsPageViews.id})`,
    })
    .from(analyticsSessions)
    .leftJoin(
      analyticsPageViews,
      eq(analyticsSessions.sessionId, analyticsPageViews.sessionId)
    )
    .where(
      and(
        gte(analyticsSessions.firstVisit, startDate),
        lte(analyticsSessions.firstVisit, endDate)
      )
    )
    .groupBy(sql`DATE(${analyticsSessions.firstVisit})`)
    .orderBy(sql`DATE(${analyticsSessions.firstVisit})`);
  
  return stats;
}

// Get event analytics
export async function getEventAnalytics(startDate: Date, endDate: Date) {
  const events = await db
    .select({
      eventType: analyticsEvents.eventType,
      eventCategory: analyticsEvents.eventCategory,
      count: sql<number>`count(*)`,
    })
    .from(analyticsEvents)
    .where(
      and(
        gte(analyticsEvents.createdAt, startDate),
        lte(analyticsEvents.createdAt, endDate)
      )
    )
    .groupBy(analyticsEvents.eventType, analyticsEvents.eventCategory)
    .orderBy(desc(sql`count(*)`));
  
  return events;
}

// Get visitors grouped by identity (userId for logged-in, IP for guests)
export async function getGroupedVisitors(startDate: Date, endDate: Date, limit = 200) {
  // Fetch all sessions in range with user info and their first IP from page views
  const sessions = await db
    .select({
      sessionId: analyticsSessions.sessionId,
      userId: analyticsSessions.userId,
      userEmail: users.email,
      userFirstName: users.firstName,
      userLastName: users.lastName,
      firstVisit: analyticsSessions.firstVisit,
      lastActivity: analyticsSessions.lastActivity,
      pageViewCount: analyticsSessions.pageViewCount,
      country: analyticsSessions.country,
      city: analyticsSessions.city,
      deviceType: analyticsSessions.deviceType,
      browser: analyticsSessions.browser,
      os: analyticsSessions.os,
      landingPage: analyticsSessions.landingPage,
      referrer: analyticsSessions.referrer,
      utmSource: analyticsSessions.utmSource,
      utmMedium: analyticsSessions.utmMedium,
      utmCampaign: analyticsSessions.utmCampaign,
      // get first IP for this session from page_views
      ipAddress: sql<string>`(
        SELECT ip_address FROM analytics_page_views
        WHERE session_id = ${analyticsSessions.sessionId}
        ORDER BY created_at ASC LIMIT 1
      )`,
    })
    .from(analyticsSessions)
    .leftJoin(users, eq(analyticsSessions.userId, users.id))
    .where(
      and(
        gte(analyticsSessions.firstVisit, startDate),
        lte(analyticsSessions.firstVisit, endDate)
      )
    )
    .orderBy(desc(analyticsSessions.lastActivity))
    .limit(limit);

  // Group in JS: by userId for logged-in, by ipAddress for guests
  const groupMap = new Map<string, {
    identityKey: string;
    isLoggedIn: boolean;
    userId: string | null;
    userEmail: string | null;
    userFirstName: string | null;
    userLastName: string | null;
    ipAddress: string | null;
    totalSessions: number;
    totalPageViews: number;
    firstSeen: string;
    lastSeen: string;
    country: string | null;
    city: string | null;
    deviceType: string | null;
    browser: string | null;
    os: string | null;
    sessions: Array<{
      sessionId: string;
      firstVisit: string;
      lastActivity: string;
      pageViewCount: number;
      landingPage: string | null;
      referrer: string | null;
      country: string | null;
      city: string | null;
      deviceType: string | null;
      browser: string | null;
      os: string | null;
      utmSource: string | null;
      utmMedium: string | null;
      utmCampaign: string | null;
    }>;
  }>();

  for (const s of sessions) {
    const key = s.userId
      ? `user:${s.userId}`
      : `ip:${s.ipAddress || 'unknown'}`;

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        identityKey: key,
        isLoggedIn: !!s.userId,
        userId: s.userId,
        userEmail: s.userEmail,
        userFirstName: s.userFirstName,
        userLastName: s.userLastName,
        ipAddress: s.userId ? null : (s.ipAddress || null),
        totalSessions: 0,
        totalPageViews: 0,
        firstSeen: s.firstVisit?.toISOString?.() ?? String(s.firstVisit),
        lastSeen: s.lastActivity?.toISOString?.() ?? String(s.lastActivity),
        country: s.country,
        city: s.city,
        deviceType: s.deviceType,
        browser: s.browser,
        os: s.os,
        sessions: [],
      });
    }

    const group = groupMap.get(key)!;
    group.totalSessions += 1;
    group.totalPageViews += Number(s.pageViewCount || 0);

    const firstVisitStr = s.firstVisit?.toISOString?.() ?? String(s.firstVisit);
    const lastActivityStr = s.lastActivity?.toISOString?.() ?? String(s.lastActivity);

    if (firstVisitStr < group.firstSeen) group.firstSeen = firstVisitStr;
    if (lastActivityStr > group.lastSeen) {
      group.lastSeen = lastActivityStr;
      // update location/device to most recent session's data
      group.country = s.country;
      group.city = s.city;
      group.deviceType = s.deviceType;
      group.browser = s.browser;
      group.os = s.os;
    }

    group.sessions.push({
      sessionId: s.sessionId,
      firstVisit: firstVisitStr,
      lastActivity: lastActivityStr,
      pageViewCount: Number(s.pageViewCount || 0),
      landingPage: s.landingPage,
      referrer: s.referrer,
      country: s.country,
      city: s.city,
      deviceType: s.deviceType,
      browser: s.browser,
      os: s.os,
      utmSource: s.utmSource,
      utmMedium: s.utmMedium,
      utmCampaign: s.utmCampaign,
    });
  }

  // Sort by lastSeen desc
  return Array.from(groupMap.values()).sort(
    (a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
  );
}

// Get all visitors with session details (with user info if logged in)
export async function getVisitorsList(startDate: Date, endDate: Date, limit = 100) {
  const visitors = await db
    .select({
      sessionId: analyticsSessions.sessionId,
      userId: analyticsSessions.userId,
      userEmail: users.email,
      userFirstName: users.firstName,
      userLastName: users.lastName,
      firstVisit: analyticsSessions.firstVisit,
      lastActivity: analyticsSessions.lastActivity,
      pageViewCount: analyticsSessions.pageViewCount,
      country: analyticsSessions.country,
      city: analyticsSessions.city,
      deviceType: analyticsSessions.deviceType,
      browser: analyticsSessions.browser,
      os: analyticsSessions.os,
      landingPage: analyticsSessions.landingPage,
      referrer: analyticsSessions.referrer,
      utmSource: analyticsSessions.utmSource,
      utmMedium: analyticsSessions.utmMedium,
      utmCampaign: analyticsSessions.utmCampaign,
    })
    .from(analyticsSessions)
    .leftJoin(users, eq(analyticsSessions.userId, users.id))
    .where(
      and(
        gte(analyticsSessions.firstVisit, startDate),
        lte(analyticsSessions.firstVisit, endDate)
      )
    )
    .orderBy(desc(analyticsSessions.lastActivity))
    .limit(limit);
  
  return visitors;
}

// Get analytics grouped by logged-in user
export async function getUserAnalytics(startDate: Date, endDate: Date) {
  const userStats = await db
    .select({
      userId: analyticsSessions.userId,
      userEmail: users.email,
      userFirstName: users.firstName,
      userLastName: users.lastName,
      totalSessions: sql<number>`count(distinct ${analyticsSessions.sessionId})`,
      totalPageViews: sql<number>`sum(${analyticsSessions.pageViewCount})`,
      firstSeen: sql<string>`min(${analyticsSessions.firstVisit})`,
      lastSeen: sql<string>`max(${analyticsSessions.lastActivity})`,
      country: sql<string>`max(${analyticsSessions.country})`,
      deviceType: sql<string>`max(${analyticsSessions.deviceType})`,
      browser: sql<string>`max(${analyticsSessions.browser})`,
    })
    .from(analyticsSessions)
    .innerJoin(users, eq(analyticsSessions.userId, users.id))
    .where(
      and(
        gte(analyticsSessions.firstVisit, startDate),
        lte(analyticsSessions.firstVisit, endDate),
        isNotNull(analyticsSessions.userId)
      )
    )
    .groupBy(
      analyticsSessions.userId,
      users.email,
      users.firstName,
      users.lastName
    )
    .orderBy(desc(sql`max(${analyticsSessions.lastActivity})`));

  return userStats;
}

// Get active logged-in users (last 15 minutes)
export async function getActiveLoggedInUsers() {
  const windowAgo = new Date(Date.now() - 15 * 60 * 1000);

  // Get all active sessions for logged-in users, then deduplicate by userId
  // keeping only the most-recently-active session per user
  const rows = await db
    .select({
      userId: analyticsSessions.userId,
      userEmail: users.email,
      userFirstName: users.firstName,
      userLastName: users.lastName,
      lastActivity: analyticsSessions.lastActivity,
      sessionId: analyticsSessions.sessionId,
      currentPage: sql<string>`(
        SELECT page_path FROM analytics_page_views
        WHERE session_id = ${analyticsSessions.sessionId}
        ORDER BY created_at DESC LIMIT 1
      )`,
    })
    .from(analyticsSessions)
    .innerJoin(users, eq(analyticsSessions.userId, users.id))
    .where(
      and(
        gte(analyticsSessions.lastActivity, windowAgo),
        isNotNull(analyticsSessions.userId)
      )
    )
    .orderBy(desc(analyticsSessions.lastActivity))
    .limit(100);

  // Deduplicate: one entry per userId, keep the most recent session
  const seen = new Map<string, typeof rows[0]>();
  for (const row of rows) {
    if (!row.userId) continue;
    if (!seen.has(row.userId)) {
      seen.set(row.userId, row);
    }
  }

  return Array.from(seen.values()).slice(0, 20);
}

// Get detailed information for a specific visitor/session
export async function getVisitorDetail(sessionId: string) {
  // Get session info with user details
  const session = await db
    .select({
      id: analyticsSessions.id,
      sessionId: analyticsSessions.sessionId,
      userId: analyticsSessions.userId,
      userEmail: users.email,
      userFirstName: users.firstName,
      userLastName: users.lastName,
      firstVisit: analyticsSessions.firstVisit,
      lastActivity: analyticsSessions.lastActivity,
      pageViewCount: analyticsSessions.pageViewCount,
      country: analyticsSessions.country,
      city: analyticsSessions.city,
      deviceType: analyticsSessions.deviceType,
      browser: analyticsSessions.browser,
      os: analyticsSessions.os,
      landingPage: analyticsSessions.landingPage,
      referrer: analyticsSessions.referrer,
      utmSource: analyticsSessions.utmSource,
      utmMedium: analyticsSessions.utmMedium,
      utmCampaign: analyticsSessions.utmCampaign,
    })
    .from(analyticsSessions)
    .leftJoin(users, eq(analyticsSessions.userId, users.id))
    .where(eq(analyticsSessions.sessionId, sessionId))
    .limit(1);
  
  if (session.length === 0) {
    return null;
  }
  
  // Get all page views for this session
  const pageViews = await db
    .select({
      id: analyticsPageViews.id,
      pagePath: analyticsPageViews.pagePath,
      pageTitle: analyticsPageViews.pageTitle,
      referrer: analyticsPageViews.referrer,
      createdAt: analyticsPageViews.createdAt,
    })
    .from(analyticsPageViews)
    .where(eq(analyticsPageViews.sessionId, sessionId))
    .orderBy(analyticsPageViews.createdAt);
  
  // Get events for this session
  const events = await db
    .select({
      id: analyticsEvents.id,
      eventType: analyticsEvents.eventType,
      eventCategory: analyticsEvents.eventCategory,
      eventData: analyticsEvents.eventData,
      pagePath: analyticsEvents.pagePath,
      createdAt: analyticsEvents.createdAt,
    })
    .from(analyticsEvents)
    .where(eq(analyticsEvents.sessionId, sessionId))
    .orderBy(analyticsEvents.createdAt);
  
  // Calculate session duration
  const firstView = pageViews[0]?.createdAt;
  const lastView = pageViews[pageViews.length - 1]?.createdAt;
  let sessionDuration = 0;
  if (firstView && lastView) {
    sessionDuration = Math.floor((new Date(lastView).getTime() - new Date(firstView).getTime()) / 1000);
  }
  
  return {
    session: session[0],
    pageViews,
    events,
    sessionDuration, // in seconds
  };
}
