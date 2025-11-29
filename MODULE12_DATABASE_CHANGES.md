# Module 12: Database Changes Required

## Overview
This document outlines the database changes needed to support the new Module 12 features (admin moderation, post management, enhanced learning modules).

## Migration Script
A complete migration script has been created: **`module12_database_migration.sql`**

Run this script on your database to add all required columns and indexes.

---

## Required Database Changes

### 1. **forum_posts Table** - Add 9 New Columns

The current `forum_posts` table needs these additional columns:

| Column Name | Data Type | Default | Description |
|------------|-----------|---------|-------------|
| `patient_id` | CHAR(36) | NULL | Patient author (NULL if anonymous) |
| `category_id` | CHAR(36) | NULL | Category reference (FK to forum_categories) |
| `title` | VARCHAR(200) | NULL | Post title |
| `is_anonymous` | TINYINT(1) | 1 | Anonymous post flag |
| `reply_count` | INT(11) | 0 | Number of replies |
| `view_count` | INT(11) | 0 | View count |
| `is_pinned` | TINYINT(1) | 0 | Pinned post flag (admin) |
| `is_locked` | TINYINT(1) | 0 | Locked post flag (admin) |
| `status` | ENUM('pending', 'approved', 'rejected', 'flagged') | 'pending' | Post moderation status |

**Foreign Keys:**
- `patient_id` → `patients(patient_id)` ON DELETE SET NULL
- `category_id` → `forum_categories(category_id)` ON DELETE RESTRICT

**Indexes:**
- `idx_forum_posts_patient_id`
- `idx_forum_posts_category_id`
- `idx_forum_posts_status`
- `idx_forum_posts_is_pinned`
- `idx_forum_posts_is_locked`
- `idx_forum_posts_created_at`

---

### 2. **learning_modules Table** - Add 4 New Columns

The current `learning_modules` table needs these additional columns:

| Column Name | Data Type | Default | Description |
|------------|-----------|---------|-------------|
| `module_type` | ENUM('article', 'video', 'infographic', 'pdf') | 'article' | Content type |
| `tags` | JSON | NULL | Tags array (stored as JSON) |
| `is_published` | TINYINT(1) | 0 | Published flag |
| `view_count` | INT(11) | 0 | View count |

**Indexes:**
- `idx_learning_modules_module_type`
- `idx_learning_modules_is_published`
- `idx_learning_modules_category`

---

## How to Apply Changes

### Option 1: Run the Migration Script (Recommended)

```bash
# Using MySQL command line
mysql -u your_username -p your_database_name < module12_database_migration.sql

# Or using MySQL Workbench / phpMyAdmin
# Open the file and execute it
```

### Option 2: Manual SQL Execution

If you prefer to run commands manually, execute each `ALTER TABLE` statement from the migration script one by one.

---

## What the Migration Does

1. **Checks for existing columns** - Won't fail if columns already exist
2. **Adds missing columns** - Only adds what's not already there
3. **Creates indexes** - Improves query performance
4. **Adds foreign keys** - Ensures data integrity
5. **Sets default values** - Updates existing records with safe defaults

---

## Important Notes

### Backward Compatibility
- The migration is **safe** - it checks for existing columns before adding
- Existing data is preserved
- Default values are set for new columns on existing records

### Current Database Structure
Your current database has:
- `forum_posts` with `topic_id`, `author_id` (legacy structure)
- The migration adds new columns while keeping existing ones

### Data Migration
- Existing posts will get `status = 'approved'` by default
- Existing learning modules will get `module_type = 'article'` and `is_published = 0`

---

## Verification

After running the migration, verify the changes:

```sql
-- Check forum_posts columns
DESCRIBE forum_posts;

-- Check learning_modules columns
DESCRIBE learning_modules;

-- Verify indexes
SHOW INDEXES FROM forum_posts;
SHOW INDEXES FROM learning_modules;
```

You should see the new columns listed in the table structure.

---

## Rollback (If Needed)

If you need to rollback, you can remove the columns:

```sql
-- Remove forum_posts columns (if needed)
ALTER TABLE forum_posts DROP COLUMN IF EXISTS patient_id;
ALTER TABLE forum_posts DROP COLUMN IF EXISTS category_id;
ALTER TABLE forum_posts DROP COLUMN IF EXISTS title;
ALTER TABLE forum_posts DROP COLUMN IF EXISTS is_anonymous;
ALTER TABLE forum_posts DROP COLUMN IF EXISTS reply_count;
ALTER TABLE forum_posts DROP COLUMN IF EXISTS view_count;
ALTER TABLE forum_posts DROP COLUMN IF EXISTS is_pinned;
ALTER TABLE forum_posts DROP COLUMN IF EXISTS is_locked;
ALTER TABLE forum_posts DROP COLUMN IF EXISTS status;

-- Remove learning_modules columns (if needed)
ALTER TABLE learning_modules DROP COLUMN IF EXISTS module_type;
ALTER TABLE learning_modules DROP COLUMN IF EXISTS tags;
ALTER TABLE learning_modules DROP COLUMN IF EXISTS is_published;
ALTER TABLE learning_modules DROP COLUMN IF EXISTS view_count;
```

**⚠️ Warning:** Only rollback if you haven't started using the new features, as this will delete data in those columns.

---

## Summary

**Total Changes:**
- **9 new columns** in `forum_posts`
- **4 new columns** in `learning_modules`
- **9 new indexes** for performance
- **2 foreign key constraints** for data integrity

**Impact:**
- ✅ Safe migration (checks before adding)
- ✅ No data loss
- ✅ Backward compatible
- ✅ Improves performance with new indexes

---

## Next Steps

1. **Backup your database** before running the migration
2. **Run the migration script** (`module12_database_migration.sql`)
3. **Verify the changes** using the verification queries above
4. **Test the new features** in the application

The backend and frontend are already updated and ready to use these new database columns!

