# Fix: Duplicate Entry Error

## Problem
Error: `#1062 - Duplicate entry 'med-0001-0000-0000-000000000001' for key 'PRIMARY'`

This happens when the dummy data script tries to insert records that already exist in the database.

## Solution Applied

I've updated `module4_dummy_data.sql` to delete existing records before inserting new ones. The script now:

1. **Deletes specific records** before inserting (instead of deleting all records)
2. **Preserves other data** that might exist in the database
3. **Handles all tables** that might have duplicates:
   - `medications`
   - `medication_inventory`
   - `prescriptions`
   - `prescription_items`
   - `dispense_events`
   - `medication_reminders`
   - `medication_adherence`
   - `refill_requests`

## How to Use

Simply run the updated script:

```sql
SOURCE module4_dummy_data.sql;
```

The script will:
1. Delete only the specific dummy data records (if they exist)
2. Insert fresh dummy data
3. Update refill requests with new fields (if migration was run)

## Alternative: Use INSERT IGNORE

If you prefer to keep existing data and only insert new records, you can modify the INSERT statements to use `INSERT IGNORE`:

```sql
INSERT IGNORE INTO `medications` ...
```

However, the DELETE approach is cleaner and ensures you always have the exact dummy data set.

## Verification

After running the script, verify no duplicates:

```sql
-- Check for duplicate medication IDs
SELECT medication_id, COUNT(*) as count 
FROM medications 
WHERE medication_id LIKE 'med-000%'
GROUP BY medication_id 
HAVING count > 1;

-- Should return 0 rows
```

---

**Status**: ✅ Fixed
**Last Updated**: 2025-11-28

