-- Improve Medication Reminders Table (Module 13)
-- This migration adds missing indexes, foreign keys, and optional tracking fields
-- Run this migration to align with DATABASE_STRUCTURE.md specifications

-- 1. Add missing indexes for better query performance
-- Note: MySQL doesn't support IF NOT EXISTS for indexes, so we check first
-- Run these one at a time and ignore errors if index already exists

-- Check and add idx_medication_reminders_active
SET @index_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'medication_reminders'
    AND INDEX_NAME = 'idx_medication_reminders_active'
);

SET @sql_index_active = IF(@index_exists = 0,
  'ALTER TABLE medication_reminders ADD INDEX idx_medication_reminders_active (active)',
  'SELECT "Index idx_medication_reminders_active already exists" AS message');

PREPARE stmt FROM @sql_index_active;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add idx_medication_reminders_reminder_time
SET @index_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'medication_reminders'
    AND INDEX_NAME = 'idx_medication_reminders_reminder_time'
);

SET @sql_index_time = IF(@index_exists = 0,
  'ALTER TABLE medication_reminders ADD INDEX idx_medication_reminders_reminder_time (reminder_time)',
  'SELECT "Index idx_medication_reminders_reminder_time already exists" AS message');

PREPARE stmt FROM @sql_index_time;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add idx_medication_reminders_patient_active
SET @index_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'medication_reminders'
    AND INDEX_NAME = 'idx_medication_reminders_patient_active'
);

SET @sql_index_patient_active = IF(@index_exists = 0,
  'ALTER TABLE medication_reminders ADD INDEX idx_medication_reminders_patient_active (patient_id, active)',
  'SELECT "Index idx_medication_reminders_patient_active already exists" AS message');

PREPARE stmt FROM @sql_index_patient_active;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Note: The following indexes may already exist, but we ensure they're there:
-- idx_medication_reminders_patient_id (patient_id) - should already exist
-- idx_medication_reminders_prescription_id (prescription_id) - should already exist

-- 2. Add foreign key constraints (if they don't exist)
-- Check if foreign keys exist before adding to avoid errors
SET @fk_patient_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'medication_reminders'
    AND CONSTRAINT_NAME = 'fk_medication_reminders_patient'
);

SET @fk_prescription_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'medication_reminders'
    AND CONSTRAINT_NAME = 'fk_medication_reminders_prescription'
);

-- Add foreign key for patient_id if it doesn't exist
SET @sql_patient = IF(@fk_patient_exists = 0,
  'ALTER TABLE medication_reminders 
   ADD CONSTRAINT fk_medication_reminders_patient 
   FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE',
  'SELECT "Foreign key fk_medication_reminders_patient already exists" AS message');

PREPARE stmt FROM @sql_patient;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key for prescription_id if it doesn't exist
SET @sql_prescription = IF(@fk_prescription_exists = 0,
  'ALTER TABLE medication_reminders 
   ADD CONSTRAINT fk_medication_reminders_prescription 
   FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id) ON DELETE SET NULL',
  'SELECT "Foreign key fk_medication_reminders_prescription already exists" AS message');

PREPARE stmt FROM @sql_prescription;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Add optional tracking fields for reminder processing
-- These fields help track when reminders were last triggered and acknowledged

-- Check and add last_triggered_at column
SET @column_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'medication_reminders'
    AND COLUMN_NAME = 'last_triggered_at'
);

SET @sql_column_triggered = IF(@column_exists = 0,
  'ALTER TABLE medication_reminders ADD COLUMN last_triggered_at DATETIME NULL COMMENT "Last time this reminder was triggered"',
  'SELECT "Column last_triggered_at already exists" AS message');

PREPARE stmt FROM @sql_column_triggered;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add last_acknowledged_at column
SET @column_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'medication_reminders'
    AND COLUMN_NAME = 'last_acknowledged_at'
);

SET @sql_column_acknowledged = IF(@column_exists = 0,
  'ALTER TABLE medication_reminders ADD COLUMN last_acknowledged_at DATETIME NULL COMMENT "Last time patient acknowledged this reminder"',
  'SELECT "Column last_acknowledged_at already exists" AS message');

PREPARE stmt FROM @sql_column_acknowledged;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add acknowledgment_count column
SET @column_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'medication_reminders'
    AND COLUMN_NAME = 'acknowledgment_count'
);

SET @sql_column_count = IF(@column_exists = 0,
  'ALTER TABLE medication_reminders ADD COLUMN acknowledgment_count INT DEFAULT 0 COMMENT "Total number of times reminder was acknowledged"',
  'SELECT "Column acknowledgment_count already exists" AS message');

PREPARE stmt FROM @sql_column_count;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Add index for last_triggered_at to optimize reminder processing queries
SET @index_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'medication_reminders'
    AND INDEX_NAME = 'idx_medication_reminders_last_triggered'
);

SET @sql_index_triggered = IF(@index_exists = 0,
  'ALTER TABLE medication_reminders ADD INDEX idx_medication_reminders_last_triggered (last_triggered_at)',
  'SELECT "Index idx_medication_reminders_last_triggered already exists" AS message');

PREPARE stmt FROM @sql_index_triggered;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verification queries (optional - run these to verify the migration)
-- SELECT 
--   INDEX_NAME, 
--   COLUMN_NAME, 
--   SEQ_IN_INDEX
-- FROM INFORMATION_SCHEMA.STATISTICS 
-- WHERE TABLE_SCHEMA = DATABASE()
--   AND TABLE_NAME = 'medication_reminders'
-- ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- SELECT 
--   CONSTRAINT_NAME, 
--   TABLE_NAME, 
--   COLUMN_NAME, 
--   REFERENCED_TABLE_NAME, 
--   REFERENCED_COLUMN_NAME
-- FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
-- WHERE TABLE_SCHEMA = DATABASE()
--   AND TABLE_NAME = 'medication_reminders'
--   AND CONSTRAINT_NAME LIKE 'fk_%';

