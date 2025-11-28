# Module 4: Deployment Steps

## ⚠️ IMPORTANT: Run Migration First!

The error `#1054 - Unknown column 'prescription_id'` occurs because the migration hasn't been run yet.

## Step-by-Step Deployment

### Step 1: Backup Your Database
```sql
-- Create a backup before making changes
mysqldump -u root -p myhub > backup_before_module4_migration.sql
```

### Step 2: Run the Safe Migration Script
```sql
-- This will add all new columns safely (checks if they exist first)
SOURCE migration_refill_requests_safe.sql;
```

**Expected Output**: 
- Columns added successfully
- Foreign keys created
- Triggers created
- No errors

### Step 3: Verify Migration
```sql
-- Check that all columns exist
DESCRIBE refill_requests;

-- You should see these new columns:
-- prescription_id, regimen_id, medication_name, unit, review_notes,
-- decline_reason, approved_quantity, ready_for_pickup_date, dispensed_by,
-- dispensed_at, updated_at, created_by
```

### Step 4: Run Dummy Data Script
```sql
-- This will drop existing Module 4 data and insert new dummy data
SOURCE module4_dummy_data.sql;
```

**Note**: The dummy data script now works in two phases:
1. Inserts data with existing columns (won't fail if migration not run)
2. Updates with new columns (only if migration was run)

### Step 5: Restart Backend
```bash
cd backend
# Stop current server (Ctrl+C)
# Then restart
npm start
# or
node server.js
```

### Step 6: Test the Application

1. **Test Patient Refill Request**:
   - Login as patient
   - Go to Medications
   - Click "Request Refill"
   - Fill in all fields (especially remaining_pill_count)
   - Submit

2. **Test Case Manager Review**:
   - Login as case_manager
   - Go to Refill Requests
   - View pending requests
   - Approve/Decline with all new fields

3. **Test Dispensing**:
   - Mark request as ready
   - Mark as dispensed
   - Verify all fields are recorded

## Troubleshooting

### Error: Unknown column 'prescription_id'
**Solution**: Run `migration_refill_requests_safe.sql` first

### Error: Column already exists
**Solution**: The safe migration script handles this - it checks before adding

### Error: Foreign key constraint fails
**Solution**: Make sure referenced tables (prescriptions, users, etc.) have the data

### Backend errors after migration
**Solution**: Restart the backend server

## Rollback (if needed)

If you need to rollback:

```sql
-- Remove new columns (be careful - this will lose data in those columns)
ALTER TABLE `refill_requests`
  DROP COLUMN IF EXISTS `prescription_id`,
  DROP COLUMN IF EXISTS `regimen_id`,
  DROP COLUMN IF EXISTS `medication_name`,
  DROP COLUMN IF EXISTS `unit`,
  DROP COLUMN IF EXISTS `review_notes`,
  DROP COLUMN IF EXISTS `decline_reason`,
  DROP COLUMN IF EXISTS `approved_quantity`,
  DROP COLUMN IF EXISTS `ready_for_pickup_date`,
  DROP COLUMN IF EXISTS `dispensed_by`,
  DROP COLUMN IF EXISTS `dispensed_at`,
  DROP COLUMN IF EXISTS `updated_at`,
  DROP COLUMN IF EXISTS `created_by`;
```

## Verification Checklist

After deployment, verify:

- [ ] Migration script ran without errors
- [ ] All new columns exist in refill_requests table
- [ ] Dummy data inserted successfully
- [ ] Backend server starts without errors
- [ ] Patient can create refill request
- [ ] Case Manager can see all fields
- [ ] Case Manager can approve/decline
- [ ] Dispensing workflow works
- [ ] All fields display correctly in frontend

---

**Status**: ✅ Ready to Deploy
**Last Updated**: 2025-11-28

