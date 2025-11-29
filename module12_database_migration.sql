-- =====================================================
-- Module 12: Community Forum & Education
-- Database Migration Script (MySQL Compatible)
-- =====================================================
-- This script adds missing columns to support the new features:
-- - Admin moderation (approve/reject posts and replies)
-- - Post management (pin, lock, edit, delete)
-- - Enhanced learning modules (module_type, tags, is_published, view_count)
-- =====================================================
-- IMPORTANT: Run this script on your database to add the required columns
-- =====================================================

-- =====================================================
-- 1. FORUM_POSTS TABLE ENHANCEMENTS
-- =====================================================

-- Add patient_id column (if not exists)
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'forum_posts' 
    AND COLUMN_NAME = 'patient_id'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE forum_posts ADD COLUMN patient_id CHAR(36) DEFAULT NULL AFTER post_id',
    'SELECT "Column patient_id already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add category_id column (if not exists)
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'forum_posts' 
    AND COLUMN_NAME = 'category_id'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE forum_posts ADD COLUMN category_id CHAR(36) DEFAULT NULL AFTER patient_id',
    'SELECT "Column category_id already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add title column (if not exists)
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'forum_posts' 
    AND COLUMN_NAME = 'title'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE forum_posts ADD COLUMN title VARCHAR(200) DEFAULT NULL AFTER category_id',
    'SELECT "Column title already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add is_anonymous column (if not exists)
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'forum_posts' 
    AND COLUMN_NAME = 'is_anonymous'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE forum_posts ADD COLUMN is_anonymous TINYINT(1) DEFAULT 1 AFTER content',
    'SELECT "Column is_anonymous already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add reply_count column (if not exists)
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'forum_posts' 
    AND COLUMN_NAME = 'reply_count'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE forum_posts ADD COLUMN reply_count INT(11) DEFAULT 0 AFTER is_anonymous',
    'SELECT "Column reply_count already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add view_count column (if not exists)
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'forum_posts' 
    AND COLUMN_NAME = 'view_count'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE forum_posts ADD COLUMN view_count INT(11) DEFAULT 0 AFTER reply_count',
    'SELECT "Column view_count already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add is_pinned column (if not exists)
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'forum_posts' 
    AND COLUMN_NAME = 'is_pinned'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE forum_posts ADD COLUMN is_pinned TINYINT(1) DEFAULT 0 AFTER view_count',
    'SELECT "Column is_pinned already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add is_locked column (if not exists)
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'forum_posts' 
    AND COLUMN_NAME = 'is_locked'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE forum_posts ADD COLUMN is_locked TINYINT(1) DEFAULT 0 AFTER is_pinned',
    'SELECT "Column is_locked already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add status column (if not exists)
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'forum_posts' 
    AND COLUMN_NAME = 'status'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE forum_posts ADD COLUMN status ENUM(\'pending\', \'approved\', \'rejected\', \'flagged\') DEFAULT \'pending\' AFTER is_locked',
    'SELECT "Column status already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraints (only if they don't exist and tables exist)
-- Check if patients table exists
SET @patients_exists = (
    SELECT COUNT(*) 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'patients'
);

-- Add foreign key for patient_id (if patients table exists)
SET @fk_exists = (
    SELECT COUNT(*) 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'forum_posts' 
    AND COLUMN_NAME = 'patient_id'
    AND REFERENCED_TABLE_NAME IS NOT NULL
);

SET @sql = IF(@patients_exists > 0 AND @fk_exists = 0,
    'ALTER TABLE forum_posts ADD CONSTRAINT fk_forum_posts_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE SET NULL',
    'SELECT "Foreign key for patient_id already exists or patients table not found" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if forum_categories table exists
SET @categories_exists = (
    SELECT COUNT(*) 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'forum_categories'
);

-- Add foreign key for category_id (if forum_categories table exists)
SET @fk_exists = (
    SELECT COUNT(*) 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'forum_posts' 
    AND COLUMN_NAME = 'category_id'
    AND REFERENCED_TABLE_NAME IS NOT NULL
);

SET @sql = IF(@categories_exists > 0 AND @fk_exists = 0,
    'ALTER TABLE forum_posts ADD CONSTRAINT fk_forum_posts_category FOREIGN KEY (category_id) REFERENCES forum_categories(category_id) ON DELETE RESTRICT',
    'SELECT "Foreign key for category_id already exists or forum_categories table not found" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes for performance (only if they don't exist)
SET @idx_exists = (
    SELECT COUNT(*) 
    FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'forum_posts' 
    AND INDEX_NAME = 'idx_forum_posts_patient_id'
);
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_forum_posts_patient_id ON forum_posts(patient_id)', 'SELECT "Index idx_forum_posts_patient_id already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(*) 
    FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'forum_posts' 
    AND INDEX_NAME = 'idx_forum_posts_category_id'
);
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_forum_posts_category_id ON forum_posts(category_id)', 'SELECT "Index idx_forum_posts_category_id already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(*) 
    FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'forum_posts' 
    AND INDEX_NAME = 'idx_forum_posts_status'
);
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_forum_posts_status ON forum_posts(status)', 'SELECT "Index idx_forum_posts_status already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(*) 
    FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'forum_posts' 
    AND INDEX_NAME = 'idx_forum_posts_is_pinned'
);
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_forum_posts_is_pinned ON forum_posts(is_pinned)', 'SELECT "Index idx_forum_posts_is_pinned already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(*) 
    FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'forum_posts' 
    AND INDEX_NAME = 'idx_forum_posts_is_locked'
);
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_forum_posts_is_locked ON forum_posts(is_locked)', 'SELECT "Index idx_forum_posts_is_locked already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(*) 
    FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'forum_posts' 
    AND INDEX_NAME = 'idx_forum_posts_created_at'
);
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_forum_posts_created_at ON forum_posts(created_at)', 'SELECT "Index idx_forum_posts_created_at already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 2. LEARNING_MODULES TABLE ENHANCEMENTS
-- =====================================================

-- Add module_type column (if not exists)
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'learning_modules' 
    AND COLUMN_NAME = 'module_type'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE learning_modules ADD COLUMN module_type ENUM(\'article\', \'video\', \'infographic\', \'pdf\') DEFAULT \'article\' AFTER category',
    'SELECT "Column module_type already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add tags column (if not exists) - Using JSON for MySQL compatibility
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'learning_modules' 
    AND COLUMN_NAME = 'tags'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE learning_modules ADD COLUMN tags JSON DEFAULT NULL AFTER read_time',
    'SELECT "Column tags already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add is_published column (if not exists)
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'learning_modules' 
    AND COLUMN_NAME = 'is_published'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE learning_modules ADD COLUMN is_published TINYINT(1) DEFAULT 0 AFTER tags',
    'SELECT "Column is_published already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add view_count column (if not exists)
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'learning_modules' 
    AND COLUMN_NAME = 'view_count'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE learning_modules ADD COLUMN view_count INT(11) DEFAULT 0 AFTER is_published',
    'SELECT "Column view_count already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes for performance (only if they don't exist)
SET @idx_exists = (
    SELECT COUNT(*) 
    FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'learning_modules' 
    AND INDEX_NAME = 'idx_learning_modules_module_type'
);
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_learning_modules_module_type ON learning_modules(module_type)', 'SELECT "Index idx_learning_modules_module_type already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(*) 
    FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'learning_modules' 
    AND INDEX_NAME = 'idx_learning_modules_is_published'
);
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_learning_modules_is_published ON learning_modules(is_published)', 'SELECT "Index idx_learning_modules_is_published already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(*) 
    FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'learning_modules' 
    AND INDEX_NAME = 'idx_learning_modules_category'
);
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_learning_modules_category ON learning_modules(category)', 'SELECT "Index idx_learning_modules_category already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 3. DATA MIGRATION (Set defaults for existing data)
-- =====================================================

-- Update existing forum_posts with default values
UPDATE forum_posts 
SET status = 'approved' 
WHERE status IS NULL OR status = '';

UPDATE forum_posts 
SET reply_count = COALESCE(reply_count, 0)
WHERE reply_count IS NULL;

UPDATE forum_posts 
SET view_count = COALESCE(view_count, 0)
WHERE view_count IS NULL;

UPDATE forum_posts 
SET is_pinned = COALESCE(is_pinned, 0)
WHERE is_pinned IS NULL;

UPDATE forum_posts 
SET is_locked = COALESCE(is_locked, 0)
WHERE is_locked IS NULL;

UPDATE forum_posts 
SET is_anonymous = COALESCE(is_anonymous, 1)
WHERE is_anonymous IS NULL;

-- Update existing learning_modules with default values
UPDATE learning_modules 
SET module_type = 'article' 
WHERE module_type IS NULL;

UPDATE learning_modules 
SET is_published = COALESCE(is_published, 0)
WHERE is_published IS NULL;

UPDATE learning_modules 
SET view_count = COALESCE(view_count, 0)
WHERE view_count IS NULL;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Summary of changes:
-- 1. Added columns to forum_posts: patient_id, category_id, title, is_anonymous, 
--    reply_count, view_count, is_pinned, is_locked, status
-- 2. Added columns to learning_modules: module_type, tags, is_published, view_count
-- 3. Added indexes for performance
-- 4. Added foreign key constraints (if tables exist)
-- 5. Set default values for existing data
-- =====================================================

SELECT 'Module 12 database migration completed successfully!' AS status;
