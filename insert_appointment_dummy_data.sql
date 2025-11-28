-- =====================================================
-- INSERT DUMMY DATA FOR APPOINTMENT SCHEDULING TABLES
-- =====================================================
-- This script drops related tables first, then inserts dummy data
-- Based on Module 6: Appointment Scheduling specification
-- =====================================================

START TRANSACTION;

-- =====================================================
-- STEP 1: DROP TABLES IN DEPENDENCY ORDER
-- =====================================================
-- Drop tables that depend on others first

-- Drop appointment_reminders (depends on appointments)
DROP TABLE IF EXISTS `appointment_reminders`;

-- Drop appointments (depends on patients, users, facilities, appointment_requests)
DROP TABLE IF EXISTS `appointments`;

-- Drop appointment_requests (depends on patients, users, facilities)
DROP TABLE IF EXISTS `appointment_requests`;

-- Drop availability_slots (depends on users, facilities, doctor_assignments, appointments)
DROP TABLE IF EXISTS `availability_slots`;

-- Drop doctor_conflicts (depends on users, facilities)
DROP TABLE IF EXISTS `doctor_conflicts`;

-- Drop doctor_assignments (depends on users, facilities)
DROP TABLE IF EXISTS `doctor_assignments`;

-- =====================================================
-- STEP 2: RECREATE TABLES (if they don't exist)
-- =====================================================

-- Recreate doctor_assignments table
CREATE TABLE IF NOT EXISTS `doctor_assignments` (
  `assignment_id` char(36) NOT NULL,
  `doctor_id` char(36) NOT NULL COMMENT 'Physician reference',
  `facility_id` char(36) NOT NULL,
  `assignment_date` date NOT NULL COMMENT 'Single date',
  `start_time` time NOT NULL COMMENT 'Start time',
  `end_time` time NOT NULL COMMENT 'End time',
  `max_patients` int(11) DEFAULT 8 COMMENT 'Maximum patients for this assignment',
  `notes` text DEFAULT NULL COMMENT 'Assignment notes',
  `is_locked` tinyint(1) DEFAULT 0,
  `locked_at` datetime DEFAULT NULL COMMENT 'When schedule was locked',
  `locked_by` char(36) DEFAULT NULL COMMENT 'Admin who locked the schedule',
  `created_at` datetime DEFAULT current_timestamp(),
  `created_by` char(36) NOT NULL COMMENT 'Admin who created assignment',
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`assignment_id`),
  UNIQUE KEY `unique_doctor_date` (`doctor_id`, `assignment_date`),
  KEY `idx_doctor_assignments_doctor_id` (`doctor_id`),
  KEY `idx_doctor_assignments_facility_id` (`facility_id`),
  KEY `idx_doctor_assignments_date` (`assignment_date`),
  KEY `idx_doctor_assignments_is_locked` (`is_locked`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Recreate doctor_conflicts table
CREATE TABLE IF NOT EXISTS `doctor_conflicts` (
  `conflict_id` char(36) NOT NULL,
  `doctor_id` char(36) NOT NULL COMMENT 'Physician reference',
  `facility_id` char(36) DEFAULT NULL COMMENT 'Facility (NULL if all facilities)',
  `conflict_date` date NOT NULL COMMENT 'Date of conflict',
  `conflict_type` enum('leave','meeting','training','emergency','other') NOT NULL COMMENT 'Type of conflict',
  `reason` text NOT NULL COMMENT 'Conflict reason/description',
  `start_time` time DEFAULT NULL COMMENT 'Start time (if partial day)',
  `end_time` time DEFAULT NULL COMMENT 'End time (if partial day)',
  `is_all_day` tinyint(1) DEFAULT 1 COMMENT 'Full day conflict flag',
  `created_at` datetime DEFAULT current_timestamp(),
  `created_by` char(36) NOT NULL COMMENT 'Admin who created conflict',
  PRIMARY KEY (`conflict_id`),
  KEY `idx_doctor_conflicts_doctor_id` (`doctor_id`),
  KEY `idx_doctor_conflicts_date` (`conflict_date`),
  KEY `idx_doctor_conflicts_type` (`conflict_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Recreate appointment_requests table
CREATE TABLE IF NOT EXISTS `appointment_requests` (
  `request_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `facility_id` char(36) NOT NULL,
  `provider_id` char(36) DEFAULT NULL,
  `requested_date` date NOT NULL,
  `requested_time` time NOT NULL,
  `appointment_type` enum('follow_up','art_pickup','lab_test','counseling','general','initial') NOT NULL,
  `patient_notes` text DEFAULT NULL,
  `status` enum('pending','approved','declined','cancelled') DEFAULT 'pending',
  `reviewed_by` char(36) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `review_notes` text DEFAULT NULL,
  `decline_reason` text DEFAULT NULL,
  `appointment_id` char(36) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `created_by` char(36) NOT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`request_id`),
  KEY `idx_appointment_requests_patient_id` (`patient_id`),
  KEY `idx_appointment_requests_facility_id` (`facility_id`),
  KEY `idx_appointment_requests_provider_id` (`provider_id`),
  KEY `idx_appointment_requests_status` (`status`),
  KEY `idx_appointment_requests_requested_date` (`requested_date`),
  KEY `idx_appointment_requests_reviewed_by` (`reviewed_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Recreate appointments table
CREATE TABLE IF NOT EXISTS `appointments` (
  `appointment_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `provider_id` char(36) DEFAULT NULL,
  `facility_id` char(36) NOT NULL,
  `appointment_type` enum('follow_up','art_pickup','lab_test','counseling','general','initial') NOT NULL,
  `scheduled_start` datetime NOT NULL,
  `scheduled_end` datetime NOT NULL,
  `duration_minutes` int(11) DEFAULT 60,
  `status` enum('scheduled','confirmed','in_progress','completed','cancelled','no_show') DEFAULT 'scheduled',
  `reason` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `booked_by` char(36) NOT NULL,
  `booked_at` datetime DEFAULT current_timestamp(),
  `cancelled_at` datetime DEFAULT NULL,
  `cancelled_by` char(36) DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `request_id` char(36) DEFAULT NULL,
  PRIMARY KEY (`appointment_id`),
  KEY `idx_appointments_patient_id` (`patient_id`),
  KEY `idx_appointments_provider_id` (`provider_id`),
  KEY `idx_appointments_facility_id` (`facility_id`),
  KEY `idx_appointments_scheduled_start` (`scheduled_start`),
  KEY `idx_appointments_scheduled_start_desc` (`scheduled_start` DESC),
  KEY `idx_appointments_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Recreate availability_slots table
CREATE TABLE IF NOT EXISTS `availability_slots` (
  `slot_id` char(36) NOT NULL,
  `provider_id` char(36) NOT NULL,
  `facility_id` char(36) NOT NULL,
  `slot_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `slot_status` enum('available','booked','blocked','unavailable','locked') DEFAULT 'available',
  `appointment_id` char(36) DEFAULT NULL,
  `assignment_id` char(36) DEFAULT NULL,
  `lock_status` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`slot_id`),
  KEY `idx_availability_slots_provider_id` (`provider_id`),
  KEY `idx_availability_slots_facility_id` (`facility_id`),
  KEY `idx_availability_slots_date` (`slot_date`),
  KEY `idx_availability_slots_status` (`slot_status`),
  KEY `idx_availability_slots_assignment_id` (`assignment_id`),
  KEY `idx_availability_slots_lock_status` (`lock_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Recreate appointment_reminders table
CREATE TABLE IF NOT EXISTS `appointment_reminders` (
  `reminder_id` char(36) NOT NULL,
  `appointment_id` char(36) NOT NULL,
  `reminder_type` enum('sms','email','push','in_app') NOT NULL,
  `reminder_sent_at` datetime DEFAULT NULL,
  `reminder_scheduled_at` datetime NOT NULL,
  `status` enum('pending','sent','failed','cancelled') DEFAULT 'pending',
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`reminder_id`),
  KEY `idx_appointment_reminders_appointment_id` (`appointment_id`),
  KEY `idx_appointment_reminders_status` (`status`),
  KEY `idx_appointment_reminders_scheduled_at` (`reminder_scheduled_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- STEP 3: INSERT DUMMY DATA
-- =====================================================
-- Insert in dependency order

-- =====================================================
-- 1. DOCTOR ASSIGNMENTS
-- =====================================================
-- Assumes users with IDs exist: '22222222-2222-2222-2222-222222222222' (physician), '11111111-1111-1111-1111-111111111111' (admin)
-- Assumes facility exists: '550e8400-e29b-41d4-a716-446655440000'

INSERT INTO `doctor_assignments` 
(`assignment_id`, `doctor_id`, `facility_id`, `assignment_date`, `start_time`, `end_time`, `max_patients`, `notes`, `is_locked`, `locked_at`, `locked_by`, `created_at`, `created_by`, `updated_at`) 
VALUES
-- Assignment for next week (Monday to Friday)
('da001-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-09', '08:00:00', '17:00:00', 8, 'Regular weekly assignment', 0, NULL, NULL, NOW(), '11111111-1111-1111-1111-111111111111', NOW()),
('da002-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-10', '08:00:00', '17:00:00', 8, 'Regular weekly assignment', 0, NULL, NULL, NOW(), '11111111-1111-1111-1111-111111111111', NOW()),
('da003-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-11', '08:00:00', '17:00:00', 8, 'Regular weekly assignment', 0, NULL, NULL, NOW(), '11111111-1111-1111-1111-111111111111', NOW()),
('da004-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-12', '08:00:00', '17:00:00', 8, 'Regular weekly assignment', 0, NULL, NULL, NOW(), '11111111-1111-1111-1111-111111111111', NOW()),
('da005-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-13', '08:00:00', '17:00:00', 8, 'Regular weekly assignment', 0, NULL, NULL, NOW(), '11111111-1111-1111-1111-111111111111', NOW()),
-- Locked assignment (cannot be modified)
('da006-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-16', '08:00:00', '17:00:00', 8, 'Locked schedule - do not modify', 1, NOW(), '11111111-1111-1111-1111-111111111111', NOW(), '11111111-1111-1111-1111-111111111111', NOW());

-- =====================================================
-- 2. DOCTOR CONFLICTS
-- =====================================================

INSERT INTO `doctor_conflicts` 
(`conflict_id`, `doctor_id`, `facility_id`, `conflict_date`, `conflict_type`, `reason`, `start_time`, `end_time`, `is_all_day`, `created_at`, `created_by`) 
VALUES
-- Full day leave
('dc001-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-15', 'leave', 'Annual leave - doctor unavailable', NULL, NULL, 1, NOW(), '11111111-1111-1111-1111-111111111111'),
-- Partial day meeting
('dc002-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-17', 'meeting', 'Medical board meeting', '14:00:00', '16:00:00', 0, NOW(), '11111111-1111-1111-1111-111111111111'),
-- Training session
('dc003-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', NULL, '2025-12-20', 'training', 'CPR certification training - all facilities', NULL, NULL, 1, NOW(), '11111111-1111-1111-1111-111111111111');

-- =====================================================
-- 3. APPOINTMENT REQUESTS
-- =====================================================
-- Assumes patients exist: '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
-- Assumes users exist: '44444444-4444-4444-4444-444444444444' (case_manager), '66666666-6666-6666-6666-666666666666' (patient)

INSERT INTO `appointment_requests` 
(`request_id`, `patient_id`, `facility_id`, `provider_id`, `requested_date`, `requested_time`, `appointment_type`, `patient_notes`, `status`, `reviewed_by`, `reviewed_at`, `review_notes`, `decline_reason`, `appointment_id`, `created_at`, `created_by`, `updated_at`) 
VALUES
-- Pending request
('ar001-1111-1111-1111-111111111111', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '550e8400-e29b-41d4-a716-446655440000', '22222222-2222-2222-2222-222222222222', '2025-12-09', '09:00:00', 'follow_up', 'Need follow-up consultation for medication review', 'pending', NULL, NULL, NULL, NULL, NULL, NOW(), '66666666-6666-6666-6666-666666666666', NOW()),
-- Approved request (will link to appointment)
('ar002-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '550e8400-e29b-41d4-a716-446655440000', '22222222-2222-2222-2222-222222222222', '2025-12-10', '10:00:00', 'lab_test', 'Routine lab work needed', 'approved', '44444444-4444-4444-4444-444444444444', NOW(), 'Approved - slot available', NULL, NULL, DATE_SUB(NOW(), INTERVAL 1 DAY), '66666666-6666-6666-6666-666666666666', NOW()),
-- Declined request
('ar003-3333-3333-3333-333333333333', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '550e8400-e29b-41d4-a716-446655440000', NULL, '2025-12-11', '08:00:00', 'art_pickup', 'Need ART medication refill', 'declined', '44444444-4444-4444-4444-444444444444', NOW(), NULL, 'Requested time slot not available. Please select another time.', NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), '66666666-6666-6666-6666-666666666666', NOW()),
-- Cancelled by patient
('ar004-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '550e8400-e29b-41d4-a716-446655440000', '22222222-2222-2222-2222-222222222222', '2025-12-12', '11:00:00', 'counseling', 'Mental health counseling session', 'cancelled', NULL, NULL, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 3 DAY), '66666666-6666-6666-6666-666666666666', NOW());

-- =====================================================
-- 4. APPOINTMENTS
-- =====================================================
-- Assumes users exist: '44444444-4444-4444-4444-444444444444' (case_manager/booked_by)

INSERT INTO `appointments` 
(`appointment_id`, `patient_id`, `provider_id`, `facility_id`, `appointment_type`, `scheduled_start`, `scheduled_end`, `duration_minutes`, `status`, `reason`, `notes`, `booked_by`, `booked_at`, `cancelled_at`, `cancelled_by`, `cancellation_reason`, `created_at`, `request_id`) 
VALUES
-- Confirmed appointment (from approved request)
('apt001-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', 'lab_test', '2025-12-10 10:00:00', '2025-12-10 11:00:00', 60, 'confirmed', 'Routine lab work', 'Patient requested routine blood work', '44444444-4444-4444-4444-444444444444', DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 1 DAY), 'ar002-2222-2222-2222-222222222222'),
-- Scheduled appointment
('apt002-2222-2222-2222-222222222222', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', 'follow_up', '2025-12-11 14:00:00', '2025-12-11 15:00:00', 60, 'scheduled', 'Follow-up consultation', 'Regular follow-up visit', '44444444-4444-4444-4444-444444444444', NOW(), NULL, NULL, NULL, NOW(), NULL),
-- Initial consultation
('apt003-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', 'initial', '2025-12-12 09:00:00', '2025-12-12 10:00:00', 60, 'scheduled', 'New patient consultation', 'First visit to facility', '44444444-4444-4444-4444-444444444444', NOW(), NULL, NULL, NULL, NOW(), NULL),
-- ART pickup
('apt004-4444-4444-4444-444444444444', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', 'art_pickup', '2025-12-13 08:00:00', '2025-12-13 09:00:00', 60, 'scheduled', 'ART medication refill', 'Monthly ART pickup', '44444444-4444-4444-4444-444444444444', NOW(), NULL, NULL, NULL, NOW(), NULL),
-- Completed appointment
('apt005-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', 'follow_up', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 1 HOUR, 60, 'completed', 'Routine checkup', 'Patient completed visit successfully', '44444444-4444-4444-4444-444444444444', DATE_SUB(NOW(), INTERVAL 8 DAY), NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 8 DAY), NULL),
-- Cancelled appointment
('apt006-6666-6666-6666-666666666666', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', 'counseling', '2025-12-14 10:00:00', '2025-12-14 11:00:00', 60, 'cancelled', 'Counseling session', 'Patient requested cancellation', '44444444-4444-4444-4444-444444444444', DATE_SUB(NOW(), INTERVAL 5 DAY), NOW(), '44444444-4444-4444-4444-444444444444', 'Patient requested cancellation due to scheduling conflict', DATE_SUB(NOW(), INTERVAL 5 DAY), NULL);

-- =====================================================
-- 5. AVAILABILITY SLOTS
-- =====================================================
-- Generate hourly slots (8:00-17:00) for each assignment date

INSERT INTO `availability_slots` 
(`slot_id`, `provider_id`, `facility_id`, `slot_date`, `start_time`, `end_time`, `slot_status`, `appointment_id`, `assignment_id`, `lock_status`, `created_at`) 
VALUES
-- Slots for 2025-12-09 (from assignment da001)
('slot-001-09-08', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-09', '08:00:00', '09:00:00', 'available', NULL, 'da001-1111-1111-1111-111111111111', 0, NOW()),
('slot-001-09-09', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-09', '09:00:00', '10:00:00', 'available', NULL, 'da001-1111-1111-1111-111111111111', 0, NOW()),
('slot-001-09-10', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-09', '10:00:00', '11:00:00', 'available', NULL, 'da001-1111-1111-1111-111111111111', 0, NOW()),
('slot-001-09-11', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-09', '11:00:00', '12:00:00', 'available', NULL, 'da001-1111-1111-1111-111111111111', 0, NOW()),
('slot-001-09-12', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-09', '12:00:00', '13:00:00', 'available', NULL, 'da001-1111-1111-1111-111111111111', 0, NOW()),
('slot-001-09-13', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-09', '13:00:00', '14:00:00', 'available', NULL, 'da001-1111-1111-1111-111111111111', 0, NOW()),
('slot-001-09-14', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-09', '14:00:00', '15:00:00', 'available', NULL, 'da001-1111-1111-1111-111111111111', 0, NOW()),
('slot-001-09-15', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-09', '15:00:00', '16:00:00', 'available', NULL, 'da001-1111-1111-1111-111111111111', 0, NOW()),
('slot-001-09-16', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-09', '16:00:00', '17:00:00', 'available', NULL, 'da001-1111-1111-1111-111111111111', 0, NOW()),
-- Slots for 2025-12-10 (from assignment da002) - one slot booked
('slot-002-10-08', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-10', '08:00:00', '09:00:00', 'available', NULL, 'da002-2222-2222-2222-222222222222', 0, NOW()),
('slot-002-10-09', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-10', '09:00:00', '10:00:00', 'available', NULL, 'da002-2222-2222-2222-222222222222', 0, NOW()),
('slot-002-10-10', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-10', '10:00:00', '11:00:00', 'booked', 'apt001-1111-1111-1111-111111111111', 'da002-2222-2222-2222-222222222222', 0, NOW()),
('slot-002-10-11', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-10', '11:00:00', '12:00:00', 'available', NULL, 'da002-2222-2222-2222-222222222222', 0, NOW()),
('slot-002-10-12', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-10', '12:00:00', '13:00:00', 'available', NULL, 'da002-2222-2222-2222-222222222222', 0, NOW()),
('slot-002-10-13', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-10', '13:00:00', '14:00:00', 'available', NULL, 'da002-2222-2222-2222-222222222222', 0, NOW()),
('slot-002-10-14', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-10', '14:00:00', '15:00:00', 'available', NULL, 'da002-2222-2222-2222-222222222222', 0, NOW()),
('slot-002-10-15', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-10', '15:00:00', '16:00:00', 'available', NULL, 'da002-2222-2222-2222-222222222222', 0, NOW()),
('slot-002-10-16', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-10', '16:00:00', '17:00:00', 'available', NULL, 'da002-2222-2222-2222-222222222222', 0, NOW()),
-- Slots for 2025-12-11 (from assignment da003)
('slot-003-11-08', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-11', '08:00:00', '09:00:00', 'available', NULL, 'da003-3333-3333-3333-333333333333', 0, NOW()),
('slot-003-11-09', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-11', '09:00:00', '10:00:00', 'available', NULL, 'da003-3333-3333-3333-333333333333', 0, NOW()),
('slot-003-11-10', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-11', '10:00:00', '11:00:00', 'available', NULL, 'da003-3333-3333-3333-333333333333', 0, NOW()),
('slot-003-11-11', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-11', '11:00:00', '12:00:00', 'available', NULL, 'da003-3333-3333-3333-333333333333', 0, NOW()),
('slot-003-11-12', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-11', '12:00:00', '13:00:00', 'available', NULL, 'da003-3333-3333-3333-333333333333', 0, NOW()),
('slot-003-11-13', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-11', '13:00:00', '14:00:00', 'available', NULL, 'da003-3333-3333-3333-333333333333', 0, NOW()),
('slot-003-11-14', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-11', '14:00:00', '15:00:00', 'booked', 'apt002-2222-2222-2222-222222222222', 'da003-3333-3333-3333-333333333333', 0, NOW()),
('slot-003-11-15', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-11', '15:00:00', '16:00:00', 'available', NULL, 'da003-3333-3333-3333-333333333333', 0, NOW()),
('slot-003-11-16', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-11', '16:00:00', '17:00:00', 'available', NULL, 'da003-3333-3333-3333-333333333333', 0, NOW()),
-- Slots for 2025-12-12 (from assignment da004)
('slot-004-12-08', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-12', '08:00:00', '09:00:00', 'available', NULL, 'da004-4444-4444-4444-444444444444', 0, NOW()),
('slot-004-12-09', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-12', '09:00:00', '10:00:00', 'booked', 'apt003-3333-3333-3333-333333333333', 'da004-4444-4444-4444-444444444444', 0, NOW()),
('slot-004-12-10', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-12', '10:00:00', '11:00:00', 'available', NULL, 'da004-4444-4444-4444-444444444444', 0, NOW()),
('slot-004-12-11', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-12', '11:00:00', '12:00:00', 'available', NULL, 'da004-4444-4444-4444-444444444444', 0, NOW()),
('slot-004-12-12', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-12', '12:00:00', '13:00:00', 'available', NULL, 'da004-4444-4444-4444-444444444444', 0, NOW()),
('slot-004-12-13', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-12', '13:00:00', '14:00:00', 'available', NULL, 'da004-4444-4444-4444-444444444444', 0, NOW()),
('slot-004-12-14', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-12', '14:00:00', '15:00:00', 'available', NULL, 'da004-4444-4444-4444-444444444444', 0, NOW()),
('slot-004-12-15', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-12', '15:00:00', '16:00:00', 'available', NULL, 'da004-4444-4444-4444-444444444444', 0, NOW()),
('slot-004-12-16', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-12', '16:00:00', '17:00:00', 'available', NULL, 'da004-4444-4444-4444-444444444444', 0, NOW()),
-- Slots for 2025-12-13 (from assignment da005)
('slot-005-13-08', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-13', '08:00:00', '09:00:00', 'booked', 'apt004-4444-4444-4444-444444444444', 'da005-5555-5555-5555-555555555555', 0, NOW()),
('slot-005-13-09', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-13', '09:00:00', '10:00:00', 'available', NULL, 'da005-5555-5555-5555-555555555555', 0, NOW()),
('slot-005-13-10', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-13', '10:00:00', '11:00:00', 'available', NULL, 'da005-5555-5555-5555-555555555555', 0, NOW()),
('slot-005-13-11', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-13', '11:00:00', '12:00:00', 'available', NULL, 'da005-5555-5555-5555-555555555555', 0, NOW()),
('slot-005-13-12', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-13', '12:00:00', '13:00:00', 'available', NULL, 'da005-5555-5555-5555-555555555555', 0, NOW()),
('slot-005-13-13', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-13', '13:00:00', '14:00:00', 'available', NULL, 'da005-5555-5555-5555-555555555555', 0, NOW()),
('slot-005-13-14', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-13', '14:00:00', '15:00:00', 'available', NULL, 'da005-5555-5555-5555-555555555555', 0, NOW()),
('slot-005-13-15', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-13', '15:00:00', '16:00:00', 'available', NULL, 'da005-5555-5555-5555-555555555555', 0, NOW()),
('slot-005-13-16', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-13', '16:00:00', '17:00:00', 'available', NULL, 'da005-5555-5555-5555-555555555555', 0, NOW()),
-- Slots for 2025-12-16 (from locked assignment da006) - all slots locked
('slot-006-16-08', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-16', '08:00:00', '09:00:00', 'locked', NULL, 'da006-6666-6666-6666-666666666666', 1, NOW()),
('slot-006-16-09', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-16', '09:00:00', '10:00:00', 'locked', NULL, 'da006-6666-6666-6666-666666666666', 1, NOW()),
('slot-006-16-10', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-16', '10:00:00', '11:00:00', 'locked', NULL, 'da006-6666-6666-6666-666666666666', 1, NOW()),
('slot-006-16-11', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-16', '11:00:00', '12:00:00', 'locked', NULL, 'da006-6666-6666-6666-666666666666', 1, NOW()),
('slot-006-16-12', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-16', '12:00:00', '13:00:00', 'locked', NULL, 'da006-6666-6666-6666-666666666666', 1, NOW()),
('slot-006-16-13', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-16', '13:00:00', '14:00:00', 'locked', NULL, 'da006-6666-6666-6666-666666666666', 1, NOW()),
('slot-006-16-14', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-16', '14:00:00', '15:00:00', 'locked', NULL, 'da006-6666-6666-6666-666666666666', 1, NOW()),
('slot-006-16-15', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-16', '15:00:00', '16:00:00', 'locked', NULL, 'da006-6666-6666-6666-666666666666', 1, NOW()),
('slot-006-16-16', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-16', '16:00:00', '17:00:00', 'locked', NULL, 'da006-6666-6666-6666-666666666666', 1, NOW());

-- =====================================================
-- 6. APPOINTMENT REMINDERS
-- =====================================================

INSERT INTO `appointment_reminders` 
(`reminder_id`, `appointment_id`, `reminder_type`, `reminder_sent_at`, `reminder_scheduled_at`, `status`, `created_at`) 
VALUES
-- Pending reminder for upcoming appointment (24 hours before)
('rem001-1111-1111-1111-111111111111', 'apt001-1111-1111-1111-111111111111', 'email', NULL, DATE_SUB('2025-12-10 10:00:00', INTERVAL 24 HOUR), 'pending', NOW()),
('rem001-2222-2222-2222-222222222222', 'apt001-1111-1111-1111-111111111111', 'sms', NULL, DATE_SUB('2025-12-10 10:00:00', INTERVAL 24 HOUR), 'pending', NOW()),
-- Sent reminder for past appointment
('rem002-3333-3333-3333-333333333333', 'apt005-5555-5555-5555-555555555555', 'email', DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(DATE_SUB(NOW(), INTERVAL 7 DAY), INTERVAL 24 HOUR), 'sent', DATE_SUB(NOW(), INTERVAL 8 DAY)),
('rem002-4444-4444-4444-444444444444', 'apt005-5555-5555-5555-555555555555', 'sms', DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(DATE_SUB(NOW(), INTERVAL 7 DAY), INTERVAL 24 HOUR), 'sent', DATE_SUB(NOW(), INTERVAL 8 DAY)),
-- Failed reminder
('rem003-5555-5555-5555-555555555555', 'apt006-6666-6666-6666-666666666666', 'sms', NULL, DATE_SUB('2025-12-14 10:00:00', INTERVAL 24 HOUR), 'failed', DATE_SUB(NOW(), INTERVAL 5 DAY)),
-- Cancelled reminder (appointment was cancelled)
('rem004-6666-6666-6666-666666666666', 'apt006-6666-6666-6666-666666666666', 'email', NULL, DATE_SUB('2025-12-14 10:00:00', INTERVAL 24 HOUR), 'cancelled', DATE_SUB(NOW(), INTERVAL 5 DAY));

COMMIT;

-- =====================================================
-- INSERT COMPLETE
-- =====================================================
-- Summary:
-- - 6 doctor_assignments (including 1 locked)
-- - 3 doctor_conflicts (1 full day, 1 partial day, 1 all facilities)
-- - 4 appointment_requests (pending, approved, declined, cancelled)
-- - 6 appointments (confirmed, scheduled, completed, cancelled)
-- - 54 availability_slots (9 slots per day for 6 days, including locked slots)
-- - 6 appointment_reminders (pending, sent, failed, cancelled)
-- =====================================================

