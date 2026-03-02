import { db } from "./db";
import { 
  analyticsPageViews, 
  analyticsSessions, 
  analyticsEvents,
  analyticsDailyStats
} from "@shared/schema";
import { sql, lt, and, gte } from "drizzle-orm";

// Data retention configuration (in days)
const RETENTION_CONFIG = {
  pageViews: 90,        // Keep detailed page views for 90 days
  sessions: 90,         // Keep session data for 90 days
  events: 90,           // Keep event data for 90 days
  dailyStats: 365,      // Keep aggregated daily stats for 1 year
};

/**
 * Aggregate old data into daily stats before deleting
 */
async function aggregateOldData(date: Date) {
  try {
    console.log(`Aggregating data for ${date.toISOString().split('T')[0]}`);
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Check if daily stats already exist for this date
    const existing = await db
      .select()
      .from(analyticsDailyStats)
      .where(
        and(
          gte(analyticsDailyStats.date, startOfDay),
          lt(analyticsDailyStats.date, endOfDay)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      console.log(`Daily stats already exist for ${date.toISOString().split('T')[0]}`);
      return;
    }

    // Calculate stats for the day
    const totalSessions = await db
      .select({ count: sql<number>`count(distinct ${analyticsSessions.sessionId})` })
      .from(analyticsSessions)
      .where(
        and(
          gte(analyticsSessions.firstVisit, startOfDay),
          lt(analyticsSessions.firstVisit, endOfDay)
        )
      );

    const newVisitors = await db
      .select({ count: sql<number>`count(*)` })
      .from(analyticsSessions)
      .where(
        and(
          gte(analyticsSessions.firstVisit, startOfDay),
          lt(analyticsSessions.firstVisit, endOfDay),
          sql`${analyticsSessions.pageViewCount} = 1`
        )
      );

    const totalPageViews = await db
      .select({ count: sql<number>`count(*)` })
      .from(analyticsPageViews)
      .where(
        and(
          gte(analyticsPageViews.createdAt, startOfDay),
          lt(analyticsPageViews.createdAt, endOfDay)
        )
      );

    const topPages = await db
      .select({
        path: analyticsPageViews.pagePath,
        views: sql<number>`count(*)`,
      })
      .from(analyticsPageViews)
      .where(
        and(
          gte(analyticsPageViews.createdAt, startOfDay),
          lt(analyticsPageViews.createdAt, endOfDay)
        )
      )
      .groupBy(analyticsPageViews.pagePath)
      .orderBy(sql`count(*) DESC`)
      .limit(10);

    const topCountries = await db
      .select({
        country: analyticsSessions.country,
        count: sql<number>`count(*)`,
      })
      .from(analyticsSessions)
      .where(
        and(
          gte(analyticsSessions.firstVisit, startOfDay),
          lt(analyticsSessions.firstVisit, endOfDay),
          sql`${analyticsSessions.country} IS NOT NULL`
        )
      )
      .groupBy(analyticsSessions.country)
      .orderBy(sql`count(*) DESC`)
      .limit(10);

    const deviceBreakdown = await db
      .select({
        deviceType: analyticsSessions.deviceType,
        count: sql<number>`count(*)`,
      })
      .from(analyticsSessions)
      .where(
        and(
          gte(analyticsSessions.firstVisit, startOfDay),
          lt(analyticsSessions.firstVisit, endOfDay)
        )
      )
      .groupBy(analyticsSessions.deviceType);

    const browserBreakdown = await db
      .select({
        browser: analyticsSessions.browser,
        count: sql<number>`count(*)`,
      })
      .from(analyticsSessions)
      .where(
        and(
          gte(analyticsSessions.firstVisit, startOfDay),
          lt(analyticsSessions.firstVisit, endOfDay)
        )
      )
      .groupBy(analyticsSessions.browser);

    // Insert aggregated daily stats
    await db.insert(analyticsDailyStats).values({
      date: startOfDay,
      totalVisitors: Number(totalSessions[0]?.count || 0),
      newVisitors: Number(newVisitors[0]?.count || 0),
      returningVisitors: Number(totalSessions[0]?.count || 0) - Number(newVisitors[0]?.count || 0),
      totalPageViews: Number(totalPageViews[0]?.count || 0),
      totalSessions: Number(totalSessions[0]?.count || 0),
      averageSessionDuration: 0, // Can be calculated if needed
      bounceRate: "0",
      topPages: topPages as any,
      topCountries: topCountries as any,
      deviceBreakdown: deviceBreakdown as any,
      browserBreakdown: browserBreakdown as any,
    });

    console.log(`✓ Aggregated data for ${date.toISOString().split('T')[0]}`);
  } catch (error) {
    console.error(`Error aggregating data for ${date.toISOString().split('T')[0]}:`, error);
  }
}

/**
 * Clean up old analytics data based on retention policies
 */
export async function cleanupOldAnalytics() {
  try {
    console.log('Starting analytics data cleanup...');

    const now = new Date();

    // Calculate cutoff dates
    const pageViewsCutoff = new Date(now);
    pageViewsCutoff.setDate(pageViewsCutoff.getDate() - RETENTION_CONFIG.pageViews);

    const sessionsCutoff = new Date(now);
    sessionsCutoff.setDate(sessionsCutoff.getDate() - RETENTION_CONFIG.sessions);

    const eventsCutoff = new Date(now);
    eventsCutoff.setDate(eventsCutoff.getDate() - RETENTION_CONFIG.events);

    const dailyStatsCutoff = new Date(now);
    dailyStatsCutoff.setDate(dailyStatsCutoff.getDate() - RETENTION_CONFIG.dailyStats);

    // Aggregate data before deleting (for last 7 days before cutoff)
    console.log('Aggregating old data before deletion...');
    for (let i = 7; i >= 0; i--) {
      const date = new Date(pageViewsCutoff);
      date.setDate(date.getDate() - i);
      await aggregateOldData(date);
    }

    // Delete old page views
    console.log(`Deleting page views older than ${RETENTION_CONFIG.pageViews} days...`);
    const deletedPageViews = await db
      .delete(analyticsPageViews)
      .where(lt(analyticsPageViews.createdAt, pageViewsCutoff));
    console.log(`✓ Deleted old page views`);

    // Delete old events
    console.log(`Deleting events older than ${RETENTION_CONFIG.events} days...`);
    const deletedEvents = await db
      .delete(analyticsEvents)
      .where(lt(analyticsEvents.createdAt, eventsCutoff));
    console.log(`✓ Deleted old events`);

    // Delete old sessions (that have no recent page views)
    console.log(`Deleting sessions older than ${RETENTION_CONFIG.sessions} days...`);
    const deletedSessions = await db
      .delete(analyticsSessions)
      .where(lt(analyticsSessions.lastActivity, sessionsCutoff));
    console.log(`✓ Deleted old sessions`);

    // Delete old daily stats
    console.log(`Deleting daily stats older than ${RETENTION_CONFIG.dailyStats} days...`);
    const deletedDailyStats = await db
      .delete(analyticsDailyStats)
      .where(lt(analyticsDailyStats.date, dailyStatsCutoff));
    console.log(`✓ Deleted old daily stats`);

    console.log('✅ Analytics cleanup completed successfully!');
    
    return {
      success: true,
      cleaned: {
        pageViews: 'deleted',
        events: 'deleted',
        sessions: 'deleted',
        dailyStats: 'deleted',
      }
    };
  } catch (error) {
    console.error('❌ Error during analytics cleanup:', error);
    throw error;
  }
}

/**
 * Get current database size stats
 */
export async function getAnalyticsDbStats() {
  try {
    const pageViewsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(analyticsPageViews);

    const sessionsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(analyticsSessions);

    const eventsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(analyticsEvents);

    const dailyStatsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(analyticsDailyStats);

    // Get date range
    const oldestPageView = await db
      .select({ date: analyticsPageViews.createdAt })
      .from(analyticsPageViews)
      .orderBy(analyticsPageViews.createdAt)
      .limit(1);

    const newestPageView = await db
      .select({ date: analyticsPageViews.createdAt })
      .from(analyticsPageViews)
      .orderBy(sql`${analyticsPageViews.createdAt} DESC`)
      .limit(1);

    return {
      records: {
        pageViews: Number(pageViewsCount[0]?.count || 0),
        sessions: Number(sessionsCount[0]?.count || 0),
        events: Number(eventsCount[0]?.count || 0),
        dailyStats: Number(dailyStatsCount[0]?.count || 0),
      },
      dateRange: {
        oldest: oldestPageView[0]?.date || null,
        newest: newestPageView[0]?.date || null,
      },
      retentionPolicy: RETENTION_CONFIG,
    };
  } catch (error) {
    console.error('Error getting analytics DB stats:', error);
    throw error;
  }
}
