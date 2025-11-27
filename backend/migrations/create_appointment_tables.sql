-- Migration: Create appointment-related tables
-- Description: Creates all tables related to appointment management system
-- Date: 2025-01-XX
-- 
-- This migration creates:
-- 1. appointments - Main appointments table
-- 2. appointment_reminders - Reminders for appointments
-- 3. appointment_requests - Patient appointment requests
-- 4. doctor_assignments - Provider assignments to facilities (created before availability_slots)
-- 5. availability_slots - Provider availability slots (references doctor_assignments)
-- 6. doctor_conflicts - Provider scheduling conflicts (references doctor_assignments)

-- ============================================
-- 1. APPOINTMENTS TABLE
-- ============================================
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
  `booked_by` char(36) DEFAULT NULL,
  `booked_at` datetime DEFAULT current_timestamp(),
  `cancelled_at` datetime DEFAULT NULL,
  `cancelled_by` char(36) DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`appointment_id`),
  KEY `patient_id` (`patient_id`),
  KEY `provider_id` (`provider_id`),
  KEY `facility_id` (`facility_id`),
  KEY `booked_by` (`booked_by`),
  KEY `cancelled_by` (`cancelled_by`),
  KEY `idx_appointments_status` (`status`),
  KEY `idx_appointments_scheduled_start` (`scheduled_start`),
  CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`),
  CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`provider_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `appointments_ibfk_3` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`),
  CONSTRAINT `appointments_ibfk_4` FOREIGN KEY (`booked_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `appointments_ibfk_5` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- 2. APPOINTMENT_REMINDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `appointment_reminders` (
  `reminder_id` char(36) NOT NULL,
  `appointment_id` char(36) NOT NULL,
  `reminder_type` enum('sms','email','push','in_app') NOT NULL,
  `reminder_sent_at` datetime DEFAULT NULL,
  `reminder_scheduled_at` datetime NOT NULL,
  `status` enum('pending','sent','failed','cancelled') DEFAULT 'pending',
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`reminder_id`),
  KEY `appointment_id` (`appointment_id`),
  KEY `idx_reminders_status` (`status`),
  KEY `idx_reminders_scheduled_at` (`reminder_scheduled_at`),
  CONSTRAINT `appointment_reminders_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`appointment_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- 3. APPOINTMENT_REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `appointment_requests` (
  `request_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `preferred_start` datetime NOT NULL,
  `preferred_end` datetime NOT NULL,
  `preferred_facility_id` char(36) DEFAULT NULL,
  `status` enum('pending','approved','declined','cancelled') DEFAULT 'pending',
  `reviewer_id` char(36) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `decline_reason` text DEFAULT NULL,
  `appointment_id` char(36) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`request_id`),
  KEY `patient_id` (`patient_id`),
  KEY `preferred_facility_id` (`preferred_facility_id`),
  KEY `reviewer_id` (`reviewer_id`),
  KEY `appointment_id` (`appointment_id`),
  KEY `idx_appointment_requests_status` (`status`),
  KEY `idx_appointment_requests_preferred_start` (`preferred_start`),
  CONSTRAINT `appointment_requests_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`),
  CONSTRAINT `appointment_requests_ibfk_2` FOREIGN KEY (`preferred_facility_id`) REFERENCES `facilities` (`facility_id`),
  CONSTRAINT `appointment_requests_ibfk_3` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `appointment_requests_ibfk_4` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`appointment_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Captures patient appointment requests prior to case manager approval.';

-- ============================================
-- 4. DOCTOR_ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `doctor_assignments` (
  `assignment_id` char(36) NOT NULL,
  `provider_id` char(36) NOT NULL,
  `facility_id` char(36) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `daily_start` time NOT NULL,
  `daily_end` time NOT NULL,
  `days_of_week` set('mon','tue','wed','thu','fri','sat','sun') NOT NULL,
  `is_locked` tinyint(1) DEFAULT 0,
  `created_by` char(36) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`assignment_id`),
  KEY `provider_id` (`provider_id`),
  KEY `facility_id` (`facility_id`),
  KEY `created_by` (`created_by`),
  KEY `idx_doctor_assignments_provider_facility` (`provider_id`,`facility_id`),
  KEY `idx_doctor_assignments_dates` (`start_date`,`end_date`),
  CONSTRAINT `doctor_assignments_ibfk_1` FOREIGN KEY (`provider_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `doctor_assignments_ibfk_2` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`),
  CONSTRAINT `doctor_assignments_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Defines provider assignments to facilities and scheduling windows.';

-- ============================================
-- 5. AVAILABILITY_SLOTS TABLE
-- ============================================
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
  KEY `provider_id` (`provider_id`),
  KEY `facility_id` (`facility_id`),
  KEY `appointment_id` (`appointment_id`),
  KEY `assignment_id` (`assignment_id`),
  KEY `idx_availability_slots_provider_id` (`provider_id`),
  KEY `idx_availability_slots_facility_id` (`facility_id`),
  KEY `idx_availability_slots_date` (`slot_date`),
  KEY `idx_availability_slots_status` (`slot_status`),
  KEY `idx_availability_slots_appointment_id` (`appointment_id`),
  KEY `idx_availability_slots_provider_date_status` (`provider_id`,`slot_date`,`slot_status`),
  KEY `idx_availability_slots_facility_date` (`facility_id`,`slot_date`),
  KEY `idx_availability_slots_assignment_id` (`assignment_id`),
  KEY `idx_availability_slots_lock_status` (`lock_status`),
  CONSTRAINT `availability_slots_ibfk_1` FOREIGN KEY (`provider_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `availability_slots_ibfk_2` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`),
  CONSTRAINT `availability_slots_ibfk_3` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`appointment_id`) ON DELETE SET NULL,
  CONSTRAINT `availability_slots_ibfk_4` FOREIGN KEY (`assignment_id`) REFERENCES `doctor_assignments` (`assignment_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Stores provider availability slots for appointment scheduling. Status: available, booked, blocked, unavailable, locked';

-- ============================================
-- 6. DOCTOR_CONFLICTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS `doctor_conflicts` (
  `conflict_id` char(36) NOT NULL,
  `assignment_id` char(36) NOT NULL,
  `conflict_start` datetime NOT NULL,
  `conflict_end` datetime NOT NULL,
  `reason` text DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`conflict_id`),
  KEY `assignment_id` (`assignment_id`),
  KEY `created_by` (`created_by`),
  KEY `idx_doctor_conflicts_dates` (`conflict_start`,`conflict_end`),
  CONSTRAINT `doctor_conflicts_ibfk_1` FOREIGN KEY (`assignment_id`) REFERENCES `doctor_assignments` (`assignment_id`) ON DELETE CASCADE,
  CONSTRAINT `doctor_conflicts_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Blocks scheduling within an assigned window due to conflicts.';

