# Quick Fix: Unknown column 'prescription_id' Error

## Problem
You're getting the error: `#1054 - Unknown column 'prescription_id' in 'field list'`

This means the migration script hasn't been run yet, so the new columns don't exist in the database.

## Solution

### Option 1: Run the Safe Migration Script (Recommended)

1. **Run the migration first**:
   ```sql
   SOURCE migration_refill_requests_safe.sql;
   ```

2. **Then run the dummy data script**:
   ```sql
   SOURCE module4_dummy_data.sql;
   ```

### Option 2: Quick Manual Fix (If migration fails)

If you need to add columns manually, run these commands one by one:

```sql
ALTER TABLE `refill_requests`
  ADD COLUMN `prescription_id` char(36) DEFAULT NULL AFTER `patient_id`,
  ADD COLUMN `regimen_id` char(36) DEFAULT NULL AFTER `prescription_id`,
  ADD COLUMN `medication_name` varchar(200) DEFAULT NULL AFTER `medication_id`,
  ADD COLUMN `unit` varchar(20) DEFAULT 'tablets' AFTER `quantity`,
  ADD COLUMN `review_notes` text DEFAULT NULL AFTER `processed_at`,
  ADD COLUMN `decline_reason` text DEFAULT NULL AFTER `review_notes`,
  ADD COLUMN `approved_quantity` int(11) DEFAULT NULL AFTER `decline_reason`,
  ADD COLUMN `ready_for_pickup_date` date DEFAULT NULL AFTER `approved_quantity`,
  ADD COLUMN `dispensed_by` char(36) DEFAULT NULL AFTER `ready_for_pickup_date`,
  ADD COLUMN `dispensed_at` datetime DEFAULT NULL AFTER `dispensed_by`,
  ADD COLUMN `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `submitted_at`,
  ADD COLUMN `created_by` char(36) DEFAULT NULL AFTER `updated_at`;
```

### Option 3: Use Updated Dummy Data Script

The `module4_dummy_data.sql` has been updated to work in two steps:
1. First inserts data with only existing columns
2. Then updates with new columns (if migration was run)

This way, the script won't fail even if migration hasn't been run yet.

## Verification

After running the migration, verify the columns exist:

```sql
DESCRIBE refill_requests;
```

You should see all the new columns listed.

## Important Notes

- **Always run the migration BEFORE inserting data** that uses new columns
- The safe migration script checks if columns exist before adding them
- The dummy data script now works in two phases to avoid errors

