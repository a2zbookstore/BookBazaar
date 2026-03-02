# Audit Trail System

## Overview

The audit trail system tracks all database changes (CREATE, UPDATE, DELETE, RESTORE operations) to provide accountability and help investigate incidents like unexpected data deletions.

## Features

- **Comprehensive Logging**: Automatically logs who made changes, when, and what was changed
- **Before/After Snapshots**: Stores data before and after changes for easy recovery
- **Admin & User Tracking**: Tracks both admin IDs and user IDs for accountability
- **IP Address Logging**: Records the IP address of the person making changes
- **Fast Queries**: Indexed for quick lookups by table, action, date, admin, and user

## Database Schema

The `audit_logs` table stores all audit records:

```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(100) NOT NULL,      -- e.g., 'books', 'categories', 'coupons'
  record_id VARCHAR(100) NOT NULL,        -- ID of the affected record
  action VARCHAR(20) NOT NULL,            -- 'CREATE', 'UPDATE', 'DELETE', 'RESTORE'
  user_id VARCHAR,                        -- For customer actions
  admin_id INTEGER REFERENCES admins(id), -- For admin actions
  old_data TEXT,                          -- JSON string before change
  new_data TEXT,                          -- JSON string after change
  ip_address VARCHAR(45),                 -- IPv4 or IPv6
  user_agent TEXT,                        -- Browser/client info
  notes TEXT,                             -- Human-readable description
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes for Performance

- `idx_audit_table_record`: Fast lookups by table and record ID
- `idx_audit_action`: Filter by action type (DELETE, UPDATE, etc.)
- `idx_audit_created_at`: Time-based queries
- `idx_audit_admin`: Filter by admin
- `idx_audit_user`: Filter by user

## API Endpoints

All audit endpoints require admin authentication (`requireAdminAuth` middleware).

### 1. Get Recent Deletions

Get all deletions within the last N days (default 30).

```http
GET /api/admin/audit/deletions?days=30
```

**Response:**
```json
[
  {
    "id": 123,
    "tableName": "books",
    "recordId": "456",
    "action": "DELETE",
    "adminId": 1,
    "oldData": {
      "id": 456,
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "price": "12.99"
    },
    "newData": null,
    "ipAddress": "192.168.1.1",
    "notes": "Deleted book: The Great Gatsby",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

### 2. Get Audit Logs for Specific Record

Get all changes made to a specific record.

```http
GET /api/admin/audit/:tableName/:recordId
```

**Example:**
```http
GET /api/admin/audit/books/456
```

### 3. Search Audit Logs

Search with multiple filters.

```http
GET /api/admin/audit/search?tableName=books&action=DELETE&startDate=2024-01-01&endDate=2024-01-31&adminId=1&limit=100
```

**Query Parameters:**
- `tableName`: Filter by table (books, categories, coupons, etc.)
- `action`: Filter by action (CREATE, UPDATE, DELETE, RESTORE)
- `adminId`: Filter by admin ID
- `userId`: Filter by user ID
- `startDate`: Filter from date (ISO format)
- `end Date`: Filter to date (ISO format)
- `limit`: Max results (default 100)

### 4. Get Audit Logs by Admin

Get all actions performed by a specific admin.

```http
GET /api/admin/audit/by-admin/:adminId?limit=100
```

### 5. Restore Deleted Record

Restore a previously deleted record from the audit trail.

```http
POST /api/admin/audit/restore/:auditLogId
```

**Requirements:**
- Must be a DELETE action audit log entry
- The audit log must contain `oldData` (the deleted record data)
- Only admin authentication required

**Request:**
```http
POST /api/admin/audit/restore/123
Content-Type: application/json
```

**Success Response:**
```json
{
  "success": true,
  "message": "Book restored successfully",
  "restoredId": 789
}
```

**Error Responses:**
```json
// Audit log not found
{
  "success": false,
  "message": "Audit log entry not found"
}

// Not a DELETE action
{
  "success": false,
  "message": "Only DELETE actions can be restored"
}

// No data to restore
{
  "success": false,
  "message": "No data to restore"
}
```

**What Happens:**
1. Fetches the audit log entry
2. Validates it's a DELETE action with oldData
3. Parses the original record data
4. Removes auto-generated fields (id, createdAt, updatedAt, usedCount)
5. Creates a new record with the original data
6. Logs a RESTORE action to the audit trail
7. Returns the new record's ID

**Important Notes:**
- The restored record gets a **new ID** (not the original ID)
- Auto-generated fields are reset to defaults
- Supported tables: books, categories, coupons
- Each restore creates a new RESTORE audit log entry

---

### Automatic Logging (Already Implemented)

The following delete operations automatically log to the audit trail:

1. **Delete Book**: `storage.deleteBook(id, adminId, ipAddress)`
2. **Delete Category**: `storage.deleteCategory(id, adminId, ipAddress)`
3. **Delete Coupon**: `storage.deleteCoupon(id, adminId, ipAddress)`

Example from routes:
```typescript
app.delete("/api/books/:id", async (req: any, res) => {
  const adminId = (req.session as any)?.adminId;
  const ipAddress = req.ip || req.connection?.remoteAddress;
  
  await storage.deleteBook(id, adminId, ipAddress);
});
```

### Manual Logging

To log custom actions, use the `logAudit` function:

```typescript
import { logAudit } from "./auditLog";

// Before deleting, fetch the record
const record = await storage.getSomeRecord(id);

// Perform the operation
await db.delete(someTable).where(eq(someTable.id, id));

// Log the deletion
await logAudit({
  tableName: 'some_table',
  recordId: id,
  action: 'DELETE',
  adminId: req.session.adminId,
  oldData: record,  // Data before deletion
  ipAddress: req.ip,
  notes: `Deleted ${record.name}`,
});
```

## Adding Audit Logging to New Operations

### Step 1: Update Storage Interface

```typescript
// In server/storage.ts interface
deleteSomething(id: number, adminId?: number, ipAddress?: string): Promise<void>;
```

### Step 2: Implement with Audit Logging

```typescript
async deleteSomething(id: number, adminId?: number, ipAddress?: string): Promise<void> {
  // 1. Fetch record before deletion
  const [record] = await db.select().from(someTable).where(eq(someTable.id, id));
  
  if (!record) {
    throw new Error("Record not found");
  }

  // 2. Perform deletion
  await db.delete(someTable).where(eq(someTable.id, id));

  // 3. Log to audit trail
  await logAudit({
    tableName: 'some_table',
    recordId: id,
    action: 'DELETE',
    adminId,
    oldData: record,
    ipAddress,
    notes: `Deleted record: ${record.name}`,
  });
}
```

### Step 3: Update Route Handler

```typescript
app.delete("/api/something/:id", requireAdminAuth, async (req: any, res) => {
  const id = parseInt(req.params.id);
  const adminId = (req.session as any)?.adminId;
  const ipAddress = req.ip || req.connection?.remoteAddress;
  
  await storage.deleteSomething(id, adminId, ipAddress);
  res.json({ message: "Deleted successfully" });
});
```

## Investigating Deletions

### Find Who Deleted What

```bash
# Using curl
curl -X GET "http://localhost:5000/api/admin/audit/deletions?days=30" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

### Find All Changes to a Specific Book

```bash
curl -X GET "http://localhost:5000/api/admin/audit/books/456" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

### Find All Actions by a Specific Admin

```bash
curl -X GET "http://localhost:5000/api/admin/audit/by-admin/1" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

## Data Recovery

While the audit trail stores deleted data, **automatic restoration is not yet implemented**. To recover deleted data:

1. Query the audit logs to find the deletion record
2. Extract the `oldData` field (contains the full record before deletion)
3. Manually re-insert the data using the admin panel or database tools

Example recovery workflow:

```typescript
// 1. Find the deletion
const logs = await getAuditLogsForRecord('books', '456');
const deletionLog = logs.find(log => log.action === 'DELETE');

// 2. Parse the old data
const bookData = JSON.parse(deletionLog.oldData);

// 3. Re-create the book
await storage.createBook(bookData);
```

## Migration Instructions

### Run Database Migration

The migration file was generated and should be in `migrations/` folder.

To apply the migration:

```bash
# Using Drizzle Kit
npx drizzle-kit push
```

Or manually run the SQL:

```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(100) NOT NULL,
  record_id VARCHAR(100) NOT NULL,
  action VARCHAR(20) NOT NULL,
  user_id VARCHAR,
  admin_id INTEGER REFERENCES admins(id),
  old_data TEXT,
  new_data TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_admin ON audit_logs(admin_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
```

### Verify the Table Exists

```sql
SELECT * FROM audit_logs LIMIT 10;
```

## Performance Considerations

- **Write Performance**: Audit logging adds a small overhead (~10-20ms) to delete operations
- **Storage**: Each audit log record is ~1-5 KB depending on the data size
- **Query Performance**: Indexes ensure fast lookups even with millions of audit records
- **Retention**: Consider archiving logs older than 1-2 years

## Security Notes

- Audit logs are **append-only** - there's no API to delete or modify them
- Only admins can view audit logs (protected by `requireAdminAuth`)
- Audit logs themselves are not audited (to prevent infinite loops)
- Failed audit logging **does not block operations** (logged to console only)

## Troubleshooting

### Audit Logs Not Appearing

1. Check if the `audit_logs` table exists:
   ```sql
   \d audit_logs
   ```

2. Check if the logAudit function is being called:
   ```typescript
   console.log('[AUDIT]', entry); // Add before logAudit call
   ```

3. Check server logs for audit errors:
   ```bash
   grep "Failed to log audit" server.log
   ```

### Missing AdminId in Logs

If `adminId` is null, check:
1. Is the route using `requireAdminAuth` middleware?
2. Is `req.session.adminId` properly set after admin login?
3. Add debug logging:
   ```typescript
   console.log('Session adminId:', req.session.adminId));
   ```

### Migration Failed

If `drizzle-kit push` hangs or fails:
1. Apply the schema manually using SQL (see Migration Instructions above)
2. Check database connection settings in `drizzle.config.ts`
3. Ensure PostgreSQL is running and accessible

## Future Enhancements

- [ ] Automatic data restoration API
- [ ] Audit log UI in admin panel
- [ ] Email notifications for critical deletions
- [ ] Audit log archiving (move old logs to cold storage)
- [ ] Diff viewer for UPDATE operations
- [ ] Export audit logs to CSV/JSON

## Support

For issues or questions, contact the development team or create an issue in the repository.
