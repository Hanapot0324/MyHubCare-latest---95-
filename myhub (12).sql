-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 29, 2025 at 05:54 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `myhub`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `add_fk_if_not_exists` (IN `in_table` VARCHAR(64), IN `in_constraint` VARCHAR(64), IN `in_fk_cols` TEXT, IN `in_ref_tbl` VARCHAR(64), IN `in_ref_cols` TEXT)   BEGIN
  DECLARE cnt INT DEFAULT 0;
  SELECT COUNT(*) INTO cnt
    FROM information_schema.TABLE_CONSTRAINTS
   WHERE CONSTRAINT_SCHEMA = DATABASE()
     AND TABLE_NAME = in_table
     AND CONSTRAINT_NAME = in_constraint;

  IF cnt = 0 THEN
    SET @sql = CONCAT(
      'ALTER TABLE `', in_table, '` ADD CONSTRAINT `', in_constraint,
      '` FOREIGN KEY (', in_fk_cols, ') REFERENCES `', in_ref_tbl, '` (', in_ref_cols, ')'
    );
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
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
  `request_id` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `appointment_reminders`
--

CREATE TABLE `appointment_reminders` (
  `reminder_id` char(36) NOT NULL,
  `appointment_id` char(36) NOT NULL,
  `reminder_type` enum('sms','email','push','in_app') NOT NULL,
  `reminder_sent_at` datetime DEFAULT NULL,
  `reminder_scheduled_at` datetime NOT NULL,
  `status` enum('pending','sent','failed','cancelled') DEFAULT 'pending',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `appointment_requests`
--

CREATE TABLE `appointment_requests` (
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
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `appointment_requests`
--

INSERT INTO `appointment_requests` (`request_id`, `patient_id`, `facility_id`, `provider_id`, `requested_date`, `requested_time`, `appointment_type`, `patient_notes`, `status`, `reviewed_by`, `reviewed_at`, `review_notes`, `decline_reason`, `appointment_id`, `created_at`, `created_by`, `updated_at`) VALUES
('156d0636-0032-4748-9d70-878dc140a407', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '550e8400-e29b-41d4-a716-446655440000', '22222222-2222-2222-2222-222222222222', '2025-11-30', '09:00:00', 'initial', NULL, 'pending', NULL, NULL, NULL, NULL, NULL, '2025-11-29 12:51:42', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '2025-11-29 12:51:42'),
('4180f110-dfc6-44d2-bec3-b097538c2108', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '550e8400-e29b-41d4-a716-446655440000', '22222222-2222-2222-2222-222222222222', '2025-11-30', '08:00:00', 'initial', NULL, 'approved', '44444444-4444-4444-4444-444444444444', '2025-11-29 12:28:34', NULL, NULL, 'dabe07af-f0d0-4303-8999-7e7022fa8d68', '2025-11-29 12:27:04', '66666666-6666-6666-6666-666666666666', '2025-11-29 12:28:34'),
('47df793f-f1e8-4021-b6fa-66504f7ceec5', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '550e8400-e29b-41d4-a716-446655440000', '22222222-2222-2222-2222-222222222222', '2025-11-30', '10:00:00', 'initial', NULL, 'approved', '44444444-4444-4444-4444-444444444444', '2025-11-29 12:35:47', NULL, NULL, '2a2aed03-4cef-4d60-b42a-7cb470ae2564', '2025-11-29 12:35:37', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '2025-11-29 12:35:47');

-- --------------------------------------------------------

--
-- Table structure for table `appointment_requests_backup`
--

CREATE TABLE `appointment_requests_backup` (
  `request_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `preferred_start` datetime NOT NULL,
  `preferred_end` datetime NOT NULL,
  `preferred_facility_id` char(36) DEFAULT NULL,
  `preferred_provider_id` char(36) DEFAULT NULL,
  `status` enum('pending','approved','declined','cancelled') DEFAULT 'pending',
  `reviewer_id` char(36) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `decline_reason` text DEFAULT NULL,
  `appointment_id` char(36) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Captures patient appointment requests prior to case manager approval.';

--
-- Dumping data for table `appointment_requests_backup`
--

INSERT INTO `appointment_requests_backup` (`request_id`, `patient_id`, `preferred_start`, `preferred_end`, `preferred_facility_id`, `preferred_provider_id`, `status`, `reviewer_id`, `reviewed_at`, `decline_reason`, `appointment_id`, `notes`, `created_at`) VALUES
('232ef03a-496f-4ac5-b725-4ea9ae208ad6', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '2025-12-02 08:00:00', '2025-12-02 09:00:00', '550e8400-e29b-41d4-a716-446655440000', NULL, 'cancelled', NULL, NULL, NULL, NULL, NULL, '2025-11-28 17:40:18'),
('2b2c3fd4-6bdd-4bda-9934-735bc2469b00', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '2025-12-02 08:00:00', '2025-12-02 09:00:00', '550e8400-e29b-41d4-a716-446655440000', NULL, 'approved', '44444444-4444-4444-4444-444444444444', '2025-11-28 17:49:00', NULL, 'f57ae378-d77b-4f5f-8f99-c65c3346011e', NULL, '2025-11-28 17:47:52'),
('ac430161-cdd9-44d2-870e-adefe20301e6', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '2025-12-04 08:00:00', '2025-12-04 09:00:00', '550e8400-e29b-41d4-a716-446655440000', NULL, 'approved', '44444444-4444-4444-4444-444444444444', '2025-11-28 17:55:03', NULL, '2e60cb9f-85d5-4307-8422-7daf9362867b', NULL, '2025-11-28 17:54:53');

-- --------------------------------------------------------

--
-- Table structure for table `art_regimens`
--

CREATE TABLE `art_regimens` (
  `regimen_id` char(36) NOT NULL,
  `regimen_name` varchar(150) NOT NULL,
  `regimen_code` varchar(50) DEFAULT NULL,
  `line` enum('first_line','second_line','third_line','other') DEFAULT 'first_line',
  `components` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`components`)),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `art_regimen_drugs`
--

CREATE TABLE `art_regimen_drugs` (
  `regimen_drug_id` char(36) NOT NULL,
  `regimen_id` char(36) NOT NULL,
  `medication_id` char(36) NOT NULL,
  `drug_name` varchar(200) NOT NULL,
  `dosage` varchar(50) NOT NULL,
  `pills_per_day` int(11) NOT NULL,
  `pills_dispensed` int(11) DEFAULT 0,
  `pills_remaining` int(11) DEFAULT 0,
  `missed_doses` int(11) DEFAULT 0,
  `last_dispensed_date` date DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `art_regimen_drugs`
--

INSERT INTO `art_regimen_drugs` (`regimen_drug_id`, `regimen_id`, `medication_id`, `drug_name`, `dosage`, `pills_per_day`, `pills_dispensed`, `pills_remaining`, `missed_doses`, `last_dispensed_date`, `created_at`) VALUES
('83785f3f-548f-4187-91c9-ac9364a0f47e', '3828eed0-44fb-4beb-95e1-0b272082eb50', '9117b66c-a29f-43cc-ac78-5724222f7a38', 'Efavirenz 600mg', '1 tablet', 1, 30, 30, 0, NULL, '2025-11-24 13:34:20');

-- --------------------------------------------------------

--
-- Table structure for table `art_regimen_history`
--

CREATE TABLE `art_regimen_history` (
  `history_id` char(36) NOT NULL,
  `regimen_id` char(36) NOT NULL,
  `action_type` enum('started','stopped','changed','drug_added','drug_removed','pills_dispensed','dose_missed') NOT NULL,
  `action_date` date DEFAULT curdate(),
  `previous_status` varchar(50) DEFAULT NULL,
  `new_status` varchar(50) DEFAULT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `performed_by` char(36) NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `art_regimen_history`
--

INSERT INTO `art_regimen_history` (`history_id`, `regimen_id`, `action_type`, `action_date`, `previous_status`, `new_status`, `details`, `performed_by`, `notes`, `created_at`) VALUES
('363c67df-d63d-4af4-926f-202b02786d30', '3828eed0-44fb-4beb-95e1-0b272082eb50', 'started', '2025-11-24', NULL, 'active', NULL, '11111111-1111-1111-1111-111111111111', NULL, '2025-11-24 13:34:20');

-- --------------------------------------------------------

--
-- Table structure for table `audit_log`
--

CREATE TABLE `audit_log` (
  `audit_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `user_name` varchar(200) NOT NULL,
  `user_role` varchar(50) NOT NULL,
  `action` enum('CREATE','UPDATE','DELETE','LOGIN','LOGOUT','VIEW','EXPORT','PRINT','DOWNLOAD') NOT NULL,
  `module` varchar(100) NOT NULL,
  `entity_type` varchar(100) DEFAULT NULL,
  `entity_id` char(36) DEFAULT NULL,
  `record_id` varchar(50) DEFAULT NULL,
  `old_value` longtext DEFAULT NULL,
  `new_value` longtext DEFAULT NULL,
  `change_summary` text DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `device_type` enum('Desktop','Mobile','Tablet') DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `status` enum('success','failed','error') DEFAULT 'success',
  `error_message` text DEFAULT NULL,
  `timestamp` datetime DEFAULT current_timestamp(),
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `audit_log`
--

INSERT INTO `audit_log` (`audit_id`, `user_id`, `user_name`, `user_role`, `action`, `module`, `entity_type`, `entity_id`, `record_id`, `old_value`, `new_value`, `change_summary`, `ip_address`, `device_type`, `user_agent`, `remarks`, `status`, `error_message`, `timestamp`, `created_at`) VALUES
('001a5cdf-ebe5-4720-80f6-f13074954810', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 14:02:59', '2025-11-28 14:02:59'),
('01a477ad-28d4-48f2-8759-5778f7f9d29b', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', 'be164d40-8c7e-49c8-9682-49bc54ccbdb5', 'be164d40-8c7e-49c8-9682-49bc54ccbdb5', NULL, '{\"prescription_id\":\"be164d40-8c7e-49c8-9682-49bc54ccbdb5\",\"prescription_number\":\"RX-20251129-0001\",\"dispense_events\":[{\"dispense_id\":\"234d016c-5943-481b-b52b-45b77eb593aa\",\"medication_name\":\"Amoxicillin 500mg\",\"quantity_dispensed\":21}]}', 'Dispensed medication for prescription RX-20251129-0001', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 10:00:36', '2025-11-29 10:00:36'),
('02079e42-2d12-4827-a4cd-5952bb9cdc8d', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 12:36:48', '2025-11-29 12:36:48'),
('02702403-1992-4370-8ac6-97516084c909', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-21 10:08:12', '2025-11-21 10:08:12'),
('02c47441-cca1-487d-bf49-6afb7d0c6c08', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 12:07:18', '2025-11-29 12:07:18'),
('03392b26-44f2-4c1c-82ad-a6c9906a048c', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 12:20:18', '2025-11-16 12:20:18'),
('03ef3af6-999f-4716-aa81-c965fdc9924c', 'b656634b-477f-4aaa-817d-e0a77f75d88c', 'RAFAEL SANTOS DELA CRUZ', 'patient', 'LOGIN', 'Authentication', 'user', 'b656634b-477f-4aaa-817d-e0a77f75d88c', 'b656634b-477f-4aaa-817d-e0a77f75d88c', NULL, NULL, 'Failed login attempt: Invalid password for rafdelacruz', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-29 11:00:08', '2025-11-29 11:00:08'),
('0694d5ee-ee66-4910-bb11-2ba1a1c67496', 'b656634b-477f-4aaa-817d-e0a77f75d88c', 'RAFAEL SANTOS DELA CRUZ', 'patient', 'LOGIN', 'Authentication', 'user', 'b656634b-477f-4aaa-817d-e0a77f75d88c', 'b656634b-477f-4aaa-817d-e0a77f75d88c', NULL, NULL, 'Successful login: rafdelacruz', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 10:11:28', '2025-11-29 10:11:28'),
('06b72584-f0f3-45de-8080-64494af02a96', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 19:21:37', '2025-11-17 19:21:37'),
('06fdf698-d108-408d-93c4-436d33ae4e0b', '42356bf7-84ef-4aaa-9610-d74b65c3929f', 'Trixie Morales', 'physician', 'LOGIN', 'Authentication', 'user', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '42356bf7-84ef-4aaa-9610-d74b65c3929f', NULL, NULL, 'Successful login: Trixie', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 19:13:26', '2025-11-17 19:13:26'),
('0700e665-8777-4b4c-a556-7be63b53dd51', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 14:59:08', '2025-11-24 14:59:08'),
('07b74ec7-1085-4b03-b7bf-9add2a92726a', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 10:15:44', '2025-11-27 10:15:44'),
('08b06b40-ce5d-4bcf-b188-e7691bac5b3a', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 10:48:30', '2025-11-29 10:48:30'),
('08bbe860-6652-4fd0-ab8f-60a53d770e79', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-26 12:12:27', '2025-11-26 12:12:27'),
('0a26f0f7-d6bf-46cc-8d93-7351bb81943e', 'b656634b-477f-4aaa-817d-e0a77f75d88c', 'RAFAEL SANTOS DELA CRUZ', 'patient', 'LOGIN', 'Authentication', 'user', 'b656634b-477f-4aaa-817d-e0a77f75d88c', 'b656634b-477f-4aaa-817d-e0a77f75d88c', NULL, NULL, 'Failed login attempt: Invalid password for rafdelacruz', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-29 11:00:02', '2025-11-29 11:00:02'),
('0bcac80d-c362-46f6-9576-4809c0d0c6c8', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 01:19:21', '2025-11-28 01:19:21'),
('0bfa5540-e54c-42ef-a596-6f1ae3950ac3', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', 'DELETE', 'Care Tasks', 'care_task', '159c1c55-cfa7-420e-9919-33d5cfda0da3', '159c1c55-cfa7-420e-9919-33d5cfda0da3', '{\"task_id\":\"159c1c55-cfa7-420e-9919-33d5cfda0da3\",\"referral_id\":null,\"patient_id\":\"9380eb9a-4d99-43dc-a1db-364a4067c39a\",\"assignee_id\":\"33333333-3333-3333-3333-333333333333\",\"task_type\":\"counseling\",\"task_description\":\"Follow-up counseling session for adherence\",\"due_date\":\"2025-12-07T16:00:00.000Z\",\"status\":\"pending\",\"completed_at\":null,\"created_at\":\"2025-11-29T01:21:11.000Z\",\"created_by\":\"33333333-3333-3333-3333-333333333333\"}', NULL, 'Deleted care task 159c1c55-cfa7-420e-9919-33d5cfda0da3', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 09:26:58', '2025-11-29 09:26:58'),
('0d2ebaf9-c6f5-41e6-8136-331411f46c5c', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Failed login attempt: Invalid password for Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-24 15:02:44', '2025-11-24 15:02:44'),
('0d4a3684-d109-4e94-a238-040b653eb68e', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 13:41:00', '2025-11-24 13:41:00'),
('0e93accf-e3b4-4906-b047-66813fed44b4', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 09:04:09', '2025-11-19 09:04:09'),
('0f91e41c-ed44-46f0-a635-a144f4fdfda7', '42356bf7-84ef-4aaa-9610-d74b65c3929f', 'Trixie Morales', 'patient', 'CREATE', 'Patients', 'patient', '2fe2674f-5147-4d96-8c68-54caa67efcfc', '2fe2674f-5147-4d96-8c68-54caa67efcfc', NULL, '{\"patient_id\":\"2fe2674f-5147-4d96-8c68-54caa67efcfc\",\"uic\":\"GRJO0110-05-2002\",\"first_name\":\"Trixie\",\"last_name\":\"Morales\",\"email\":\"hannasarabia879@gmail.com\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\"}', 'New patient registered: Trixie Morales (UIC: GRJO0110-05-2002)', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 16:14:27', '2025-11-17 16:14:27'),
('0fa830d3-03c7-413e-b0c0-2fc646d2dbd7', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', '8201188a-a4eb-4677-816f-08e0998056c2', NULL, NULL, NULL, NULL, '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Column \'dosage\' cannot be null', '2025-11-16 14:10:22', '2025-11-16 14:10:22'),
('1036bd54-5528-4981-9f91-6890893a68e8', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 16:08:07', '2025-11-17 16:08:07'),
('1045f743-03c3-4516-ba49-3c8247e991e6', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 14:01:25', '2025-11-28 14:01:25'),
('1050d21a-8bd4-452b-8b01-d9a7c78e7a83', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 13:44:01', '2025-11-28 13:44:01'),
('119f5ade-b725-4c64-a280-49d49a08e76f', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 13:05:07', '2025-11-27 13:05:07'),
('1242239c-0124-41ce-b5b8-deebb9065a79', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'DELETE', 'Lab Orders', 'lab_order', 'e4e5c4d0-e314-4c45-bf8f-bb3cacc27a9c', 'e4e5c4d0-e314-4c45-bf8f-bb3cacc27a9c', '{\"order_id\":\"e4e5c4d0-e314-4c45-bf8f-bb3cacc27a9c\",\"patient_id\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"ordering_provider_id\":\"11111111-1111-1111-1111-111111111111\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"order_date\":\"2025-11-15T16:00:00.000Z\",\"test_panel\":\"Viral Load\",\"priority\":\"urgent\",\"status\":\"in_progress\",\"collection_date\":\"2025-11-15T16:00:00.000Z\",\"notes\":null,\"created_at\":\"2025-11-16T13:35:53.000Z\"}', NULL, 'Cancelled lab order: Viral Load', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 12:26:31', '2025-11-17 12:26:31'),
('12702f6d-a661-40e3-8519-9ffb0803c002', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 13:18:00', '2025-11-28 13:18:00'),
('12d21f9a-8186-4364-9eb4-f55e7b909005', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-26 15:53:04', '2025-11-26 15:53:04'),
('1466e5f1-416a-4927-8491-8b387d5361c1', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 09:34:15', '2025-11-28 09:34:15'),
('1472466c-5aff-421b-b777-2fe173fcdec7', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 11:31:14', '2025-11-27 11:31:14'),
('15e29c92-6176-4615-b37e-fba337c9223b', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 16:41:52', '2025-11-24 16:41:52'),
('163563d4-5e84-4e83-abfe-4ded9a247f29', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'CREATE', 'Counseling Sessions', 'counseling_session', '051d4885-44d1-4770-9cdb-80baa79b3f9e', '051d4885-44d1-4770-9cdb-80baa79b3f9e', NULL, '{\"session_id\":\"051d4885-44d1-4770-9cdb-80baa79b3f9e\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"session_type\":\"adherence\",\"follow_up_required\":false}', 'Recorded adherence counseling session for patient 80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 15:29:34', '2025-11-19 15:29:34'),
('173b2384-b14e-4fde-8cfa-e02db75977e1', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-26 10:46:16', '2025-11-26 10:46:16'),
('181deffe-ea95-49d2-9955-27cf682a0f0a', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 12:30:32', '2025-11-16 12:30:32'),
('18779159-aca4-4b0f-a2f4-76b61f81f173', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 19:33:08', '2025-11-17 19:33:08'),
('18d8e1e8-6648-41ab-9300-15f9f483798b', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'EXPORT', 'Reports', 'report_run', '586ca0f7-5e63-46d8-8cdc-c5252e545c08', '586ca0f7-5e63-46d8-8cdc-c5252e545c08', NULL, '{\"run_id\":\"586ca0f7-5e63-46d8-8cdc-c5252e545c08\",\"report_id\":\"c202c9a7-1f7f-41de-8fd1-ad50e71ecff3\",\"report_type\":\"appointment\",\"reportData\":{\"total_appointments\":7,\"completed_count\":1,\"scheduled_count\":3,\"cancelled_count\":1,\"no_show_count\":0}}', 'Generated appointment report', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 10:16:50', '2025-11-29 10:16:50'),
('1b1667cf-19b6-4703-8f77-a514420efa9d', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', 'LOGIN', 'Authentication', 'user', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', NULL, NULL, 'Successful login: nurse', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 10:32:59', '2025-11-27 10:32:59'),
('1b83fa0d-b4d5-42ea-8fcf-cd878664f5c0', 'unknown', 'Unknown', 'unknown', 'LOGIN', 'Authentication', 'user', NULL, 'cas', NULL, NULL, 'Failed login attempt: Invalid username - cas', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid username or password', '2025-11-19 13:43:40', '2025-11-19 13:43:40'),
('1d49b370-8de5-4fe5-99dc-a26dde6a4d57', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'UPDATE', 'Patients', 'patient', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '{\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"uic\":\"EDDE0106-01-2004\",\"philhealth_no\":null,\"first_name\":\"Hanna\",\"middle_name\":\"N.\",\"last_name\":\"Sarabia\",\"suffix\":null,\"birth_date\":\"2004-05-31T16:00:00.000Z\",\"sex\":\"F\",\"civil_status\":\"Single\",\"nationality\":\"Filipino\",\"current_city\":\"Caloocan\",\"current_province\":\"Metro Manila\",\"current_address\":\"{\\\"city\\\":\\\"Caloocan\\\",\\\"province\\\":\\\"Metro Manila\\\"}\",\"contact_phone\":\"0966-312-2562\",\"email\":\"sarabia.hanna.bsinfotech@gmail.com\",\"mother_name\":\"Edita Narzoles Sarabia\",\"father_name\":\"Delfin Mirano Sarabia\",\"birth_order\":1,\"guardian_name\":null,\"guardian_relationship\":null,\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"arpa_risk_score\":null,\"arpa_last_calculated\":null,\"status\":\"active\",\"created_at\":\"2025-11-17T08:07:51.000Z\",\"updated_at\":\"2025-11-17T08:07:51.000Z\",\"created_by\":\"16bec9d0-6123-4428-b9a3-fea81c3592a0\"}', '{\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"uic\":\"EDDE0106-01-2004\",\"philhealth_no\":null,\"first_name\":\"Hanna\",\"middle_name\":\"Narzoles\",\"last_name\":\"Sarabia\",\"suffix\":null,\"birth_date\":\"2004-05-30T16:00:00.000Z\",\"sex\":\"F\",\"civil_status\":\"Single\",\"nationality\":\"Filipino\",\"current_city\":\"Caloocan\",\"current_province\":\"Metro Manila\",\"current_address\":\"{}\",\"contact_phone\":\"0966-312-2562\",\"email\":\"sarabia.hanna.bsinfotech@gmail.com\",\"mother_name\":\"Edita Narzoles Sarabia\",\"father_name\":\"Delfin Mirano Sarabia\",\"birth_order\":1,\"guardian_name\":null,\"guardian_relationship\":null,\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"arpa_risk_score\":null,\"arpa_last_calculated\":null,\"status\":\"active\",\"created_at\":\"2025-11-17T08:07:51.000Z\",\"updated_at\":\"2025-11-27T17:19:37.000Z\",\"created_by\":\"16bec9d0-6123-4428-b9a3-fea81c3592a0\",\"facility_name\":\"MyHubCares Main Facility\"}', 'Patient updated: Hanna Sarabia (UIC: EDDE0106-01-2004)', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 01:19:37', '2025-11-28 01:19:37'),
('1d517b91-3f2e-44f8-a1c6-9db44f621eb9', 'unknown', 'Unknown', 'unknown', 'LOGIN', 'Authentication', 'user', NULL, 'cas', NULL, NULL, 'Failed login attempt: Invalid username - cas', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid username or password', '2025-11-19 13:43:40', '2025-11-19 13:43:40'),
('1eaf72bc-b94a-447a-8c25-1bdf4783ea9a', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', '8201188a-a4eb-4677-816f-08e0998056c2', NULL, NULL, NULL, NULL, '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'dispense_events is not defined', '2025-11-16 14:22:20', '2025-11-16 14:22:20'),
('2129e890-96a5-4525-9925-b0b9256a0ed4', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 11:42:35', '2025-11-29 11:42:35'),
('213147b3-cafc-4f58-9b3f-4f9f05c17702', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'EXPORT', 'Reports', 'report_run', '8bc18ed7-eef2-4324-8152-6b797ab3fc60', '8bc18ed7-eef2-4324-8152-6b797ab3fc60', NULL, '{\"run_id\":\"8bc18ed7-eef2-4324-8152-6b797ab3fc60\",\"report_id\":\"183c47d9-b77e-4f11-8e60-48fb0da1f889\",\"report_type\":\"adherence\",\"reportData\":{\"avg_adherence\":549.995,\"total_records\":2,\"taken_count\":1,\"missed_count\":1}}', 'Generated adherence report', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-22 12:03:23', '2025-11-22 12:03:23'),
('2203ab8a-fd12-432b-a264-8a0d4c00999e', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-26 11:12:48', '2025-11-26 11:12:48'),
('2204fe53-ada5-4e68-ad5f-f8a314dd9fb6', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 10:35:09', '2025-11-27 10:35:09'),
('2236b126-0d9e-492f-808f-2ec5debb46e1', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-26 08:45:12', '2025-11-26 08:45:12'),
('2308a9a6-83c7-4072-aa46-976749a23d69', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 10:04:09', '2025-11-28 10:04:09'),
('24e0861a-60e1-443f-a079-879bbf24059b', '42356bf7-84ef-4aaa-9610-d74b65c3929f', 'Trixie Morales', 'physician', 'LOGIN', 'Authentication', 'user', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '42356bf7-84ef-4aaa-9610-d74b65c3929f', NULL, NULL, 'Successful login: Trixie', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 14:14:40', '2025-11-28 14:14:40'),
('25fda9ed-7c0a-4a8c-b468-966e35f3b01d', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'UPDATE', 'Clinical Visits', 'clinical_visit', '062cea3c-ff0c-44a5-9879-ec40b501b375', '062cea3c-ff0c-44a5-9879-ec40b501b375', '{\"visit_id\":\"062cea3c-ff0c-44a5-9879-ec40b501b375\",\"patient_id\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"visit_date\":\"2025-11-15T16:00:00.000Z\",\"visit_type\":\"emergency\",\"who_stage\":\"Stage 1\",\"chief_complaint\":\"Fever and body weakness for 2 days\",\"clinical_notes\":\"Patient presented with mild fever, stable vitals.\",\"assessment\":\"Likely viral infection.\",\"plan\":\"Hydration and rest. Paracetamol 500mg every 6 hours.\",\"follow_up_date\":\"2025-11-29T16:00:00.000Z\",\"follow_up_reason\":\"ART refill and viral load test.\",\"created_at\":\"2025-11-16T04:47:06.000Z\",\"updated_at\":\"2025-11-16T04:47:06.000Z\"}', '{\"visit_id\":\"062cea3c-ff0c-44a5-9879-ec40b501b375\",\"patient_id\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"provider_id\":\"11111111-1111-1111-1111-111111111111\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"visit_date\":\"2025-11-14T16:00:00.000Z\",\"visit_type\":\"emergency\",\"who_stage\":\"Stage 1\",\"chief_complaint\":\"Fever and body weakness for 2 days\",\"clinical_notes\":\"Patient presented with mild fever, stable vitals.\",\"assessment\":\"Likely viral infection.\",\"plan\":\"Hydration and rest. Paracetamol 500mg every 6 hours.\",\"follow_up_date\":\"2025-11-28T16:00:00.000Z\",\"follow_up_reason\":\"ART refill and viral load test.\",\"created_at\":\"2025-11-16T04:47:06.000Z\",\"updated_at\":\"2025-11-16T04:50:32.000Z\",\"patientName\":\"Jose Reyes\",\"providerName\":\"System Administrator\",\"facilityName\":\"MyHubCares Main Facility\",\"diagnoses\":[{\"diagnosis_id\":\"53b14af5-6f96-4a40-8749-00175687f846\",\"visit_id\":\"062cea3c-ff0c-44a5-9879-ec40b501b375\",\"icd10_code\":\"J11\",\"diagnosis_description\":\"Influenza due to unidentified influenza virus\",\"diagnosis_type\":\"primary\",\"is_chronic\":0,\"onset_date\":\"2025-01-08T16:00:00.000Z\",\"resolved_date\":\"1899-11-29T16:00:00.000Z\"}],\"procedures\":[]}', 'Updated clinical visit 062cea3c-ff0c-44a5-9879-ec40b501b375', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 12:50:33', '2025-11-16 12:50:33'),
('26116ff3-a253-44e8-a0e6-a933bad76e29', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 08:22:17', '2025-11-29 08:22:17'),
('26c689df-b64e-4426-9829-5e82f7d972c5', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 01:36:32', '2025-11-28 01:36:32'),
('2747f99e-b62b-4928-b673-9e30137877fe', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'CREATE', 'Care Tasks', 'care_task', 'ed9a715e-a12e-4441-a680-cd0e81b5e837', 'ed9a715e-a12e-4441-a680-cd0e81b5e837', NULL, '{\"task_id\":\"ed9a715e-a12e-4441-a680-cd0e81b5e837\",\"patient_id\":\"9380eb9a-4d99-43dc-a1db-364a4067c39a\",\"assignee_id\":\"22222222-2222-2222-2222-222222222222\",\"task_type\":\"follow_up\"}', 'Created follow_up care task for patient 9380eb9a-4d99-43dc-a1db-364a4067c39a', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 09:18:06', '2025-11-29 09:18:06'),
('28697148-0fa5-4705-b089-27838299431e', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'UPDATE', 'Lab Results', 'lab_result', 'i6hh016f-ha88-9h6c-gk64-9gh9i4396549', 'i6hh016f-ha88-9h6c-gk64-9gh9i4396549', '{\"result_id\":\"i6hh016f-ha88-9h6c-gk64-9gh9i4396549\",\"order_id\":\"c3d4e5f6-a7b8-4901-c2d3-e4f5a6b7c8d9\",\"patient_id\":\"16bec9d0-6123-4428-b9a3-fea81c3592a0\",\"test_code\":\"HGB\",\"test_name\":\"Hemoglobin\",\"result_value\":\"13.5\",\"unit\":\"g/dL\",\"reference_range_min\":\"12.00\",\"reference_range_max\":\"15.50\",\"reference_range_text\":\"12.0-15.5 g/dL (Female)\",\"is_critical\":0,\"critical_alert_sent\":0,\"collected_at\":\"2025-11-20T16:00:00.000Z\",\"reported_at\":\"2025-11-20T16:00:00.000Z\",\"reviewed_at\":null,\"reviewer_id\":null,\"notes\":\"Pending review\",\"created_at\":\"2025-11-21T03:00:00.000Z\",\"created_by\":\"55555555-5555-5555-5555-555555555555\"}', '{\"result_id\":\"i6hh016f-ha88-9h6c-gk64-9gh9i4396549\",\"order_id\":\"c3d4e5f6-a7b8-4901-c2d3-e4f5a6b7c8d9\",\"patient_id\":\"16bec9d0-6123-4428-b9a3-fea81c3592a0\",\"test_code\":\"HGB\",\"test_name\":\"Other\",\"result_value\":\"13.5\",\"unit\":\"g/dL\",\"reference_range_min\":\"12.00\",\"reference_range_max\":\"15.50\",\"reference_range_text\":\"12.0-15.5 g/dL (Female)\",\"is_critical\":0,\"critical_alert_sent\":0,\"collected_at\":\"2025-11-19T16:00:00.000Z\",\"reported_at\":\"2025-11-28T16:00:00.000Z\",\"reviewed_at\":null,\"reviewer_id\":null,\"notes\":\"Pending review\",\"created_at\":\"2025-11-21T03:00:00.000Z\",\"created_by\":\"55555555-5555-5555-5555-555555555555\",\"patient_name\":null,\"created_by_name\":\"Ana Rodriguez\",\"reviewer_name\":null,\"order_test_panel\":\"Complete Blood Count\",\"order_date\":\"2025-11-20T16:00:00.000Z\"}', 'Updated lab result: Other', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 08:41:27', '2025-11-29 08:41:27'),
('28ba0946-c233-4946-aaa8-ea516662b4f8', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', '8201188a-a4eb-4677-816f-08e0998056c2', NULL, NULL, NULL, NULL, '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Column \'dosage\' cannot be null', '2025-11-16 14:12:27', '2025-11-16 14:12:27'),
('29cd3cc2-d27f-4cdd-9ee7-b29fddc682cb', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Failed login attempt: Invalid password for patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-29 11:02:48', '2025-11-29 11:02:48'),
('2b17f97c-2ffa-4f92-bd9a-12843ae47c14', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 10:10:51', '2025-11-28 10:10:51'),
('2b681aa0-f806-4bcb-8236-9d3221310796', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', 'Hanna N. Sarabia', 'admin', 'UPDATE', 'Clinical Visits', 'clinical_visit', '3202ceae-5caf-4a5b-8eb9-b087f9679d51', '3202ceae-5caf-4a5b-8eb9-b087f9679d51', '{\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"provider_id\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\",\"facility_id\":\"7092d90f-5986-44fc-a56d-87abbf6b003d\",\"visit_date\":\"2025-11-14T16:00:00.000Z\",\"visit_type\":\"follow_up\",\"who_stage\":\"Stage 2\",\"chief_complaint\":\"dadas\",\"clinical_notes\":\"\",\"assessment\":\"dasdaa\",\"plan\":\"dasda\",\"follow_up_date\":null,\"follow_up_reason\":\"dfsdfds\",\"created_at\":\"2025-11-15T04:54:11.000Z\",\"updated_at\":\"2025-11-15T04:54:11.000Z\"}', '{\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"provider_id\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\",\"facility_id\":\"7092d90f-5986-44fc-a56d-87abbf6b003d\",\"visit_date\":\"2025-11-13T16:00:00.000Z\",\"visit_type\":\"follow_up\",\"who_stage\":\"Stage 2\",\"chief_complaint\":\"dadas\",\"clinical_notes\":\"\",\"assessment\":\"dasdaa\",\"plan\":\"dasda\",\"follow_up_date\":null,\"follow_up_reason\":\"dfsdfds\",\"created_at\":\"2025-11-15T04:54:11.000Z\",\"updated_at\":\"2025-11-15T05:25:43.000Z\"}', 'Updated clinical visit 3202ceae-5caf-4a5b-8eb9-b087f9679d51', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-15 13:25:43', '2025-11-15 13:25:43'),
('2b8185ec-dbc6-4414-b62f-26aeac3990f5', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'CREATE', 'Lab Orders', 'lab_order', 'e3768174-a8b4-41f0-8579-83038959c1a5', 'e3768174-a8b4-41f0-8579-83038959c1a5', NULL, '{\"order_id\":\"e3768174-a8b4-41f0-8579-83038959c1a5\",\"patient_id\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"test_panel\":\"CD4 Count\",\"priority\":\"routine\",\"status\":\"ordered\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\"}', 'Created lab order: CD4 Count for patient aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 12:28:23', '2025-11-17 12:28:23'),
('2c416a0b-7001-4c92-8dce-292d193a4cbe', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', 'Hanna N. Sarabia', 'admin', 'UPDATE', 'Clinical Visits', 'clinical_visit', '3202ceae-5caf-4a5b-8eb9-b087f9679d51', '3202ceae-5caf-4a5b-8eb9-b087f9679d51', '{\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"provider_id\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\",\"facility_id\":\"7092d90f-5986-44fc-a56d-87abbf6b003d\",\"visit_date\":\"2025-11-10T16:00:00.000Z\",\"visit_type\":\"follow_up\",\"who_stage\":\"Stage 2\",\"chief_complaint\":\"dadas\",\"clinical_notes\":\"\",\"assessment\":\"dasdaa\",\"plan\":\"dasda\",\"follow_up_date\":\"2025-10-30T16:00:00.000Z\",\"follow_up_reason\":\"Laging Galit sa buhay\",\"created_at\":\"2025-11-15T04:54:11.000Z\",\"updated_at\":\"2025-11-15T08:15:10.000Z\"}', '{\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"provider_id\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\",\"facility_id\":\"7092d90f-5986-44fc-a56d-87abbf6b003d\",\"visit_date\":\"2025-11-09T16:00:00.000Z\",\"visit_type\":\"follow_up\",\"who_stage\":\"Stage 2\",\"chief_complaint\":\"dadas\",\"clinical_notes\":\"\",\"assessment\":\"dasdaa\",\"plan\":\"dasda\",\"follow_up_date\":\"2025-10-29T16:00:00.000Z\",\"follow_up_reason\":\"Laging Galit sa buhay\",\"created_at\":\"2025-11-15T04:54:11.000Z\",\"updated_at\":\"2025-11-15T08:15:23.000Z\"}', 'Updated clinical visit 3202ceae-5caf-4a5b-8eb9-b087f9679d51', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-15 16:15:23', '2025-11-15 16:15:23'),
('2ce2d020-9049-4e84-8542-9907fcb85ef1', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Failed login attempt: Invalid password for Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-28 14:02:56', '2025-11-28 14:02:56'),
('2cfa287e-c446-48d8-8bc9-035773f59e8c', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', 'LOGIN', 'Authentication', 'user', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', NULL, NULL, 'Successful login: nurse', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 14:21:27', '2025-11-16 14:21:27'),
('2d133257-d73c-4be0-9d97-5f6ebb9dbaa6', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 13:53:40', '2025-11-17 13:53:40'),
('2d35cf9e-1a07-48b2-87d6-7814aa8986fb', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 12:53:46', '2025-11-16 12:53:46'),
('2d819132-10fd-44bf-836b-50c6d5061a84', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 13:38:20', '2025-11-19 13:38:20'),
('2dc5ffc1-0eb1-4108-b20f-6c4b9a2033f0', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', 'LOGIN', 'Authentication', 'user', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', NULL, NULL, 'Successful login: nurse', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 12:58:22', '2025-11-16 12:58:22'),
('2e8d2f7c-c1b9-4e51-ad7d-8a8fd3d8d957', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 09:23:14', '2025-11-19 09:23:14'),
('2f201b7a-e0bf-48a5-979d-65ec14c26ec4', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'DELETE', 'Roles', 'role_permission', 'rp-pat-0001-0001-0001-000000000001', 'rp-pat-0001-0001-0001-000000000001', '{\"role_id\":\"role-0000-0000-0000-000000000006\",\"permission_id\":\"perm-0000-0000-0000-000000000002\"}', NULL, 'Revoked permission \"View Patient\" from role \"Patient\"', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 10:26:19', '2025-11-27 10:26:19'),
('2f337c7b-d43c-4e8d-a619-22ead07b97dd', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 10:35:26', '2025-11-29 10:35:26'),
('2faf41a2-ae45-4048-9f51-a998773e1189', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 18:28:33', '2025-11-17 18:28:33'),
('301a1fe1-7c05-42f6-a9db-0fad7b7d21c0', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', 'Hanna N. Sarabia', 'admin', 'LOGIN', 'Authentication', 'user', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', NULL, NULL, 'Successful login: hanapot', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-15 20:34:26', '2025-11-15 20:34:26'),
('30293c9a-e50a-43ab-9fd9-267a4b4a6044', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', 'Hanna N. Sarabia', 'admin', 'UPDATE', 'Clinical Visits', 'clinical_visit', '3202ceae-5caf-4a5b-8eb9-b087f9679d51', '3202ceae-5caf-4a5b-8eb9-b087f9679d51', '{\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"provider_id\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\",\"facility_id\":\"7092d90f-5986-44fc-a56d-87abbf6b003d\",\"visit_date\":\"2025-11-12T16:00:00.000Z\",\"visit_type\":\"follow_up\",\"who_stage\":\"Stage 2\",\"chief_complaint\":\"dadas\",\"clinical_notes\":\"\",\"assessment\":\"dasdaa\",\"plan\":\"dasda\",\"follow_up_date\":\"2025-11-01T16:00:00.000Z\",\"follow_up_reason\":\"Laging Galit sa buhay\",\"created_at\":\"2025-11-15T04:54:11.000Z\",\"updated_at\":\"2025-11-15T08:09:16.000Z\"}', '{\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"provider_id\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\",\"facility_id\":\"7092d90f-5986-44fc-a56d-87abbf6b003d\",\"visit_date\":\"2025-11-11T16:00:00.000Z\",\"visit_type\":\"follow_up\",\"who_stage\":\"Stage 2\",\"chief_complaint\":\"dadas\",\"clinical_notes\":\"\",\"assessment\":\"dasdaa\",\"plan\":\"dasda\",\"follow_up_date\":\"2025-10-31T16:00:00.000Z\",\"follow_up_reason\":\"Laging Galit sa buhay\",\"created_at\":\"2025-11-15T04:54:11.000Z\",\"updated_at\":\"2025-11-15T08:14:51.000Z\"}', 'Updated clinical visit 3202ceae-5caf-4a5b-8eb9-b087f9679d51', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-15 16:14:51', '2025-11-15 16:14:51'),
('3199d52a-a871-4f74-9919-ba853ca036d3', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 02:16:46', '2025-11-28 02:16:46'),
('31f090ff-bed9-466b-ae7c-c80dd9e74380', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 18:31:30', '2025-11-27 18:31:30'),
('325c9f41-9a72-4c66-96a2-da65ac58f7b3', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', 'LOGIN', 'Authentication', 'user', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', NULL, NULL, 'Successful login: nurse', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 09:18:31', '2025-11-29 09:18:31'),
('32c5605b-8290-4fe1-a3aa-bf26fa51235d', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', 'LOGIN', 'Authentication', 'user', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', NULL, NULL, 'Successful login: nurse', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 09:23:20', '2025-11-24 09:23:20'),
('32efcaac-cd42-4e7e-885e-d8c55534bffb', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 12:35:20', '2025-11-29 12:35:20'),
('332813ef-25e0-4f67-add9-937e2b5a06ce', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-26 15:20:31', '2025-11-26 15:20:31'),
('3351bc01-c6c2-4852-82eb-4820519aa91e', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 15:12:25', '2025-11-24 15:12:25');
INSERT INTO `audit_log` (`audit_id`, `user_id`, `user_name`, `user_role`, `action`, `module`, `entity_type`, `entity_id`, `record_id`, `old_value`, `new_value`, `change_summary`, `ip_address`, `device_type`, `user_agent`, `remarks`, `status`, `error_message`, `timestamp`, `created_at`) VALUES
('335e32c3-01d1-427a-90db-27dcbbfda2d9', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Failed login attempt: Invalid password for admin', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-16 12:47:44', '2025-11-16 12:47:44'),
('33bc12d2-c478-4a78-90ba-ee3e39c67525', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 15:33:23', '2025-11-17 15:33:23'),
('33ffb098-b117-49a7-876b-ff5beceb0f92', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', '8201188a-a4eb-4677-816f-08e0998056c2', NULL, NULL, NULL, NULL, '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Column \'dosage\' cannot be null', '2025-11-16 14:12:41', '2025-11-16 14:12:41'),
('348f28e0-659f-4c75-818c-d8d0db7a5f7f', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', 'LOGIN', 'Authentication', 'user', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', NULL, NULL, 'Successful login: nurse', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 09:23:21', '2025-11-29 09:23:21'),
('3552ea11-9df7-4fc3-b06b-5a404df70bea', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', '8201188a-a4eb-4677-816f-08e0998056c2', '8201188a-a4eb-4677-816f-08e0998056c2', NULL, '{\"prescription_id\":\"8201188a-a4eb-4677-816f-08e0998056c2\",\"prescription_number\":\"RX-20251116-0001\",\"dispense_events\":[{\"dispense_id\":\"69c4d690-0433-4f6e-966a-efa5187c0537\",\"medication_name\":\"Efavirenz 600mg\",\"quantity_dispensed\":1}]}', 'Dispensed medication for prescription RX-20251116-0001', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 14:22:19', '2025-11-16 14:22:19'),
('3577cd27-3057-4e60-beac-b2d7375c3a4a', 'b656634b-477f-4aaa-817d-e0a77f75d88c', 'RAFAEL SANTOS DELA CRUZ', 'patient', 'LOGIN', 'Authentication', 'user', 'b656634b-477f-4aaa-817d-e0a77f75d88c', 'b656634b-477f-4aaa-817d-e0a77f75d88c', NULL, NULL, 'Successful login: rafdelacruz', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 10:01:36', '2025-11-29 10:01:36'),
('3612fcb6-8e31-4340-adb8-80bffdc036ab', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'CREATE', 'Roles', 'role_permission', '9bf242fe-58ca-44e5-96ec-bd99d76759fe', '9bf242fe-58ca-44e5-96ec-bd99d76759fe', NULL, '{\"role_id\":\"role-0000-0000-0000-000000000006\",\"permission_id\":\"perm-0000-0000-0000-000000000014\"}', 'Granted permission \"View Prescription\" to role \"Patient\"', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 18:43:04', '2025-11-27 18:43:04'),
('362b2dbd-ec21-4ad2-bb74-4fd5e02736e2', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 15:26:19', '2025-11-28 15:26:19'),
('363da33a-7a46-4cae-ae65-60c3fb2bd5b9', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 09:16:00', '2025-11-29 09:16:00'),
('36dbc4d7-3571-4bf9-ad24-f1fb6bb4a03b', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', '8201188a-a4eb-4677-816f-08e0998056c2', '8201188a-a4eb-4677-816f-08e0998056c2', NULL, '{\"prescription_id\":\"8201188a-a4eb-4677-816f-08e0998056c2\",\"prescription_number\":\"RX-20251116-0001\",\"dispense_events\":[{\"dispense_id\":\"d21ee17d-42f9-41b4-8d7e-ca12065de34f\",\"medication_name\":\"Efavirenz 600mg\",\"quantity_dispensed\":4}]}', 'Dispensed medication for prescription RX-20251116-0001', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 14:45:22', '2025-11-16 14:45:22'),
('37759c56-3f36-46fd-8e32-64dc5de3c2cd', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Failed login attempt: Invalid password for patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-17 15:31:19', '2025-11-17 15:31:19'),
('37a34eab-3619-499d-8d6b-133ccdaaf59c', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 14:16:40', '2025-11-17 14:16:40'),
('37c2b83c-80a2-4391-a554-0a9ec483538a', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'UPDATE', 'Lab Results', 'lab_result', 'i6hh016f-ha88-9h6c-gk64-9gh9i4396549', 'i6hh016f-ha88-9h6c-gk64-9gh9i4396549', '{\"result_id\":\"i6hh016f-ha88-9h6c-gk64-9gh9i4396549\",\"order_id\":\"c3d4e5f6-a7b8-4901-c2d3-e4f5a6b7c8d9\",\"patient_id\":\"16bec9d0-6123-4428-b9a3-fea81c3592a0\",\"test_code\":\"HGB\",\"test_name\":\"Other\",\"result_value\":\"13.5\",\"unit\":\"g/dL\",\"reference_range_min\":\"12.00\",\"reference_range_max\":\"15.50\",\"reference_range_text\":\"12.0-15.5 g/dL (Female)\",\"is_critical\":0,\"critical_alert_sent\":0,\"collected_at\":\"2025-11-19T16:00:00.000Z\",\"reported_at\":\"2025-11-28T16:00:00.000Z\",\"reviewed_at\":null,\"reviewer_id\":null,\"notes\":\"Pending review\",\"created_at\":\"2025-11-21T03:00:00.000Z\",\"created_by\":\"55555555-5555-5555-5555-555555555555\"}', '{\"result_id\":\"i6hh016f-ha88-9h6c-gk64-9gh9i4396549\",\"order_id\":\"c3d4e5f6-a7b8-4901-c2d3-e4f5a6b7c8d9\",\"patient_id\":\"16bec9d0-6123-4428-b9a3-fea81c3592a0\",\"test_code\":\"HGB\",\"test_name\":\"Other\",\"result_value\":\"13.5\",\"unit\":\"g/dL\",\"reference_range_min\":\"12.00\",\"reference_range_max\":\"15.50\",\"reference_range_text\":\"12.0-15.5 g/dL (Female)\",\"is_critical\":0,\"critical_alert_sent\":0,\"collected_at\":\"2025-11-18T16:00:00.000Z\",\"reported_at\":\"2025-11-28T16:00:00.000Z\",\"reviewed_at\":null,\"reviewer_id\":null,\"notes\":\"Pending review\",\"created_at\":\"2025-11-21T03:00:00.000Z\",\"created_by\":\"55555555-5555-5555-5555-555555555555\",\"patient_name\":null,\"created_by_name\":\"Ana Rodriguez\",\"reviewer_name\":null,\"order_test_panel\":\"Complete Blood Count\",\"order_date\":\"2025-11-20T16:00:00.000Z\"}', 'Updated lab result: Other', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 08:42:09', '2025-11-29 08:42:09'),
('39253fa4-3d86-43a2-9d94-1d1a3f8a44d5', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'EXPORT', 'Reports', 'report_run', 'bee78826-9f90-4d94-b7e7-b8b9fedbc4b0', 'bee78826-9f90-4d94-b7e7-b8b9fedbc4b0', NULL, '{\"run_id\":\"bee78826-9f90-4d94-b7e7-b8b9fedbc4b0\",\"report_id\":\"3abccdc0-6f7f-4bef-ac22-251c142149a8\",\"report_type\":\"patient\",\"reportData\":{\"total_patients\":3,\"male_count\":1,\"female_count\":2}}', 'Generated patient report', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-22 12:03:23', '2025-11-22 12:03:23'),
('393d0f7e-4a89-4952-a54e-339b23d3fe7b', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 08:58:14', '2025-11-19 08:58:14'),
('398a8f06-b2f9-4964-85b8-9e920d767e32', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 20:36:51', '2025-11-17 20:36:51'),
('3a49989a-ac38-4024-81be-1db23d52fc0f', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'CREATE', 'Roles', 'role_permission', '095503a3-1759-45fe-a1b8-6321cf916871', '095503a3-1759-45fe-a1b8-6321cf916871', NULL, '{\"role_id\":\"role-0000-0000-0000-000000000004\",\"permission_id\":\"perm-0000-0000-0000-000000000017\"}', 'Granted permission \"Create Appointment\" to role \"Case Manager\"', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 12:28:13', '2025-11-16 12:28:13'),
('3c780443-578d-41a3-ade0-93f333f33ffa', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-21 10:16:21', '2025-11-21 10:16:21'),
('3e286ad7-76ac-49b4-b5d2-9f661991f52d', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 09:57:31', '2025-11-29 09:57:31'),
('3f7fa6ee-55b8-4cf0-9df5-89966a23a579', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 02:24:30', '2025-11-28 02:24:30'),
('3ff8a670-c70e-433d-979d-3ae670724b0e', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 11:30:43', '2025-11-27 11:30:43'),
('404dc825-1145-4251-83b0-e847dc96a162', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 15:45:45', '2025-11-17 15:45:45'),
('40e61db6-115c-43d1-a303-8e61fcd85856', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 15:02:50', '2025-11-24 15:02:50'),
('4173c5a7-eece-4898-ad9d-a2fe47d390cc', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 11:09:46', '2025-11-28 11:09:46'),
('41aa8586-5d13-4770-9f3d-8a92d3456e0f', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', '8201188a-a4eb-4677-816f-08e0998056c2', '8201188a-a4eb-4677-816f-08e0998056c2', NULL, '{\"prescription_id\":\"8201188a-a4eb-4677-816f-08e0998056c2\",\"prescription_number\":\"RX-20251116-0001\",\"dispense_events\":[{\"dispense_id\":\"4fe503a0-a9c0-4a4d-b3e5-8c199d274e07\",\"medication_name\":\"Efavirenz 600mg\",\"quantity_dispensed\":12}]}', 'Dispensed medication for prescription RX-20251116-0001', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 14:40:56', '2025-11-16 14:40:56'),
('4225f2b2-ee60-4fc9-ae6a-dd9456df818a', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 12:01:46', '2025-11-16 12:01:46'),
('42b0e3b3-93ec-4d60-94dd-7157442e40a1', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 18:26:59', '2025-11-28 18:26:59'),
('42dac1ab-8f66-4016-8abd-285c02ee3c04', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 14:40:42', '2025-11-17 14:40:42'),
('437a7d40-2a87-4a02-9a30-a2f796f12034', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 14:12:20', '2025-11-28 14:12:20'),
('43a14cf0-539f-4d19-bc95-52129af08409', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'UPDATE', 'Clinical Visits', 'clinical_visit', '062cea3c-ff0c-44a5-9879-ec40b501b375', '062cea3c-ff0c-44a5-9879-ec40b501b375', '{\"visit_id\":\"062cea3c-ff0c-44a5-9879-ec40b501b375\",\"patient_id\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"provider_id\":\"11111111-1111-1111-1111-111111111111\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"visit_date\":\"2025-11-14T16:00:00.000Z\",\"visit_type\":\"emergency\",\"who_stage\":\"Stage 1\",\"chief_complaint\":\"Fever and body weakness for 2 days\",\"clinical_notes\":\"Patient presented with mild fever, stable vitals.\",\"assessment\":\"Likely viral infection.\",\"plan\":\"Hydration and rest. Paracetamol 500mg every 6 hours.\",\"follow_up_date\":\"2025-11-28T16:00:00.000Z\",\"follow_up_reason\":\"ART refill and viral load test.\",\"created_at\":\"2025-11-16T04:47:06.000Z\",\"updated_at\":\"2025-11-16T04:50:32.000Z\"}', '{\"visit_id\":\"062cea3c-ff0c-44a5-9879-ec40b501b375\",\"patient_id\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"provider_id\":\"11111111-1111-1111-1111-111111111111\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"visit_date\":\"2025-11-13T16:00:00.000Z\",\"visit_type\":\"emergency\",\"who_stage\":\"Stage 1\",\"chief_complaint\":\"Fever and body weakness for 2 days\",\"clinical_notes\":\"Patient presented with mild fever, stable vitals.\",\"assessment\":\"Likely viral infection.\",\"plan\":\"Hydration and rest. Paracetamol 500mg every 6 hours.\",\"follow_up_date\":\"2025-11-27T16:00:00.000Z\",\"follow_up_reason\":\"ART refill and viral load test.\",\"created_at\":\"2025-11-16T04:47:06.000Z\",\"updated_at\":\"2025-11-16T04:51:55.000Z\",\"patientName\":\"Jose Reyes\",\"providerName\":\"System Administrator\",\"facilityName\":\"MyHubCares Main Facility\",\"diagnoses\":[{\"diagnosis_id\":\"53b14af5-6f96-4a40-8749-00175687f846\",\"visit_id\":\"062cea3c-ff0c-44a5-9879-ec40b501b375\",\"icd10_code\":\"J11\",\"diagnosis_description\":\"Influenza due to unidentified influenza virus\",\"diagnosis_type\":\"primary\",\"is_chronic\":0,\"onset_date\":\"2025-01-07T16:00:00.000Z\",\"resolved_date\":\"1899-11-28T16:00:00.000Z\"}],\"procedures\":[{\"procedure_id\":\"4b7f8aef-abfc-42dc-beb5-580148c154a3\",\"visit_id\":\"062cea3c-ff0c-44a5-9879-ec40b501b375\",\"cpt_code\":\"71045\",\"procedure_name\":\"Chest X-ray\",\"procedure_description\":\"Standard PA chest radiograph performed.\",\"outcome\":\"No acute findings.\",\"performed_at\":\"2025-11-15T20:49:00.000Z\"}]}', 'Updated clinical visit 062cea3c-ff0c-44a5-9879-ec40b501b375', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 12:51:56', '2025-11-16 12:51:56'),
('43ad63f9-d4f3-4e09-bd29-c0203c585abb', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'UPDATE', 'Care Tasks', 'care_task', 'dd9cbd0b-1a7d-40a1-8a86-d83f4c60d04e', 'dd9cbd0b-1a7d-40a1-8a86-d83f4c60d04e', '{\"status\":\"pending\"}', '{\"status\":\"in_progress\"}', 'Updated care task status to in_progress', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-22 12:10:21', '2025-11-22 12:10:21'),
('4403476e-ef67-4257-a6a7-cb6a64dcf4a3', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-18 23:43:01', '2025-11-18 23:43:01'),
('4411b606-8b89-4b14-a6f7-335794d3f07c', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 08:52:01', '2025-11-28 08:52:01'),
('4416d4d0-4ec6-4424-b681-ec910a7253f0', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 02:06:13', '2025-11-28 02:06:13'),
('44b668f6-1cf1-4209-b7e3-e549c3a7a33f', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 11:54:39', '2025-11-28 11:54:39'),
('44cb955c-04e3-45ba-a57e-0644864c9b58', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 08:57:29', '2025-11-24 08:57:29'),
('44faf7d8-a243-4514-b367-4007e115db8b', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 11:34:05', '2025-11-29 11:34:05'),
('458a7bac-5982-410e-bda5-a37e81b25924', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', 'trixie', 'physician', 'LOGIN', 'Authentication', 'user', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', NULL, NULL, 'Failed login attempt: Invalid password for trixie', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-15 20:33:38', '2025-11-15 20:33:38'),
('4601c975-c507-4da6-82ce-c99207844433', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 18:19:15', '2025-11-17 18:19:15'),
('473a1607-84bf-4f4d-91a3-68500176c7c3', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 12:10:07', '2025-11-28 12:10:07'),
('49125105-a417-4bef-a0f2-6ff452301c75', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Failed login attempt: Invalid password for Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-18 23:42:55', '2025-11-18 23:42:55'),
('497c3459-149a-4283-91ea-f2ad8663fff3', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 16:20:02', '2025-11-17 16:20:02'),
('49eea78f-f34a-47ba-83d9-a48a7181ba64', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', 'CREATE', 'Counseling Sessions', 'counseling_session', 'cb6c28b7-8911-4d51-83d2-553fbea29473', 'cb6c28b7-8911-4d51-83d2-553fbea29473', NULL, '{\"session_id\":\"cb6c28b7-8911-4d51-83d2-553fbea29473\",\"patient_id\":\"9380eb9a-4d99-43dc-a1db-364a4067c39a\",\"session_type\":\"adherence\",\"follow_up_required\":true}', 'Recorded adherence counseling session for patient 9380eb9a-4d99-43dc-a1db-364a4067c39a', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 09:21:11', '2025-11-29 09:21:11'),
('4aa4afce-3305-4232-a8d4-ffcfeb7c75f8', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 12:26:10', '2025-11-17 12:26:10'),
('4b26b39b-d26e-4a29-b80e-7a1edd9876a2', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 10:09:17', '2025-11-28 10:09:17'),
('4b828e1a-8716-48ec-9ad8-e11786c609db', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 09:17:16', '2025-11-29 09:17:16'),
('4b8dfd04-2b6b-4120-bfab-cf0a8a7ec2f9', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 12:43:33', '2025-11-16 12:43:33'),
('4c1982eb-8306-4746-8c17-1fbafa7bf7bb', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', '8201188a-a4eb-4677-816f-08e0998056c2', '8201188a-a4eb-4677-816f-08e0998056c2', NULL, '{\"prescription_id\":\"8201188a-a4eb-4677-816f-08e0998056c2\",\"prescription_number\":\"RX-20251116-0001\",\"dispense_events\":[{\"dispense_id\":\"18b81369-0723-475c-848d-1e42635e36ee\",\"medication_name\":\"Efavirenz 600mg\",\"quantity_dispensed\":10}]}', 'Dispensed medication for prescription RX-20251116-0001', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 14:16:37', '2025-11-16 14:16:37'),
('4c2fa568-c626-4e82-afc7-9a0589266398', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'CREATE', 'Prescriptions', 'prescription', 'be164d40-8c7e-49c8-9682-49bc54ccbdb5', 'be164d40-8c7e-49c8-9682-49bc54ccbdb5', NULL, '{\"prescription_id\":\"be164d40-8c7e-49c8-9682-49bc54ccbdb5\",\"prescription_number\":\"RX-20251129-0001\",\"patient_id\":\"9380eb9a-4d99-43dc-a1db-364a4067c39a\",\"prescriber_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"items\":[{\"prescription_item_id\":\"88d8ee78-b4d9-4437-8774-0c4e66e61e29\",\"medication_id\":\"med-0006-0000-0000-000000000006\",\"quantity\":21}]}', 'Created prescription RX-20251129-0001 for patient RAFAEL DELA CRUZ', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 09:59:09', '2025-11-29 09:59:09'),
('4de5789e-eafb-48ad-8381-33d7269830aa', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Failed login attempt: Invalid password for physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'failed', 'Invalid password', '2025-11-27 11:20:19', '2025-11-27 11:20:19'),
('4e23622f-e31c-4627-9b8b-28caae8cc51d', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 13:37:15', '2025-11-28 13:37:15'),
('4e748478-17b5-48da-9a42-47148e04bc1a', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 16:30:41', '2025-11-17 16:30:41'),
('4e82956c-5c54-4d09-ae1d-c80b2be1732e', 'unknown', 'Unknown', 'unknown', 'LOGIN', 'Authentication', 'user', NULL, 'cas', NULL, NULL, 'Failed login attempt: Invalid username - cas', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid username or password', '2025-11-19 13:43:39', '2025-11-19 13:43:39'),
('4ebc1e34-f406-4f54-bc56-cdf098611eac', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 15:25:07', '2025-11-16 15:25:07'),
('50d80850-021e-4116-96fd-d33883120e59', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 14:14:20', '2025-11-28 14:14:20'),
('5159b2d3-92a2-4414-b73f-d1d7dfd15844', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-22 12:03:09', '2025-11-22 12:03:09'),
('519ad823-2e55-4f23-9648-2d9bee1b1df5', 'b656634b-477f-4aaa-817d-e0a77f75d88c', 'RAFAEL SANTOS DELA CRUZ', 'patient', 'LOGIN', 'Authentication', 'user', 'b656634b-477f-4aaa-817d-e0a77f75d88c', 'b656634b-477f-4aaa-817d-e0a77f75d88c', NULL, NULL, 'Successful login: rafdelacruz', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 11:00:22', '2025-11-29 11:00:22'),
('51dc7183-c72c-4a3c-b8a7-16adc7e976f0', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'CREATE', 'SURVEYS', 'survey_response', 'db4373fe-c403-4a2d-a4bf-ae0f1d9147ef', 'Survey-db4373fe', NULL, '{\"patient_id\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440002\",\"overall_satisfaction\":\"very_happy\",\"staff_friendliness\":2,\"wait_time\":2,\"facility_cleanliness\":3,\"would_recommend\":\"maybe\",\"average_score\":\"2.33\"}', 'Survey submitted for patient aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 09:02:39', '2025-11-24 09:02:39'),
('520cfe8d-ad8c-4f5e-90c2-c8e980d81703', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Failed login attempt: Invalid password for case_manager', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-17 18:10:00', '2025-11-17 18:10:00'),
('52389eeb-8fbf-46ff-ae8d-3a6a11fa97cc', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', 'trixie', 'physician', 'CREATE', 'Prescriptions', 'prescription', 'ccf55302-ea8b-464c-92e7-883a5e32a008', 'ccf55302-ea8b-464c-92e7-883a5e32a008', NULL, '{\"prescription_id\":\"ccf55302-ea8b-464c-92e7-883a5e32a008\",\"prescription_number\":\"RX-20251116-0001\",\"patient_id\":\"7db2ecfb-e409-41f3-a632-b5db0d4f868b\",\"prescriber_id\":\"3fdb00a0-7774-40f1-96f6-7d4c179bcd93\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440002\",\"items\":[{\"prescription_item_id\":\"5d38050a-bb52-492a-85c2-d354ea909683\",\"medication_id\":\"65af6445-7630-4a2b-8851-d43fb66807ab\",\"quantity\":1}]}', 'Created prescription RX-20251116-0001 for patient Hanna Sarabia', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 11:38:14', '2025-11-16 11:38:14'),
('52e54d30-1b24-42db-b0d2-ce7beeeab5f3', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 12:34:36', '2025-11-29 12:34:36'),
('537a76b7-0785-4da4-9d93-0a5f26555a1d', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'CREATE', 'Inventory', 'medication_inventory', 'f8788bf9-153b-4599-b162-3daee7bd95cb', 'f8788bf9-153b-4599-b162-3daee7bd95cb', NULL, '{\"inventory_id\":\"f8788bf9-153b-4599-b162-3daee7bd95cb\",\"medication_id\":\"65af6445-7630-4a2b-8851-d43fb66807ab\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"quantity_on_hand\":200,\"reorder_level\":50,\"expiry_date\":\"2027-11-16\"}', 'Added inventory for Tenofovir/Lamivudine/Dolutegravir (TLD) at MyHubCares Main Facility', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 12:48:51', '2025-11-16 12:48:51'),
('541c3160-8d9d-4b76-b57c-e3765fe61b40', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'EXPORT', 'Reports', 'report_run', '94e53705-30e0-4a95-a58e-4b7569896ac1', '94e53705-30e0-4a95-a58e-4b7569896ac1', NULL, '{\"run_id\":\"94e53705-30e0-4a95-a58e-4b7569896ac1\",\"report_id\":\"rpt-0003-0000-0000-000000000003\",\"report_type\":\"inventory\",\"reportData\":{\"total_items\":10,\"total_stock\":\"4417\",\"low_stock_count\":0,\"expiring_soon_count\":0}}', 'Generated inventory report', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 10:16:49', '2025-11-29 10:16:49'),
('553efd0d-d413-4929-9f3b-c18799f88b79', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 19:19:44', '2025-11-16 19:19:44'),
('558436a7-45a0-4176-858c-997fd6c4796f', '42356bf7-84ef-4aaa-9610-d74b65c3929f', 'Trixie Morales', 'physician', 'LOGIN', 'Authentication', 'user', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '42356bf7-84ef-4aaa-9610-d74b65c3929f', NULL, NULL, 'Successful login: Trixie', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 15:05:39', '2025-11-24 15:05:39'),
('55939095-e654-48ed-8755-62f03c1bdf68', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'CREATE', 'Lab Files', 'lab_file', '9573db2c-7c7c-4e96-9de9-eac49eaae743', '9573db2c-7c7c-4e96-9de9-eac49eaae743', NULL, '{\"file_id\":\"9573db2c-7c7c-4e96-9de9-eac49eaae743\",\"result_id\":\"d1cc561a-c533-4c17-bf09-4bc4d9841094\",\"file_name\":\"545832021_1689460425052578_6722400524695115105_n.jpg\",\"file_size\":165137}', 'Uploaded lab file: 545832021_1689460425052578_6722400524695115105_n.jpg for result d1cc561a-c533-4c17-bf09-4bc4d9841094', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 12:45:38', '2025-11-17 12:45:38'),
('55bdeda1-e1fd-4909-a892-6d278402e1d3', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 19:43:22', '2025-11-16 19:43:22'),
('562ec69b-b870-45c3-804e-e6147fedb00e', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', 'UPDATE', 'Care Tasks', 'care_task', 'd0731585-7d2e-4fc8-8527-3db68f5ea42d', 'd0731585-7d2e-4fc8-8527-3db68f5ea42d', '{\"status\":\"pending\"}', '{\"status\":\"in_progress\"}', 'Updated care task status to in_progress', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 09:27:04', '2025-11-29 09:27:04'),
('5661fa51-3cc4-4507-91c0-a943dede75b8', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 13:07:24', '2025-11-17 13:07:24'),
('56f2d34f-7363-4109-997a-31470cd8ce3e', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 11:02:53', '2025-11-29 11:02:53'),
('571ca2c8-2f4b-404c-a3e4-f91a009c917d', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', 'Hanna N. Sarabia', 'admin', 'LOGIN', 'Authentication', 'user', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', NULL, NULL, 'Successful login: hanapot', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 11:38:49', '2025-11-16 11:38:49'),
('572f3bb3-93ea-40d1-8933-7b05c6799c7a', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-21 12:40:13', '2025-11-21 12:40:13'),
('5915cf3e-2097-4025-b984-82b49d5f039a', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', 'Hanna N. Sarabia', 'admin', 'CREATE', 'Prescriptions', 'prescription', '205431b9-bf40-49b5-a04a-77e9235a3904', '205431b9-bf40-49b5-a04a-77e9235a3904', NULL, '{\"prescription_id\":\"205431b9-bf40-49b5-a04a-77e9235a3904\",\"prescription_number\":\"RX-20251115-0001\",\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"prescriber_id\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440001\",\"items\":[{\"prescription_item_id\":\"7be959e1-8be5-483d-9bf4-1395fda900c1\",\"medication_id\":\"9117b66c-a29f-43cc-ac78-5724222f7a38\",\"quantity\":1}]}', 'Created prescription RX-20251115-0001 for patient Trixie Ann Morales', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-15 22:59:17', '2025-11-15 22:59:17'),
('59310e1b-7462-4272-97ba-f26c7cd691a6', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'CREATE', 'Roles', 'role_permission', '4974e51a-c4b2-43dd-966c-935015ea15bb', '4974e51a-c4b2-43dd-966c-935015ea15bb', NULL, '{\"role_id\":\"role-0000-0000-0000-000000000006\",\"permission_id\":\"perm-0000-0000-0000-000000000022\"}', 'Granted permission \"View Lab Test\" to role \"Patient\"', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 10:26:31', '2025-11-27 10:26:31'),
('59e79a5c-67dc-43e6-940b-36d0b2ee51a3', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 13:42:43', '2025-11-19 13:42:43'),
('5a050254-b639-4452-943b-4988bd2ed780', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'CREATE', 'Prescriptions', 'prescription', '69688306-fd70-41a5-8a71-9d41d0304072', '69688306-fd70-41a5-8a71-9d41d0304072', NULL, '{\"prescription_id\":\"69688306-fd70-41a5-8a71-9d41d0304072\",\"prescription_number\":\"RX-20251116-0002\",\"patient_id\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"prescriber_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"items\":[{\"prescription_item_id\":\"e527cebd-be4e-4e8e-a51a-405c5d3ddfaa\",\"medication_id\":\"65af6445-7630-4a2b-8851-d43fb66807ab\",\"quantity\":1}]}', 'Created prescription RX-20251116-0002 for patient Jose Reyes', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 16:07:16', '2025-11-16 16:07:16'),
('5a486159-42c4-4ee3-8686-41967b6693db', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 11:04:25', '2025-11-29 11:04:25'),
('5b14854b-6516-41bd-ae93-82f7315f8c69', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 12:17:33', '2025-11-16 12:17:33'),
('5b62714d-48b6-4967-8e36-2a0794b80f17', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-18 23:52:41', '2025-11-18 23:52:41'),
('5cedc436-e2f0-407e-b486-e078e2171964', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 12:20:30', '2025-11-28 12:20:30'),
('5d5109b8-5fc7-4721-b438-4e225ad837fa', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Failed login attempt: Invalid password for admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-21 08:46:20', '2025-11-21 08:46:20'),
('5e092a59-7da4-473d-ab85-3674fe4ad554', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 12:35:39', '2025-11-28 12:35:39'),
('5e0d96d0-3947-473f-922e-0305760a824c', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 13:31:45', '2025-11-24 13:31:45'),
('5e49ed8c-83a8-4934-9143-fb9bb545665d', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 09:40:22', '2025-11-19 09:40:22'),
('5f39893c-5331-4294-90ec-d0bcf7fb5ced', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', '8201188a-a4eb-4677-816f-08e0998056c2', NULL, NULL, NULL, NULL, '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'dispense_events is not defined', '2025-11-16 14:16:37', '2025-11-16 14:16:37'),
('6094fd5e-2ad3-43b6-9629-0f0e3c789b77', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 00:50:20', '2025-11-28 00:50:20');
INSERT INTO `audit_log` (`audit_id`, `user_id`, `user_name`, `user_role`, `action`, `module`, `entity_type`, `entity_id`, `record_id`, `old_value`, `new_value`, `change_summary`, `ip_address`, `device_type`, `user_agent`, `remarks`, `status`, `error_message`, `timestamp`, `created_at`) VALUES
('612a6b76-27b9-4dc6-9dfb-e77c3dcd2a39', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 11:04:38', '2025-11-28 11:04:38'),
('61efd39a-e545-4766-ab23-65247e93f904', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Failed login attempt: Invalid password for admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-18 22:00:49', '2025-11-18 22:00:49'),
('6225b082-704f-4296-8790-626bdfad315e', 'b656634b-477f-4aaa-817d-e0a77f75d88c', 'RAFAEL SANTOS DELA CRUZ', 'patient', 'LOGIN', 'Authentication', 'user', 'b656634b-477f-4aaa-817d-e0a77f75d88c', 'b656634b-477f-4aaa-817d-e0a77f75d88c', NULL, NULL, 'Successful login: rafdelacruz', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 10:47:36', '2025-11-29 10:47:36'),
('63e2765d-9b4d-4965-8c85-5974a7f5e93a', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 13:38:18', '2025-11-24 13:38:18'),
('64bfecb2-9418-4378-b456-298d16ee81bd', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 12:47:47', '2025-11-16 12:47:47'),
('6501f7e5-c45e-48ed-9709-5d84689aacad', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 01:59:00', '2025-11-28 01:59:00'),
('65b61bee-82ec-4af3-8a24-7eb16d957a9b', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 10:06:37', '2025-11-28 10:06:37'),
('661429e9-e7c8-4431-8604-fe5e99e59a31', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 19:23:16', '2025-11-28 19:23:16'),
('66303ff4-a4fb-4791-8052-bf4c9a85a0ea', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 19:42:48', '2025-11-17 19:42:48'),
('663428d8-4df4-4847-a5a1-15ebfef02aa6', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 10:16:29', '2025-11-29 10:16:29'),
('664e387a-1951-4f02-9b02-8f5d68f71663', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 15:25:43', '2025-11-19 15:25:43'),
('668b5fd4-876b-4891-9042-c7641ebc9cc1', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-18 22:02:03', '2025-11-18 22:02:03'),
('66f2de42-a330-4f80-bee6-dbe4f422b313', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'DELETE', 'Roles', 'role_permission', 'rp-pat-0001-0001-0001-000000000003', 'rp-pat-0001-0001-0001-000000000003', '{\"role_id\":\"role-0000-0000-0000-000000000006\",\"permission_id\":\"perm-0000-0000-0000-000000000022\"}', NULL, 'Revoked permission \"View Lab Test\" from role \"Patient\"', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 10:26:18', '2025-11-27 10:26:18'),
('670eba8e-54b8-4d8b-bb36-c09d1a110c26', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'CREATE', 'Patients', 'patient', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', NULL, '{\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"uic\":\"EDDE0106-01-2004\",\"first_name\":\"Hanna\",\"last_name\":\"Sarabia\",\"email\":\"sarabia.hanna.bsinfotech@gmail.com\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\"}', 'New patient registered: Hanna N. Sarabia (UIC: EDDE0106-01-2004)', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 16:07:51', '2025-11-17 16:07:51'),
('67d04a2c-08ce-4d4f-bc1a-93b55259d5ad', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 08:05:55', '2025-11-24 08:05:55'),
('67d810c0-f63c-43c3-9af1-4916b5051465', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 14:46:45', '2025-11-24 14:46:45'),
('687b9a81-95cb-4b47-a875-fd5a490ce55a', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Failed login attempt: Invalid password for physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'failed', 'Invalid password', '2025-11-27 11:33:53', '2025-11-27 11:33:53'),
('68beecff-3a83-4242-9fd6-5414dd0ab4b3', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 13:11:54', '2025-11-28 13:11:54'),
('69051a3f-13dc-4f21-9e5e-c680ffc3ae4f', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 18:27:29', '2025-11-27 18:27:29'),
('690f99a6-272c-462c-90c2-ff3625a81957', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'EXPORT', 'Reports', 'report_run', '768fca97-684d-4409-a8f4-dca94193b91c', '768fca97-684d-4409-a8f4-dca94193b91c', NULL, '{\"run_id\":\"768fca97-684d-4409-a8f4-dca94193b91c\",\"report_id\":\"3eafc94c-1159-42d1-9eea-cf1d8e809606\",\"report_type\":\"appointment\",\"reportData\":{\"total_appointments\":3,\"completed_count\":0,\"scheduled_count\":1,\"cancelled_count\":0,\"no_show_count\":0}}', 'Generated appointment report', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-22 12:03:24', '2025-11-22 12:03:24'),
('698e3553-00fc-4696-a2e1-d0fedc0e26a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 14:11:17', '2025-11-28 14:11:17'),
('69b64f15-97a8-4986-b898-bd9de49911fe', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 16:37:00', '2025-11-17 16:37:00'),
('6ace2902-d3db-40ac-bc17-57d8138a8db1', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 14:11:38', '2025-11-27 14:11:38'),
('6b671a53-516f-49b9-aff7-f877cf31067c', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 01:35:09', '2025-11-28 01:35:09'),
('6bc3b4f6-388f-4539-8871-cf6e033425e8', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 01:22:43', '2025-11-28 01:22:43'),
('6c024807-b8ac-42c1-a523-628816157419', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'CREATE', 'Prescriptions', 'prescription', '8201188a-a4eb-4677-816f-08e0998056c2', '8201188a-a4eb-4677-816f-08e0998056c2', NULL, '{\"prescription_id\":\"8201188a-a4eb-4677-816f-08e0998056c2\",\"prescription_number\":\"RX-20251116-0001\",\"patient_id\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"prescriber_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"items\":[{\"prescription_item_id\":\"73771305-0ea9-4194-9997-4795ac0307dd\",\"medication_id\":\"9117b66c-a29f-43cc-ac78-5724222f7a38\",\"quantity\":1}]}', 'Created prescription RX-20251116-0001 for patient Jose Reyes', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 12:55:04', '2025-11-16 12:55:04'),
('6c2a51ca-baa7-4781-855f-f33fa732b897', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 20:02:32', '2025-11-17 20:02:32'),
('6ccd4a7f-3352-41cc-be73-dc4a7cc9f7aa', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', 'LOGIN', 'Authentication', 'user', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', NULL, NULL, 'Successful login: nurse', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 10:10:59', '2025-11-29 10:10:59'),
('6da3a63a-bab6-4c6c-bcde-29c9f86cf705', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 12:30:55', '2025-11-28 12:30:55'),
('6dd37097-968b-4c43-83fc-8d20e1156701', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', 'LOGIN', 'Authentication', 'user', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', NULL, NULL, 'Successful login: nurse', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 09:59:28', '2025-11-29 09:59:28'),
('6de521f9-1c80-438a-ad55-336340cde852', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', 'LOGIN', 'Authentication', 'user', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', NULL, NULL, 'Failed login attempt: Invalid password for nurse', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'failed', 'Invalid password', '2025-11-27 10:32:54', '2025-11-27 10:32:54'),
('6e840dbc-7c2d-446f-a002-86b06189a450', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', 'Hanna N. Sarabia', 'admin', 'UPDATE', 'Patients', 'patient', '169b7991-2e21-4f62-8672-f06f129a8cbb', '169b7991-2e21-4f62-8672-f06f129a8cbb', '{\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"uic\":\"UIC-1763091112707-842\",\"philhealth_no\":\"123456\",\"first_name\":\"Trixie Ann\",\"middle_name\":\"\",\"last_name\":\"Morales\",\"suffix\":\"\",\"birth_date\":\"1899-11-29T16:00:00.000Z\",\"sex\":\"F\",\"civil_status\":\"Single\",\"nationality\":\"Filipino\",\"current_city\":\"Sampaloc\",\"current_province\":\"METRO MANILA\",\"current_address\":\"{\\\"city\\\":\\\"Sampaloc\\\",\\\"province\\\":\\\"METRO MANILA\\\"}\",\"contact_phone\":\"0945-5116-175\",\"email\":\"morales.ta.bsifnotech@gmail.com\",\"mother_name\":null,\"father_name\":null,\"birth_order\":null,\"guardian_name\":null,\"guardian_relationship\":null,\"facility_id\":\"7092d90f-5986-44fc-a56d-87abbf6b003d\",\"arpa_risk_score\":null,\"arpa_last_calculated\":null,\"status\":\"active\",\"created_at\":\"2025-11-14T03:31:52.000Z\",\"updated_at\":\"2025-11-14T04:17:25.000Z\",\"created_by\":\"3fdb00a0-7774-40f1-96f6-7d4c179bcd93\"}', '{\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"uic\":\"UIC-1763091112707-842\",\"philhealth_no\":\"1234567\",\"first_name\":\"Trixie Ann\",\"middle_name\":\"\",\"last_name\":\"Morales\",\"suffix\":\"\",\"birth_date\":\"1899-11-29T16:00:00.000Z\",\"sex\":\"F\",\"civil_status\":\"Single\",\"nationality\":\"Filipino\",\"current_city\":\"Sampaloc\",\"current_province\":\"METRO MANILA\",\"current_address\":\"{\\\"city\\\":\\\"Sampaloc\\\",\\\"province\\\":\\\"METRO MANILA\\\"}\",\"contact_phone\":\"0945-5116-175\",\"email\":\"morales.ta.bsifnotech@gmail.com\",\"mother_name\":null,\"father_name\":null,\"birth_order\":null,\"guardian_name\":null,\"guardian_relationship\":null,\"facility_id\":\"7092d90f-5986-44fc-a56d-87abbf6b003d\",\"arpa_risk_score\":null,\"arpa_last_calculated\":null,\"status\":\"active\",\"created_at\":\"2025-11-14T03:31:52.000Z\",\"updated_at\":\"2025-11-15T05:19:44.000Z\",\"created_by\":\"3fdb00a0-7774-40f1-96f6-7d4c179bcd93\",\"facility_name\":\"MyHubCares Manila Branch\"}', 'Patient updated: Trixie Ann Morales (UIC: UIC-1763091112707-842)', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-15 13:19:44', '2025-11-15 13:19:44'),
('7096a355-353b-4578-ba36-3fe3f305e053', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 13:46:33', '2025-11-28 13:46:33'),
('711ebb7c-168c-421e-a7af-2498a1e241c0', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'CREATE', 'Reporting', 'report_run', '16a466f9-ffb8-494a-ba30-98c7c03b3d56', '16a466f9-ffb8-494a-ba30-98c7c03b3d56', NULL, '{\"run_id\":\"16a466f9-ffb8-494a-ba30-98c7c03b3d56\",\"report_id\":\"3abccdc0-6f7f-4bef-ac22-251c142149a8\",\"report_name\":\"Patient Statistics Report\",\"report_type\":\"patient\",\"parameters\":{\"triggered_from\":\"ReportsPage\",\"report_type_label\":\"Patient Statistics\",\"generated_at\":\"2025-11-22T03:14:27.926Z\"}}', 'Report run created for Patient Statistics Report', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-22 11:14:27', '2025-11-22 11:14:27'),
('7131e98c-7abd-4cb1-a5d2-da3b1f611971', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 11:20:29', '2025-11-27 11:20:29'),
('714e9de1-8648-41ac-80db-cd8a17b753bb', 'b656634b-477f-4aaa-817d-e0a77f75d88c', 'RAFAEL SANTOS DELA CRUZ', 'patient', 'LOGIN', 'Authentication', 'user', 'b656634b-477f-4aaa-817d-e0a77f75d88c', 'b656634b-477f-4aaa-817d-e0a77f75d88c', NULL, NULL, 'Successful login: rafdelacruz', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 10:39:03', '2025-11-29 10:39:03'),
('71ef133c-d5e1-427b-8c58-497c634253d3', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 17:09:28', '2025-11-24 17:09:28'),
('72351c2d-f44b-43ff-aa79-f1b540c41eb8', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-18 22:10:48', '2025-11-18 22:10:48'),
('725cf0e7-c09c-4ea5-8c6c-c72c3d078a7b', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 11:33:43', '2025-11-29 11:33:43'),
('74632b82-9b86-4b4f-97a2-523f8a300c94', 'b656634b-477f-4aaa-817d-e0a77f75d88c', 'RAFAEL SANTOS DELA CRUZ', 'patient', 'LOGIN', 'Authentication', 'user', 'b656634b-477f-4aaa-817d-e0a77f75d88c', 'b656634b-477f-4aaa-817d-e0a77f75d88c', NULL, NULL, 'Successful login: rafdelacruz', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 10:29:30', '2025-11-29 10:29:30'),
('74791808-b673-45dc-a063-c7de8bc2221b', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 15:28:39', '2025-11-17 15:28:39'),
('75350570-d24f-48b9-b3f4-b2f27e0ba549', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 20:00:10', '2025-11-17 20:00:10'),
('75764f4b-a028-4d08-9486-ac4e8147a961', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'DELETE', 'Lab Orders', 'lab_order', 'e4e5c4d0-e314-4c45-bf8f-bb3cacc27a9c', 'e4e5c4d0-e314-4c45-bf8f-bb3cacc27a9c', '{\"order_id\":\"e4e5c4d0-e314-4c45-bf8f-bb3cacc27a9c\",\"patient_id\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"ordering_provider_id\":\"11111111-1111-1111-1111-111111111111\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"order_date\":\"2025-11-15T16:00:00.000Z\",\"test_panel\":\"Viral Load\",\"priority\":\"urgent\",\"status\":\"cancelled\",\"collection_date\":\"2025-11-15T16:00:00.000Z\",\"notes\":null,\"created_at\":\"2025-11-16T13:35:53.000Z\"}', NULL, 'Cancelled lab order: Viral Load', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 12:26:38', '2025-11-17 12:26:38'),
('764a6bfa-8299-4293-a42d-1aba8a6dad3a', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Failed login attempt: Invalid password for admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-18 22:24:24', '2025-11-18 22:24:24'),
('768ca261-dc97-4e0a-8db9-07ca018afdff', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Failed login attempt: Invalid password for admin', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-16 12:16:59', '2025-11-16 12:16:59'),
('76d006cc-5fb7-4a4f-8096-ee95bf86b5ab', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 11:58:35', '2025-11-19 11:58:35'),
('7720828a-fda2-46e3-8637-171fd6c75a63', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 19:57:44', '2025-11-17 19:57:44'),
('7757b939-b10d-43dc-ad10-4dd0df001406', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 18:10:06', '2025-11-17 18:10:06'),
('780b95a8-72d1-416d-ad0f-4db7352318b8', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 20:03:21', '2025-11-17 20:03:21'),
('78181366-1e84-45ed-baff-c49f8089dc97', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 10:24:34', '2025-11-29 10:24:34'),
('784b446f-400e-435e-828c-cf1eba79d181', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', '8201188a-a4eb-4677-816f-08e0998056c2', '8201188a-a4eb-4677-816f-08e0998056c2', NULL, '{\"prescription_id\":\"8201188a-a4eb-4677-816f-08e0998056c2\",\"prescription_number\":\"RX-20251116-0001\",\"dispense_events\":[{\"dispense_id\":\"869e38b5-9591-4f4d-8357-dcf2d6b13d84\",\"medication_name\":\"Efavirenz 600mg\",\"quantity_dispensed\":1}]}', 'Dispensed medication for prescription RX-20251116-0001', '::1', NULL, 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', NULL, 'success', NULL, '2025-11-16 14:41:25', '2025-11-16 14:41:25'),
('7855714b-7914-42cb-b1ed-49733fc12e58', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Failed login attempt: Invalid password for Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-24 08:51:35', '2025-11-24 08:51:35'),
('7884249d-7c92-45dd-95ca-25d8f5e3f820', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 16:06:23', '2025-11-16 16:06:23'),
('78d562dd-35d9-45ff-a4c9-392e4efa7b7a', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', 'CREATE', 'HTS Sessions', 'hts_session', 'fcb05ff2-3f62-400c-8de4-6296b401f060', 'fcb05ff2-3f62-400c-8de4-6296b401f060', NULL, '{\"hts_id\":\"fcb05ff2-3f62-400c-8de4-6296b401f060\",\"patient_id\":\"9380eb9a-4d99-43dc-a1db-364a4067c39a\",\"test_result\":\"Positive\",\"linked_to_care\":true}', 'Conducted HTS session for patient 9380eb9a-4d99-43dc-a1db-364a4067c39a, result: Positive', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 09:24:48', '2025-11-29 09:24:48'),
('78e41b77-ecc8-4edb-ab8d-09dc136f7fe2', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 11:58:01', '2025-11-29 11:58:01'),
('79ac7a83-e13e-4796-be95-6228b19997fc', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'CREATE', 'Lab Orders', 'lab_order', 'e4e5c4d0-e314-4c45-bf8f-bb3cacc27a9c', 'e4e5c4d0-e314-4c45-bf8f-bb3cacc27a9c', NULL, '{\"order_id\":\"e4e5c4d0-e314-4c45-bf8f-bb3cacc27a9c\",\"patient_id\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"test_panel\":\"Viral Load\",\"priority\":\"urgent\",\"status\":\"in_progress\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\"}', 'Created lab order: Viral Load for patient aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 21:35:54', '2025-11-16 21:35:54'),
('7a72203b-8f7a-4856-a2ac-8307a1f81652', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 12:27:12', '2025-11-29 12:27:12'),
('7aba79a4-3b76-4308-8baf-6eba5b03899f', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 11:35:56', '2025-11-27 11:35:56'),
('7abb19b8-1333-4a10-b6fb-7e139db481de', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 13:51:57', '2025-11-27 13:51:57'),
('7b075c1a-8d0c-44f4-936d-b9b79e885e54', '42356bf7-84ef-4aaa-9610-d74b65c3929f', 'Trixie Morales', 'physician', 'LOGIN', 'Authentication', 'user', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '42356bf7-84ef-4aaa-9610-d74b65c3929f', NULL, NULL, 'Successful login: Trixie', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 15:04:55', '2025-11-24 15:04:55'),
('7be9c16a-c030-4057-8e7f-03617b4816d4', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', '8201188a-a4eb-4677-816f-08e0998056c2', '8201188a-a4eb-4677-816f-08e0998056c2', NULL, '{\"prescription_id\":\"8201188a-a4eb-4677-816f-08e0998056c2\",\"prescription_number\":\"RX-20251116-0001\",\"dispense_events\":[{\"dispense_id\":\"ebb1908b-a668-42c7-9e21-b96b27df753f\",\"medication_name\":\"Efavirenz 600mg\",\"quantity_dispensed\":1}]}', 'Dispensed medication for prescription RX-20251116-0001', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 14:21:58', '2025-11-16 14:21:58'),
('7c1f5643-12fb-48ec-b4ca-d93ee2ed923c', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 14:09:26', '2025-11-27 14:09:26'),
('7ca29248-59ca-4e9e-9f03-1f65f359c236', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 10:44:16', '2025-11-29 10:44:16'),
('7da6a654-390c-4f35-bb28-2f592004f080', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 14:10:48', '2025-11-27 14:10:48'),
('7dd0e51c-60ba-4f04-b8af-513d4aee0215', '42356bf7-84ef-4aaa-9610-d74b65c3929f', 'Trixie Morales', 'physician', 'LOGIN', 'Authentication', 'user', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '42356bf7-84ef-4aaa-9610-d74b65c3929f', NULL, NULL, 'Successful login: Trixie', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 16:15:11', '2025-11-17 16:15:11'),
('7e197f6f-b169-42cb-a7c6-b189b96c7378', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 11:59:04', '2025-11-29 11:59:04'),
('7e382fd9-f55b-4b96-b815-85486aa56fbe', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 12:52:01', '2025-11-29 12:52:01'),
('7f158139-ae16-46d3-92de-0286925e738a', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', '', 'Inventory', 'medication_inventory', 'fcfefa31-7b0e-4e49-b11f-a11ef45c9694', 'fcfefa31-7b0e-4e49-b11f-a11ef45c9694', '{\"quantity_on_hand\":50}', '{\"quantity_on_hand\":100}', 'Restocked Efavirenz 600mg with 50 units at MyHubCares Main Clinic', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 09:22:03', '2025-11-24 09:22:03'),
('7f175558-fde5-4070-9484-c3485ed0b700', 'b656634b-477f-4aaa-817d-e0a77f75d88c', 'RAFAEL SANTOS DELA CRUZ', 'patient', 'LOGIN', 'Authentication', 'user', 'b656634b-477f-4aaa-817d-e0a77f75d88c', 'b656634b-477f-4aaa-817d-e0a77f75d88c', NULL, NULL, 'Successful login: rafdelacruz', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 10:13:40', '2025-11-29 10:13:40'),
('7f863770-addb-4760-93f9-eea4d1bf8468', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-25 15:50:22', '2025-11-25 15:50:22'),
('7fdb8cf5-256a-4977-bbd7-65fd6ee4dc3b', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 12:21:36', '2025-11-28 12:21:36'),
('8128e3bd-52e1-48bb-b7d9-e19e2036ddb7', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 21:30:11', '2025-11-16 21:30:11'),
('822e41ff-af33-4520-8ac0-e9b32564f67d', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 10:18:56', '2025-11-29 10:18:56'),
('82573027-364a-4bd1-888a-0a796ef6767e', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-18 23:53:04', '2025-11-18 23:53:04'),
('840aaf5d-33f1-42ee-bf61-442fca9a8cc8', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-22 11:14:13', '2025-11-22 11:14:13'),
('841f4bca-c4e6-4efc-8a68-044b43fc547e', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-26 08:15:28', '2025-11-26 08:15:28'),
('84bfc3c5-bc6d-4fd8-9309-f5c2f41d4c3f', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 13:56:37', '2025-11-17 13:56:37'),
('85c914f4-ee22-4aff-b2c4-89358a8563f7', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 14:04:38', '2025-11-28 14:04:38'),
('869eac9e-b66b-465a-beb9-725e13a548f8', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'UPDATE', 'Clinical Visits', 'clinical_visit', '30db2922-7990-4de8-ae4c-33df3ecf37c6', '30db2922-7990-4de8-ae4c-33df3ecf37c6', '{\"visit_id\":\"30db2922-7990-4de8-ae4c-33df3ecf37c6\",\"patient_id\":\"9380eb9a-4d99-43dc-a1db-364a4067c39a\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"visit_date\":\"2025-11-28T16:00:00.000Z\",\"visit_type\":\"initial\",\"who_stage\":\"Stage 1\",\"chief_complaint\":\"Patient reports mild fatigue and occasional headaches for the past 3 days.\",\"clinical_notes\":\"Patient is alert, oriented, and in no acute distress. Physical examination unremarkable. No respiratory or cardiovascular abnormalities noted. Encouraged patient to maintain healthy lifestyle habits. Advised to return for follow-up or sooner if symptoms worsen.\",\"assessment\":\"Vital signs within normal limits\\n\\nNo signs of acute infection\\n\\nPossible mild dehydration\\n\\nConsider lifestyle factors contributing to fatigue\\n\\n\",\"plan\":\"Advise increased fluid intake (2–3 liters/day)\\n\\nRecommend balanced meals and adequate sleep\\n\\nPrescribed multivitamins (1 tablet daily for 30 days)\\n\\nMonitor symptoms; return if worsening\",\"follow_up_date\":\"2025-12-12T16:00:00.000Z\",\"follow_up_reason\":\"Reassessment of symptoms and evaluation of treatment response.\",\"created_at\":\"2025-11-29T00:26:45.000Z\",\"updated_at\":\"2025-11-29T00:26:45.000Z\"}', '{\"visit_id\":\"30db2922-7990-4de8-ae4c-33df3ecf37c6\",\"patient_id\":\"9380eb9a-4d99-43dc-a1db-364a4067c39a\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"visit_date\":\"2025-11-27T16:00:00.000Z\",\"visit_type\":\"initial\",\"who_stage\":\"Stage 1\",\"chief_complaint\":\"Patient reports mild fatigue and occasional headaches for the past 3 days.\",\"clinical_notes\":\"Patient is alert, oriented, and in no acute distress. Physical examination unremarkable. No respiratory or cardiovascular abnormalities noted. Encouraged patient to maintain healthy lifestyle habits. Advised to return for follow-up or sooner if symptoms worsen.\",\"assessment\":\"Vital signs within normal limits\\n\\nNo signs of acute infection\\n\\nPossible mild dehydration\\n\\nConsider lifestyle factors contributing to fatigue\\n\\n\",\"plan\":\"Advise increased fluid intake (2–3 liters/day)\\n\\nRecommend balanced meals and adequate sleep\\n\\nPrescribed multivitamins (1 tablet daily for 30 days)\\n\\nMonitor symptoms; return if worsening\",\"follow_up_date\":\"2025-12-11T16:00:00.000Z\",\"follow_up_reason\":\"Reassessment of symptoms and evaluation of treatment response.\",\"created_at\":\"2025-11-29T00:26:45.000Z\",\"updated_at\":\"2025-11-29T00:28:38.000Z\",\"patientName\":\"RAFAEL DELA CRUZ\",\"providerName\":\"Dr. Juan Dela Cruz\",\"facilityName\":\"MyHubCares Main Facility\",\"diagnoses\":[{\"diagnosis_id\":\"f067cfd7-5a1e-4310-9c61-21a9e7b020c7\",\"visit_id\":\"30db2922-7990-4de8-ae4c-33df3ecf37c6\",\"icd10_code\":\"J06.9\",\"diagnosis_description\":\"Acute upper respiratory infection, unspecified.\",\"diagnosis_type\":\"primary\",\"is_chronic\":0,\"onset_date\":\"2025-12-12T16:00:00.000Z\",\"resolved_date\":\"2025-12-24T16:00:00.000Z\"}],\"procedures\":[]}', 'Updated clinical visit 30db2922-7990-4de8-ae4c-33df3ecf37c6', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 08:28:38', '2025-11-29 08:28:38'),
('86df236e-9b95-4e53-8811-3e2a7f62570c', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 19:37:16', '2025-11-17 19:37:16'),
('873123e6-5df7-4743-82a9-3556fc28af31', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 13:05:50', '2025-11-17 13:05:50'),
('873297e4-62ad-43bc-b6db-50662f062456', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 18:41:38', '2025-11-27 18:41:38'),
('875087fd-6cae-4373-973e-18a9f8de0fb9', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 10:34:00', '2025-11-27 10:34:00'),
('87c85f8e-0dad-4eba-a4b1-2cada18a0a6b', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 09:24:05', '2025-11-24 09:24:05'),
('87f8849b-01d1-48ff-9afb-bc52c4888260', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', 'Hanna N. Sarabia', 'admin', 'CREATE', 'Inventory', 'medication_inventory', 'fcfefa31-7b0e-4e49-b11f-a11ef45c9694', 'fcfefa31-7b0e-4e49-b11f-a11ef45c9694', NULL, '{\"inventory_id\":\"fcfefa31-7b0e-4e49-b11f-a11ef45c9694\",\"medication_id\":\"9117b66c-a29f-43cc-ac78-5724222f7a38\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440001\",\"quantity_on_hand\":100,\"reorder_level\":50,\"expiry_date\":\"2026-11-15\"}', 'Added inventory for Efavirenz 600mg at MyHubCares Main Clinic', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-15 18:56:04', '2025-11-15 18:56:04'),
('883e647b-2c9d-4e0f-8694-00100a45da9e', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 09:37:10', '2025-11-29 09:37:10');
INSERT INTO `audit_log` (`audit_id`, `user_id`, `user_name`, `user_role`, `action`, `module`, `entity_type`, `entity_id`, `record_id`, `old_value`, `new_value`, `change_summary`, `ip_address`, `device_type`, `user_agent`, `remarks`, `status`, `error_message`, `timestamp`, `created_at`) VALUES
('887541f6-f574-4656-ab6d-db87213742ff', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 12:20:05', '2025-11-17 12:20:05'),
('887bacb8-d257-4635-b8b8-54a027d3a66a', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 08:51:41', '2025-11-24 08:51:41'),
('89663b12-db11-4e8d-bea7-8fc9a3b9992e', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', 'Hanna N. Sarabia', 'admin', 'UPDATE', 'Users', 'user', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', '{\"status\":\"active\"}', '{\"status\":\"inactive\"}', 'Changed status of  (trixie) from active to inactive', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 11:59:40', '2025-11-16 11:59:40'),
('89bfc2a4-7fed-4915-8ec4-2d2b432be62e', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'CREATE', 'Clinical Visits', 'clinical_visit', '30db2922-7990-4de8-ae4c-33df3ecf37c6', '30db2922-7990-4de8-ae4c-33df3ecf37c6', NULL, '{\"visit_id\":\"30db2922-7990-4de8-ae4c-33df3ecf37c6\",\"patient_id\":\"9380eb9a-4d99-43dc-a1db-364a4067c39a\",\"visit_type\":\"initial\",\"visit_date\":\"2025-11-29\"}', 'Created clinical visit for patient 9380eb9a-4d99-43dc-a1db-364a4067c39a', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 08:26:45', '2025-11-29 08:26:45'),
('89f4db6e-6b69-423e-89d4-57fc0b78ff2f', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 12:00:31', '2025-11-27 12:00:31'),
('8a6be1de-d8ff-4128-a9c1-dc8ebec74a18', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 17:57:04', '2025-11-28 17:57:04'),
('8ac5bc39-5ea7-4e54-aca4-45594643646d', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-21 10:08:25', '2025-11-21 10:08:25'),
('8af789bf-6c18-4465-8b24-f35da18c43aa', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', 'be164d40-8c7e-49c8-9682-49bc54ccbdb5', 'be164d40-8c7e-49c8-9682-49bc54ccbdb5', NULL, '{\"prescription_id\":\"be164d40-8c7e-49c8-9682-49bc54ccbdb5\",\"prescription_number\":\"RX-20251129-0001\",\"dispense_events\":[{\"dispense_id\":\"b2049859-844e-4c1e-815a-91f7f58ad37b\",\"medication_name\":\"Amoxicillin 500mg\",\"quantity_dispensed\":21}]}', 'Dispensed medication for prescription RX-20251129-0001', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 10:11:12', '2025-11-29 10:11:12'),
('8ba858f7-78bd-483c-b89c-40ae3f1f664d', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 17:56:33', '2025-11-28 17:56:33'),
('8bdb333c-8044-4112-9a52-5ff9f25d84d3', '55555555-5555-5555-5555-555555555555', 'Ana Rodriguez', 'lab_personnel', 'LOGIN', 'Authentication', 'user', '55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', NULL, NULL, 'Successful login: lab_personnel', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 09:29:03', '2025-11-29 09:29:03'),
('8be58e07-09e4-404a-8bee-4b32debe7106', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 11:10:30', '2025-11-28 11:10:30'),
('8bebcebc-85a9-43ab-9ed3-42e7c715c5f9', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 10:38:12', '2025-11-29 10:38:12'),
('8f0e47b6-184b-4863-a1ff-fc849a28c999', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 09:52:32', '2025-11-29 09:52:32'),
('8f7c9b7b-9c2b-4818-9179-fea113c79f88', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 13:32:41', '2025-11-27 13:32:41'),
('8fbb1247-9e27-4ea7-b72b-9424813f3043', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'EXPORT', 'Reports', 'report_run', 'cc1fb930-078f-43bd-b65d-8460029b5efb', 'cc1fb930-078f-43bd-b65d-8460029b5efb', NULL, '{\"run_id\":\"cc1fb930-078f-43bd-b65d-8460029b5efb\",\"report_id\":\"3abccdc0-6f7f-4bef-ac22-251c142149a8\",\"report_type\":\"patient\",\"reportData\":{\"total_patients\":3,\"male_count\":1,\"female_count\":2}}', 'Generated patient report', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-22 15:02:01', '2025-11-22 15:02:01'),
('90a33d06-4691-4aab-92e2-c08a0ad37389', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 11:23:43', '2025-11-28 11:23:43'),
('9120415b-b1bd-4100-b991-a385aa6d7a08', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 18:49:11', '2025-11-27 18:49:11'),
('914e51bd-a203-4b17-b0bd-302a3afce20b', 'b656634b-477f-4aaa-817d-e0a77f75d88c', 'RAFAEL SANTOS DELA CRUZ', 'patient', 'LOGIN', 'Authentication', 'user', 'b656634b-477f-4aaa-817d-e0a77f75d88c', 'b656634b-477f-4aaa-817d-e0a77f75d88c', NULL, NULL, 'Successful login: rafdelacruz', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 08:16:09', '2025-11-29 08:16:09'),
('9367b631-2ec0-4376-990f-f35d4a6660da', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 16:07:35', '2025-11-16 16:07:35'),
('93981778-32b6-4ee4-b32e-3c6333dc8b74', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 18:43:37', '2025-11-27 18:43:37'),
('95c4ad30-d719-4e0b-9176-418e9fb9c495', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 17:22:53', '2025-11-17 17:22:53'),
('963a6a2d-9708-4254-8d94-2b6ee66cf443', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 01:18:54', '2025-11-28 01:18:54'),
('96c97485-2cab-4219-ae9c-2afec38644a8', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Failed login attempt: Invalid password for Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-28 17:29:21', '2025-11-28 17:29:21'),
('96fed148-bf07-4f80-949a-b32fe440e770', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 19:40:16', '2025-11-17 19:40:16'),
('979e86f2-6c1b-4253-bd2a-34175f79ce08', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 14:19:31', '2025-11-28 14:19:31'),
('9863176a-61e6-47d9-a772-e43b2b92e332', '42356bf7-84ef-4aaa-9610-d74b65c3929f', 'Trixie Morales', 'physician', 'LOGIN', 'Authentication', 'user', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '42356bf7-84ef-4aaa-9610-d74b65c3929f', NULL, NULL, 'Successful login: Trixie', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 09:41:49', '2025-11-19 09:41:49'),
('988f285b-b6cc-46c4-bd48-9dfb6ef22632', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'EXPORT', 'Reports', 'report_run', '6b26e2ee-ea27-4e05-998b-9891f47f0f5a', '6b26e2ee-ea27-4e05-998b-9891f47f0f5a', NULL, '{\"run_id\":\"6b26e2ee-ea27-4e05-998b-9891f47f0f5a\",\"report_id\":\"3abccdc0-6f7f-4bef-ac22-251c142149a8\",\"report_type\":\"patient\",\"reportData\":{\"total_patients\":3,\"male_count\":1,\"female_count\":2}}', 'Generated patient report', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-22 15:01:54', '2025-11-22 15:01:54'),
('9a55e29d-4fdc-4085-8706-c07b4a74a9cb', '55555555-5555-5555-5555-555555555555', 'Ana Rodriguez', 'lab_personnel', 'CREATE', 'Lab Results', 'lab_result', 'dc910bd9-1c93-440e-a00a-aa8cef77df75', 'dc910bd9-1c93-440e-a00a-aa8cef77df75', NULL, '{\"result_id\":\"dc910bd9-1c93-440e-a00a-aa8cef77df75\",\"order_id\":\"\",\"patient_id\":\"9380eb9a-4d99-43dc-a1db-364a4067c39a\",\"test_name\":\"Complete Blood Count (CBC)\",\"result_value\":\"5.2\",\"is_critical\":false}', 'Created lab result: Complete Blood Count (CBC) for patient 9380eb9a-4d99-43dc-a1db-364a4067c39a', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 09:30:26', '2025-11-29 09:30:26'),
('9b06ef3b-ab17-4f50-91c7-ea25a57f4966', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 14:16:05', '2025-11-16 14:16:05'),
('9b74cecc-dbf0-4561-ac19-6c1efa63a30a', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'CREATE', 'Roles', 'role_permission', 'e379f720-cb60-4cfa-ac9f-17b2dce7da7b', 'e379f720-cb60-4cfa-ac9f-17b2dce7da7b', NULL, '{\"role_id\":\"role-0000-0000-0000-000000000006\",\"permission_id\":\"perm-0000-0000-0000-000000000002\"}', 'Granted permission \"View Patient\" to role \"Patient\"', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 10:26:31', '2025-11-27 10:26:31'),
('9bda4c41-b816-4282-94b7-a0a31b7bc08e', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Failed login attempt: Invalid password for patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-16 15:25:03', '2025-11-16 15:25:03'),
('9d1122c7-6072-4cc9-b5fb-d105b3edce24', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', 'trixie', 'physician', 'LOGIN', 'Authentication', 'user', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', NULL, NULL, 'Successful login: trixie', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 10:42:17', '2025-11-16 10:42:17'),
('9d8277af-2a76-47a7-acab-23f422356d68', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 19:37:04', '2025-11-28 19:37:04'),
('9d9a894a-a596-4627-a7d3-9b54d23572cf', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 18:42:17', '2025-11-17 18:42:17'),
('9dd0ef1d-a152-407c-81b8-646f84c6075f', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', 'Hanna N. Sarabia', 'admin', 'UPDATE', 'Clinical Visits', 'clinical_visit', '3202ceae-5caf-4a5b-8eb9-b087f9679d51', '3202ceae-5caf-4a5b-8eb9-b087f9679d51', '{\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"provider_id\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\",\"facility_id\":\"7092d90f-5986-44fc-a56d-87abbf6b003d\",\"visit_date\":\"2025-11-09T16:00:00.000Z\",\"visit_type\":\"follow_up\",\"who_stage\":\"Stage 2\",\"chief_complaint\":\"dadas\",\"clinical_notes\":\"\",\"assessment\":\"dasdaa\",\"plan\":\"dasda\",\"follow_up_date\":\"2025-10-29T16:00:00.000Z\",\"follow_up_reason\":\"Laging Galit sa buhay\",\"created_at\":\"2025-11-15T04:54:11.000Z\",\"updated_at\":\"2025-11-15T08:15:23.000Z\"}', '{\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"provider_id\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\",\"facility_id\":\"7092d90f-5986-44fc-a56d-87abbf6b003d\",\"visit_date\":\"2025-11-08T16:00:00.000Z\",\"visit_type\":\"follow_up\",\"who_stage\":\"Stage 2\",\"chief_complaint\":\"dadas\",\"clinical_notes\":\"\",\"assessment\":\"dasdaa\",\"plan\":\"dasda\",\"follow_up_date\":\"2025-10-28T16:00:00.000Z\",\"follow_up_reason\":\"Laging Galit sa buhay\",\"created_at\":\"2025-11-15T04:54:11.000Z\",\"updated_at\":\"2025-11-15T09:08:03.000Z\",\"patientName\":\"Trixie Ann Morales\",\"providerName\":\"Hanna N. Sarabia\",\"facilityName\":\"MyHubCares Manila Branch\",\"diagnoses\":[{\"diagnosis_id\":\"77e96a37-65ad-48b6-864a-39deac62cf33\",\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"icd10_code\":\"\",\"diagnosis_description\":\"\",\"diagnosis_type\":\"secondary\",\"is_chronic\":0,\"onset_date\":\"1899-11-28T16:00:00.000Z\",\"resolved_date\":\"1899-11-28T16:00:00.000Z\"}],\"procedures\":[{\"procedure_id\":\"f932a7fd-4d82-4668-8b87-c2cb17cae8eb\",\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"cpt_code\":\"9235\",\"procedure_name\":\"Physical Examination\",\"procedure_description\":\"No further error\",\"outcome\":\"No signs of illness\",\"performed_at\":\"2025-11-15T01:03:00.000Z\"}]}', 'Updated clinical visit 3202ceae-5caf-4a5b-8eb9-b087f9679d51', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-15 17:08:03', '2025-11-15 17:08:03'),
('9e0b7465-0439-4a03-ab75-05c1437127b5', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 16:17:55', '2025-11-24 16:17:55'),
('9e71561f-8fbf-441f-b3f2-1158bfefdf64', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'EXPORT', 'Reports', 'report_run', 'da13c0c3-ce40-47fd-8ce6-a87cedd6110a', 'da13c0c3-ce40-47fd-8ce6-a87cedd6110a', NULL, '{\"run_id\":\"da13c0c3-ce40-47fd-8ce6-a87cedd6110a\",\"report_id\":\"rpt-0001-0000-0000-000000000001\",\"report_type\":\"patient\",\"reportData\":{\"total_patients\":3,\"male_count\":2,\"female_count\":1}}', 'Generated patient report', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 10:16:47', '2025-11-29 10:16:47'),
('9f323267-9ae2-4b94-9922-dfef64911442', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'CREATE', 'Referrals', 'referral', 'e2920bee-3464-45bb-89a8-f6987d7ffe13', 'e2920bee-3464-45bb-89a8-f6987d7ffe13', NULL, '{\"referral_id\":\"e2920bee-3464-45bb-89a8-f6987d7ffe13\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"from_facility_id\":\"550e8400-e29b-41d4-a716-446655440001\",\"to_facility_id\":\"550e8400-e29b-41d4-a716-446655440002\",\"urgency\":\"routine\"}', 'Created referral for patient 80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 15:19:32', '2025-11-19 15:19:32'),
('a24b8f01-ab07-42b8-9f5b-ddd9d2eee7d1', 'unknown', 'Unknown', 'unknown', 'LOGIN', 'Authentication', 'user', NULL, 'cas', NULL, NULL, 'Failed login attempt: Invalid username - cas', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid username or password', '2025-11-19 13:43:37', '2025-11-19 13:43:37'),
('a271d3a9-68a9-47c0-9c7c-0703831dae5d', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 19:43:44', '2025-11-17 19:43:44'),
('a2c7c9e1-14a2-42d6-9ae8-e34415f4ed2d', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 15:28:51', '2025-11-28 15:28:51'),
('a2e9e37e-61ce-4800-9d49-7cad7ea1b6e9', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'DELETE', 'Roles', 'role_permission', '095503a3-1759-45fe-a1b8-6321cf916871', '095503a3-1759-45fe-a1b8-6321cf916871', '{\"role_id\":\"role-0000-0000-0000-000000000004\",\"permission_id\":\"perm-0000-0000-0000-000000000017\"}', NULL, 'Revoked permission \"Create Appointment\" from role \"Case Manager\"', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 12:28:15', '2025-11-16 12:28:15'),
('a3bd1e6f-824c-4446-a4e1-8360fc1520ac', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 10:17:10', '2025-11-27 10:17:10'),
('a3e8182b-2bcd-486f-b35e-e4bcdc37ce8e', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'CREATE', 'Lab Results', 'lab_result', 'd1cc561a-c533-4c17-bf09-4bc4d9841094', 'd1cc561a-c533-4c17-bf09-4bc4d9841094', NULL, '{\"result_id\":\"d1cc561a-c533-4c17-bf09-4bc4d9841094\",\"order_id\":\"e3768174-a8b4-41f0-8579-83038959c1a5\",\"patient_id\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"test_name\":\"CD4 Count\",\"result_value\":\"Okay naman siya\",\"is_critical\":false}', 'Created lab result: CD4 Count for patient aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 12:30:15', '2025-11-17 12:30:15'),
('a4333355-9cba-43de-9d6e-cefe2633a54a', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 13:40:57', '2025-11-19 13:40:57'),
('a45b0cd5-835b-4919-8570-ebd5ca9b6716', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 14:06:06', '2025-11-19 14:06:06'),
('a5740e25-3144-4886-b5b7-753ff8f28e72', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', '8201188a-a4eb-4677-816f-08e0998056c2', NULL, NULL, NULL, NULL, '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'dispense_events is not defined', '2025-11-16 14:21:58', '2025-11-16 14:21:58'),
('a60b1b67-6f63-48c0-a96f-7136c918bdd1', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-18 22:01:55', '2025-11-18 22:01:55'),
('a62a57fa-0715-4cff-b35b-46c1085ef692', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 16:15:37', '2025-11-17 16:15:37'),
('a839168f-61e7-4f88-801c-9055d2bb5a3f', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Failed login attempt: Invalid password for Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-25 08:28:27', '2025-11-25 08:28:27'),
('a8b70b33-29e4-4699-8945-e01de52216c2', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', 'trixie', 'physician', 'LOGIN', 'Authentication', 'user', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', NULL, NULL, 'Failed login attempt: Invalid password for trixie', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-15 20:33:49', '2025-11-15 20:33:49'),
('a9a291aa-e17c-4fbc-b1a4-84f37178c301', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 11:33:21', '2025-11-28 11:33:21'),
('aa07084f-1ea5-476a-98ad-2d2323c100d9', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 14:33:11', '2025-11-24 14:33:11'),
('aa8a7f75-bfd1-4a01-82f2-4545ca8484cf', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 10:32:35', '2025-11-27 10:32:35'),
('aab58d7f-4158-4c0f-9159-21b156dafb28', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'UPDATE', 'Clinical Visits', 'clinical_visit', '30db2922-7990-4de8-ae4c-33df3ecf37c6', '30db2922-7990-4de8-ae4c-33df3ecf37c6', '{\"visit_id\":\"30db2922-7990-4de8-ae4c-33df3ecf37c6\",\"patient_id\":\"9380eb9a-4d99-43dc-a1db-364a4067c39a\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"visit_date\":\"2025-11-27T16:00:00.000Z\",\"visit_type\":\"initial\",\"who_stage\":\"Stage 1\",\"chief_complaint\":\"Patient reports mild fatigue and occasional headaches for the past 3 days.\",\"clinical_notes\":\"Patient is alert, oriented, and in no acute distress. Physical examination unremarkable. No respiratory or cardiovascular abnormalities noted. Encouraged patient to maintain healthy lifestyle habits. Advised to return for follow-up or sooner if symptoms worsen.\",\"assessment\":\"Vital signs within normal limits\\n\\nNo signs of acute infection\\n\\nPossible mild dehydration\\n\\nConsider lifestyle factors contributing to fatigue\\n\\n\",\"plan\":\"Advise increased fluid intake (2–3 liters/day)\\n\\nRecommend balanced meals and adequate sleep\\n\\nPrescribed multivitamins (1 tablet daily for 30 days)\\n\\nMonitor symptoms; return if worsening\",\"follow_up_date\":\"2025-12-11T16:00:00.000Z\",\"follow_up_reason\":\"Reassessment of symptoms and evaluation of treatment response.\",\"created_at\":\"2025-11-29T00:26:45.000Z\",\"updated_at\":\"2025-11-29T00:28:38.000Z\"}', '{\"visit_id\":\"30db2922-7990-4de8-ae4c-33df3ecf37c6\",\"patient_id\":\"9380eb9a-4d99-43dc-a1db-364a4067c39a\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"visit_date\":\"2025-11-26T16:00:00.000Z\",\"visit_type\":\"initial\",\"who_stage\":\"Stage 1\",\"chief_complaint\":\"Patient reports mild fatigue and occasional headaches for the past 3 days.\",\"clinical_notes\":\"Patient is alert, oriented, and in no acute distress. Physical examination unremarkable. No respiratory or cardiovascular abnormalities noted. Encouraged patient to maintain healthy lifestyle habits. Advised to return for follow-up or sooner if symptoms worsen.\",\"assessment\":\"Vital signs within normal limits\\n\\nNo signs of acute infection\\n\\nPossible mild dehydration\\n\\nConsider lifestyle factors contributing to fatigue\\n\\n\",\"plan\":\"Advise increased fluid intake (2–3 liters/day)\\n\\nRecommend balanced meals and adequate sleep\\n\\nPrescribed multivitamins (1 tablet daily for 30 days)\\n\\nMonitor symptoms; return if worsening\",\"follow_up_date\":\"2025-12-10T16:00:00.000Z\",\"follow_up_reason\":\"Reassessment of symptoms and evaluation of treatment response.\",\"created_at\":\"2025-11-29T00:26:45.000Z\",\"updated_at\":\"2025-11-29T00:29:12.000Z\",\"patientName\":\"RAFAEL DELA CRUZ\",\"providerName\":\"Dr. Juan Dela Cruz\",\"facilityName\":\"MyHubCares Main Facility\",\"diagnoses\":[{\"diagnosis_id\":\"f067cfd7-5a1e-4310-9c61-21a9e7b020c7\",\"visit_id\":\"30db2922-7990-4de8-ae4c-33df3ecf37c6\",\"icd10_code\":\"J06.9\",\"diagnosis_description\":\"Acute upper respiratory infection, unspecified.\",\"diagnosis_type\":\"primary\",\"is_chronic\":0,\"onset_date\":\"2025-12-11T16:00:00.000Z\",\"resolved_date\":\"2025-12-23T16:00:00.000Z\"}],\"procedures\":[{\"procedure_id\":\"60c28fdb-1ce7-4e4e-bba1-c2f24e5c893f\",\"visit_id\":\"30db2922-7990-4de8-ae4c-33df3ecf37c6\",\"cpt_code\":\"99213\",\"procedure_name\":\"Outpatient Evaluation and Management\",\"procedure_description\":\"Performed a focused physical examination and evaluated patient’s reported symptoms. Reviewed vital signs, assessed general health status, and provided medical advice and follow-up instructions.\",\"outcome\":\"Procedure completed successfully. Patient stable and discharged with instructions.\",\"performed_at\":\"2025-11-28T16:27:00.000Z\"}]}', 'Updated clinical visit 30db2922-7990-4de8-ae4c-33df3ecf37c6', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 08:29:12', '2025-11-29 08:29:12'),
('ab447ae4-1a58-491c-8387-8c7677233a0d', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 11:27:46', '2025-11-19 11:27:46'),
('ace46ac7-d007-40c4-bb2e-e7977885b984', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 11:33:14', '2025-11-29 11:33:14'),
('ad042bde-6b8f-41ce-8c21-edd99d9d61ee', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 19:13:49', '2025-11-28 19:13:49'),
('ae33a85d-fabe-4912-902c-b8d9b7588b15', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'CREATE', 'Referrals', 'referral', '78dd25e8-5047-493d-a584-25ff9a7bb13e', '78dd25e8-5047-493d-a584-25ff9a7bb13e', NULL, '{\"referral_id\":\"78dd25e8-5047-493d-a584-25ff9a7bb13e\",\"patient_id\":\"9380eb9a-4d99-43dc-a1db-364a4067c39a\",\"from_facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"to_facility_id\":\"550e8400-e29b-41d4-a716-446655440002\",\"urgency\":\"routine\"}', 'Created referral for patient 9380eb9a-4d99-43dc-a1db-364a4067c39a', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 09:16:46', '2025-11-29 09:16:46'),
('aee1f5b9-29b3-4fdd-a6d7-3f5e2a5331e9', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 11:36:38', '2025-11-29 11:36:38'),
('b06a2751-d5d6-46de-838b-1ec75970a913', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 14:02:20', '2025-11-28 14:02:20'),
('b0ccb5e4-6836-41c5-aaaa-1043b1a668a7', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Failed login attempt: Invalid password for admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-28 09:40:48', '2025-11-28 09:40:48'),
('b0cef3c9-e4f6-4fef-8028-18da623d1d4c', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', 'be164d40-8c7e-49c8-9682-49bc54ccbdb5', 'be164d40-8c7e-49c8-9682-49bc54ccbdb5', NULL, '{\"prescription_id\":\"be164d40-8c7e-49c8-9682-49bc54ccbdb5\",\"prescription_number\":\"RX-20251129-0001\",\"dispense_events\":[{\"dispense_id\":\"96ca1655-078a-4c01-8b25-7eb21a987b71\",\"medication_name\":\"Amoxicillin 500mg\",\"quantity_dispensed\":21}]}', 'Dispensed medication for prescription RX-20251129-0001', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 10:11:16', '2025-11-29 10:11:16'),
('b29c4e32-7c53-486d-a943-69cf1d618c9c', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 19:18:13', '2025-11-28 19:18:13'),
('b29f1feb-0798-42d8-9452-79b768401ffe', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 11:25:27', '2025-11-27 11:25:27'),
('b2b9fb4b-8452-412d-90f0-f86c5c91b716', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 12:36:36', '2025-11-28 12:36:36'),
('b3188e18-23c6-4911-a506-12554167b216', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 10:03:11', '2025-11-28 10:03:11'),
('b36de99b-cecf-400e-9a78-7e6f4bd64843', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-26 11:00:03', '2025-11-26 11:00:03'),
('b3d54d7b-1f34-4fee-9ae7-9fbf36d4a272', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'EXPORT', 'Reports', 'report_run', '716a6953-fbca-4237-ae12-35b1d363ed48', '716a6953-fbca-4237-ae12-35b1d363ed48', NULL, '{\"run_id\":\"716a6953-fbca-4237-ae12-35b1d363ed48\",\"report_id\":\"3abccdc0-6f7f-4bef-ac22-251c142149a8\",\"report_type\":\"patient\",\"reportData\":{\"total_patients\":3,\"male_count\":1,\"female_count\":2}}', 'Generated patient report', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-22 13:51:37', '2025-11-22 13:51:37'),
('b423fddc-d150-49ce-9f86-fac457665bf9', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'CREATE', 'Clinical Visits', 'clinical_visit', '062cea3c-ff0c-44a5-9879-ec40b501b375', '062cea3c-ff0c-44a5-9879-ec40b501b375', NULL, '{\"visit_id\":\"062cea3c-ff0c-44a5-9879-ec40b501b375\",\"patient_id\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"visit_type\":\"emergency\",\"visit_date\":\"2025-11-16\"}', 'Created clinical visit for patient aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 12:47:06', '2025-11-16 12:47:06'),
('b563a7e4-e0ba-4e87-9bb3-475ba1a195ff', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Failed login attempt: Invalid password for Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-29 10:18:52', '2025-11-29 10:18:52'),
('b585751b-12fa-4ade-a662-2cca65292e95', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-21 10:09:08', '2025-11-21 10:09:08'),
('b5a5f23e-0012-4633-85ef-f141271f54db', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 17:29:25', '2025-11-28 17:29:25'),
('b670e8d9-0eec-45a8-a5f2-5562357e468c', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 10:55:19', '2025-11-29 10:55:19'),
('b7e31628-0415-4ddd-90e6-43c81ff59780', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 13:43:42', '2025-11-19 13:43:42'),
('b8b9c22c-2d5c-4e2c-ba98-34e47ad66655', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-21 08:46:28', '2025-11-21 08:46:28'),
('ba638098-52fd-4b87-8327-c2abf2f78fe5', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 12:51:10', '2025-11-29 12:51:10'),
('bad2e935-ac36-4226-a223-b536f3272b6d', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 19:14:31', '2025-11-28 19:14:31'),
('bb2f25c3-35d8-4339-8b5f-4754a980822d', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 10:46:46', '2025-11-29 10:46:46'),
('bb4e1364-5799-41bd-8063-82ac12d07a5c', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'CREATE', 'Roles', 'role_permission', '56cb7249-0f26-4b3b-947c-aecc75c97cd8', '56cb7249-0f26-4b3b-947c-aecc75c97cd8', NULL, '{\"role_id\":\"role-0000-0000-0000-000000000004\",\"permission_id\":\"perm-0000-0000-0000-000000000014\"}', 'Granted permission \"View Prescription\" to role \"Case Manager\"', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 18:42:24', '2025-11-27 18:42:24'),
('bb76cb6b-76d5-4b5e-b0a6-877e6be7fd0f', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 11:37:00', '2025-11-29 11:37:00'),
('bd5fe122-5238-4be7-b6fb-ac9bb9c5b611', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 09:55:23', '2025-11-29 09:55:23'),
('bdec5c34-ac7f-44c1-b83d-65695c6fe503', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 16:33:44', '2025-11-17 16:33:44'),
('bdef98f5-e869-404d-bed2-800998e0c876', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 17:22:25', '2025-11-28 17:22:25'),
('be9b77b7-ed13-48da-a4bd-a6edc02ef8bc', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 10:14:40', '2025-11-19 10:14:40');
INSERT INTO `audit_log` (`audit_id`, `user_id`, `user_name`, `user_role`, `action`, `module`, `entity_type`, `entity_id`, `record_id`, `old_value`, `new_value`, `change_summary`, `ip_address`, `device_type`, `user_agent`, `remarks`, `status`, `error_message`, `timestamp`, `created_at`) VALUES
('bf48c25c-030a-4736-bb40-8033354474ab', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 08:10:12', '2025-11-29 08:10:12'),
('bfe37409-a83f-453d-a490-22bf97f06afe', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 20:06:12', '2025-11-17 20:06:12'),
('c04d5fec-7b95-4c15-aa08-87bab2e45df0', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 15:52:57', '2025-11-17 15:52:57'),
('c13db728-58aa-410c-a35d-7f4671d20b72', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 16:32:48', '2025-11-17 16:32:48'),
('c17ea91a-d527-4993-ba1b-baa393ed5cf2', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 17:57:50', '2025-11-27 17:57:50'),
('c1eea40c-9270-4adb-9a98-7be753ad25b4', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'EXPORT', 'Reports', 'report_run', '86499dcc-29d6-4fac-8d05-f3197ebdd27b', '86499dcc-29d6-4fac-8d05-f3197ebdd27b', NULL, '{\"run_id\":\"86499dcc-29d6-4fac-8d05-f3197ebdd27b\",\"report_id\":\"6dfe76c9-a6bf-47bf-a0b2-b18668f45126\",\"report_type\":\"adherence\",\"reportData\":{\"avg_adherence\":96.642308,\"total_records\":13,\"taken_count\":10,\"missed_count\":3}}', 'Generated adherence report', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 10:16:49', '2025-11-29 10:16:49'),
('c2180a62-8b5f-4d3f-bd78-f2120b3fd430', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 10:01:12', '2025-11-28 10:01:12'),
('c2cc38ae-cad0-4ef0-88b9-e2765632b18a', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'DELETE', 'Care Tasks', 'care_task', '5bd81d95-4c1e-4ddc-b69f-c2d7dfe45a66', '5bd81d95-4c1e-4ddc-b69f-c2d7dfe45a66', '{\"task_id\":\"5bd81d95-4c1e-4ddc-b69f-c2d7dfe45a66\",\"referral_id\":null,\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"assignee_id\":\"42356bf7-84ef-4aaa-9610-d74b65c3929f\",\"task_type\":\"follow_up\",\"task_description\":\"dfadasda\",\"due_date\":\"2025-11-18T16:00:00.000Z\",\"status\":\"pending\",\"completed_at\":null,\"created_at\":\"2025-11-19T07:31:32.000Z\",\"created_by\":\"11111111-1111-1111-1111-111111111111\"}', NULL, 'Deleted care task 5bd81d95-4c1e-4ddc-b69f-c2d7dfe45a66', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 15:49:53', '2025-11-19 15:49:53'),
('c3459c90-f9e2-4115-b8d2-5e700e0b9da0', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', '8201188a-a4eb-4677-816f-08e0998056c2', NULL, NULL, NULL, NULL, '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'dispense_events is not defined', '2025-11-16 14:21:53', '2025-11-16 14:21:53'),
('c3ccc202-af7e-408b-b04f-fd801bcc4ad7', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 11:32:15', '2025-11-29 11:32:15'),
('c53502de-58e4-4fcf-99b6-93aac7a44f77', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 14:01:54', '2025-11-28 14:01:54'),
('c5dacb6c-2e8a-4d95-a1f4-51338befe009', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 02:08:52', '2025-11-28 02:08:52'),
('c5ec9730-75f7-437b-850a-6d5985d71d20', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', 'Hanna N. Sarabia', 'admin', 'UPDATE', 'Clinical Visits', 'clinical_visit', '3202ceae-5caf-4a5b-8eb9-b087f9679d51', '3202ceae-5caf-4a5b-8eb9-b087f9679d51', '{\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"provider_id\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\",\"facility_id\":\"7092d90f-5986-44fc-a56d-87abbf6b003d\",\"visit_date\":\"2025-11-08T16:00:00.000Z\",\"visit_type\":\"follow_up\",\"who_stage\":\"Stage 2\",\"chief_complaint\":\"dadas\",\"clinical_notes\":\"\",\"assessment\":\"dasdaa\",\"plan\":\"dasda\",\"follow_up_date\":\"2025-10-28T16:00:00.000Z\",\"follow_up_reason\":\"Laging Galit sa buhay\",\"created_at\":\"2025-11-15T04:54:11.000Z\",\"updated_at\":\"2025-11-15T09:08:03.000Z\"}', '{\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"provider_id\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\",\"facility_id\":\"7092d90f-5986-44fc-a56d-87abbf6b003d\",\"visit_date\":\"2025-11-07T16:00:00.000Z\",\"visit_type\":\"follow_up\",\"who_stage\":\"Stage 2\",\"chief_complaint\":\"dadas\",\"clinical_notes\":\"\",\"assessment\":\"dasdaa\",\"plan\":\"dasda\",\"follow_up_date\":\"2025-10-27T16:00:00.000Z\",\"follow_up_reason\":\"Laging Galit sa buhay\",\"created_at\":\"2025-11-15T04:54:11.000Z\",\"updated_at\":\"2025-11-15T09:08:07.000Z\",\"patientName\":\"Trixie Ann Morales\",\"providerName\":\"Hanna N. Sarabia\",\"facilityName\":\"MyHubCares Manila Branch\",\"diagnoses\":[{\"diagnosis_id\":\"77e96a37-65ad-48b6-864a-39deac62cf33\",\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"icd10_code\":\"\",\"diagnosis_description\":\"\",\"diagnosis_type\":\"secondary\",\"is_chronic\":0,\"onset_date\":\"1899-11-27T16:00:00.000Z\",\"resolved_date\":\"1899-11-27T16:00:00.000Z\"},{\"diagnosis_id\":\"c381c663-1be5-4615-af98-3b9a141e3fdf\",\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"icd10_code\":\"120\",\"diagnosis_description\":\"It is having an collapse\",\"diagnosis_type\":\"primary\",\"is_chronic\":1,\"onset_date\":\"2025-11-08T16:00:00.000Z\",\"resolved_date\":\"2025-11-15T16:00:00.000Z\"}],\"procedures\":[{\"procedure_id\":\"f932a7fd-4d82-4668-8b87-c2cb17cae8eb\",\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"cpt_code\":\"9235\",\"procedure_name\":\"Physical Examination\",\"procedure_description\":\"No further error\",\"outcome\":\"No signs of illness\",\"performed_at\":\"2025-11-14T17:03:00.000Z\"}]}', 'Updated clinical visit 3202ceae-5caf-4a5b-8eb9-b087f9679d51', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-15 17:08:07', '2025-11-15 17:08:07'),
('c62d8ba7-51ed-404a-ab75-90a6fc749231', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 00:03:10', '2025-11-19 00:03:10'),
('c6675c6b-915a-41b6-8f2a-2de881ffab80', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-18 23:53:35', '2025-11-18 23:53:35'),
('c6b1f1c6-ec0c-4441-b089-40ce29101456', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 09:57:06', '2025-11-29 09:57:06'),
('c6d44b61-e637-4314-8a4b-89cd299caf7d', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 09:33:59', '2025-11-28 09:33:59'),
('c7dba60e-b96e-455b-9335-6a2d8083fdf9', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 12:31:46', '2025-11-29 12:31:46'),
('c7ec4100-64d8-4643-8293-9ac2c258115e', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-26 08:15:09', '2025-11-26 08:15:09'),
('c80cf390-e7be-477e-ab94-e831607dd6e1', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 16:01:13', '2025-11-27 16:01:13'),
('c87790df-cf6b-4ca2-9f4e-568256189ef1', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-18 22:24:33', '2025-11-18 22:24:33'),
('c8c71a6b-8d03-4ec0-9d07-6ebdc2f732d5', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', 'Hanna N. Sarabia', 'admin', 'UPDATE', 'Clinical Visits', 'clinical_visit', '3202ceae-5caf-4a5b-8eb9-b087f9679d51', '3202ceae-5caf-4a5b-8eb9-b087f9679d51', '{\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"provider_id\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\",\"facility_id\":\"7092d90f-5986-44fc-a56d-87abbf6b003d\",\"visit_date\":\"2025-11-13T16:00:00.000Z\",\"visit_type\":\"follow_up\",\"who_stage\":\"Stage 2\",\"chief_complaint\":\"dadas\",\"clinical_notes\":\"\",\"assessment\":\"dasdaa\",\"plan\":\"dasda\",\"follow_up_date\":null,\"follow_up_reason\":\"dfsdfds\",\"created_at\":\"2025-11-15T04:54:11.000Z\",\"updated_at\":\"2025-11-15T05:25:43.000Z\"}', '{\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"provider_id\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\",\"facility_id\":\"7092d90f-5986-44fc-a56d-87abbf6b003d\",\"visit_date\":\"2025-11-12T16:00:00.000Z\",\"visit_type\":\"follow_up\",\"who_stage\":\"Stage 2\",\"chief_complaint\":\"dadas\",\"clinical_notes\":\"\",\"assessment\":\"dasdaa\",\"plan\":\"dasda\",\"follow_up_date\":\"2025-11-01T16:00:00.000Z\",\"follow_up_reason\":\"Laging Galit sa buhay\",\"created_at\":\"2025-11-15T04:54:11.000Z\",\"updated_at\":\"2025-11-15T08:09:16.000Z\"}', 'Updated clinical visit 3202ceae-5caf-4a5b-8eb9-b087f9679d51', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-15 16:09:17', '2025-11-15 16:09:17'),
('c91786fd-d852-4c65-8e50-22c352e7937e', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 10:19:20', '2025-11-29 10:19:20'),
('c94e6c89-8531-4c31-9dd6-0bcba8f5d1d3', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-21 12:09:14', '2025-11-21 12:09:14'),
('c9dd4d39-b9c1-4b81-9ac4-7ecd89d8d609', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 12:26:44', '2025-11-29 12:26:44'),
('c9e5e385-0b62-4399-8865-44b0d8410a02', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-18 22:17:43', '2025-11-18 22:17:43'),
('ca519f74-a42b-4adb-9fc7-07649badab42', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', '8201188a-a4eb-4677-816f-08e0998056c2', NULL, NULL, NULL, NULL, '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'dispense_events is not defined', '2025-11-16 14:40:56', '2025-11-16 14:40:56'),
('caf31246-d6af-4eb0-bdd2-2d1de2066ee0', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 11:05:48', '2025-11-28 11:05:48'),
('cc5e8f6a-b90e-442f-951c-482ad199bd40', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'CREATE', 'Referrals', 'referral', '943bb845-401f-43f7-b661-5340d7fc728d', '943bb845-401f-43f7-b661-5340d7fc728d', NULL, '{\"referral_id\":\"943bb845-401f-43f7-b661-5340d7fc728d\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"from_facility_id\":\"550e8400-e29b-41d4-a716-446655440001\",\"to_facility_id\":\"550e8400-e29b-41d4-a716-446655440002\",\"urgency\":\"routine\"}', 'Created referral for patient 80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 15:24:28', '2025-11-19 15:24:28'),
('cca0e7d9-898a-44d6-9971-d5e0a5312743', '55555555-5555-5555-5555-555555555555', 'Ana Rodriguez', 'lab_personnel', 'LOGIN', 'Authentication', 'user', '55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', NULL, NULL, 'Successful login: lab_personnel', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 09:13:34', '2025-11-29 09:13:34'),
('cd645a2c-3ca1-4b87-99d8-9190a52fc793', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', 'Hanna N. Sarabia', 'admin', 'UPDATE', 'Patients', 'patient', '7db2ecfb-e409-41f3-a632-b5db0d4f868b', '7db2ecfb-e409-41f3-a632-b5db0d4f868b', '{\"patient_id\":\"7db2ecfb-e409-41f3-a632-b5db0d4f868b\",\"uic\":\"HASA01062204\",\"philhealth_no\":null,\"first_name\":\"Hanna\",\"middle_name\":\"N.\",\"last_name\":\"Sarabia\",\"suffix\":null,\"birth_date\":\"2204-01-05T16:00:00.000Z\",\"sex\":\"F\",\"civil_status\":\"Single\",\"nationality\":\"Filipino\",\"current_city\":\"Calocan\",\"current_province\":\"METRO MANILA\",\"current_address\":\"{\\\"city\\\":\\\"Calocan\\\",\\\"province\\\":\\\"METRO MANILA\\\"}\",\"contact_phone\":\"0966-312-2562\",\"email\":\"sarabia.hanna.bsinfotech@gmail.com\",\"mother_name\":null,\"father_name\":null,\"birth_order\":null,\"guardian_name\":null,\"guardian_relationship\":null,\"facility_id\":\"550e8400-e29b-41d4-a716-446655440001\",\"arpa_risk_score\":null,\"arpa_last_calculated\":null,\"status\":\"active\",\"created_at\":\"2025-11-11T04:17:15.000Z\",\"updated_at\":\"2025-11-11T04:17:15.000Z\",\"created_by\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\"}', '{\"patient_id\":\"7db2ecfb-e409-41f3-a632-b5db0d4f868b\",\"uic\":\"HASA01062204\",\"philhealth_no\":null,\"first_name\":\"Hanna\",\"middle_name\":\"N.\",\"last_name\":\"Sarabia\",\"suffix\":null,\"birth_date\":\"2204-01-04T16:00:00.000Z\",\"sex\":\"F\",\"civil_status\":\"Single\",\"nationality\":\"Filipino\",\"current_city\":\"Calocan\",\"current_province\":\"METRO MANILA\",\"current_address\":\"{\\\"city\\\":\\\"Calocan\\\",\\\"province\\\":\\\"METRO MANILA\\\"}\",\"contact_phone\":\"0966-312-2562\",\"email\":\"sarabia.hanna.bsinfotech@gmail.com\",\"mother_name\":\"Edita Narzoles\",\"father_name\":\"Delfin Sarabia\",\"birth_order\":null,\"guardian_name\":\"Edita Narzoles\",\"guardian_relationship\":\"Mother\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440001\",\"arpa_risk_score\":null,\"arpa_last_calculated\":null,\"status\":\"active\",\"created_at\":\"2025-11-11T04:17:15.000Z\",\"updated_at\":\"2025-11-15T12:45:18.000Z\",\"created_by\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\",\"facility_name\":\"MyHubCares Main Clinic\"}', 'Patient updated: Hanna Sarabia (UIC: HASA01062204)', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-15 20:45:18', '2025-11-15 20:45:18'),
('cedb2293-90ae-42a1-8bbf-21576588bf1c', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 11:40:58', '2025-11-28 11:40:58'),
('cf274e19-a073-478d-8b7f-f20b66ddba2a', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 19:15:06', '2025-11-28 19:15:06'),
('cfaf6f25-f92d-4044-9ec8-2d9e5d437021', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Failed login attempt: Invalid password for admin', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-16 12:16:54', '2025-11-16 12:16:54'),
('d0547c4f-2741-4dee-aea7-9f29a2c77d0e', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 17:16:45', '2025-11-17 17:16:45'),
('d07ec7e4-1ca0-4b6b-a101-be6c00fcd7a9', 'b656634b-477f-4aaa-817d-e0a77f75d88c', 'RAFAEL SANTOS DELA CRUZ', 'patient', 'CREATE', 'Patients', 'patient', '9380eb9a-4d99-43dc-a1db-364a4067c39a', '9380eb9a-4d99-43dc-a1db-364a4067c39a', NULL, '{\"patient_id\":\"9380eb9a-4d99-43dc-a1db-364a4067c39a\",\"uic\":\"MAJO0108-14-2001\",\"first_name\":\"RAFAEL\",\"last_name\":\"DELA CRUZ\",\"email\":\"rafael.delacruz@example.com\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\"}', 'New patient registered: RAFAEL SANTOS DELA CRUZ (UIC: MAJO0108-14-2001)', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 08:15:50', '2025-11-29 08:15:50'),
('d22d5e02-0a08-4953-b48e-2ce88c810d6b', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'EXPORT', 'Reports', 'report_run', 'b403baec-92bc-4fd8-b70f-2c126fb23937', 'b403baec-92bc-4fd8-b70f-2c126fb23937', NULL, '{\"run_id\":\"b403baec-92bc-4fd8-b70f-2c126fb23937\",\"report_id\":\"8b7c0f29-9fe3-4426-b38c-2879004b6d3e\",\"report_type\":\"inventory\",\"reportData\":{\"total_items\":4,\"total_stock\":\"1120\",\"low_stock_count\":1,\"expiring_soon_count\":0}}', 'Generated inventory report', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-22 12:03:24', '2025-11-22 12:03:24'),
('d28bc51b-7416-43b7-904d-dc2e17999a8a', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 18:24:06', '2025-11-17 18:24:06'),
('d2d35289-788a-4d6a-afd3-6a6c23727187', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 12:13:41', '2025-11-28 12:13:41'),
('d341c1e8-9432-4129-ab7b-e48b9175dfb1', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'UPDATE', 'Care Tasks', 'care_task', '221db5f0-6abc-45a3-a6a7-ded8a6e690ca', '221db5f0-6abc-45a3-a6a7-ded8a6e690ca', '{\"status\":\"pending\"}', '{\"status\":\"in_progress\"}', 'Updated care task status to in_progress', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 15:50:00', '2025-11-19 15:50:00'),
('d350b092-7477-4f62-8511-0db965dbba8f', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 09:40:50', '2025-11-28 09:40:50'),
('d3c27e08-a3de-48f3-84b5-178a0f6455ee', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 19:12:25', '2025-11-17 19:12:25'),
('d3cae945-ccf4-42a0-8ee2-0e1b96d9f477', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 15:49:09', '2025-11-28 15:49:09'),
('d41cc151-24bb-4de3-905c-8318bc9d630f', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 11:15:06', '2025-11-29 11:15:06'),
('d4da16f8-f124-4d6f-b822-5c6bae543c85', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 12:03:26', '2025-11-28 12:03:26'),
('d5459324-0515-491c-91fc-ac2c91d51fe0', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-21 13:34:29', '2025-11-21 13:34:29'),
('d579a98a-0e54-4a01-9d19-7b58bac3359a', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 02:09:00', '2025-11-28 02:09:00'),
('d5c3082d-0884-4d2e-b55f-de1a35e5c615', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 16:34:38', '2025-11-17 16:34:38'),
('d6078b00-5ce0-47a7-ab06-fbc44809d659', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'CREATE', 'Counseling Sessions', 'counseling_session', '45534bc6-d2b6-4213-a582-7256f268cf33', '45534bc6-d2b6-4213-a582-7256f268cf33', NULL, '{\"session_id\":\"45534bc6-d2b6-4213-a582-7256f268cf33\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"session_type\":\"adherence\",\"follow_up_required\":true}', 'Recorded adherence counseling session for patient 80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 16:13:36', '2025-11-19 16:13:36'),
('d610c1e8-772d-4504-9c5b-4e054f492d37', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 15:13:22', '2025-11-17 15:13:22'),
('d614869a-e32d-41ef-b806-5442d7b7c5fe', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'CREATE', 'Prescriptions', 'prescription', '82f27f2c-2eaa-44de-9661-488f51d92c4b', '82f27f2c-2eaa-44de-9661-488f51d92c4b', NULL, '{\"prescription_id\":\"82f27f2c-2eaa-44de-9661-488f51d92c4b\",\"prescription_number\":\"RX-20251117-0001\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"prescriber_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"items\":[{\"prescription_item_id\":\"acb91d51-cf61-4d84-bf8e-4278c739eefe\",\"medication_id\":\"9117b66c-a29f-43cc-ac78-5724222f7a38\",\"quantity\":1}]}', 'Created prescription RX-20251117-0001 for patient Hanna Sarabia', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 16:31:30', '2025-11-17 16:31:30'),
('d64e0b88-fc7e-4645-ae1f-b765fa1f1cac', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 09:42:31', '2025-11-19 09:42:31'),
('d69d4557-6fd4-44f6-9cd4-498b025fdbbe', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-26 14:14:01', '2025-11-26 14:14:01'),
('d702647d-b46c-4380-b44c-523888685ff1', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 12:47:31', '2025-11-29 12:47:31'),
('d907dfbc-a0a8-4606-97db-d1ef3f60f0ac', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 13:45:39', '2025-11-28 13:45:39'),
('d90999c6-6fb0-4bbf-9593-c7aee30d007d', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 12:34:33', '2025-11-28 12:34:33'),
('da52056a-576c-4f28-a980-df59ca0e99aa', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 11:59:13', '2025-11-29 11:59:13'),
('da5c7a2a-a256-430f-8260-63d77f6a616e', '55555555-5555-5555-5555-555555555555', 'Ana Rodriguez', 'lab_personnel', 'LOGIN', 'Authentication', 'user', '55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', NULL, NULL, 'Successful login: lab_personnel', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 10:34:44', '2025-11-27 10:34:44'),
('da8b8801-75c5-44e4-921e-cadda660a378', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', 'trixie', 'physician', 'LOGIN', 'Authentication', 'user', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', NULL, NULL, 'Failed login attempt: Invalid password for trixie', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-15 20:33:45', '2025-11-15 20:33:45'),
('dac4eead-2bc0-489d-9f4f-a70b18b335c2', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 11:26:01', '2025-11-19 11:26:01'),
('dbda3472-09a7-4f36-9d3f-0112379e0158', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 16:10:41', '2025-11-17 16:10:41'),
('dbe81d06-b2db-4fd8-b472-47f9d5973041', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 10:45:27', '2025-11-27 10:45:27'),
('dc24b3ba-97d3-43ce-993e-f079db7b40de', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-25 17:30:48', '2025-11-25 17:30:48'),
('dd3e75cb-b814-44cd-a426-72abebb895f7', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 11:37:02', '2025-11-28 11:37:02'),
('ddded849-ddd8-40bf-8068-6b66a875d7b2', 'unknown', 'Unknown', 'unknown', 'LOGIN', 'Authentication', 'user', NULL, 'cas', NULL, NULL, 'Failed login attempt: Invalid username - cas', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid username or password', '2025-11-19 13:43:38', '2025-11-19 13:43:38'),
('de246fac-cb1a-4f1c-a1cd-65af0505d66d', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 19:14:59', '2025-11-17 19:14:59'),
('de50a149-f589-4f83-ac97-5e8023d79b04', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 13:51:31', '2025-11-28 13:51:31'),
('de73e72f-6c18-495a-b550-024f015be723', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 09:01:51', '2025-11-19 09:01:51'),
('de767bee-e870-4818-b36f-0c85d333b3ae', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'DELETE', 'Lab Orders', 'lab_order', 'e4e5c4d0-e314-4c45-bf8f-bb3cacc27a9c', 'e4e5c4d0-e314-4c45-bf8f-bb3cacc27a9c', '{\"order_id\":\"e4e5c4d0-e314-4c45-bf8f-bb3cacc27a9c\",\"patient_id\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"ordering_provider_id\":\"11111111-1111-1111-1111-111111111111\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"order_date\":\"2025-11-15T16:00:00.000Z\",\"test_panel\":\"Viral Load\",\"priority\":\"urgent\",\"status\":\"cancelled\",\"collection_date\":\"2025-11-15T16:00:00.000Z\",\"notes\":null,\"created_at\":\"2025-11-16T13:35:53.000Z\"}', NULL, 'Cancelled lab order: Viral Load', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 12:46:50', '2025-11-17 12:46:50'),
('e1f698c9-c7f7-4fac-b6b7-ab0a069090b5', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 16:09:09', '2025-11-24 16:09:09'),
('e205223e-f54b-442e-a749-c0da543d4acb', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', '8201188a-a4eb-4677-816f-08e0998056c2', NULL, NULL, NULL, NULL, '::1', NULL, 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', NULL, 'failed', 'dispense_events is not defined', '2025-11-16 14:41:25', '2025-11-16 14:41:25'),
('e27a1f53-598f-4e0b-8cfb-7486e2e0b082', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-21 10:22:16', '2025-11-21 10:22:16'),
('e2809df2-9701-4e3c-a979-7681a6ca459c', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 18:43:23', '2025-11-17 18:43:23'),
('e293be08-3015-4414-92ba-3318550a8a37', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 13:32:30', '2025-11-27 13:32:30'),
('e2c50457-bf36-4b4e-bfeb-6dbe8fced5a9', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 11:54:14', '2025-11-28 11:54:14'),
('e2f32dfa-c9b3-4a34-a197-2888f17744de', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 17:28:12', '2025-11-17 17:28:12'),
('e338eb0a-a444-4d93-9cb2-37d37e6540dd', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-25 16:43:48', '2025-11-25 16:43:48'),
('e33b9e14-2617-449e-b064-bdc0df1186df', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 15:11:45', '2025-11-24 15:11:45'),
('e3e10940-204b-4106-b92d-5ea52edc7f91', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', '8201188a-a4eb-4677-816f-08e0998056c2', '8201188a-a4eb-4677-816f-08e0998056c2', NULL, '{\"prescription_id\":\"8201188a-a4eb-4677-816f-08e0998056c2\",\"prescription_number\":\"RX-20251116-0001\",\"dispense_events\":[{\"dispense_id\":\"5c4e5a12-976c-4355-9a8a-a6a74e97ab02\",\"medication_name\":\"Efavirenz 600mg\",\"quantity_dispensed\":1}]}', 'Dispensed medication for prescription RX-20251116-0001', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 14:21:53', '2025-11-16 14:21:53'),
('e41f6bab-b2ff-4634-aee8-5cf5df82a0e7', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 01:25:57', '2025-11-28 01:25:57'),
('e47fa391-0556-41aa-84e6-eacecfd3b94c', 'b656634b-477f-4aaa-817d-e0a77f75d88c', 'RAFAEL SANTOS DELA CRUZ', 'patient', 'LOGIN', 'Authentication', 'user', 'b656634b-477f-4aaa-817d-e0a77f75d88c', 'b656634b-477f-4aaa-817d-e0a77f75d88c', NULL, NULL, 'Successful login: rafdelacruz', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 10:44:28', '2025-11-29 10:44:28'),
('e4d08b0c-3d87-4569-b068-924134e3bd43', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', '82f27f2c-2eaa-44de-9661-488f51d92c4b', '82f27f2c-2eaa-44de-9661-488f51d92c4b', NULL, '{\"prescription_id\":\"82f27f2c-2eaa-44de-9661-488f51d92c4b\",\"prescription_number\":\"RX-20251117-0001\",\"dispense_events\":[{\"dispense_id\":\"3173327c-71aa-4322-9806-df26694a0d6d\",\"medication_name\":\"Efavirenz 600mg\",\"quantity_dispensed\":10}]}', 'Dispensed medication for prescription RX-20251117-0001', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 09:23:56', '2025-11-24 09:23:56'),
('e55ce961-342a-41c1-9abd-b55ac0d8a4f6', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', 'Hanna N. Sarabia', 'admin', 'UPDATE', 'Clinical Visits', 'clinical_visit', '3202ceae-5caf-4a5b-8eb9-b087f9679d51', '3202ceae-5caf-4a5b-8eb9-b087f9679d51', '{\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"provider_id\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\",\"facility_id\":\"7092d90f-5986-44fc-a56d-87abbf6b003d\",\"visit_date\":\"2025-11-11T16:00:00.000Z\",\"visit_type\":\"follow_up\",\"who_stage\":\"Stage 2\",\"chief_complaint\":\"dadas\",\"clinical_notes\":\"\",\"assessment\":\"dasdaa\",\"plan\":\"dasda\",\"follow_up_date\":\"2025-10-31T16:00:00.000Z\",\"follow_up_reason\":\"Laging Galit sa buhay\",\"created_at\":\"2025-11-15T04:54:11.000Z\",\"updated_at\":\"2025-11-15T08:14:51.000Z\"}', '{\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"provider_id\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\",\"facility_id\":\"7092d90f-5986-44fc-a56d-87abbf6b003d\",\"visit_date\":\"2025-11-10T16:00:00.000Z\",\"visit_type\":\"follow_up\",\"who_stage\":\"Stage 2\",\"chief_complaint\":\"dadas\",\"clinical_notes\":\"\",\"assessment\":\"dasdaa\",\"plan\":\"dasda\",\"follow_up_date\":\"2025-10-30T16:00:00.000Z\",\"follow_up_reason\":\"Laging Galit sa buhay\",\"created_at\":\"2025-11-15T04:54:11.000Z\",\"updated_at\":\"2025-11-15T08:15:10.000Z\"}', 'Updated clinical visit 3202ceae-5caf-4a5b-8eb9-b087f9679d51', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-15 16:15:10', '2025-11-15 16:15:10'),
('e55d97b2-2470-4aa8-906d-f8410f3101fd', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 16:12:28', '2025-11-17 16:12:28');
INSERT INTO `audit_log` (`audit_id`, `user_id`, `user_name`, `user_role`, `action`, `module`, `entity_type`, `entity_id`, `record_id`, `old_value`, `new_value`, `change_summary`, `ip_address`, `device_type`, `user_agent`, `remarks`, `status`, `error_message`, `timestamp`, `created_at`) VALUES
('e5922314-b3b3-4f20-8c38-28a2759a64ec', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 09:58:08', '2025-11-29 09:58:08'),
('e6b87bfa-e42c-40e9-bf2f-93ea84d251eb', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 16:22:27', '2025-11-17 16:22:27'),
('e75d4bde-e4a6-4412-9fa6-c536c5e0d448', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'CREATE', 'Roles', 'role_permission', '1ee8d17e-3e1f-4e51-a978-539f97a912dc', '1ee8d17e-3e1f-4e51-a978-539f97a912dc', NULL, '{\"role_id\":\"role-0000-0000-0000-000000000006\",\"permission_id\":\"perm-0000-0000-0000-000000000018\"}', 'Granted permission \"View Appointment\" to role \"Patient\"', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 10:26:30', '2025-11-27 10:26:30'),
('e7e7c1a1-50bc-45bb-a761-3c9dae65053c', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'DELETE', 'Roles', 'role_permission', '1ee8d17e-3e1f-4e51-a978-539f97a912dc', '1ee8d17e-3e1f-4e51-a978-539f97a912dc', '{\"role_id\":\"role-0000-0000-0000-000000000006\",\"permission_id\":\"perm-0000-0000-0000-000000000018\"}', NULL, 'Revoked permission \"View Appointment\" from role \"Patient\"', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 10:26:37', '2025-11-27 10:26:37'),
('e8528cf6-8e04-4acd-bbeb-757d44463535', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 12:51:18', '2025-11-29 12:51:18'),
('e8552eef-98f4-48d0-ad0d-65c5a5d6c93a', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 15:31:26', '2025-11-17 15:31:26'),
('e8cb3f83-4391-463f-836d-3144b8a83e40', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 18:12:45', '2025-11-27 18:12:45'),
('e9973741-8b2f-48ed-a978-ddd08ec2c744', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 12:33:43', '2025-11-29 12:33:43'),
('ea069af8-7dc1-47e6-94dd-48c7ed6ae8e1', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'UPDATE', 'Care Tasks', 'care_task', '221db5f0-6abc-45a3-a6a7-ded8a6e690ca', '221db5f0-6abc-45a3-a6a7-ded8a6e690ca', '{\"status\":\"in_progress\"}', '{\"status\":\"completed\"}', 'Updated care task status to completed', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 15:50:06', '2025-11-19 15:50:06'),
('ea244ee3-c934-4ef0-b896-aa45d9a358c7', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'CREATE', 'Inventory', 'medication_inventory', '79642a00-11ce-47eb-934a-1e9c3be7dd5c', '79642a00-11ce-47eb-934a-1e9c3be7dd5c', NULL, '{\"inventory_id\":\"79642a00-11ce-47eb-934a-1e9c3be7dd5c\",\"medication_id\":\"9117b66c-a29f-43cc-ac78-5724222f7a38\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"quantity_on_hand\":150,\"reorder_level\":200,\"expiry_date\":\"2026-11-16\"}', 'Added inventory for Efavirenz 600mg at MyHubCares Main Facility', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 12:48:17', '2025-11-16 12:48:17'),
('ea990e24-bdde-49da-a1a9-8f0b5283fc81', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'DELETE', 'Roles', 'role_permission', 'rp-pat-0001-0001-0001-000000000002', 'rp-pat-0001-0001-0001-000000000002', '{\"role_id\":\"role-0000-0000-0000-000000000006\",\"permission_id\":\"perm-0000-0000-0000-000000000018\"}', NULL, 'Revoked permission \"View Appointment\" from role \"Patient\"', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 10:26:21', '2025-11-27 10:26:21'),
('eb3d9b5a-5556-4876-ae13-e9378de9c586', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 15:00:51', '2025-11-24 15:00:51'),
('eb5cd17e-ef79-4149-b625-2e51f0bac885', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-26 13:02:00', '2025-11-26 13:02:00'),
('eb89c338-5ee1-4e7b-b9c1-570ce807b444', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 18:17:53', '2025-11-28 18:17:53'),
('ebd566da-b9e7-4f73-a99e-1fb52773700d', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 11:45:28', '2025-11-29 11:45:28'),
('ec575e2b-0cd4-4904-8202-a7b946516961', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 19:22:39', '2025-11-28 19:22:39'),
('ec59ecc4-44fc-420e-97a1-7b7bbea262c3', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-18 22:24:41', '2025-11-18 22:24:41'),
('ec6223e5-d4c8-4242-a10d-b3dd277be237', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-25 08:28:33', '2025-11-25 08:28:33'),
('ed01f291-e85b-4a32-b231-92ca6a2c5667', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 11:32:07', '2025-11-27 11:32:07'),
('ef0addb3-58cb-422e-9900-66777a50ebaf', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-22 11:52:07', '2025-11-22 11:52:07'),
('ef2fa00f-d7ba-4653-85cb-6dec03860897', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 11:33:59', '2025-11-27 11:33:59'),
('efcfa064-9716-486d-9176-461f172150f4', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Failed login attempt: Invalid password for Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-29 12:33:39', '2025-11-29 12:33:39'),
('f0a912da-23c6-41d2-b295-0a5cd7542196', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 15:21:08', '2025-11-19 15:21:08'),
('f0d2f4f4-6c2e-48d2-aa71-fcf5c03a3e8b', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Failed login attempt: Invalid password for Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-24 08:57:23', '2025-11-24 08:57:23'),
('f1ad4dd7-9782-4ae1-9c4a-2ba405818b07', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 17:41:46', '2025-11-28 17:41:46'),
('f4138eb2-0a3f-4589-989b-9d312622e344', 'b656634b-477f-4aaa-817d-e0a77f75d88c', 'RAFAEL SANTOS DELA CRUZ', 'patient', 'LOGIN', 'Authentication', 'user', 'b656634b-477f-4aaa-817d-e0a77f75d88c', 'b656634b-477f-4aaa-817d-e0a77f75d88c', NULL, NULL, 'Successful login: rafdelacruz', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 10:38:01', '2025-11-29 10:38:01'),
('f6fa9a26-39f5-43b5-81aa-225acc59d70e', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Failed login attempt: Invalid password for admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-18 22:02:00', '2025-11-18 22:02:00'),
('f727a263-e212-4143-bc54-3ef8b0b0bb5a', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-26 15:19:17', '2025-11-26 15:19:17'),
('f76a5cab-28eb-4af1-b2e8-0c4e5be58ff2', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', 'LOGIN', 'Authentication', 'user', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', NULL, NULL, 'Successful login: nurse', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 14:16:27', '2025-11-16 14:16:27'),
('f7e684e5-2cc9-4d70-b0c7-f519b449eda7', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 19:25:31', '2025-11-28 19:25:31'),
('f81bc51f-b730-4fe0-b8be-55c2cab7fa95', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 11:06:02', '2025-11-29 11:06:02'),
('f88b78b0-1feb-475f-af57-6bdc4c4667be', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-25 08:28:52', '2025-11-25 08:28:52'),
('fa7fa4e4-7bc8-41c8-95ec-70943b5d9c7a', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 08:56:37', '2025-11-28 08:56:37'),
('fae027bc-447c-4a05-81cd-d552c898c657', 'unknown', 'Unknown', 'unknown', 'LOGIN', 'Authentication', 'user', NULL, 'cas', NULL, NULL, 'Failed login attempt: Invalid username - cas', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid username or password', '2025-11-19 13:43:40', '2025-11-19 13:43:40'),
('fb98a7d4-85fc-4860-82bf-8744afb2858c', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 00:59:55', '2025-11-28 00:59:55'),
('fc86b285-667f-445b-bf60-39c4820ed4e0', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', 'trixie', 'physician', 'LOGIN', 'Authentication', 'user', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', NULL, NULL, 'Failed login attempt: Invalid password for trixie', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-15 20:33:55', '2025-11-15 20:33:55'),
('fcfdb490-f3b7-4690-9956-c70a4de4608d', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Failed login attempt: Invalid password for case_manager', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-17 18:09:54', '2025-11-17 18:09:54'),
('fd3198ed-32fb-4b5f-a41b-e5663f700305', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', 'trixie', 'physician', 'LOGIN', 'Authentication', 'user', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', NULL, NULL, 'Successful login: trixie', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-15 20:33:59', '2025-11-15 20:33:59'),
('fd4fa85c-c0d7-4d11-aed7-54aabb7c699a', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-18 22:00:31', '2025-11-18 22:00:31'),
('fdaba999-3129-4daf-8419-79723d54e5ea', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', 'CREATE', 'Care Tasks', 'care_task', 'd0731585-7d2e-4fc8-8527-3db68f5ea42d', 'd0731585-7d2e-4fc8-8527-3db68f5ea42d', NULL, '{\"task_id\":\"d0731585-7d2e-4fc8-8527-3db68f5ea42d\",\"patient_id\":\"9380eb9a-4d99-43dc-a1db-364a4067c39a\",\"assignee_id\":\"22222222-2222-2222-2222-222222222222\",\"task_type\":\"follow_up\"}', 'Created follow_up care task for patient 9380eb9a-4d99-43dc-a1db-364a4067c39a', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-29 09:26:51', '2025-11-29 09:26:51'),
('fdc87c08-ed5f-4787-9e07-6186c330dc2a', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'CREATE', 'Care Tasks', 'care_task', '5bd81d95-4c1e-4ddc-b69f-c2d7dfe45a66', '5bd81d95-4c1e-4ddc-b69f-c2d7dfe45a66', NULL, '{\"task_id\":\"5bd81d95-4c1e-4ddc-b69f-c2d7dfe45a66\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"assignee_id\":\"42356bf7-84ef-4aaa-9610-d74b65c3929f\",\"task_type\":\"follow_up\"}', 'Created follow_up care task for patient 80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 15:31:32', '2025-11-19 15:31:32'),
('fef2ed9f-b559-404b-86b7-7f9dad15d55c', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 00:51:12', '2025-11-28 00:51:12'),
('ff4bde3e-927e-4bf5-b09b-b171b4a31656', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 08:55:30', '2025-11-24 08:55:30'),
('ffb3c4fd-8769-478f-be80-2ba2c93e310d', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-28 14:14:05', '2025-11-28 14:14:05');

-- --------------------------------------------------------

--
-- Table structure for table `auth_sessions`
--

CREATE TABLE `auth_sessions` (
  `session_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `issued_at` datetime DEFAULT current_timestamp(),
  `expires_at` datetime NOT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `revoked_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `auth_sessions`
--

INSERT INTO `auth_sessions` (`session_id`, `user_id`, `token_hash`, `issued_at`, `expires_at`, `ip_address`, `user_agent`, `is_active`, `revoked_at`) VALUES
('000b52bb-d09e-4ddf-b828-f002275f2a5c', '11111111-1111-1111-1111-111111111111', '$2b$10$vaRUnCZW.FAthXIhXYJVWe80DK0b344Rz3Uw5fyAhDevpTnQMLi9W', '2025-11-17 19:57:44', '2025-11-18 19:57:44', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('00628773-752d-4500-a1be-426de7f46c92', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$kPKXgtxYTRptbhDk3scT9ewo8Sz7XdckXs2sXaLS452OdAW4340Lq', '2025-11-28 14:01:25', '2025-11-29 14:01:25', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('00bb5f51-67e2-4e70-90d1-1f50f4b2aa49', '66666666-6666-6666-6666-666666666666', '$2b$10$Y9XytF1FAHuyNkWTbhnAr.S1umE4LJYMo3UsaXEHXEKt/UL8Rde72', '2025-11-28 00:59:54', '2025-11-29 00:59:54', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('012143d3-0328-4598-af51-df16a06cc856', '66666666-6666-6666-6666-666666666666', '$2b$10$k7AgbtH7Do1N3Vb2cDuvMeXcuKbOJ8Ft8hVEhFek7wuyh58YOdOaq', '2025-11-28 14:19:31', '2025-11-29 14:19:31', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('02222689-04c2-48d5-85f3-324f9c1b93ab', '11111111-1111-1111-1111-111111111111', '$2b$10$HFJE6ldsIN2uocu9G1SPmOhELLkSRoviwSNny0zqRPE9lpGUYCkKK', '2025-11-16 12:01:45', '2025-11-17 12:01:45', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('02ea0989-dfe8-4787-9261-ffc19ca32042', '22222222-2222-2222-2222-222222222222', '$2b$10$C8zZ0dT2zTpdbquq8nwtEuMRNhsq5OjN1EFNt4RgolfbUuv.NCTNG', '2025-11-28 14:02:20', '2025-11-29 14:02:20', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('0356c67b-408a-4500-bf59-e9dc26a92661', '66666666-6666-6666-6666-666666666666', '$2b$10$DQos2sexpztToBha7vRksuLzIq.MqLbp1O81H0o2YStafvN84.PRe', '2025-11-29 12:31:46', '2025-11-30 12:31:46', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('04977f75-4a51-4ad1-8ab6-1093b67afee1', '22222222-2222-2222-2222-222222222222', '$2b$10$We8ife2uzQi12ubo5LNSkec/2tiy/5kTIOi1g.sGJW3vKU45HYU56', '2025-11-19 09:40:22', '2025-11-20 09:40:22', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('07074324-e679-4336-9d68-f20823d229e5', '66666666-6666-6666-6666-666666666666', '$2b$10$ixfLYqyFp8kj7hjAO/NDvOvF04mWy1.3Gju0gAq9L.acZ5uuBIrP.', '2025-11-29 11:02:53', '2025-11-30 11:02:53', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('089d3fff-29ed-4b2c-86ff-c9d59b4bf5e0', '22222222-2222-2222-2222-222222222222', '$2b$10$pPG0CO0vtyJWolcwxnAvjOmkRB4SOwNvjSS1mQYOgOjSMS7nkjL5a', '2025-11-28 14:04:38', '2025-11-29 14:04:38', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('08a60929-9b82-4b55-b268-4766337cf65d', '66666666-6666-6666-6666-666666666666', '$2b$10$Mr1HYprM9EcFvtA2wZWsnOMCa2GvxuVL9XdFfrxFVxEVkElP14OK.', '2025-11-16 19:43:22', '2025-11-17 19:43:22', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('09e593c3-8ada-46b8-ae32-0b24a35204d6', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$6N79gVNNKxOCKBckDCqxaeQu24WYetYwJL05.7sIm5TFSZXSC3Tma', '2025-11-17 19:43:44', '2025-11-18 19:43:44', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('09f484ca-f488-4ef3-90d4-cbee2c9e0ade', '11111111-1111-1111-1111-111111111111', '$2b$10$yUrd9u9OHDyhOaRmJFyx9uOnZMIX2oQ.xjPrgR8vKbGhwxaLSQR26', '2025-11-28 11:04:38', '2025-11-29 11:04:38', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('0a4534c9-d5b2-4c61-b4c4-4a5f6c0e5680', '11111111-1111-1111-1111-111111111111', '$2b$10$5YW5voXtjp1qzBuqSPCS8OLmA4Tjh02jM5Kr/dfmoPxRMIEaF0A3a', '2025-11-28 13:51:31', '2025-11-29 13:51:31', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('0b3cdf0c-c2e9-4fd2-96b0-010261a3cc0d', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '$2b$10$/fmHsH5blBhfXWygV.HpPuD11fF6Ju.Oiflq9VpQ3334yAK1UO5m.', '2025-11-28 14:14:40', '2025-11-29 14:14:40', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('0c79dcc8-0ad6-4c26-8bb9-b9904944cf92', '11111111-1111-1111-1111-111111111111', '$2b$10$qb.la99FkrAEr02chwD9Hu.O6RikkA2TGCh/xKKtrltDR9vfJUF4i', '2025-11-25 08:28:52', '2025-11-26 08:28:52', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('0d647842-5671-4c0b-b386-f3e26b047b47', '11111111-1111-1111-1111-111111111111', '$2b$10$Ejuc8ldVq.DUeGIG7t9ObOAvfPmNQr4uCyvUwOuGazINpkdRqozri', '2025-11-18 22:02:02', '2025-11-19 22:02:02', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('0e467be6-198b-41e5-8684-8cdb85f18e0f', 'b656634b-477f-4aaa-817d-e0a77f75d88c', '$2b$10$/WCQx42NwtCN/30f4smUhO4icJQH1szRGPUQpdKHIZnCdFrTR7mV2', '2025-11-29 08:16:09', '2025-11-30 08:16:09', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('0e552494-0911-485a-b4d7-eb279d13d38b', '44444444-4444-4444-4444-444444444444', '$2b$10$5oMDECD1AdJBfJg1hTAEIeJZvxd3n49Z7IbdFtl.ERatIpwQ8EPaq', '2025-11-28 19:18:13', '2025-11-29 19:18:13', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('0ee4bdf2-e29a-4fb9-982d-d79e75980b16', '11111111-1111-1111-1111-111111111111', '$2b$10$F7DsZCan40OCj99Z0is44OIIhGF1I./XEayblJhrVdIRrfp8D8HB.', '2025-11-16 12:17:33', '2025-11-17 12:17:33', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('10711d29-af79-4eb7-9210-8dbc57783967', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$TusCZO4u1Kr9CVFcZe75ouGuBXq03Ou4lX7GS2hhRoGjYYPnl0LUm', '2025-11-24 15:02:50', '2025-11-25 15:02:50', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('10a51fa7-54c5-420b-a177-7f921030a6b3', '22222222-2222-2222-2222-222222222222', '$2b$10$RplyEscGjZWItNdDbiQvL.ivXjzMYTEXpH8HPwfM1n.4ug6ZIQXla', '2025-11-28 19:15:06', '2025-11-29 19:15:06', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('1137a9a0-d05b-48c1-901b-ce1949d68643', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$Bk2nFTEYSAD.OJwvbMcuq.tOvQ..zd/PGT2/W9tMvUZ0iXc1vkM0e', '2025-11-13 13:00:25', '2025-11-14 13:00:25', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('115131ff-445d-46db-9756-185bfe175c24', '44444444-4444-4444-4444-444444444444', '$2b$10$KP.gRx92ZlAATi4.TdIa0uSTYCi/DUvclwqcYkhGLvjgA29dIKLCC', '2025-11-28 14:14:05', '2025-11-29 14:14:05', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('117f08a6-6115-4f1b-8208-3dc9c44d0d0e', '66666666-6666-6666-6666-666666666666', '$2b$10$QNRGH.EA1HpPufvqxc1G0uusQZhOIm5tNLZnpVJyV8yNRG0/Vkbw6', '2025-11-28 18:26:59', '2025-11-29 18:26:59', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('11eaebd5-4f69-43e6-9756-06e7bedb8d86', '22222222-2222-2222-2222-222222222222', '$2b$10$sFmFf7AOtQApigf/zQtAfO7OnF/3/ePLzTgRNQpjxDPMdIMO/nhBm', '2025-11-28 11:40:58', '2025-11-29 11:40:58', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('13d7accf-58a7-4445-bbfa-5c4015370e0e', '44444444-4444-4444-4444-444444444444', '$2b$10$nJJn3MqWsBuaRyGLu61rferkWuyEUer55gJs0ZR1v6O145bGYGDMS', '2025-11-19 13:43:42', '2025-11-20 13:43:42', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('13fa97ce-7a7a-4dec-9076-b8eff2687c05', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$b7L4DVel8lvDrwcprq5dROMUdw2K2EdzJSVnGjwMYjDk/JIJkW81i', '2025-11-11 21:49:37', '2025-11-12 21:49:37', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('1502e3c4-b480-4830-af07-5254a23be5e1', '33333333-3333-3333-3333-333333333333', '$2b$10$eNU6Den5AkM/so3x5lBNautFTkNvdgh8xvPgvXbCZemn8NbI976Vq', '2025-11-29 09:59:28', '2025-11-30 09:59:28', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('15360f6c-3799-438b-bd57-5dfafdc81b97', '11111111-1111-1111-1111-111111111111', '$2b$10$sqWNCjOGsXq96HqhnPFOTOR/WHB7UzzMhxhPmFYzOR0xtUfU.4Zyy', '2025-11-16 12:20:18', '2025-11-17 12:20:18', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('1654bdfe-03f7-40b2-a064-de2b3dbf12fd', '22222222-2222-2222-2222-222222222222', '$2b$10$mO5MR2e2Difpu4xbPXz7ceIrqtNVyRL6SgYq.4eTHrAtVnDdforD2', '2025-11-19 09:23:14', '2025-11-20 09:23:14', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('167e22e1-aa23-4d3e-9ce5-69defa71ed0a', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$ccSVeVRubO.OM9OvgzpxWOQbGkt5/OjtP7eoB6bn5ijTdUq8Dlzgy', '2025-11-12 10:55:58', '2025-11-13 10:55:58', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('16b980a7-7f37-4a2b-95e9-0433e44aa0a4', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$f37CNrYBFPWpNUljKL536.Xsky75mu7teGtuz4QWkmtE8Z9JEYaJ2', '2025-11-19 09:01:51', '2025-11-20 09:01:51', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('175b0cef-b397-4447-9da1-3b8cc29308f1', '66666666-6666-6666-6666-666666666666', '$2b$10$qs6QmL7jFBCAmnOUI5SUIu0jHGIAaDrkZlZXh.2ySTHNervtR5hiC', '2025-11-24 08:55:30', '2025-11-25 08:55:30', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('18e01aa7-f920-4df1-b1d0-1dff28404085', '11111111-1111-1111-1111-111111111111', '$2b$10$n94ONDJv6aqcGWF/4F0hC.Bg.qVw0JubtuDd1QI4HN6KX6dzeI1I2', '2025-11-28 12:03:26', '2025-11-29 12:03:26', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('194d97d5-c8da-44bf-8ba1-f6cb2cd5ac78', '11111111-1111-1111-1111-111111111111', '$2b$10$tzcK62wltXfGsR5pddAqs..KJ6dUht8Xzr.bvZ6cKE.V5oH45313S', '2025-11-26 11:12:48', '2025-11-27 11:12:48', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('1b3da547-41b8-4d73-8d47-b0ada5f48bbe', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$8TntcPQNRRQ1dxY.XLYdYey6rZF.7VWEWGJ7zCEKvWeEQPP.XThMO', '2025-11-28 08:56:37', '2025-11-29 08:56:37', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('1b605978-6019-49fa-ad26-7d1220380ab4', '44444444-4444-4444-4444-444444444444', '$2b$10$AvnsEDudGOJ91uqPZ467fu9N4zc.apr7MUx5H1S21bd.9jhCMskee', '2025-11-26 15:20:31', '2025-11-27 15:20:31', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('1b7acfe5-215c-4208-bf2c-2f82f3066884', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$TYn4DPcwrzbzZI1ePwmNl.xU5M6Ef/Y/9nIOX2qqsvZUJl6EHugDS', '2025-11-11 12:18:48', '2025-11-12 12:18:48', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('1bb403a3-eb7e-4642-bb43-dfc7685f5d1f', '44444444-4444-4444-4444-444444444444', '$2b$10$rqV.UvBh3gpZGGcksyq0nOl52A2B6eZgbanFWgrtYCFhKZoxdlQSS', '2025-11-19 13:38:20', '2025-11-20 13:38:20', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('1dfdd048-05be-4f6f-a8a5-96057211896f', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$qhdaek25USs0MvrZbIWI1.N60c2P4gbq2lyGQDfYm4IYHXy29wpwe', '2025-11-27 18:31:30', '2025-11-28 18:31:30', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('1ea6bd1d-f162-401b-a19b-137460707022', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$o78L0lCbouNGguoCKG7AlOIIIUESpMgHhExf/hFTr3VWOBBekCXQy', '2025-11-12 17:15:10', '2025-11-13 17:15:10', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('21107284-8353-4cad-88f5-77c2675bee9a', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$EJ0G8JW5y.pOzCgdnpxIluZiJ3MoLh.1mAUm33V9643LEwBX4OPN.', '2025-11-18 22:17:43', '2025-11-19 22:17:43', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('216ad6cc-cbc2-4175-bbac-014d4a609784', '44444444-4444-4444-4444-444444444444', '$2b$10$bW5QB.rV9G2PeBRHGBicrOOK0NKSAkSDPe0xN8gIrNX4C52nCs67i', '2025-11-29 09:16:00', '2025-11-30 09:16:00', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('21b2a1f0-fdf6-42d9-a147-93108edffedb', '33333333-3333-3333-3333-333333333333', '$2b$10$EI7cgWb2fJnE2EIVWWs/uuFbhZVwyNze9FfcHpI75/Jo6wrRi./kK', '2025-11-29 09:18:31', '2025-11-30 09:18:31', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('2295e191-a66c-43ca-a826-d000eaace0b9', '44444444-4444-4444-4444-444444444444', '$2b$10$Zr2lyBjjhHs7Z/LPLKmFzeWDKky4BdLCAsIZdBeGyfRyi9aUuiY2q', '2025-11-29 11:33:43', '2025-11-30 11:33:43', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('2455ff93-f200-44e7-8cb6-b6bc179da4d3', '22222222-2222-2222-2222-222222222222', '$2b$10$OgjbwWzjUsvbGDCMSmJTVe22pSceYAPXfCihr1mnca2vuBQxaiVAy', '2025-11-21 10:08:25', '2025-11-22 10:08:25', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('248d7ab8-19d2-4755-b4a4-366606ab42d8', '66666666-6666-6666-6666-666666666666', '$2b$10$l/TB4on0m.zhg0rc2GpoDulCZ1cs4kaT1ZrxsGVv4cBZF/qNOUEH.', '2025-11-27 14:10:48', '2025-11-28 14:10:48', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('252ebae8-abc0-4287-846c-727ec09a1103', '66666666-6666-6666-6666-666666666666', '$2b$10$ogGNalkt1oOG8FeBApw0Ju9pPCvr3bs4Catsla26l4LxSdCvf4zEC', '2025-11-28 13:44:01', '2025-11-29 13:44:01', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('26ba98b1-abda-4b6f-84a6-c12f489fc5cb', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$6xa4vjPSQYqaH1Yq7wfcTOrsTRaixcjucVJkHRZoTtYWZ.sMurwLq', '2025-11-17 19:14:59', '2025-11-18 19:14:59', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('27a099c3-5a8e-4270-8d5c-df2859c130ed', '11111111-1111-1111-1111-111111111111', '$2b$10$AEZy0RBezrrzfeOA0g3F7.YdIEgyPqJprDFl4ctyWcYc4gRxBCHTe', '2025-11-28 18:17:53', '2025-11-29 18:17:53', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('28baf7ce-5006-436e-b008-1b6256e996f0', '66666666-6666-6666-6666-666666666666', '$2b$10$Uy7aj4zGqGJzQKqa6/oOsem3nJCZWs9dWcx2htTtd03r5geXAI1me', '2025-11-17 15:52:57', '2025-11-18 15:52:57', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('28e9032a-b81a-4042-bdca-5f186aa65953', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$btFNRSKKoXDTo6QsjVQF4.qujXjOqtbGclNFjZwIhO4XRNnsb9W5y', '2025-11-14 11:58:35', '2025-11-15 11:58:35', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('28f981ee-db76-4fec-839a-95e4edba24e4', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$cy5YNsauO8iAPL48KZjRu.kVn8unFzrgRsZLCiqhrdgq9HO7T/1ri', '2025-11-24 08:57:29', '2025-11-25 08:57:29', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('29d77157-8bbe-4bf6-9468-a14de0357851', '22222222-2222-2222-2222-222222222222', '$2b$10$nKTCKvY9i/.RQCJSmB3oaeiKz3sDHaUUEA4z0t5WM9Sb5YDMrF0LC', '2025-11-19 08:58:14', '2025-11-20 08:58:14', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('2a2d46d7-25fc-4402-a69a-64c2307fdee0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$d5fyxW3Kt/ZNQ1pQDds3SuAXPf9yCqi.uCI97IlxM9gc2DSRJmEaG', '2025-11-28 12:21:36', '2025-11-29 12:21:36', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('2acecd6b-7b06-44a7-b612-f1233d7b22e0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$sjwk2VYr.dP0kGgKlTTcF.JC7U5p2Tb1n0vZyTF/aMw4bFf9h94SO', '2025-11-17 17:22:53', '2025-11-18 17:22:53', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('2b19c973-b4c8-44e2-b178-9a8b0261aeef', '11111111-1111-1111-1111-111111111111', '$2b$10$VinHSmjnbrBhH8y0TDVVs.Ob3PQ8Imt25UXdWGW38GINh4rBC8uZa', '2025-11-21 08:46:28', '2025-11-22 08:46:28', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('2b2ab768-aaeb-4e45-8216-b4bb15859d99', '66666666-6666-6666-6666-666666666666', '$2b$10$JliHb4WrFfxoD2c6PqFH4OqtTzQ2XWTNE98ojEY72UBKm7YYWOXqm', '2025-11-27 13:51:57', '2025-11-28 13:51:57', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('2b4a891e-3049-446a-8056-179fea3208d7', '66666666-6666-6666-6666-666666666666', '$2b$10$chdtg4.xDX6ZHLLYZ8o/Ru6bGHNioeHkPtyGSMCZnbkLXgtFCij26', '2025-11-16 15:25:07', '2025-11-17 15:25:07', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('2b9588c9-a00f-4a54-9c52-b4c063d51606', '44444444-4444-4444-4444-444444444444', '$2b$10$dSuEHuIMxQdjWp7St9SupOC5kDY3.OZ/JEVguAlK2O7kdXihTzrym', '2025-11-29 10:35:26', '2025-11-30 10:35:26', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('2dc6f3fd-6351-43af-97ba-741a0d132a32', '11111111-1111-1111-1111-111111111111', '$2b$10$bTG0gwr9MJhEMKZ.9X1Dne0.c28xvxIR02eeJQ2/.JugQlpYxYvxy', '2025-11-26 15:53:04', '2025-11-27 15:53:04', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('301c59c6-fb45-4bdd-9a1e-891579f6e481', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$XdNQuHf45YlzhsC9bVrqH.LCkDQhnPs35cqGbuw6zle04an2pCAee', '2025-11-17 16:15:37', '2025-11-18 16:15:37', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('31178593-897d-4385-8efe-cf1dd32223f8', '22222222-2222-2222-2222-222222222222', '$2b$10$55XXX66eS5XvfBw2ylIiEeGcYgokZPOJKw8KmwX5b0knTZ8He0eD6', '2025-11-29 09:52:32', '2025-11-30 09:52:32', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('31bc237f-6edc-4971-baa8-cbcd1afd8cb6', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$SvPMCgTel3//.B47Zi7NvetemRwHMOdoyF45dl8s4cdVpm0ASiYAO', '2025-11-17 16:22:26', '2025-11-18 16:22:26', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('31d33d11-b33a-4373-8d3c-9a1b6d24e2f2', '66666666-6666-6666-6666-666666666666', '$2b$10$K9m2/LsoMc0vidhShMa6POuJpCmBHkypvsXIGV2luzqj.Yj42Bfam', '2025-11-25 15:50:22', '2025-11-26 15:50:22', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('31d64fd8-77d4-4306-ace6-23d1fc8bdac8', '11111111-1111-1111-1111-111111111111', '$2b$10$2.jQe1ExnjbIY6ZJIsyC.OPvgXBTicCw1zGou7XrhA6FO9CzOF6ta', '2025-11-28 19:22:39', '2025-11-29 19:22:39', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('323ed820-645b-475c-9ffe-6111bf83295b', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$wa5Lv2XlAyduz8vENfg.j.ROLIvcL2j6EwtiafHGzUm0TcCAoioSi', '2025-11-28 11:10:30', '2025-11-29 11:10:30', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('32df790b-7f94-4d9d-878a-99fa750d1d51', '22222222-2222-2222-2222-222222222222', '$2b$10$tTcIm0BYCnr5WhxuaRGTF.3ghlid1mWBPIqH4YBksuo6PwffSVZ5q', '2025-11-27 11:33:59', '2025-11-28 11:33:59', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('32f58a9b-513b-4851-b160-57bf24c9ffdc', '22222222-2222-2222-2222-222222222222', '$2b$10$pzF9C9991nLPCsbxyq99SuR4Kt/qbtkqIvPYtvg9TpUzj7XPkz1f2', '2025-11-29 11:42:35', '2025-11-30 11:42:35', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('3351c631-4462-4554-8109-037e644d626d', '11111111-1111-1111-1111-111111111111', '$2b$10$kSzBYmnZoxMMyHWBKhULV.ZCeqsI7mEqAdYu.6r/1sPBmfWZ1Wh1m', '2025-11-22 11:52:07', '2025-11-23 11:52:07', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('33e924a4-3089-42c9-a988-afbd42b96a1d', '44444444-4444-4444-4444-444444444444', '$2b$10$ENSPW0hu2RnQ1of.ru0goeBn9vlzXGLB9BI83bhJq5IV/rsIISOjm', '2025-11-28 09:33:59', '2025-11-29 09:33:59', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('342b6923-6884-4df8-a7fb-78da0cf33ab3', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$71jpzEANuKQ62BRkVYI6ae.c1gMF2K0QSS1oDORIvJVcCTFHzskyu', '2025-11-17 19:40:16', '2025-11-18 19:40:16', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('35122fa5-deb9-41c3-b0c4-c9241cb2ff59', '11111111-1111-1111-1111-111111111111', '$2b$10$2RkG8y0CGEyyY3CXTMftgeWSkY0RktwHXJ1Z8Ox9xciIPrjVyaEKe', '2025-11-16 12:47:47', '2025-11-17 12:47:47', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('364c75ba-0795-4917-b786-0c76ebab97c0', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '$2b$10$3nmRgu8NWQoyqsP/KcQVY.Ehr41oNG9B.rYl3x26geFPHHc9hIcqa', '2025-11-19 09:41:49', '2025-11-20 09:41:49', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('3672327e-9678-4c24-ae08-c05dc049d09d', '11111111-1111-1111-1111-111111111111', '$2b$10$56q/a2Y8TAg6fApPqHqIt.SO6TNWb9H5dE.dbo7ayPLuRx9uOYHvO', '2025-11-24 13:41:00', '2025-11-25 13:41:00', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('378f36d4-9ca3-489b-bc2e-f001460e0396', '22222222-2222-2222-2222-222222222222', '$2b$10$5vH0BQJYTQoe88BUd1xozetrRx.GBAipzTVAZZGGwg0v7.BC8r6J.', '2025-11-17 20:00:10', '2025-11-18 20:00:10', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('37d7a985-8633-4be3-8679-b52fe8ee2445', '22222222-2222-2222-2222-222222222222', '$2b$10$dFi9X4pWdO3.3YpguYwLIOWlAXn3gUAXI75QjeRqj2lPNoT0jdjRa', '2025-11-19 13:42:43', '2025-11-20 13:42:43', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('394711eb-3327-4bcf-a891-f9e900b87494', '11111111-1111-1111-1111-111111111111', '$2b$10$FMsEUemJOwhJhjgL9ojrKeYpCiSNFw0uUfkmzweBC9PwYIV45ecmG', '2025-11-25 17:30:48', '2025-11-26 17:30:48', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('3969a159-1c8d-451c-b0d7-d79fe3667973', 'b656634b-477f-4aaa-817d-e0a77f75d88c', '$2b$10$szgeVyYFKmPwxpH9xNugZ.mx4KSO904gxrn4ZiaJhEt6zl0VmK3Wu', '2025-11-29 10:13:40', '2025-11-30 10:13:40', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('39842f46-547c-4d34-a340-20237d5cfb15', '44444444-4444-4444-4444-444444444444', '$2b$10$OyDXIkdDlx4fAzDTqcP3fuxwzQw8eZGBHAhVIOuCh/mwU0a.s5ULC', '2025-11-17 17:28:12', '2025-11-18 17:28:12', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('3a1d4aab-484f-451f-8ebf-d738f29a9598', '11111111-1111-1111-1111-111111111111', '$2b$10$uqqoMJk4xuJ4rU.itsHIb.7FVNDM6ZviJqjobXuo2QYpovhP.57Iy', '2025-11-28 12:30:55', '2025-11-29 12:30:55', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('3a8067d9-906b-4885-9ff8-3c486f4ef1c1', '66666666-6666-6666-6666-666666666666', '$2b$10$wJ1JwFeG0R3.C7t95cf63u/4M1XYsTNOqvPID8YxeZQs59kw9cTDm', '2025-11-17 15:45:45', '2025-11-18 15:45:45', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('3b4f532c-4379-44e1-82ca-d2088013f94b', '11111111-1111-1111-1111-111111111111', '$2b$10$YsOO1HAUG88MPSfIWgeLYeY5G4nGgxp2idVigkJraTnnkHhXp/lFy', '2025-11-21 10:08:12', '2025-11-22 10:08:12', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('3b87d9e6-3f69-495a-a52b-13144c8f7fe7', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$WC4hKOCaczUPcsN4ffbjD.0STwo0Xoym7PKcNKNcP4azSq4/zt65a', '2025-11-11 13:50:46', '2025-11-12 13:50:46', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('3b908d89-2768-44c7-b5b5-28543d7f3ab9', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$7DeMAFXl0FTp4x/9PI2UReB6RQirew9n90K6Nfo4dQBkbytbAWpvK', '2025-11-18 22:01:54', '2025-11-19 22:01:54', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('3ce883ed-b291-4e61-af43-1eab8da0e453', '44444444-4444-4444-4444-444444444444', '$2b$10$Qpr.iKh7M2WsgFtdEv1kUukCCGCZWSQygvwhST0bLmQ4yztIBqwP6', '2025-11-28 17:41:46', '2025-11-29 17:41:46', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('3e049d24-aab4-4001-b3aa-05e3a0ac1016', '33333333-3333-3333-3333-333333333333', '$2b$10$ShD0KRofeyl5Okq2GhUoneo99Kkh.fseSFRBXLxRx.JVueez8w1BW', '2025-11-16 14:16:26', '2025-11-17 14:16:26', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('3e64b759-ec68-41af-81e2-21b7074396fc', '66666666-6666-6666-6666-666666666666', '$2b$10$Q2aYBoNAjy2k3.cL342M8uYb8/mswUF3kPnUjgE3otTqS5reng1CK', '2025-11-27 17:57:50', '2025-11-28 17:57:50', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('3f4969fe-01b4-4dcd-aef5-866039d50f6d', '44444444-4444-4444-4444-444444444444', '$2b$10$J1eEvXdoHHg07ZnNcz.6kuY07gP/3N.rxDIjaEf67RMRDVRFdIPlS', '2025-11-28 15:28:51', '2025-11-29 15:28:51', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('4005d86b-015a-41fa-95dd-45292ae122e1', '22222222-2222-2222-2222-222222222222', '$2b$10$atgUQGB1o49x/qlrtftkFO2D0HDJnoL.PgIt2Xv8DzgxAfHOgPR/q', '2025-11-29 09:55:23', '2025-11-30 09:55:23', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('40da3ee5-a29b-45d8-9d09-a416600480dd', '66666666-6666-6666-6666-666666666666', '$2b$10$Xw7V47OiaWUI5CyiLZBygu3TTT8pZv71Ki0ZHy8vkKUB0ED8ShXXK', '2025-11-28 15:49:09', '2025-11-29 15:49:09', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('4190156c-4b89-42fb-85c3-88a98d8ce7c9', '44444444-4444-4444-4444-444444444444', '$2b$10$J3bl6OChqMJyPUA37xOpJerP8nY0s3NEPlNrY1k4NXMxjx1seds9K', '2025-11-28 12:13:41', '2025-11-29 12:13:41', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('41dc052f-ac92-4ae7-9e16-9c9029c563c2', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$WMoKr4eEm3kJWRk5kgM.O.xdX0s5zqLeCi6s8IBccSDPMvQBTos36', '2025-11-28 14:11:17', '2025-11-29 14:11:17', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('422e0386-36fc-4d4c-b221-4b5fa0210cf2', '22222222-2222-2222-2222-222222222222', '$2b$10$laEqK804Wy7X2Mx8lRp2i.01hCB0/4JTFO.ZsnFeHZ2tFcl62768u', '2025-11-18 23:53:35', '2025-11-19 23:53:35', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('424b7303-bda9-488f-9bfb-39fc0dca8660', '11111111-1111-1111-1111-111111111111', '$2b$10$vI2fO27wJhEz8oFaKbFk0ukcwYs5fQL5KTD7px/FcfsBfi8Y/ZhlC', '2025-11-21 10:16:21', '2025-11-22 10:16:21', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('427310e2-ae3d-4b54-a2f2-3cdbbe8172ce', '33333333-3333-3333-3333-333333333333', '$2b$10$ZtNG2mGCT7BggkDgKLM1Pu/AarDG7GrbtZrIH26KbwPwLSaAK60he', '2025-11-27 10:32:59', '2025-11-28 10:32:59', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('4292a528-ef23-4148-949c-428fa31f1ffc', '44444444-4444-4444-4444-444444444444', '$2b$10$WuKN4suASmXREslo.tAIKeJT4cKoT4bk1h1D2LDf4D1l8dfv/YZZq', '2025-11-17 18:10:06', '2025-11-18 18:10:06', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('429c14c4-a50b-49bc-9123-18bf3f3d1114', '66666666-6666-6666-6666-666666666666', '$2b$10$ec42zTxZ9gZ/JducL6iNPeyeK05qviLpa9UoOixDYbxkAXC02KJSi', '2025-11-25 16:43:48', '2025-11-26 16:43:48', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('4395ffe4-f412-435c-aae5-57545e0bf656', '22222222-2222-2222-2222-222222222222', '$2b$10$mOfOcFe6bxfWLaLhxnQlTua/rVWbwx4JRelKT2jodftBxux.mwHWe', '2025-11-29 08:22:17', '2025-11-30 08:22:17', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('44462993-8a82-435b-8ebe-344ac49b9530', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$Zu.kBDKZ29s4S7xE6QLhIe/XOIt0xs.G/mO8zd19DOOByoM5V9jpa', '2025-11-28 19:37:04', '2025-11-29 19:37:04', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('444c853d-6072-4531-b7c1-ae4bc1679ad4', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$M36jYylI/49m46sxJKOIG.4.G6A1cYPiHqu/v9/KspqhVhCwqw5va', '2025-11-29 10:18:56', '2025-11-30 10:18:56', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('44820b53-2e0a-48db-ac16-0e83af936f4a', '66666666-6666-6666-6666-666666666666', '$2b$10$aAxIbgPb6gF0QZ3esRlR1eeXVlfcbGRmJotoEad0gt02g/OyCcm5K', '2025-11-16 12:30:32', '2025-11-17 12:30:32', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('450c9e36-b5b2-4e16-ab18-145d50de02a1', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$/yXnADaG8eXLhJtPLnbTfekZ.YZ9Q/71tRnz2m.qBYWiM/Fam78Sq', '2025-11-28 01:25:57', '2025-11-29 01:25:57', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('45803be7-40cd-4b96-a09f-1ace094a48ba', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$vLVmucLkZvi5GIpIllgksO.vwDUL3uLfXuFuHP/efHXNl142Fb6se', '2025-11-19 11:27:46', '2025-11-20 11:27:46', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('465ddf43-e800-4d37-af7e-3487ecb15de1', '44444444-4444-4444-4444-444444444444', '$2b$10$8NUURWNcJ7y4lYJn/K9cRuZCyQtEDbGiq6J8iX8a5lTwRlF7mWm9K', '2025-11-28 12:36:36', '2025-11-29 12:36:36', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('49ad755e-624f-4fcb-8b39-6178bb69c88d', 'b656634b-477f-4aaa-817d-e0a77f75d88c', '$2b$10$dWzPLuZyS4fr6MejuX69M.UktSwKc.HDZT0NJsR9KzG402QWiSaly', '2025-11-29 10:11:28', '2025-11-30 10:11:28', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('4ac526d5-19da-4b29-810e-40ca39cf1c47', '22222222-2222-2222-2222-222222222222', '$2b$10$T/9pQroTY6tq7kiz4Sebou6tJdYMG6zTEVxMO8ElHw8RUHy4FjDFy', '2025-11-29 08:10:12', '2025-11-30 08:10:12', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('4b07ee6e-ef41-49e7-8f51-a88c5894b0ce', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$tdsncwlh07OkHaRH1zTACerdD8BOeogAqIQREHstOC50dvSAOreu6', '2025-11-17 16:32:47', '2025-11-18 16:32:47', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('4b35fddf-44f7-451d-92b7-1f5645cc475c', '11111111-1111-1111-1111-111111111111', '$2b$10$x5X3xX2oQGdWIlY0lSwqoOm4ZvPBoVD/qj5zWK2HbvE6si3kOJNNy', '2025-11-21 12:40:13', '2025-11-22 12:40:13', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('4bbc1213-2f89-4e9b-8cc4-dcc455ba7fdc', '66666666-6666-6666-6666-666666666666', '$2b$10$FUpDJvicz2pOWAlKDZJ2lO6jMZAl7vVh5z6.t24nH/xgXJujWl6xq', '2025-11-29 12:34:36', '2025-11-30 12:34:36', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('4dbd3788-188e-43fd-87a9-5c4d21f7d547', '11111111-1111-1111-1111-111111111111', '$2b$10$m0/aWC/g6.0kl5p7n4r0NeofggQsrDgof2O7Y/miR.Z5mLSCh5gi6', '2025-11-28 15:26:19', '2025-11-29 15:26:19', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('4ecc4ef7-54bc-4719-91bf-11f90f1a8cec', 'b656634b-477f-4aaa-817d-e0a77f75d88c', '$2b$10$g1AVOYxnjOpo9KiOZhWpkOzoxjdZW8x9YZv/FjZkD9dbIwp6bE4uW', '2025-11-29 10:38:01', '2025-11-30 10:38:01', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('4fefa43e-3c72-4980-b7cd-9b3ff6445b60', '11111111-1111-1111-1111-111111111111', '$2b$10$WUFnJO.d2Hd0jrwoasxyBeQz1W2P4Krl798ZiEldhJ32xU6dSh1CS', '2025-11-16 19:19:43', '2025-11-17 19:19:43', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('50258f26-18ec-4440-87ee-07ae283867f9', '44444444-4444-4444-4444-444444444444', '$2b$10$8/YmBtI73BFZf0Ms4GdpwOJ6dmNGybGtq0eNUGS4AJ6sTZa8OjaCC', '2025-11-28 12:34:33', '2025-11-29 12:34:33', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('504e8955-52f8-4b4a-a5dd-848baa4e836a', '66666666-6666-6666-6666-666666666666', '$2b$10$bPvDJG9dxPRI2Pcokp2HjekLSHb8j6B0ymyU02x2/sna2R5kzUzwy', '2025-11-17 13:05:50', '2025-11-18 13:05:50', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('505a118b-6109-4b04-970f-6a4ca60e0130', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$yOe9Hy0roWGXYyQlstuZhOfo88McsczgHTdiIcB//kFRQMKYKr2aG', '2025-11-28 01:22:43', '2025-11-29 01:22:43', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('50a8a658-2b98-4e21-895c-d454fea12d99', '22222222-2222-2222-2222-222222222222', '$2b$10$hdZAIX0EB0gIyaBfxd3ygu8XoV2FjlqOBi97RJ5vZ3RITV5fAfzUe', '2025-11-28 11:54:39', '2025-11-29 11:54:39', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('50ad86b5-314e-4410-a13c-1e9dae7f9024', '44444444-4444-4444-4444-444444444444', '$2b$10$1FBBFzHYIE4U0FRzr1xSPeYO7aKIyJScaxoiMriNmZp9/iKygxIqe', '2025-11-29 11:59:04', '2025-11-30 11:59:04', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('515ea459-bd48-4692-9c46-bf7a23bbf5ec', '44444444-4444-4444-4444-444444444444', '$2b$10$Cgu4L4Txoegs1C5rL9re.OkVSG2Tt8bIKjaUKFJDiiI26cus/vLpS', '2025-11-29 11:06:02', '2025-11-30 11:06:02', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('5266231a-f8c5-40a5-9522-bfbd38514e5d', '66666666-6666-6666-6666-666666666666', '$2b$10$Kg5da3SQrT37EhxR.jXIOOd0xa2t7x7D15ZjLFiMKISbuVnIqqSbi', '2025-11-26 11:00:03', '2025-11-27 11:00:03', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('52795cee-5d09-4f0c-bd68-f3a7de6e722b', '22222222-2222-2222-2222-222222222222', '$2b$10$sSWKBXF.SQ4UNWQJLPyEoOlVlQHEZ/mEOXHxc.jY/1mMtDe0vOKL.', '2025-11-28 12:35:39', '2025-11-29 12:35:39', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('53ff23c6-c4ad-4c8e-8fb2-1fb09d22f812', '44444444-4444-4444-4444-444444444444', '$2b$10$8MoqgMfRfXB6dvlMMrcJh.l9RzB7ACF1n8mCMaROCEBs9tGp7oSxe', '2025-11-29 12:51:10', '2025-11-30 12:51:10', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('55119644-10bd-4b02-aa7f-e662c5d9adfb', '11111111-1111-1111-1111-111111111111', '$2b$10$d1I2bc7cLzTMJcBlcxvQMOr11ryKj627hfiCY8n7b.EIl4uRoDe.q', '2025-11-29 11:32:15', '2025-11-30 11:32:15', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('5803cb24-28a2-4731-8466-5d66581abfe0', '11111111-1111-1111-1111-111111111111', '$2b$10$vE2K0xIz6JKlVHSaH0SjS.DCV4MBeqI3Rjw7.11rpzvwOKi0qQKOS', '2025-11-28 11:33:21', '2025-11-29 11:33:21', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('58739fd3-bf31-4863-8d84-1a6b6dc80b8a', '22222222-2222-2222-2222-222222222222', '$2b$10$P0otzqfN/vEZCLFHkWtW2ukef6yGdPcchuzhGxRvD0IrDDbcoKh0G', '2025-11-24 15:12:25', '2025-11-25 15:12:25', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('58ebd118-63fb-4cc5-a530-9a35edc983d1', '44444444-4444-4444-4444-444444444444', '$2b$10$qRgiOSzPKx7b1TV2s99ToeyZwrcwiNzX/Bs9xr2HQULljYdq0QDuu', '2025-11-17 19:37:15', '2025-11-18 19:37:15', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('5b500c8c-80f5-4796-9e5b-b24ea5591b19', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '$2b$10$.xTxj0z/IAWhEqGfayKuOuLgu9Ah2uuYi6bcfKCyueTMbfxwkU8.6', '2025-11-24 15:04:55', '2025-11-25 15:04:55', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('5b75fc24-40ff-4cea-bde8-7e501c15afe6', '44444444-4444-4444-4444-444444444444', '$2b$10$7Xxg3B3mgSWK4l0Hbcu4y.5Wb2bxA8Y0Fg4nYkKSzHvTGiPKe6whi', '2025-11-27 18:27:29', '2025-11-28 18:27:29', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('5d771e66-f7f0-464d-85a4-ea32c8b39b97', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$kQRBD9ORoSXw1JqNwx7FDeBxky3cNPA9sW3Q/wLgrDkuBwPdu8lnu', '2025-11-15 12:29:18', '2025-11-16 12:29:18', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('5d9d030a-bf0a-4a0f-b731-7cc9d6108f28', '22222222-2222-2222-2222-222222222222', '$2b$10$QQsmquKOA3IfM.LNmeQmpOK7ZJPnjhC2K0LcbVXG7Kl0GLtLRBO3K', '2025-11-17 18:24:06', '2025-11-18 18:24:06', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('5f73f163-04f0-4647-b8e2-7d1a2bc02756', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$tYIR68wi7FhX0ycUklpg8.yuZAksZdVnpWWqs/sLIM50KlRAgyr..', '2025-11-27 16:01:13', '2025-11-28 16:01:13', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('60e16b49-a9b1-4513-84be-a2bbcead23e0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$TdNZ01PLycbjpEXhL3mN5efzm7NAB3iU2csjBogJF4Ec1UeE7vcU2', '2025-11-28 09:34:15', '2025-11-29 09:34:15', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('620c8ad7-e15b-48de-b13c-b74a3142e657', '11111111-1111-1111-1111-111111111111', '$2b$10$3hry09aGZQTKGsn9I6Qo2OaG/NJ7Do/z9jr9ZKIS4xtVn2VfI8gQu', '2025-11-28 01:35:09', '2025-11-29 01:35:09', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('62448c28-43dd-4a92-9b63-2f139962a907', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$xLpGNIZNY7Mtsdh8wYYpUeoSx35p8S1IeMrmVHK2u4hO/hRtvlplG', '2025-11-27 18:12:45', '2025-11-28 18:12:45', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('637b003d-dce2-43a9-ab8c-9d2bf0494641', 'b656634b-477f-4aaa-817d-e0a77f75d88c', '$2b$10$aQmODx2yaF.jUNnv/tCjK.QM6TCRuIYPvCSU6ER0lE5G./03urXuS', '2025-11-29 10:29:30', '2025-11-30 10:29:30', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('646bdbd2-633b-48e8-a7e5-f0ab11777e27', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$fy3gVXOPlgH/382e4Oo/NuMk3V/a2rzvHOc2eF.TKiqfebZwH9JRy', '2025-11-28 11:37:02', '2025-11-29 11:37:02', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('64a101a7-23da-49bf-896c-bbc2a990a842', '11111111-1111-1111-1111-111111111111', '$2b$10$xaOXMdbJAFc.NTcwVEZf8.AbEqWvhhBphee4VMQb/ewtH3oS2t0vq', '2025-11-29 10:24:34', '2025-11-30 10:24:34', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('656d9bd2-cf7a-4720-94a4-514616548280', '55555555-5555-5555-5555-555555555555', '$2b$10$/AQjNUFQt6IN2pYmCbPwEuJWq00gdQu.UHdW7LlZGZoSahunyiXh2', '2025-11-27 10:34:44', '2025-11-28 10:34:44', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('662d2a2f-e22b-4fef-b8ea-59f4d09612bf', '22222222-2222-2222-2222-222222222222', '$2b$10$ZcIvuAL10RdJExZjMUZKneztNlvHo/jYQqwq.2FvplxNQNVYgt/Na', '2025-11-16 12:43:32', '2025-11-17 12:43:32', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('669a1f02-f1b8-46f3-8cce-a32956fd7198', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$VQcVk1j69VePUflIMrq97OvKDfqCbwjMRQiyL3xUeJh6PzQu6A6la', '2025-11-16 11:38:48', '2025-11-17 11:38:48', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('68803f0a-272b-4261-a82e-735c69cc8938', '44444444-4444-4444-4444-444444444444', '$2b$10$dvQ0rCjL2YAujQ26Ew7nh.YVloPCjqMo0iRocfW.1i1fK32fimGjy', '2025-11-27 13:32:41', '2025-11-28 13:32:41', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('68de3cb9-2a8f-49b7-a394-76b2cdc7f3b5', '44444444-4444-4444-4444-444444444444', '$2b$10$n0JlZpcK/3ZS./5cyjT6VOqS.JLB8vEMPhG28r8uk5qZpnQ1gpuHi', '2025-11-28 11:54:14', '2025-11-29 11:54:14', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('696a62a9-5eec-4c15-8b7c-a5110eadb559', '11111111-1111-1111-1111-111111111111', '$2b$10$MZNMx38IpP/O3S1fxs/vxeQlp8KaSvIff9OjHPYfllFESpoKhvWB2', '2025-11-28 10:10:51', '2025-11-29 10:10:51', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('6aae4ab2-03ab-4470-91cb-1c12b4703e1d', '11111111-1111-1111-1111-111111111111', '$2b$10$LbH2RNO/dW5PlsYlmcd/kevQAyk47JJD0ChzBzWQFlbUayqLrXjn2', '2025-11-28 12:20:30', '2025-11-29 12:20:30', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('6af906e9-3e36-4a45-af83-d1b40c109252', '11111111-1111-1111-1111-111111111111', '$2b$10$SAkySmRlVIF8UhSA5xu1SukxBTNf.JyCiQq2Ul10jdIYa155flzSS', '2025-11-28 14:12:20', '2025-11-29 14:12:20', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('6c793eda-77fe-4865-85de-3a66b97ecc41', '44444444-4444-4444-4444-444444444444', '$2b$10$6JuEBYS73OXP/GT5ZigFY.kZIMDBV9rPCFFpMbpSnAItkGnU5lBkC', '2025-11-28 13:37:15', '2025-11-29 13:37:15', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('6cdc7511-1d32-4cc9-9126-2a261e9fc8e4', '22222222-2222-2222-2222-222222222222', '$2b$10$ZTwITGwBB4Fj8Gg7pFKoUOtUOxZnBz1udzIGxi1VO2UUmR.zy.mEe', '2025-11-28 10:04:09', '2025-11-29 10:04:09', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('6cfa6474-cf6e-4f29-bcb9-71bf72d93584', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$qG5yZ7ou7Z3B1tkElMztJOcUkhf3lQ3ECTdQ9fPZrWeVx8OSdmY3.', '2025-11-28 11:23:43', '2025-11-29 11:23:43', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('6eb4f21b-d4d1-4706-a72c-482923e83ee6', '66666666-6666-6666-6666-666666666666', '$2b$10$YzCtUGjIa6DieSBlRcOapeIndXfDufYfvgdD1iEZfWSY9AE0/UUGi', '2025-11-16 16:07:35', '2025-11-17 16:07:35', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('7049a085-a4da-4051-8c16-127e9668189e', '44444444-4444-4444-4444-444444444444', '$2b$10$4ukZ9V6mpmDjeeAquil./unMGhwMktVOvSXTx4x6hWubdGfKTVzYe', '2025-11-27 10:45:27', '2025-11-28 10:45:27', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('70d031f4-20da-4a46-81ce-5733e51c769a', '22222222-2222-2222-2222-222222222222', '$2b$10$hTmXNhUI0yvtYtSxCLCrFORpvSFLQ9oxpwlBAkJ7oyDWKUVZl7yNq', '2025-11-17 16:12:28', '2025-11-18 16:12:28', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL);
INSERT INTO `auth_sessions` (`session_id`, `user_id`, `token_hash`, `issued_at`, `expires_at`, `ip_address`, `user_agent`, `is_active`, `revoked_at`) VALUES
('70e5abb2-6161-42d8-ac53-cdf10b7e31d2', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$RytNuhUNOTDF0nNZ4fO8FOFU5mkaAVs/9B5FWB01n3lOzmYpXbnX.', '2025-11-11 21:52:30', '2025-11-12 21:52:30', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('71f8d77a-9355-44d7-83bd-222443b4b574', '66666666-6666-6666-6666-666666666666', '$2b$10$6VIdXz57fynjdJEvgJYhL.bP8JJ6VVAUkD3bY4aaNX/fN004h470y', '2025-11-17 13:07:23', '2025-11-18 13:07:23', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('72aa1c4a-8a30-46ee-b1d4-166fc9a67516', '33333333-3333-3333-3333-333333333333', '$2b$10$9gJp/k0k9cSMdtdiXRDCpe4/avyCKSCLIwaEZlQiCu1Y75C9AlT9q', '2025-11-29 10:10:59', '2025-11-30 10:10:59', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('77fb84d8-19b4-43f8-b083-4128a907077e', 'b656634b-477f-4aaa-817d-e0a77f75d88c', '$2b$10$RUeUsp13cZqhR1zpHtYEzuwgJNhWFN78tdPFiD/M3aYMYRH1BUrRe', '2025-11-29 10:44:28', '2025-11-30 10:44:28', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('782a55cb-88e8-4399-b57f-0687801a352f', '11111111-1111-1111-1111-111111111111', '$2b$10$lPQ.tOGh2sDEX5sDznaXMuXnzeG.L.HF36gq4NLS4MGGWOiH4ATQa', '2025-11-21 12:09:14', '2025-11-22 12:09:14', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('78509deb-3f1e-4d65-9454-3e1e8e099d09', '22222222-2222-2222-2222-222222222222', '$2b$10$2qik9vaX6h7PsyfRvc/aBOZ5V7DKClbdsebwxeZRG/mke0rmrGGSe', '2025-11-16 12:53:46', '2025-11-17 12:53:46', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('7893fed4-4d49-4d2a-96f2-ae863787c2e4', '11111111-1111-1111-1111-111111111111', '$2b$10$iKGYrawEmYypZyp74dnTfOJJRcTTCu0rHrJyw8K64lagKIvNw6c3O', '2025-11-24 08:05:55', '2025-11-25 08:05:55', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('78f73c71-7400-4e46-8531-1d16d5c799ff', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$fIc0zmOVCdP2/1983QFoauwnvzUmlD7d4YLmlc8TJ1Csa4Of7N7Ru', '2025-11-17 20:06:12', '2025-11-18 20:06:12', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('791130b2-2326-4cfb-9a6d-d005ff30062d', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$.2AGEm.3X1PzmfawYfcwxu7ipQZycFW22CDD/3fiDvw9NRZUPXhMy', '2025-11-24 08:51:41', '2025-11-25 08:51:41', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('79d1e113-70c9-4842-aa3a-182559e78422', '11111111-1111-1111-1111-111111111111', '$2b$10$7mIIb3ShmebMHogNr9gzuOIBBTdjioCfMLZFF.V9eRvhsXwc6uOdG', '2025-11-19 11:58:35', '2025-11-20 11:58:35', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('7a20e92f-26cd-4a8a-b32f-25e9b70f16b5', '66666666-6666-6666-6666-666666666666', '$2b$10$.K18Q1Jd8U/xV9u.d1OUjOdLTZXjixXYvv2QFcYU1bjD5qOZ2n.4C', '2025-11-17 13:56:37', '2025-11-18 13:56:37', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('7a347503-c988-43d5-aa9f-5b24e362b88f', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$hfLeeZJumpMl18ZNCRsEZe1oyv5poAtM.jM5wC3RNOqc0cCwXQYXK', '2025-11-17 16:08:06', '2025-11-18 16:08:06', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('7b6b1f1b-fb29-42da-8bfb-52b77a4c6126', '44444444-4444-4444-4444-444444444444', '$2b$10$LYgylz8DRaU/27pgSrW3yOmXXT3A09gVjpD6zE64GZv0yh8lJ34ZK', '2025-11-29 12:27:12', '2025-11-30 12:27:12', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('7b9405f0-add2-48c9-8a33-0832994eb230', '55555555-5555-5555-5555-555555555555', '$2b$10$5v9c1WlSSN0aI9IDhN1DMOHt5UsAuD3GFkpSTHoaPjOgC1HnNGSiS', '2025-11-29 09:13:34', '2025-11-30 09:13:34', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('7bb23cd6-9c0f-49d7-9e5e-77a78428bc8d', '66666666-6666-6666-6666-666666666666', '$2b$10$YLKOdNQF5kQUSqP9CKP8u.E7GqK2VIQT47SBuXAFJ0qNXQDTIEYG2', '2025-11-27 13:32:30', '2025-11-28 13:32:30', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('7c21cfc8-ef2f-4bf8-8c1a-79210b5ac839', '66666666-6666-6666-6666-666666666666', '$2b$10$drbaHfdtg/G6.uI6aS8EX.GToCPVxCzLG/Pix.zSZ/C/eHzn5h20W', '2025-11-29 11:45:28', '2025-11-30 11:45:28', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('7c5a877d-53a6-4cda-88ff-bf7af7edc801', '11111111-1111-1111-1111-111111111111', '$2b$10$Bw0vbrAu9/ziiYLR4KmJ2uCBBUKQEST1zO9dQyB6YFGzhkzMQcG1i', '2025-11-19 11:26:01', '2025-11-20 11:26:01', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('7ca9113f-390d-4737-9344-6b9e53e066b1', '22222222-2222-2222-2222-222222222222', '$2b$10$Z.EQP3pVHNzH4uhG8COBQO5VY4e0ag6TNYbvXGZEiZ/c0.opcGtA.', '2025-11-24 16:41:52', '2025-11-25 16:41:52', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('7d0121ba-4849-44ea-86e9-9b4af95d4e63', '66666666-6666-6666-6666-666666666666', '$2b$10$tXO7O4.eWKjnkez8IC/kBeXWKDm/59DViYINtOX4M4aAOyy.u7yca', '2025-11-17 15:31:26', '2025-11-18 15:31:26', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('7edb40fa-fa1a-4a19-9672-eb551c29cb62', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$dfCy6I30XyTQGjfXHau93O8FP8DxBQLrrMgTN/a1syfijgPaXhGsO', '2025-11-14 09:15:31', '2025-11-15 09:15:31', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('7f3dbdb4-2b17-4116-9b63-7350d4241890', '44444444-4444-4444-4444-444444444444', '$2b$10$nPMiuLNkBH1k.cZLgZoz0OKVPwiWTXflLa2b3aIjFMbTmefn5jiGW', '2025-11-28 02:08:52', '2025-11-29 02:08:52', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('7f6386cb-06ff-47da-9ea6-1ba80075e1fd', '66666666-6666-6666-6666-666666666666', '$2b$10$jfg/l4jbIHZKWQX4.2qWne7UMh0HpQ6Yqsh4G1pTwEmbRupko9sYG', '2025-11-27 10:17:10', '2025-11-28 10:17:10', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('7f8ef546-aa43-4d56-9cb3-f17bd4ad0c28', '22222222-2222-2222-2222-222222222222', '$2b$10$4YLuqdYP9HtNYopBs9oc8.osFtrKqPavIJSmU6S/33vLEpKFsdOhC', '2025-11-17 12:26:10', '2025-11-18 12:26:10', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('7fd939e0-5f4d-4926-af7b-ac50ad8f1f2f', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$74yig827Dxmc.iPuXeAAXed6IDYKsiADw1b9qRs9lQ264bWRMCLL.', '2025-11-27 11:30:43', '2025-11-28 11:30:43', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('7fe18a84-16b0-47f7-834f-231b7047e152', 'b656634b-477f-4aaa-817d-e0a77f75d88c', '$2b$10$CK6UlxdQH4B13Q6hyXGaG.bzbkSVFF1Erzwbmdo9Dso0oGgqPA.CO', '2025-11-29 10:39:03', '2025-11-30 10:39:03', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('808b0c88-b69e-4a49-8e9b-586a86ab0a38', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$VfNhWtOtRgCj8qXIVoNLi.aHL2CLXrbbXXWz774DtvTjWbzhzg4lS', '2025-11-28 01:19:21', '2025-11-29 01:19:21', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('81fcfe8e-a152-4123-bc27-4e733283f0f8', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$C01hTKtNaqoiK9ONNtsgpuRhGUNeJTI.BF6F7u19dCZTwUG4JVcOy', '2025-11-28 01:18:53', '2025-11-29 01:18:53', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('825491cf-6291-4c95-b71c-693b2ace3344', '11111111-1111-1111-1111-111111111111', '$2b$10$vBQBOIJr067fJGrKTKT6XeWQGM3/9ZAXXx/NAjExzaZfnjv/BFOSq', '2025-11-21 10:09:08', '2025-11-22 10:09:08', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('832e9666-0375-4668-a058-db605e9a58db', '11111111-1111-1111-1111-111111111111', '$2b$10$unDW2E92tepxzKSV5fNdK.7i5Z1x9UTlXssy9BX.jLv1Mg2uy5lEG', '2025-11-16 14:16:05', '2025-11-17 14:16:05', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('832eec4a-bc57-4fca-8e47-90805e8303dc', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$cyXszGp.7TKXVp3j/7WoDusXatWRBay24MALByWyc9pgS4OA5KvwW', '2025-11-17 16:10:41', '2025-11-18 16:10:41', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('85fda00a-000d-4c9c-bdb5-87e110e0bedf', '22222222-2222-2222-2222-222222222222', '$2b$10$BpbBSXd2Zz3HLWe5DxF3duPXiQQf53BOHLDqKRKQt9t8c9U.UxGmy', '2025-11-29 09:37:10', '2025-11-30 09:37:10', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('86332033-4db5-4bb9-85dd-15455e6c1d69', '66666666-6666-6666-6666-666666666666', '$2b$10$USrRtcwMNr8EhCYJijRij.dfVdSi.JPMMdAC2w0RMQ.WjaJ5LhROm', '2025-11-17 14:16:40', '2025-11-18 14:16:40', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('8702174d-4028-43d8-8a99-f0d53d03fb04', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$TwY9eDrcCedjNPnBCp3tdeln3mP64/2bZ/sb5tNrni2feYraECE6S', '2025-11-17 16:37:00', '2025-11-18 16:37:00', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('871331d1-6911-4087-921c-9d92b3102b5f', '55555555-5555-5555-5555-555555555555', '$2b$10$oGIph54ucPxBF9Gbgyltzuy7zUJnDKUL3WEoLdKuscx7.XQBugscy', '2025-11-29 09:29:03', '2025-11-30 09:29:03', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('88763c24-0c45-497a-bee5-f2e0948c0099', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$7qPQAx..fxph2AlMtiOvVegiitO4Ph0PyxUb2kyXUqN21IWRCJMga', '2025-11-17 20:03:21', '2025-11-18 20:03:21', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('88d707a3-1260-42cd-a607-288244f03403', '22222222-2222-2222-2222-222222222222', '$2b$10$xSh604PV/3V7mvQ5xAfsy.8v2NAXzfkFPSN/Gn1pdDCa7GT3AQBNu', '2025-11-28 14:14:20', '2025-11-29 14:14:20', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('898c912e-68db-44c8-896f-e1d800c50916', '22222222-2222-2222-2222-222222222222', '$2b$10$9rlR7TfUT3ydqISNeDILw.9zue5KL4LaUqcYjXkL3bET124nRehfy', '2025-11-24 15:00:51', '2025-11-25 15:00:51', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('89e7c1ed-e445-433b-98bc-207c02905e2d', '11111111-1111-1111-1111-111111111111', '$2b$10$iDqUYo2cx6GMyXrF9wwWeeQq4HiGSf6fC6EFafqogirAe1FIUH8Xa', '2025-11-29 12:52:01', '2025-11-30 12:52:01', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('8adc0171-d5be-4cbe-9487-8d6143450559', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$NcMrGyPLg7g4iTK8P9xBZOhN4v.wT7ptffYy2qJQqcp/hE9UgAmJu', '2025-11-29 12:51:18', '2025-11-30 12:51:18', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('9044bb98-738c-4347-bd58-4151d8c5cb7d', '22222222-2222-2222-2222-222222222222', '$2b$10$1C852kWXAVv5w9i7AglpIuZG95k6sa0Y913dojUHT8/XFFanUGCPe', '2025-11-28 13:46:33', '2025-11-29 13:46:33', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('9144338a-cb05-4fc3-9cf4-b285a7351e13', '22222222-2222-2222-2222-222222222222', '$2b$10$9GhA/BPWMb5YYdDcaUQooOY36vFtHcOq4TpZ25x3ncWNpsRj8NDWi', '2025-11-17 16:33:43', '2025-11-18 16:33:43', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('9171ca51-16d4-4404-ab98-e54ab5477c54', '22222222-2222-2222-2222-222222222222', '$2b$10$7vpyIJ/Y6Qog2WY8iUqGqOIvtNVaUmwrJ7JoWoMzJnYWZvgZlJhyG', '2025-11-27 14:09:26', '2025-11-28 14:09:26', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('95ed10fc-543c-46da-8b8c-b4f60aae82ca', '11111111-1111-1111-1111-111111111111', '$2b$10$hZZkMThMq96SYa03Dbf6iuTS17ETc8wB2JOL098xpl9gELnymfXu2', '2025-11-19 15:25:43', '2025-11-20 15:25:43', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('972c0043-421b-428f-a172-987371ce6285', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$E3QdBhB3Ga6QgJ4LT4LGKO3W6dj04FMPO7vRUHYM/VfIYdaTtLkqa', '2025-11-18 22:10:47', '2025-11-19 22:10:47', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('9a252405-6a5a-4b6f-9380-ceb2362e63bc', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$yFra7MwzCKyUd72DIvUuM.hxwTXGlWsnc81w2iEMoCfNXfnM3MOrO', '2025-11-28 12:10:07', '2025-11-29 12:10:07', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('9a8a8146-bfde-460a-9cec-5387c2f77634', '44444444-4444-4444-4444-444444444444', '$2b$10$Zs9CPcCZYf2EMrdoQbIFB.tqs2.6NNzo58qCHiVyePc7cacKfx3/u', '2025-11-29 10:55:19', '2025-11-30 10:55:19', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('9c80c5d9-b8d2-4834-b76b-9f37f3dc7fcc', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$WvUK5K3FkwuiljcOcT/r1eVnFwV.iQwcFAIzQLLTBkGkJ7pmTns5e', '2025-11-13 07:47:47', '2025-11-14 07:47:47', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('9cb8799e-67ab-40b8-9818-9014de580c03', '11111111-1111-1111-1111-111111111111', '$2b$10$VV.31GVtaV6VISUZOCggkOxPYiL5dPbvtYCfgtClXX4s9MrE2Pkcu', '2025-11-28 10:06:37', '2025-11-29 10:06:37', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('9d24d9b9-5291-40c3-b858-6b3fb485b7a1', '44444444-4444-4444-4444-444444444444', '$2b$10$o5cBSQGM9bwLQagaww7SzOviZb3GkmKLHSPVqgjsxTkU.Occ0KSvq', '2025-11-17 19:33:08', '2025-11-18 19:33:08', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('9d658ba4-04f5-4065-9ee5-fe78a6375bbe', '11111111-1111-1111-1111-111111111111', '$2b$10$Y4Q9vbvTxb3hiCGIqlODmOiPoA/QB9TG7cmRv6NrlHw0AHq8Oh6zq', '2025-11-17 12:20:05', '2025-11-18 12:20:05', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('9e19432f-9943-481a-9477-c378deef3a67', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$mYK7ZbNz4X50O0W.5Chwj.ewj/Lo.WROtdoO6RgbrqIwLlFHy0Ta.', '2025-11-27 11:25:27', '2025-11-28 11:25:27', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('9e896b04-a6da-4669-bb45-a93dc0ad61e2', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$8aRM6of1js79PnNZ0SuLL.Mt34NFDP66KgqzWOiWQ0mRYR0XcFE9q', '2025-11-24 15:11:45', '2025-11-25 15:11:45', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('9f1dcf58-3e24-4e39-a7c5-9e7240e41d30', '22222222-2222-2222-2222-222222222222', '$2b$10$wut8aDwo68ggetTcQ1pBteyOlwcfBD1QZdBfud6VqNJt29.z5YUte', '2025-11-27 11:20:29', '2025-11-28 11:20:29', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('9f5926eb-c9b4-4731-993d-33775cd33aeb', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$.Y4AzkzZYnM2/r9kAT0zpuLKoGi0abwI1UN3.WDDNBwL.rZ2DNXaG', '2025-11-27 18:43:37', '2025-11-28 18:43:37', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('a146d553-d33a-4f0c-8b30-ef535a058aaa', '44444444-4444-4444-4444-444444444444', '$2b$10$bCTroUJBtAwX3SHSaJcIKO43M1sAvZOvOGkfv38Kl7.a7nWIqGy7W', '2025-11-28 19:14:31', '2025-11-29 19:14:31', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('a186521d-e769-45ac-af4e-43af9470662e', '66666666-6666-6666-6666-666666666666', '$2b$10$eHHviJ1vuvVAJEgTfoQ4Z.UwcI3e1sg/efXo9/fyeHUA13zYnrDvK', '2025-11-17 15:13:22', '2025-11-18 15:13:22', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('a2541462-e937-48e4-9f72-e8dd8e7c0114', '44444444-4444-4444-4444-444444444444', '$2b$10$vw6zsf6.7KgeI7WJRS4L/eu649GGVAm7cSduwAjiQEK6do5D/Txsi', '2025-11-28 11:09:46', '2025-11-29 11:09:46', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('a283e826-b4b6-49ac-b600-658ba4ef0243', '66666666-6666-6666-6666-666666666666', '$2b$10$.CBtVztVgA2xfyjSpszMROBuaUi/R2zfq0BqF50/bmwSozhbuQ6R.', '2025-11-29 12:26:44', '2025-11-30 12:26:44', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('a294cc88-957f-431e-bbd6-6bbf5774ab1c', '11111111-1111-1111-1111-111111111111', '$2b$10$eAlQIaTWz8BH4DgPhj1CJusSn2o57QXyhv7BnYaeTzfUY71WX3.ca', '2025-11-16 21:30:11', '2025-11-17 21:30:11', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('a2b176eb-40b5-4354-9280-65afe93a93f6', '11111111-1111-1111-1111-111111111111', '$2b$10$JYKXj5dzZ5z.LiDGKLD2i.LpZj13cCfR74A6ydwKvtnKaVupAW/.q', '2025-11-28 08:52:01', '2025-11-29 08:52:01', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('a2de013a-403c-48b1-a717-583bb25fd913', '22222222-2222-2222-2222-222222222222', '$2b$10$SiiZLm7bWrrl3vioMzsyHONj7mJuT3RH2uQwPLdtNwqvSFAxdbV5u', '2025-11-19 09:42:31', '2025-11-20 09:42:31', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('a317db06-510a-4585-8d97-9ada5d29baec', '11111111-1111-1111-1111-111111111111', '$2b$10$J8Ira4rHmMLqweIR79pYdORcyGSgjdeaanNQI3co1p1U9nt3h4du2', '2025-11-28 13:45:39', '2025-11-29 13:45:39', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('a3be2b10-a7e6-4d38-bdcc-27da585ea974', '11111111-1111-1111-1111-111111111111', '$2b$10$KTYppJUpYL.vWLEVF4Ahq.y52Uk0btRQ9axxR53X2k3Z3ZeoJSk86', '2025-11-27 10:15:44', '2025-11-28 10:15:44', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('a3ddd25c-f97f-43f0-9b4d-9d1183032203', '11111111-1111-1111-1111-111111111111', '$2b$10$fbZnNa8owOGPk6mb4nl20uGvJLskfYGzxb1KL6OOU8R6WYhUYr5Uq', '2025-11-21 13:34:29', '2025-11-22 13:34:29', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('a476dc38-5f7d-4b78-a8f9-16eb2750214f', '44444444-4444-4444-4444-444444444444', '$2b$10$5UkBsHgx7cXfJ9jZOWx/muJbP2C/o.63Fipm.0gEYQUwlIDeCLYC.', '2025-11-28 10:03:11', '2025-11-29 10:03:11', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('a7560797-c057-48db-9157-1bb4cb1e092a', '66666666-6666-6666-6666-666666666666', '$2b$10$mdVAwR75w/I/Sn4WMs0eW.VJdc8uzSoB7mTv2EPw.cXmh0fq/TNFa', '2025-11-17 15:28:39', '2025-11-18 15:28:39', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('a75675db-cbcc-412e-befd-21fa734d84a7', '44444444-4444-4444-4444-444444444444', '$2b$10$0xFBEjuyLY9dNXC/Qkn5re.HXQE/lN4PGZE0vfxoOTkJH/dIWmp12', '2025-11-19 13:40:57', '2025-11-20 13:40:57', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('a76fb352-5ff7-4452-b578-f659f6a2e9c4', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$PKmRdTdy6oQ0ZZ1S2W.lMeV3P3G0Z2Gvwx8CDSW16tvs5Pm82dgr.', '2025-11-19 10:14:40', '2025-11-20 10:14:40', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('a7c00bcc-9572-44e7-81ab-467bf091663c', '11111111-1111-1111-1111-111111111111', '$2b$10$9UiqdgUzrKDTh4ARmZWNhO5iBG/mbj7WMn8V9miX/YpF.PkY5mAmu', '2025-11-26 08:15:09', '2025-11-27 08:15:09', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('a83984dd-be87-48a3-99b0-fd1f1de05ebf', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$UxjLLYF28bQSG83HYZBTgueAUW4AMg.ckm4om8gUjdlPB.eUHp1CS', '2025-11-15 20:34:26', '2025-11-16 20:34:26', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('a9e61c14-6080-4912-a0ce-373345454fe8', '66666666-6666-6666-6666-666666666666', '$2b$10$cVAkmew8yJ0D8B8cc.DnUONvaIeg7fXabVTb9BiNfCj2ofZMZIpG2', '2025-11-29 11:33:14', '2025-11-30 11:33:14', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('a9ea01ac-0ddf-48da-9d03-9ac6bdb8e3ee', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$DpaTcIa2CY.xvcLDHt.pcu73zucexqTkSp/mUGcCFwM2wCL82i5YG', '2025-11-17 18:42:17', '2025-11-18 18:42:17', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('a9f912ed-5ad8-47e6-836a-3ee52e9afa37', '11111111-1111-1111-1111-111111111111', '$2b$10$1cOI2E/faQhaddMjp6P23e8nG17OplI.GP/MJO9mnifDZatydgQzS', '2025-11-29 11:04:25', '2025-11-30 11:04:25', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('ab6512a1-5bc7-477a-bcf2-5aa24df810a1', '44444444-4444-4444-4444-444444444444', '$2b$10$LSS1F1bjqyDAMq/en77R1.nXXHnmkiew1q0w1mLrMvA.0NSxR.uea', '2025-11-17 20:02:32', '2025-11-18 20:02:32', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('ae209822-e72d-4afc-aa28-2fc5f12b22cb', '22222222-2222-2222-2222-222222222222', '$2b$10$aeTHa2TNcuELsXGSyTjVYe4vQCd4ZisjcbzJwh3hozEuuLuiKVKgW', '2025-11-29 10:48:30', '2025-11-30 10:48:30', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('ae258f19-68fe-4e3c-9205-d1e22e58b08a', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$JluRwyc4Sj3moEa37uEQqelGpMO0XBZt6o9BwdWn1QfChqpLhFKQS', '2025-11-28 10:01:12', '2025-11-29 10:01:12', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('aef33d5d-22ca-4d58-b9e3-a5d3cdd1436b', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$YiRE21ahgNgCBESuhE9D0.VlExIgTeJUAUy04sZk794gT6udR0wI6', '2025-11-24 13:38:18', '2025-11-25 13:38:18', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('af38c834-8012-44e3-83ae-20c7f95dfd09', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$ldNs7lRRxEQIAyd1dqEh8Ok7CTqI/LkJYU8Qp2Atv0.YjcuqexE86', '2025-11-28 01:58:59', '2025-11-29 01:58:59', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('afa3b566-d947-41c1-b7f2-47868158e709', '44444444-4444-4444-4444-444444444444', '$2b$10$4Yci86l2bQRuAGqSnVjpf.nk4x2cmS8VMcUkY0y4sTC6hN0UPVx1C', '2025-11-28 14:01:54', '2025-11-29 14:01:54', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('aff8b162-6a63-49af-bbb2-f74d66738259', '44444444-4444-4444-4444-444444444444', '$2b$10$T8nO8X3UktkMBseKOin6qe4dqOvYSxGBWc/Gh9gfc.Q4XODLzmBq6', '2025-11-27 10:32:35', '2025-11-28 10:32:35', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('b00af86b-424a-48b8-bcdc-9ad1a862b9ac', '11111111-1111-1111-1111-111111111111', '$2b$10$OwtR4soVRlZaBoO1uIvLb.cLuY8LVxcuW2xPMYp5vld.7kQnKjCby', '2025-11-22 12:03:09', '2025-11-23 12:03:09', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('b0ab2363-7ccd-4449-9da6-52fcc94c5e0a', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$M6oMXcnryFr3LivofFemN.WDAwKfggeEC3Txw2se86e8DiDXVwnDK', '2025-11-24 17:09:28', '2025-11-25 17:09:28', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('b0d684e9-c73d-4d6c-9cac-f09a184f2654', '66666666-6666-6666-6666-666666666666', '$2b$10$BY1BxRZYhoafOnBu2ZoOUeFeZALwQtXvI6irarP/WGk07C2j6EAcm', '2025-11-24 16:09:09', '2025-11-25 16:09:09', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('b0f14fab-3853-41ba-9df3-13c3acb334de', '11111111-1111-1111-1111-111111111111', '$2b$10$hSeJ6GTTY/YGtSySYuVvUOXJfBNeiNDMrLJu5GkFk9ZccllWQg6Z.', '2025-11-26 10:46:16', '2025-11-27 10:46:16', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('b1ed2172-5a3d-454d-87a8-a1b82f4fe7ff', 'b656634b-477f-4aaa-817d-e0a77f75d88c', '$2b$10$1Unijp3Jz0RjJVOmDYXm4.GkMfDNhpytloZ3kDAMTOqizx1T8tAqi', '2025-11-29 10:01:36', '2025-11-30 10:01:36', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('b34cc071-2340-4b80-a48f-8e1600f4d6e8', '11111111-1111-1111-1111-111111111111', '$2b$10$PtG80Ur0nboKLIGTFMFGn.SvJDshFt409SaQSbphMVquSFeg3PbHW', '2025-11-29 10:19:20', '2025-11-30 10:19:20', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('b3e0c25a-ec80-4a55-b5e8-83e0ddba8dc6', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$S4kHtX4v/rZ1rppfl8AOCujG8h1xoXn/.GbRbNU4.B8hooeaekUr.', '2025-11-28 17:29:25', '2025-11-29 17:29:25', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('b48c410f-a239-42da-8aa0-1fa0a2d30122', '22222222-2222-2222-2222-222222222222', '$2b$10$JNqLb7VKb9FVxfV/ewnCAeKgOoTDhPDKSInIXf6hEbRm1/.1UeEz.', '2025-11-28 11:05:48', '2025-11-29 11:05:48', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('b4a2da99-74fe-4d24-8e77-510df5133e38', '44444444-4444-4444-4444-444444444444', '$2b$10$42va6Hk3iTbnWzuBuenbS.yge9LMcxU3pUntvKZKoNchNqRlRDUzq', '2025-11-28 17:56:33', '2025-11-29 17:56:33', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('b56945bd-0f40-4248-8f6d-73af360f7865', '66666666-6666-6666-6666-666666666666', '$2b$10$GqMiTYZmVrn/vm7X/xvhLeSxbcwECfG3KDAFloOE0h5IY6gwFWyq2', '2025-11-29 12:47:31', '2025-11-30 12:47:31', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('b61814ce-31e8-4e17-98e7-b5914479e970', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$KZk0lHtkJffpfdF/gB3b0.EIRQrFvgM6s9xri2h.pWwT8aNgoncFK', '2025-11-17 17:16:45', '2025-11-18 17:16:45', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('b66c0efd-1417-4c1d-bcba-5a8f0e14df95', '44444444-4444-4444-4444-444444444444', '$2b$10$5JbiSp2Z6GzvvdX6Odp.dOENOO2M.sTFnCQ8yvi4sr/d/1aCHcmq6', '2025-11-17 18:28:33', '2025-11-18 18:28:33', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('b67826cb-c6ca-47b8-aa1d-dc0f139ea2e8', '11111111-1111-1111-1111-111111111111', '$2b$10$bGo8gcIRLB9lMysa/d5UGurEHdV51U/SBDkh4w9gXuKazs03GCblO', '2025-11-22 11:14:13', '2025-11-23 11:14:13', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('b7319171-608f-4c2a-a083-ce88f330e2d9', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$GW7.v1JYhWy76vkKbkdQSelKOdkLiOWJRpoenak5AKj.rafoSXADm', '2025-11-28 02:16:46', '2025-11-29 02:16:46', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('b74d982a-dda7-4a6b-a945-80db4bfd5c85', '66666666-6666-6666-6666-666666666666', '$2b$10$vYwB6d8HCQOw77c6E1hto.cZKEVz/D7R4d5Xjstml9iUJaHz1VziG', '2025-11-27 12:00:31', '2025-11-28 12:00:31', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('b8397e5e-93ef-46ef-9a09-c8a134a6e459', 'b656634b-477f-4aaa-817d-e0a77f75d88c', '$2b$10$1rJtSKRCXORNwOyChW57weDXSKRtCpBbQoPTwovA0XBfPZE64bl7a', '2025-11-29 10:47:36', '2025-11-30 10:47:36', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('b9938e83-1683-4b15-b8f6-815ae6489e72', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$EJYCxmHsJOx5c4zVK7jYmu.mvvx7CvxBjooBz.iMHDYwuWaQ8KVTm', '2025-11-29 12:33:43', '2025-11-30 12:33:43', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('bba186e2-30f4-4872-b94a-18ce43ae1194', '66666666-6666-6666-6666-666666666666', '$2b$10$UCJnYQC8UxNl9/OmPe4NqeVPcJ1jQlRvsVNm2.GvCMoxV3mXQMo.u', '2025-11-26 08:45:12', '2025-11-27 08:45:12', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('bc8d957e-fd0d-4d7b-96fa-2ba2e61bb94a', '11111111-1111-1111-1111-111111111111', '$2b$10$GfzuVvFgi/xx3L50XQeRyOydf.zN3kxV09kNmsXD/./I8XUb3L4eG', '2025-11-26 12:12:27', '2025-11-27 12:12:27', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('bc9b1e2e-31b6-4c77-9454-d7eb09b51e17', '44444444-4444-4444-4444-444444444444', '$2b$10$JeFpVfBuKax37o68XEoWp.0TSBZCbbl520TMwe21yrYE/RY4HvhGW', '2025-11-29 11:37:00', '2025-11-30 11:37:00', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('bff8ed6e-8750-49ca-af0a-8c5f2fbac93d', '11111111-1111-1111-1111-111111111111', '$2b$10$Dngo/Xq/VFkfu./PvHLcEeWz5ITF5OFo5r.qpRTFCnX4PKjQ9VKnK', '2025-11-27 13:05:07', '2025-11-28 13:05:07', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('c015e090-9392-490d-a9fe-61abe8e2a980', '11111111-1111-1111-1111-111111111111', '$2b$10$lXfCgGz..XFX84DMj3ug9.ccZr4hKpnqA4D/xnjHNYOAmp.vMMBVm', '2025-11-24 14:59:08', '2025-11-25 14:59:08', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('c15d781d-5a86-4220-86b2-1bf70796ba05', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$dVw44t2fcWzFKy8.Xb5pNOrxwxw5rkdm9x1A9SWvUTu13WEItRB/2', '2025-11-28 02:09:00', '2025-11-29 02:09:00', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('c19d5dc6-139e-48b0-9b5e-d11ec2199841', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$I43Ev7iw4jx7.i8fMMVVw.Usn4zec8FI2sUqZxWdOrfyxyaBK/ZYC', '2025-11-28 17:57:04', '2025-11-29 17:57:04', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('c214fcd4-2b49-4882-a88c-ef2f58c22f25', '44444444-4444-4444-4444-444444444444', '$2b$10$HgabA3td0uD34flj3G3LIeEwkH9A1BBwLUIygrTOr/CO9Zs5frmTO', '2025-11-27 11:32:07', '2025-11-28 11:32:07', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('c4391c0f-f06a-4543-81ce-9b6e03c4ed8b', '11111111-1111-1111-1111-111111111111', '$2b$10$rvcQp0z5AttKjK3wyVwyeeED8BYh9uC5pnNoJbIZmSAPE8xSIXmAK', '2025-11-27 18:41:38', '2025-11-28 18:41:38', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('c461dbb2-b62b-4652-908b-638e2f5511c7', '33333333-3333-3333-3333-333333333333', '$2b$10$x.j.VU9UNpQnDWrEmUajDuZrW5lvmpFirgt22dh6w/Fp0qozSXxOm', '2025-11-24 09:23:20', '2025-11-25 09:23:20', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('c519b4b0-3064-4f72-a978-285a883c04b0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$7CFtqAFrhIa402Gra1WVR.iLVVXBg8awuwbR6KKPc9zK/2bidns2q', '2025-11-18 23:43:01', '2025-11-19 23:43:01', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('c55c2497-21ad-439c-aa6f-44df866571e3', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$4eieeivKZT0WoRbtHAv.p.jNv9X3khFTtICj41pXJATLhhW1JBp6.', '2025-11-11 12:19:24', '2025-11-12 12:19:24', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('c5b9d0eb-c65d-495a-818b-3f2551678562', '66666666-6666-6666-6666-666666666666', '$2b$10$IniPLCOnVB8UhXU5kcsjcucJ.llLTk6T8Qu4bcP.UJRlNJdgDNj.m', '2025-11-27 10:35:09', '2025-11-28 10:35:09', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('c6d6b2a0-28f8-4747-8e5b-7f7a348b5286', '44444444-4444-4444-4444-444444444444', '$2b$10$X3qqaSIY2N5NwFBsZANmve0.sXbhYEY.X0JK.Tgws22WFChpBCHfS', '2025-11-29 09:17:16', '2025-11-30 09:17:16', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('c7cbecd9-d50d-4f33-bda1-95f015c5c7d9', '44444444-4444-4444-4444-444444444444', '$2b$10$l90Fb7.GwosrGoiTusJayuXK.c0SFWqeSYaCv5s5IsAHQtkOJwIWq', '2025-11-17 18:19:15', '2025-11-18 18:19:15', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('c7df0ccd-b874-41b8-9853-c17c05e87932', '44444444-4444-4444-4444-444444444444', '$2b$10$64wwRkOGuUHzm3FYLjJr4OpcyhWpivxGJlvMwiGtYGLS8RsMfhN8q', '2025-11-27 11:35:56', '2025-11-28 11:35:56', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('c803b40b-36f5-4e77-9916-22a806bb0af7', '22222222-2222-2222-2222-222222222222', '$2b$10$G2x4cuBE4BAybkJe3s1jNuBRpysRHz4bCQOaBK0pTp541tLjtUGoW', '2025-11-17 19:12:25', '2025-11-18 19:12:25', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('c9074578-a4fa-4a36-8bad-8925ec953b6d', '66666666-6666-6666-6666-666666666666', '$2b$10$Ab/jgGct5paN88S1/.YOiOMSQvBIq4JVH8VZoPhrvTGigra327Xce', '2025-11-17 13:53:40', '2025-11-18 13:53:40', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('c97e26ad-e54b-404a-a9da-a4d4ca3f0ef8', '44444444-4444-4444-4444-444444444444', '$2b$10$srZHI4kiUTn2TdkyFBHevuZrzSNKcXq3aeIvEDbipVVJ4FH7Hv7SW', '2025-11-29 10:46:46', '2025-11-30 10:46:46', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('cd9432d7-6c09-4ff7-881e-7c05dceadd42', '11111111-1111-1111-1111-111111111111', '$2b$10$5FPD9sQ.V/9v67GY3ijTSeS8TE8B31JTK4Dzw9VE8zlcAtBrm/fPu', '2025-11-28 02:06:12', '2025-11-29 02:06:12', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('ce646875-159f-42e1-ad9f-37f11a654e13', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$6tcg.zy0RgtIC536/0QI1edxRWFNh0FHxfV3DkjVngHyWq7wrKU3S', '2025-11-28 01:36:32', '2025-11-29 01:36:32', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('ce6b4f65-f7df-4e31-9017-76bc3f4d0f72', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$r3UTODOE5ifbLsZ6wYqK3uzs45y9kecpnRkcRq.l5IdInW57Rzv5i', '2025-11-25 08:28:33', '2025-11-26 08:28:33', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('ceef4aa2-f658-4595-8f4b-b3f10ecf9d9b', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$96G5ngA/.jqGcNkv0lsRi.ZFws9.OSUBmT8HNasMoMXNqA52X5use', '2025-11-29 12:35:20', '2025-11-30 12:35:20', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('cf30ed5d-d90a-4dc1-b58e-00708846fcec', '22222222-2222-2222-2222-222222222222', '$2b$10$ti2VAcqFDbIsfxk514gzseFsW3Q02/7PsItyKSC1EZ0VF7lNPhPju', '2025-11-27 10:34:00', '2025-11-28 10:34:00', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('d1b03bd5-6a8e-4cf8-bb91-9218a95a3245', '11111111-1111-1111-1111-111111111111', '$2b$10$e0EmUN87DDfZ8u220/vq4.jqTzRkgmFs.TvNjm9vTxIXy6Gf7o3Pi', '2025-11-21 10:22:16', '2025-11-22 10:22:16', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('d1e10480-83fd-4ba0-8e70-27cb8321f1cb', '66666666-6666-6666-6666-666666666666', '$2b$10$WBMfuzXbeyr6Mwh0Y2.5H.lAS/e2E/nBI2983w9m/5P02zvu3eET2', '2025-11-29 11:59:13', '2025-11-30 11:59:13', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('d1f2db10-a37b-4bf4-9303-20e43484f661', '66666666-6666-6666-6666-666666666666', '$2b$10$VsUZzXhWBCiwCdY6jIzaauI9T0/7pcEEvuv4Pc/2F1D19/BnJKA0W', '2025-11-24 16:17:55', '2025-11-25 16:17:55', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('d3af9e77-b153-45e3-89ec-3f58acce349d', '11111111-1111-1111-1111-111111111111', '$2b$10$I/6H2u5pPamMeHoSdG2zKOSJExvZOvN/Rrxo2TxfYBVLjw2758Ub.', '2025-11-29 12:07:18', '2025-11-30 12:07:18', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('d3d8965d-d61c-4118-8388-e18d1e9f1f9c', '11111111-1111-1111-1111-111111111111', '$2b$10$6xpOK4bW19ZQdyF5R7WlXO4zEQG8i6D7BMqI2LTXY6.MHBaDe/pIa', '2025-11-29 11:15:06', '2025-11-30 11:15:06', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('d4879351-c848-40a8-a103-d86a2cedddfe', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$6U2s2iTigrIc9BiGmFaneuaeuDlIuL3sTVls6dw2StAZWgl1JSHoS', '2025-11-15 13:05:21', '2025-11-16 13:05:21', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('d637daa6-0d2e-4ed8-a5d0-35faa9744528', '44444444-4444-4444-4444-444444444444', '$2b$10$I8oYdvtoizg1UQqUON51/.WzoJeEXaUJPlzxfrTj3dTPJwP7Nxc.C', '2025-11-17 19:42:48', '2025-11-18 19:42:48', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('d6eaca6d-8285-41c6-a9f3-8c4803f58122', '66666666-6666-6666-6666-666666666666', '$2b$10$YlJVY/ZYUTPNiBMlYal6Vu92hG3.jvCWkn1.4edI0owvQj9UXNstu', '2025-11-26 14:14:01', '2025-11-27 14:14:01', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('d7d6d54a-4154-4e94-9363-82251a34a82c', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$lwOyJhnzTik9Hcy7WAPsSu.6hPtj8Z/vkmBgQw8xP0NBN5/uKHgkG', '2025-11-26 15:19:17', '2025-11-27 15:19:17', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('d8349afd-842f-49d2-a362-7fcf314c6b7e', '11111111-1111-1111-1111-111111111111', '$2b$10$MrfOD81RPJ7zbZNesAWFYef54TpHkdtH6ZZzTym7Z76v9NMphKmOW', '2025-11-29 10:16:29', '2025-11-30 10:16:29', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('d9e36487-5a02-4a73-907c-3184c5731f02', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$EFSSmad.oOa2p65lXGswWurPj.1hJIwSH0RZ3yq15HL1Rh0Nqwx5y', '2025-11-18 22:24:41', '2025-11-19 22:24:41', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('dadfd955-aaac-48ac-9377-d134c1f19e6c', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$Qa4ASZg9yUxiyIw8e/iToeJVCPaim2yN8c/HGvayRbjeaL8eymgOy', '2025-11-28 19:13:49', '2025-11-29 19:13:49', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('dd381f38-c6b7-4c22-a7cb-740f13ca05ff', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$X.HcMJN4yu/Z32StOvmOnO6Ku8U4QRI2jwF1eJdgMIEziKrkZ10OG', '2025-11-12 12:36:27', '2025-11-13 12:36:27', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('dd5612a5-c0ac-409e-835d-8909887839f8', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$Hoh054J4MAowTBMIzDGzyu1/pQODWeY2lU8Jangm9Tdi653Ind8Xu', '2025-11-17 20:36:51', '2025-11-18 20:36:51', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('de31e964-d37d-45b2-8462-5c362f44f44b', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', '$2b$10$XrrHRlXVJ3SdWBDDpfMPkeazfoVyu1bp0pMNjqmQrOI5CNqDq8gb6', '2025-11-15 20:33:59', '2025-11-16 20:33:59', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('de330c94-89c3-4892-88ec-43cd01037cc6', '11111111-1111-1111-1111-111111111111', '$2b$10$KYEdXd/Lw8Ywy/QhmC6TqeUCK0dDgEaRYeA30Gr9E2Hub3PrJlun6', '2025-11-19 14:06:06', '2025-11-20 14:06:06', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('dffda8a4-5d4f-49c2-90ef-f0d631965843', '44444444-4444-4444-4444-444444444444', '$2b$10$NSbUZ2cRgX/OXb0SwRZdoOSpnlatsn62QqeARLB3u42zrfuZGwGC.', '2025-11-27 18:49:11', '2025-11-28 18:49:11', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('e2975cbf-a571-4ec5-a784-b5e7a504ab3c', '22222222-2222-2222-2222-222222222222', '$2b$10$kHbWoBPDXCqcW4EuIeayK.vbnw2LHFiHYtd6GdA47o2BwbE04PSd.', '2025-11-19 09:04:09', '2025-11-20 09:04:09', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('e2b24278-d849-4819-9327-825ccaa34327', '44444444-4444-4444-4444-444444444444', '$2b$10$81o3u7DHR.gy1sSdudHt2uio7GDPPh6q65aaO9WFS9nwIxzj4SQg2', '2025-11-27 14:11:38', '2025-11-28 14:11:38', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('e2f733ec-3ffb-4c8f-9060-69b6da12e8e1', '44444444-4444-4444-4444-444444444444', '$2b$10$5vZQdOd01kVxSfrfq.JbzOVcfLmOsEPkG0MsEwuhFUY01BdjWoQEe', '2025-11-28 19:23:16', '2025-11-29 19:23:16', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('e33c6075-139a-46cc-a64d-b45fe82ad352', '11111111-1111-1111-1111-111111111111', '$2b$10$/HI0MVWrYTM0T6llUNI.yurHBsyrKJD/IdAx22Dl7OxYRnDD9XkOi', '2025-11-24 09:24:05', '2025-11-25 09:24:05', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('e35e904c-46bd-4800-9108-8381936cbcd9', 'b656634b-477f-4aaa-817d-e0a77f75d88c', '$2b$10$gZ8JHiI6P.Rgac0r8SzZZuAfzDycyRVRfnzq/kceMOJey5NNoKmny', '2025-11-29 11:00:22', '2025-11-30 11:00:22', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('e40ff8d5-3198-4c64-bd1d-ce4749bb4d47', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '$2b$10$WzOS5kfTdwe7tYaGzanmT.EODB04HEntzloaFNCnbfpCX5aj93onq', '2025-11-17 19:13:26', '2025-11-18 19:13:26', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('e510fe3d-811c-4c55-ace5-358fc8335e4f', '33333333-3333-3333-3333-333333333333', '$2b$10$b3/V/iufnx.Jig89G7aGy.irZZMEfDogrn6t7LqqD/SPdebk37/cq', '2025-11-16 14:21:27', '2025-11-17 14:21:27', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('e55acc7f-8474-4020-961e-13dd5982e95a', '22222222-2222-2222-2222-222222222222', '$2b$10$sE9sQ77Z.Vna.FoKQyGfS.fIX3CsMyobi6GnK9jraS18XBiTXG1cW', '2025-11-27 11:31:14', '2025-11-28 11:31:14', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('e5ecefa1-3b25-471a-a002-80498577181e', '33333333-3333-3333-3333-333333333333', '$2b$10$hR3br3QDv5Doh.K7vKzUAelKjags/Trpty4mCB.si7KIXmGZRETCe', '2025-11-16 12:58:22', '2025-11-17 12:58:22', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('e612fcc4-e2eb-419e-93cc-a5f0914480af', '11111111-1111-1111-1111-111111111111', '$2b$10$Lu2O0P1oc44iBx6ccDP.z.ZXSgYxhUCtty2EQsAxjK46GGQVlOR2O', '2025-11-29 09:57:31', '2025-11-30 09:57:31', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('e6239f35-bce0-4df2-9fbc-306ea6f0577f', '33333333-3333-3333-3333-333333333333', '$2b$10$0IU11DasYPmncxw8GjRy3.HlxmE30LO1Y8CpRnNIuQLSBXvt0x0NC', '2025-11-29 09:23:21', '2025-11-30 09:23:21', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('e6297499-b06b-421f-91b1-34c7ab828277', '11111111-1111-1111-1111-111111111111', '$2b$10$/yIVqpnXUg/Cvc7g/MXPMehzv8m0CaikMiX8Llvx8N4ABq5kcI.6O', '2025-11-28 17:22:25', '2025-11-29 17:22:25', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('e7d0658d-bc7e-4c83-b36d-a91c869cb61a', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$T7RaaNekXGwSoYUptEnZsugvwibAzV5xTOf6BzzKbunxZ780PtJPm', '2025-11-17 16:20:02', '2025-11-18 16:20:02', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL);
INSERT INTO `auth_sessions` (`session_id`, `user_id`, `token_hash`, `issued_at`, `expires_at`, `ip_address`, `user_agent`, `is_active`, `revoked_at`) VALUES
('e89dcd99-771e-4cf0-8fc6-b3f13f33ede5', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$iA8SIZxAjlsaIZg9mDQE/ulFHIInqjpzC66LxGu5pMRYSBmLBfpR.', '2025-11-29 10:38:12', '2025-11-30 10:38:12', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('e8d6c1b1-b3ee-44dd-be9d-e94ba9d0faab', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$CDV/DLi3tNp1GdF0LhorW.4chvBfr8KnQidBkchqlu8M0ZwI3FRIe', '2025-11-28 00:50:20', '2025-11-29 00:50:20', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('e8f4160a-dda9-4609-8c0c-d9da5aaad651', '11111111-1111-1111-1111-111111111111', '$2b$10$m1tOJ.V2iJRgKzATZSbA/emx35v986M8i.T8y73InuYvx03B.goNm', '2025-11-28 09:40:50', '2025-11-29 09:40:50', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('e99de6f0-5c0e-4a00-a6eb-fa68d98ee700', '66666666-6666-6666-6666-666666666666', '$2b$10$JlAPbYcrP6WSl4IbWXUJy.f13jsgt73JCaPMf7Y2ibliHf0Cx4NpC', '2025-11-26 08:15:28', '2025-11-27 08:15:28', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('ea217454-4d95-4c96-bc97-fe4b2fd868ba', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '$2b$10$IwqcqJ2OQaVrU0XwPVTjGuErQkR1R506OGjqCbcs20Cpk/Q.r52H.', '2025-11-24 15:05:39', '2025-11-25 15:05:39', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('eab18fe0-cdd0-4420-8711-a94d1df777e2', '66666666-6666-6666-6666-666666666666', '$2b$10$aiPaORcxIb07dZJriSAfAu5eVKhOyf2N5.k9adWyxZm80N8xcRB1u', '2025-11-29 11:34:05', '2025-11-30 11:34:05', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('ec5d00b1-4e6c-462b-a56a-f8100ece41d3', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$jMs5xA0GpfZvBwDbZBrTIeXtJICuv98kgdPPJvh3s1V231F0txk9i', '2025-11-28 14:02:59', '2025-11-29 14:02:59', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('ecb254a1-2066-4ada-81ae-d673d57d7a88', '44444444-4444-4444-4444-444444444444', '$2b$10$o/KpsiwOOU5UlvnsFFNr9ObNjORZ5Pzcw96DwIBAmVho2JW2CixWC', '2025-11-28 13:11:54', '2025-11-29 13:11:54', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('eefbc45d-5a0b-4d55-8109-086740a2ed3b', '44444444-4444-4444-4444-444444444444', '$2b$10$tqNCym7f3LEdJBVgMxhfRug8wdUQbfYu5A5Jx8Omw7RFOQkudRQp2', '2025-11-28 19:25:31', '2025-11-29 19:25:31', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('ef9be89d-265c-42cd-9701-4bef360a9f57', '44444444-4444-4444-4444-444444444444', '$2b$10$1ZleAPOyBPsIHGZJsVjAt..VH2rmAvnrFEL3VDJQ67pr0PCiZVXQK', '2025-11-28 00:51:12', '2025-11-29 00:51:12', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('efb82af0-ae31-492e-9c94-bf5218d117b7', '66666666-6666-6666-6666-666666666666', '$2b$10$ZaLlhRI6QzIV4DEu8MosLuaooXdgago/NiD.XMCRB3TEIUy/f.jvG', '2025-11-29 11:58:01', '2025-11-30 11:58:01', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('efc5d8f7-5bf5-4571-b117-dd7ee1685e92', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', '$2b$10$Y4KzYJSd2nCB..1BaTbmBOe9QdwXGvXCBnWX9I3f7jiLWVjUQjnC6', '2025-11-16 10:42:17', '2025-11-17 10:42:17', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('f0064fef-f013-4129-85a6-3d87b8b6ae90', '22222222-2222-2222-2222-222222222222', '$2b$10$UMzDiWD8/T6YhB6BGaItI.2b1c8Ta.4kkS1NeuZSyDMm5F5Fkoee2', '2025-11-17 16:30:41', '2025-11-18 16:30:41', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('f06d4eeb-f093-425a-9497-d34fab2a906a', '22222222-2222-2222-2222-222222222222', '$2b$10$2KKuMxqUNISPzBOCzDLYHOtSX/n8rksjWE7lonOEC9TlKP/i/Oyci', '2025-11-29 12:36:48', '2025-11-30 12:36:48', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('f09efb83-86ad-48b2-8f33-cf6b61428706', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$VnhrhTCc5JvIbSYuTFr.outYQqMF7QI/nRfaHk0ijppzPBnnyTrp2', '2025-11-18 23:52:40', '2025-11-19 23:52:40', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('f0cb1410-b731-4e3b-83da-3e44cad9aee8', '22222222-2222-2222-2222-222222222222', '$2b$10$r34.EOvu7WWBfasK62wcluHQcZLoUdh3T/dFboX6NGDIyem3SCyIK', '2025-11-28 13:18:00', '2025-11-29 13:18:00', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('f16b32a6-c96a-42f9-becb-56fb938d05d5', '66666666-6666-6666-6666-666666666666', '$2b$10$lE2kEjjm0BaTcMUdvgjCEOcwUmp.terL09nHS/XP1OhRpsH3k4jHC', '2025-11-17 14:40:42', '2025-11-18 14:40:42', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('f1712b19-4a23-4be6-8334-59c2c02bfdb5', '22222222-2222-2222-2222-222222222222', '$2b$10$D2GhrHURNTW53j2oQEfPcO21zc8P1ZK6zrk2o6.L3XwICPxNktD8C', '2025-11-28 10:09:17', '2025-11-29 10:09:17', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('f29d9e4c-2708-4d44-a908-ad7c67c20deb', '22222222-2222-2222-2222-222222222222', '$2b$10$ZvL8ED1xSRouwl7RheUnE.8Oi6KO55QD.1W6yUB1wPK6YiA5A0VG.', '2025-11-19 15:21:08', '2025-11-20 15:21:08', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('f31d5b7c-019b-4947-a9cf-e345b97061fe', '22222222-2222-2222-2222-222222222222', '$2b$10$z3lZuoDxhJcZpd/TRn.o3u/xhqxO5kd23I0zl6GHE0zEdN0Af5hmu', '2025-11-29 11:36:38', '2025-11-30 11:36:38', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('f3213e56-d291-4e54-9e41-c26fe8defc0e', '22222222-2222-2222-2222-222222222222', '$2b$10$r9p6N/P2lCEWWsS1ki19FupdhIhsc4Zcx44kesh0M9/NWIvOcflwm', '2025-11-16 16:06:23', '2025-11-17 16:06:23', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('f3275c42-8d9d-42aa-ace2-203c63d7da5e', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$zoGYiTm9DE6r/K2XSKNrMekPYWlIGopPKyFflKCA1ghdrveKJhieS', '2025-11-28 02:24:29', '2025-11-29 02:24:29', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('f3729f66-a924-4adb-a034-be2315cf4261', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$1FixLCsi1DHM10v0XZ3kje/2d27wt4dRnnjMQoOsxDgOYY8GIhbWi', '2025-11-19 00:03:09', '2025-11-20 00:03:09', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('f39e7a9d-1660-4923-baf2-e1720eb48c3b', '11111111-1111-1111-1111-111111111111', '$2b$10$Q7TimSsReKou4S0XL4o8H.8LArf1jIOqKDHi8By3sOS4iZK0Xpr6y', '2025-11-18 22:24:33', '2025-11-19 22:24:33', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('f43a956b-5832-4481-8d88-cac845fc637c', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$b.wGTcHZrKD05cPNQcgpBOZ5qi5LAVxglOoxGNw/XfLU2J8yGd4A2', '2025-11-17 19:21:37', '2025-11-18 19:21:37', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('f46df947-ccb9-4d1a-a5aa-8aae3cde4283', '22222222-2222-2222-2222-222222222222', '$2b$10$NGKM5ksWlPP./LmOxEWyUeWJhqjXDZ/QfPnDYeHhEveP8bXMFMx7.', '2025-11-29 09:58:08', '2025-11-30 09:58:08', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('f59c7f56-418e-4086-8102-4622ba83a89a', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', '$2b$10$QCdPEPHEce.aEadSQ.p1mexWkYx/zTgtKQwNXFpVcCczz.lnrkZ2W', '2025-11-14 11:32:28', '2025-11-15 11:32:28', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('f5cb319a-e4f2-4255-ac7a-b3153fce3f99', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$QFfiv9kxcG3ahMzqleWE5OP9qhh85qypJgWrd4TONL75xNb99N1OC', '2025-11-14 11:59:49', '2025-11-15 11:59:49', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('f79e1af2-1071-4b5b-930c-c1d9bbe548db', '22222222-2222-2222-2222-222222222222', '$2b$10$ofFgGMPq9KdTRXrL5jNTAed7o4o32DXUyQyxWhjazshu8OZvkhaDq', '2025-11-18 23:53:04', '2025-11-19 23:53:04', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('f8036349-1f97-49a3-87f7-9b2a1a00a098', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '$2b$10$7Tw3q3j9JO2zxrqEz7G/6OqdjwaB2DniWOEG5WQDwNvKWeL/I3bKm', '2025-11-17 16:15:10', '2025-11-18 16:15:10', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('f8cf142d-5d6b-4b3b-aaca-b8ac3f3592e7', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$fDOTi2bG/mix6HV/bykihOkYFEGudooIBOkp9FRckeLLMiWqYQm.i', '2025-11-17 16:34:38', '2025-11-18 16:34:38', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('f9815dfd-bc29-4dab-9fd9-b43c045db314', '66666666-6666-6666-6666-666666666666', '$2b$10$qraRjbk2RtfI94lU2iuaiuRu8.mnlP5gPWN1M5VZWmklYrCEIytda', '2025-11-17 15:33:23', '2025-11-18 15:33:23', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('f9b1905f-194f-4318-ba40-61100e3c1430', '11111111-1111-1111-1111-111111111111', '$2b$10$tf9a8O/OtIB4gtP4MMS..uSaONkmEqM7GW7bfRZ7qScENBCl1J0Ia', '2025-11-24 13:31:45', '2025-11-25 13:31:45', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('f9c923fe-99d0-4017-925e-13dbd3604443', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$oCFlu8jhn6D/GzpEyf9r1e56hUS5YBW6SzoR6SuSbrzdo8Dzu5U7a', '2025-11-24 14:33:11', '2025-11-25 14:33:11', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('fa97a6bc-bcad-497a-9840-306af5177a53', '22222222-2222-2222-2222-222222222222', '$2b$10$r78070LjO5cFrqo3Ax5VSurt1cIQgc6P8Ebrc5Dq3.s/3Ut6ELwyi', '2025-11-29 09:57:06', '2025-11-30 09:57:06', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('fbb56b5b-5a32-4bc8-a926-846bb975dcef', '44444444-4444-4444-4444-444444444444', '$2b$10$nGwKKpEHPDD.jotv5hmFC.gq7OhtLjhrc18S6lwbktliWSfrNw8C2', '2025-11-29 10:44:16', '2025-11-30 10:44:16', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('fd48ab79-95cf-4038-8622-52c359fcccf4', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$30WR5vYBqaz40aj7mc.6vuJQiH.9UKJXsNonNxaW88F/2sCxnmTyW', '2025-11-18 22:00:30', '2025-11-19 22:00:30', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('fd9f83ae-f776-4a5f-b487-2ffe33a32949', '11111111-1111-1111-1111-111111111111', '$2b$10$4kRqMDGT5o7bZZlq3rzHC.AemGoB2WwzJcy4NR97g3d9nP3d2yETK', '2025-11-26 13:02:00', '2025-11-27 13:02:00', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('fdac6d0b-24ef-45e8-a07d-5fc10294cf33', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$cf.wJb/.xM8KAoYrfWHZGO99q3MSOpJOIM4fiEU1tcoEi1keJHuBa', '2025-11-14 11:18:34', '2025-11-15 11:18:34', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('fe00deac-8729-49f1-9da3-78b7118eb76a', '22222222-2222-2222-2222-222222222222', '$2b$10$AueYTCkB4IgDyduPIhj2JegulUfCLtohpL7YpHYmwvrnIuV9nk4kG', '2025-11-17 18:43:23', '2025-11-18 18:43:23', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('ff795c50-913f-4698-836b-97fed1fc67e0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$DLUV17L//UBqizxYJopJxuM2g5aJ6jZSzMDzcCurz/f3WSS9W95ti', '2025-11-24 14:46:45', '2025-11-25 14:46:45', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `availability_slots`
--

CREATE TABLE `availability_slots` (
  `slot_id` char(36) NOT NULL,
  `provider_id` char(36) NOT NULL,
  `doctor_id` char(36) NOT NULL,
  `facility_id` char(36) NOT NULL,
  `slot_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `slot_status` enum('available','booked','blocked','unavailable','locked') DEFAULT 'available',
  `appointment_id` char(36) DEFAULT NULL,
  `assignment_id` char(36) DEFAULT NULL,
  `lock_status` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `care_tasks`
--

CREATE TABLE `care_tasks` (
  `task_id` char(36) NOT NULL,
  `referral_id` char(36) DEFAULT NULL,
  `patient_id` char(36) NOT NULL,
  `assignee_id` char(36) NOT NULL,
  `task_type` enum('follow_up','referral','counseling','appointment','other') NOT NULL,
  `task_description` text NOT NULL,
  `due_date` date DEFAULT NULL,
  `status` enum('pending','in_progress','completed','cancelled') DEFAULT 'pending',
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `created_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `care_tasks`
--

INSERT INTO `care_tasks` (`task_id`, `referral_id`, `patient_id`, `assignee_id`, `task_type`, `task_description`, `due_date`, `status`, `completed_at`, `created_at`, `created_by`) VALUES
('221db5f0-6abc-45a3-a6a7-ded8a6e690ca', '943bb845-401f-43f7-b661-5340d7fc728d', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '22222222-2222-2222-2222-222222222222', 'referral', 'Follow up on referral from 550e8400-e29b-41d4-a716-446655440001 to 550e8400-e29b-41d4-a716-446655440002', NULL, 'completed', '2025-11-19 15:50:06', '2025-11-19 15:24:28', '22222222-2222-2222-2222-222222222222'),
('bc598436-efa0-4e60-874c-8ecbdc59218a', 'e2920bee-3464-45bb-89a8-f6987d7ffe13', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '11111111-1111-1111-1111-111111111111', 'referral', 'Follow up on referral from 550e8400-e29b-41d4-a716-446655440001 to 550e8400-e29b-41d4-a716-446655440002', NULL, 'pending', NULL, '2025-11-19 15:19:32', '11111111-1111-1111-1111-111111111111'),
('d0731585-7d2e-4fc8-8527-3db68f5ea42d', '78dd25e8-5047-493d-a584-25ff9a7bb13e', '9380eb9a-4d99-43dc-a1db-364a4067c39a', '22222222-2222-2222-2222-222222222222', 'follow_up', 'Schedule follow-up consultation to review patient’s progress on fatigue and headache management. Ensure vital signs and lab results are evaluated.\n\nDue Date:', '2025-12-06', 'in_progress', NULL, '2025-11-29 09:26:51', '33333333-3333-3333-3333-333333333333'),
('dd9cbd0b-1a7d-40a1-8a86-d83f4c60d04e', NULL, '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '11111111-1111-1111-1111-111111111111', 'counseling', 'Follow-up counseling session for adherence', '2025-11-20', 'in_progress', NULL, '2025-11-19 16:13:36', '11111111-1111-1111-1111-111111111111'),
('e0393ebd-c3c0-466a-89da-980068d13605', '78dd25e8-5047-493d-a584-25ff9a7bb13e', '9380eb9a-4d99-43dc-a1db-364a4067c39a', '44444444-4444-4444-4444-444444444444', 'referral', 'Follow up on referral from MyHubCares Main Facility to MyHubCares Quezon City Branch', NULL, 'pending', NULL, '2025-11-29 09:16:46', '44444444-4444-4444-4444-444444444444'),
('ed9a715e-a12e-4441-a680-cd0e81b5e837', '78dd25e8-5047-493d-a584-25ff9a7bb13e', '9380eb9a-4d99-43dc-a1db-364a4067c39a', '22222222-2222-2222-2222-222222222222', 'follow_up', 'Call patient to schedule follow-up appointment and review recent lab results.', '2025-12-05', 'pending', NULL, '2025-11-29 09:18:06', '44444444-4444-4444-4444-444444444444');

-- --------------------------------------------------------

--
-- Table structure for table `client_types`
--

CREATE TABLE `client_types` (
  `client_type_id` int(11) NOT NULL,
  `type_name` varchar(200) NOT NULL,
  `type_code` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `client_types`
--

INSERT INTO `client_types` (`client_type_id`, `type_name`, `type_code`, `description`, `is_active`, `created_at`) VALUES
(1, 'Males having Sex with Males', 'MSM', 'Men who have sex with men', 1, '2025-11-29 10:16:18'),
(2, 'Female Sex Workers', 'FSW', 'Women engaged in sex work', 1, '2025-11-29 10:16:18'),
(3, 'People Who Inject Drugs', 'PWID', 'Individuals who inject drugs', 1, '2025-11-29 10:16:18'),
(4, 'Transgender Women', 'TGW', 'Transgender women', 1, '2025-11-29 10:16:18'),
(5, 'Transgender Men', 'TGM', 'Transgender men', 1, '2025-11-29 10:16:18'),
(6, 'General Population', 'GEN', 'General population clients', 1, '2025-11-29 10:16:18'),
(7, 'Pregnant Women', 'PW', 'Pregnant women seeking HIV services', 1, '2025-11-29 10:16:18'),
(8, 'Partners of Key Populations', 'PKP', 'Partners of key population members', 1, '2025-11-29 10:16:18');

-- --------------------------------------------------------

--
-- Table structure for table `clinical_visits`
--

CREATE TABLE `clinical_visits` (
  `visit_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `provider_id` char(36) NOT NULL,
  `facility_id` char(36) NOT NULL,
  `visit_date` date NOT NULL,
  `visit_type` enum('initial','follow_up','emergency','routine','art_pickup') NOT NULL,
  `who_stage` enum('Stage 1','Stage 2','Stage 3','Stage 4','Not Applicable') DEFAULT NULL,
  `chief_complaint` text DEFAULT NULL,
  `clinical_notes` text DEFAULT NULL,
  `assessment` text DEFAULT NULL,
  `plan` text DEFAULT NULL,
  `follow_up_date` date DEFAULT NULL,
  `follow_up_reason` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `clinical_visits`
--

INSERT INTO `clinical_visits` (`visit_id`, `patient_id`, `provider_id`, `facility_id`, `visit_date`, `visit_type`, `who_stage`, `chief_complaint`, `clinical_notes`, `assessment`, `plan`, `follow_up_date`, `follow_up_reason`, `created_at`, `updated_at`) VALUES
('30db2922-7990-4de8-ae4c-33df3ecf37c6', '9380eb9a-4d99-43dc-a1db-364a4067c39a', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-11-27', 'initial', 'Stage 1', 'Patient reports mild fatigue and occasional headaches for the past 3 days.', 'Patient is alert, oriented, and in no acute distress. Physical examination unremarkable. No respiratory or cardiovascular abnormalities noted. Encouraged patient to maintain healthy lifestyle habits. Advised to return for follow-up or sooner if symptoms worsen.', 'Vital signs within normal limits\n\nNo signs of acute infection\n\nPossible mild dehydration\n\nConsider lifestyle factors contributing to fatigue\n\n', 'Advise increased fluid intake (2–3 liters/day)\n\nRecommend balanced meals and adequate sleep\n\nPrescribed multivitamins (1 tablet daily for 30 days)\n\nMonitor symptoms; return if worsening', '2025-12-11', 'Reassessment of symptoms and evaluation of treatment response.', '2025-11-29 08:26:45', '2025-11-29 08:29:12'),
('a1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-01-10', 'initial', 'Stage 1', 'Routine health check-up and HIV status confirmation', 'Patient is a 35-year-old male presenting for initial consultation. Appears well-nourished, alert, and oriented. No acute distress. Patient reports feeling generally healthy with no current complaints.', 'Patient is in good general health. No signs of opportunistic infections. Recommended baseline laboratory workup.', '1. Complete blood count (CBC)\n2. CD4 count and viral load\n3. Liver function tests\n4. Renal function tests\n5. Schedule follow-up in 2 weeks', '2025-01-24', 'Review lab results and discuss treatment plan', '2025-01-10 09:30:00', '2025-01-10 09:30:00'),
('a2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-01-24', 'follow_up', 'Stage 1', 'Review of laboratory results and treatment initiation', 'Lab results reviewed. CD4 count: 450 cells/mm³, Viral load: 12,000 copies/mL. Patient understands treatment plan and is ready to start ART.', 'Patient is eligible for ART initiation. CD4 count is adequate. No contraindications to treatment.', '1. Start ART regimen: TLD (Tenofovir/Lamivudine/Dolutegravir)\n2. Take medication daily at the same time\n3. Monitor for side effects\n4. Return in 2 weeks for adherence check', '2025-02-07', 'Adherence monitoring and side effect assessment', '2025-01-24 10:15:00', '2025-01-24 10:15:00'),
('a3333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '550e8400-e29b-41d4-a716-446655440000', '2025-02-15', 'art_pickup', 'Stage 1', 'Monthly ART medication refill', 'Patient reports good adherence to medication. No side effects reported. Vitals stable.', 'Patient is doing well on current ART regimen. Adherence is excellent.', '1. Continue current ART regimen\n2. Dispense 30-day supply\n3. Schedule next refill in 1 month', '2025-03-15', 'Monthly ART refill', '2025-02-15 14:20:00', '2025-02-15 14:20:00'),
('a4444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-03-20', 'routine', 'Stage 1', 'Routine 3-month follow-up', 'Patient continues to do well. No new complaints. Adherence remains excellent. Recent lab results show improvement: CD4 count increased to 520 cells/mm³, viral load undetectable.', 'Patient is responding well to treatment. Viral suppression achieved.', '1. Continue current ART regimen\n2. Schedule viral load test in 3 months\n3. Continue adherence counseling', '2025-06-20', 'Quarterly follow-up and viral load monitoring', '2025-03-20 11:00:00', '2025-03-20 11:00:00'),
('b1111111-1111-1111-1111-111111111111', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '550e8400-e29b-41d4-a716-446655440000', '2025-02-05', 'initial', 'Stage 2', 'New patient registration and baseline assessment', 'Patient is a 21-year-old female presenting for initial consultation. Patient appears healthy but reports occasional fatigue. No signs of opportunistic infections.', 'Patient is in Stage 2. Baseline assessment needed. Recommended comprehensive laboratory workup.', '1. Complete baseline laboratory tests\n2. CD4 count and viral load\n3. Chest X-ray\n4. Schedule follow-up in 1 week', '2025-02-12', 'Review baseline lab results', '2025-02-05 13:45:00', '2025-02-05 13:45:00'),
('b2222222-2222-2222-2222-222222222222', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-02-28', 'emergency', 'Stage 2', 'Fever, cough, and shortness of breath for 3 days', 'Patient presents with acute respiratory symptoms. Temperature: 38.5°C. Oxygen saturation: 94% on room air. Chest examination reveals mild wheezing. No signs of severe respiratory distress.', 'Acute respiratory infection, likely viral. Rule out pneumonia. Patient is stable.', '1. Chest X-ray to rule out pneumonia\n2. Symptomatic treatment: Paracetamol 500mg every 6 hours\n3. Rest and hydration\n4. Return if symptoms worsen', '2025-03-05', 'Follow-up for respiratory symptoms', '2025-02-28 16:30:00', '2025-02-28 16:30:00'),
('b3333333-3333-3333-3333-333333333333', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '550e8400-e29b-41d4-a716-446655440000', '2025-03-15', 'follow_up', 'Stage 2', 'Post-emergency follow-up and treatment initiation', 'Patient has recovered from respiratory infection. Lab results reviewed. CD4 count: 380 cells/mm³, Viral load: 8,500 copies/mL. Patient is ready to start ART.', 'Patient is eligible for ART. Respiratory symptoms resolved. No contraindications.', '1. Start ART regimen: TLD\n2. Adherence counseling provided\n3. Monitor for side effects\n4. Return in 2 weeks', '2025-03-29', 'Adherence check and side effect monitoring', '2025-03-15 10:00:00', '2025-03-15 10:00:00'),
('b4444444-4444-4444-4444-444444444444', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '550e8400-e29b-41d4-a716-446655440000', '2025-04-10', 'routine', 'Stage 2', 'Monthly routine check-up', 'Patient reports good adherence. No complaints. Vitals stable. Patient is doing well on treatment.', 'Patient is responding well to ART. Continue current regimen.', '1. Continue ART regimen\n2. Schedule viral load test next month\n3. Continue monthly visits', '2025-05-10', 'Monthly routine follow-up', '2025-04-10 09:15:00', '2025-04-10 09:15:00');

-- --------------------------------------------------------

--
-- Table structure for table `counseling_sessions`
--

CREATE TABLE `counseling_sessions` (
  `session_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `counselor_id` char(36) NOT NULL,
  `facility_id` char(36) NOT NULL,
  `session_date` date DEFAULT curdate(),
  `session_type` enum('pre_test','post_test','adherence','mental_health','support','other') NOT NULL,
  `session_notes` text DEFAULT NULL,
  `follow_up_required` tinyint(1) DEFAULT 0,
  `follow_up_date` date DEFAULT NULL,
  `follow_up_reason` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `counseling_sessions`
--

INSERT INTO `counseling_sessions` (`session_id`, `patient_id`, `counselor_id`, `facility_id`, `session_date`, `session_type`, `session_notes`, `follow_up_required`, `follow_up_date`, `follow_up_reason`, `created_at`) VALUES
('051d4885-44d1-4770-9cdb-80baa79b3f9e', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440001', '2025-11-19', 'adherence', '{\"duration\":45,\"topics\":[\"Lifestyle Modifications\",\"Stigma Management\"],\"notes\":\"fasdfsdf\"}', 0, NULL, NULL, '2025-11-19 15:29:34'),
('45534bc6-d2b6-4213-a582-7256f268cf33', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440001', '2025-11-19', 'adherence', '{\"duration\":45,\"topics\":[\"Medication Adherence\",\"Side Effect Management\"],\"notes\":\"dasdasd\"}', 1, '2025-11-20', NULL, '2025-11-19 16:13:36'),
('cb6c28b7-8911-4d51-83d2-553fbea29473', '9380eb9a-4d99-43dc-a1db-364a4067c39a', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-11-29', 'adherence', '{\"duration\":45,\"topics\":[\"Medication Adherence\",\"Side Effect Management\",\"Lifestyle Modifications\"],\"notes\":\"Patient reviewed medication schedule, reported mild side effects. Discussed lifestyle and mental health strategies. Encouraged disclosure to family where safe.\"}', 1, '2025-12-08', 'Review medication adherence and assess side effects', '2025-11-29 09:21:11');

-- --------------------------------------------------------

--
-- Table structure for table `dashboard_cache`
--

CREATE TABLE `dashboard_cache` (
  `cache_id` char(36) NOT NULL,
  `widget_id` varchar(100) NOT NULL,
  `parameters` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`parameters`)),
  `cached_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`cached_data`)),
  `cached_at` datetime DEFAULT current_timestamp(),
  `expires_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `dashboard_cache`
--

INSERT INTO `dashboard_cache` (`cache_id`, `widget_id`, `parameters`, `cached_data`, `cached_at`, `expires_at`) VALUES
('cache-0001-0000-0000-000000000001', 'admin_dashboard_overview', '{\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\"}', '{\"stats\":{\"totalPatients\":3,\"todayAppointments\":2,\"lowStockAlerts\":2,\"monthlyPrescriptions\":6},\"patientRegistrationData\":[{\"name\":\"Nov\",\"patients\":3}],\"monthlyAppointmentsData\":[{\"name\":\"Nov\",\"appointments\":5}],\"riskDistributionData\":[{\"name\":\"Low\",\"value\":33.3,\"color\":\"#4caf50\"},{\"name\":\"Medium\",\"value\":33.3,\"color\":\"#ff9800\"},{\"name\":\"High\",\"value\":33.3,\"color\":\"#f44336\"}],\"monthlyPrescriptionsData\":[{\"name\":\"Nov\",\"prescriptions\":6}]}', '2025-11-29 10:13:06', '2025-11-29 10:18:06'),
('cache-0002-0000-0000-000000000002', 'system_summary', '{}', '{\"patientDemographics\":[{\"name\":\"Male\",\"value\":33.3,\"color\":\"#1976d2\"},{\"name\":\"Female\",\"value\":66.7,\"color\":\"#ec407a\"}],\"adherenceTrends\":[{\"name\":\"Nov\",\"value\":93.5}],\"inventoryLevels\":[{\"name\":\"Tenofovir/Lamivudine/Dolutegravir (TLD)\",\"value\":\"500\"},{\"name\":\"Efavirenz 600mg\",\"value\":\"300\"},{\"name\":\"Atazanavir/Ritonavir\",\"value\":\"200\"}],\"appointmentAttendance\":[{\"name\":\"Completed\",\"value\":40,\"color\":\"#4caf50\"},{\"name\":\"Scheduled\",\"value\":40,\"color\":\"#1976d2\"},{\"name\":\"Cancelled\",\"value\":20,\"color\":\"#f44336\"}]}', '2025-11-29 10:13:06', '2025-11-29 10:18:06'),
('cache-0003-0000-0000-000000000003', 'patient_registration_trends', '{\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"months\":6}', '{\"data\":[{\"name\":\"Jun\",\"patients\":0},{\"name\":\"Jul\",\"patients\":0},{\"name\":\"Aug\",\"patients\":0},{\"name\":\"Sep\",\"patients\":0},{\"name\":\"Oct\",\"patients\":0},{\"name\":\"Nov\",\"patients\":3}]}', '2025-11-29 10:13:06', '2025-11-29 10:23:06'),
('cache-0004-0000-0000-000000000004', 'monthly_appointments', '{\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"months\":6}', '{\"data\":[{\"name\":\"Jun\",\"appointments\":0},{\"name\":\"Jul\",\"appointments\":0},{\"name\":\"Aug\",\"appointments\":0},{\"name\":\"Sep\",\"appointments\":0},{\"name\":\"Oct\",\"appointments\":0},{\"name\":\"Nov\",\"appointments\":5}]}', '2025-11-29 10:13:06', '2025-11-29 10:23:06'),
('cache-0005-0000-0000-000000000005', 'monthly_prescriptions', '{\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"months\":6}', '{\"data\":[{\"name\":\"Jun\",\"prescriptions\":0},{\"name\":\"Jul\",\"prescriptions\":0},{\"name\":\"Aug\",\"prescriptions\":0},{\"name\":\"Sep\",\"prescriptions\":0},{\"name\":\"Oct\",\"prescriptions\":0},{\"name\":\"Nov\",\"prescriptions\":6}]}', '2025-11-29 10:13:06', '2025-11-29 10:23:06'),
('cache-0006-0000-0000-000000000006', 'risk_distribution', '{\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\"}', '{\"data\":[{\"name\":\"Low\",\"value\":33.3,\"color\":\"#4caf50\"},{\"name\":\"Medium\",\"value\":33.3,\"color\":\"#ff9800\"},{\"name\":\"High\",\"value\":33.3,\"color\":\"#f44336\"}],\"total\":3}', '2025-11-29 10:13:06', '2025-11-29 10:23:06'),
('cache-0007-0000-0000-000000000007', 'adherence_trends', '{\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"months\":6}', '{\"data\":[{\"name\":\"Jun\",\"value\":0},{\"name\":\"Jul\",\"value\":0},{\"name\":\"Aug\",\"value\":0},{\"name\":\"Sep\",\"value\":0},{\"name\":\"Oct\",\"value\":0},{\"name\":\"Nov\",\"value\":93.5}]}', '2025-11-29 10:13:06', '2025-11-29 10:23:06'),
('cache-0008-0000-0000-000000000008', 'inventory_levels', '{\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"limit\":10}', '{\"data\":[{\"name\":\"Tenofovir/Lamivudine/Dolutegravir (TLD)\",\"value\":500},{\"name\":\"Efavirenz 600mg\",\"value\":300},{\"name\":\"Atazanavir/Ritonavir\",\"value\":200},{\"name\":\"Paracetamol 500mg\",\"value\":1000}]}', '2025-11-29 10:13:06', '2025-11-29 10:23:06');

-- --------------------------------------------------------

--
-- Table structure for table `diagnoses`
--

CREATE TABLE `diagnoses` (
  `diagnosis_id` char(36) NOT NULL,
  `visit_id` char(36) NOT NULL,
  `icd10_code` varchar(10) DEFAULT NULL,
  `diagnosis_description` text NOT NULL,
  `diagnosis_type` enum('primary','secondary','differential','rule_out') DEFAULT 'primary',
  `is_chronic` tinyint(1) DEFAULT 0,
  `onset_date` date DEFAULT NULL,
  `resolved_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `diagnoses`
--

INSERT INTO `diagnoses` (`diagnosis_id`, `visit_id`, `icd10_code`, `diagnosis_description`, `diagnosis_type`, `is_chronic`, `onset_date`, `resolved_date`) VALUES
('d1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'B20', 'Human immunodeficiency virus [HIV] disease', 'primary', 1, '2024-12-01', NULL),
('d2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'B20', 'Human immunodeficiency virus [HIV] disease', 'primary', 1, '2024-12-01', NULL),
('d2222222-2222-2222-2222-222222222223', 'a2222222-2222-2222-2222-222222222222', 'Z79.899', 'Other long term (current) drug therapy', 'secondary', 1, '2025-01-24', NULL),
('d4444444-4444-4444-4444-444444444444', 'a4444444-4444-4444-4444-444444444444', 'B20', 'Human immunodeficiency virus [HIV] disease', 'primary', 1, '2024-12-01', NULL),
('d4444444-4444-4444-4444-444444444445', 'a4444444-4444-4444-4444-444444444444', 'Z79.899', 'Other long term (current) drug therapy', 'secondary', 1, '2025-01-24', NULL),
('d5555555-5555-5555-5555-555555555555', 'b1111111-1111-1111-1111-111111111111', 'B20', 'Human immunodeficiency virus [HIV] disease', 'primary', 1, '2025-01-15', NULL),
('d6666666-6666-6666-6666-666666666666', 'b2222222-2222-2222-2222-222222222222', 'B20', 'Human immunodeficiency virus [HIV] disease', 'primary', 1, '2025-01-15', NULL),
('d6666666-6666-6666-6666-666666666667', 'b2222222-2222-2222-2222-222222222222', 'J11.1', 'Influenza due to unidentified influenza virus with other respiratory manifestations', 'secondary', 0, '2025-02-25', '2025-03-05'),
('d7777777-7777-7777-7777-777777777777', 'b3333333-3333-3333-3333-333333333333', 'B20', 'Human immunodeficiency virus [HIV] disease', 'primary', 1, '2025-01-15', NULL),
('d7777777-7777-7777-7777-777777777778', 'b3333333-3333-3333-3333-333333333333', 'Z79.899', 'Other long term (current) drug therapy', 'secondary', 1, '2025-03-15', NULL),
('d8888888-8888-8888-8888-888888888888', 'b4444444-4444-4444-4444-444444444444', 'B20', 'Human immunodeficiency virus [HIV] disease', 'primary', 1, '2025-01-15', NULL),
('d8888888-8888-8888-8888-888888888889', 'b4444444-4444-4444-4444-444444444444', 'Z79.899', 'Other long term (current) drug therapy', 'secondary', 1, '2025-03-15', NULL),
('f067cfd7-5a1e-4310-9c61-21a9e7b020c7', '30db2922-7990-4de8-ae4c-33df3ecf37c6', 'J06.9', 'Acute upper respiratory infection, unspecified.', 'primary', 0, '2025-12-12', '2025-12-24');

-- --------------------------------------------------------

--
-- Table structure for table `dispense_events`
--

CREATE TABLE `dispense_events` (
  `dispense_id` char(36) NOT NULL,
  `prescription_id` char(36) NOT NULL,
  `prescription_item_id` char(36) DEFAULT NULL,
  `nurse_id` char(36) NOT NULL,
  `facility_id` char(36) NOT NULL,
  `dispensed_date` date DEFAULT curdate(),
  `quantity_dispensed` int(11) NOT NULL,
  `batch_number` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `dispense_events`
--

INSERT INTO `dispense_events` (`dispense_id`, `prescription_id`, `prescription_item_id`, `nurse_id`, `facility_id`, `dispensed_date`, `quantity_dispensed`, `batch_number`, `notes`, `created_at`) VALUES
('234d016c-5943-481b-b52b-45b77eb593aa', 'be164d40-8c7e-49c8-9682-49bc54ccbdb5', '88d8ee78-b4d9-4437-8774-0c4e66e61e29', '33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000', '2025-11-29', 21, 'AMX-20251129-01', 'Dispensed for 7-day course, 1 capsule every 8 hours after meals. Patient advised to complete full course.', '2025-11-29 10:00:36'),
('96ca1655-078a-4c01-8b25-7eb21a987b71', 'be164d40-8c7e-49c8-9682-49bc54ccbdb5', '88d8ee78-b4d9-4437-8774-0c4e66e61e29', '33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000', '2025-11-29', 21, NULL, NULL, '2025-11-29 10:11:16'),
('b2049859-844e-4c1e-815a-91f7f58ad37b', 'be164d40-8c7e-49c8-9682-49bc54ccbdb5', '88d8ee78-b4d9-4437-8774-0c4e66e61e29', '33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000', '2025-11-29', 21, NULL, NULL, '2025-11-29 10:11:12'),
('de-0001-0000-0000-000000000001', 'rx-0001-0000-0000-000000000001', 'pi-0001-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000', '2025-11-20', 30, 'TLD-2025-001', 'Initial 30-day supply dispensed.', '2025-11-20 10:00:00'),
('de-0002-0000-0000-000000000002', 'rx-0002-0000-0000-000000000002', 'pi-0002-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000', '2025-11-25', 90, 'AMX-2025-001', 'Full course dispensed.', '2025-11-25 11:00:00'),
('de-0003-0000-0000-000000000003', 'rx-0003-0000-0000-000000000003', 'pi-0003-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000', '2025-11-22', 30, 'TLD-2025-001', 'ART initiation - first supply.', '2025-11-22 12:00:00'),
('de-0004-0000-0000-000000000004', 'rx-0004-0000-0000-000000000004', 'pi-0004-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000', '2025-11-28', 30, 'PAR-2025-001', 'Pain management supply.', '2025-11-28 15:00:00'),
('de-0005-0000-0000-000000000005', 'rx-0001-0000-0000-000000000001', 'pi-0001-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000', '2025-12-20', 30, 'TLD-2025-001', 'Monthly refill.', '2025-12-20 10:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `doctor_assignments`
--

CREATE TABLE `doctor_assignments` (
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
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `doctor_assignments_backup`
--

CREATE TABLE `doctor_assignments_backup` (
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
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Defines provider assignments to facilities and scheduling windows.';

--
-- Dumping data for table `doctor_assignments_backup`
--

INSERT INTO `doctor_assignments_backup` (`assignment_id`, `provider_id`, `facility_id`, `start_date`, `end_date`, `daily_start`, `daily_end`, `days_of_week`, `is_locked`, `created_by`, `created_at`) VALUES
('ad7b4ac1-642e-4b9e-9a06-72bc2c5bf683', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-12-01', '2025-12-05', '08:00:00', '17:00:00', 'mon,tue,wed,thu,fri', 0, '11111111-1111-1111-1111-111111111111', '2025-11-28 17:24:11');

-- --------------------------------------------------------

--
-- Table structure for table `doctor_conflicts`
--

CREATE TABLE `doctor_conflicts` (
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
  `created_by` char(36) NOT NULL COMMENT 'Admin who created conflict'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `doctor_conflicts_backup`
--

CREATE TABLE `doctor_conflicts_backup` (
  `conflict_id` char(36) NOT NULL,
  `assignment_id` char(36) NOT NULL,
  `conflict_start` datetime NOT NULL,
  `conflict_end` datetime NOT NULL,
  `reason` text DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Blocks scheduling within an assigned window due to conflicts.';

-- --------------------------------------------------------

--
-- Table structure for table `facilities`
--

CREATE TABLE `facilities` (
  `facility_id` char(36) NOT NULL,
  `facility_name` varchar(150) NOT NULL,
  `facility_type` enum('main','branch','satellite','external') NOT NULL,
  `address` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`address`)),
  `region_id` int(11) DEFAULT NULL,
  `contact_person` varchar(200) DEFAULT NULL,
  `contact_number` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `facilities`
--

INSERT INTO `facilities` (`facility_id`, `facility_name`, `facility_type`, `address`, `region_id`, `contact_person`, `contact_number`, `email`, `is_active`, `created_at`, `updated_at`) VALUES
('0f887fd3-6413-44a8-8c84-12a424f5779e', 'My Hub Cares Ortigas Main', 'branch', '{\"street\":\"Unit 1202, 16th Floor, One San Miguel Avenue\",\"city\":\"Pasig City\",\"province\":\"Metro Manila\"}', 1, 'Juan Dela Cruz', '+63 2 1234 5678', 'ortigas.main@myhubcares.com', 1, '2025-11-29 10:21:30', '2025-11-29 10:28:04'),
('550e8400-e29b-41d4-a716-446655440000', 'MyHubCares Main Facility', 'main', '{\"street\": \"123 Healthcare St\", \"city\": \"Manila\", \"province\": \"Metro Manila\", \"zip_code\": \"1000\"}', 1, 'Dr. Maria Santos', '+63-2-1234-5678', 'main@myhubcares.com', 1, '2025-11-29 10:16:18', '2025-11-29 10:16:18'),
('550e8400-e29b-41d4-a716-446655440001', 'MyHubCares Quezon City Branch', 'branch', '{\"street\": \"456 Wellness Street\", \"barangay\": \"Barangay Care\", \"city\": \"Quezon City\", \"province\": \"Metro Manila\", \"zip\": \"1100\"}', 1, 'Dr. Juan dela Cruz', '+63-2-2345-6789', 'qc@myhubcares.com', 1, '2025-11-29 10:16:18', '2025-11-29 10:16:18'),
('550e8400-e29b-41d4-a716-446655440002', 'MyHubCares Makati Satellite', 'satellite', '{\"street\": \"789 Medical Plaza\", \"barangay\": \"Barangay Medical\", \"city\": \"Makati\", \"province\": \"Metro Manila\", \"zip\": \"1200\"}', 1, 'Nurse Anna Garcia', '+63-2-3456-7890', 'makati@myhubcares.com', 1, '2025-11-29 10:16:18', '2025-11-29 10:16:18'),
('550e8400-e29b-41d4-a716-446655440003', 'MyHubCares Cebu Branch', 'branch', '{\"street\": \"321 Health Avenue\", \"city\": \"Cebu City\", \"province\": \"Cebu\", \"zip\": \"6000\"}', 10, 'Dr. Roberto Lim', '+63-32-4567-8901', 'cebu@myhubcares.com', 1, '2025-11-29 10:16:18', '2025-11-29 10:16:18'),
('550e8400-e29b-41d4-a716-446655440004', 'MyHubCares Davao Satellite', 'satellite', '{\"street\": \"654 Wellness Center\", \"city\": \"Davao City\", \"province\": \"Davao del Sur\", \"zip\": \"8000\"}', 14, 'Dr. Maria Concepcion', '+63-82-5678-9012', 'davao@myhubcares.com', 1, '2025-11-29 10:16:18', '2025-11-29 10:16:18'),
('550e8400-e29b-41d4-a716-446655440005', 'External Partner Clinic - Manila', 'external', '{\"street\": \"987 Partner Street\", \"city\": \"Manila\", \"province\": \"Metro Manila\", \"zip\": \"1000\"}', 1, 'Dr. External Partner', '+63-2-6789-0123', 'partner@external.com', 1, '2025-11-29 10:16:18', '2025-11-29 10:16:18');

-- --------------------------------------------------------

--
-- Table structure for table `faqs`
--

CREATE TABLE `faqs` (
  `faq_id` char(36) NOT NULL,
  `question` text NOT NULL,
  `answer` text NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `view_count` int(11) DEFAULT 0,
  `is_published` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `faqs`
--

INSERT INTO `faqs` (`faq_id`, `question`, `answer`, `category`, `display_order`, `view_count`, `is_published`, `created_at`, `updated_at`) VALUES
('3c17b6c6-c4ed-11f0-832d-98eecbd0e112', 'What is MyHubCares?', 'MyHubCares is a comprehensive healthcare management system designed to provide quality healthcare services. Our mission is \"It\'s my hub, and it\'s yours\" - we are your partner in sexual health and wellness.', 'Billing', 1, 0, 1, '2025-11-19 10:12:44', '2025-11-25 12:17:09'),
('3c17c31d-c4ed-11f0-832d-98eecbd0e112', 'How do I register as a patient?', 'You can register as a patient by clicking on the \"Register\" option on the login page. You will need to provide your personal information, contact details, and create a username and password.', 'general', 2, 0, 1, '2025-11-19 10:12:44', '2025-11-19 10:12:44'),
('3c17c3d3-c4ed-11f0-832d-98eecbd0e112', 'How do I book an appointment?', 'To book an appointment, navigate to the \"Appointments\" section (or \"My Appointments\" if you are a patient), select your preferred date and time, and confirm your booking. You will receive a confirmation notification.', 'general', 3, 0, 1, '2025-11-19 10:12:44', '2025-11-19 10:12:44'),
('3c17c47b-c4ed-11f0-832d-98eecbd0e112', 'How do I view my lab results?', 'Lab results can be viewed in the \"Lab Test\" section. Once your lab results are available, they will appear in your dashboard. You can also access them from your patient profile.', 'treatment', 1, 0, 1, '2025-11-19 10:12:44', '2025-11-19 10:12:44'),
('3c17c4d1-c4ed-11f0-832d-98eecbd0e112', 'How do I manage my medications?', 'You can view your prescriptions in the \"Prescriptions\" section. Medication reminders can be set up in the \"Medication Reminder\" section to help you stay on track with your treatment.', 'treatment', 2, 0, 1, '2025-11-19 10:12:44', '2025-11-19 10:12:44'),
('3c17c51d-c4ed-11f0-832d-98eecbd0e112', 'What should I do if I miss a medication dose?', 'If you miss a medication dose, you should record it in the Medication Adherence section. It is important to inform your healthcare provider about missed doses during your next visit.', 'treatment', 3, 0, 1, '2025-11-19 10:12:44', '2025-11-19 10:12:44'),
('3c17c568-c4ed-11f0-832d-98eecbd0e112', 'How do I change my password?', 'You can change your password by going to Settings > Change Password. You will need to enter your current password and create a new password that meets the security requirements.', 'general', 4, 0, 1, '2025-11-19 10:12:44', '2025-11-19 10:12:44'),
('3c17c5a9-c4ed-11f0-832d-98eecbd0e112', 'How do I update my profile information?', 'You can update your profile information by navigating to the Profile section. Click on \"Edit Profile\" to modify your personal details, contact information, and other relevant information.', 'general', 5, 0, 1, '2025-11-19 10:12:44', '2025-11-19 10:12:44'),
('3c17c645-c4ed-11f0-832d-98eecbd0e112', 'What is UIC?', 'UIC stands for Unique Identifier Code. It is a unique code generated for each patient based on specific criteria to ensure proper patient identification and record management.', 'general', 6, 0, 1, '2025-11-19 10:12:44', '2025-11-19 10:12:44'),
('3c17c690-c4ed-11f0-832d-98eecbd0e112', 'How do I contact support?', 'You can contact support through your facility\'s contact information, or visit our website at www.myhubcares.com. For urgent matters, please contact your healthcare provider directly.', 'general', 7, 0, 1, '2025-11-19 10:12:44', '2025-11-19 10:12:44'),
('5eb27afd-84a6-46d0-8d4a-5ca5e387d2aa', '85469', 'asdasd', 'Technical', 8, 0, 1, '2025-11-26 10:13:53', '2025-11-26 15:55:12');

-- --------------------------------------------------------

--
-- Table structure for table `feedback`
--

CREATE TABLE `feedback` (
  `feedback_id` char(36) NOT NULL,
  `patient_id` char(36) DEFAULT NULL,
  `staff_id` char(36) DEFAULT NULL,
  `category` enum('service','system','staff','facility','other') DEFAULT 'service',
  `message` text NOT NULL,
  `rating` int(11) DEFAULT NULL CHECK (`rating` between 1 and 5),
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `forum_attachments`
--

CREATE TABLE `forum_attachments` (
  `attachment_id` char(36) NOT NULL,
  `post_id` char(36) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `uploaded_at` datetime DEFAULT current_timestamp(),
  `uploaded_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `forum_categories`
--

CREATE TABLE `forum_categories` (
  `category_id` char(36) NOT NULL,
  `category_name` varchar(100) NOT NULL,
  `category_code` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(10) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `forum_categories`
--

INSERT INTO `forum_categories` (`category_id`, `category_name`, `category_code`, `description`, `icon`, `is_active`, `created_at`) VALUES
('00000000-0000-0000-0000-000000000001', 'General Discussion', 'general', 'General topics and discussions', '💬', 1, '2025-11-28 09:13:44'),
('00000000-0000-0000-0000-000000000002', 'Health & Wellness', 'health', 'Health-related discussions and tips', '🏥', 1, '2025-11-28 09:13:44'),
('00000000-0000-0000-0000-000000000003', 'Art & Creativity', 'art', 'Creative expression and art sharing', '🎨', 1, '2025-11-28 09:13:44'),
('00000000-0000-0000-0000-000000000004', 'Support & Community', 'support', 'Peer support and community help', '🤝', 1, '2025-11-28 09:13:44'),
('00000000-0000-0000-0000-000000000005', 'Announcements', 'announcement', 'Important announcements and updates', '📢', 1, '2025-11-28 09:13:44');

-- --------------------------------------------------------

--
-- Table structure for table `forum_posts`
--

CREATE TABLE `forum_posts` (
  `post_id` char(36) NOT NULL,
  `topic_id` char(36) NOT NULL,
  `author_id` char(36) NOT NULL,
  `content` text NOT NULL,
  `parent_post_id` char(36) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `forum_reactions`
--

CREATE TABLE `forum_reactions` (
  `reaction_id` char(36) NOT NULL,
  `post_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `reaction_type` enum('like','love','insightful','thankful','sad','angry') DEFAULT 'like',
  `reacted_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `forum_replies`
--

CREATE TABLE `forum_replies` (
  `reply_id` char(36) NOT NULL,
  `post_id` char(36) NOT NULL,
  `patient_id` char(36) DEFAULT NULL,
  `content` text NOT NULL,
  `is_anonymous` tinyint(1) DEFAULT 1,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `forum_threads`
--

CREATE TABLE `forum_threads` (
  `thread_id` char(36) NOT NULL,
  `group_id` char(36) DEFAULT NULL,
  `title` varchar(300) NOT NULL,
  `created_by` char(36) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `last_post_at` datetime DEFAULT NULL,
  `status` enum('open','closed','archived') DEFAULT 'open',
  `views` int(11) DEFAULT 0,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `category` enum('general','health','art','support','announcement') DEFAULT 'general',
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `forum_topics`
--

CREATE TABLE `forum_topics` (
  `topic_id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `category` enum('general','health','art','support','announcement') DEFAULT 'general',
  `created_by` char(36) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `last_post_at` datetime DEFAULT NULL,
  `status` enum('open','closed','archived') DEFAULT 'open',
  `views` int(11) DEFAULT 0,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `groups`
--

CREATE TABLE `groups` (
  `group_id` char(36) NOT NULL,
  `group_name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `group_type` enum('peer_support','education','admin','public') DEFAULT 'peer_support',
  `facility_id` char(36) DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `group_memberships`
--

CREATE TABLE `group_memberships` (
  `membership_id` char(36) NOT NULL,
  `group_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `patient_id` char(36) DEFAULT NULL,
  `role` enum('member','moderator','owner') DEFAULT 'member',
  `joined_at` datetime DEFAULT current_timestamp(),
  `joined_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `hts_sessions`
--

CREATE TABLE `hts_sessions` (
  `hts_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `tester_id` char(36) NOT NULL,
  `facility_id` char(36) NOT NULL,
  `test_date` date DEFAULT curdate(),
  `test_result` enum('positive','negative','indeterminate') NOT NULL,
  `test_type` varchar(50) DEFAULT NULL,
  `pre_test_counseling` tinyint(1) DEFAULT 0,
  `post_test_counseling` tinyint(1) DEFAULT 0,
  `linked_to_care` tinyint(1) DEFAULT 0,
  `care_link_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hts_sessions`
--

INSERT INTO `hts_sessions` (`hts_id`, `patient_id`, `tester_id`, `facility_id`, `test_date`, `test_result`, `test_type`, `pre_test_counseling`, `post_test_counseling`, `linked_to_care`, `care_link_date`, `notes`, `created_at`) VALUES
('fcb05ff2-3f62-400c-8de4-6296b401f060', '9380eb9a-4d99-43dc-a1db-364a4067c39a', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-11-29', 'positive', 'Facility-based', 1, 0, 1, '2025-11-29', '{\"session_type\":\"Facility-based\",\"client_type\":\"msm\",\"consent_given\":true,\"referral_destination\":null,\"remarks\":\"Patient educated on preventive measures and routine follow-up advised. No immediate concerns noted.\"}', '2025-11-29 09:24:48');

-- --------------------------------------------------------

--
-- Table structure for table `inventory_alerts`
--

CREATE TABLE `inventory_alerts` (
  `alert_id` char(36) NOT NULL,
  `inventory_id` char(36) NOT NULL,
  `alert_type` enum('low_stock','expiring_soon','expired','overstock') NOT NULL,
  `alert_level` enum('info','warning','critical') DEFAULT 'warning',
  `current_value` decimal(10,2) NOT NULL,
  `threshold_value` decimal(10,2) NOT NULL,
  `message` text NOT NULL,
  `acknowledged` tinyint(1) DEFAULT 0,
  `acknowledged_by` char(36) DEFAULT NULL,
  `acknowledged_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory_alerts`
--

INSERT INTO `inventory_alerts` (`alert_id`, `inventory_id`, `alert_type`, `alert_level`, `current_value`, `threshold_value`, `message`, `acknowledged`, `acknowledged_by`, `acknowledged_at`, `created_at`) VALUES
('ia-0001-0000-0000-000000000001', 'inv-0002-0000-0000-000000000002', 'low_stock', 'warning', 300.00, 50.00, 'Efavirenz stock is at 300 tablets. Reorder level is 50.', 0, NULL, NULL, '2025-11-28 10:00:00'),
('ia-0002-0000-0000-000000000002', 'inv-0003-0000-0000-000000000003', 'low_stock', 'critical', 200.00, 50.00, 'Atazanavir/Ritonavir stock is critically low at 200 capsules.', 1, '33333333-3333-3333-3333-333333333333', '2025-11-28 11:00:00', '2025-11-28 10:30:00');

-- --------------------------------------------------------

--
-- Table structure for table `inventory_items`
--

CREATE TABLE `inventory_items` (
  `id` char(36) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `quantity` int(11) DEFAULT 0,
  `unit` varchar(50) DEFAULT NULL,
  `unit_cost` decimal(10,2) DEFAULT NULL,
  `last_restocked` datetime DEFAULT NULL,
  `reorder_level` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory_orders`
--

CREATE TABLE `inventory_orders` (
  `order_id` char(36) NOT NULL,
  `facility_id` char(36) NOT NULL,
  `supplier_id` char(36) NOT NULL,
  `order_date` date DEFAULT curdate(),
  `expected_delivery_date` date DEFAULT NULL,
  `status` enum('pending','ordered','in_transit','received','cancelled','partial') DEFAULT 'pending',
  `total_cost` decimal(10,2) DEFAULT NULL,
  `ordered_by` char(36) NOT NULL,
  `received_by` char(36) DEFAULT NULL,
  `received_at` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory_orders`
--

INSERT INTO `inventory_orders` (`order_id`, `facility_id`, `supplier_id`, `order_date`, `expected_delivery_date`, `status`, `total_cost`, `ordered_by`, `received_by`, `received_at`, `notes`, `created_at`) VALUES
('d9716cb6-c8d2-11f0-90fc-98eecbd0e112', '550e8400-e29b-41d4-a716-446655440000', 'd95d74a8-c8d2-11f0-90fc-98eecbd0e112', '2025-11-14', '2025-11-29', 'in_transit', 15000.00, '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Sample purchase order for inventory replenishment', '2025-11-24 09:13:56'),
('d980a464-c8d2-11f0-90fc-98eecbd0e112', '550e8400-e29b-41d4-a716-446655440000', 'd95d74a8-c8d2-11f0-90fc-98eecbd0e112', '2025-11-04', '2025-11-09', 'received', 8000.00, '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '2025-11-09 00:00:00', 'Sample completed order', '2025-11-24 09:13:56');

-- --------------------------------------------------------

--
-- Table structure for table `inventory_order_items`
--

CREATE TABLE `inventory_order_items` (
  `order_item_id` char(36) NOT NULL,
  `order_id` char(36) NOT NULL,
  `medication_id` char(36) NOT NULL,
  `quantity_ordered` int(11) NOT NULL,
  `quantity_received` int(11) DEFAULT 0,
  `unit_cost` decimal(10,2) DEFAULT NULL,
  `batch_number` varchar(50) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `status` enum('pending','received','partial','cancelled') DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory_order_items`
--

INSERT INTO `inventory_order_items` (`order_item_id`, `order_id`, `medication_id`, `quantity_ordered`, `quantity_received`, `unit_cost`, `batch_number`, `expiry_date`, `status`) VALUES
('d97e466a-c8d2-11f0-90fc-98eecbd0e112', 'd9716cb6-c8d2-11f0-90fc-98eecbd0e112', 'med-0001-0000-0000-000000000001', 200, 0, 50.00, 'BATCH-20261124-001', '2026-11-24', 'pending'),
('d97e5250-c8d2-11f0-90fc-98eecbd0e112', 'd9716cb6-c8d2-11f0-90fc-98eecbd0e112', 'med-0002-0000-0000-000000000002', 200, 0, 7.00, 'BATCH-20261124-001', '2026-11-24', 'pending'),
('d9881fcf-c8d2-11f0-90fc-98eecbd0e112', 'd980a464-c8d2-11f0-90fc-98eecbd0e112', 'med-0001-0000-0000-000000000001', 150, 150, 45.00, 'BATCH-20261124-002', '2026-11-24', 'received');

-- --------------------------------------------------------

--
-- Table structure for table `inventory_suppliers`
--

CREATE TABLE `inventory_suppliers` (
  `supplier_id` char(36) NOT NULL,
  `supplier_name` varchar(200) NOT NULL,
  `contact_person` varchar(200) DEFAULT NULL,
  `contact_phone` varchar(50) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `address` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`address`)),
  `payment_terms` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory_suppliers`
--

INSERT INTO `inventory_suppliers` (`supplier_id`, `supplier_name`, `contact_person`, `contact_phone`, `contact_email`, `address`, `payment_terms`, `is_active`, `created_at`, `updated_at`) VALUES
('d95d74a8-c8d2-11f0-90fc-98eecbd0e112', 'MyHubCares Pharmacy', 'John Dela Cruz', '+63-912-345-6789', 'pharmacy@myhubcares.com', '{\"street\": \"123 Medical Center\", \"city\": \"Manila\", \"province\": \"Metro Manila\", \"zip_code\": \"1000\"}', 'Net 30', 1, '2025-11-24 09:13:56', '2025-11-24 09:13:56'),
('d95d8f62-c8d2-11f0-90fc-98eecbd0e112', 'MedSupply Philippines', 'Maria Santos', '+63-917-654-3210', 'sales@medsupply.ph', '{\"street\": \"456 Health Avenue\", \"city\": \"Makati\", \"province\": \"Metro Manila\", \"zip_code\": \"1200\"}', 'COD', 1, '2025-11-24 09:13:56', '2025-11-24 09:13:56'),
('d95d9051-c8d2-11f0-90fc-98eecbd0e112', 'Pharma Distributors Inc.', 'Robert Tan', '+63-918-111-2222', 'info@pharmadist.com', '{\"street\": \"789 Pharma Street\", \"city\": \"Quezon City\", \"province\": \"Metro Manila\", \"zip_code\": \"1100\"}', 'Net 15', 1, '2025-11-24 09:13:56', '2025-11-24 09:13:56');

-- --------------------------------------------------------

--
-- Table structure for table `inventory_transactions`
--

CREATE TABLE `inventory_transactions` (
  `transaction_id` char(36) NOT NULL,
  `inventory_id` char(36) NOT NULL,
  `transaction_type` enum('restock','dispense','adjustment','transfer','expired','damaged','return') NOT NULL,
  `quantity_change` int(11) NOT NULL,
  `quantity_before` int(11) NOT NULL,
  `quantity_after` int(11) NOT NULL,
  `batch_number` varchar(50) DEFAULT NULL,
  `transaction_reason` text DEFAULT NULL,
  `performed_by` char(36) NOT NULL,
  `facility_id` char(36) NOT NULL,
  `transaction_date` date DEFAULT curdate(),
  `reference_id` char(36) DEFAULT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory_transactions`
--

INSERT INTO `inventory_transactions` (`transaction_id`, `inventory_id`, `transaction_type`, `quantity_change`, `quantity_before`, `quantity_after`, `batch_number`, `transaction_reason`, `performed_by`, `facility_id`, `transaction_date`, `reference_id`, `reference_type`, `notes`, `created_at`) VALUES
('it-0001-0000-0000-000000000001', 'inv-0001-0000-0000-000000000001', 'restock', 500, 0, 500, 'TLD-2025-001', 'Initial stock', '33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000', '2025-11-15', NULL, NULL, 'Initial inventory restock', '2025-11-15 10:00:00'),
('it-0002-0000-0000-000000000002', 'inv-0001-0000-0000-000000000001', 'dispense', -30, 500, 470, 'TLD-2025-001', 'Dispensed to patient', '33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000', '2025-11-20', 'de-0001-0000-0000-000000000001', 'dispense_event', 'Dispensed for prescription rx-0001', '2025-11-20 10:00:00'),
('it-0003-0000-0000-000000000003', 'inv-0005-0000-0000-000000000005', 'restock', 800, 0, 800, 'AMX-2025-001', 'New stock received', '33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000', '2025-11-18', NULL, NULL, 'Restocked Amoxicillin', '2025-11-18 10:00:00'),
('it-0004-0000-0000-000000000004', 'inv-0005-0000-0000-000000000005', 'dispense', -90, 800, 710, 'AMX-2025-001', 'Dispensed to patient', '33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000', '2025-11-25', 'de-0002-0000-0000-000000000002', 'dispense_event', 'Dispensed for prescription rx-0002', '2025-11-25 11:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `in_app_messages`
--

CREATE TABLE `in_app_messages` (
  `message_id` char(36) NOT NULL,
  `sender_id` char(36) DEFAULT NULL,
  `recipient_id` char(36) DEFAULT NULL,
  `recipient_type` enum('user','patient','group') DEFAULT 'user',
  `group_id` char(36) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `body` text NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  `is_read` tinyint(1) DEFAULT 0,
  `sent_at` datetime DEFAULT current_timestamp(),
  `read_at` datetime DEFAULT NULL,
  `priority` enum('low','normal','high') DEFAULT 'normal'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lab_files`
--

CREATE TABLE `lab_files` (
  `file_id` char(36) NOT NULL,
  `result_id` char(36) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `uploaded_at` datetime DEFAULT current_timestamp(),
  `uploaded_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `lab_files`
--

INSERT INTO `lab_files` (`file_id`, `result_id`, `file_name`, `file_path`, `file_size`, `mime_type`, `uploaded_at`, `uploaded_by`) VALUES
('f1a2b3c4-d5e6-4789-a0b1-c2d3e4f5a6b7', 'd1cc561a-c533-4c17-bf09-4bc4d9841094', 'CD4_Count_Report_Jose_Reyes_2025-11-17.pdf', 'uploads/lab-files/CD4_Count_Report_Jose_Reyes_2025-11-17.pdf', 245678, 'application/pdf', '2025-11-17 13:00:00', '55555555-5555-5555-5555-555555555555'),
('f2b3c4d5-e6f7-4890-b1c2-d3e4f5a6b7c8', 'e2dd672b-d644-5d28-cg20-5cd5e0952105', 'Viral_Load_Report_Jose_Reyes_2025-11-18.pdf', 'uploads/lab-files/Viral_Load_Report_Jose_Reyes_2025-11-18.pdf', 198432, 'application/pdf', '2025-11-18 16:00:00', '55555555-5555-5555-5555-555555555555'),
('f3c4d5e6-f7a8-4901-c2d3-e4f5a6b7c8d9', 'h5gg905e-g977-8g5b-fj53-8fg8h3285438', 'CD4_Count_Critical_Hanna_Sarabia_2025-11-20.jpg', 'uploads/lab-files/CD4_Count_Critical_Hanna_Sarabia_2025-11-20.jpg', 165137, 'image/jpeg', '2025-11-20 11:00:00', '55555555-5555-5555-5555-555555555555'),
('f4d5e6f7-a8b9-4012-d3e4-f5a6b7c8d9e0', 'f3ee783c-e755-6e39-dh31-6de6f1063216', 'Liver_Function_Test_Jose_Reyes_2025-11-19.pdf', 'uploads/lab-files/Liver_Function_Test_Jose_Reyes_2025-11-19.pdf', 312456, 'application/pdf', '2025-11-19 13:00:00', '55555555-5555-5555-5555-555555555555');

-- --------------------------------------------------------

--
-- Table structure for table `lab_orders`
--

CREATE TABLE `lab_orders` (
  `order_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `ordering_provider_id` char(36) NOT NULL,
  `facility_id` char(36) NOT NULL,
  `order_date` date DEFAULT curdate(),
  `test_panel` varchar(100) NOT NULL,
  `priority` enum('routine','urgent','stat') DEFAULT 'routine',
  `status` enum('ordered','collected','in_progress','completed','cancelled') DEFAULT 'ordered',
  `collection_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `lab_orders`
--

INSERT INTO `lab_orders` (`order_id`, `patient_id`, `ordering_provider_id`, `facility_id`, `order_date`, `test_panel`, `priority`, `status`, `collection_date`, `notes`, `created_at`) VALUES
('259676cc-640d-4492-85b8-5ed563307936', '9380eb9a-4d99-43dc-a1db-364a4067c39a', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-11-29', 'Complete Blood Count (CBC)', 'routine', 'completed', '2025-11-29', 'Auto-created order for lab result entry. WBC count within normal range. No indication of acute infection. Recommend correlating clinically with patient symptoms.', '2025-11-29 09:30:26'),
('a1b2c3d4-e5f6-4789-a0b1-c2d3e4f5a6b7', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-11-20', 'CD4 Count', 'routine', 'in_progress', '2025-11-20', 'Baseline CD4 count', '2025-11-20 09:15:00'),
('b2c3d4e5-f6a7-4890-b1c2-d3e4f5a6b7c8', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-11-18', 'Viral Load', 'stat', 'collected', '2025-11-18', 'Urgent viral load test requested', '2025-11-18 14:30:00'),
('c3d4e5f6-a7b8-4901-c2d3-e4f5a6b7c8d9', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-11-21', 'Complete Blood Count', 'routine', 'ordered', NULL, 'Pre-treatment baseline', '2025-11-21 10:00:00'),
('d4e5f6a7-b8c9-4012-d3e4-f5a6b7c8d9e0', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-11-19', 'Liver Function Test', 'routine', 'completed', '2025-11-19', 'Monitoring ART side effects', '2025-11-19 11:20:00'),
('e3768174-a8b4-41f0-8579-83038959c1a5', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-11-17', 'CD4 Count', 'routine', 'completed', '2025-11-17', 'Routine monitoring for ART patient', '2025-11-17 12:28:23'),
('e4e5c4d0-e314-4c45-bf8f-bb3cacc27a9c', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-11-16', 'Viral Load', 'urgent', 'cancelled', NULL, 'Patient requested cancellation', '2025-11-16 21:35:53');

-- --------------------------------------------------------

--
-- Table structure for table `lab_results`
--

CREATE TABLE `lab_results` (
  `result_id` char(36) NOT NULL,
  `order_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `test_code` varchar(50) NOT NULL,
  `test_name` varchar(150) NOT NULL,
  `result_value` varchar(100) NOT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `reference_range_min` decimal(10,2) DEFAULT NULL,
  `reference_range_max` decimal(10,2) DEFAULT NULL,
  `reference_range_text` varchar(100) DEFAULT NULL,
  `is_critical` tinyint(1) DEFAULT 0,
  `critical_alert_sent` tinyint(1) DEFAULT 0,
  `collected_at` date DEFAULT NULL,
  `reported_at` date DEFAULT curdate(),
  `reviewed_at` datetime DEFAULT NULL,
  `reviewer_id` char(36) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `created_by` char(36) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `lab_results`
--

INSERT INTO `lab_results` (`result_id`, `order_id`, `patient_id`, `test_code`, `test_name`, `result_value`, `unit`, `reference_range_min`, `reference_range_max`, `reference_range_text`, `is_critical`, `critical_alert_sent`, `collected_at`, `reported_at`, `reviewed_at`, `reviewer_id`, `notes`, `created_at`, `created_by`) VALUES
('d1cc561a-c533-4c17-bf09-4bc4d9841094', 'e3768174-a8b4-41f0-8579-83038959c1a5', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'CD4COUNT', 'CD4 Count', '450', 'cells/μL', 500.00, 1200.00, '500-1200 cells/μL', 1, 1, '2025-11-17', '2025-11-17', '2025-11-17 15:30:00', '22222222-2222-2222-2222-222222222222', 'Slightly below normal range - monitor closely', '2025-11-17 12:30:14', '55555555-5555-5555-5555-555555555555'),
('dc910bd9-1c93-440e-a00a-aa8cef77df75', '259676cc-640d-4492-85b8-5ed563307936', '9380eb9a-4d99-43dc-a1db-364a4067c39a', 'CBC-001', 'Complete Blood Count (CBC)', '5.2', '×10⁹/L (WBC)', 4.00, 11.00, '4.0 – 11.0 ×10⁹/L', 0, 0, '2025-11-29', '2025-11-30', NULL, NULL, 'WBC count within normal range. No indication of acute infection. Recommend correlating clinically with patient symptoms.', '2025-11-29 09:30:26', '55555555-5555-5555-5555-555555555555'),
('e2dd672b-d644-5d28-cg20-5cd5e0952105', 'b2c3d4e5-f6a7-4890-b1c2-d3e4f5a6b7c8', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'VL', 'Viral Load', '<20', 'copies/mL', NULL, NULL, '<20 copies/mL (undetectable)', 0, 0, '2025-11-18', '2025-11-18', '2025-11-18 16:00:00', '22222222-2222-2222-2222-222222222222', 'Excellent response to ART', '2025-11-18 15:45:00', '55555555-5555-5555-5555-555555555555'),
('f3ee783c-e755-6e39-dh31-6de6f1063216', 'd4e5f6a7-b8c9-4012-d3e4-f5a6b7c8d9e0', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ALT', 'Alanine Aminotransferase', '35', 'U/L', 7.00, 56.00, '7-56 U/L', 0, 0, '2025-11-19', '2025-11-19', '2025-11-19 13:00:00', '22222222-2222-2222-2222-222222222222', 'Within normal limits', '2025-11-19 12:30:00', '55555555-5555-5555-5555-555555555555'),
('g4ff894d-f866-7f4a-ei42-7ef7g2174327', 'd4e5f6a7-b8c9-4012-d3e4-f5a6b7c8d9e0', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'AST', 'Aspartate Aminotransferase', '28', 'U/L', 10.00, 40.00, '10-40 U/L', 0, 0, '2025-11-19', '2025-11-19', '2025-11-19 13:00:00', '22222222-2222-2222-2222-222222222222', 'Within normal limits', '2025-11-19 12:30:00', '55555555-5555-5555-5555-555555555555'),
('h5gg905e-g977-8g5b-fj53-8fg8h3285438', 'a1b2c3d4-e5f6-4789-a0b1-c2d3e4f5a6b7', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', 'CD4COUNT', 'CD4 Count', '180', 'cells/μL', 500.00, 1200.00, '500-1200 cells/μL', 1, 1, '2025-11-20', '2025-11-20', '2025-11-20 11:00:00', '22222222-2222-2222-2222-222222222222', 'CRITICAL: Very low CD4 count - immediate intervention needed', '2025-11-20 10:30:00', '55555555-5555-5555-5555-555555555555'),
('i6hh016f-ha88-9h6c-gk64-9gh9i4396549', 'c3d4e5f6-a7b8-4901-c2d3-e4f5a6b7c8d9', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', 'HGB', 'Hemoglobin', '13.5', 'g/dL', 12.00, 15.50, '12.0-15.5 g/dL (Female)', 0, 0, '2025-11-21', '2025-11-21', NULL, NULL, 'Pending review', '2025-11-21 11:00:00', '55555555-5555-5555-5555-555555555555'),
('j7ii127g-ib99-ai7d-hl75-ahiaj5407650', 'c3d4e5f6-a7b8-4901-c2d3-e4f5a6b7c8d9', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', 'WBC', 'White Blood Cell Count', '6.8', '×10³/μL', 4.50, 11.00, '4.5-11.0 ×10³/μL', 0, 0, '2025-11-21', '2025-11-21', NULL, NULL, 'Pending review', '2025-11-21 11:00:00', '55555555-5555-5555-5555-555555555555');

-- --------------------------------------------------------

--
-- Table structure for table `learning_modules`
--

CREATE TABLE `learning_modules` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `content` text DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `link_url` varchar(255) NOT NULL,
  `read_time` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `learning_modules`
--

INSERT INTO `learning_modules` (`id`, `title`, `description`, `content`, `category`, `link_url`, `read_time`, `created_at`, `updated_at`, `created_by`) VALUES
(9, 'HIV and AIDS', 'asdadadWHO fact sheet on HIV and AIDS with key facts and information on signs and symptoms, transmission, risk factors, testing and counselling, prevention, treatment and WHO response.', '<html><head></head><body><article class=\"sf-detail-body-wrapper\">\n        <div><h2>Key facts</h2><ul><li>HIV remains a major global public health issue, having claimed an estimated 44.1 million lives to date. Transmission is ongoing in all countries globally.</li><li>There were an estimated 40.8 million people living with HIV at the end of 2024, 65% of whom are in the WHO African Region.</li><li>In 2024, an estimated 630 000 people died from HIV-related causes and an estimated 1.3 million people acquired HIV.</li><li>There is no cure for HIV infection. However, with access to effective HIV prevention, diagnosis, treatment and care, including for opportunistic infections, HIV infection has become a manageable chronic health condition, enabling people living with HIV to lead long and healthy lives.</li><li>WHO, the Global Fund and UNAIDS all have global HIV strategies that are aligned with the SDG target 3.3 of ending the HIV epidemic by 2030.</li><li>By 2025, 95% of all people living with HIV should have a diagnosis, 95% of whom should be taking lifesaving antiretroviral treatment, and 95% of people living with HIV on treatment should achieve a suppressed viral load for the benefit of the person’s health and for reducing onward HIV transmission. In 2024, these percentages were 87%, 89%, and 94% respectively.</li><li>In 2024, of all people living with HIV, 87% knew their status, 77% were receiving antiretroviral therapy and 73% had suppressed viral loads.</li></ul><hr><h2>Overview</h2><p>Human immunodeficiency virus (HIV) is a virus that attacks the body’s immune system. Acquired immunodeficiency syndrome (AIDS) occurs at the most advanced stage of infection.</p><p>HIV targets the body’s white blood cells, weakening the immune system. This makes it easier to get sick with diseases like tuberculosis, infections and some cancers.</p><p>HIV is spread from the body fluids of an infected person, including blood, breast milk, semen and vaginal fluids. It is not spread by kisses, hugs or sharing food. It can also spread from a mother to her baby.</p><p>HIV can be prevented and treated with antiretroviral therapy (ART). Untreated HIV can progress to AIDS, often after many years.</p><p>WHO now defines Advanced HIV Disease (AHD) as CD4 cell count less than 200 cells/mm3 or WHO stage 3 or 4 event in adults and adolescents. All children younger than 5 years of age living with HIV are considered to have advanced HIV disease, regardless of clinical or immunological status.</p><h2>Signs and symptoms</h2><p>The signs and symptoms of HIV vary depending on the stage of infection.</p><p>HIV spreads more easily in the first few months after a person is infected, but many are unaware of their status until the later stages. In the first few weeks after being infected people may not experience symptoms. Others may have an influenza-like illness including:</p><ul><li>fever</li><li>headache</li><li>rash</li><li>sore throat.</li></ul><p>The infection progressively weakens the immune system. This can cause other signs and symptoms:</p><ul><li>swollen lymph nodes</li><li>weight loss</li><li>fever</li><li>diarrhoea</li><li>cough.</li></ul><p>Without treatment, people living with HIV infection can also develop severe illnesses:</p><ul><li>tuberculosis (TB)</li><li>cryptococcal meningitis</li><li>severe bacterial infections</li><li>cancers such as lymphomas and Kaposi\'s sarcoma.</li></ul><p>HIV can make other infections, such as hepatitis C, hepatitis B and mpox, get worse.</p><h2>Transmission</h2><p>HIV can be transmitted via the exchange of body fluids from people living with HIV, including blood, breast milk, semen, and vaginal secretions. HIV can also be transmitted to a child during pregnancy and delivery. &nbsp;People cannot become infected with HIV through ordinary day-to-day contact such as kissing, hugging, shaking hands, or sharing personal objects, food or water.</p><p>People living with HIV who are taking ART and have an undetectable viral load will not transmit HIV to their sexual partners. Early access to ART and support to remain on treatment is therefore critical not only to improve the health of people living with HIV but also to prevent HIV transmission.</p><h2>Risk factors</h2><p>Behaviours and conditions that put people at greater risk of contracting HIV include:</p><ul><li>having anal or vaginal sex without a condom;</li><li>having another sexually transmitted infection (STI) such as syphilis, herpes, chlamydia, gonorrhoea and bacterial vaginosis;</li><li>harmful use of alcohol or drugs in the context of sexual behaviour;</li><li>sharing contaminated needles, syringes and other injecting equipment, or drug solutions when injecting drugs;</li><li>receiving unsafe injections, blood transfusions, or tissue transplantation; and</li><li>medical procedures that involve unsterile cutting or piercing; or accidental needle stick injuries, including among health workers.</li></ul><h2>Diagnosis</h2><p>HIV can be diagnosed through rapid diagnostic tests that provide same-day results. This greatly facilitates early diagnosis and linkage with treatment and prevention. People can also use HIV self-tests to test themselves. However, no single test can provide a full HIV positive diagnosis; confirmatory testing is required, conducted by a qualified and trained health worker or community worker. HIV infection can be detected with great accuracy using WHO prequalified tests within a nationally approved testing strategy and algorithm.</p><p>Most widely used HIV diagnostic tests detect antibodies produced by a person as part of their immune response to fight HIV. In most cases, people develop antibodies to HIV within 28 days of infection. During this time, people are in the so-called “window period” when they have low levels of antibodies which cannot be detected by many rapid tests, but they may still transmit HIV to others. People who have had a recent high-risk exposure and test negative can have a further test after 28 days.</p><p>Following a positive diagnosis, people should be retested before they are enrolled in treatment and care to rule out any potential testing or reporting error. While testing for adolescents and adults has been made simple and efficient, this is not the case for babies born to HIV-positive mothers. For children less than 18 months of age, rapid antibody testing is not sufficient to identify HIV infection – virological testing must be provided as early as birth or at 6 weeks of age. New technologies are now available to perform this test at the point of care and enable same-day results, which will accelerate appropriate linkage with treatment and care.</p><h2>Prevention</h2><p>HIV is a preventable disease. The risk of HIV infection can be reduced by:</p><ul><li>using a male or female condom during sex</li><li>being tested for HIV and other sexually transmitted infections</li><li>being circumcised if you are a man</li><li>using harm reduction services if you inject and use drugs.</li></ul><p>Pre-exposure prophylaxis (PrEP) is an additional prevention option. It is an antiretroviral medication used by HIV-negative people to reduce the risk of HIV&nbsp;acquisition. WHO recommends the following PrEP methods&nbsp;:</p><ul><li>oral tenofovir (TDF)-based PrEP</li><li>dapivirine vaginal ring</li><li>long-acting injectable cabotegravir</li><li>long-acting injectable lenacapavir.</li></ul><p>ARVs can also be used to prevent mothers from passing HIV to their children.</p><p>People taking antiretroviral therapy (ART) and who have no evidence of virus in the blood will not pass HIV to their sexual partners. Access to testing and ART is an important part of preventing HIV.</p><h3>Antiretroviral drugs given to people without HIV can prevent infection</h3><p>When given before possible exposures to HIV it is called pre-exposure prophylaxis (PrEP) and when given after an exposure it is called post-exposure prophylaxis (PEP).&nbsp; People can use PrEP or PEP when the risk of contracting HIV is high; people should seek advice from a clinician when thinking about using PrEP or PEP.</p><h2>Treatment</h2><p>There is no cure for HIV infection. It is treated with antiretroviral drugs, which stop the virus from replicating in the body.</p><p>Current antiretroviral therapy (ART) does not cure HIV infection but allows a person’s immune system to get stronger. This helps them to fight other infections.</p><p>Currently, ART must be taken every day for the rest of a person’s life.</p><p>ART lowers the amount of the virus in a person’s body. This stops symptoms and allows people to live full and healthy lives. People living with HIV who are taking ART and who have no evidence of virus in the blood will not spread the virus to their sexual partners.</p><p>Pregnant women with HIV should have access to, and take, ART as soon as possible. This protects the health of the mother and will help prevent HIV transmission to the fetus before birth, or through breast milk.</p><p>Advanced HIV disease remains a persistent problem in the HIV response. WHO is supporting countries to implement the advanced HIV disease package of care to reduce illness and death. Newer HIV medicines and short course treatments for opportunistic infections like cryptococcal meningitis are being developed that may change the way people take ART and prevention medicines, including access to long-acting injectable formulations,&nbsp;such as lenacapavir which now has been approved by the FDA for HIV prevention.</p><p>More information on HIV treatments</p><h2>WHO response</h2><p>Global health sector strategies on HIV, viral hepatitis, and sexually transmitted infections for the period 2022–2030 (GHSSs) guide strategic responses to achieve the goals of ending AIDS, viral hepatitis B and C, and sexually transmitted infections by 2030.</p><p>WHO’s Global HIV, Hepatitis and STIs Programmes recommend shared and disease-specific country actions supported by WHO and partners. They consider the epidemiological, technological, and contextual shifts of previous years, foster learning, and create opportunities to leverage innovation and new knowledge.</p><p>WHO’s programmes call to reach the people most affected and most at risk for each disease, and to address inequities. &nbsp;Under a framework of universal health coverage and primary health care, WHO’s programmes contribute to achieving the goals of the 2030 Agenda for Sustainable Development.</p></div>\n    </article></body></html>', 'BASICS', 'https://www.who.int/news-room/fact-sheets/detail/hiv-aids?fbclid=IwY2xjawOSHiRleHRuA2FlbQIxMABicmlkETFKVFVGRTBXT3N3S25JcU1Ic3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHpiez-ERPhmWTuMH7km_VioZYTM5kx-2yp5cLxRSrB6y-6urwGko0JuwI4Jr_aem_NIeuZZ_-t0FDzWQkz54BOQ', '8 min', '2025-11-26 03:20:49', '2025-11-26 05:24:19', '11111111-1111-1111-1111-111111111111'),
(10, 'National HIV Curriculum', 'This module is for any health care provider who would like to establish core competence in testing for HIV, recognizing acute HIV infection, and linking persons diagnosed with HIV to medical care.', '<html><head></head><body><div id=\"content\">\n\n			<div id=\"notifications\"></div><div id=\"home-landing-image\" class=\"homepage/about\">\n<div class=\"inner\"><h1>National HIV Curriculum</h1>\n<div class=\"about site/tag-line\">The National HIV Curriculum is an AIDS Education and Training Center Program and led by the University of Washington. </div>\n			<div class=\"contributors overview\">&nbsp;</div><div class=\"funded-by\">Funded by<div class=\"source\">Health Resources and Services Administration (HRSA)</div></div></div></div>\n        \n        <div id=\"home-structure-menu\"><h1>HIV Course Modules</h1><div class=\"structure-overview\"><div class=\"inner\"><div class=\"row section section-31\"><div class=\"col-xs-12 col-sm-4 col-title\"><h2 style=\"color: rgb(37,74,112);\">Screening and Diagnosis</h2><p class=\"\">This module is for any health care provider who would like to establish core competence in testing for HIV, recognizing acute HIV infection, and linking persons diagnosed with HIV to medical care.</p><br></div><div class=\"col-xs-12 col-sm-8\">\n								<div class=\"row\"><div class=\"col-xs-6 col-ss\"><h3>Overview / Quick Reference</h3><p class=\"text-muted\">Rapidly access info about Screening and Diagnosis</p><br><hr><h3>Self-Study3rd EditionCNE/CME</h3><p class=\"text-muted\">Track your progress and receive CE credit</p></div><div class=\"col-xs-6 col-qb col-eo\"><h3>Question Bank3rd EditionCNE/CME</h3><p class=\"text-muted\">Interactive board-review style questions with CE credit</p> <hr></div></div></div></div><div class=\"row section section-32\"><div class=\"col-xs-12 col-sm-4 col-title\"><h2 style=\"color: rgb(148,128,84);\">Basic HIV Primary Care</h2><p class=\"\">The Basic HIV Primary Care module is intended for any clinician who may interact with persons who have HIV infection in a clinical setting, with an emphasis on the primary care management issues related HIV.</p><br></div><div class=\"col-xs-12 col-sm-8\">\n								<div class=\"row\"><div class=\"col-xs-6 col-ss\"><h3>Overview / Quick Reference</h3><p class=\"text-muted\">Rapidly access info about Basic HIV Primary Care</p><br><hr><h3>Self-Study3rd EditionCNE/CME</h3><p class=\"text-muted\">Track your progress and receive CE credit</p></div><div class=\"col-xs-6 col-qb col-eo\"><h3>Question Bank3rd EditionCNE/CME</h3><p class=\"text-muted\">Interactive board-review style questions with CE credit</p> <hr></div></div></div></div><div class=\"row section section-33\"><div class=\"col-xs-12 col-sm-4 col-title\"><h2 style=\"color: rgb(133,83,138);\">Antiretroviral Therapy</h2><p class=\"\">The Antiretroviral Therapy module is geared toward clinicians who provide antiretroviral therapy to persons with HIV, with an emphasis on initiating antiretroviral therapy and management of virologic failure.</p><br></div><div class=\"col-xs-12 col-sm-8\">\n								<div class=\"row\"><div class=\"col-xs-6 col-ss\"><h3>Overview / Quick Reference</h3><p class=\"text-muted\">Rapidly access info about Antiretroviral Therapy</p><br><hr><h3>Self-Study3rd EditionCNE/CME</h3><p class=\"text-muted\">Track your progress and receive CE credit</p></div><div class=\"col-xs-6 col-qb col-eo\"><h3>Question Bank3rd EditionCNE/CME</h3><p class=\"text-muted\">Interactive board-review style questions with CE credit</p> <hr></div></div></div></div><div class=\"row section section-34\"><div class=\"col-xs-12 col-sm-4 col-title\"><h2 style=\"color: rgb(59,140,84);\">Co-Occurring Conditions</h2><p class=\"\">The Co-Occurring Conditions module addresses the prevention and management of infectious and non-infectious complications in persons with HIV infection.</p><br></div><div class=\"col-xs-12 col-sm-8\">\n								<div class=\"row\"><div class=\"col-xs-6 col-ss\"><h3>Overview / Quick Reference</h3><p class=\"text-muted\">Rapidly access info about Co-Occurring Conditions</p><br><hr><h3>Self-Study3rd EditionCNE/CME</h3><p class=\"text-muted\">Track your progress and receive CE credit</p></div><div class=\"col-xs-6 col-qb col-eo\"><h3>Question Bank3rd EditionCNE/CME</h3><p class=\"text-muted\">Interactive board-review style questions with CE credit</p> <hr></div></div></div></div><div class=\"row section section-35\"><div class=\"col-xs-12 col-sm-4 col-title\"><h2 style=\"color: rgb(90,90,90);\">Prevention of HIV</h2><p class=\"\">The Prevention of HIV module emphasizes new prevention strategies both for persons with HIV infection and for persons not infected with HIV. This module also addresses occupational and nonoccupational HIV postexposure prophylaxis.</p><br></div><div class=\"col-xs-12 col-sm-8\">\n								<div class=\"row\"><div class=\"col-xs-6 col-ss\"><h3>Overview / Quick Reference</h3><p class=\"text-muted\">Rapidly access info about Prevention of HIV</p><br><hr><h3>Self-Study3rd EditionCNE/CME</h3><p class=\"text-muted\">Track your progress and receive CE credit</p></div><div class=\"col-xs-6 col-qb col-eo\"><h3>Question Bank3rd EditionCNE/CME</h3><p class=\"text-muted\">Interactive board-review style questions with CE credit</p> <hr></div></div></div></div><div class=\"row section section-36\"><div class=\"col-xs-12 col-sm-4 col-title\"><h2 style=\"color: rgb(4,140,171);\">Key Populations</h2><p class=\"\">The Key Populations module is intended for any medical provider involved in the care of key populations of persons with HIV.</p><br></div><div class=\"col-xs-12 col-sm-8\">\n								<div class=\"row\"><div class=\"col-xs-6 col-ss\"><h3>Overview / Quick Reference</h3><p class=\"text-muted\">Rapidly access info about Key Populations</p><br><hr><h3>Self-Study3rd EditionCNE/CME</h3><p class=\"text-muted\">Track your progress and receive CE credit</p></div><div class=\"col-xs-6 col-qb col-eo\"><h3>Question Bank3rd EditionCNE/CME</h3><p class=\"text-muted\">Interactive board-review style questions with CE credit</p> <hr></div></div></div></div></div></div></div><div id=\"home-page\" class=\"alternate\"><div class=\"inner\"><div class=\"page page-news\"><h2 class=\"title\">Latest Updates</h2>\n					<a class=\"button-featured clearfix target-lightbox\" href=\"/page/site/134\"><strong>3rd Edition Launched 9/1/23!</strong><br><p>Your 3rd&nbsp;Edition progress tracker will display work and CE earned in this new 3-year CE accreditation period.</p></a><a class=\"button-featured clearfix target-lightbox\" href=\"/page/site/overview\"><img src=\"//cdn.hiv.uw.edu/doc/868-1/dr-spach-editor-chief.jpg\" class=\"presentation-thumb\" alt=\"Dr Spach Editor-In-Chief\" title=\"Dr Spach Editor-In-Chief\"><strong>Site Overview Available!</strong><br>Editor-in-Chief, Dr. David Spach, highlights key aspects of this website in this 13 min talk.</a><a class=\"button-featured clearfix target-lightbox\" href=\"/page/site/groups-primer\"><img src=\"//cdn.hiv.uw.edu/doc/869-1/learning-group.jpg\" class=\"presentation-thumb\" alt=\"learning-group\" title=\"learning-group\"><strong>What are Learning Groups?</strong><br>Kent Unruh explores the Learning Groups functionality in this 9 minute video.&nbsp;</a>\n				</div>\n				<div class=\"page page-online-course\"><h2 class=\"title\">Take the Free Online Course</h2>Browse or create an account and track your progress as you work through the course. After registering, you can obtain free CME or CNE credit.<div class=\"buttons\"><a href=\"/alternate\" class=\"button-browse\">Browse the Course Modules</a>\n					<a href=\"/alternate\" onclick=\"loginShowWindow(); $(\'#username\').focus(); return false;\" class=\"button-sign-in\"><i class=\"glyph-sign-in\"></i> Sign In to Track Progress <span class=\"ce\">CME/CNE</span></a>\n					<a href=\"/page/account/register\" class=\"button-register\"> Create an Account <span class=\"ce\">CME/CNE</span></a></div><br></div></div></div>\n	</div></body></html>', 'BASICS', 'https://www.hiv.uw.edu/?fbclid=IwY2xjawOSHiJleHRuA2FlbQIxMABicmlkETFKVFVGRTBXT3N3S25JcU1Ic3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHrePPHGa4MGYQDKe96oRlXG2igI6QyJJXM89EBq3asecHUKMFTarZb_kO3lD_aem_81QyCy_G8jzszg6CGrgF8A', '3 min', '2025-11-26 03:23:44', '2025-11-26 03:23:44', '11111111-1111-1111-1111-111111111111'),
(12, 'The Basics of HIV Prevention | NIH', 'Get information on how to prevent the transmission of HIV. These steps can help protect yourself and others from HIV.', '<html><head></head><body><article class=\"node node--type-fact-sheet node--promoted node--view-mode-full clearfix\">\n  <div class=\"node__content clearfix container\">\n    <div class=\"row\">\n      <div class=\"col-12\">\n        <h1 class=\"node__main_title\">HIV Prevention</h1>\n      </div>\n    </div>\n    <div class=\"row fact-sheet-wrapper\">\n      \n      <section class=\"col-12 col-md-8 fact-sheet-body-text\">\n        <h2 class=\"fs-title\">The Basics of HIV Prevention</h2>\n        <div class=\"reviewed-date\">\n          <span>Last Reviewed: </span> April 9, 2025\n        </div>\n        \n\n\n            <div class=\"clearfix text-formatted field field--name-body field--type-text-with-summary field--label-hidden field__item\"><div class=\"field__item\"><article class=\"contextual-region node node--type-fact-sheet-qa node--view-mode-default boxed clearfix\"><h3>Key Points</h3><ul><li>Protect yourself from HIV: Use condoms correctly every time you have sex, use pre-exposure prophylaxis (PrEP) if you believe you are likely to be exposed to HIV, and avoid sharing drug injection equipment. If you are exposed to HIV and haven’t taken PrEP, consider taking post-exposure prophylaxis (PEP) within 72 hours of HIV exposure.</li><li>Protect others if you have HIV: Take HIV medicine (called antiretroviral therapy or ART) as prescribed by your doctor. When taken as prescribed, HIV medicines can eliminate nearly any risk that you will transmit HIV to your partner through sex.</li><li>Prevent perinatal transmission: If you have HIV, take or continue taking HIV medicines throughout pregnancy and childbirth. Consider using PrEP if you have a partner with HIV and plan on getting pregnant.</li></ul></article></div><h3>How is HIV transmitted?</h3><p>The person-to-person spread of human immunodeficiency virus (HIV) is called&nbsp;HIV transmission. People can get or transmit HIV only through specific activities, such as sex or injection drug use. HIV can be transmitted&nbsp;only in certain body fluids from a person who has HIV. Bodily fluids that can transmit HIV include blood, semen (“cum”), pre-seminal fluids (“pre-cum”), rectal fluids, vaginal fluids, and breast milk.</p><p>HIV transmission is only possible if these fluids come in contact with a mucous membrane, an open cut or sore, or are directly injected into the bloodstream (from a contaminated needle or syringe). Mucous membranes are found inside the rectum, the vagina, the opening of the penis, and the mouth.</p><p>In the United States, HIV is transmitted mainly by:</p><ul><li>Having anal or vaginal sex with someone who has HIV without using a&nbsp;condom&nbsp;or who is not taking medicines to prevent or treat HIV.</li><li>Sharing injection drug equipment (“works”), such as needles or syringes, with someone who has HIV.</li></ul><p>HIV can also be transmitted from mother to child during pregnancy, childbirth (also called labor and delivery), or breastfeeding. This is called&nbsp;perinatal transmission of HIV. Perinatal transmission of HIV is also called mother-to-child HIV transmission.</p><h3>How is HIV not transmitted?</h3><p>You cannot get HIV from:</p><ul><li>Casual contact with a person who has HIV, such as a handshake, a hug, or a closed-mouth kiss (“social” kissing).</li><li>Contact with objects, such as toilet seats, doorknobs, or dishes used by a person who has HIV.</li><li>Mosquitoes, ticks, or other biting insects.</li><li>Other sexual activities that do not involve the exchange of body fluids (for example, touching).</li><li>Donating blood or receiving a blood transfusion.</li></ul><p>Use the&nbsp;You Can Safely Share…With Someone With HIV&nbsp;infographic from HIVinfo to spread this message.</p><h3>How can I reduce the chances of getting HIV?</h3><p>Anyone can get HIV, but you can take steps to protect yourself from HIV.</p><ul><li>Get tested for HIV.&nbsp;Talk to your partner about HIV testing and get tested before you have sex. Use the GetTested locator from the Centers for Disease Control and Prevention (CDC)&nbsp;to find an HIV testing location near you.</li><li>Choose safer sexual behaviors.&nbsp;HIV is mainly transmitted by having anal or vaginal sex without a condom or without taking medicines to prevent or treat HIV.</li><li>Use condoms correctly&nbsp;every time you have sex.&nbsp;Read this fact sheet from CDC on&nbsp;condom use.</li><li>Limit your number of sexual partners.&nbsp;The more partners you have, the more likely you are to have a partner with poorly controlled HIV or to have a partner with a&nbsp;sexually transmitted infection (STI). Both factors can increase the risk of HIV transmission.</li><li>Get tested and treated for STIs.&nbsp;Ask your partners to get tested and treated, too. Having an STI can increase your risk of getting HIV or transmitting it to others.</li><li>Talk to your health care provider about pre-exposure prophylaxis (PrEP).&nbsp;PrEP is an HIV prevention option if you do not have HIV but are at an increased risk of getting HIV (for example, if your partner has HIV or if you inject drugs). For more information, read the HIVinfo fact sheet on Pre-Exposure Prophylaxis (PrEP).</li><li>Do not inject drugs.&nbsp;But if you do, use only sterile drug injection equipment and water, and never share your equipment with others.</li></ul><h3>If I have HIV, how can I prevent passing it to others?</h3><p>Take HIV medicines as directed by your doctor. Treatment with HIV medicines (called&nbsp;antiretroviral therapy or ART) helps people with HIV live long, healthy lives. ART cannot cure HIV, but it can reduce the amount of HIV in the body (called the&nbsp;viral load). One of the main goals of ART is to reduce a person\'s viral load to an undetectable level.</p><p>An&nbsp;undetectable viral load&nbsp;means that the level of HIV in the blood is too low to be detected by a viral load test. People with HIV who maintain an undetectable viral load by taking ART consistently as prescribed have no risk of transmitting HIV to sexual partners.</p><p>It is important to remember that taking HIV medicines does not prevent transmission of other STIs.</p><p>In addition to maintaining an undetectable viral load, here are some other steps you can take to make sure you prevent HIV transmission to others:</p><ul><li>Use condoms correctly every time you have sex.</li><li>Talk to your partner about taking PrEP.</li><li>If you inject drugs, do not share your needles, syringes, or other drug equipment with other people.</li></ul><h3>Are HIV medicines used at other times to prevent HIV transmission?</h3><p>Yes, in addition to ART and HIV PrEP, HIV medicines are also used for post-exposure prophylaxis (PEP) and to prevent perinatal transmission of HIV.</p><ul><li>Post-exposure prophylaxis (PEP)&nbsp;PEP refers to taking a short course (28 days) of HIV medicines within 72 hours after a possible exposure to HIV to prevent HIV infection. PEP should be used only in emergency situations and it is not meant for regular use by people who may be exposed to HIV frequently. For more information, read the HIVinfo fact sheet on&nbsp;Post-Exposure Prophylaxis (PEP).</li><li>Prevention of perinatal transmission of HIV&nbsp;Pregnant women with HIV take HIV medicines for their own health and to prevent perinatal transmission of HIV. After birth, babies receive HIV medicine to protect them from infection with any HIV that may have passed from mother to child during childbirth. For more information, read the HIVinfo fact sheet on&nbsp;Preventing Perinatal Transmission of HIV.</li></ul><hr><p>This fact sheet is based on information from the following sources:</p><p>From CDC:</p><ul><li>HIV Prevention</li><li>Preventing HIV with PrEP</li><li>Preventing HIV with PEP</li></ul><p>From the HIV Clinical Practice Guidelines at Clinicalinfo.HIV.gov:</p><ul><li>Recommendations for the Use of Antiretroviral Drugs During Pregnancy and Interventions to Reduce Perinatal HIV Transmission in the United States:Antepartum Care for Individuals With HIV:&nbsp;OverviewManagement of Infants Born to People with HIV Infection:&nbsp;Antiretroviral Management of Infants With In Utero, Intrapartum, or Breastfeeding Exposure to HIV</li></ul><p>Also see the&nbsp;HIV Source&nbsp;collection of HIV links and resources.</p></div>\n      \n      </section>\n    </div>\n  </div>\n</article></body></html>', 'BASICS', 'https://hivinfo.nih.gov/understanding-hiv/fact-sheets/basics-hiv-prevention?fbclid=IwY2xjawOSHidleHRuA2FlbQIxMABicmlkETFKVFVGRTBXT3N3S25JcU1Ic3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHrePPHGa4MGYQDKe96oRlXG2igI6QyJJXM89EBq3asecHUKMFTarZb_kO3lD_aem_81QyCy_G8', '6 min', '2025-11-26 03:26:10', '2025-11-26 03:26:10', '11111111-1111-1111-1111-111111111111');

-- --------------------------------------------------------

--
-- Table structure for table `medications`
--

CREATE TABLE `medications` (
  `medication_id` char(36) NOT NULL,
  `medication_name` varchar(150) NOT NULL,
  `generic_name` varchar(150) DEFAULT NULL,
  `form` enum('tablet','capsule','syrup','injection','cream','other') NOT NULL,
  `strength` varchar(50) DEFAULT NULL,
  `atc_code` varchar(10) DEFAULT NULL,
  `is_art` tinyint(1) DEFAULT 0,
  `is_controlled` tinyint(1) DEFAULT 0,
  `active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medications`
--

INSERT INTO `medications` (`medication_id`, `medication_name`, `generic_name`, `form`, `strength`, `atc_code`, `is_art`, `is_controlled`, `active`) VALUES
('med-0001-0000-0000-000000000001', 'Tenofovir/Lamivudine/Dolutegravir (TLD)', 'TLD', 'tablet', '300/300/50mg', 'J05AR20', 1, 1, 1),
('med-0002-0000-0000-000000000002', 'Efavirenz 600mg', 'Efavirenz', 'tablet', '600mg', 'J05AG03', 1, 1, 1),
('med-0003-0000-0000-000000000003', 'Atazanavir/Ritonavir', 'ATV/r', 'capsule', '300/100mg', 'J05AE08', 1, 1, 1),
('med-0004-0000-0000-000000000004', 'Abacavir/Lamivudine', 'ABC/3TC', 'tablet', '600/300mg', 'J05AR06', 1, 1, 1),
('med-0005-0000-0000-000000000005', 'Paracetamol 500mg', 'Acetaminophen', 'tablet', '500mg', 'N02BE01', 0, 0, 1),
('med-0006-0000-0000-000000000006', 'Amoxicillin 500mg', 'Amoxicillin', 'capsule', '500mg', 'J01CA04', 0, 0, 1),
('med-0007-0000-0000-000000000007', 'Metformin 500mg', 'Metformin', 'tablet', '500mg', 'A10BA02', 0, 0, 1),
('med-0008-0000-0000-000000000008', 'Ibuprofen 400mg', 'Ibuprofen', 'tablet', '400mg', 'M01AE01', 0, 0, 1),
('med-0009-0000-0000-000000000009', 'Lopinavir/Ritonavir', 'LPV/r', 'tablet', '200/50mg', 'J05AE10', 1, 1, 1),
('med-0010-0000-0000-000000000010', 'Raltegravir 400mg', 'Raltegravir', 'tablet', '400mg', 'J05AJ01', 1, 1, 1),
('med-0011-0000-0000-000000000011', 'Dolutegravir 50mg', 'Dolutegravir', 'tablet', '50mg', 'J05AJ02', 1, 1, 1),
('med-0012-0000-0000-000000000012', 'Zidovudine/Lamivudine', 'AZT/3TC', 'tablet', '300/150mg', 'J05AR01', 1, 1, 1),
('med-0013-0000-0000-000000000013', 'Cotrimoxazole 480mg', 'Trimethoprim/Sulfamethoxazole', 'tablet', '480mg', 'J01EE01', 0, 0, 1),
('med-0014-0000-0000-000000000014', 'Fluconazole 150mg', 'Fluconazole', 'capsule', '150mg', 'J02AC01', 0, 0, 1),
('med-0015-0000-0000-000000000015', 'Isoniazid 300mg', 'Isoniazid', 'tablet', '300mg', 'J04AC01', 0, 0, 1);

-- --------------------------------------------------------

--
-- Table structure for table `medication_adherence`
--

CREATE TABLE `medication_adherence` (
  `adherence_id` char(36) NOT NULL,
  `prescription_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `adherence_date` date DEFAULT curdate(),
  `taken` tinyint(1) DEFAULT 0,
  `missed_reason` text DEFAULT NULL,
  `adherence_percentage` decimal(5,2) DEFAULT NULL,
  `recorded_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medication_adherence`
--

INSERT INTO `medication_adherence` (`adherence_id`, `prescription_id`, `patient_id`, `adherence_date`, `taken`, `missed_reason`, `adherence_percentage`, `recorded_at`) VALUES
('ma-0001-0000-0000-000000000001', 'rx-0001-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2025-11-22', 1, NULL, 95.00, '2025-11-22 09:30:00'),
('ma-0002-0000-0000-000000000002', 'rx-0001-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2025-11-23', 1, NULL, 95.00, '2025-11-23 09:30:00'),
('ma-0003-0000-0000-000000000003', 'rx-0001-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2025-11-24', 0, 'Forgot to take medication', 93.33, '2025-11-24 10:00:00'),
('ma-0004-0000-0000-000000000004', 'rx-0001-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2025-11-25', 1, NULL, 94.00, '2025-11-25 09:30:00'),
('ma-0005-0000-0000-000000000005', 'rx-0001-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2025-11-26', 1, NULL, 94.50, '2025-11-26 09:30:00'),
('ma-0006-0000-0000-000000000006', 'rx-0001-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2025-11-27', 0, 'Ran out of medication', 92.86, '2025-11-27 10:00:00'),
('ma-0007-0000-0000-000000000007', 'rx-0001-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2025-11-28', 1, NULL, 93.33, '2025-11-28 09:30:00'),
('ma-0008-0000-0000-000000000008', 'rx-0003-0000-0000-000000000003', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '2025-11-23', 1, NULL, 100.00, '2025-11-23 20:30:00'),
('ma-0009-0000-0000-000000000009', 'rx-0003-0000-0000-000000000003', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '2025-11-24', 1, NULL, 100.00, '2025-11-24 20:30:00'),
('ma-0010-0000-0000-000000000010', 'rx-0003-0000-0000-000000000003', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '2025-11-25', 1, NULL, 100.00, '2025-11-25 20:30:00'),
('ma-0011-0000-0000-000000000011', 'rx-0003-0000-0000-000000000003', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '2025-11-26', 1, NULL, 100.00, '2025-11-26 20:30:00'),
('ma-0012-0000-0000-000000000012', 'rx-0003-0000-0000-000000000003', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '2025-11-27', 1, NULL, 100.00, '2025-11-27 20:30:00'),
('ma-0013-0000-0000-000000000013', 'rx-0003-0000-0000-000000000003', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '2025-11-28', 0, 'Forgot to take', 98.33, '2025-11-28 21:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `medication_inventory`
--

CREATE TABLE `medication_inventory` (
  `inventory_id` char(36) NOT NULL,
  `medication_id` char(36) NOT NULL,
  `facility_id` char(36) NOT NULL,
  `batch_number` varchar(50) DEFAULT NULL,
  `quantity_on_hand` int(11) NOT NULL DEFAULT 0,
  `unit` varchar(20) DEFAULT 'tablets',
  `expiry_date` date DEFAULT NULL,
  `reorder_level` int(11) DEFAULT 0,
  `last_restocked` date DEFAULT NULL,
  `supplier` varchar(200) DEFAULT NULL,
  `cost_per_unit` decimal(10,2) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medication_inventory`
--

INSERT INTO `medication_inventory` (`inventory_id`, `medication_id`, `facility_id`, `batch_number`, `quantity_on_hand`, `unit`, `expiry_date`, `reorder_level`, `last_restocked`, `supplier`, `cost_per_unit`, `created_at`) VALUES
('inv-0001-0000-0000-000000000001', 'med-0001-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 'TLD-2025-001', 500, 'tablets', '2027-12-31', 100, '2025-11-15', 'MyHubCares Pharmacy', 15.50, '2025-11-15 10:00:00'),
('inv-0002-0000-0000-000000000002', 'med-0002-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440000', 'EFV-2025-001', 300, 'tablets', '2027-11-30', 50, '2025-11-16', 'MyHubCares Pharmacy', 12.00, '2025-11-16 10:00:00'),
('inv-0003-0000-0000-000000000003', 'med-0003-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440000', 'ATV-2025-001', 200, 'capsules', '2027-10-15', 50, '2025-11-10', 'MyHubCares Pharmacy', 18.75, '2025-11-10 10:00:00'),
('inv-0004-0000-0000-000000000004', 'med-0005-0000-0000-000000000005', '550e8400-e29b-41d4-a716-446655440000', 'PAR-2025-001', 1000, 'tablets', '2026-06-30', 200, '2025-11-20', 'MyHubCares Pharmacy', 2.50, '2025-11-20 10:00:00'),
('inv-0005-0000-0000-000000000005', 'med-0006-0000-0000-000000000006', '550e8400-e29b-41d4-a716-446655440000', 'AMX-2025-001', 737, 'capsules', '2026-08-31', 150, '2025-11-18', 'MyHubCares Pharmacy', 3.25, '2025-11-18 10:00:00'),
('inv-0006-0000-0000-000000000006', 'med-0007-0000-0000-000000000007', '550e8400-e29b-41d4-a716-446655440000', 'MET-2025-001', 600, 'tablets', '2026-09-30', 100, '2025-11-12', 'MyHubCares Pharmacy', 1.75, '2025-11-12 10:00:00'),
('inv-0007-0000-0000-000000000007', 'med-0008-0000-0000-000000000008', '550e8400-e29b-41d4-a716-446655440000', 'IBU-2025-001', 400, 'tablets', '2026-07-31', 80, '2025-11-14', 'MyHubCares Pharmacy', 2.00, '2025-11-14 10:00:00'),
('inv-0008-0000-0000-000000000008', 'med-0004-0000-0000-000000000004', '550e8400-e29b-41d4-a716-446655440000', 'ABC-2025-001', 350, 'tablets', '2027-11-30', 70, '2025-11-16', 'MyHubCares Pharmacy', 14.00, '2025-11-16 10:00:00'),
('inv-0010-0000-0000-000000000010', 'med-0009-0000-0000-000000000009', '550e8400-e29b-41d4-a716-446655440000', 'LPV-20250101-001', 180, 'tablets', '2027-06-02', 40, '2025-11-21', 'MyHubCares Pharmacy', 25.50, '2025-11-29 10:16:18'),
('inv-0011-0000-0000-000000000011', 'med-0010-0000-0000-000000000010', '550e8400-e29b-41d4-a716-446655440000', 'RAL-20250101-001', 150, 'tablets', '2027-04-13', 30, '2025-11-17', 'MyHubCares Pharmacy', 30.00, '2025-11-29 10:16:18');

-- --------------------------------------------------------

--
-- Table structure for table `medication_reminders`
--

CREATE TABLE `medication_reminders` (
  `reminder_id` char(36) NOT NULL,
  `prescription_id` char(36) DEFAULT NULL,
  `patient_id` char(36) NOT NULL,
  `medication_name` varchar(150) NOT NULL,
  `dosage` varchar(50) NOT NULL,
  `frequency` varchar(50) NOT NULL,
  `reminder_time` time NOT NULL,
  `sound_preference` enum('default','gentle','urgent') DEFAULT 'default',
  `browser_notifications` tinyint(1) DEFAULT 1,
  `special_instructions` text DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1,
  `missed_doses` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_triggered_at` datetime DEFAULT NULL COMMENT 'Last time this reminder was triggered',
  `last_acknowledged_at` datetime DEFAULT NULL COMMENT 'Last time patient acknowledged reminder',
  `acknowledgment_count` int(11) DEFAULT 0 COMMENT 'Total number of times patient acknowledged'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medication_reminders`
--

INSERT INTO `medication_reminders` (`reminder_id`, `prescription_id`, `patient_id`, `medication_name`, `dosage`, `frequency`, `reminder_time`, `sound_preference`, `browser_notifications`, `special_instructions`, `active`, `missed_doses`, `created_at`, `updated_at`, `last_triggered_at`, `last_acknowledged_at`, `acknowledgment_count`) VALUES
('21426620-8784-42d0-b4c3-424f0627db7c', 'be164d40-8c7e-49c8-9682-49bc54ccbdb5', '9380eb9a-4d99-43dc-a1db-364a4067c39a', 'Amoxicillin 500mg', '1 capsule', 'Three times daily', '09:00:00', 'default', 1, NULL, 1, 0, '2025-11-29 10:00:36', '2025-11-29 10:00:36', NULL, NULL, 0),
('mr-0001-0000-0000-000000000001', 'rx-0001-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Tenofovir/Lamivudine/Dolutegravir (TLD)', '1 tablet', 'Once daily', '09:00:00', 'default', 1, 'Take with breakfast. Do not skip.', 1, 2, '2025-11-20 10:00:00', '2025-11-28 09:00:00', '2025-11-28 09:00:00', '2025-11-28 09:15:00', 25),
('mr-0002-0000-0000-000000000002', 'rx-0002-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Amoxicillin 500mg', '1 capsule', 'Three times daily', '08:00:00', 'gentle', 1, 'Take with meals: breakfast, lunch, dinner.', 1, 0, '2025-11-25 11:00:00', '2025-11-28 08:00:00', '2025-11-28 08:00:00', '2025-11-28 08:05:00', 12),
('mr-0003-0000-0000-000000000003', 'rx-0003-0000-0000-000000000003', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', 'Tenofovir/Lamivudine/Dolutegravir (TLD)', '1 tablet', 'Once daily', '20:00:00', 'urgent', 1, 'Take with dinner. Critical medication - do not miss!', 1, 1, '2025-11-22 12:00:00', '2025-11-28 20:00:00', '2025-11-28 20:00:00', '2025-11-28 20:10:00', 6),
('mr-0004-0000-0000-000000000004', 'rx-0004-0000-0000-000000000004', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', 'Paracetamol 500mg', '1 tablet', 'As needed', '12:00:00', 'default', 1, 'Take only when experiencing pain or fever.', 1, 0, '2025-11-28 15:00:00', '2025-11-28 15:00:00', NULL, NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `message_id` char(36) NOT NULL,
  `thread_id` char(36) NOT NULL,
  `sender_id` char(36) NOT NULL,
  `recipient_id` char(36) DEFAULT NULL,
  `content` text NOT NULL,
  `sent_at` datetime DEFAULT current_timestamp(),
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `message_threads`
--

CREATE TABLE `message_threads` (
  `thread_id` char(36) NOT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `created_by` char(36) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `mfa_tokens`
--

CREATE TABLE `mfa_tokens` (
  `mfa_token_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `method` enum('totp','sms','email') NOT NULL,
  `secret` varchar(255) DEFAULT NULL,
  `phone_number` varchar(30) DEFAULT NULL,
  `code_hash` varchar(255) DEFAULT NULL,
  `issued_at` datetime DEFAULT current_timestamp(),
  `expires_at` datetime NOT NULL,
  `consumed_at` datetime DEFAULT NULL,
  `attempts` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` char(36) NOT NULL,
  `recipient_id` char(36) NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `type` enum('system','reminder','alert','appointment','lab','custom') DEFAULT 'system',
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notification_id`, `recipient_id`, `title`, `message`, `type`, `is_read`, `read_at`, `created_at`) VALUES
('5d793821-bd66-4756-9000-797ccc89873c', '44444444-4444-4444-4444-444444444444', 'New Appointment Request', 'Hanna Sarabia has requested an appointment for 11/30/2025 at 09:00:00', 'appointment', 0, NULL, '2025-11-29 12:51:42');

-- --------------------------------------------------------

--
-- Table structure for table `patients`
--

CREATE TABLE `patients` (
  `patient_id` char(36) NOT NULL,
  `uic` varchar(30) NOT NULL,
  `philhealth_no` varchar(20) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) NOT NULL,
  `suffix` varchar(10) DEFAULT NULL,
  `birth_date` date NOT NULL,
  `sex` enum('M','F','O') NOT NULL,
  `civil_status` enum('Single','Married','Divorced','Widowed','Separated') DEFAULT NULL,
  `nationality` varchar(50) DEFAULT 'Filipino',
  `current_city` varchar(100) DEFAULT NULL,
  `current_province` varchar(100) DEFAULT NULL,
  `current_address` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`current_address`)),
  `contact_phone` varchar(30) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `mother_name` varchar(200) DEFAULT NULL,
  `father_name` varchar(200) DEFAULT NULL,
  `birth_order` int(11) DEFAULT NULL,
  `guardian_name` varchar(200) DEFAULT NULL,
  `guardian_relationship` varchar(50) DEFAULT NULL,
  `facility_id` char(36) NOT NULL,
  `arpa_risk_score` decimal(5,2) DEFAULT NULL,
  `arpa_last_calculated` date DEFAULT NULL,
  `status` enum('active','inactive','deceased','transferred') DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp(),
  `created_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `patients`
--

INSERT INTO `patients` (`patient_id`, `uic`, `philhealth_no`, `first_name`, `middle_name`, `last_name`, `suffix`, `birth_date`, `sex`, `civil_status`, `nationality`, `current_city`, `current_province`, `current_address`, `contact_phone`, `email`, `mother_name`, `father_name`, `birth_order`, `guardian_name`, `guardian_relationship`, `facility_id`, `arpa_risk_score`, `arpa_last_calculated`, `status`, `created_at`, `updated_at`, `created_by`) VALUES
('80f7668b-3d92-42d0-a75c-eb4873fcc8c4', 'EDDE0106-01-2004', NULL, 'Hanna', 'Narzoles', 'Sarabia', NULL, '2004-05-31', 'F', 'Single', 'Filipino', 'Caloocan', 'Metro Manila', '{}', '0966-312-2562', 'sarabia.hanna.bsinfotech@gmail.com', 'Edita Narzoles Sarabia', 'Delfin Mirano Sarabia', 1, NULL, NULL, '550e8400-e29b-41d4-a716-446655440000', NULL, NULL, 'active', '2025-11-17 16:07:51', '2025-11-28 01:19:37', '16bec9d0-6123-4428-b9a3-fea81c3592a0'),
('9380eb9a-4d99-43dc-a1db-364a4067c39a', 'MAJO0108-14-2001', '12-345678901-2', 'RAFAEL', 'SANTOS', 'DELA CRUZ', NULL, '2001-08-14', 'M', 'Single', 'Filipino', 'QUEZON CITY', 'METRO MANILA', '{\"city\":\"QUEZON CITY\",\"province\":\"METRO MANILA\"}', '0917-452-8391', 'rafael.delacruz@example.com', 'MARIA ELENA SANTOS', 'JOSE ANTONIO DELA CRUZ', 1, NULL, NULL, '550e8400-e29b-41d4-a716-446655440000', NULL, NULL, 'active', '2025-11-29 08:15:50', '2025-11-29 08:15:50', 'b656634b-477f-4aaa-817d-e0a77f75d88c'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'MARJOS01-15-1990', 'PH123456789', 'Jose', 'Maria', 'Reyes', NULL, '1990-01-15', 'M', 'Single', 'Filipino', 'Manila', 'Metro Manila', '{\"street\": \"456 Patient Ave\", \"barangay\": \"Barangay 1\", \"city\": \"Manila\", \"province\": \"Metro Manila\", \"zip_code\": \"1001\"}', '+63-912-345-6794', 'patient@myhubcares.com', 'Maria Reyes', 'Jose Reyes Sr.', 1, NULL, NULL, '550e8400-e29b-41d4-a716-446655440000', 25.50, '2025-01-15', 'active', '2025-11-16 12:16:23', '2025-11-16 12:16:23', '11111111-1111-1111-1111-111111111111');

-- --------------------------------------------------------

--
-- Table structure for table `patient_art_history`
--

CREATE TABLE `patient_art_history` (
  `history_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `regimen_id` char(36) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `reason_for_change` text DEFAULT NULL,
  `outcome` enum('ongoing','completed','discontinued','transferred_out','died') DEFAULT 'ongoing',
  `recorded_by` char(36) DEFAULT NULL,
  `recorded_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `patient_art_regimens`
--

CREATE TABLE `patient_art_regimens` (
  `regimen_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `provider_id` char(36) NOT NULL,
  `facility_id` char(36) NOT NULL,
  `start_date` date NOT NULL,
  `stop_date` date DEFAULT NULL,
  `status` enum('active','stopped','changed') DEFAULT 'active',
  `stop_reason` text DEFAULT NULL,
  `change_reason` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `patient_art_regimens`
--

INSERT INTO `patient_art_regimens` (`regimen_id`, `patient_id`, `provider_id`, `facility_id`, `start_date`, `stop_date`, `status`, `stop_reason`, `change_reason`, `notes`, `created_at`, `updated_at`) VALUES
('3828eed0-44fb-4beb-95e1-0b272082eb50', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '11111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440000', '2025-11-24', NULL, 'active', NULL, NULL, NULL, '2025-11-24 13:34:20', '2025-11-24 13:34:20');

-- --------------------------------------------------------

--
-- Table structure for table `patient_documents`
--

CREATE TABLE `patient_documents` (
  `document_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `document_type` enum('consent','id_copy','medical_record','lab_result','other') NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `uploaded_at` datetime DEFAULT current_timestamp(),
  `uploaded_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `patient_identifiers`
--

CREATE TABLE `patient_identifiers` (
  `identifier_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `id_type` enum('passport','driver_license','sss','tin','other') NOT NULL,
  `id_value` varchar(100) NOT NULL,
  `issued_at` date DEFAULT NULL,
  `expires_at` date DEFAULT NULL,
  `verified` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `patient_identifiers`
--

INSERT INTO `patient_identifiers` (`identifier_id`, `patient_id`, `id_type`, `id_value`, `issued_at`, `expires_at`, `verified`) VALUES
('869b1376-811f-4e7b-99e4-4d603754a3a2', '9380eb9a-4d99-43dc-a1db-364a4067c39a', 'driver_license', 'D12-34-567890', '2020-07-18', '2025-07-18', 1),
('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'sss', '34-1234567-8', '2010-01-15', NULL, 1),
('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiij', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'tin', '123-456-789-000', '2012-05-20', NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `patient_risk_scores`
--

CREATE TABLE `patient_risk_scores` (
  `risk_score_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `score` decimal(5,2) NOT NULL,
  `calculated_on` date DEFAULT curdate(),
  `risk_factors` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`risk_factors`)),
  `recommendations` text DEFAULT NULL,
  `calculated_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `patient_risk_scores`
--

INSERT INTO `patient_risk_scores` (`risk_score_id`, `patient_id`, `score`, `calculated_on`, `risk_factors`, `recommendations`, `calculated_by`) VALUES
('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrr', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 25.50, '2025-01-15', '{\"age\": 35, \"adherence_rate\": 85, \"cd4_count\": 450, \"viral_load\": 200, \"comorbidities\": [\"hypertension\"]}', 'Continue current ART regimen. Monitor blood pressure regularly. Schedule follow-up in 3 months.', '22222222-2222-2222-2222-222222222222'),
('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrs', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 23.75, '2024-12-15', '{\"age\": 35, \"adherence_rate\": 88, \"cd4_count\": 420, \"viral_load\": 150, \"comorbidities\": [\"hypertension\"]}', 'Good adherence. Continue monitoring.', '22222222-2222-2222-2222-222222222222');

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `permission_id` char(36) NOT NULL,
  `permission_code` varchar(100) NOT NULL,
  `permission_name` varchar(150) NOT NULL,
  `module` varchar(50) NOT NULL,
  `action` varchar(50) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`permission_id`, `permission_code`, `permission_name`, `module`, `action`, `description`) VALUES
('perm-0000-0000-0000-000000000001', 'patient.create', 'Create Patient', 'Patients', 'create', 'Create new patient records'),
('perm-0000-0000-0000-000000000002', 'patient.read', 'View Patient', 'Patients', 'read', 'View patient records and information'),
('perm-0000-0000-0000-000000000003', 'patient.update', 'Update Patient', 'Patients', 'update', 'Update patient records and information'),
('perm-0000-0000-0000-000000000004', 'patient.delete', 'Delete Patient', 'Patients', 'delete', 'Delete patient records'),
('perm-0000-0000-0000-000000000005', 'user.create', 'Create User', 'Users', 'create', 'Create new user accounts'),
('perm-0000-0000-0000-000000000006', 'user.read', 'View User', 'Users', 'read', 'View user accounts and information'),
('perm-0000-0000-0000-000000000007', 'user.update', 'Update User', 'Users', 'update', 'Update user accounts and information'),
('perm-0000-0000-0000-000000000008', 'user.delete', 'Delete User', 'Users', 'delete', 'Delete user accounts'),
('perm-0000-0000-0000-000000000009', 'clinical_visit.create', 'Create Clinical Visit', 'Clinical Visits', 'create', 'Create new clinical visit records'),
('perm-0000-0000-0000-000000000010', 'clinical_visit.read', 'View Clinical Visit', 'Clinical Visits', 'read', 'View clinical visit records'),
('perm-0000-0000-0000-000000000011', 'clinical_visit.update', 'Update Clinical Visit', 'Clinical Visits', 'update', 'Update clinical visit records'),
('perm-0000-0000-0000-000000000012', 'clinical_visit.delete', 'Delete Clinical Visit', 'Clinical Visits', 'delete', 'Delete clinical visit records'),
('perm-0000-0000-0000-000000000013', 'prescription.create', 'Create Prescription', 'Prescriptions', 'create', 'Create new prescriptions'),
('perm-0000-0000-0000-000000000014', 'prescription.read', 'View Prescription', 'Prescriptions', 'read', 'View prescription records'),
('perm-0000-0000-0000-000000000015', 'prescription.update', 'Update Prescription', 'Prescriptions', 'update', 'Update prescription records'),
('perm-0000-0000-0000-000000000016', 'prescription.delete', 'Delete Prescription', 'Prescriptions', 'delete', 'Delete prescription records'),
('perm-0000-0000-0000-000000000017', 'appointment.create', 'Create Appointment', 'Appointments', 'create', 'Create new appointments'),
('perm-0000-0000-0000-000000000018', 'appointment.read', 'View Appointment', 'Appointments', 'read', 'View appointment records'),
('perm-0000-0000-0000-000000000019', 'appointment.update', 'Update Appointment', 'Appointments', 'update', 'Update appointment records'),
('perm-0000-0000-0000-000000000020', 'appointment.delete', 'Delete Appointment', 'Appointments', 'delete', 'Delete appointment records'),
('perm-0000-0000-0000-000000000021', 'lab_test.create', 'Create Lab Test', 'Lab Tests', 'create', 'Create new lab test records'),
('perm-0000-0000-0000-000000000022', 'lab_test.read', 'View Lab Test', 'Lab Tests', 'read', 'View lab test records'),
('perm-0000-0000-0000-000000000023', 'lab_test.update', 'Update Lab Test', 'Lab Tests', 'update', 'Update lab test records'),
('perm-0000-0000-0000-000000000024', 'lab_test.delete', 'Delete Lab Test', 'Lab Tests', 'delete', 'Delete lab test records'),
('perm-0000-0000-0000-000000000025', 'inventory.create', 'Create Inventory', 'Inventory', 'create', 'Create new inventory items'),
('perm-0000-0000-0000-000000000026', 'inventory.read', 'View Inventory', 'Inventory', 'read', 'View inventory records'),
('perm-0000-0000-0000-000000000027', 'inventory.update', 'Update Inventory', 'Inventory', 'update', 'Update inventory records'),
('perm-0000-0000-0000-000000000028', 'inventory.delete', 'Delete Inventory', 'Inventory', 'delete', 'Delete inventory records'),
('perm-0000-0000-0000-000000000029', 'facility.create', 'Create Facility', 'Facilities', 'create', 'Create new facilities'),
('perm-0000-0000-0000-000000000030', 'facility.read', 'View Facility', 'Facilities', 'read', 'View facility records'),
('perm-0000-0000-0000-000000000031', 'facility.update', 'Update Facility', 'Facilities', 'update', 'Update facility records'),
('perm-0000-0000-0000-000000000032', 'facility.delete', 'Delete Facility', 'Facilities', 'delete', 'Delete facility records'),
('perm-0000-0000-0000-000000000033', 'role.create', 'Create Role', 'Roles', 'create', 'Create new roles'),
('perm-0000-0000-0000-000000000034', 'role.read', 'View Role', 'Roles', 'read', 'View role records'),
('perm-0000-0000-0000-000000000035', 'role.update', 'Update Role', 'Roles', 'update', 'Update role records'),
('perm-0000-0000-0000-000000000036', 'role.delete', 'Delete Role', 'Roles', 'delete', 'Delete role records'),
('perm-0000-0000-0000-000000000037', 'permission.manage', 'Manage Permissions', 'Permissions', 'manage', 'Manage permissions and role assignments'),
('perm-0000-0000-0000-000000000038', 'report.view', 'View Reports', 'Reports', 'read', 'View system reports and analytics'),
('perm-0000-0000-0000-000000000039', 'report.export', 'Export Reports', 'Reports', 'export', 'Export reports and data');

-- --------------------------------------------------------

--
-- Table structure for table `prescriptions`
--

CREATE TABLE `prescriptions` (
  `prescription_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `prescriber_id` char(36) NOT NULL,
  `facility_id` char(36) NOT NULL,
  `prescription_date` date DEFAULT curdate(),
  `prescription_number` varchar(50) DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `duration_days` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('active','completed','cancelled','expired') DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `prescriptions`
--

INSERT INTO `prescriptions` (`prescription_id`, `patient_id`, `prescriber_id`, `facility_id`, `prescription_date`, `prescription_number`, `start_date`, `end_date`, `duration_days`, `notes`, `status`, `created_at`) VALUES
('be164d40-8c7e-49c8-9682-49bc54ccbdb5', '9380eb9a-4d99-43dc-a1db-364a4067c39a', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-11-29', 'RX-20251129-0001', '2025-11-29', '2025-12-05', NULL, 'Patient advised about possible side effects such as mild stomach upset. Instructed to return if symptoms worsen or no improvement after 3 days.', 'active', '2025-11-29 09:59:09'),
('rx-0001-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-11-20', 'RX-20251120-0001', '2025-11-20', '2026-11-20', 365, 'Long-term ART regimen. Monitor for side effects.', 'active', '2025-11-20 09:00:00'),
('rx-0002-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-11-25', 'RX-20251125-0001', '2025-11-25', '2025-12-25', 30, 'Short-term medication for infection.', 'active', '2025-11-25 10:00:00'),
('rx-0003-0000-0000-000000000003', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-11-22', 'RX-20251122-0001', '2025-11-22', '2026-11-22', 365, 'ART initiation. Follow-up in 2 weeks.', 'active', '2025-11-22 11:00:00'),
('rx-0004-0000-0000-000000000004', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '550e8400-e29b-41d4-a716-446655440000', '2025-11-28', 'RX-20251128-0001', '2025-11-28', '2025-12-28', 30, 'Pain management medication.', 'active', '2025-11-28 14:00:00'),
('rx-0005-0000-0000-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-10-15', 'RX-20251015-0001', '2025-10-15', '2025-11-15', 30, 'Completed course of antibiotics.', 'completed', '2025-10-15 09:00:00'),
('rx-0006-0000-0000-000000000006', '9380eb9a-4d99-43dc-a1db-364a4067c39a', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-11-10', 'RX-20251110-0001', '2025-11-10', '2025-12-10', 30, 'New patient prescription.', 'active', '2025-11-10 10:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `prescription_items`
--

CREATE TABLE `prescription_items` (
  `prescription_item_id` char(36) NOT NULL,
  `prescription_id` char(36) NOT NULL,
  `medication_id` char(36) NOT NULL,
  `dosage` varchar(50) NOT NULL,
  `frequency` varchar(50) NOT NULL,
  `quantity` int(11) NOT NULL,
  `instructions` text DEFAULT NULL,
  `duration_days` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `prescription_items`
--

INSERT INTO `prescription_items` (`prescription_item_id`, `prescription_id`, `medication_id`, `dosage`, `frequency`, `quantity`, `instructions`, `duration_days`) VALUES
('88d8ee78-b4d9-4437-8774-0c4e66e61e29', 'be164d40-8c7e-49c8-9682-49bc54ccbdb5', 'med-0006-0000-0000-000000000006', '1 capsule', 'Three times daily', 21, 'Take one capsule every 8 hours after meals. Complete the full 7-day course even if symptoms improve.', 6),
('pi-0001-0000-0000-000000000001', 'rx-0001-0000-0000-000000000001', 'med-0001-0000-0000-000000000001', '1 tablet', 'Once daily', 365, 'Take with food. Do not skip doses.', 365),
('pi-0002-0000-0000-000000000002', 'rx-0002-0000-0000-000000000002', 'med-0006-0000-0000-000000000006', '1 capsule', 'Three times daily', 90, 'Take with meals to reduce stomach upset.', 30),
('pi-0003-0000-0000-000000000003', 'rx-0003-0000-0000-000000000003', 'med-0001-0000-0000-000000000001', '1 tablet', 'Once daily', 365, 'Take with food. Important: Do not miss doses.', 365),
('pi-0004-0000-0000-000000000004', 'rx-0004-0000-0000-000000000004', 'med-0005-0000-0000-000000000005', '1 tablet', 'As needed (max 4 per day)', 30, 'Take for pain or fever. Do not exceed 4 tablets per day.', 30),
('pi-0005-0000-0000-000000000005', 'rx-0005-0000-0000-000000000005', 'med-0006-0000-0000-000000000006', '1 capsule', 'Three times daily', 90, 'Complete full course even if feeling better.', 30),
('pi-0006-0000-0000-000000000006', 'rx-0006-0000-0000-000000000006', 'med-0008-0000-0000-000000000008', '1 tablet', 'Twice daily', 60, 'Take with food.', 30);

-- --------------------------------------------------------

--
-- Table structure for table `procedures`
--

CREATE TABLE `procedures` (
  `procedure_id` char(36) NOT NULL,
  `visit_id` char(36) NOT NULL,
  `cpt_code` varchar(8) DEFAULT NULL,
  `procedure_name` varchar(200) NOT NULL,
  `procedure_description` text DEFAULT NULL,
  `outcome` text DEFAULT NULL,
  `performed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `procedures`
--

INSERT INTO `procedures` (`procedure_id`, `visit_id`, `cpt_code`, `procedure_name`, `procedure_description`, `outcome`, `performed_at`) VALUES
('60c28fdb-1ce7-4e4e-bba1-c2f24e5c893f', '30db2922-7990-4de8-ae4c-33df3ecf37c6', '99213', 'Outpatient Evaluation and Management', 'Performed a focused physical examination and evaluated patient’s reported symptoms. Reviewed vital signs, assessed general health status, and provided medical advice and follow-up instructions.', 'Procedure completed successfully. Patient stable and discharged with instructions.', '2025-11-29 00:27:00'),
('p1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '99213', 'Office or other outpatient visit for the evaluation and management of an established patient', 'Comprehensive physical examination including cardiovascular, respiratory, and neurological assessment', 'Normal findings. Patient cleared for treatment initiation.', '2025-01-10 09:30:00'),
('p2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', '99213', 'Office or other outpatient visit for the evaluation and management of an established patient', 'Review of laboratory results and treatment counseling', 'Patient counseled on ART adherence and side effects. Treatment plan accepted.', '2025-01-24 10:15:00'),
('p5555555-5555-5555-5555-555555555555', 'b1111111-1111-1111-1111-111111111111', '99203', 'Office or other outpatient visit for the evaluation and management of a new patient', 'Comprehensive initial evaluation including full physical examination', 'Baseline assessment completed. Patient referred for laboratory workup.', '2025-02-05 13:45:00'),
('p6666666-6666-6666-6666-666666666666', 'b2222222-2222-2222-2222-222222222222', '71045', 'Chest X-ray, single view', 'PA chest radiograph to rule out pneumonia', 'No acute findings. Mild peribronchial thickening noted. No evidence of pneumonia.', '2025-02-28 17:00:00'),
('p6666666-6666-6666-6666-666666666667', 'b2222222-2222-2222-2222-222222222222', '99284', 'Emergency department visit for the evaluation and management of a patient', 'Emergency evaluation and treatment of acute respiratory symptoms', 'Patient stabilized. Symptomatic treatment provided. Discharged with follow-up instructions.', '2025-02-28 16:30:00'),
('p7777777-7777-7777-7777-777777777777', 'b3333333-3333-3333-3333-333333333333', '99213', 'Office or other outpatient visit for the evaluation and management of an established patient', 'Post-emergency follow-up and ART initiation counseling', 'Patient recovered from respiratory infection. ART counseling completed. Treatment initiated.', '2025-03-15 10:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `program_indicators`
--

CREATE TABLE `program_indicators` (
  `indicator_id` char(36) NOT NULL,
  `indicator_name` varchar(200) NOT NULL,
  `indicator_code` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `target_value` decimal(10,2) DEFAULT NULL,
  `current_value` decimal(10,2) DEFAULT NULL,
  `period_start` date DEFAULT NULL,
  `period_end` date DEFAULT NULL,
  `facility_id` char(36) DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `referrals`
--

CREATE TABLE `referrals` (
  `referral_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `from_facility_id` char(36) NOT NULL,
  `to_facility_id` char(36) NOT NULL,
  `referral_reason` text NOT NULL,
  `urgency` enum('routine','urgent','emergency') DEFAULT 'routine',
  `status` enum('pending','accepted','in_transit','completed','rejected','cancelled') DEFAULT 'pending',
  `clinical_notes` text DEFAULT NULL,
  `referred_by` char(36) NOT NULL,
  `referred_at` datetime DEFAULT current_timestamp(),
  `accepted_at` datetime DEFAULT NULL,
  `accepted_by` char(36) DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `referrals`
--

INSERT INTO `referrals` (`referral_id`, `patient_id`, `from_facility_id`, `to_facility_id`, `referral_reason`, `urgency`, `status`, `clinical_notes`, `referred_by`, `referred_at`, `accepted_at`, `accepted_by`, `completed_at`, `rejection_reason`, `created_at`) VALUES
('78dd25e8-5047-493d-a584-25ff9a7bb13e', '9380eb9a-4d99-43dc-a1db-364a4067c39a', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', 'Further evaluation of mild fatigue and headache; specialist assessment recommended.', 'routine', 'pending', 'Patient stable. Vital signs normal. Referral requested for comprehensive assessment and to ensure follow-up continuity.', '44444444-4444-4444-4444-444444444444', '2025-11-29 09:16:46', NULL, NULL, NULL, NULL, '2025-11-29 09:16:46');

-- --------------------------------------------------------

--
-- Table structure for table `refill_requests`
--

CREATE TABLE `refill_requests` (
  `refill_id` char(36) NOT NULL COMMENT 'Primary key (request_id in docs, but refill_id in actual DB)',
  `patient_id` char(36) NOT NULL,
  `prescription_id` char(36) DEFAULT NULL,
  `regimen_id` char(36) DEFAULT NULL,
  `medication_id` char(36) NOT NULL,
  `medication_name` varchar(200) NOT NULL COMMENT 'Denormalized medication name',
  `facility_id` char(36) NOT NULL,
  `quantity` int(11) NOT NULL COMMENT 'quantity_requested in docs',
  `unit` varchar(20) DEFAULT 'tablets',
  `pickup_date` date NOT NULL COMMENT 'preferred_pickup_date in docs',
  `preferred_pickup_time` time DEFAULT NULL COMMENT 'Hourly only',
  `patient_notes` text DEFAULT NULL COMMENT 'notes in old schema',
  `remaining_pill_count` int(11) DEFAULT NULL COMMENT 'Required field',
  `pill_status` enum('kulang','sakto','sobra') DEFAULT NULL,
  `kulang_explanation` text DEFAULT NULL COMMENT 'Required if pill_status = kulang',
  `is_eligible_for_refill` tinyint(1) DEFAULT 0 COMMENT 'true if remaining_pill_count <= 10',
  `pills_per_day` int(11) DEFAULT 1,
  `status` enum('pending','approved','ready','dispensed','declined','cancelled') DEFAULT 'pending',
  `submitted_at` datetime DEFAULT current_timestamp() COMMENT 'created_at in docs',
  `processed_at` datetime DEFAULT NULL COMMENT 'reviewed_at in docs',
  `processed_by` char(36) DEFAULT NULL COMMENT 'reviewed_by in docs',
  `review_notes` text DEFAULT NULL COMMENT 'Case Manager review notes',
  `decline_reason` text DEFAULT NULL,
  `approved_quantity` int(11) DEFAULT NULL COMMENT 'May differ from requested quantity',
  `ready_for_pickup_date` date DEFAULT NULL,
  `dispensed_by` char(36) DEFAULT NULL,
  `dispensed_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` char(36) DEFAULT NULL COMMENT 'User who created request (NULL by default)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `refill_requests`
--

INSERT INTO `refill_requests` (`refill_id`, `patient_id`, `prescription_id`, `regimen_id`, `medication_id`, `medication_name`, `facility_id`, `quantity`, `unit`, `pickup_date`, `preferred_pickup_time`, `patient_notes`, `remaining_pill_count`, `pill_status`, `kulang_explanation`, `is_eligible_for_refill`, `pills_per_day`, `status`, `submitted_at`, `processed_at`, `processed_by`, `review_notes`, `decline_reason`, `approved_quantity`, `ready_for_pickup_date`, `dispensed_by`, `dispensed_at`, `updated_at`, `created_by`) VALUES
('rr-0001-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'rx-0001-0000-0000-000000000001', NULL, 'med-0001-0000-0000-000000000001', 'Tenofovir/Lamivudine/Dolutegravir (TLD)', '550e8400-e29b-41d4-a716-446655440000', 30, 'tablets', '2025-12-20', '10:00:00', 'Need refill for next month', 5, 'kulang', 'Running low on medication. Need refill soon.', 1, 1, 'approved', '2025-12-15 08:30:00', '2025-12-15 14:00:00', '44444444-4444-4444-4444-444444444444', 'Approved for 30-day supply. Patient has good adherence.', NULL, 30, '2025-12-20', NULL, NULL, '2025-12-15 14:00:00', NULL),
('rr-0002-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'rx-0001-0000-0000-000000000001', NULL, 'med-0001-0000-0000-000000000001', 'Tenofovir/Lamivudine/Dolutegravir (TLD)', '550e8400-e29b-41d4-a716-446655440000', 30, 'tablets', '2026-01-20', '11:00:00', NULL, 15, 'sakto', NULL, 0, 1, 'pending', '2025-12-18 09:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-18 09:00:00', NULL),
('rr-0003-0000-0000-000000000003', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', 'rx-0003-0000-0000-000000000003', NULL, 'med-0001-0000-0000-000000000001', 'Tenofovir/Lamivudine/Dolutegravir (TLD)', '550e8400-e29b-41d4-a716-446655440000', 30, 'tablets', '2025-12-22', '14:00:00', 'First refill request', 8, 'kulang', 'Almost out of medication. Need urgent refill.', 1, 1, 'ready', '2025-12-19 10:15:00', '2025-12-19 15:30:00', '44444444-4444-4444-4444-444444444444', 'Approved. Ready for pickup on 2025-12-22.', NULL, 30, '2025-12-22', NULL, NULL, '2025-12-19 15:30:00', NULL),
('rr-0004-0000-0000-000000000004', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', 'rx-0004-0000-0000-000000000004', NULL, 'med-0005-0000-0000-000000000005', 'Paracetamol 500mg', '550e8400-e29b-41d4-a716-446655440000', 20, 'tablets', '2025-12-25', '09:00:00', NULL, 25, 'sobra', NULL, 0, 1, 'declined', '2025-12-20 11:00:00', '2025-12-20 16:00:00', '44444444-4444-4444-4444-444444444444', NULL, 'Patient still has sufficient supply. Request declined.', NULL, NULL, NULL, NULL, '2025-12-20 16:00:00', NULL),
('rr-0005-0000-0000-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'rx-0002-0000-0000-000000000002', NULL, 'med-0006-0000-0000-000000000006', 'Amoxicillin 500mg', '550e8400-e29b-41d4-a716-446655440000', 90, 'capsules', '2025-12-10', '13:00:00', 'Need full course', 0, 'kulang', 'Completed previous course. Need new prescription.', 1, 3, 'dispensed', '2025-12-05 08:00:00', '2025-12-05 12:00:00', '44444444-4444-4444-4444-444444444444', 'Approved and dispensed.', NULL, 90, '2025-12-10', '33333333-3333-3333-3333-333333333333', '2025-12-10 13:15:00', '2025-12-10 13:15:00', NULL),
('rr-0006-0000-0000-000000000006', '9380eb9a-4d99-43dc-a1db-364a4067c39a', 'rx-0006-0000-0000-000000000006', NULL, 'med-0008-0000-0000-000000000008', 'Ibuprofen 400mg', '550e8400-e29b-41d4-a716-446655440000', 30, 'tablets', '2025-12-15', '10:00:00', 'First refill', 7, 'kulang', 'Running low on pain medication.', 1, 2, 'approved', '2025-12-12 09:30:00', '2025-12-12 14:20:00', '44444444-4444-4444-4444-444444444444', 'Approved for 30 tablets.', NULL, 30, '2025-12-15', NULL, NULL, '2025-12-12 14:20:00', NULL);

--
-- Triggers `refill_requests`
--
DELIMITER $$
CREATE TRIGGER `before_insert_refill_requests_date_check` BEFORE INSERT ON `refill_requests` FOR EACH ROW BEGIN
  IF NEW.pickup_date IS NOT NULL AND DATE(NEW.pickup_date) <= CURDATE() THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Pickup date must be at least one day in advance';
  END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_insert_refill_requests_kulang_check` BEFORE INSERT ON `refill_requests` FOR EACH ROW BEGIN
  IF NEW.pill_status = 'kulang' AND (NEW.kulang_explanation IS NULL OR TRIM(NEW.kulang_explanation) = '') THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Explanation is required when pill status is kulang';
  END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_insert_refill_requests_pill_count_check` BEFORE INSERT ON `refill_requests` FOR EACH ROW BEGIN
  IF NEW.remaining_pill_count IS NULL THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Remaining pill count is required';
  END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_insert_refill_requests_time_check` BEFORE INSERT ON `refill_requests` FOR EACH ROW BEGIN
  IF NEW.preferred_pickup_time IS NOT NULL AND MINUTE(NEW.preferred_pickup_time) != 0 THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Pickup time must be on the hour (e.g., 09:00:00, 10:00:00)';
  END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_update_refill_requests_date_check` BEFORE UPDATE ON `refill_requests` FOR EACH ROW BEGIN
  IF NEW.pickup_date IS NOT NULL AND DATE(NEW.pickup_date) <= CURDATE() THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Pickup date must be at least one day in advance';
  END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_update_refill_requests_kulang_check` BEFORE UPDATE ON `refill_requests` FOR EACH ROW BEGIN
  IF NEW.pill_status = 'kulang' AND (NEW.kulang_explanation IS NULL OR TRIM(NEW.kulang_explanation) = '') THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Explanation is required when pill status is kulang';
  END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_update_refill_requests_pill_count_check` BEFORE UPDATE ON `refill_requests` FOR EACH ROW BEGIN
  IF NEW.remaining_pill_count IS NULL THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Remaining pill count is required';
  END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_update_refill_requests_time_check` BEFORE UPDATE ON `refill_requests` FOR EACH ROW BEGIN
  IF NEW.preferred_pickup_time IS NOT NULL AND MINUTE(NEW.preferred_pickup_time) != 0 THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Pickup time must be on the hour (e.g., 09:00:00, 10:00:00)';
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `regions`
--

CREATE TABLE `regions` (
  `region_id` int(11) NOT NULL,
  `region_name` varchar(150) NOT NULL,
  `region_code` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `regions`
--

INSERT INTO `regions` (`region_id`, `region_name`, `region_code`, `is_active`, `created_at`) VALUES
(1, 'National Capital Region (NCR)', 'NCR', 1, '2025-11-29 10:16:18'),
(2, 'Cordillera Administrative Region', 'CAR', 1, '2025-11-29 10:16:18'),
(3, 'Ilocos Region', 'I', 1, '2025-11-29 10:16:18'),
(4, 'Cagayan Valley', 'II', 1, '2025-11-29 10:16:18'),
(5, 'Central Luzon', 'III', 1, '2025-11-29 10:16:18'),
(6, 'CALABARZON', 'IV-A', 1, '2025-11-29 10:16:18'),
(7, 'MIMAROPA', 'IV-B', 1, '2025-11-29 10:16:18'),
(8, 'Bicol Region', 'V', 1, '2025-11-29 10:16:18'),
(9, 'Western Visayas', 'VI', 1, '2025-11-29 10:16:18'),
(10, 'Central Visayas', 'VII', 1, '2025-11-29 10:16:18'),
(11, 'Eastern Visayas', 'VIII', 1, '2025-11-29 10:16:18'),
(12, 'Zamboanga Peninsula', 'IX', 1, '2025-11-29 10:16:18'),
(13, 'Northern Mindanao', 'X', 1, '2025-11-29 10:16:18'),
(14, 'Davao Region', 'XI', 1, '2025-11-29 10:16:18'),
(15, 'SOCCSKSARGEN', 'XII', 1, '2025-11-29 10:16:18'),
(16, 'Caraga', 'XIII', 1, '2025-11-29 10:16:18'),
(17, 'Bangsamoro Autonomous Region in Muslim Mindanao', 'BARMM', 1, '2025-11-29 10:16:18');

-- --------------------------------------------------------

--
-- Table structure for table `remote_monitoring_data`
--

CREATE TABLE `remote_monitoring_data` (
  `data_id` char(36) NOT NULL,
  `device_id` char(36) NOT NULL,
  `patient_id` char(36) DEFAULT NULL,
  `recorded_at` datetime DEFAULT current_timestamp(),
  `metric_key` varchar(100) DEFAULT NULL,
  `metric_value` varchar(200) DEFAULT NULL,
  `raw_payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`raw_payload`)),
  `processed` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `remote_monitoring_devices`
--

CREATE TABLE `remote_monitoring_devices` (
  `device_id` char(36) NOT NULL,
  `device_name` varchar(200) NOT NULL,
  `manufacturer` varchar(200) DEFAULT NULL,
  `model` varchar(100) DEFAULT NULL,
  `serial_number` varchar(200) DEFAULT NULL,
  `patient_id` char(36) DEFAULT NULL,
  `assigned_at` datetime DEFAULT NULL,
  `last_synced_at` datetime DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `report_queries`
--

CREATE TABLE `report_queries` (
  `report_id` char(36) NOT NULL,
  `report_name` varchar(150) NOT NULL,
  `report_description` text DEFAULT NULL,
  `report_type` enum('patient','clinical','inventory','survey','custom') NOT NULL,
  `query_definition` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`query_definition`)),
  `parameters` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`parameters`)),
  `schedule` varchar(50) DEFAULT NULL,
  `owner_id` char(36) NOT NULL,
  `is_public` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `report_queries`
--

INSERT INTO `report_queries` (`report_id`, `report_name`, `report_description`, `report_type`, `query_definition`, `parameters`, `schedule`, `owner_id`, `is_public`, `created_at`) VALUES
('6dfe76c9-a6bf-47bf-a0b2-b18668f45126', 'Adherence Statistics Report', 'Standard adherence statistics and analytics report', '', '{\"type\":\"adherence\",\"standard\":true}', '{}', NULL, '11111111-1111-1111-1111-111111111111', 1, '2025-11-29 10:16:49'),
('c202c9a7-1f7f-41de-8fd1-ad50e71ecff3', 'Appointment Statistics Report', 'Standard appointment statistics and analytics report', '', '{\"type\":\"appointment\",\"standard\":true}', '{}', NULL, '11111111-1111-1111-1111-111111111111', 1, '2025-11-29 10:16:50'),
('rpt-0001-0000-0000-000000000001', 'Patient Statistics Report', 'Comprehensive patient demographics and statistics report', 'patient', '{\"type\":\"patient\",\"standard\":true,\"query\":\"SELECT COUNT(*) as total, COUNT(CASE WHEN sex = \'M\' OR sex = \'male\' THEN 1 END) as male_count, COUNT(CASE WHEN sex = \'F\' OR sex = \'female\' THEN 1 END) as female_count FROM patients\"}', '{\"facility_id\":null,\"date_from\":null,\"date_to\":null}', NULL, '11111111-1111-1111-1111-111111111111', 1, '2025-11-29 10:13:06'),
('rpt-0002-0000-0000-000000000002', 'Clinical Visit Statistics Report', 'Statistics on clinical visits, diagnoses, and procedures', 'clinical', '{\"type\":\"clinical\",\"standard\":true,\"query\":\"SELECT COUNT(*) as total_visits, COUNT(DISTINCT patient_id) as unique_patients, COUNT(DISTINCT provider_id) as providers FROM clinical_visits\"}', '{\"facility_id\":null,\"date_from\":null,\"date_to\":null}', NULL, '11111111-1111-1111-1111-111111111111', 1, '2025-11-29 10:13:06'),
('rpt-0003-0000-0000-000000000003', 'Inventory Statistics Report', 'Medication inventory levels, low stock alerts, and expiry tracking', 'inventory', '{\"type\":\"inventory\",\"standard\":true,\"query\":\"SELECT COUNT(*) as total_items, SUM(quantity_on_hand) as total_stock, COUNT(CASE WHEN quantity_on_hand <= reorder_level THEN 1 END) as low_stock_count FROM medication_inventory\"}', '{\"facility_id\":null,\"include_expired\":false}', NULL, '11111111-1111-1111-1111-111111111111', 1, '2025-11-29 10:13:06'),
('rpt-0004-0000-0000-000000000004', 'Medication Adherence Report', 'Patient medication adherence statistics and trends', 'clinical', '{\"type\":\"adherence\",\"standard\":true,\"query\":\"SELECT AVG(adherence_percentage) as avg_adherence, COUNT(*) as total_records, COUNT(CASE WHEN taken = 1 THEN 1 END) as taken_count FROM medication_adherence\"}', '{\"facility_id\":null,\"date_from\":null,\"date_to\":null}', NULL, '11111111-1111-1111-1111-111111111111', 1, '2025-11-29 10:13:06'),
('rpt-0005-0000-0000-000000000005', 'Appointment Statistics Report', 'Appointment scheduling, attendance, and completion statistics', 'clinical', '{\"type\":\"appointment\",\"standard\":true,\"query\":\"SELECT COUNT(*) as total_appointments, COUNT(CASE WHEN status = \'completed\' THEN 1 END) as completed_count, COUNT(CASE WHEN status = \'scheduled\' THEN 1 END) as scheduled_count FROM appointments\"}', '{\"facility_id\":null,\"date_from\":null,\"date_to\":null}', NULL, '11111111-1111-1111-1111-111111111111', 1, '2025-11-29 10:13:06'),
('rpt-0006-0000-0000-000000000006', 'Prescription Statistics Report', 'Prescription issuance and medication dispensing statistics', 'clinical', '{\"type\":\"prescription\",\"standard\":true,\"query\":\"SELECT COUNT(*) as total_prescriptions, COUNT(DISTINCT patient_id) as patients_with_prescriptions, COUNT(DISTINCT prescriber_id) as prescribers FROM prescriptions\"}', '{\"facility_id\":null,\"date_from\":null,\"date_to\":null}', NULL, '11111111-1111-1111-1111-111111111111', 1, '2025-11-29 10:13:06'),
('rpt-0007-0000-0000-000000000007', 'Lab Results Statistics Report', 'Laboratory test orders, results, and critical values', 'clinical', '{\"type\":\"lab\",\"standard\":true,\"query\":\"SELECT COUNT(*) as total_results, COUNT(CASE WHEN is_critical = 1 THEN 1 END) as critical_count, COUNT(DISTINCT test_code) as unique_tests FROM lab_results\"}', '{\"facility_id\":null,\"date_from\":null,\"date_to\":null}', NULL, '11111111-1111-1111-1111-111111111111', 1, '2025-11-29 10:13:06'),
('rpt-0008-0000-0000-000000000008', 'Monthly Activity Summary', 'Custom monthly activity summary across all modules', 'custom', '{\"type\":\"custom\",\"query\":\"SELECT \'patients\' as module, COUNT(*) as count FROM patients UNION ALL SELECT \'visits\', COUNT(*) FROM clinical_visits UNION ALL SELECT \'prescriptions\', COUNT(*) FROM prescriptions\"}', '{\"facility_id\":null,\"month\":null,\"year\":null}', '0 0 1 * *', '11111111-1111-1111-1111-111111111111', 0, '2025-11-29 10:13:06');

-- --------------------------------------------------------

--
-- Table structure for table `report_runs`
--

CREATE TABLE `report_runs` (
  `run_id` char(36) NOT NULL,
  `report_id` char(36) NOT NULL,
  `started_at` datetime DEFAULT current_timestamp(),
  `finished_at` datetime DEFAULT NULL,
  `status` enum('running','completed','failed','cancelled') DEFAULT 'running',
  `parameters_used` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`parameters_used`)),
  `output_ref` varchar(500) DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `run_by` char(36) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `report_runs`
--

INSERT INTO `report_runs` (`run_id`, `report_id`, `started_at`, `finished_at`, `status`, `parameters_used`, `output_ref`, `error_message`, `run_by`) VALUES
('586ca0f7-5e63-46d8-8cdc-c5252e545c08', 'c202c9a7-1f7f-41de-8fd1-ad50e71ecff3', '2025-11-29 10:16:50', '2025-11-29 10:16:50', 'completed', '{}', '{\"total_appointments\":7,\"completed_count\":1,\"scheduled_count\":3,\"cancelled_count\":1,\"no_show_count\":0}', NULL, '11111111-1111-1111-1111-111111111111'),
('86499dcc-29d6-4fac-8d05-f3197ebdd27b', '6dfe76c9-a6bf-47bf-a0b2-b18668f45126', '2025-11-29 10:16:49', '2025-11-29 10:16:49', 'completed', '{}', '{\"avg_adherence\":96.642308,\"total_records\":13,\"taken_count\":10,\"missed_count\":3}', NULL, '11111111-1111-1111-1111-111111111111'),
('94e53705-30e0-4a95-a58e-4b7569896ac1', 'rpt-0003-0000-0000-000000000003', '2025-11-29 10:16:49', '2025-11-29 10:16:49', 'completed', '{}', '{\"total_items\":10,\"total_stock\":\"4417\",\"low_stock_count\":0,\"expiring_soon_count\":0}', NULL, '11111111-1111-1111-1111-111111111111'),
('da13c0c3-ce40-47fd-8ce6-a87cedd6110a', 'rpt-0001-0000-0000-000000000001', '2025-11-29 10:16:47', '2025-11-29 10:16:47', 'completed', '{}', '{\"total_patients\":3,\"male_count\":2,\"female_count\":1}', NULL, '11111111-1111-1111-1111-111111111111'),
('run-0001-0000-0000-000000000001', 'rpt-0001-0000-0000-000000000001', '2025-11-27 10:13:06', '2025-11-27 10:13:06', 'completed', '{\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"date_from\":null,\"date_to\":null}', '{\"total_patients\":3,\"male_count\":1,\"female_count\":2,\"other_count\":0}', NULL, '11111111-1111-1111-1111-111111111111'),
('run-0002-0000-0000-000000000002', 'rpt-0003-0000-0000-000000000003', '2025-11-28 10:13:06', '2025-11-28 10:13:06', 'completed', '{\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"include_expired\":false}', '{\"total_items\":8,\"total_stock\":3120,\"low_stock_count\":2,\"expiring_soon_count\":0}', NULL, '11111111-1111-1111-1111-111111111111'),
('run-0003-0000-0000-000000000003', 'rpt-0005-0000-0000-000000000005', '2025-11-29 07:13:06', '2025-11-29 07:13:06', 'completed', '{\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"date_from\":\"2025-11-01\",\"date_to\":\"2025-11-30\"}', '{\"total_appointments\":5,\"completed_count\":2,\"scheduled_count\":2,\"cancelled_count\":1,\"no_show_count\":0}', NULL, '11111111-1111-1111-1111-111111111111'),
('run-0004-0000-0000-000000000004', 'rpt-0004-0000-0000-000000000004', '2025-11-29 10:08:06', NULL, 'running', '{\"facility_id\":null,\"date_from\":\"2025-11-01\",\"date_to\":\"2025-11-30\"}', NULL, NULL, '11111111-1111-1111-1111-111111111111'),
('run-0005-0000-0000-000000000005', 'rpt-0007-0000-0000-000000000007', '2025-11-29 09:13:06', '2025-11-29 09:13:06', 'failed', '{\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"date_from\":\"invalid-date\"}', NULL, 'Invalid date format provided', '11111111-1111-1111-1111-111111111111'),
('run-0006-0000-0000-000000000006', 'rpt-0002-0000-0000-000000000002', '2025-11-29 04:13:06', '2025-11-29 04:13:06', 'completed', '{\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"date_from\":\"2025-11-01\",\"date_to\":\"2025-11-30\"}', '{\"total_visits\":8,\"unique_patients\":3,\"providers\":2}', NULL, '11111111-1111-1111-1111-111111111111'),
('run-0007-0000-0000-000000000007', 'rpt-0006-0000-0000-000000000006', '2025-11-28 22:13:06', '2025-11-28 22:13:06', 'completed', '{\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"date_from\":\"2025-11-01\",\"date_to\":\"2025-11-30\"}', '{\"total_prescriptions\":6,\"patients_with_prescriptions\":3,\"prescribers\":2}', NULL, '11111111-1111-1111-1111-111111111111'),
('run-0008-0000-0000-000000000008', 'rpt-0004-0000-0000-000000000004', '2025-11-28 10:13:06', '2025-11-28 10:13:06', 'completed', '{\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"date_from\":\"2025-11-01\",\"date_to\":\"2025-11-30\"}', '{\"avg_adherence\":93.5,\"total_records\":13,\"taken_count\":11,\"missed_count\":2}', NULL, '11111111-1111-1111-1111-111111111111');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `role_id` char(36) NOT NULL,
  `role_code` varchar(50) NOT NULL,
  `role_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_system_role` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`role_id`, `role_code`, `role_name`, `description`, `is_system_role`, `created_at`) VALUES
('role-0000-0000-0000-000000000001', 'admin', 'Administrator', 'System administrator with full access to all features and settings', 1, '2025-11-16 12:18:28'),
('role-0000-0000-0000-000000000002', 'physician', 'Physician', 'Medical doctor with access to patient records, prescriptions, and clinical visits', 1, '2025-11-16 12:18:28'),
('role-0000-0000-0000-000000000003', 'nurse', 'Nurse', 'Nursing staff with access to patient care, appointments, and clinical documentation', 1, '2025-11-16 12:18:28'),
('role-0000-0000-0000-000000000004', 'case_manager', 'Case Manager', 'Case manager with access to patient coordination, referrals, and counseling', 1, '2025-11-16 12:18:28'),
('role-0000-0000-0000-000000000005', 'lab_personnel', 'Lab Personnel', 'Laboratory staff with access to lab tests and inventory management', 1, '2025-11-16 12:18:28'),
('role-0000-0000-0000-000000000006', 'patient', 'Patient', 'Patient with access to their own records, appointments, and profile', 1, '2025-11-16 12:18:28');

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `role_permission_id` char(36) NOT NULL,
  `role_id` char(36) NOT NULL,
  `permission_id` char(36) NOT NULL,
  `granted_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `role_permissions`
--

INSERT INTO `role_permissions` (`role_permission_id`, `role_id`, `permission_id`, `granted_at`) VALUES
('4974e51a-c4b2-43dd-966c-935015ea15bb', 'role-0000-0000-0000-000000000006', 'perm-0000-0000-0000-000000000022', '2025-11-27 10:26:31'),
('56cb7249-0f26-4b3b-947c-aecc75c97cd8', 'role-0000-0000-0000-000000000004', 'perm-0000-0000-0000-000000000014', '2025-11-27 18:42:24'),
('9bf242fe-58ca-44e5-96ec-bd99d76759fe', 'role-0000-0000-0000-000000000006', 'perm-0000-0000-0000-000000000014', '2025-11-27 18:43:04'),
('e379f720-cb60-4cfa-ac9f-17b2dce7da7b', 'role-0000-0000-0000-000000000006', 'perm-0000-0000-0000-000000000002', '2025-11-27 10:26:31'),
('rp-admin-0001-0001-0001-000000000001', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000001', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000002', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000002', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000003', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000003', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000004', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000004', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000005', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000005', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000006', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000006', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000007', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000007', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000008', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000008', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000009', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000009', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000010', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000010', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000011', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000011', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000012', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000012', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000013', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000013', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000014', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000014', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000015', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000015', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000016', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000016', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000017', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000017', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000018', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000018', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000019', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000019', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000020', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000020', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000021', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000021', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000022', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000022', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000023', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000023', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000024', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000024', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000025', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000025', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000026', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000026', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000027', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000027', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000028', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000028', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000029', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000029', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000030', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000030', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000031', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000031', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000032', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000032', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000033', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000033', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000034', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000034', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000035', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000035', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000036', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000036', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000037', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000037', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000038', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000038', '2025-11-16 12:18:28'),
('rp-admin-0001-0001-0001-000000000039', 'role-0000-0000-0000-000000000001', 'perm-0000-0000-0000-000000000039', '2025-11-16 12:18:28'),
('rp-case-0001-0001-0001-000000000001', 'role-0000-0000-0000-000000000004', 'perm-0000-0000-0000-000000000002', '2025-11-16 12:18:29'),
('rp-case-0001-0001-0001-000000000002', 'role-0000-0000-0000-000000000004', 'perm-0000-0000-0000-000000000003', '2025-11-16 12:18:29'),
('rp-case-0001-0001-0001-000000000010', 'role-0000-0000-0000-000000000004', 'perm-0000-0000-0000-000000000010', '2025-11-16 12:18:29'),
('rp-case-0001-0001-0001-000000000018', 'role-0000-0000-0000-000000000004', 'perm-0000-0000-0000-000000000018', '2025-11-16 12:18:29'),
('rp-case-0001-0001-0001-000000000019', 'role-0000-0000-0000-000000000004', 'perm-0000-0000-0000-000000000019', '2025-11-16 12:18:29'),
('rp-labp-0001-0001-0001-000000000001', 'role-0000-0000-0000-000000000005', 'perm-0000-0000-0000-000000000021', '2025-11-16 12:18:29'),
('rp-labp-0001-0001-0001-000000000002', 'role-0000-0000-0000-000000000005', 'perm-0000-0000-0000-000000000022', '2025-11-16 12:18:29'),
('rp-labp-0001-0001-0001-000000000003', 'role-0000-0000-0000-000000000005', 'perm-0000-0000-0000-000000000023', '2025-11-16 12:18:29'),
('rp-labp-0001-0001-0001-000000000004', 'role-0000-0000-0000-000000000005', 'perm-0000-0000-0000-000000000026', '2025-11-16 12:18:29'),
('rp-labp-0001-0001-0001-000000000005', 'role-0000-0000-0000-000000000005', 'perm-0000-0000-0000-000000000027', '2025-11-16 12:18:29'),
('rp-nurs-0001-0001-0001-000000000001', 'role-0000-0000-0000-000000000003', 'perm-0000-0000-0000-000000000002', '2025-11-16 12:18:29'),
('rp-nurs-0001-0001-0001-000000000003', 'role-0000-0000-0000-000000000003', 'perm-0000-0000-0000-000000000003', '2025-11-16 12:18:29'),
('rp-nurs-0001-0001-0001-000000000009', 'role-0000-0000-0000-000000000003', 'perm-0000-0000-0000-000000000009', '2025-11-16 12:18:29'),
('rp-nurs-0001-0001-0001-000000000010', 'role-0000-0000-0000-000000000003', 'perm-0000-0000-0000-000000000010', '2025-11-16 12:18:29'),
('rp-nurs-0001-0001-0001-000000000011', 'role-0000-0000-0000-000000000003', 'perm-0000-0000-0000-000000000011', '2025-11-16 12:18:29'),
('rp-nurs-0001-0001-0001-000000000014', 'role-0000-0000-0000-000000000003', 'perm-0000-0000-0000-000000000014', '2025-11-16 12:18:29'),
('rp-nurs-0001-0001-0001-000000000017', 'role-0000-0000-0000-000000000003', 'perm-0000-0000-0000-000000000017', '2025-11-16 12:18:29'),
('rp-nurs-0001-0001-0001-000000000018', 'role-0000-0000-0000-000000000003', 'perm-0000-0000-0000-000000000018', '2025-11-16 12:18:29'),
('rp-nurs-0001-0001-0001-000000000019', 'role-0000-0000-0000-000000000003', 'perm-0000-0000-0000-000000000019', '2025-11-16 12:18:29'),
('rp-nurs-0001-0001-0001-000000000021', 'role-0000-0000-0000-000000000003', 'perm-0000-0000-0000-000000000021', '2025-11-16 12:18:29'),
('rp-nurs-0001-0001-0001-000000000022', 'role-0000-0000-0000-000000000003', 'perm-0000-0000-0000-000000000022', '2025-11-16 12:18:29'),
('rp-nurs-0001-0001-0001-000000000023', 'role-0000-0000-0000-000000000003', 'perm-0000-0000-0000-000000000023', '2025-11-16 12:18:29'),
('rp-nurs-0001-0001-0001-000000000026', 'role-0000-0000-0000-000000000003', 'perm-0000-0000-0000-000000000026', '2025-11-16 12:18:29'),
('rp-nurs-0001-0001-0001-000000000027', 'role-0000-0000-0000-000000000003', 'perm-0000-0000-0000-000000000027', '2025-11-16 12:18:29'),
('rp-phys-0001-0001-0001-000000000001', 'role-0000-0000-0000-000000000002', 'perm-0000-0000-0000-000000000001', '2025-11-16 12:18:28'),
('rp-phys-0001-0001-0001-000000000002', 'role-0000-0000-0000-000000000002', 'perm-0000-0000-0000-000000000002', '2025-11-16 12:18:28'),
('rp-phys-0001-0001-0001-000000000003', 'role-0000-0000-0000-000000000002', 'perm-0000-0000-0000-000000000003', '2025-11-16 12:18:28'),
('rp-phys-0001-0001-0001-000000000009', 'role-0000-0000-0000-000000000002', 'perm-0000-0000-0000-000000000009', '2025-11-16 12:18:28'),
('rp-phys-0001-0001-0001-000000000010', 'role-0000-0000-0000-000000000002', 'perm-0000-0000-0000-000000000010', '2025-11-16 12:18:28'),
('rp-phys-0001-0001-0001-000000000011', 'role-0000-0000-0000-000000000002', 'perm-0000-0000-0000-000000000011', '2025-11-16 12:18:28'),
('rp-phys-0001-0001-0001-000000000013', 'role-0000-0000-0000-000000000002', 'perm-0000-0000-0000-000000000013', '2025-11-16 12:18:28'),
('rp-phys-0001-0001-0001-000000000014', 'role-0000-0000-0000-000000000002', 'perm-0000-0000-0000-000000000014', '2025-11-16 12:18:28'),
('rp-phys-0001-0001-0001-000000000015', 'role-0000-0000-0000-000000000002', 'perm-0000-0000-0000-000000000015', '2025-11-16 12:18:28'),
('rp-phys-0001-0001-0001-000000000017', 'role-0000-0000-0000-000000000002', 'perm-0000-0000-0000-000000000017', '2025-11-16 12:18:28'),
('rp-phys-0001-0001-0001-000000000018', 'role-0000-0000-0000-000000000002', 'perm-0000-0000-0000-000000000018', '2025-11-16 12:18:28'),
('rp-phys-0001-0001-0001-000000000019', 'role-0000-0000-0000-000000000002', 'perm-0000-0000-0000-000000000019', '2025-11-16 12:18:28'),
('rp-phys-0001-0001-0001-000000000022', 'role-0000-0000-0000-000000000002', 'perm-0000-0000-0000-000000000022', '2025-11-16 12:18:28'),
('rp-phys-0001-0001-0001-000000000038', 'role-0000-0000-0000-000000000002', 'perm-0000-0000-0000-000000000038', '2025-11-16 12:18:28');

-- --------------------------------------------------------

--
-- Table structure for table `sms_queue`
--

CREATE TABLE `sms_queue` (
  `sms_id` char(36) NOT NULL,
  `to_number` varchar(50) NOT NULL,
  `patient_id` char(36) DEFAULT NULL,
  `message` text NOT NULL,
  `scheduled_at` datetime DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `status` enum('pending','sent','failed') DEFAULT 'pending',
  `provider_response` text DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stock_entries`
--

CREATE TABLE `stock_entries` (
  `stock_id` char(36) NOT NULL,
  `item_id` char(36) NOT NULL,
  `facility_id` char(36) NOT NULL,
  `supplier_id` char(36) DEFAULT NULL,
  `batch_number` varchar(50) DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `unit_cost` decimal(10,2) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `received_at` datetime DEFAULT current_timestamp(),
  `received_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stock_movements`
--

CREATE TABLE `stock_movements` (
  `movement_id` char(36) NOT NULL,
  `item_id` char(36) NOT NULL,
  `from_facility_id` char(36) DEFAULT NULL,
  `to_facility_id` char(36) DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `movement_type` enum('transfer','adjustment','return','damage') NOT NULL,
  `notes` text DEFAULT NULL,
  `moved_by` char(36) DEFAULT NULL,
  `moved_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `supplier_id` char(36) NOT NULL,
  `supplier_name` varchar(150) NOT NULL,
  `contact_person` varchar(150) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`address`)),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `survey_metrics`
--

CREATE TABLE `survey_metrics` (
  `metric_id` char(36) NOT NULL,
  `facility_id` char(36) DEFAULT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `total_responses` int(11) DEFAULT 0,
  `average_overall` decimal(3,2) DEFAULT NULL,
  `average_staff` decimal(3,2) DEFAULT NULL,
  `average_wait` decimal(3,2) DEFAULT NULL,
  `average_cleanliness` decimal(3,2) DEFAULT NULL,
  `recommendation_rate` decimal(5,2) DEFAULT NULL,
  `calculated_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `survey_responses`
--

CREATE TABLE `survey_responses` (
  `survey_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `facility_id` char(36) DEFAULT NULL,
  `overall_satisfaction` enum('very_happy','happy','neutral','unhappy','very_unhappy') NOT NULL,
  `staff_friendliness` int(11) NOT NULL CHECK (`staff_friendliness` >= 1 and `staff_friendliness` <= 5),
  `wait_time` int(11) NOT NULL CHECK (`wait_time` >= 1 and `wait_time` <= 5),
  `facility_cleanliness` int(11) NOT NULL CHECK (`facility_cleanliness` >= 1 and `facility_cleanliness` <= 5),
  `would_recommend` enum('yes','maybe','no') NOT NULL,
  `comments` text DEFAULT NULL,
  `average_score` decimal(3,2) DEFAULT NULL,
  `submitted_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `survey_responses`
--

INSERT INTO `survey_responses` (`survey_id`, `patient_id`, `facility_id`, `overall_satisfaction`, `staff_friendliness`, `wait_time`, `facility_cleanliness`, `would_recommend`, `comments`, `average_score`, `submitted_at`) VALUES
('db4373fe-c403-4a2d-a4bf-ae0f1d9147ef', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '550e8400-e29b-41d4-a716-446655440002', 'very_happy', 2, 2, 3, 'maybe', 'adas', 2.33, '2025-11-24 09:02:39');

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `setting_key` varchar(100) NOT NULL,
  `setting_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`setting_value`)),
  `description` text DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`, `updated_at`, `updated_by`) VALUES
('inventory.expiry_warning_days', '30', 'Days before expiry to warn about expiring items', '2025-11-29 10:16:18', '11111111-1111-1111-1111-111111111111'),
('inventory.low_stock_threshold', '10', 'Low stock threshold percentage', '2025-11-29 10:16:18', '11111111-1111-1111-1111-111111111111'),
('notification.email_enabled', 'true', 'Enable email notifications', '2025-11-29 10:16:18', '11111111-1111-1111-1111-111111111111'),
('notification.sms_enabled', 'true', 'Enable SMS notifications', '2025-11-29 10:16:18', '11111111-1111-1111-1111-111111111111'),
('scheduling.allow_same_day_booking', 'false', 'Allow same-day booking (always false per requirements)', '2025-11-29 10:16:18', '11111111-1111-1111-1111-111111111111'),
('scheduling.max_patients_per_day', '20', 'Maximum patients per day across all doctors', '2025-11-29 10:16:18', '11111111-1111-1111-1111-111111111111'),
('scheduling.max_slots_per_doctor', '8', 'Maximum appointments per doctor per day', '2025-11-29 10:16:18', '11111111-1111-1111-1111-111111111111'),
('scheduling.min_advance_days', '1', 'Minimum days in advance for booking (no same-day)', '2025-11-29 10:16:18', '11111111-1111-1111-1111-111111111111'),
('scheduling.slot_duration_minutes', '60', 'Appointment slot duration in minutes (hourly only)', '2025-11-29 10:16:18', '11111111-1111-1111-1111-111111111111'),
('system.name', '\"MyHubCares\"', 'System name', '2025-11-29 10:16:18', '11111111-1111-1111-1111-111111111111'),
('system.timezone', '\"Asia/Manila\"', 'System timezone', '2025-11-29 10:16:18', '11111111-1111-1111-1111-111111111111'),
('system.version', '\"1.0.0\"', 'System version', '2025-11-29 10:16:18', '11111111-1111-1111-1111-111111111111');

-- --------------------------------------------------------

--
-- Table structure for table `teleconsultations`
--

CREATE TABLE `teleconsultations` (
  `consult_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `provider_id` char(36) DEFAULT NULL,
  `facility_id` char(36) DEFAULT NULL,
  `scheduled_start` datetime NOT NULL,
  `scheduled_end` datetime DEFAULT NULL,
  `join_url` varchar(1000) DEFAULT NULL,
  `consult_type` enum('video','phone','chat') DEFAULT 'video',
  `status` enum('scheduled','in_progress','completed','cancelled','no_show') DEFAULT 'scheduled',
  `summary` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `recorded_at` datetime DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `teleconsult_notes`
--

CREATE TABLE `teleconsult_notes` (
  `note_id` char(36) NOT NULL,
  `consult_id` char(36) NOT NULL,
  `author_id` char(36) NOT NULL,
  `note_text` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` char(36) NOT NULL,
  `username` varchar(150) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(200) NOT NULL,
  `role` enum('admin','physician','nurse','case_manager','lab_personnel','patient') NOT NULL,
  `status` enum('active','inactive','suspended','pending') DEFAULT 'active',
  `facility_id` char(36) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `failed_login_attempts` int(11) DEFAULT 0,
  `locked_until` datetime DEFAULT NULL,
  `mfa_enabled` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp(),
  `created_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `email`, `password_hash`, `full_name`, `role`, `status`, `facility_id`, `phone`, `last_login`, `failed_login_attempts`, `locked_until`, `mfa_enabled`, `created_at`, `updated_at`, `created_by`) VALUES
('11111111-1111-1111-1111-111111111111', 'admin', 'admin@myhubcares.com', '$2b$10$y.8OIKHZgCeiQiugZ.zG/uh2KMlKm43mW0MQD0bZhV4s83chdJEJm', 'System Administrator', 'admin', 'active', '550e8400-e29b-41d4-a716-446655440000', '+63-912-345-6789', '2025-11-29 12:52:01', 0, NULL, 0, '2025-11-16 12:16:22', '2025-11-16 12:16:22', NULL),
('16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanapot', 'sarabia.hanna.bsinfotech@gmail.com', '$2b$10$aLwTcLHqWtUvn899h6lWXeuUXn/qWIS6YmqIn6l0fQn/Cnzm/Ofde', 'Hanna N. Sarabia', 'patient', 'active', '550e8400-e29b-41d4-a716-446655440000', '0966-312-2562', '2025-11-29 12:51:18', 0, NULL, 0, '2025-11-17 16:07:50', '2025-11-17 16:07:50', NULL),
('22222222-2222-2222-2222-222222222222', 'physician', 'physician@myhubcares.com', '$2b$10$ofhNZLH1Fz0Ifa3MXDszw.mmdF.//52oSfNwBnmAqPFugn2U4.oXy', 'Dr. Juan Dela Cruz', 'physician', 'active', '550e8400-e29b-41d4-a716-446655440000', '+63-912-345-6790', '2025-11-29 12:36:48', 0, NULL, 0, '2025-11-16 12:16:22', '2025-11-16 12:16:22', NULL),
('33333333-3333-3333-3333-333333333333', 'nurse', 'nurse@myhubcares.com', '$2b$10$BYMKMtPXH6J1jAPGZIcGN.hKRkV5jjUEePcqYnscOvdE99gpn1jn.', 'Maria Santos', 'nurse', 'active', '550e8400-e29b-41d4-a716-446655440000', '+63-912-345-6791', '2025-11-29 10:10:59', 0, NULL, 0, '2025-11-16 12:16:23', '2025-11-16 12:16:23', NULL),
('42356bf7-84ef-4aaa-9610-d74b65c3929f', 'Trixie', 'hannasarabia879@gmail.com', '$2b$10$vJRdKCkyHjJy2CbEG0oJMuZJkTzUYNONxs/YmyluIGIf9wOzJIfp.', 'Trixie Morales', 'physician', 'active', '550e8400-e29b-41d4-a716-446655440000', '09275649283', '2025-11-28 14:14:40', 0, NULL, 0, '2025-11-17 16:14:27', '2025-11-17 16:14:27', NULL),
('44444444-4444-4444-4444-444444444444', 'case_manager', 'casemanager@myhubcares.com', '$2b$10$jTwo7uslBQw3H7IIExQhy.AcOr9/WoEKbCYESggVsRnAQ2458UXD6', 'Pedro Garcia', 'case_manager', 'active', '550e8400-e29b-41d4-a716-446655440000', '+63-912-345-6792', '2025-11-29 12:51:10', 0, NULL, 0, '2025-11-16 12:16:23', '2025-11-16 12:16:23', NULL),
('55555555-5555-5555-5555-555555555555', 'lab_personnel', 'lab@myhubcares.com', '$2b$10$r9sKBgkbSVBEcyKsjhjhUupcIrmWooCUDkVokj.GVvbuRd9ZcD/uu', 'Ana Rodriguez', 'lab_personnel', 'active', '550e8400-e29b-41d4-a716-446655440000', '+63-912-345-6793', '2025-11-29 09:29:03', 0, NULL, 0, '2025-11-16 12:16:23', '2025-11-16 12:16:23', NULL),
('66666666-6666-6666-6666-666666666666', 'patient', 'patient@myhubcares.com', '$2b$10$fOHLfsU/xrmSwXWJygw3luHwaj4GO90abp.Kzcp.EPPDuBHqfeJCi', 'Jose Reyes', 'patient', 'active', '550e8400-e29b-41d4-a716-446655440000', '+63-912-345-6794', '2025-11-29 12:47:31', 0, NULL, 0, '2025-11-16 12:16:23', '2025-11-16 12:16:23', NULL),
('b656634b-477f-4aaa-817d-e0a77f75d88c', 'rafdelacruz', 'rafael.delacruz@example.com', '$2b$10$I0mFST1SDsoZR7NJxKEljOeIOTwjSzhUazi8FR.7OFbD9n5oHhqAe', 'RAFAEL SANTOS DELA CRUZ', 'patient', 'active', '550e8400-e29b-41d4-a716-446655440000', '0917-452-8391', '2025-11-29 11:00:22', 0, NULL, 0, '2025-11-29 08:15:50', '2025-11-29 08:15:50', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_facility_assignments`
--

CREATE TABLE `user_facility_assignments` (
  `assignment_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `facility_id` char(36) NOT NULL,
  `is_primary` tinyint(1) DEFAULT 0,
  `assigned_at` datetime DEFAULT current_timestamp(),
  `assigned_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_facility_assignments`
--

INSERT INTO `user_facility_assignments` (`assignment_id`, `user_id`, `facility_id`, `is_primary`, `assigned_at`, `assigned_by`) VALUES
('assign-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440000', 1, '2025-11-29 10:16:18', '11111111-1111-1111-1111-111111111111'),
('assign-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', 1, '2025-11-29 10:16:18', '11111111-1111-1111-1111-111111111111'),
('assign-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000', 1, '2025-11-29 10:16:18', '11111111-1111-1111-1111-111111111111'),
('assign-0000-0000-0000-000000000004', '44444444-4444-4444-4444-444444444444', '550e8400-e29b-41d4-a716-446655440000', 1, '2025-11-29 10:16:18', '11111111-1111-1111-1111-111111111111'),
('assign-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555555', '550e8400-e29b-41d4-a716-446655440000', 1, '2025-11-29 10:16:18', '11111111-1111-1111-1111-111111111111'),
('assign-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440001', 0, '2025-11-29 10:16:18', '11111111-1111-1111-1111-111111111111'),
('assign-0000-0000-0000-000000000007', '33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440002', 0, '2025-11-29 10:16:18', '11111111-1111-1111-1111-111111111111');

-- --------------------------------------------------------

--
-- Table structure for table `user_roles`
--

CREATE TABLE `user_roles` (
  `user_role_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `role_id` char(36) NOT NULL,
  `assigned_at` datetime DEFAULT current_timestamp(),
  `assigned_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_roles`
--

INSERT INTO `user_roles` (`user_role_id`, `user_id`, `role_id`, `assigned_at`, `assigned_by`) VALUES
('ur-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'role-0000-0000-0000-000000000001', '2025-11-16 12:18:30', '11111111-1111-1111-1111-111111111111'),
('ur-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'role-0000-0000-0000-000000000002', '2025-11-16 12:18:30', '11111111-1111-1111-1111-111111111111'),
('ur-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 'role-0000-0000-0000-000000000003', '2025-11-16 12:18:30', '11111111-1111-1111-1111-111111111111'),
('ur-0000-0000-0000-000000000004', '44444444-4444-4444-4444-444444444444', 'role-0000-0000-0000-000000000004', '2025-11-16 12:18:30', '11111111-1111-1111-1111-111111111111'),
('ur-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555555', 'role-0000-0000-0000-000000000005', '2025-11-16 12:18:30', '11111111-1111-1111-1111-111111111111'),
('ur-0000-0000-0000-000000000006', '66666666-6666-6666-6666-666666666666', 'role-0000-0000-0000-000000000006', '2025-11-16 12:18:30', '11111111-1111-1111-1111-111111111111');

-- --------------------------------------------------------

--
-- Table structure for table `vaccination_records`
--

CREATE TABLE `vaccination_records` (
  `vaccination_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `vaccine_id` char(36) NOT NULL,
  `provider_id` char(36) NOT NULL,
  `facility_id` char(36) NOT NULL,
  `dose_number` int(11) NOT NULL,
  `total_doses` int(11) NOT NULL,
  `date_given` date DEFAULT curdate(),
  `next_dose_due` date DEFAULT NULL,
  `lot_number` varchar(50) DEFAULT NULL,
  `administration_site` enum('left_arm','right_arm','left_thigh','right_thigh','other') DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('complete','in_progress','due_soon','overdue') DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vaccine_catalog`
--

CREATE TABLE `vaccine_catalog` (
  `vaccine_id` char(36) NOT NULL,
  `vaccine_name` varchar(150) NOT NULL,
  `manufacturer` varchar(100) DEFAULT NULL,
  `series_length` int(11) NOT NULL,
  `dose_intervals` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`dose_intervals`)),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vital_signs`
--

CREATE TABLE `vital_signs` (
  `vital_id` char(36) NOT NULL,
  `visit_id` char(36) NOT NULL,
  `height_cm` decimal(5,2) DEFAULT NULL,
  `weight_kg` decimal(5,2) DEFAULT NULL,
  `bmi` decimal(5,2) DEFAULT NULL,
  `systolic_bp` int(11) DEFAULT NULL,
  `diastolic_bp` int(11) DEFAULT NULL,
  `pulse_rate` int(11) DEFAULT NULL,
  `temperature_c` decimal(4,1) DEFAULT NULL,
  `respiratory_rate` int(11) DEFAULT NULL,
  `oxygen_saturation` decimal(4,1) DEFAULT NULL,
  `recorded_at` datetime DEFAULT current_timestamp(),
  `recorded_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vital_signs`
--

INSERT INTO `vital_signs` (`vital_id`, `visit_id`, `height_cm`, `weight_kg`, `bmi`, `systolic_bp`, `diastolic_bp`, `pulse_rate`, `temperature_c`, `respiratory_rate`, `oxygen_saturation`, `recorded_at`, `recorded_by`) VALUES
('1477eb9e-9d35-4e2b-a87e-4e5f6d5ea4a4', '30db2922-7990-4de8-ae4c-33df3ecf37c6', 173.00, 67.00, 22.39, 118, 76, 78, 36.7, 18, NULL, '2025-11-29 08:26:45', '22222222-2222-2222-2222-222222222222'),
('v1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 175.00, 72.50, 23.67, 120, 80, 72, 36.8, 18, 98.0, '2025-01-10 09:30:00', '22222222-2222-2222-2222-222222222222'),
('v2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 175.00, 73.00, 23.84, 118, 78, 70, 36.6, 16, 99.0, '2025-01-24 10:15:00', '22222222-2222-2222-2222-222222222222'),
('v3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 175.00, 72.80, 23.75, 122, 82, 74, 36.7, 17, 98.5, '2025-02-15 14:20:00', '42356bf7-84ef-4aaa-9610-d74b65c3929f'),
('v4444444-4444-4444-4444-444444444444', 'a4444444-4444-4444-4444-444444444444', 175.00, 73.20, 23.90, 119, 79, 71, 36.6, 16, 99.0, '2025-03-20 11:00:00', '22222222-2222-2222-2222-222222222222'),
('v5555555-5555-5555-5555-555555555555', 'b1111111-1111-1111-1111-111111111111', 165.00, 58.00, 21.32, 110, 70, 78, 36.9, 20, 98.0, '2025-02-05 13:45:00', '42356bf7-84ef-4aaa-9610-d74b65c3929f'),
('v6666666-6666-6666-6666-666666666666', 'b2222222-2222-2222-2222-222222222222', 165.00, 57.50, 21.12, 115, 75, 88, 38.5, 22, 94.0, '2025-02-28 16:30:00', '22222222-2222-2222-2222-222222222222'),
('v7777777-7777-7777-7777-777777777777', 'b3333333-3333-3333-3333-333333333333', 165.00, 58.20, 21.40, 112, 72, 76, 36.7, 18, 98.5, '2025-03-15 10:00:00', '42356bf7-84ef-4aaa-9610-d74b65c3929f'),
('v8888888-8888-8888-8888-888888888888', 'b4444444-4444-4444-4444-444444444444', 165.00, 58.50, 21.50, 111, 71, 75, 36.6, 17, 99.0, '2025-04-10 09:15:00', '42356bf7-84ef-4aaa-9610-d74b65c3929f');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`appointment_id`),
  ADD KEY `idx_appointments_patient_id` (`patient_id`),
  ADD KEY `idx_appointments_provider_id` (`provider_id`),
  ADD KEY `idx_appointments_facility_id` (`facility_id`),
  ADD KEY `idx_appointments_scheduled_start` (`scheduled_start`),
  ADD KEY `idx_appointments_scheduled_start_desc` (`scheduled_start`),
  ADD KEY `idx_appointments_status` (`status`);

--
-- Indexes for table `appointment_reminders`
--
ALTER TABLE `appointment_reminders`
  ADD PRIMARY KEY (`reminder_id`),
  ADD KEY `idx_appointment_reminders_appointment_id` (`appointment_id`),
  ADD KEY `idx_appointment_reminders_status` (`status`),
  ADD KEY `idx_appointment_reminders_scheduled_at` (`reminder_scheduled_at`);

--
-- Indexes for table `appointment_requests`
--
ALTER TABLE `appointment_requests`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `idx_appointment_requests_patient_id` (`patient_id`),
  ADD KEY `idx_appointment_requests_facility_id` (`facility_id`),
  ADD KEY `idx_appointment_requests_provider_id` (`provider_id`),
  ADD KEY `idx_appointment_requests_status` (`status`),
  ADD KEY `idx_appointment_requests_requested_date` (`requested_date`),
  ADD KEY `idx_appointment_requests_reviewed_by` (`reviewed_by`);

--
-- Indexes for table `appointment_requests_backup`
--
ALTER TABLE `appointment_requests_backup`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `idx_request_patient` (`patient_id`),
  ADD KEY `idx_request_status` (`status`),
  ADD KEY `idx_request_facility` (`preferred_facility_id`),
  ADD KEY `idx_request_appointment` (`appointment_id`),
  ADD KEY `idx_request_reviewer` (`reviewer_id`),
  ADD KEY `idx_request_created` (`created_at`);

--
-- Indexes for table `art_regimens`
--
ALTER TABLE `art_regimens`
  ADD PRIMARY KEY (`regimen_id`),
  ADD UNIQUE KEY `regimen_code` (`regimen_code`);

--
-- Indexes for table `art_regimen_drugs`
--
ALTER TABLE `art_regimen_drugs`
  ADD PRIMARY KEY (`regimen_drug_id`),
  ADD KEY `idx_regimen_drugs_regimen_id` (`regimen_id`),
  ADD KEY `idx_regimen_drugs_medication_id` (`medication_id`);

--
-- Indexes for table `art_regimen_history`
--
ALTER TABLE `art_regimen_history`
  ADD PRIMARY KEY (`history_id`),
  ADD KEY `performed_by` (`performed_by`),
  ADD KEY `idx_art_regimen_history_regimen_id` (`regimen_id`),
  ADD KEY `idx_art_regimen_history_action_date` (`action_date`),
  ADD KEY `idx_art_regimen_history_action_type` (`action_type`);

--
-- Indexes for table `audit_log`
--
ALTER TABLE `audit_log`
  ADD PRIMARY KEY (`audit_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_module` (`module`),
  ADD KEY `idx_timestamp` (`timestamp`),
  ADD KEY `idx_entity` (`entity_type`,`entity_id`);

--
-- Indexes for table `auth_sessions`
--
ALTER TABLE `auth_sessions`
  ADD PRIMARY KEY (`session_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `availability_slots`
--
ALTER TABLE `availability_slots`
  ADD PRIMARY KEY (`slot_id`),
  ADD KEY `idx_availability_slots_provider_id` (`provider_id`),
  ADD KEY `idx_availability_slots_facility_id` (`facility_id`),
  ADD KEY `idx_availability_slots_date` (`slot_date`),
  ADD KEY `idx_availability_slots_status` (`slot_status`),
  ADD KEY `idx_availability_slots_assignment_id` (`assignment_id`),
  ADD KEY `idx_availability_slots_lock_status` (`lock_status`);

--
-- Indexes for table `care_tasks`
--
ALTER TABLE `care_tasks`
  ADD PRIMARY KEY (`task_id`),
  ADD KEY `referral_id` (`referral_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `assignee_id` (`assignee_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_care_tasks_due_date` (`due_date`),
  ADD KEY `idx_care_tasks_status` (`status`);

--
-- Indexes for table `client_types`
--
ALTER TABLE `client_types`
  ADD PRIMARY KEY (`client_type_id`),
  ADD UNIQUE KEY `idx_client_types_code` (`type_code`),
  ADD KEY `idx_client_types_is_active` (`is_active`);

--
-- Indexes for table `clinical_visits`
--
ALTER TABLE `clinical_visits`
  ADD PRIMARY KEY (`visit_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `provider_id` (`provider_id`),
  ADD KEY `facility_id` (`facility_id`),
  ADD KEY `idx_clinical_visits_visit_date` (`visit_date`);

--
-- Indexes for table `counseling_sessions`
--
ALTER TABLE `counseling_sessions`
  ADD PRIMARY KEY (`session_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `counselor_id` (`counselor_id`),
  ADD KEY `facility_id` (`facility_id`),
  ADD KEY `idx_counseling_sessions_session_date` (`session_date`);

--
-- Indexes for table `dashboard_cache`
--
ALTER TABLE `dashboard_cache`
  ADD PRIMARY KEY (`cache_id`),
  ADD KEY `idx_dashboard_cache_widget_id` (`widget_id`),
  ADD KEY `idx_dashboard_cache_expires_at` (`expires_at`);

--
-- Indexes for table `diagnoses`
--
ALTER TABLE `diagnoses`
  ADD PRIMARY KEY (`diagnosis_id`),
  ADD KEY `visit_id` (`visit_id`),
  ADD KEY `idx_diagnoses_icd10_code` (`icd10_code`);

--
-- Indexes for table `dispense_events`
--
ALTER TABLE `dispense_events`
  ADD PRIMARY KEY (`dispense_id`),
  ADD KEY `idx_dispense_prescription_id` (`prescription_id`),
  ADD KEY `idx_dispense_prescription_item_id` (`prescription_item_id`),
  ADD KEY `idx_dispense_nurse_id` (`nurse_id`),
  ADD KEY `idx_dispense_facility_id` (`facility_id`);

--
-- Indexes for table `doctor_assignments`
--
ALTER TABLE `doctor_assignments`
  ADD PRIMARY KEY (`assignment_id`),
  ADD UNIQUE KEY `unique_doctor_date` (`doctor_id`,`assignment_date`),
  ADD KEY `idx_doctor_assignments_doctor_id` (`doctor_id`),
  ADD KEY `idx_doctor_assignments_facility_id` (`facility_id`),
  ADD KEY `idx_doctor_assignments_date` (`assignment_date`),
  ADD KEY `idx_doctor_assignments_is_locked` (`is_locked`);

--
-- Indexes for table `doctor_assignments_backup`
--
ALTER TABLE `doctor_assignments_backup`
  ADD PRIMARY KEY (`assignment_id`),
  ADD KEY `provider_id` (`provider_id`),
  ADD KEY `facility_id` (`facility_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_assignments_dates` (`start_date`,`end_date`),
  ADD KEY `idx_assignments_weekly` (`days_of_week`),
  ADD KEY `idx_assignments_schedule` (`daily_start`,`daily_end`);

--
-- Indexes for table `doctor_conflicts`
--
ALTER TABLE `doctor_conflicts`
  ADD PRIMARY KEY (`conflict_id`),
  ADD KEY `idx_doctor_conflicts_doctor_id` (`doctor_id`),
  ADD KEY `idx_doctor_conflicts_date` (`conflict_date`),
  ADD KEY `idx_doctor_conflicts_type` (`conflict_type`);

--
-- Indexes for table `doctor_conflicts_backup`
--
ALTER TABLE `doctor_conflicts_backup`
  ADD PRIMARY KEY (`conflict_id`),
  ADD KEY `assignment_id` (`assignment_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_conflicts_dates` (`conflict_start`,`conflict_end`);

--
-- Indexes for table `facilities`
--
ALTER TABLE `facilities`
  ADD PRIMARY KEY (`facility_id`),
  ADD KEY `idx_facilities_name` (`facility_name`),
  ADD KEY `idx_facilities_type` (`facility_type`),
  ADD KEY `idx_facilities_is_active` (`is_active`),
  ADD KEY `idx_facilities_region_id` (`region_id`);

--
-- Indexes for table `faqs`
--
ALTER TABLE `faqs`
  ADD PRIMARY KEY (`faq_id`),
  ADD KEY `idx_faqs_category` (`category`),
  ADD KEY `idx_faqs_is_published` (`is_published`),
  ADD KEY `idx_faqs_display_order` (`display_order`);

--
-- Indexes for table `feedback`
--
ALTER TABLE `feedback`
  ADD PRIMARY KEY (`feedback_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `staff_id` (`staff_id`);

--
-- Indexes for table `forum_attachments`
--
ALTER TABLE `forum_attachments`
  ADD PRIMARY KEY (`attachment_id`),
  ADD KEY `post_id` (`post_id`),
  ADD KEY `uploaded_by` (`uploaded_by`);

--
-- Indexes for table `forum_categories`
--
ALTER TABLE `forum_categories`
  ADD PRIMARY KEY (`category_id`),
  ADD UNIQUE KEY `category_code` (`category_code`),
  ADD KEY `idx_forum_categories_code` (`category_code`),
  ADD KEY `idx_forum_categories_is_active` (`is_active`);

--
-- Indexes for table `forum_posts`
--
ALTER TABLE `forum_posts`
  ADD PRIMARY KEY (`post_id`),
  ADD KEY `topic_id` (`topic_id`),
  ADD KEY `author_id` (`author_id`),
  ADD KEY `parent_post_id` (`parent_post_id`),
  ADD KEY `idx_parent_post_id` (`parent_post_id`),
  ADD KEY `idx_forum_posts_topic_id` (`topic_id`),
  ADD KEY `idx_forum_posts_author_id` (`author_id`),
  ADD KEY `idx_forum_posts_parent_post_id` (`parent_post_id`);

--
-- Indexes for table `forum_reactions`
--
ALTER TABLE `forum_reactions`
  ADD PRIMARY KEY (`reaction_id`),
  ADD UNIQUE KEY `uq_reaction` (`post_id`,`user_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_forum_reactions_post_id` (`post_id`),
  ADD KEY `idx_forum_reactions_user_id` (`user_id`);

--
-- Indexes for table `forum_replies`
--
ALTER TABLE `forum_replies`
  ADD PRIMARY KEY (`reply_id`),
  ADD KEY `idx_forum_replies_post_id` (`post_id`),
  ADD KEY `idx_forum_replies_patient_id` (`patient_id`),
  ADD KEY `idx_forum_replies_created_at` (`created_at`);

--
-- Indexes for table `forum_threads`
--
ALTER TABLE `forum_threads`
  ADD PRIMARY KEY (`thread_id`),
  ADD KEY `group_id` (`group_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `forum_topics`
--
ALTER TABLE `forum_topics`
  ADD PRIMARY KEY (`topic_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_last_post_at` (`last_post_at`),
  ADD KEY `idx_forum_topics_created_by` (`created_by`),
  ADD KEY `idx_forum_topics_status` (`status`),
  ADD KEY `idx_forum_topics_category` (`category`),
  ADD KEY `idx_forum_topics_last_post_at` (`last_post_at`);

--
-- Indexes for table `groups`
--
ALTER TABLE `groups`
  ADD PRIMARY KEY (`group_id`),
  ADD KEY `facility_id` (`facility_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `group_memberships`
--
ALTER TABLE `group_memberships`
  ADD PRIMARY KEY (`membership_id`),
  ADD UNIQUE KEY `uq_group_user` (`group_id`,`user_id`,`patient_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `joined_by` (`joined_by`);

--
-- Indexes for table `hts_sessions`
--
ALTER TABLE `hts_sessions`
  ADD PRIMARY KEY (`hts_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `tester_id` (`tester_id`),
  ADD KEY `facility_id` (`facility_id`),
  ADD KEY `idx_hts_sessions_test_date` (`test_date`),
  ADD KEY `idx_hts_sessions_test_result` (`test_result`);

--
-- Indexes for table `inventory_alerts`
--
ALTER TABLE `inventory_alerts`
  ADD PRIMARY KEY (`alert_id`),
  ADD KEY `idx_alerts_inventory_id` (`inventory_id`),
  ADD KEY `idx_alerts_type` (`alert_type`),
  ADD KEY `idx_alerts_level` (`alert_level`);

--
-- Indexes for table `inventory_items`
--
ALTER TABLE `inventory_items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `inventory_orders`
--
ALTER TABLE `inventory_orders`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `idx_inventory_orders_facility_id` (`facility_id`),
  ADD KEY `idx_inventory_orders_supplier_id` (`supplier_id`),
  ADD KEY `idx_inventory_orders_status` (`status`),
  ADD KEY `idx_inventory_orders_order_date` (`order_date`),
  ADD KEY `idx_inventory_orders_ordered_by` (`ordered_by`),
  ADD KEY `inventory_orders_ibfk_4` (`received_by`);

--
-- Indexes for table `inventory_order_items`
--
ALTER TABLE `inventory_order_items`
  ADD PRIMARY KEY (`order_item_id`),
  ADD KEY `idx_order_items_order_id` (`order_id`),
  ADD KEY `idx_order_items_medication_id` (`medication_id`);

--
-- Indexes for table `inventory_suppliers`
--
ALTER TABLE `inventory_suppliers`
  ADD PRIMARY KEY (`supplier_id`),
  ADD KEY `idx_inventory_suppliers_name` (`supplier_name`),
  ADD KEY `idx_inventory_suppliers_is_active` (`is_active`);

--
-- Indexes for table `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  ADD PRIMARY KEY (`transaction_id`),
  ADD KEY `idx_transactions_inventory_id` (`inventory_id`),
  ADD KEY `idx_transactions_type` (`transaction_type`),
  ADD KEY `idx_transactions_date` (`transaction_date`);

--
-- Indexes for table `in_app_messages`
--
ALTER TABLE `in_app_messages`
  ADD PRIMARY KEY (`message_id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `recipient_id` (`recipient_id`),
  ADD KEY `group_id` (`group_id`);

--
-- Indexes for table `lab_files`
--
ALTER TABLE `lab_files`
  ADD PRIMARY KEY (`file_id`),
  ADD KEY `idx_lab_files_result_id` (`result_id`),
  ADD KEY `uploaded_by` (`uploaded_by`);

--
-- Indexes for table `lab_orders`
--
ALTER TABLE `lab_orders`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `idx_lab_orders_patient_id` (`patient_id`),
  ADD KEY `ordering_provider_id` (`ordering_provider_id`),
  ADD KEY `facility_id` (`facility_id`),
  ADD KEY `idx_lab_orders_order_date` (`order_date`),
  ADD KEY `idx_lab_orders_status` (`status`);

--
-- Indexes for table `lab_results`
--
ALTER TABLE `lab_results`
  ADD PRIMARY KEY (`result_id`),
  ADD KEY `idx_lab_results_order_id` (`order_id`),
  ADD KEY `idx_lab_results_patient_id` (`patient_id`),
  ADD KEY `reviewer_id` (`reviewer_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_lab_results_test_code` (`test_code`),
  ADD KEY `idx_lab_results_reported_at` (`reported_at`),
  ADD KEY `idx_lab_results_is_critical` (`is_critical`);

--
-- Indexes for table `learning_modules`
--
ALTER TABLE `learning_modules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `medications`
--
ALTER TABLE `medications`
  ADD PRIMARY KEY (`medication_id`);

--
-- Indexes for table `medication_adherence`
--
ALTER TABLE `medication_adherence`
  ADD PRIMARY KEY (`adherence_id`),
  ADD KEY `idx_adherence_prescription_id` (`prescription_id`),
  ADD KEY `idx_adherence_patient_id` (`patient_id`),
  ADD KEY `idx_adherence_date` (`adherence_date`);

--
-- Indexes for table `medication_inventory`
--
ALTER TABLE `medication_inventory`
  ADD PRIMARY KEY (`inventory_id`),
  ADD KEY `idx_inventory_medication_id` (`medication_id`),
  ADD KEY `idx_inventory_facility_id` (`facility_id`),
  ADD KEY `idx_inventory_expiry_date` (`expiry_date`),
  ADD KEY `idx_inventory_batch_number` (`batch_number`);

--
-- Indexes for table `medication_reminders`
--
ALTER TABLE `medication_reminders`
  ADD PRIMARY KEY (`reminder_id`),
  ADD KEY `idx_reminders_prescription_id` (`prescription_id`),
  ADD KEY `idx_reminders_patient_id` (`patient_id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`message_id`),
  ADD KEY `thread_id` (`thread_id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `recipient_id` (`recipient_id`);

--
-- Indexes for table `message_threads`
--
ALTER TABLE `message_threads`
  ADD PRIMARY KEY (`thread_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `mfa_tokens`
--
ALTER TABLE `mfa_tokens`
  ADD PRIMARY KEY (`mfa_token_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `recipient_id` (`recipient_id`);

--
-- Indexes for table `patients`
--
ALTER TABLE `patients`
  ADD PRIMARY KEY (`patient_id`),
  ADD UNIQUE KEY `uic` (`uic`),
  ADD KEY `facility_id` (`facility_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `patient_art_history`
--
ALTER TABLE `patient_art_history`
  ADD PRIMARY KEY (`history_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `regimen_id` (`regimen_id`),
  ADD KEY `recorded_by` (`recorded_by`);

--
-- Indexes for table `patient_art_regimens`
--
ALTER TABLE `patient_art_regimens`
  ADD PRIMARY KEY (`regimen_id`),
  ADD KEY `idx_art_regimens_patient_id` (`patient_id`),
  ADD KEY `idx_art_regimens_status` (`status`),
  ADD KEY `idx_art_regimens_start_date` (`start_date`),
  ADD KEY `idx_art_regimens_provider_id` (`provider_id`),
  ADD KEY `idx_art_regimens_facility_id` (`facility_id`);

--
-- Indexes for table `patient_documents`
--
ALTER TABLE `patient_documents`
  ADD PRIMARY KEY (`document_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `uploaded_by` (`uploaded_by`);

--
-- Indexes for table `patient_identifiers`
--
ALTER TABLE `patient_identifiers`
  ADD PRIMARY KEY (`identifier_id`),
  ADD KEY `patient_id` (`patient_id`);

--
-- Indexes for table `patient_risk_scores`
--
ALTER TABLE `patient_risk_scores`
  ADD PRIMARY KEY (`risk_score_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `calculated_by` (`calculated_by`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`permission_id`),
  ADD UNIQUE KEY `permission_code` (`permission_code`);

--
-- Indexes for table `prescriptions`
--
ALTER TABLE `prescriptions`
  ADD PRIMARY KEY (`prescription_id`),
  ADD KEY `idx_prescriptions_patient_id` (`patient_id`),
  ADD KEY `idx_prescriptions_prescriber_id` (`prescriber_id`),
  ADD KEY `idx_prescriptions_facility_id` (`facility_id`),
  ADD KEY `idx_prescriptions_status` (`status`);

--
-- Indexes for table `prescription_items`
--
ALTER TABLE `prescription_items`
  ADD PRIMARY KEY (`prescription_item_id`),
  ADD KEY `idx_prescription_items_prescription_id` (`prescription_id`),
  ADD KEY `idx_prescription_items_medication_id` (`medication_id`);

--
-- Indexes for table `procedures`
--
ALTER TABLE `procedures`
  ADD PRIMARY KEY (`procedure_id`),
  ADD KEY `visit_id` (`visit_id`);

--
-- Indexes for table `program_indicators`
--
ALTER TABLE `program_indicators`
  ADD PRIMARY KEY (`indicator_id`),
  ADD UNIQUE KEY `indicator_code` (`indicator_code`),
  ADD KEY `facility_id` (`facility_id`);

--
-- Indexes for table `referrals`
--
ALTER TABLE `referrals`
  ADD PRIMARY KEY (`referral_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `from_facility_id` (`from_facility_id`),
  ADD KEY `to_facility_id` (`to_facility_id`),
  ADD KEY `referred_by` (`referred_by`),
  ADD KEY `accepted_by` (`accepted_by`),
  ADD KEY `idx_referrals_status` (`status`),
  ADD KEY `idx_referrals_referred_at` (`referred_at`);

--
-- Indexes for table `refill_requests`
--
ALTER TABLE `refill_requests`
  ADD PRIMARY KEY (`refill_id`),
  ADD KEY `idx_refill_requests_patient_id` (`patient_id`),
  ADD KEY `idx_refill_requests_prescription_id` (`prescription_id`),
  ADD KEY `idx_refill_requests_medication_id` (`medication_id`),
  ADD KEY `idx_refill_requests_facility_id` (`facility_id`),
  ADD KEY `idx_refill_requests_status` (`status`),
  ADD KEY `idx_refill_requests_submitted_at` (`submitted_at`),
  ADD KEY `fk_refill_requests_processed_by` (`processed_by`),
  ADD KEY `fk_refill_requests_dispensed_by` (`dispensed_by`);

--
-- Indexes for table `regions`
--
ALTER TABLE `regions`
  ADD PRIMARY KEY (`region_id`),
  ADD UNIQUE KEY `idx_regions_code` (`region_code`),
  ADD KEY `idx_regions_is_active` (`is_active`);

--
-- Indexes for table `remote_monitoring_data`
--
ALTER TABLE `remote_monitoring_data`
  ADD PRIMARY KEY (`data_id`),
  ADD KEY `device_id` (`device_id`),
  ADD KEY `patient_id` (`patient_id`);

--
-- Indexes for table `remote_monitoring_devices`
--
ALTER TABLE `remote_monitoring_devices`
  ADD PRIMARY KEY (`device_id`),
  ADD KEY `patient_id` (`patient_id`);

--
-- Indexes for table `report_queries`
--
ALTER TABLE `report_queries`
  ADD PRIMARY KEY (`report_id`),
  ADD KEY `idx_report_queries_report_type` (`report_type`),
  ADD KEY `idx_report_queries_owner_id` (`owner_id`);

--
-- Indexes for table `report_runs`
--
ALTER TABLE `report_runs`
  ADD PRIMARY KEY (`run_id`),
  ADD KEY `idx_report_runs_report_id` (`report_id`),
  ADD KEY `idx_report_runs_started_at` (`started_at`),
  ADD KEY `idx_report_runs_status` (`status`),
  ADD KEY `idx_report_runs_run_by` (`run_by`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`role_id`),
  ADD UNIQUE KEY `role_code` (`role_code`);

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`role_permission_id`),
  ADD UNIQUE KEY `role_id` (`role_id`,`permission_id`),
  ADD KEY `permission_id` (`permission_id`);

--
-- Indexes for table `sms_queue`
--
ALTER TABLE `sms_queue`
  ADD PRIMARY KEY (`sms_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `stock_entries`
--
ALTER TABLE `stock_entries`
  ADD PRIMARY KEY (`stock_id`),
  ADD KEY `item_id` (`item_id`),
  ADD KEY `facility_id` (`facility_id`),
  ADD KEY `supplier_id` (`supplier_id`),
  ADD KEY `received_by` (`received_by`);

--
-- Indexes for table `stock_movements`
--
ALTER TABLE `stock_movements`
  ADD PRIMARY KEY (`movement_id`),
  ADD KEY `item_id` (`item_id`),
  ADD KEY `from_facility_id` (`from_facility_id`),
  ADD KEY `to_facility_id` (`to_facility_id`),
  ADD KEY `moved_by` (`moved_by`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`supplier_id`);

--
-- Indexes for table `survey_metrics`
--
ALTER TABLE `survey_metrics`
  ADD PRIMARY KEY (`metric_id`),
  ADD KEY `idx_survey_metrics_facility_id` (`facility_id`),
  ADD KEY `idx_survey_metrics_period` (`period_start`,`period_end`);

--
-- Indexes for table `survey_responses`
--
ALTER TABLE `survey_responses`
  ADD PRIMARY KEY (`survey_id`),
  ADD KEY `idx_survey_responses_patient_id` (`patient_id`),
  ADD KEY `idx_survey_responses_facility_id` (`facility_id`),
  ADD KEY `idx_survey_responses_submitted_at` (`submitted_at`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`setting_key`),
  ADD KEY `idx_system_settings_updated_by` (`updated_by`);

--
-- Indexes for table `teleconsultations`
--
ALTER TABLE `teleconsultations`
  ADD PRIMARY KEY (`consult_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `provider_id` (`provider_id`),
  ADD KEY `facility_id` (`facility_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `teleconsult_notes`
--
ALTER TABLE `teleconsult_notes`
  ADD PRIMARY KEY (`note_id`),
  ADD KEY `consult_id` (`consult_id`),
  ADD KEY `author_id` (`author_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `facility_id` (`facility_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `user_facility_assignments`
--
ALTER TABLE `user_facility_assignments`
  ADD PRIMARY KEY (`assignment_id`),
  ADD UNIQUE KEY `idx_user_facility_unique` (`user_id`,`facility_id`),
  ADD KEY `idx_user_facility_assignments_user_id` (`user_id`),
  ADD KEY `idx_user_facility_assignments_facility_id` (`facility_id`),
  ADD KEY `idx_user_facility_assignments_assigned_by` (`assigned_by`);

--
-- Indexes for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`user_role_id`),
  ADD UNIQUE KEY `user_id` (`user_id`,`role_id`),
  ADD KEY `role_id` (`role_id`),
  ADD KEY `assigned_by` (`assigned_by`);

--
-- Indexes for table `vaccination_records`
--
ALTER TABLE `vaccination_records`
  ADD PRIMARY KEY (`vaccination_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `vaccine_id` (`vaccine_id`),
  ADD KEY `provider_id` (`provider_id`),
  ADD KEY `facility_id` (`facility_id`);

--
-- Indexes for table `vaccine_catalog`
--
ALTER TABLE `vaccine_catalog`
  ADD PRIMARY KEY (`vaccine_id`);

--
-- Indexes for table `vital_signs`
--
ALTER TABLE `vital_signs`
  ADD PRIMARY KEY (`vital_id`),
  ADD KEY `visit_id` (`visit_id`),
  ADD KEY `recorded_by` (`recorded_by`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `client_types`
--
ALTER TABLE `client_types`
  MODIFY `client_type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `learning_modules`
--
ALTER TABLE `learning_modules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `regions`
--
ALTER TABLE `regions`
  MODIFY `region_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `art_regimen_drugs`
--
ALTER TABLE `art_regimen_drugs`
  ADD CONSTRAINT `art_regimen_drugs_ibfk_2` FOREIGN KEY (`medication_id`) REFERENCES `medications` (`medication_id`);

--
-- Constraints for table `art_regimen_history`
--
ALTER TABLE `art_regimen_history`
  ADD CONSTRAINT `art_regimen_history_ibfk_1` FOREIGN KEY (`regimen_id`) REFERENCES `patient_art_regimens` (`regimen_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `art_regimen_history_ibfk_2` FOREIGN KEY (`performed_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `dispense_events`
--
ALTER TABLE `dispense_events`
  ADD CONSTRAINT `fk_dispense_events_facility` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`),
  ADD CONSTRAINT `fk_dispense_events_nurse` FOREIGN KEY (`nurse_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `fk_dispense_events_prescription` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`prescription_id`),
  ADD CONSTRAINT `fk_dispense_events_prescription_item` FOREIGN KEY (`prescription_item_id`) REFERENCES `prescription_items` (`prescription_item_id`) ON DELETE SET NULL;

--
-- Constraints for table `facilities`
--
ALTER TABLE `facilities`
  ADD CONSTRAINT `fk_facilities_region` FOREIGN KEY (`region_id`) REFERENCES `regions` (`region_id`) ON DELETE SET NULL;

--
-- Constraints for table `forum_replies`
--
ALTER TABLE `forum_replies`
  ADD CONSTRAINT `forum_replies_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `forum_posts` (`post_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `forum_replies_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE SET NULL;

--
-- Constraints for table `inventory_alerts`
--
ALTER TABLE `inventory_alerts`
  ADD CONSTRAINT `inventory_alerts_ibfk_1` FOREIGN KEY (`inventory_id`) REFERENCES `medication_inventory` (`inventory_id`) ON DELETE CASCADE;

--
-- Constraints for table `inventory_orders`
--
ALTER TABLE `inventory_orders`
  ADD CONSTRAINT `inventory_orders_ibfk_1` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`),
  ADD CONSTRAINT `inventory_orders_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `inventory_suppliers` (`supplier_id`),
  ADD CONSTRAINT `inventory_orders_ibfk_3` FOREIGN KEY (`ordered_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `inventory_orders_ibfk_4` FOREIGN KEY (`received_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `inventory_order_items`
--
ALTER TABLE `inventory_order_items`
  ADD CONSTRAINT `inventory_order_items_ibfk_2` FOREIGN KEY (`medication_id`) REFERENCES `medications` (`medication_id`);

--
-- Constraints for table `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  ADD CONSTRAINT `inventory_transactions_ibfk_1` FOREIGN KEY (`inventory_id`) REFERENCES `medication_inventory` (`inventory_id`) ON DELETE CASCADE;

--
-- Constraints for table `lab_files`
--
ALTER TABLE `lab_files`
  ADD CONSTRAINT `fk_lab_files_result` FOREIGN KEY (`result_id`) REFERENCES `lab_results` (`result_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_lab_files_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `lab_orders`
--
ALTER TABLE `lab_orders`
  ADD CONSTRAINT `fk_lab_orders_facility` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`),
  ADD CONSTRAINT `fk_lab_orders_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`),
  ADD CONSTRAINT `fk_lab_orders_provider` FOREIGN KEY (`ordering_provider_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `lab_results`
--
ALTER TABLE `lab_results`
  ADD CONSTRAINT `fk_lab_results_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `fk_lab_results_order` FOREIGN KEY (`order_id`) REFERENCES `lab_orders` (`order_id`),
  ADD CONSTRAINT `fk_lab_results_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`),
  ADD CONSTRAINT `fk_lab_results_reviewer` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `learning_modules`
--
ALTER TABLE `learning_modules`
  ADD CONSTRAINT `learning_modules_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `medication_adherence`
--
ALTER TABLE `medication_adherence`
  ADD CONSTRAINT `fk_medication_adherence_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`),
  ADD CONSTRAINT `fk_medication_adherence_prescription` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`prescription_id`);

--
-- Constraints for table `medication_inventory`
--
ALTER TABLE `medication_inventory`
  ADD CONSTRAINT `fk_inventory_facility` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`),
  ADD CONSTRAINT `fk_inventory_medication` FOREIGN KEY (`medication_id`) REFERENCES `medications` (`medication_id`);

--
-- Constraints for table `medication_reminders`
--
ALTER TABLE `medication_reminders`
  ADD CONSTRAINT `fk_medication_reminders_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`),
  ADD CONSTRAINT `fk_medication_reminders_prescription` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`prescription_id`) ON DELETE SET NULL;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_recipient` FOREIGN KEY (`recipient_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `patient_art_regimens`
--
ALTER TABLE `patient_art_regimens`
  ADD CONSTRAINT `patient_art_regimens_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `patient_art_regimens_ibfk_2` FOREIGN KEY (`provider_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `patient_art_regimens_ibfk_3` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`);

--
-- Constraints for table `prescriptions`
--
ALTER TABLE `prescriptions`
  ADD CONSTRAINT `fk_prescriptions_facility` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`),
  ADD CONSTRAINT `fk_prescriptions_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`),
  ADD CONSTRAINT `fk_prescriptions_prescriber` FOREIGN KEY (`prescriber_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `prescription_items`
--
ALTER TABLE `prescription_items`
  ADD CONSTRAINT `fk_prescription_items_medication` FOREIGN KEY (`medication_id`) REFERENCES `medications` (`medication_id`),
  ADD CONSTRAINT `fk_prescription_items_prescription` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`prescription_id`) ON DELETE CASCADE;

--
-- Constraints for table `refill_requests`
--
ALTER TABLE `refill_requests`
  ADD CONSTRAINT `fk_refill_requests_dispensed_by` FOREIGN KEY (`dispensed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_refill_requests_facility` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`),
  ADD CONSTRAINT `fk_refill_requests_medication` FOREIGN KEY (`medication_id`) REFERENCES `medications` (`medication_id`),
  ADD CONSTRAINT `fk_refill_requests_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`),
  ADD CONSTRAINT `fk_refill_requests_prescription` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`prescription_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_refill_requests_processed_by` FOREIGN KEY (`processed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `report_queries`
--
ALTER TABLE `report_queries`
  ADD CONSTRAINT `fk_report_queries_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `report_runs`
--
ALTER TABLE `report_runs`
  ADD CONSTRAINT `fk_report_runs_report` FOREIGN KEY (`report_id`) REFERENCES `report_queries` (`report_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_report_runs_user` FOREIGN KEY (`run_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `survey_metrics`
--
ALTER TABLE `survey_metrics`
  ADD CONSTRAINT `survey_metrics_ibfk_1` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`);

--
-- Constraints for table `survey_responses`
--
ALTER TABLE `survey_responses`
  ADD CONSTRAINT `survey_responses_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`),
  ADD CONSTRAINT `survey_responses_ibfk_2` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`);

--
-- Constraints for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD CONSTRAINT `fk_system_settings_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `user_facility_assignments`
--
ALTER TABLE `user_facility_assignments`
  ADD CONSTRAINT `fk_user_facility_assignments_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_user_facility_assignments_facility` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_user_facility_assignments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
