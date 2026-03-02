/**
 * Audit Log System for tracking database changes
 * Tracks who made changes, when, and what was changed
 */

import { db } from "./db";
import { auditLogs, admins } from "@shared/schema";

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';
export type AuditTableName = 'books' | 'categories' | 'orders' | 'users' | 'admins' | 
  'coupons' | 'gift_items' | 'gift_categories' | 'shipping_rates' | 'book_requests';

export interface AuditLogEntry {
  tableName: AuditTableName;
  recordId: number | string;
  action: AuditAction;
  userId?: string;      // For customer actions
  adminId?: number;     // For admin actions
  oldData?: any;        // Data before change (for UPDATE/DELETE)
  newData?: any;        // Data after change (for CREATE/UPDATE)
  ipAddress?: string;
  userAgent?: string;
  notes?: string;
}

/**
 * Log an action to the audit trail
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      tableName: entry.tableName,
      recordId: String(entry.recordId),
      action: entry.action,
      userId: entry.userId || null,
      adminId: entry.adminId || null,
      oldData: entry.oldData ? JSON.stringify(entry.oldData) : null,
      newData: entry.newData ? JSON.stringify(entry.newData) : null,
      ipAddress: entry.ipAddress || null,
      userAgent: entry.userAgent || null,
      notes: entry.notes || null,
      createdAt: new Date(),
    });
    
    console.log(`[AUDIT] ${entry.action} on ${entry.tableName} #${entry.recordId} by ${
      entry.adminId ? `admin:${entry.adminId}` : entry.userId ? `user:${entry.userId}` : 'unknown'
    }`);
  } catch (error) {
    console.error('Failed to log audit entry:', error);
    // Don't throw - we don't want audit logging failures to break the app
  }
}

/**
 * Get audit logs for a specific record
 */
export async function getAuditLogsForRecord(
  tableName: AuditTableName,
  recordId: number | string
) {
  const logs = await db
    .select({
      id: auditLogs.id,
      tableName: auditLogs.tableName,
      recordId: auditLogs.recordId,
      action: auditLogs.action,
      userId: auditLogs.userId,
      adminId: auditLogs.adminId,
      oldData: auditLogs.oldData,
      newData: auditLogs.newData,
      ipAddress: auditLogs.ipAddress,
      userAgent: auditLogs.userAgent,
      notes: auditLogs.notes,
      createdAt: auditLogs.createdAt,
      adminName: admins.name,
      adminEmail: admins.email,
      adminUsername: admins.username,
    })
    .from(auditLogs)
    .leftJoin(admins, eq(auditLogs.adminId, admins.id))
    .where(
      and(
        eq(auditLogs.tableName, tableName),
        eq(auditLogs.recordId, String(recordId))
      )
    )
    .orderBy(desc(auditLogs.createdAt));
  
  return logs;
}

/**
 * Get recent deletions (last 30 days by default)
 */
export async function getRecentDeletions(days: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const deletions = await db
    .select({
      id: auditLogs.id,
      tableName: auditLogs.tableName,
      recordId: auditLogs.recordId,
      action: auditLogs.action,
      userId: auditLogs.userId,
      adminId: auditLogs.adminId,
      oldData: auditLogs.oldData,
      newData: auditLogs.newData,
      ipAddress: auditLogs.ipAddress,
      userAgent: auditLogs.userAgent,
      notes: auditLogs.notes,
      createdAt: auditLogs.createdAt,
      adminName: admins.name,
      adminEmail: admins.email,
      adminUsername: admins.username,
    })
    .from(auditLogs)
    .leftJoin(admins, eq(auditLogs.adminId, admins.id))
    .where(
      and(
        eq(auditLogs.action, 'DELETE'),
        gte(auditLogs.createdAt, cutoffDate)
      )
    )
    .orderBy(desc(auditLogs.createdAt));
  
  return deletions;
}

/**
 * Get audit logs by admin
 */
export async function getAuditLogsByAdmin(adminId: number, limit: number = 100) {
  const logs = await db
    .select({
      id: auditLogs.id,
      tableName: auditLogs.tableName,
      recordId: auditLogs.recordId,
      action: auditLogs.action,
      userId: auditLogs.userId,
      adminId: auditLogs.adminId,
      oldData: auditLogs.oldData,
      newData: auditLogs.newData,
      ipAddress: auditLogs.ipAddress,
      userAgent: auditLogs.userAgent,
      notes: auditLogs.notes,
      createdAt: auditLogs.createdAt,
      adminName: admins.name,
      adminEmail: admins.email,
      adminUsername: admins.username,
    })
    .from(auditLogs)
    .leftJoin(admins, eq(auditLogs.adminId, admins.id))
    .where(eq(auditLogs.adminId, adminId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
  
  return logs;
}

/**
 * Get audit logs by user
 */
export async function getAuditLogsByUser(userId: string, limit: number = 100) {
  const logs = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.userId, userId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
  
  return logs;
}

/**
 * Search audit logs
 */
export async function searchAuditLogs(filters: {
  tableName?: AuditTableName;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  adminId?: number;
  userId?: string;
  limit?: number;
}) {
  const conditions = [];
  
  if (filters.tableName) {
    conditions.push(eq(auditLogs.tableName, filters.tableName));
  }
  
  if (filters.action) {
    conditions.push(eq(auditLogs.action, filters.action));
  }
  
  if (filters.adminId) {
    conditions.push(eq(auditLogs.adminId, filters.adminId));
  }
  
  if (filters.userId) {
    conditions.push(eq(auditLogs.userId, filters.userId));
  }
  
  if (filters.startDate) {
    conditions.push(gte(auditLogs.createdAt, filters.startDate));
  }
  
  if (filters.endDate) {
    conditions.push(lte(auditLogs.createdAt, filters.endDate));
  }
  
  let baseQuery = db
    .select({
      id: auditLogs.id,
      tableName: auditLogs.tableName,
      recordId: auditLogs.recordId,
      action: auditLogs.action,
      userId: auditLogs.userId,
      adminId: auditLogs.adminId,
      oldData: auditLogs.oldData,
      newData: auditLogs.newData,
      ipAddress: auditLogs.ipAddress,
      userAgent: auditLogs.userAgent,
      notes: auditLogs.notes,
      createdAt: auditLogs.createdAt,
      adminName: admins.name,
      adminEmail: admins.email,
      adminUsername: admins.username,
    })
    .from(auditLogs)
    .leftJoin(admins, eq(auditLogs.adminId, admins.id));
  
  if (conditions.length > 0) {
    baseQuery = baseQuery.where(and(...conditions)) as any;
  }
  
  const logs = await baseQuery
    .orderBy(desc(auditLogs.createdAt))
    .limit(filters.limit || 100);
  
  return logs;
}

// Import required functions
import { eq, desc, gte, lte, and } from "drizzle-orm";

/**
 * Restore a deleted record from audit log
 */
export async function restoreFromAudit(
  auditLogId: number,
  adminId: number,
  ipAddress?: string
): Promise<{ success: boolean; message: string; restoredId?: number }> {
  try {
    // Get the audit log entry
    const [auditLog] = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.id, auditLogId))
      .limit(1);

    if (!auditLog) {
      return { success: false, message: 'Audit log entry not found' };
    }

    if (auditLog.action !== 'DELETE') {
      return { success: false, message: 'Can only restore DELETE actions' };
    }

    if (!auditLog.oldData) {
      return { success: false, message: 'No data available to restore' };
    }

    const oldData = JSON.parse(auditLog.oldData);
    const tableName = auditLog.tableName;

    // Import storage dynamically to avoid circular dependencies
    const { storage } = await import('./storage');

    let restoredId: number | undefined;

    // Restore based on table type
    switch (tableName) {
      case 'books':
        // Remove the id and timestamps as they'll be auto-generated
        const { id: bookId, createdAt: bookCreatedAt, updatedAt: bookUpdatedAt, ...bookData } = oldData;
        const restoredBook = await storage.createBook(bookData as any);
        restoredId = restoredBook.id;
        
        // Log the restoration
        await logAudit({
          tableName: 'books',
          recordId: restoredBook.id,
          action: 'RESTORE',
          adminId,
          oldData: null,
          newData: restoredBook,
          ipAddress,
          notes: `Restored book "${restoredBook.title}" from audit log #${auditLogId}`,
        });
        break;

      case 'categories':
        const { id: catId, createdAt: catCreatedAt, ...categoryData } = oldData;
        const restoredCategory = await storage.createCategory(categoryData as any);
        restoredId = restoredCategory.id;
        
        await logAudit({
          tableName: 'categories',
          recordId: restoredCategory.id,
          action: 'RESTORE',
          adminId,
          newData: restoredCategory,
          ipAddress,
          notes: `Restored category "${restoredCategory.name}" from audit log #${auditLogId}`,
        });
        break;

      case 'coupons':
        const { id: couponId, createdAt: couponCreatedAt, updatedAt: couponUpdatedAt, usedCount, ...couponData } = oldData;
        
        // Convert date strings back to Date objects
        if (couponData.startDate && typeof couponData.startDate === 'string') {
          couponData.startDate = new Date(couponData.startDate);
        }
        if (couponData.endDate && typeof couponData.endDate === 'string') {
          couponData.endDate = new Date(couponData.endDate);
        }
        if (couponData.validFrom && typeof couponData.validFrom === 'string') {
          couponData.validFrom = new Date(couponData.validFrom);
        }
        if (couponData.validUntil && typeof couponData.validUntil === 'string') {
          couponData.validUntil = new Date(couponData.validUntil);
        }
        
        // Reset used count to 0 for restored coupons
        const restoredCoupon = await storage.createCoupon({ ...couponData, usedCount: 0 } as any);
        restoredId = restoredCoupon.id;
        
        await logAudit({
          tableName: 'coupons',
          recordId: restoredCoupon.id,
          action: 'RESTORE',
          adminId,
          newData: restoredCoupon,
          ipAddress,
          notes: `Restored coupon "${restoredCoupon.code}" from audit log #${auditLogId}`,
        });
        break;

      default:
        return { 
          success: false, 
          message: `Restoration not supported for table: ${tableName}` 
        };
    }

    return {
      success: true,
      message: `Successfully restored ${tableName} record`,
      restoredId,
    };

  } catch (error) {
    console.error('Error restoring from audit log:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to restore record',
    };
  }
}
