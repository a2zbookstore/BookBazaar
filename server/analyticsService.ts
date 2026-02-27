import { db } from "./db";
import {
  analyticsPageViews,
  analyticsSessions,
  analyticsEvents,
  analyticsDailyStats,
  type InsertPageView,
  type InsertSession,
  type InsertEvent
} from "@shared/schema";
import { eq, sql, and, gte, lte, desc } from "drizzle-orm";
import type { Request } from "express";
import { nanoid } from "nanoid";

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
      userId: (req as any).user?.id || null,
      deviceType,
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
    // Update last activity
    await db
      .update(analyticsSessions)
      .set({
        lastActivity: new Date(),
        pageViewCount: sql`${analyticsSessions.pageViewCount} + 1`,
      })
      .where(eq(analyticsSessions.sessionId, sessionId));
  }
  
  return sessionId;
}

// Track page view
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
      userId: (req as any).user?.id || null,
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

// Get all visitors with session details
export async function getVisitorsList(startDate: Date, endDate: Date, limit = 100) {
  const visitors = await db
    .select({
      sessionId: analyticsSessions.sessionId,
      userId: analyticsSessions.userId,
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

// Get detailed information for a specific visitor/session
export async function getVisitorDetail(sessionId: string) {
  // Get session info
  const session = await db
    .select()
    .from(analyticsSessions)
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
