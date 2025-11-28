-- =====================================================
-- MIGRATION: Update refill_requests table to match documentation
-- =====================================================
-- This script updates the refill_requests table structure
-- to align with DATABASE_STRUCTURE (1).md documentation
-- =====================================================

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Step 1: Add new columns to refill_requests table
ALTER TABLE `refill_requests`
  -- Optional foreign keys
  ADD COLUMN `prescription_id` char(36) DEFAULT NULL COMMENT 'Optional prescription reference' AFTER `patient_id`,
  ADD COLUMN `regimen_id` char(36) DEFAULT NULL COMMENT 'Optional ART regimen reference' AFTER `prescription_id`,
  
  -- Denormalized fields for easier queries
  ADD COLUMN `medication_name` varchar(200) DEFAULT NULL COMMENT 'Denormalized medication name' AFTER `medication_id`,
  ADD COLUMN `unit` varchar(20) DEFAULT 'tablets' COMMENT 'Unit of measure' AFTER `quantity`,
  
  -- Rename existing fields for clarity (keeping old names as aliases initially)
  -- pickup_date stays as is (matches preferred_pickup_date in doc)
  -- facility_id stays as is (matches pickup_facility_id in doc)
  -- notes stays as is (will be used for patient_notes)
  
  -- Add review fields
  ADD COLUMN `review_notes` text DEFAULT NULL COMMENT 'Case Manager review notes (separate from patient notes)' AFTER `processed_at`,
  ADD COLUMN `decline_reason` text DEFAULT NULL COMMENT 'Reason if declined' AFTER `review_notes`,
  
  -- Add approval/dispensing fields
  ADD COLUMN `approved_quantity` int(11) DEFAULT NULL COMMENT 'Quantity approved (may differ from requested)' AFTER `decline_reason`,
  ADD COLUMN `ready_for_pickup_date` date DEFAULT NULL COMMENT 'Actual pickup date when ready' AFTER `approved_quantity`,
  ADD COLUMN `dispensed_by` char(36) DEFAULT NULL COMMENT 'User who dispensed' AFTER `ready_for_pickup_date`,
  ADD COLUMN `dispensed_at` datetime DEFAULT NULL COMMENT 'Dispensing timestamp' AFTER `dispensed_by`,
  
  -- Add audit fields
  ADD COLUMN `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp' AFTER `submitted_at`,
  ADD COLUMN `created_by` char(36) DEFAULT NULL COMMENT 'Patient who created request' AFTER `updated_at`;

-- Step 2: Rename columns for clarity (using ALTER TABLE CHANGE)
-- Note: We'll keep both old and new names working by updating application code
-- For now, we'll add the new columns and migrate data

-- Step 3: Update existing data to populate new fields
UPDATE `refill_requests` rr
JOIN `medications` m ON rr.medication_id = m.medication_id
SET 
  rr.medication_name = m.medication_name,
  rr.unit = CASE 
    WHEN m.form = 'tablet' THEN 'tablets'
    WHEN m.form = 'capsule' THEN 'capsules'
    WHEN m.form = 'syrup' THEN 'ml'
    WHEN m.form = 'injection' THEN 'vials'
    ELSE 'units'
  END,
  rr.updated_at = rr.submitted_at,
  rr.created_by = rr.patient_id  -- Assume patient created their own request
WHERE rr.medication_name IS NULL;

-- Step 4: Add foreign key constraints for new optional fields
ALTER TABLE `refill_requests`
  ADD CONSTRAINT `fk_refill_requests_prescription` 
    FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`prescription_id`) 
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_refill_requests_regimen` 
    FOREIGN KEY (`regimen_id`) REFERENCES `patient_art_regimens` (`regimen_id`) 
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_refill_requests_dispensed_by` 
    FOREIGN KEY (`dispensed_by`) REFERENCES `users` (`user_id`) 
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_refill_requests_created_by` 
    FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 5: Add indexes for performance
CREATE INDEX `idx_refill_requests_prescription_id` ON `refill_requests` (`prescription_id`);
CREATE INDEX `idx_refill_requests_regimen_id` ON `refill_requests` (`regimen_id`);
CREATE INDEX `idx_refill_requests_created_by` ON `refill_requests` (`created_by`);
CREATE INDEX `idx_refill_requests_dispensed_by` ON `refill_requests` (`dispensed_by`);
CREATE INDEX `idx_refill_requests_ready_for_pickup_date` ON `refill_requests` (`ready_for_pickup_date`);

-- Step 6: Add check constraints (MySQL/MariaDB compatible)
-- Note: MySQL doesn't support CHECK constraints in older versions, so we'll use triggers

-- Trigger to ensure preferred_pickup_date is future date
DELIMITER $$
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
-- VERIFICATION QUERIES
-- =====================================================

-- Check table structure
-- DESCRIBE refill_requests;

-- Check existing data
-- SELECT COUNT(*) as total_requests FROM refill_requests;
-- SELECT status, COUNT(*) as count FROM refill_requests GROUP BY status;

-- =====================================================
-- END OF MIGRATION
-- =====================================================

