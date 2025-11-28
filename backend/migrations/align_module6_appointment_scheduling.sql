-- =====================================================
-- MODULE 6: APPOINTMENT SCHEDULING ALIGNMENT MIGRATION
-- =====================================================
-- This migration aligns the database with Module 6 specifications
-- Date: 2025-11-28
-- MySQL Compatible Version
-- =====================================================

START TRANSACTION;

-- =====================================================
-- 1. UPDATE appointments TABLE
-- =====================================================

-- Ensure booked_by is NOT NULL (per spec)
-- Note: Only modify if column exists and is nullable
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'appointments' 
    AND COLUMN_NAME = 'booked_by'
);

SET @sql = IF(@col_exists > 0,
  'ALTER TABLE `appointments` MODIFY COLUMN `booked_by` CHAR(36) NOT NULL',
  'SELECT "Column booked_by does not exist, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure booked_at has default
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'appointments' 
    AND COLUMN_NAME = 'booked_at'
);

SET @sql = IF(@col_exists > 0,
  'ALTER TABLE `appointments` MODIFY COLUMN `booked_at` DATETIME DEFAULT CURRENT_TIMESTAMP',
  'SELECT "Column booked_at does not exist, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index for sorting (newest first) - MySQL 5.7.4+ supports IF NOT EXISTS
SET @index_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'appointments' 
    AND INDEX_NAME = 'idx_appointments_scheduled_start_desc'
);

SET @sql = IF(@index_exists = 0,
  'CREATE INDEX `idx_appointments_scheduled_start_desc` ON `appointments` (`scheduled_start` DESC)',
  'SELECT "Index already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 2. UPDATE availability_slots TABLE
-- =====================================================

-- Add assignment_id if missing
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'availability_slots' 
    AND COLUMN_NAME = 'assignment_id'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `availability_slots` ADD COLUMN `assignment_id` CHAR(36) DEFAULT NULL',
  'SELECT "Column assignment_id already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add lock_status if missing
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'availability_slots' 
    AND COLUMN_NAME = 'lock_status'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `availability_slots` ADD COLUMN `lock_status` TINYINT(1) DEFAULT 0',
  'SELECT "Column lock_status already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key for assignment_id (only if it doesn't exist)
SET @fk_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'availability_slots' 
    AND CONSTRAINT_NAME = 'fk_availability_slots_assignment'
);

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE `availability_slots` ADD CONSTRAINT `fk_availability_slots_assignment` FOREIGN KEY (`assignment_id`) REFERENCES `doctor_assignments`(`assignment_id`) ON DELETE SET NULL',
  'SELECT "Foreign key already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes
SET @index_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'availability_slots' 
    AND INDEX_NAME = 'idx_availability_slots_assignment_id'
);

SET @sql = IF(@index_exists = 0,
  'CREATE INDEX `idx_availability_slots_assignment_id` ON `availability_slots` (`assignment_id`)',
  'SELECT "Index already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'availability_slots' 
    AND INDEX_NAME = 'idx_availability_slots_lock_status'
);

SET @sql = IF(@index_exists = 0,
  'CREATE INDEX `idx_availability_slots_lock_status` ON `availability_slots` (`lock_status`)',
  'SELECT "Index already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 3. UPDATE appointment_requests TABLE
-- =====================================================

-- Add new columns if they don't exist
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'appointment_requests' 
    AND COLUMN_NAME = 'facility_id'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `appointment_requests` ADD COLUMN `facility_id` CHAR(36) NOT NULL AFTER `patient_id`',
  'SELECT "Column facility_id already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'appointment_requests' 
    AND COLUMN_NAME = 'provider_id'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `appointment_requests` ADD COLUMN `provider_id` CHAR(36) DEFAULT NULL AFTER `facility_id`',
  'SELECT "Column provider_id already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'appointment_requests' 
    AND COLUMN_NAME = 'requested_date'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `appointment_requests` ADD COLUMN `requested_date` DATE NOT NULL AFTER `provider_id`',
  'SELECT "Column requested_date already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'appointment_requests' 
    AND COLUMN_NAME = 'requested_time'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `appointment_requests` ADD COLUMN `requested_time` TIME NOT NULL AFTER `requested_date`',
  'SELECT "Column requested_time already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'appointment_requests' 
    AND COLUMN_NAME = 'appointment_type'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `appointment_requests` ADD COLUMN `appointment_type` ENUM(\'follow_up\',\'art_pickup\',\'lab_test\',\'counseling\',\'general\',\'initial\') NOT NULL AFTER `requested_time`',
  'SELECT "Column appointment_type already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'appointment_requests' 
    AND COLUMN_NAME = 'patient_notes'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `appointment_requests` ADD COLUMN `patient_notes` TEXT DEFAULT NULL AFTER `appointment_type`',
  'SELECT "Column patient_notes already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'appointment_requests' 
    AND COLUMN_NAME = 'reviewed_by'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `appointment_requests` ADD COLUMN `reviewed_by` CHAR(36) DEFAULT NULL AFTER `status`',
  'SELECT "Column reviewed_by already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'appointment_requests' 
    AND COLUMN_NAME = 'review_notes'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `appointment_requests` ADD COLUMN `review_notes` TEXT DEFAULT NULL AFTER `reviewed_at`',
  'SELECT "Column review_notes already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'appointment_requests' 
    AND COLUMN_NAME = 'created_by'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `appointment_requests` ADD COLUMN `created_by` CHAR(36) NOT NULL AFTER `updated_at`',
  'SELECT "Column created_by already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign keys (only if they don't exist)
SET @fk_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'appointment_requests' 
    AND CONSTRAINT_NAME = 'fk_appointment_requests_facility'
);

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE `appointment_requests` ADD CONSTRAINT `fk_appointment_requests_facility` FOREIGN KEY (`facility_id`) REFERENCES `facilities`(`facility_id`)',
  'SELECT "Foreign key already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'appointment_requests' 
    AND CONSTRAINT_NAME = 'fk_appointment_requests_provider'
);

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE `appointment_requests` ADD CONSTRAINT `fk_appointment_requests_provider` FOREIGN KEY (`provider_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL',
  'SELECT "Foreign key already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'appointment_requests' 
    AND CONSTRAINT_NAME = 'fk_appointment_requests_reviewed_by'
);

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE `appointment_requests` ADD CONSTRAINT `fk_appointment_requests_reviewed_by` FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL',
  'SELECT "Foreign key already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'appointment_requests' 
    AND CONSTRAINT_NAME = 'fk_appointment_requests_created_by'
);

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE `appointment_requests` ADD CONSTRAINT `fk_appointment_requests_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`)',
  'SELECT "Foreign key already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes
SET @index_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'appointment_requests' 
    AND INDEX_NAME = 'idx_appointment_requests_facility_id'
);

SET @sql = IF(@index_exists = 0,
  'CREATE INDEX `idx_appointment_requests_facility_id` ON `appointment_requests` (`facility_id`)',
  'SELECT "Index already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'appointment_requests' 
    AND INDEX_NAME = 'idx_appointment_requests_provider_id'
);

SET @sql = IF(@index_exists = 0,
  'CREATE INDEX `idx_appointment_requests_provider_id` ON `appointment_requests` (`provider_id`)',
  'SELECT "Index already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'appointment_requests' 
    AND INDEX_NAME = 'idx_appointment_requests_requested_date'
);

SET @sql = IF(@index_exists = 0,
  'CREATE INDEX `idx_appointment_requests_requested_date` ON `appointment_requests` (`requested_date`)',
  'SELECT "Index already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'appointment_requests' 
    AND INDEX_NAME = 'idx_appointment_requests_reviewed_by'
);

SET @sql = IF(@index_exists = 0,
  'CREATE INDEX `idx_appointment_requests_reviewed_by` ON `appointment_requests` (`reviewed_by`)',
  'SELECT "Index already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 4. VERIFY doctor_assignments TABLE
-- =====================================================
-- Note: This assumes the table structure is already correct from previous migrations
-- We'll just add indexes if they don't exist

SET @index_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'doctor_assignments' 
    AND INDEX_NAME = 'idx_doctor_assignments_doctor_id'
);

SET @sql = IF(@index_exists = 0,
  'CREATE INDEX `idx_doctor_assignments_doctor_id` ON `doctor_assignments` (`doctor_id`)',
  'SELECT "Index already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'doctor_assignments' 
    AND INDEX_NAME = 'idx_doctor_assignments_facility_id'
);

SET @sql = IF(@index_exists = 0,
  'CREATE INDEX `idx_doctor_assignments_facility_id` ON `doctor_assignments` (`facility_id`)',
  'SELECT "Index already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'doctor_assignments' 
    AND INDEX_NAME = 'idx_doctor_assignments_date'
);

SET @sql = IF(@index_exists = 0,
  'CREATE INDEX `idx_doctor_assignments_date` ON `doctor_assignments` (`assignment_date`)',
  'SELECT "Index already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'doctor_assignments' 
    AND INDEX_NAME = 'idx_doctor_assignments_is_locked'
);

SET @sql = IF(@index_exists = 0,
  'CREATE INDEX `idx_doctor_assignments_is_locked` ON `doctor_assignments` (`is_locked`)',
  'SELECT "Index already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 5. VERIFY doctor_conflicts TABLE
-- =====================================================
-- Note: This assumes the table structure is already correct from previous migrations
-- We'll just add indexes if they don't exist

SET @index_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'doctor_conflicts' 
    AND INDEX_NAME = 'idx_doctor_conflicts_doctor_id'
);

SET @sql = IF(@index_exists = 0,
  'CREATE INDEX `idx_doctor_conflicts_doctor_id` ON `doctor_conflicts` (`doctor_id`)',
  'SELECT "Index already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'doctor_conflicts' 
    AND INDEX_NAME = 'idx_doctor_conflicts_date'
);

SET @sql = IF(@index_exists = 0,
  'CREATE INDEX `idx_doctor_conflicts_date` ON `doctor_conflicts` (`conflict_date`)',
  'SELECT "Index already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'doctor_conflicts' 
    AND INDEX_NAME = 'idx_doctor_conflicts_type'
);

SET @sql = IF(@index_exists = 0,
  'CREATE INDEX `idx_doctor_conflicts_type` ON `doctor_conflicts` (`conflict_type`)',
  'SELECT "Index already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 6. UPDATE appointment_reminders TABLE (if needed)
-- =====================================================
-- Note: This assumes the table structure is already correct
-- We'll just add indexes if they don't exist

SET @index_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'appointment_reminders' 
    AND INDEX_NAME = 'idx_appointment_reminders_appointment_id'
);

SET @sql = IF(@index_exists = 0,
  'CREATE INDEX `idx_appointment_reminders_appointment_id` ON `appointment_reminders` (`appointment_id`)',
  'SELECT "Index already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'appointment_reminders' 
    AND INDEX_NAME = 'idx_appointment_reminders_status'
);

SET @sql = IF(@index_exists = 0,
  'CREATE INDEX `idx_appointment_reminders_status` ON `appointment_reminders` (`status`)',
  'SELECT "Index already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'appointment_reminders' 
    AND INDEX_NAME = 'idx_appointment_reminders_scheduled_at'
);

SET @sql = IF(@index_exists = 0,
  'CREATE INDEX `idx_appointment_reminders_scheduled_at` ON `appointment_reminders` (`reminder_scheduled_at`)',
  'SELECT "Index already exists, skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 7. UPDATE TRIGGERS FOR appointments
-- =====================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS `before_insert_appointments`;
DROP TRIGGER IF EXISTS `before_update_appointments`;

-- Create updated triggers with proper validation
DELIMITER $$

CREATE TRIGGER `before_insert_appointments` 
BEFORE INSERT ON `appointments` 
FOR EACH ROW 
BEGIN
  -- No same-day booking (date >= tomorrow)
  IF DATE(NEW.scheduled_start) <= CURDATE() THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Appointments must be scheduled at least one day in advance (no same-day booking)';
  END IF;
  
  -- Hourly intervals only (minutes must be 0)
  IF MINUTE(NEW.scheduled_start) != 0 THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Appointments must start on the hour (e.g., 10:00, 11:00)';
  END IF;
  
  -- Enforce 60-minute duration
  IF NEW.duration_minutes != 60 THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Appointment duration must be exactly 60 minutes';
  END IF;
  
  -- Ensure booked_by is set
  IF NEW.booked_by IS NULL THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'booked_by field is required';
  END IF;
END$$

CREATE TRIGGER `before_update_appointments` 
BEFORE UPDATE ON `appointments` 
FOR EACH ROW 
BEGIN
  -- No same-day booking (date >= tomorrow)
  IF DATE(NEW.scheduled_start) <= CURDATE() THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Appointments must be scheduled at least one day in advance (no same-day booking)';
  END IF;
  
  -- Hourly intervals only (minutes must be 0)
  IF MINUTE(NEW.scheduled_start) != 0 THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Appointments must start on the hour (e.g., 10:00, 11:00)';
  END IF;
  
  -- Enforce 60-minute duration
  IF NEW.duration_minutes != 60 THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Appointment duration must be exactly 60 minutes';
  END IF;
END$$

DELIMITER ;

-- =====================================================
-- 8. CREATE TRIGGERS FOR appointment_requests
-- =====================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS `before_insert_appointment_requests`;
DROP TRIGGER IF EXISTS `before_update_appointment_requests`;

DELIMITER $$

CREATE TRIGGER `before_insert_appointment_requests` 
BEFORE INSERT ON `appointment_requests` 
FOR EACH ROW 
BEGIN
  -- No same-day booking (date >= tomorrow)
  IF NEW.requested_date <= CURDATE() THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Appointment requests must be for future dates (no same-day booking)';
  END IF;
  
  -- Hourly intervals only (minutes must be 0)
  IF MINUTE(NEW.requested_time) != 0 THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Requested time must be on the hour (e.g., 09:00:00, 10:00:00)';
  END IF;
  
  -- Ensure created_by is set
  IF NEW.created_by IS NULL THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'created_by field is required';
  END IF;
END$$

CREATE TRIGGER `before_update_appointment_requests` 
BEFORE UPDATE ON `appointment_requests` 
FOR EACH ROW 
BEGIN
  -- No same-day booking (date >= tomorrow) - only if date is being changed
  IF NEW.requested_date != OLD.requested_date AND NEW.requested_date <= CURDATE() THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Appointment requests must be for future dates (no same-day booking)';
  END IF;
  
  -- Hourly intervals only (minutes must be 0) - only if time is being changed
  IF NEW.requested_time != OLD.requested_time AND MINUTE(NEW.requested_time) != 0 THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Requested time must be on the hour (e.g., 09:00:00, 10:00:00)';
  END IF;
END$$

DELIMITER ;

COMMIT;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next steps:
-- 1. Test the migration in a development environment
-- 2. Verify all constraints are working correctly
-- 3. Test appointment creation with tomorrow's date
-- 4. Test appointment creation with today's date (should fail)
-- 5. Test appointment creation with non-hourly time (should fail)
-- 6. Test appointment creation with non-60-minute duration (should fail)
-- =====================================================
