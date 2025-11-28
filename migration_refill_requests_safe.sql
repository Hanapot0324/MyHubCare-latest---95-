-- =====================================================
-- SAFE MIGRATION: Update refill_requests table
-- This script safely adds columns only if they don't exist
-- =====================================================

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Step 1: Add new columns (only if they don't exist)
-- Using a procedure to check and add columns safely

DELIMITER $$

DROP PROCEDURE IF EXISTS add_column_if_not_exists$$
CREATE PROCEDURE add_column_if_not_exists(
    IN table_name VARCHAR(64),
    IN column_name VARCHAR(64),
    IN column_definition TEXT
)
BEGIN
    DECLARE column_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO column_exists
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = table_name
      AND COLUMN_NAME = column_name;
    
    IF column_exists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE `', table_name, '` ADD COLUMN `', column_name, '` ', column_definition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;

-- Add prescription_id
CALL add_column_if_not_exists('refill_requests', 'prescription_id', 
    'char(36) DEFAULT NULL COMMENT ''Optional prescription reference'' AFTER `patient_id`');

-- Add regimen_id
CALL add_column_if_not_exists('refill_requests', 'regimen_id', 
    'char(36) DEFAULT NULL COMMENT ''Optional ART regimen reference'' AFTER `prescription_id`');

-- Add medication_name
CALL add_column_if_not_exists('refill_requests', 'medication_name', 
    'varchar(200) DEFAULT NULL COMMENT ''Denormalized medication name'' AFTER `medication_id`');

-- Add unit
CALL add_column_if_not_exists('refill_requests', 'unit', 
    'varchar(20) DEFAULT ''tablets'' COMMENT ''Unit of measure'' AFTER `quantity`');

-- Add review_notes
CALL add_column_if_not_exists('refill_requests', 'review_notes', 
    'text DEFAULT NULL COMMENT ''Case Manager review notes (separate from patient notes)'' AFTER `processed_at`');

-- Add decline_reason
CALL add_column_if_not_exists('refill_requests', 'decline_reason', 
    'text DEFAULT NULL COMMENT ''Reason if declined'' AFTER `review_notes`');

-- Add approved_quantity
CALL add_column_if_not_exists('refill_requests', 'approved_quantity', 
    'int(11) DEFAULT NULL COMMENT ''Quantity approved (may differ from requested)'' AFTER `decline_reason`');

-- Add ready_for_pickup_date
CALL add_column_if_not_exists('refill_requests', 'ready_for_pickup_date', 
    'date DEFAULT NULL COMMENT ''Actual pickup date when ready'' AFTER `approved_quantity`');

-- Add dispensed_by
CALL add_column_if_not_exists('refill_requests', 'dispensed_by', 
    'char(36) DEFAULT NULL COMMENT ''User who dispensed'' AFTER `ready_for_pickup_date`');

-- Add dispensed_at
CALL add_column_if_not_exists('refill_requests', 'dispensed_at', 
    'datetime DEFAULT NULL COMMENT ''Dispensing timestamp'' AFTER `dispensed_by`');

-- Add updated_at
CALL add_column_if_not_exists('refill_requests', 'updated_at', 
    'datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT ''Last update timestamp'' AFTER `submitted_at`');

-- Add created_by
CALL add_column_if_not_exists('refill_requests', 'created_by', 
    'char(36) DEFAULT NULL COMMENT ''Patient who created request'' AFTER `updated_at`');

-- Clean up procedure
DROP PROCEDURE IF EXISTS add_column_if_not_exists;

-- Step 2: Update existing data to populate new fields
UPDATE `refill_requests` rr
JOIN `medications` m ON rr.medication_id = m.medication_id
SET 
  rr.medication_name = COALESCE(rr.medication_name, m.medication_name),
  rr.unit = COALESCE(rr.unit, CASE 
    WHEN m.form = 'tablet' THEN 'tablets'
    WHEN m.form = 'capsule' THEN 'capsules'
    WHEN m.form = 'syrup' THEN 'ml'
    WHEN m.form = 'injection' THEN 'vials'
    ELSE 'units'
  END),
  rr.updated_at = COALESCE(rr.updated_at, rr.submitted_at),
  rr.created_by = COALESCE(rr.created_by, rr.patient_id)
WHERE rr.medication_name IS NULL OR rr.unit IS NULL OR rr.updated_at IS NULL OR rr.created_by IS NULL;

-- Step 3: Add foreign key constraints (only if they don't exist)
DELIMITER $$

DROP PROCEDURE IF EXISTS add_fk_if_not_exists$$
CREATE PROCEDURE add_fk_if_not_exists(
    IN table_name VARCHAR(64),
    IN constraint_name VARCHAR(64),
    IN fk_columns TEXT,
    IN ref_table VARCHAR(64),
    IN ref_columns TEXT
)
BEGIN
    DECLARE fk_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO fk_exists
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = table_name
      AND CONSTRAINT_NAME = constraint_name;
    
    IF fk_exists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE `', table_name, '` ADD CONSTRAINT `', constraint_name,
                         '` FOREIGN KEY (', fk_columns, ') REFERENCES `', ref_table, '` (', ref_columns, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;

-- Add foreign keys
CALL add_fk_if_not_exists('refill_requests', 'fk_refill_requests_prescription', 
    'prescription_id', 'prescriptions', 'prescription_id');

CALL add_fk_if_not_exists('refill_requests', 'fk_refill_requests_regimen', 
    'regimen_id', 'patient_art_regimens', 'regimen_id');

CALL add_fk_if_not_exists('refill_requests', 'fk_refill_requests_dispensed_by', 
    'dispensed_by', 'users', 'user_id');

CALL add_fk_if_not_exists('refill_requests', 'fk_refill_requests_created_by', 
    'created_by', 'users', 'user_id');

-- Clean up procedure
DROP PROCEDURE IF EXISTS add_fk_if_not_exists;

-- Step 4: Add indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS `idx_refill_requests_prescription_id` ON `refill_requests` (`prescription_id`);
CREATE INDEX IF NOT EXISTS `idx_refill_requests_regimen_id` ON `refill_requests` (`regimen_id`);
CREATE INDEX IF NOT EXISTS `idx_refill_requests_created_by` ON `refill_requests` (`created_by`);
CREATE INDEX IF NOT EXISTS `idx_refill_requests_dispensed_by` ON `refill_requests` (`dispensed_by`);
CREATE INDEX IF NOT EXISTS `idx_refill_requests_ready_for_pickup_date` ON `refill_requests` (`ready_for_pickup_date`);

-- Note: MySQL doesn't support "CREATE INDEX IF NOT EXISTS" in older versions
-- If you get an error, use this instead:
-- CREATE INDEX `idx_refill_requests_prescription_id` ON `refill_requests` (`prescription_id`);
-- (Remove IF NOT EXISTS and run manually if index already exists)

-- Step 5: Add validation triggers (drop and recreate to avoid conflicts)
DROP TRIGGER IF EXISTS `before_insert_refill_requests_date_check`;
DROP TRIGGER IF EXISTS `before_update_refill_requests_date_check`;
DROP TRIGGER IF EXISTS `before_insert_refill_requests_time_check`;
DROP TRIGGER IF EXISTS `before_update_refill_requests_time_check`;
DROP TRIGGER IF EXISTS `before_insert_refill_requests_pill_count_check`;
DROP TRIGGER IF EXISTS `before_update_refill_requests_pill_count_check`;
DROP TRIGGER IF EXISTS `before_insert_refill_requests_kulang_check`;
DROP TRIGGER IF EXISTS `before_update_refill_requests_kulang_check`;

DELIMITER $$

-- Trigger to ensure preferred_pickup_date is future date
CREATE TRIGGER `before_insert_refill_requests_date_check` 
BEFORE INSERT ON `refill_requests`
FOR EACH ROW
BEGIN
  IF DATE(NEW.pickup_date) <= CURDATE() THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Pickup date must be at least one day in advance';
  END IF;
END$$

CREATE TRIGGER `before_update_refill_requests_date_check` 
BEFORE UPDATE ON `refill_requests`
FOR EACH ROW
BEGIN
  IF DATE(NEW.pickup_date) <= CURDATE() THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Pickup date must be at least one day in advance';
  END IF;
END$$

-- Trigger to ensure preferred_pickup_time is hourly (minute = 0)
CREATE TRIGGER `before_insert_refill_requests_time_check` 
BEFORE INSERT ON `refill_requests`
FOR EACH ROW
BEGIN
  IF NEW.preferred_pickup_time IS NOT NULL AND MINUTE(NEW.preferred_pickup_time) != 0 THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Pickup time must be on the hour (e.g., 09:00:00, 10:00:00)';
  END IF;
END$$

CREATE TRIGGER `before_update_refill_requests_time_check` 
BEFORE UPDATE ON `refill_requests`
FOR EACH ROW
BEGIN
  IF NEW.preferred_pickup_time IS NOT NULL AND MINUTE(NEW.preferred_pickup_time) != 0 THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Pickup time must be on the hour (e.g., 09:00:00, 10:00:00)';
  END IF;
END$$

-- Trigger to ensure remaining_pill_count is provided
CREATE TRIGGER `before_insert_refill_requests_pill_count_check` 
BEFORE INSERT ON `refill_requests`
FOR EACH ROW
BEGIN
  IF NEW.remaining_pill_count IS NULL THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Remaining pill count is required';
  END IF;
END$$

CREATE TRIGGER `before_update_refill_requests_pill_count_check` 
BEFORE UPDATE ON `refill_requests`
FOR EACH ROW
BEGIN
  IF NEW.remaining_pill_count IS NULL THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Remaining pill count is required';
  END IF;
END$$

-- Trigger to ensure kulang_explanation if pill_status = 'kulang'
CREATE TRIGGER `before_insert_refill_requests_kulang_check` 
BEFORE INSERT ON `refill_requests`
FOR EACH ROW
BEGIN
  IF NEW.pill_status = 'kulang' AND (NEW.kulang_explanation IS NULL OR NEW.kulang_explanation = '') THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Explanation is required when pill status is kulang';
  END IF;
END$$

CREATE TRIGGER `before_update_refill_requests_kulang_check` 
BEFORE UPDATE ON `refill_requests`
FOR EACH ROW
BEGIN
  IF NEW.pill_status = 'kulang' AND (NEW.kulang_explanation IS NULL OR NEW.kulang_explanation = '') THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Explanation is required when pill status is kulang';
  END IF;
END$$

DELIMITER ;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check table structure
-- DESCRIBE refill_requests;

-- Check existing data
-- SELECT COUNT(*) as total_requests FROM refill_requests;
-- SELECT status, COUNT(*) as count FROM refill_requests GROUP BY status;

-- =====================================================
-- END OF MIGRATION
-- =====================================================

