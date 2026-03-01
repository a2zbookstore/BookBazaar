# Admin Audit Trail - Quick Start Guide

## Accessing the Audit Trail

Admins can access the Audit Trail in **3 easy ways**:

### 1. From Admin Sidebar
Click on **"Audit Trail"** in the left sidebar navigation (📄 icon)

### 2. From Dashboard
Scroll down to "Quick Actions" and click the **"Audit Trail"** card with the red warning icon

### 3. Direct URL
Navigate to: `/admin/audit-trail`

---

## Features at Your Fingertips

### 📊 **Overview Statistics**
See at a glance:
- Total number of deletions
- Books deleted count
- Categories deleted count
- Coupons deleted count

### 🔍 **Smart Filters**
Find exactly what you need:

**Time Period Filter:**
- Last 7 days
- Last 30 days (default)
- Last 60 days
- Last 90 days
- Last year

**Table Filter:**
- All Tables
- Books only
- Categories only
- Coupons only
- Gift Items
- Gift Categories

**Action Filter:**
- All Actions
- Delete only
- Update only
- Create only

### 📋 **Deletion History Table**

For each deletion, you can see:
- **Date & Time** - Exact timestamp of when it was deleted
- **Table** - Which database table (books, categories, etc.)
- **Record ID** - The ID of the deleted record
- **Action** - What was done (DELETE, UPDATE, CREATE)
- **Admin** - Which admin performed the action
- **Details** - Quick summary of what was deleted
- **View Button** - Click to see full details
- **Restore Button** - One-click restore for deleted records (green button)

### 🔎 **Detailed View**

Click the **"View"** button on any record to see:

1. **Full Metadata:**
   - Table name
   - Record ID
   - Action type
   - Date & time
   - Admin who performed the action
   - IP address

2. **Complete Data Before Deletion:**
   - Raw JSON view of all data
   - Human-readable summary for books, categories, and coupons
   - All fields and values preserved

3. **Human-Readable Summaries:**

   **For Books:**
   - Title
   - Author
   - ISBN
   - Price
   - Stock quantity
   - Condition

   **For Categories:**
   - Name
   - Description

   **For Coupons:**
   - Code
   - Discount value
   - Valid from/until dates

4. **Restore Deleted Records:**
   - For DELETE actions, a **green "Restore Record"** button appears at the bottom
   - Click to restore the deleted record with one click
   - A confirmation dialog will ask for your approval
   - The system creates a new record with the original data
   - A new RESTORE audit log entry is created for tracking

---

## Common Use Cases

### 🚨 "Someone deleted a book by mistake!"

**Quick Restore (NEW!):**
1. Go to Audit Trail
2. Filter by "Books" table
3. Find the deleted book in the list
4. Click the green **"Restore"** button
5. Confirm the restoration
6. ✅ Done! The book is restored with all its original data

**Alternative - Manual Check:**
1. Click "View" to see the full book data
2. Review all the details before restoring

### 📅 "What was deleted last week?"

1. Go to Audit Trail
2. Select "Last 7 days" from time period filter
3. Click "Refresh"
4. See all deletions from the past week

### 👤 "Which admin deleted this category?"

1. Go to Audit Trail
2. Filter by "Categories" table
3. Find the category in the list
4. Check the "Admin" column to see who deleted it

### 🔍 "Show me all coupon deletions"

1. Go to Audit Trail
2. Select "Coupons" from table filter
3. See all deleted coupons with dates and admin info

---

## 🔄 One-Click Restore Feature

### How to Restore Deleted Records

**From the Table View:**
1. Locate the deleted record in the audit trail
2. Look for the green **"Restore"** button (only appears for DELETE actions)
3. Click the button
4. Confirm the restoration when prompted
5. ✅ The record is instantly restored!

**From the Detail View:**
1. Click **"View"** on any deleted record
2. Review the complete data at the bottom of the dialog
3. Click the green **"Restore Record"** button
4. Confirm when prompted
5. ✅ Record restored and dialog closes automatically

### What Happens When You Restore?

- 🆕 A **new record** is created with the original data
- 📝 A **new audit log** entry records the RESTORE action
- 🔢 The record gets a **new ID** (not the original ID)
- ✅ All original fields are preserved (name, description, price, etc.)
- 🎯 The restoration is tracked with your admin name and timestamp

### Safety Features

- ⚠️ **Confirmation required** - You must confirm before restoring
- 🔒 **Admin-only** - Only logged-in admins can restore
- 📋 **Audit logged** - Every restore is recorded in the audit trail
- ⏱️ **Loading state** - Button shows "Restoring..." during the process
- ✅ **Success notification** - Toast message confirms successful restore
- ❌ **Error handling** - Clear error messages if something goes wrong

### Important Notes

⚠️ **The restore creates a NEW record** - It does not reactivate the old ID. This is by design to maintain audit trail integrity.

⚠️ **Auto-generated fields are excluded** - Things like `createdAt`, `updatedAt`, and `usedCount` are reset to defaults for the new record.

⚠️ **Only DELETE actions can be restored** - The Restore button only appears for deletion entries.

---

## Tips & Tricks

✅ **Use the time filter** to reduce clutter - start with "Last 30 days" and adjust as needed

✅ **Click Refresh** after changing filters to update the results

✅ **View details immediately** - Don't wait! Click "View" to see the full data snapshot

✅ **Take screenshots** of important deletions for your records

✅ **Check the IP address** in detailed view to verify location

✅ **Note the Admin ID** to track which team member performed the action

---

## Data Preservation

⚠️ **Important: The audit trail stores COMPLETE data before deletion!**

When a record is deleted:
- ✅ All fields are saved in JSON format
- ✅ The exact state before deletion is preserved
- ✅ You can see every detail of what was deleted
- ✅ Data is kept indefinitely (unless manually archived)

---

## Navigation

- **Dashboard**: Shows quick access to Audit Trail
- **Sidebar**: Always available under "Audit Trail"
- **Direct Link**: `/admin/audit-trail`

---

## Need Help?

If you can't find what you're looking for:
1. Try adjusting the time period (go back further)
2. Check if you have the right table selected
3. Make sure you're looking at "All Actions" not just deletions
4. Click "Refresh" to reload the data

---

## Security Note

🔒 Only admins can access the audit trail. Every view and interaction is logged for security.

---

**You're all set!** The audit trail is just one click away whenever you need to track down what happened to deleted data. 🎉
