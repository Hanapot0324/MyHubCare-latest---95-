-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 27, 2025 at 01:44 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

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
  `booked_by` char(36) DEFAULT NULL,
  `booked_at` datetime DEFAULT current_timestamp(),
  `cancelled_at` datetime DEFAULT NULL,
  `cancelled_by` char(36) DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  CONSTRAINT `chk_no_same_day` CHECK (DATE(`scheduled_start`) >= (CURRENT_DATE + INTERVAL 1 DAY)),
  CONSTRAINT `chk_hourly_intervals` CHECK (MINUTE(`scheduled_start`) = 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`appointment_id`, `patient_id`, `provider_id`, `facility_id`, `appointment_type`, `scheduled_start`, `scheduled_end`, `duration_minutes`, `status`, `reason`, `notes`, `booked_by`, `booked_at`, `cancelled_at`, `cancelled_by`, `cancellation_reason`, `created_at`) VALUES
('35b25b6e-d897-4a87-9ecd-248eea47e09c', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '550e8400-e29b-41d4-a716-446655440002', 'follow_up', '2025-11-28 13:57:00', '2025-11-28 14:57:00', 60, 'scheduled', 'sdfgh', 'dfgh', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '2025-11-27 18:56:50', NULL, NULL, NULL, '2025-11-27 18:56:50'),
('3fce843b-72d9-4918-a223-f23b72b26876', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440001', 'initial', '2025-11-25 10:00:00', '2025-11-25 11:00:00', 60, 'confirmed', NULL, NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', '2025-11-24 17:11:13', NULL, NULL, NULL, '2025-11-24 17:11:13'),
('4fb003a0-5c34-438e-a1cf-54da19a0c792', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440001', 'initial', '2025-11-25 13:00:00', '2025-11-25 14:00:00', 60, 'confirmed', NULL, NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', '2025-11-24 17:34:14', NULL, NULL, NULL, '2025-11-24 17:34:14'),
('56c000c3-dd06-4002-adb2-58b841931147', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '550e8400-e29b-41d4-a716-446655440000', 'art_pickup', '2025-11-27 10:35:00', '2025-11-27 11:35:00', 60, 'cancelled', 'GAGA', 'GAGO', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '2025-11-27 11:35:44', '2025-11-27 11:36:16', '44444444-4444-4444-4444-444444444444', 'HAHA TANGA', '2025-11-27 11:35:44'),
('65248595-e59d-4d5f-a6fa-5d28d6d350ac', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440001', 'initial', '2025-11-28 10:53:00', '2025-11-28 11:53:00', 60, 'cancelled', 'qwerty', 'qwerty', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '2025-11-27 18:49:45', '2025-11-27 18:49:57', '44444444-4444-4444-4444-444444444444', '00000000000000000000000000', '2025-11-27 18:49:45'),
('a1a20ff3-3d0c-457f-9788-7ee0809ee959', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '550e8400-e29b-41d4-a716-446655440000', 'counseling', '2025-11-27 09:01:00', '2025-11-27 10:01:00', 60, 'cancelled', 'AGAY', 'ARAY MO', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '2025-11-27 11:26:30', '2025-11-27 11:30:28', '44444444-4444-4444-4444-444444444444', 'HAHAHAHAHHHA BALIW', '2025-11-27 11:26:30'),
('c4546682-ae74-4a23-b20a-7dd638c1a8b3', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440001', 'initial', '2025-11-25 11:00:00', '2025-11-25 11:30:00', 30, 'confirmed', NULL, NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', '2025-11-24 17:16:36', NULL, NULL, NULL, '2025-11-24 17:16:36'),
('cdfc9245-0d51-4db3-bb28-4d796956b5f9', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '550e8400-e29b-41d4-a716-446655440000', 'general', '2025-11-27 08:15:00', '2025-11-27 09:15:00', 60, 'confirmed', 'SAKIT', 'SAKIT TALAGA', '66666666-6666-6666-6666-666666666666', '2025-11-27 11:19:26', NULL, NULL, NULL, '2025-11-27 11:19:26'),
('e3b4f9aa-5e26-43d6-ad96-a7e257a3ff7a', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '550e8400-e29b-41d4-a716-446655440000', 'lab_test', '2025-11-27 09:01:00', '2025-11-27 10:01:00', 60, 'confirmed', NULL, NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', '2025-11-27 11:32:49', NULL, NULL, NULL, '2025-11-27 11:32:49'),
('e589dffc-2939-4ab5-ae2a-6cfaab870bed', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '550e8400-e29b-41d4-a716-446655440000', 'art_pickup', '2025-11-27 10:35:00', '2025-11-27 11:35:00', 60, 'cancelled', 'IDK', 'IDK', '66666666-6666-6666-6666-666666666666', '2025-11-27 12:01:11', '2025-11-27 18:48:34', '11111111-1111-1111-1111-111111111111', '11111111111111111111111111111111', '2025-11-27 12:01:11');

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
('02702403-1992-4370-8ac6-97516084c909', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-21 10:08:12', '2025-11-21 10:08:12'),
('03392b26-44f2-4c1c-82ad-a6c9906a048c', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 12:20:18', '2025-11-16 12:20:18'),
('06b72584-f0f3-45de-8080-64494af02a96', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 19:21:37', '2025-11-17 19:21:37'),
('06fdf698-d108-408d-93c4-436d33ae4e0b', '42356bf7-84ef-4aaa-9610-d74b65c3929f', 'Trixie Morales', 'physician', 'LOGIN', 'Authentication', 'user', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '42356bf7-84ef-4aaa-9610-d74b65c3929f', NULL, NULL, 'Successful login: Trixie', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 19:13:26', '2025-11-17 19:13:26'),
('0700e665-8777-4b4c-a556-7be63b53dd51', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 14:59:08', '2025-11-24 14:59:08'),
('07b74ec7-1085-4b03-b7bf-9add2a92726a', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 10:15:44', '2025-11-27 10:15:44'),
('08bbe860-6652-4fd0-ab8f-60a53d770e79', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-26 12:12:27', '2025-11-26 12:12:27'),
('0d2ebaf9-c6f5-41e6-8136-331411f46c5c', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Failed login attempt: Invalid password for Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-24 15:02:44', '2025-11-24 15:02:44'),
('0d4a3684-d109-4e94-a238-040b653eb68e', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 13:41:00', '2025-11-24 13:41:00'),
('0e93accf-e3b4-4906-b047-66813fed44b4', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 09:04:09', '2025-11-19 09:04:09'),
('0f91e41c-ed44-46f0-a635-a144f4fdfda7', '42356bf7-84ef-4aaa-9610-d74b65c3929f', 'Trixie Morales', 'patient', 'CREATE', 'Patients', 'patient', '2fe2674f-5147-4d96-8c68-54caa67efcfc', '2fe2674f-5147-4d96-8c68-54caa67efcfc', NULL, '{\"patient_id\":\"2fe2674f-5147-4d96-8c68-54caa67efcfc\",\"uic\":\"GRJO0110-05-2002\",\"first_name\":\"Trixie\",\"last_name\":\"Morales\",\"email\":\"hannasarabia879@gmail.com\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\"}', 'New patient registered: Trixie Morales (UIC: GRJO0110-05-2002)', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 16:14:27', '2025-11-17 16:14:27'),
('0fa830d3-03c7-413e-b0c0-2fc646d2dbd7', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', '8201188a-a4eb-4677-816f-08e0998056c2', NULL, NULL, NULL, NULL, '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Column \'dosage\' cannot be null', '2025-11-16 14:10:22', '2025-11-16 14:10:22'),
('1036bd54-5528-4981-9f91-6890893a68e8', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 16:08:07', '2025-11-17 16:08:07'),
('119f5ade-b725-4c64-a280-49d49a08e76f', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 13:05:07', '2025-11-27 13:05:07'),
('1242239c-0124-41ce-b5b8-deebb9065a79', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'DELETE', 'Lab Orders', 'lab_order', 'e4e5c4d0-e314-4c45-bf8f-bb3cacc27a9c', 'e4e5c4d0-e314-4c45-bf8f-bb3cacc27a9c', '{\"order_id\":\"e4e5c4d0-e314-4c45-bf8f-bb3cacc27a9c\",\"patient_id\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"ordering_provider_id\":\"11111111-1111-1111-1111-111111111111\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"order_date\":\"2025-11-15T16:00:00.000Z\",\"test_panel\":\"Viral Load\",\"priority\":\"urgent\",\"status\":\"in_progress\",\"collection_date\":\"2025-11-15T16:00:00.000Z\",\"notes\":null,\"created_at\":\"2025-11-16T13:35:53.000Z\"}', NULL, 'Cancelled lab order: Viral Load', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 12:26:31', '2025-11-17 12:26:31'),
('12d21f9a-8186-4364-9eb4-f55e7b909005', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-26 15:53:04', '2025-11-26 15:53:04'),
('1472466c-5aff-421b-b777-2fe173fcdec7', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 11:31:14', '2025-11-27 11:31:14'),
('15e29c92-6176-4615-b37e-fba337c9223b', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 16:41:52', '2025-11-24 16:41:52'),
('163563d4-5e84-4e83-abfe-4ded9a247f29', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'CREATE', 'Counseling Sessions', 'counseling_session', '051d4885-44d1-4770-9cdb-80baa79b3f9e', '051d4885-44d1-4770-9cdb-80baa79b3f9e', NULL, '{\"session_id\":\"051d4885-44d1-4770-9cdb-80baa79b3f9e\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"session_type\":\"adherence\",\"follow_up_required\":false}', 'Recorded adherence counseling session for patient 80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 15:29:34', '2025-11-19 15:29:34'),
('173b2384-b14e-4fde-8cfa-e02db75977e1', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-26 10:46:16', '2025-11-26 10:46:16'),
('181deffe-ea95-49d2-9955-27cf682a0f0a', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 12:30:32', '2025-11-16 12:30:32'),
('18779159-aca4-4b0f-a2f4-76b61f81f173', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 19:33:08', '2025-11-17 19:33:08'),
('1b1667cf-19b6-4703-8f77-a514420efa9d', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', 'LOGIN', 'Authentication', 'user', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', NULL, NULL, 'Successful login: nurse', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 10:32:59', '2025-11-27 10:32:59'),
('1b83fa0d-b4d5-42ea-8fcf-cd878664f5c0', 'unknown', 'Unknown', 'unknown', 'LOGIN', 'Authentication', 'user', NULL, 'cas', NULL, NULL, 'Failed login attempt: Invalid username - cas', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid username or password', '2025-11-19 13:43:40', '2025-11-19 13:43:40'),
('1d517b91-3f2e-44f8-a1c6-9db44f621eb9', 'unknown', 'Unknown', 'unknown', 'LOGIN', 'Authentication', 'user', NULL, 'cas', NULL, NULL, 'Failed login attempt: Invalid username - cas', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid username or password', '2025-11-19 13:43:40', '2025-11-19 13:43:40'),
('1eaf72bc-b94a-447a-8c25-1bdf4783ea9a', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', '8201188a-a4eb-4677-816f-08e0998056c2', NULL, NULL, NULL, NULL, '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'dispense_events is not defined', '2025-11-16 14:22:20', '2025-11-16 14:22:20'),
('213147b3-cafc-4f58-9b3f-4f9f05c17702', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'EXPORT', 'Reports', 'report_run', '8bc18ed7-eef2-4324-8152-6b797ab3fc60', '8bc18ed7-eef2-4324-8152-6b797ab3fc60', NULL, '{\"run_id\":\"8bc18ed7-eef2-4324-8152-6b797ab3fc60\",\"report_id\":\"183c47d9-b77e-4f11-8e60-48fb0da1f889\",\"report_type\":\"adherence\",\"reportData\":{\"avg_adherence\":549.995,\"total_records\":2,\"taken_count\":1,\"missed_count\":1}}', 'Generated adherence report', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-22 12:03:23', '2025-11-22 12:03:23'),
('2203ab8a-fd12-432b-a264-8a0d4c00999e', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-26 11:12:48', '2025-11-26 11:12:48'),
('2204fe53-ada5-4e68-ad5f-f8a314dd9fb6', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 10:35:09', '2025-11-27 10:35:09'),
('2236b126-0d9e-492f-808f-2ec5debb46e1', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-26 08:45:12', '2025-11-26 08:45:12'),
('25fda9ed-7c0a-4a8c-b468-966e35f3b01d', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'UPDATE', 'Clinical Visits', 'clinical_visit', '062cea3c-ff0c-44a5-9879-ec40b501b375', '062cea3c-ff0c-44a5-9879-ec40b501b375', '{\"visit_id\":\"062cea3c-ff0c-44a5-9879-ec40b501b375\",\"patient_id\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"visit_date\":\"2025-11-15T16:00:00.000Z\",\"visit_type\":\"emergency\",\"who_stage\":\"Stage 1\",\"chief_complaint\":\"Fever and body weakness for 2 days\",\"clinical_notes\":\"Patient presented with mild fever, stable vitals.\",\"assessment\":\"Likely viral infection.\",\"plan\":\"Hydration and rest. Paracetamol 500mg every 6 hours.\",\"follow_up_date\":\"2025-11-29T16:00:00.000Z\",\"follow_up_reason\":\"ART refill and viral load test.\",\"created_at\":\"2025-11-16T04:47:06.000Z\",\"updated_at\":\"2025-11-16T04:47:06.000Z\"}', '{\"visit_id\":\"062cea3c-ff0c-44a5-9879-ec40b501b375\",\"patient_id\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"provider_id\":\"11111111-1111-1111-1111-111111111111\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"visit_date\":\"2025-11-14T16:00:00.000Z\",\"visit_type\":\"emergency\",\"who_stage\":\"Stage 1\",\"chief_complaint\":\"Fever and body weakness for 2 days\",\"clinical_notes\":\"Patient presented with mild fever, stable vitals.\",\"assessment\":\"Likely viral infection.\",\"plan\":\"Hydration and rest. Paracetamol 500mg every 6 hours.\",\"follow_up_date\":\"2025-11-28T16:00:00.000Z\",\"follow_up_reason\":\"ART refill and viral load test.\",\"created_at\":\"2025-11-16T04:47:06.000Z\",\"updated_at\":\"2025-11-16T04:50:32.000Z\",\"patientName\":\"Jose Reyes\",\"providerName\":\"System Administrator\",\"facilityName\":\"MyHubCares Main Facility\",\"diagnoses\":[{\"diagnosis_id\":\"53b14af5-6f96-4a40-8749-00175687f846\",\"visit_id\":\"062cea3c-ff0c-44a5-9879-ec40b501b375\",\"icd10_code\":\"J11\",\"diagnosis_description\":\"Influenza due to unidentified influenza virus\",\"diagnosis_type\":\"primary\",\"is_chronic\":0,\"onset_date\":\"2025-01-08T16:00:00.000Z\",\"resolved_date\":\"1899-11-29T16:00:00.000Z\"}],\"procedures\":[]}', 'Updated clinical visit 062cea3c-ff0c-44a5-9879-ec40b501b375', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 12:50:33', '2025-11-16 12:50:33'),
('28ba0946-c233-4946-aaa8-ea516662b4f8', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', '8201188a-a4eb-4677-816f-08e0998056c2', NULL, NULL, NULL, NULL, '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Column \'dosage\' cannot be null', '2025-11-16 14:12:27', '2025-11-16 14:12:27'),
('2b681aa0-f806-4bcb-8236-9d3221310796', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', 'Hanna N. Sarabia', 'admin', 'UPDATE', 'Clinical Visits', 'clinical_visit', '3202ceae-5caf-4a5b-8eb9-b087f9679d51', '3202ceae-5caf-4a5b-8eb9-b087f9679d51', '{\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"provider_id\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\",\"facility_id\":\"7092d90f-5986-44fc-a56d-87abbf6b003d\",\"visit_date\":\"2025-11-14T16:00:00.000Z\",\"visit_type\":\"follow_up\",\"who_stage\":\"Stage 2\",\"chief_complaint\":\"dadas\",\"clinical_notes\":\"\",\"assessment\":\"dasdaa\",\"plan\":\"dasda\",\"follow_up_date\":null,\"follow_up_reason\":\"dfsdfds\",\"created_at\":\"2025-11-15T04:54:11.000Z\",\"updated_at\":\"2025-11-15T04:54:11.000Z\"}', '{\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"provider_id\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\",\"facility_id\":\"7092d90f-5986-44fc-a56d-87abbf6b003d\",\"visit_date\":\"2025-11-13T16:00:00.000Z\",\"visit_type\":\"follow_up\",\"who_stage\":\"Stage 2\",\"chief_complaint\":\"dadas\",\"clinical_notes\":\"\",\"assessment\":\"dasdaa\",\"plan\":\"dasda\",\"follow_up_date\":null,\"follow_up_reason\":\"dfsdfds\",\"created_at\":\"2025-11-15T04:54:11.000Z\",\"updated_at\":\"2025-11-15T05:25:43.000Z\"}', 'Updated clinical visit 3202ceae-5caf-4a5b-8eb9-b087f9679d51', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-15 13:25:43', '2025-11-15 13:25:43'),
('2b8185ec-dbc6-4414-b62f-26aeac3990f5', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'CREATE', 'Lab Orders', 'lab_order', 'e3768174-a8b4-41f0-8579-83038959c1a5', 'e3768174-a8b4-41f0-8579-83038959c1a5', NULL, '{\"order_id\":\"e3768174-a8b4-41f0-8579-83038959c1a5\",\"patient_id\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"test_panel\":\"CD4 Count\",\"priority\":\"routine\",\"status\":\"ordered\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\"}', 'Created lab order: CD4 Count for patient aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 12:28:23', '2025-11-17 12:28:23'),
('2c416a0b-7001-4c92-8dce-292d193a4cbe', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', 'Hanna N. Sarabia', 'admin', 'UPDATE', 'Clinical Visits', 'clinical_visit', '3202ceae-5caf-4a5b-8eb9-b087f9679d51', '3202ceae-5caf-4a5b-8eb9-b087f9679d51', '{\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"provider_id\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\",\"facility_id\":\"7092d90f-5986-44fc-a56d-87abbf6b003d\",\"visit_date\":\"2025-11-10T16:00:00.000Z\",\"visit_type\":\"follow_up\",\"who_stage\":\"Stage 2\",\"chief_complaint\":\"dadas\",\"clinical_notes\":\"\",\"assessment\":\"dasdaa\",\"plan\":\"dasda\",\"follow_up_date\":\"2025-10-30T16:00:00.000Z\",\"follow_up_reason\":\"Laging Galit sa buhay\",\"created_at\":\"2025-11-15T04:54:11.000Z\",\"updated_at\":\"2025-11-15T08:15:10.000Z\"}', '{\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"provider_id\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\",\"facility_id\":\"7092d90f-5986-44fc-a56d-87abbf6b003d\",\"visit_date\":\"2025-11-09T16:00:00.000Z\",\"visit_type\":\"follow_up\",\"who_stage\":\"Stage 2\",\"chief_complaint\":\"dadas\",\"clinical_notes\":\"\",\"assessment\":\"dasdaa\",\"plan\":\"dasda\",\"follow_up_date\":\"2025-10-29T16:00:00.000Z\",\"follow_up_reason\":\"Laging Galit sa buhay\",\"created_at\":\"2025-11-15T04:54:11.000Z\",\"updated_at\":\"2025-11-15T08:15:23.000Z\"}', 'Updated clinical visit 3202ceae-5caf-4a5b-8eb9-b087f9679d51', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-15 16:15:23', '2025-11-15 16:15:23'),
('2cfa287e-c446-48d8-8bc9-035773f59e8c', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', 'LOGIN', 'Authentication', 'user', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', NULL, NULL, 'Successful login: nurse', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 14:21:27', '2025-11-16 14:21:27'),
('2d133257-d73c-4be0-9d97-5f6ebb9dbaa6', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 13:53:40', '2025-11-17 13:53:40'),
('2d35cf9e-1a07-48b2-87d6-7814aa8986fb', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 12:53:46', '2025-11-16 12:53:46'),
('2d819132-10fd-44bf-836b-50c6d5061a84', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 13:38:20', '2025-11-19 13:38:20'),
('2dc5ffc1-0eb1-4108-b20f-6c4b9a2033f0', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', 'LOGIN', 'Authentication', 'user', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', NULL, NULL, 'Successful login: nurse', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 12:58:22', '2025-11-16 12:58:22'),
('2e8d2f7c-c1b9-4e51-ad7d-8a8fd3d8d957', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 09:23:14', '2025-11-19 09:23:14'),
('2f201b7a-e0bf-48a5-979d-65ec14c26ec4', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'DELETE', 'Roles', 'role_permission', 'rp-pat-0001-0001-0001-000000000001', 'rp-pat-0001-0001-0001-000000000001', '{\"role_id\":\"role-0000-0000-0000-000000000006\",\"permission_id\":\"perm-0000-0000-0000-000000000002\"}', NULL, 'Revoked permission \"View Patient\" from role \"Patient\"', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 10:26:19', '2025-11-27 10:26:19'),
('2faf41a2-ae45-4048-9f51-a998773e1189', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 18:28:33', '2025-11-17 18:28:33'),
('301a1fe1-7c05-42f6-a9db-0fad7b7d21c0', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', 'Hanna N. Sarabia', 'admin', 'LOGIN', 'Authentication', 'user', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', NULL, NULL, 'Successful login: hanapot', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-15 20:34:26', '2025-11-15 20:34:26'),
('30293c9a-e50a-43ab-9fd9-267a4b4a6044', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', 'Hanna N. Sarabia', 'admin', 'UPDATE', 'Clinical Visits', 'clinical_visit', '3202ceae-5caf-4a5b-8eb9-b087f9679d51', '3202ceae-5caf-4a5b-8eb9-b087f9679d51', '{\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"provider_id\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\",\"facility_id\":\"7092d90f-5986-44fc-a56d-87abbf6b003d\",\"visit_date\":\"2025-11-12T16:00:00.000Z\",\"visit_type\":\"follow_up\",\"who_stage\":\"Stage 2\",\"chief_complaint\":\"dadas\",\"clinical_notes\":\"\",\"assessment\":\"dasdaa\",\"plan\":\"dasda\",\"follow_up_date\":\"2025-11-01T16:00:00.000Z\",\"follow_up_reason\":\"Laging Galit sa buhay\",\"created_at\":\"2025-11-15T04:54:11.000Z\",\"updated_at\":\"2025-11-15T08:09:16.000Z\"}', '{\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"provider_id\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\",\"facility_id\":\"7092d90f-5986-44fc-a56d-87abbf6b003d\",\"visit_date\":\"2025-11-11T16:00:00.000Z\",\"visit_type\":\"follow_up\",\"who_stage\":\"Stage 2\",\"chief_complaint\":\"dadas\",\"clinical_notes\":\"\",\"assessment\":\"dasdaa\",\"plan\":\"dasda\",\"follow_up_date\":\"2025-10-31T16:00:00.000Z\",\"follow_up_reason\":\"Laging Galit sa buhay\",\"created_at\":\"2025-11-15T04:54:11.000Z\",\"updated_at\":\"2025-11-15T08:14:51.000Z\"}', 'Updated clinical visit 3202ceae-5caf-4a5b-8eb9-b087f9679d51', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-15 16:14:51', '2025-11-15 16:14:51'),
('31f090ff-bed9-466b-ae7c-c80dd9e74380', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 18:31:30', '2025-11-27 18:31:30'),
('32c5605b-8290-4fe1-a3aa-bf26fa51235d', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', 'LOGIN', 'Authentication', 'user', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', NULL, NULL, 'Successful login: nurse', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 09:23:20', '2025-11-24 09:23:20'),
('332813ef-25e0-4f67-add9-937e2b5a06ce', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-26 15:20:31', '2025-11-26 15:20:31'),
('3351bc01-c6c2-4852-82eb-4820519aa91e', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 15:12:25', '2025-11-24 15:12:25'),
('335e32c3-01d1-427a-90db-27dcbbfda2d9', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Failed login attempt: Invalid password for admin', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-16 12:47:44', '2025-11-16 12:47:44'),
('33bc12d2-c478-4a78-90ba-ee3e39c67525', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 15:33:23', '2025-11-17 15:33:23'),
('33ffb098-b117-49a7-876b-ff5beceb0f92', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', '8201188a-a4eb-4677-816f-08e0998056c2', NULL, NULL, NULL, NULL, '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Column \'dosage\' cannot be null', '2025-11-16 14:12:41', '2025-11-16 14:12:41'),
('3552ea11-9df7-4fc3-b06b-5a404df70bea', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', '8201188a-a4eb-4677-816f-08e0998056c2', '8201188a-a4eb-4677-816f-08e0998056c2', NULL, '{\"prescription_id\":\"8201188a-a4eb-4677-816f-08e0998056c2\",\"prescription_number\":\"RX-20251116-0001\",\"dispense_events\":[{\"dispense_id\":\"69c4d690-0433-4f6e-966a-efa5187c0537\",\"medication_name\":\"Efavirenz 600mg\",\"quantity_dispensed\":1}]}', 'Dispensed medication for prescription RX-20251116-0001', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 14:22:19', '2025-11-16 14:22:19'),
('3612fcb6-8e31-4340-adb8-80bffdc036ab', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'CREATE', 'Roles', 'role_permission', '9bf242fe-58ca-44e5-96ec-bd99d76759fe', '9bf242fe-58ca-44e5-96ec-bd99d76759fe', NULL, '{\"role_id\":\"role-0000-0000-0000-000000000006\",\"permission_id\":\"perm-0000-0000-0000-000000000014\"}', 'Granted permission \"View Prescription\" to role \"Patient\"', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 18:43:04', '2025-11-27 18:43:04'),
('36dbc4d7-3571-4bf9-ad24-f1fb6bb4a03b', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', '8201188a-a4eb-4677-816f-08e0998056c2', '8201188a-a4eb-4677-816f-08e0998056c2', NULL, '{\"prescription_id\":\"8201188a-a4eb-4677-816f-08e0998056c2\",\"prescription_number\":\"RX-20251116-0001\",\"dispense_events\":[{\"dispense_id\":\"d21ee17d-42f9-41b4-8d7e-ca12065de34f\",\"medication_name\":\"Efavirenz 600mg\",\"quantity_dispensed\":4}]}', 'Dispensed medication for prescription RX-20251116-0001', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 14:45:22', '2025-11-16 14:45:22'),
('37759c56-3f36-46fd-8e32-64dc5de3c2cd', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Failed login attempt: Invalid password for patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-17 15:31:19', '2025-11-17 15:31:19'),
('37a34eab-3619-499d-8d6b-133ccdaaf59c', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 14:16:40', '2025-11-17 14:16:40'),
('39253fa4-3d86-43a2-9d94-1d1a3f8a44d5', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'EXPORT', 'Reports', 'report_run', 'bee78826-9f90-4d94-b7e7-b8b9fedbc4b0', 'bee78826-9f90-4d94-b7e7-b8b9fedbc4b0', NULL, '{\"run_id\":\"bee78826-9f90-4d94-b7e7-b8b9fedbc4b0\",\"report_id\":\"3abccdc0-6f7f-4bef-ac22-251c142149a8\",\"report_type\":\"patient\",\"reportData\":{\"total_patients\":3,\"male_count\":1,\"female_count\":2}}', 'Generated patient report', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-22 12:03:23', '2025-11-22 12:03:23'),
('393d0f7e-4a89-4952-a54e-339b23d3fe7b', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 08:58:14', '2025-11-19 08:58:14'),
('398a8f06-b2f9-4964-85b8-9e920d767e32', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 20:36:51', '2025-11-17 20:36:51'),
('3a49989a-ac38-4024-81be-1db23d52fc0f', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'CREATE', 'Roles', 'role_permission', '095503a3-1759-45fe-a1b8-6321cf916871', '095503a3-1759-45fe-a1b8-6321cf916871', NULL, '{\"role_id\":\"role-0000-0000-0000-000000000004\",\"permission_id\":\"perm-0000-0000-0000-000000000017\"}', 'Granted permission \"Create Appointment\" to role \"Case Manager\"', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 12:28:13', '2025-11-16 12:28:13'),
('3c780443-578d-41a3-ade0-93f333f33ffa', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-21 10:16:21', '2025-11-21 10:16:21'),
('3ff8a670-c70e-433d-979d-3ae670724b0e', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 11:30:43', '2025-11-27 11:30:43'),
('404dc825-1145-4251-83b0-e847dc96a162', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 15:45:45', '2025-11-17 15:45:45'),
('40e61db6-115c-43d1-a303-8e61fcd85856', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 15:02:50', '2025-11-24 15:02:50'),
('41aa8586-5d13-4770-9f3d-8a92d3456e0f', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', '8201188a-a4eb-4677-816f-08e0998056c2', '8201188a-a4eb-4677-816f-08e0998056c2', NULL, '{\"prescription_id\":\"8201188a-a4eb-4677-816f-08e0998056c2\",\"prescription_number\":\"RX-20251116-0001\",\"dispense_events\":[{\"dispense_id\":\"4fe503a0-a9c0-4a4d-b3e5-8c199d274e07\",\"medication_name\":\"Efavirenz 600mg\",\"quantity_dispensed\":12}]}', 'Dispensed medication for prescription RX-20251116-0001', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 14:40:56', '2025-11-16 14:40:56'),
('4225f2b2-ee60-4fc9-ae6a-dd9456df818a', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 12:01:46', '2025-11-16 12:01:46'),
('42dac1ab-8f66-4016-8abd-285c02ee3c04', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 14:40:42', '2025-11-17 14:40:42'),
('43a14cf0-539f-4d19-bc95-52129af08409', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'UPDATE', 'Clinical Visits', 'clinical_visit', '062cea3c-ff0c-44a5-9879-ec40b501b375', '062cea3c-ff0c-44a5-9879-ec40b501b375', '{\"visit_id\":\"062cea3c-ff0c-44a5-9879-ec40b501b375\",\"patient_id\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"provider_id\":\"11111111-1111-1111-1111-111111111111\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"visit_date\":\"2025-11-14T16:00:00.000Z\",\"visit_type\":\"emergency\",\"who_stage\":\"Stage 1\",\"chief_complaint\":\"Fever and body weakness for 2 days\",\"clinical_notes\":\"Patient presented with mild fever, stable vitals.\",\"assessment\":\"Likely viral infection.\",\"plan\":\"Hydration and rest. Paracetamol 500mg every 6 hours.\",\"follow_up_date\":\"2025-11-28T16:00:00.000Z\",\"follow_up_reason\":\"ART refill and viral load test.\",\"created_at\":\"2025-11-16T04:47:06.000Z\",\"updated_at\":\"2025-11-16T04:50:32.000Z\"}', '{\"visit_id\":\"062cea3c-ff0c-44a5-9879-ec40b501b375\",\"patient_id\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"provider_id\":\"11111111-1111-1111-1111-111111111111\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"visit_date\":\"2025-11-13T16:00:00.000Z\",\"visit_type\":\"emergency\",\"who_stage\":\"Stage 1\",\"chief_complaint\":\"Fever and body weakness for 2 days\",\"clinical_notes\":\"Patient presented with mild fever, stable vitals.\",\"assessment\":\"Likely viral infection.\",\"plan\":\"Hydration and rest. Paracetamol 500mg every 6 hours.\",\"follow_up_date\":\"2025-11-27T16:00:00.000Z\",\"follow_up_reason\":\"ART refill and viral load test.\",\"created_at\":\"2025-11-16T04:47:06.000Z\",\"updated_at\":\"2025-11-16T04:51:55.000Z\",\"patientName\":\"Jose Reyes\",\"providerName\":\"System Administrator\",\"facilityName\":\"MyHubCares Main Facility\",\"diagnoses\":[{\"diagnosis_id\":\"53b14af5-6f96-4a40-8749-00175687f846\",\"visit_id\":\"062cea3c-ff0c-44a5-9879-ec40b501b375\",\"icd10_code\":\"J11\",\"diagnosis_description\":\"Influenza due to unidentified influenza virus\",\"diagnosis_type\":\"primary\",\"is_chronic\":0,\"onset_date\":\"2025-01-07T16:00:00.000Z\",\"resolved_date\":\"1899-11-28T16:00:00.000Z\"}],\"procedures\":[{\"procedure_id\":\"4b7f8aef-abfc-42dc-beb5-580148c154a3\",\"visit_id\":\"062cea3c-ff0c-44a5-9879-ec40b501b375\",\"cpt_code\":\"71045\",\"procedure_name\":\"Chest X-ray\",\"procedure_description\":\"Standard PA chest radiograph performed.\",\"outcome\":\"No acute findings.\",\"performed_at\":\"2025-11-15T20:49:00.000Z\"}]}', 'Updated clinical visit 062cea3c-ff0c-44a5-9879-ec40b501b375', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 12:51:56', '2025-11-16 12:51:56'),
('43ad63f9-d4f3-4e09-bd29-c0203c585abb', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'UPDATE', 'Care Tasks', 'care_task', 'dd9cbd0b-1a7d-40a1-8a86-d83f4c60d04e', 'dd9cbd0b-1a7d-40a1-8a86-d83f4c60d04e', '{\"status\":\"pending\"}', '{\"status\":\"in_progress\"}', 'Updated care task status to in_progress', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-22 12:10:21', '2025-11-22 12:10:21'),
('4403476e-ef67-4257-a6a7-cb6a64dcf4a3', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-18 23:43:01', '2025-11-18 23:43:01'),
('44cb955c-04e3-45ba-a57e-0644864c9b58', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 08:57:29', '2025-11-24 08:57:29'),
('458a7bac-5982-410e-bda5-a37e81b25924', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', 'trixie', 'physician', 'LOGIN', 'Authentication', 'user', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', NULL, NULL, 'Failed login attempt: Invalid password for trixie', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-15 20:33:38', '2025-11-15 20:33:38'),
('4601c975-c507-4da6-82ce-c99207844433', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 18:19:15', '2025-11-17 18:19:15'),
('49125105-a417-4bef-a0f2-6ff452301c75', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Failed login attempt: Invalid password for Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-18 23:42:55', '2025-11-18 23:42:55'),
('497c3459-149a-4283-91ea-f2ad8663fff3', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 16:20:02', '2025-11-17 16:20:02'),
('4aa4afce-3305-4232-a8d4-ffcfeb7c75f8', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 12:26:10', '2025-11-17 12:26:10'),
('4b8dfd04-2b6b-4120-bfab-cf0a8a7ec2f9', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 12:43:33', '2025-11-16 12:43:33'),
('4c1982eb-8306-4746-8c17-1fbafa7bf7bb', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', '8201188a-a4eb-4677-816f-08e0998056c2', '8201188a-a4eb-4677-816f-08e0998056c2', NULL, '{\"prescription_id\":\"8201188a-a4eb-4677-816f-08e0998056c2\",\"prescription_number\":\"RX-20251116-0001\",\"dispense_events\":[{\"dispense_id\":\"18b81369-0723-475c-848d-1e42635e36ee\",\"medication_name\":\"Efavirenz 600mg\",\"quantity_dispensed\":10}]}', 'Dispensed medication for prescription RX-20251116-0001', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 14:16:37', '2025-11-16 14:16:37'),
('4de5789e-eafb-48ad-8381-33d7269830aa', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Failed login attempt: Invalid password for physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'failed', 'Invalid password', '2025-11-27 11:20:19', '2025-11-27 11:20:19'),
('4e748478-17b5-48da-9a42-47148e04bc1a', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 16:30:41', '2025-11-17 16:30:41');
INSERT INTO `audit_log` (`audit_id`, `user_id`, `user_name`, `user_role`, `action`, `module`, `entity_type`, `entity_id`, `record_id`, `old_value`, `new_value`, `change_summary`, `ip_address`, `device_type`, `user_agent`, `remarks`, `status`, `error_message`, `timestamp`, `created_at`) VALUES
('4e82956c-5c54-4d09-ae1d-c80b2be1732e', 'unknown', 'Unknown', 'unknown', 'LOGIN', 'Authentication', 'user', NULL, 'cas', NULL, NULL, 'Failed login attempt: Invalid username - cas', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid username or password', '2025-11-19 13:43:39', '2025-11-19 13:43:39'),
('4ebc1e34-f406-4f54-bc56-cdf098611eac', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 15:25:07', '2025-11-16 15:25:07'),
('5159b2d3-92a2-4414-b73f-d1d7dfd15844', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-22 12:03:09', '2025-11-22 12:03:09'),
('51dc7183-c72c-4a3c-b8a7-16adc7e976f0', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'CREATE', 'SURVEYS', 'survey_response', 'db4373fe-c403-4a2d-a4bf-ae0f1d9147ef', 'Survey-db4373fe', NULL, '{\"patient_id\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440002\",\"overall_satisfaction\":\"very_happy\",\"staff_friendliness\":2,\"wait_time\":2,\"facility_cleanliness\":3,\"would_recommend\":\"maybe\",\"average_score\":\"2.33\"}', 'Survey submitted for patient aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 09:02:39', '2025-11-24 09:02:39'),
('520cfe8d-ad8c-4f5e-90c2-c8e980d81703', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Failed login attempt: Invalid password for case_manager', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-17 18:10:00', '2025-11-17 18:10:00'),
('52389eeb-8fbf-46ff-ae8d-3a6a11fa97cc', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', 'trixie', 'physician', 'CREATE', 'Prescriptions', 'prescription', 'ccf55302-ea8b-464c-92e7-883a5e32a008', 'ccf55302-ea8b-464c-92e7-883a5e32a008', NULL, '{\"prescription_id\":\"ccf55302-ea8b-464c-92e7-883a5e32a008\",\"prescription_number\":\"RX-20251116-0001\",\"patient_id\":\"7db2ecfb-e409-41f3-a632-b5db0d4f868b\",\"prescriber_id\":\"3fdb00a0-7774-40f1-96f6-7d4c179bcd93\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440002\",\"items\":[{\"prescription_item_id\":\"5d38050a-bb52-492a-85c2-d354ea909683\",\"medication_id\":\"65af6445-7630-4a2b-8851-d43fb66807ab\",\"quantity\":1}]}', 'Created prescription RX-20251116-0001 for patient Hanna Sarabia', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 11:38:14', '2025-11-16 11:38:14'),
('537a76b7-0785-4da4-9d93-0a5f26555a1d', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'CREATE', 'Inventory', 'medication_inventory', 'f8788bf9-153b-4599-b162-3daee7bd95cb', 'f8788bf9-153b-4599-b162-3daee7bd95cb', NULL, '{\"inventory_id\":\"f8788bf9-153b-4599-b162-3daee7bd95cb\",\"medication_id\":\"65af6445-7630-4a2b-8851-d43fb66807ab\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"quantity_on_hand\":200,\"reorder_level\":50,\"expiry_date\":\"2027-11-16\"}', 'Added inventory for Tenofovir/Lamivudine/Dolutegravir (TLD) at MyHubCares Main Facility', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 12:48:51', '2025-11-16 12:48:51'),
('553efd0d-d413-4929-9f3b-c18799f88b79', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 19:19:44', '2025-11-16 19:19:44'),
('558436a7-45a0-4176-858c-997fd6c4796f', '42356bf7-84ef-4aaa-9610-d74b65c3929f', 'Trixie Morales', 'physician', 'LOGIN', 'Authentication', 'user', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '42356bf7-84ef-4aaa-9610-d74b65c3929f', NULL, NULL, 'Successful login: Trixie', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 15:05:39', '2025-11-24 15:05:39'),
('55939095-e654-48ed-8755-62f03c1bdf68', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'CREATE', 'Lab Files', 'lab_file', '9573db2c-7c7c-4e96-9de9-eac49eaae743', '9573db2c-7c7c-4e96-9de9-eac49eaae743', NULL, '{\"file_id\":\"9573db2c-7c7c-4e96-9de9-eac49eaae743\",\"result_id\":\"d1cc561a-c533-4c17-bf09-4bc4d9841094\",\"file_name\":\"545832021_1689460425052578_6722400524695115105_n.jpg\",\"file_size\":165137}', 'Uploaded lab file: 545832021_1689460425052578_6722400524695115105_n.jpg for result d1cc561a-c533-4c17-bf09-4bc4d9841094', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 12:45:38', '2025-11-17 12:45:38'),
('55bdeda1-e1fd-4909-a892-6d278402e1d3', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 19:43:22', '2025-11-16 19:43:22'),
('5661fa51-3cc4-4507-91c0-a943dede75b8', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 13:07:24', '2025-11-17 13:07:24'),
('571ca2c8-2f4b-404c-a3e4-f91a009c917d', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', 'Hanna N. Sarabia', 'admin', 'LOGIN', 'Authentication', 'user', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', NULL, NULL, 'Successful login: hanapot', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 11:38:49', '2025-11-16 11:38:49'),
('572f3bb3-93ea-40d1-8933-7b05c6799c7a', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-21 12:40:13', '2025-11-21 12:40:13'),
('5915cf3e-2097-4025-b984-82b49d5f039a', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', 'Hanna N. Sarabia', 'admin', 'CREATE', 'Prescriptions', 'prescription', '205431b9-bf40-49b5-a04a-77e9235a3904', '205431b9-bf40-49b5-a04a-77e9235a3904', NULL, '{\"prescription_id\":\"205431b9-bf40-49b5-a04a-77e9235a3904\",\"prescription_number\":\"RX-20251115-0001\",\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"prescriber_id\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440001\",\"items\":[{\"prescription_item_id\":\"7be959e1-8be5-483d-9bf4-1395fda900c1\",\"medication_id\":\"9117b66c-a29f-43cc-ac78-5724222f7a38\",\"quantity\":1}]}', 'Created prescription RX-20251115-0001 for patient Trixie Ann Morales', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-15 22:59:17', '2025-11-15 22:59:17'),
('59310e1b-7462-4272-97ba-f26c7cd691a6', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'CREATE', 'Roles', 'role_permission', '4974e51a-c4b2-43dd-966c-935015ea15bb', '4974e51a-c4b2-43dd-966c-935015ea15bb', NULL, '{\"role_id\":\"role-0000-0000-0000-000000000006\",\"permission_id\":\"perm-0000-0000-0000-000000000022\"}', 'Granted permission \"View Lab Test\" to role \"Patient\"', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 10:26:31', '2025-11-27 10:26:31'),
('59e79a5c-67dc-43e6-940b-36d0b2ee51a3', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 13:42:43', '2025-11-19 13:42:43'),
('5a050254-b639-4452-943b-4988bd2ed780', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'CREATE', 'Prescriptions', 'prescription', '69688306-fd70-41a5-8a71-9d41d0304072', '69688306-fd70-41a5-8a71-9d41d0304072', NULL, '{\"prescription_id\":\"69688306-fd70-41a5-8a71-9d41d0304072\",\"prescription_number\":\"RX-20251116-0002\",\"patient_id\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"prescriber_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"items\":[{\"prescription_item_id\":\"e527cebd-be4e-4e8e-a51a-405c5d3ddfaa\",\"medication_id\":\"65af6445-7630-4a2b-8851-d43fb66807ab\",\"quantity\":1}]}', 'Created prescription RX-20251116-0002 for patient Jose Reyes', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 16:07:16', '2025-11-16 16:07:16'),
('5b14854b-6516-41bd-ae93-82f7315f8c69', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 12:17:33', '2025-11-16 12:17:33'),
('5b62714d-48b6-4967-8e36-2a0794b80f17', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-18 23:52:41', '2025-11-18 23:52:41'),
('5d5109b8-5fc7-4721-b438-4e225ad837fa', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Failed login attempt: Invalid password for admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-21 08:46:20', '2025-11-21 08:46:20'),
('5e0d96d0-3947-473f-922e-0305760a824c', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 13:31:45', '2025-11-24 13:31:45'),
('5e49ed8c-83a8-4934-9143-fb9bb545665d', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 09:40:22', '2025-11-19 09:40:22'),
('5f39893c-5331-4294-90ec-d0bcf7fb5ced', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', '8201188a-a4eb-4677-816f-08e0998056c2', NULL, NULL, NULL, NULL, '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'dispense_events is not defined', '2025-11-16 14:16:37', '2025-11-16 14:16:37'),
('61efd39a-e545-4766-ab23-65247e93f904', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Failed login attempt: Invalid password for admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-18 22:00:49', '2025-11-18 22:00:49'),
('63e2765d-9b4d-4965-8c85-5974a7f5e93a', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 13:38:18', '2025-11-24 13:38:18'),
('64bfecb2-9418-4378-b456-298d16ee81bd', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 12:47:47', '2025-11-16 12:47:47'),
('66303ff4-a4fb-4791-8052-bf4c9a85a0ea', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 19:42:48', '2025-11-17 19:42:48'),
('664e387a-1951-4f02-9b02-8f5d68f71663', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 15:25:43', '2025-11-19 15:25:43'),
('668b5fd4-876b-4891-9042-c7641ebc9cc1', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-18 22:02:03', '2025-11-18 22:02:03'),
('66f2de42-a330-4f80-bee6-dbe4f422b313', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'DELETE', 'Roles', 'role_permission', 'rp-pat-0001-0001-0001-000000000003', 'rp-pat-0001-0001-0001-000000000003', '{\"role_id\":\"role-0000-0000-0000-000000000006\",\"permission_id\":\"perm-0000-0000-0000-000000000022\"}', NULL, 'Revoked permission \"View Lab Test\" from role \"Patient\"', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 10:26:18', '2025-11-27 10:26:18'),
('670eba8e-54b8-4d8b-bb36-c09d1a110c26', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'CREATE', 'Patients', 'patient', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', NULL, '{\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"uic\":\"EDDE0106-01-2004\",\"first_name\":\"Hanna\",\"last_name\":\"Sarabia\",\"email\":\"sarabia.hanna.bsinfotech@gmail.com\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\"}', 'New patient registered: Hanna N. Sarabia (UIC: EDDE0106-01-2004)', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 16:07:51', '2025-11-17 16:07:51'),
('67d04a2c-08ce-4d4f-bc1a-93b55259d5ad', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 08:05:55', '2025-11-24 08:05:55'),
('67d810c0-f63c-43c3-9af1-4916b5051465', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 14:46:45', '2025-11-24 14:46:45'),
('687b9a81-95cb-4b47-a875-fd5a490ce55a', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Failed login attempt: Invalid password for physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'failed', 'Invalid password', '2025-11-27 11:33:53', '2025-11-27 11:33:53'),
('69051a3f-13dc-4f21-9e5e-c680ffc3ae4f', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 18:27:29', '2025-11-27 18:27:29'),
('690f99a6-272c-462c-90c2-ff3625a81957', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'EXPORT', 'Reports', 'report_run', '768fca97-684d-4409-a8f4-dca94193b91c', '768fca97-684d-4409-a8f4-dca94193b91c', NULL, '{\"run_id\":\"768fca97-684d-4409-a8f4-dca94193b91c\",\"report_id\":\"3eafc94c-1159-42d1-9eea-cf1d8e809606\",\"report_type\":\"appointment\",\"reportData\":{\"total_appointments\":3,\"completed_count\":0,\"scheduled_count\":1,\"cancelled_count\":0,\"no_show_count\":0}}', 'Generated appointment report', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-22 12:03:24', '2025-11-22 12:03:24'),
('69b64f15-97a8-4986-b898-bd9de49911fe', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 16:37:00', '2025-11-17 16:37:00'),
('6ace2902-d3db-40ac-bc17-57d8138a8db1', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 14:11:38', '2025-11-27 14:11:38'),
('6c024807-b8ac-42c1-a523-628816157419', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'CREATE', 'Prescriptions', 'prescription', '8201188a-a4eb-4677-816f-08e0998056c2', '8201188a-a4eb-4677-816f-08e0998056c2', NULL, '{\"prescription_id\":\"8201188a-a4eb-4677-816f-08e0998056c2\",\"prescription_number\":\"RX-20251116-0001\",\"patient_id\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"prescriber_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"items\":[{\"prescription_item_id\":\"73771305-0ea9-4194-9997-4795ac0307dd\",\"medication_id\":\"9117b66c-a29f-43cc-ac78-5724222f7a38\",\"quantity\":1}]}', 'Created prescription RX-20251116-0001 for patient Jose Reyes', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 12:55:04', '2025-11-16 12:55:04'),
('6c2a51ca-baa7-4781-855f-f33fa732b897', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 20:02:32', '2025-11-17 20:02:32'),
('6de521f9-1c80-438a-ad55-336340cde852', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', 'LOGIN', 'Authentication', 'user', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', NULL, NULL, 'Failed login attempt: Invalid password for nurse', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'failed', 'Invalid password', '2025-11-27 10:32:54', '2025-11-27 10:32:54'),
('6e840dbc-7c2d-446f-a002-86b06189a450', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', 'Hanna N. Sarabia', 'admin', 'UPDATE', 'Patients', 'patient', '169b7991-2e21-4f62-8672-f06f129a8cbb', '169b7991-2e21-4f62-8672-f06f129a8cbb', '{\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"uic\":\"UIC-1763091112707-842\",\"philhealth_no\":\"123456\",\"first_name\":\"Trixie Ann\",\"middle_name\":\"\",\"last_name\":\"Morales\",\"suffix\":\"\",\"birth_date\":\"1899-11-29T16:00:00.000Z\",\"sex\":\"F\",\"civil_status\":\"Single\",\"nationality\":\"Filipino\",\"current_city\":\"Sampaloc\",\"current_province\":\"METRO MANILA\",\"current_address\":\"{\\\"city\\\":\\\"Sampaloc\\\",\\\"province\\\":\\\"METRO MANILA\\\"}\",\"contact_phone\":\"0945-5116-175\",\"email\":\"morales.ta.bsifnotech@gmail.com\",\"mother_name\":null,\"father_name\":null,\"birth_order\":null,\"guardian_name\":null,\"guardian_relationship\":null,\"facility_id\":\"7092d90f-5986-44fc-a56d-87abbf6b003d\",\"arpa_risk_score\":null,\"arpa_last_calculated\":null,\"status\":\"active\",\"created_at\":\"2025-11-14T03:31:52.000Z\",\"updated_at\":\"2025-11-14T04:17:25.000Z\",\"created_by\":\"3fdb00a0-7774-40f1-96f6-7d4c179bcd93\"}', '{\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"uic\":\"UIC-1763091112707-842\",\"philhealth_no\":\"1234567\",\"first_name\":\"Trixie Ann\",\"middle_name\":\"\",\"last_name\":\"Morales\",\"suffix\":\"\",\"birth_date\":\"1899-11-29T16:00:00.000Z\",\"sex\":\"F\",\"civil_status\":\"Single\",\"nationality\":\"Filipino\",\"current_city\":\"Sampaloc\",\"current_province\":\"METRO MANILA\",\"current_address\":\"{\\\"city\\\":\\\"Sampaloc\\\",\\\"province\\\":\\\"METRO MANILA\\\"}\",\"contact_phone\":\"0945-5116-175\",\"email\":\"morales.ta.bsifnotech@gmail.com\",\"mother_name\":null,\"father_name\":null,\"birth_order\":null,\"guardian_name\":null,\"guardian_relationship\":null,\"facility_id\":\"7092d90f-5986-44fc-a56d-87abbf6b003d\",\"arpa_risk_score\":null,\"arpa_last_calculated\":null,\"status\":\"active\",\"created_at\":\"2025-11-14T03:31:52.000Z\",\"updated_at\":\"2025-11-15T05:19:44.000Z\",\"created_by\":\"3fdb00a0-7774-40f1-96f6-7d4c179bcd93\",\"facility_name\":\"MyHubCares Manila Branch\"}', 'Patient updated: Trixie Ann Morales (UIC: UIC-1763091112707-842)', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-15 13:19:44', '2025-11-15 13:19:44'),
('711ebb7c-168c-421e-a7af-2498a1e241c0', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'CREATE', 'Reporting', 'report_run', '16a466f9-ffb8-494a-ba30-98c7c03b3d56', '16a466f9-ffb8-494a-ba30-98c7c03b3d56', NULL, '{\"run_id\":\"16a466f9-ffb8-494a-ba30-98c7c03b3d56\",\"report_id\":\"3abccdc0-6f7f-4bef-ac22-251c142149a8\",\"report_name\":\"Patient Statistics Report\",\"report_type\":\"patient\",\"parameters\":{\"triggered_from\":\"ReportsPage\",\"report_type_label\":\"Patient Statistics\",\"generated_at\":\"2025-11-22T03:14:27.926Z\"}}', 'Report run created for Patient Statistics Report', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-22 11:14:27', '2025-11-22 11:14:27'),
('7131e98c-7abd-4cb1-a5d2-da3b1f611971', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 11:20:29', '2025-11-27 11:20:29'),
('71ef133c-d5e1-427b-8c58-497c634253d3', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 17:09:28', '2025-11-24 17:09:28'),
('72351c2d-f44b-43ff-aa79-f1b540c41eb8', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-18 22:10:48', '2025-11-18 22:10:48'),
('74791808-b673-45dc-a063-c7de8bc2221b', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 15:28:39', '2025-11-17 15:28:39'),
('75350570-d24f-48b9-b3f4-b2f27e0ba549', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 20:00:10', '2025-11-17 20:00:10'),
('75764f4b-a028-4d08-9486-ac4e8147a961', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'DELETE', 'Lab Orders', 'lab_order', 'e4e5c4d0-e314-4c45-bf8f-bb3cacc27a9c', 'e4e5c4d0-e314-4c45-bf8f-bb3cacc27a9c', '{\"order_id\":\"e4e5c4d0-e314-4c45-bf8f-bb3cacc27a9c\",\"patient_id\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"ordering_provider_id\":\"11111111-1111-1111-1111-111111111111\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"order_date\":\"2025-11-15T16:00:00.000Z\",\"test_panel\":\"Viral Load\",\"priority\":\"urgent\",\"status\":\"cancelled\",\"collection_date\":\"2025-11-15T16:00:00.000Z\",\"notes\":null,\"created_at\":\"2025-11-16T13:35:53.000Z\"}', NULL, 'Cancelled lab order: Viral Load', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 12:26:38', '2025-11-17 12:26:38'),
('764a6bfa-8299-4293-a42d-1aba8a6dad3a', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Failed login attempt: Invalid password for admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-18 22:24:24', '2025-11-18 22:24:24'),
('768ca261-dc97-4e0a-8db9-07ca018afdff', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Failed login attempt: Invalid password for admin', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-16 12:16:59', '2025-11-16 12:16:59'),
('76d006cc-5fb7-4a4f-8096-ee95bf86b5ab', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 11:58:35', '2025-11-19 11:58:35'),
('7720828a-fda2-46e3-8637-171fd6c75a63', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 19:57:44', '2025-11-17 19:57:44'),
('7757b939-b10d-43dc-ad10-4dd0df001406', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 18:10:06', '2025-11-17 18:10:06'),
('780b95a8-72d1-416d-ad0f-4db7352318b8', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 20:03:21', '2025-11-17 20:03:21'),
('784b446f-400e-435e-828c-cf1eba79d181', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', '8201188a-a4eb-4677-816f-08e0998056c2', '8201188a-a4eb-4677-816f-08e0998056c2', NULL, '{\"prescription_id\":\"8201188a-a4eb-4677-816f-08e0998056c2\",\"prescription_number\":\"RX-20251116-0001\",\"dispense_events\":[{\"dispense_id\":\"869e38b5-9591-4f4d-8357-dcf2d6b13d84\",\"medication_name\":\"Efavirenz 600mg\",\"quantity_dispensed\":1}]}', 'Dispensed medication for prescription RX-20251116-0001', '::1', NULL, 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', NULL, 'success', NULL, '2025-11-16 14:41:25', '2025-11-16 14:41:25'),
('7855714b-7914-42cb-b1ed-49733fc12e58', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Failed login attempt: Invalid password for Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-24 08:51:35', '2025-11-24 08:51:35'),
('7884249d-7c92-45dd-95ca-25d8f5e3f820', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 16:06:23', '2025-11-16 16:06:23'),
('79ac7a83-e13e-4796-be95-6228b19997fc', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'CREATE', 'Lab Orders', 'lab_order', 'e4e5c4d0-e314-4c45-bf8f-bb3cacc27a9c', 'e4e5c4d0-e314-4c45-bf8f-bb3cacc27a9c', NULL, '{\"order_id\":\"e4e5c4d0-e314-4c45-bf8f-bb3cacc27a9c\",\"patient_id\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"test_panel\":\"Viral Load\",\"priority\":\"urgent\",\"status\":\"in_progress\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\"}', 'Created lab order: Viral Load for patient aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 21:35:54', '2025-11-16 21:35:54'),
('7aba79a4-3b76-4308-8baf-6eba5b03899f', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 11:35:56', '2025-11-27 11:35:56'),
('7abb19b8-1333-4a10-b6fb-7e139db481de', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 13:51:57', '2025-11-27 13:51:57'),
('7b075c1a-8d0c-44f4-936d-b9b79e885e54', '42356bf7-84ef-4aaa-9610-d74b65c3929f', 'Trixie Morales', 'physician', 'LOGIN', 'Authentication', 'user', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '42356bf7-84ef-4aaa-9610-d74b65c3929f', NULL, NULL, 'Successful login: Trixie', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 15:04:55', '2025-11-24 15:04:55'),
('7be9c16a-c030-4057-8e7f-03617b4816d4', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', '8201188a-a4eb-4677-816f-08e0998056c2', '8201188a-a4eb-4677-816f-08e0998056c2', NULL, '{\"prescription_id\":\"8201188a-a4eb-4677-816f-08e0998056c2\",\"prescription_number\":\"RX-20251116-0001\",\"dispense_events\":[{\"dispense_id\":\"ebb1908b-a668-42c7-9e21-b96b27df753f\",\"medication_name\":\"Efavirenz 600mg\",\"quantity_dispensed\":1}]}', 'Dispensed medication for prescription RX-20251116-0001', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 14:21:58', '2025-11-16 14:21:58'),
('7c1f5643-12fb-48ec-b4ca-d93ee2ed923c', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 14:09:26', '2025-11-27 14:09:26'),
('7da6a654-390c-4f35-bb28-2f592004f080', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 14:10:48', '2025-11-27 14:10:48'),
('7dd0e51c-60ba-4f04-b8af-513d4aee0215', '42356bf7-84ef-4aaa-9610-d74b65c3929f', 'Trixie Morales', 'physician', 'LOGIN', 'Authentication', 'user', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '42356bf7-84ef-4aaa-9610-d74b65c3929f', NULL, NULL, 'Successful login: Trixie', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 16:15:11', '2025-11-17 16:15:11'),
('7f158139-ae16-46d3-92de-0286925e738a', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', '', 'Inventory', 'medication_inventory', 'fcfefa31-7b0e-4e49-b11f-a11ef45c9694', 'fcfefa31-7b0e-4e49-b11f-a11ef45c9694', '{\"quantity_on_hand\":50}', '{\"quantity_on_hand\":100}', 'Restocked Efavirenz 600mg with 50 units at MyHubCares Main Clinic', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 09:22:03', '2025-11-24 09:22:03'),
('7f863770-addb-4760-93f9-eea4d1bf8468', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-25 15:50:22', '2025-11-25 15:50:22'),
('8128e3bd-52e1-48bb-b7d9-e19e2036ddb7', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 21:30:11', '2025-11-16 21:30:11'),
('82573027-364a-4bd1-888a-0a796ef6767e', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-18 23:53:04', '2025-11-18 23:53:04'),
('840aaf5d-33f1-42ee-bf61-442fca9a8cc8', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-22 11:14:13', '2025-11-22 11:14:13'),
('841f4bca-c4e6-4efc-8a68-044b43fc547e', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-26 08:15:28', '2025-11-26 08:15:28'),
('84bfc3c5-bc6d-4fd8-9309-f5c2f41d4c3f', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 13:56:37', '2025-11-17 13:56:37'),
('86df236e-9b95-4e53-8811-3e2a7f62570c', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 19:37:16', '2025-11-17 19:37:16'),
('873123e6-5df7-4743-82a9-3556fc28af31', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 13:05:50', '2025-11-17 13:05:50'),
('873297e4-62ad-43bc-b6db-50662f062456', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 18:41:38', '2025-11-27 18:41:38'),
('875087fd-6cae-4373-973e-18a9f8de0fb9', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 10:34:00', '2025-11-27 10:34:00'),
('87c85f8e-0dad-4eba-a4b1-2cada18a0a6b', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 09:24:05', '2025-11-24 09:24:05'),
('87f8849b-01d1-48ff-9afb-bc52c4888260', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', 'Hanna N. Sarabia', 'admin', 'CREATE', 'Inventory', 'medication_inventory', 'fcfefa31-7b0e-4e49-b11f-a11ef45c9694', 'fcfefa31-7b0e-4e49-b11f-a11ef45c9694', NULL, '{\"inventory_id\":\"fcfefa31-7b0e-4e49-b11f-a11ef45c9694\",\"medication_id\":\"9117b66c-a29f-43cc-ac78-5724222f7a38\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440001\",\"quantity_on_hand\":100,\"reorder_level\":50,\"expiry_date\":\"2026-11-15\"}', 'Added inventory for Efavirenz 600mg at MyHubCares Main Clinic', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-15 18:56:04', '2025-11-15 18:56:04'),
('887541f6-f574-4656-ab6d-db87213742ff', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 12:20:05', '2025-11-17 12:20:05'),
('887bacb8-d257-4635-b8b8-54a027d3a66a', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 08:51:41', '2025-11-24 08:51:41'),
('89663b12-db11-4e8d-bea7-8fc9a3b9992e', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', 'Hanna N. Sarabia', 'admin', 'UPDATE', 'Users', 'user', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', '{\"status\":\"active\"}', '{\"status\":\"inactive\"}', 'Changed status of  (trixie) from active to inactive', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 11:59:40', '2025-11-16 11:59:40'),
('89f4db6e-6b69-423e-89d4-57fc0b78ff2f', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 12:00:31', '2025-11-27 12:00:31'),
('8ac5bc39-5ea7-4e54-aca4-45594643646d', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-21 10:08:25', '2025-11-21 10:08:25'),
('8f7c9b7b-9c2b-4818-9179-fea113c79f88', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 13:32:41', '2025-11-27 13:32:41'),
('8fbb1247-9e27-4ea7-b72b-9424813f3043', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'EXPORT', 'Reports', 'report_run', 'cc1fb930-078f-43bd-b65d-8460029b5efb', 'cc1fb930-078f-43bd-b65d-8460029b5efb', NULL, '{\"run_id\":\"cc1fb930-078f-43bd-b65d-8460029b5efb\",\"report_id\":\"3abccdc0-6f7f-4bef-ac22-251c142149a8\",\"report_type\":\"patient\",\"reportData\":{\"total_patients\":3,\"male_count\":1,\"female_count\":2}}', 'Generated patient report', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-22 15:02:01', '2025-11-22 15:02:01'),
('9120415b-b1bd-4100-b991-a385aa6d7a08', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 18:49:11', '2025-11-27 18:49:11');
INSERT INTO `audit_log` (`audit_id`, `user_id`, `user_name`, `user_role`, `action`, `module`, `entity_type`, `entity_id`, `record_id`, `old_value`, `new_value`, `change_summary`, `ip_address`, `device_type`, `user_agent`, `remarks`, `status`, `error_message`, `timestamp`, `created_at`) VALUES
('9367b631-2ec0-4376-990f-f35d4a6660da', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 16:07:35', '2025-11-16 16:07:35'),
('93981778-32b6-4ee4-b32e-3c6333dc8b74', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 18:43:37', '2025-11-27 18:43:37'),
('95c4ad30-d719-4e0b-9176-418e9fb9c495', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 17:22:53', '2025-11-17 17:22:53'),
('96fed148-bf07-4f80-949a-b32fe440e770', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 19:40:16', '2025-11-17 19:40:16'),
('9863176a-61e6-47d9-a772-e43b2b92e332', '42356bf7-84ef-4aaa-9610-d74b65c3929f', 'Trixie Morales', 'physician', 'LOGIN', 'Authentication', 'user', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '42356bf7-84ef-4aaa-9610-d74b65c3929f', NULL, NULL, 'Successful login: Trixie', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 09:41:49', '2025-11-19 09:41:49'),
('988f285b-b6cc-46c4-bd48-9dfb6ef22632', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'EXPORT', 'Reports', 'report_run', '6b26e2ee-ea27-4e05-998b-9891f47f0f5a', '6b26e2ee-ea27-4e05-998b-9891f47f0f5a', NULL, '{\"run_id\":\"6b26e2ee-ea27-4e05-998b-9891f47f0f5a\",\"report_id\":\"3abccdc0-6f7f-4bef-ac22-251c142149a8\",\"report_type\":\"patient\",\"reportData\":{\"total_patients\":3,\"male_count\":1,\"female_count\":2}}', 'Generated patient report', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-22 15:01:54', '2025-11-22 15:01:54'),
('9b06ef3b-ab17-4f50-91c7-ea25a57f4966', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 14:16:05', '2025-11-16 14:16:05'),
('9b74cecc-dbf0-4561-ac19-6c1efa63a30a', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'CREATE', 'Roles', 'role_permission', 'e379f720-cb60-4cfa-ac9f-17b2dce7da7b', 'e379f720-cb60-4cfa-ac9f-17b2dce7da7b', NULL, '{\"role_id\":\"role-0000-0000-0000-000000000006\",\"permission_id\":\"perm-0000-0000-0000-000000000002\"}', 'Granted permission \"View Patient\" to role \"Patient\"', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 10:26:31', '2025-11-27 10:26:31'),
('9bda4c41-b816-4282-94b7-a0a31b7bc08e', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Failed login attempt: Invalid password for patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-16 15:25:03', '2025-11-16 15:25:03'),
('9d1122c7-6072-4cc9-b5fb-d105b3edce24', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', 'trixie', 'physician', 'LOGIN', 'Authentication', 'user', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', NULL, NULL, 'Successful login: trixie', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 10:42:17', '2025-11-16 10:42:17'),
('9d9a894a-a596-4627-a7d3-9b54d23572cf', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 18:42:17', '2025-11-17 18:42:17'),
('9dd0ef1d-a152-407c-81b8-646f84c6075f', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', 'Hanna N. Sarabia', 'admin', 'UPDATE', 'Clinical Visits', 'clinical_visit', '3202ceae-5caf-4a5b-8eb9-b087f9679d51', '3202ceae-5caf-4a5b-8eb9-b087f9679d51', '{\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"provider_id\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\",\"facility_id\":\"7092d90f-5986-44fc-a56d-87abbf6b003d\",\"visit_date\":\"2025-11-09T16:00:00.000Z\",\"visit_type\":\"follow_up\",\"who_stage\":\"Stage 2\",\"chief_complaint\":\"dadas\",\"clinical_notes\":\"\",\"assessment\":\"dasdaa\",\"plan\":\"dasda\",\"follow_up_date\":\"2025-10-29T16:00:00.000Z\",\"follow_up_reason\":\"Laging Galit sa buhay\",\"created_at\":\"2025-11-15T04:54:11.000Z\",\"updated_at\":\"2025-11-15T08:15:23.000Z\"}', '{\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"provider_id\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\",\"facility_id\":\"7092d90f-5986-44fc-a56d-87abbf6b003d\",\"visit_date\":\"2025-11-08T16:00:00.000Z\",\"visit_type\":\"follow_up\",\"who_stage\":\"Stage 2\",\"chief_complaint\":\"dadas\",\"clinical_notes\":\"\",\"assessment\":\"dasdaa\",\"plan\":\"dasda\",\"follow_up_date\":\"2025-10-28T16:00:00.000Z\",\"follow_up_reason\":\"Laging Galit sa buhay\",\"created_at\":\"2025-11-15T04:54:11.000Z\",\"updated_at\":\"2025-11-15T09:08:03.000Z\",\"patientName\":\"Trixie Ann Morales\",\"providerName\":\"Hanna N. Sarabia\",\"facilityName\":\"MyHubCares Manila Branch\",\"diagnoses\":[{\"diagnosis_id\":\"77e96a37-65ad-48b6-864a-39deac62cf33\",\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"icd10_code\":\"\",\"diagnosis_description\":\"\",\"diagnosis_type\":\"secondary\",\"is_chronic\":0,\"onset_date\":\"1899-11-28T16:00:00.000Z\",\"resolved_date\":\"1899-11-28T16:00:00.000Z\"}],\"procedures\":[{\"procedure_id\":\"f932a7fd-4d82-4668-8b87-c2cb17cae8eb\",\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"cpt_code\":\"9235\",\"procedure_name\":\"Physical Examination\",\"procedure_description\":\"No further error\",\"outcome\":\"No signs of illness\",\"performed_at\":\"2025-11-15T01:03:00.000Z\"}]}', 'Updated clinical visit 3202ceae-5caf-4a5b-8eb9-b087f9679d51', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-15 17:08:03', '2025-11-15 17:08:03'),
('9e0b7465-0439-4a03-ab75-05c1437127b5', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 16:17:55', '2025-11-24 16:17:55'),
('9f323267-9ae2-4b94-9922-dfef64911442', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'CREATE', 'Referrals', 'referral', 'e2920bee-3464-45bb-89a8-f6987d7ffe13', 'e2920bee-3464-45bb-89a8-f6987d7ffe13', NULL, '{\"referral_id\":\"e2920bee-3464-45bb-89a8-f6987d7ffe13\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"from_facility_id\":\"550e8400-e29b-41d4-a716-446655440001\",\"to_facility_id\":\"550e8400-e29b-41d4-a716-446655440002\",\"urgency\":\"routine\"}', 'Created referral for patient 80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 15:19:32', '2025-11-19 15:19:32'),
('a24b8f01-ab07-42b8-9f5b-ddd9d2eee7d1', 'unknown', 'Unknown', 'unknown', 'LOGIN', 'Authentication', 'user', NULL, 'cas', NULL, NULL, 'Failed login attempt: Invalid username - cas', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid username or password', '2025-11-19 13:43:37', '2025-11-19 13:43:37'),
('a271d3a9-68a9-47c0-9c7c-0703831dae5d', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 19:43:44', '2025-11-17 19:43:44'),
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
('aa07084f-1ea5-476a-98ad-2d2323c100d9', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 14:33:11', '2025-11-24 14:33:11'),
('aa8a7f75-bfd1-4a01-82f2-4545ca8484cf', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 10:32:35', '2025-11-27 10:32:35'),
('ab447ae4-1a58-491c-8387-8c7677233a0d', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 11:27:46', '2025-11-19 11:27:46'),
('b29f1feb-0798-42d8-9452-79b768401ffe', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 11:25:27', '2025-11-27 11:25:27'),
('b36de99b-cecf-400e-9a78-7e6f4bd64843', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-26 11:00:03', '2025-11-26 11:00:03'),
('b3d54d7b-1f34-4fee-9ae7-9fbf36d4a272', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'EXPORT', 'Reports', 'report_run', '716a6953-fbca-4237-ae12-35b1d363ed48', '716a6953-fbca-4237-ae12-35b1d363ed48', NULL, '{\"run_id\":\"716a6953-fbca-4237-ae12-35b1d363ed48\",\"report_id\":\"3abccdc0-6f7f-4bef-ac22-251c142149a8\",\"report_type\":\"patient\",\"reportData\":{\"total_patients\":3,\"male_count\":1,\"female_count\":2}}', 'Generated patient report', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-22 13:51:37', '2025-11-22 13:51:37'),
('b423fddc-d150-49ce-9f86-fac457665bf9', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'CREATE', 'Clinical Visits', 'clinical_visit', '062cea3c-ff0c-44a5-9879-ec40b501b375', '062cea3c-ff0c-44a5-9879-ec40b501b375', NULL, '{\"visit_id\":\"062cea3c-ff0c-44a5-9879-ec40b501b375\",\"patient_id\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"visit_type\":\"emergency\",\"visit_date\":\"2025-11-16\"}', 'Created clinical visit for patient aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 12:47:06', '2025-11-16 12:47:06'),
('b585751b-12fa-4ade-a662-2cca65292e95', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-21 10:09:08', '2025-11-21 10:09:08'),
('b7e31628-0415-4ddd-90e6-43c81ff59780', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 13:43:42', '2025-11-19 13:43:42'),
('b8b9c22c-2d5c-4e2c-ba98-34e47ad66655', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-21 08:46:28', '2025-11-21 08:46:28'),
('bb4e1364-5799-41bd-8063-82ac12d07a5c', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'CREATE', 'Roles', 'role_permission', '56cb7249-0f26-4b3b-947c-aecc75c97cd8', '56cb7249-0f26-4b3b-947c-aecc75c97cd8', NULL, '{\"role_id\":\"role-0000-0000-0000-000000000004\",\"permission_id\":\"perm-0000-0000-0000-000000000014\"}', 'Granted permission \"View Prescription\" to role \"Case Manager\"', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 18:42:24', '2025-11-27 18:42:24'),
('bdec5c34-ac7f-44c1-b83d-65695c6fe503', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 16:33:44', '2025-11-17 16:33:44'),
('be9b77b7-ed13-48da-a4bd-a6edc02ef8bc', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 10:14:40', '2025-11-19 10:14:40'),
('bfe37409-a83f-453d-a490-22bf97f06afe', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 20:06:12', '2025-11-17 20:06:12'),
('c04d5fec-7b95-4c15-aa08-87bab2e45df0', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 15:52:57', '2025-11-17 15:52:57'),
('c13db728-58aa-410c-a35d-7f4671d20b72', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 16:32:48', '2025-11-17 16:32:48'),
('c17ea91a-d527-4993-ba1b-baa393ed5cf2', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 17:57:50', '2025-11-27 17:57:50'),
('c2cc38ae-cad0-4ef0-88b9-e2765632b18a', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'DELETE', 'Care Tasks', 'care_task', '5bd81d95-4c1e-4ddc-b69f-c2d7dfe45a66', '5bd81d95-4c1e-4ddc-b69f-c2d7dfe45a66', '{\"task_id\":\"5bd81d95-4c1e-4ddc-b69f-c2d7dfe45a66\",\"referral_id\":null,\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"assignee_id\":\"42356bf7-84ef-4aaa-9610-d74b65c3929f\",\"task_type\":\"follow_up\",\"task_description\":\"dfadasda\",\"due_date\":\"2025-11-18T16:00:00.000Z\",\"status\":\"pending\",\"completed_at\":null,\"created_at\":\"2025-11-19T07:31:32.000Z\",\"created_by\":\"11111111-1111-1111-1111-111111111111\"}', NULL, 'Deleted care task 5bd81d95-4c1e-4ddc-b69f-c2d7dfe45a66', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 15:49:53', '2025-11-19 15:49:53'),
('c3459c90-f9e2-4115-b8d2-5e700e0b9da0', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', '8201188a-a4eb-4677-816f-08e0998056c2', NULL, NULL, NULL, NULL, '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'dispense_events is not defined', '2025-11-16 14:21:53', '2025-11-16 14:21:53'),
('c5ec9730-75f7-437b-850a-6d5985d71d20', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', 'Hanna N. Sarabia', 'admin', 'UPDATE', 'Clinical Visits', 'clinical_visit', '3202ceae-5caf-4a5b-8eb9-b087f9679d51', '3202ceae-5caf-4a5b-8eb9-b087f9679d51', '{\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"provider_id\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\",\"facility_id\":\"7092d90f-5986-44fc-a56d-87abbf6b003d\",\"visit_date\":\"2025-11-08T16:00:00.000Z\",\"visit_type\":\"follow_up\",\"who_stage\":\"Stage 2\",\"chief_complaint\":\"dadas\",\"clinical_notes\":\"\",\"assessment\":\"dasdaa\",\"plan\":\"dasda\",\"follow_up_date\":\"2025-10-28T16:00:00.000Z\",\"follow_up_reason\":\"Laging Galit sa buhay\",\"created_at\":\"2025-11-15T04:54:11.000Z\",\"updated_at\":\"2025-11-15T09:08:03.000Z\"}', '{\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"provider_id\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\",\"facility_id\":\"7092d90f-5986-44fc-a56d-87abbf6b003d\",\"visit_date\":\"2025-11-07T16:00:00.000Z\",\"visit_type\":\"follow_up\",\"who_stage\":\"Stage 2\",\"chief_complaint\":\"dadas\",\"clinical_notes\":\"\",\"assessment\":\"dasdaa\",\"plan\":\"dasda\",\"follow_up_date\":\"2025-10-27T16:00:00.000Z\",\"follow_up_reason\":\"Laging Galit sa buhay\",\"created_at\":\"2025-11-15T04:54:11.000Z\",\"updated_at\":\"2025-11-15T09:08:07.000Z\",\"patientName\":\"Trixie Ann Morales\",\"providerName\":\"Hanna N. Sarabia\",\"facilityName\":\"MyHubCares Manila Branch\",\"diagnoses\":[{\"diagnosis_id\":\"77e96a37-65ad-48b6-864a-39deac62cf33\",\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"icd10_code\":\"\",\"diagnosis_description\":\"\",\"diagnosis_type\":\"secondary\",\"is_chronic\":0,\"onset_date\":\"1899-11-27T16:00:00.000Z\",\"resolved_date\":\"1899-11-27T16:00:00.000Z\"},{\"diagnosis_id\":\"c381c663-1be5-4615-af98-3b9a141e3fdf\",\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"icd10_code\":\"120\",\"diagnosis_description\":\"It is having an collapse\",\"diagnosis_type\":\"primary\",\"is_chronic\":1,\"onset_date\":\"2025-11-08T16:00:00.000Z\",\"resolved_date\":\"2025-11-15T16:00:00.000Z\"}],\"procedures\":[{\"procedure_id\":\"f932a7fd-4d82-4668-8b87-c2cb17cae8eb\",\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"cpt_code\":\"9235\",\"procedure_name\":\"Physical Examination\",\"procedure_description\":\"No further error\",\"outcome\":\"No signs of illness\",\"performed_at\":\"2025-11-14T17:03:00.000Z\"}]}', 'Updated clinical visit 3202ceae-5caf-4a5b-8eb9-b087f9679d51', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-15 17:08:07', '2025-11-15 17:08:07'),
('c62d8ba7-51ed-404a-ab75-90a6fc749231', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 00:03:10', '2025-11-19 00:03:10'),
('c6675c6b-915a-41b6-8f2a-2de881ffab80', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-18 23:53:35', '2025-11-18 23:53:35'),
('c7ec4100-64d8-4643-8293-9ac2c258115e', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-26 08:15:09', '2025-11-26 08:15:09'),
('c80cf390-e7be-477e-ab94-e831607dd6e1', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 16:01:13', '2025-11-27 16:01:13'),
('c87790df-cf6b-4ca2-9f4e-568256189ef1', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-18 22:24:33', '2025-11-18 22:24:33'),
('c8c71a6b-8d03-4ec0-9d07-6ebdc2f732d5', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', 'Hanna N. Sarabia', 'admin', 'UPDATE', 'Clinical Visits', 'clinical_visit', '3202ceae-5caf-4a5b-8eb9-b087f9679d51', '3202ceae-5caf-4a5b-8eb9-b087f9679d51', '{\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"provider_id\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\",\"facility_id\":\"7092d90f-5986-44fc-a56d-87abbf6b003d\",\"visit_date\":\"2025-11-13T16:00:00.000Z\",\"visit_type\":\"follow_up\",\"who_stage\":\"Stage 2\",\"chief_complaint\":\"dadas\",\"clinical_notes\":\"\",\"assessment\":\"dasdaa\",\"plan\":\"dasda\",\"follow_up_date\":null,\"follow_up_reason\":\"dfsdfds\",\"created_at\":\"2025-11-15T04:54:11.000Z\",\"updated_at\":\"2025-11-15T05:25:43.000Z\"}', '{\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"provider_id\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\",\"facility_id\":\"7092d90f-5986-44fc-a56d-87abbf6b003d\",\"visit_date\":\"2025-11-12T16:00:00.000Z\",\"visit_type\":\"follow_up\",\"who_stage\":\"Stage 2\",\"chief_complaint\":\"dadas\",\"clinical_notes\":\"\",\"assessment\":\"dasdaa\",\"plan\":\"dasda\",\"follow_up_date\":\"2025-11-01T16:00:00.000Z\",\"follow_up_reason\":\"Laging Galit sa buhay\",\"created_at\":\"2025-11-15T04:54:11.000Z\",\"updated_at\":\"2025-11-15T08:09:16.000Z\"}', 'Updated clinical visit 3202ceae-5caf-4a5b-8eb9-b087f9679d51', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-15 16:09:17', '2025-11-15 16:09:17'),
('c94e6c89-8531-4c31-9dd6-0bcba8f5d1d3', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-21 12:09:14', '2025-11-21 12:09:14'),
('c9e5e385-0b62-4399-8865-44b0d8410a02', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-18 22:17:43', '2025-11-18 22:17:43'),
('ca519f74-a42b-4adb-9fc7-07649badab42', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', '8201188a-a4eb-4677-816f-08e0998056c2', NULL, NULL, NULL, NULL, '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'dispense_events is not defined', '2025-11-16 14:40:56', '2025-11-16 14:40:56'),
('cc5e8f6a-b90e-442f-951c-482ad199bd40', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'CREATE', 'Referrals', 'referral', '943bb845-401f-43f7-b661-5340d7fc728d', '943bb845-401f-43f7-b661-5340d7fc728d', NULL, '{\"referral_id\":\"943bb845-401f-43f7-b661-5340d7fc728d\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"from_facility_id\":\"550e8400-e29b-41d4-a716-446655440001\",\"to_facility_id\":\"550e8400-e29b-41d4-a716-446655440002\",\"urgency\":\"routine\"}', 'Created referral for patient 80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 15:24:28', '2025-11-19 15:24:28'),
('cd645a2c-3ca1-4b87-99d8-9190a52fc793', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', 'Hanna N. Sarabia', 'admin', 'UPDATE', 'Patients', 'patient', '7db2ecfb-e409-41f3-a632-b5db0d4f868b', '7db2ecfb-e409-41f3-a632-b5db0d4f868b', '{\"patient_id\":\"7db2ecfb-e409-41f3-a632-b5db0d4f868b\",\"uic\":\"HASA01062204\",\"philhealth_no\":null,\"first_name\":\"Hanna\",\"middle_name\":\"N.\",\"last_name\":\"Sarabia\",\"suffix\":null,\"birth_date\":\"2204-01-05T16:00:00.000Z\",\"sex\":\"F\",\"civil_status\":\"Single\",\"nationality\":\"Filipino\",\"current_city\":\"Calocan\",\"current_province\":\"METRO MANILA\",\"current_address\":\"{\\\"city\\\":\\\"Calocan\\\",\\\"province\\\":\\\"METRO MANILA\\\"}\",\"contact_phone\":\"0966-312-2562\",\"email\":\"sarabia.hanna.bsinfotech@gmail.com\",\"mother_name\":null,\"father_name\":null,\"birth_order\":null,\"guardian_name\":null,\"guardian_relationship\":null,\"facility_id\":\"550e8400-e29b-41d4-a716-446655440001\",\"arpa_risk_score\":null,\"arpa_last_calculated\":null,\"status\":\"active\",\"created_at\":\"2025-11-11T04:17:15.000Z\",\"updated_at\":\"2025-11-11T04:17:15.000Z\",\"created_by\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\"}', '{\"patient_id\":\"7db2ecfb-e409-41f3-a632-b5db0d4f868b\",\"uic\":\"HASA01062204\",\"philhealth_no\":null,\"first_name\":\"Hanna\",\"middle_name\":\"N.\",\"last_name\":\"Sarabia\",\"suffix\":null,\"birth_date\":\"2204-01-04T16:00:00.000Z\",\"sex\":\"F\",\"civil_status\":\"Single\",\"nationality\":\"Filipino\",\"current_city\":\"Calocan\",\"current_province\":\"METRO MANILA\",\"current_address\":\"{\\\"city\\\":\\\"Calocan\\\",\\\"province\\\":\\\"METRO MANILA\\\"}\",\"contact_phone\":\"0966-312-2562\",\"email\":\"sarabia.hanna.bsinfotech@gmail.com\",\"mother_name\":\"Edita Narzoles\",\"father_name\":\"Delfin Sarabia\",\"birth_order\":null,\"guardian_name\":\"Edita Narzoles\",\"guardian_relationship\":\"Mother\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440001\",\"arpa_risk_score\":null,\"arpa_last_calculated\":null,\"status\":\"active\",\"created_at\":\"2025-11-11T04:17:15.000Z\",\"updated_at\":\"2025-11-15T12:45:18.000Z\",\"created_by\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\",\"facility_name\":\"MyHubCares Main Clinic\"}', 'Patient updated: Hanna Sarabia (UIC: HASA01062204)', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-15 20:45:18', '2025-11-15 20:45:18'),
('cfaf6f25-f92d-4044-9ec8-2d9e5d437021', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Failed login attempt: Invalid password for admin', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-16 12:16:54', '2025-11-16 12:16:54'),
('d0547c4f-2741-4dee-aea7-9f29a2c77d0e', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 17:16:45', '2025-11-17 17:16:45'),
('d22d5e02-0a08-4953-b48e-2ce88c810d6b', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'EXPORT', 'Reports', 'report_run', 'b403baec-92bc-4fd8-b70f-2c126fb23937', 'b403baec-92bc-4fd8-b70f-2c126fb23937', NULL, '{\"run_id\":\"b403baec-92bc-4fd8-b70f-2c126fb23937\",\"report_id\":\"8b7c0f29-9fe3-4426-b38c-2879004b6d3e\",\"report_type\":\"inventory\",\"reportData\":{\"total_items\":4,\"total_stock\":\"1120\",\"low_stock_count\":1,\"expiring_soon_count\":0}}', 'Generated inventory report', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-22 12:03:24', '2025-11-22 12:03:24'),
('d28bc51b-7416-43b7-904d-dc2e17999a8a', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 18:24:06', '2025-11-17 18:24:06'),
('d341c1e8-9432-4129-ab7b-e48b9175dfb1', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'UPDATE', 'Care Tasks', 'care_task', '221db5f0-6abc-45a3-a6a7-ded8a6e690ca', '221db5f0-6abc-45a3-a6a7-ded8a6e690ca', '{\"status\":\"pending\"}', '{\"status\":\"in_progress\"}', 'Updated care task status to in_progress', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 15:50:00', '2025-11-19 15:50:00'),
('d3c27e08-a3de-48f3-84b5-178a0f6455ee', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 19:12:25', '2025-11-17 19:12:25'),
('d5459324-0515-491c-91fc-ac2c91d51fe0', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-21 13:34:29', '2025-11-21 13:34:29'),
('d5c3082d-0884-4d2e-b55f-de1a35e5c615', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 16:34:38', '2025-11-17 16:34:38'),
('d6078b00-5ce0-47a7-ab06-fbc44809d659', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'CREATE', 'Counseling Sessions', 'counseling_session', '45534bc6-d2b6-4213-a582-7256f268cf33', '45534bc6-d2b6-4213-a582-7256f268cf33', NULL, '{\"session_id\":\"45534bc6-d2b6-4213-a582-7256f268cf33\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"session_type\":\"adherence\",\"follow_up_required\":true}', 'Recorded adherence counseling session for patient 80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 16:13:36', '2025-11-19 16:13:36'),
('d610c1e8-772d-4504-9c5b-4e054f492d37', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 15:13:22', '2025-11-17 15:13:22'),
('d614869a-e32d-41ef-b806-5442d7b7c5fe', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'CREATE', 'Prescriptions', 'prescription', '82f27f2c-2eaa-44de-9661-488f51d92c4b', '82f27f2c-2eaa-44de-9661-488f51d92c4b', NULL, '{\"prescription_id\":\"82f27f2c-2eaa-44de-9661-488f51d92c4b\",\"prescription_number\":\"RX-20251117-0001\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"prescriber_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"items\":[{\"prescription_item_id\":\"acb91d51-cf61-4d84-bf8e-4278c739eefe\",\"medication_id\":\"9117b66c-a29f-43cc-ac78-5724222f7a38\",\"quantity\":1}]}', 'Created prescription RX-20251117-0001 for patient Hanna Sarabia', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 16:31:30', '2025-11-17 16:31:30'),
('d64e0b88-fc7e-4645-ae1f-b765fa1f1cac', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 09:42:31', '2025-11-19 09:42:31'),
('d69d4557-6fd4-44f6-9cd4-498b025fdbbe', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-26 14:14:01', '2025-11-26 14:14:01'),
('da5c7a2a-a256-430f-8260-63d77f6a616e', '55555555-5555-5555-5555-555555555555', 'Ana Rodriguez', 'lab_personnel', 'LOGIN', 'Authentication', 'user', '55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', NULL, NULL, 'Successful login: lab_personnel', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 10:34:44', '2025-11-27 10:34:44'),
('da8b8801-75c5-44e4-921e-cadda660a378', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', 'trixie', 'physician', 'LOGIN', 'Authentication', 'user', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', NULL, NULL, 'Failed login attempt: Invalid password for trixie', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-15 20:33:45', '2025-11-15 20:33:45'),
('dac4eead-2bc0-489d-9f4f-a70b18b335c2', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 11:26:01', '2025-11-19 11:26:01'),
('dbda3472-09a7-4f36-9d3f-0112379e0158', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 16:10:41', '2025-11-17 16:10:41'),
('dbe81d06-b2db-4fd8-b472-47f9d5973041', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 10:45:27', '2025-11-27 10:45:27'),
('dc24b3ba-97d3-43ce-993e-f079db7b40de', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-25 17:30:48', '2025-11-25 17:30:48'),
('ddded849-ddd8-40bf-8068-6b66a875d7b2', 'unknown', 'Unknown', 'unknown', 'LOGIN', 'Authentication', 'user', NULL, 'cas', NULL, NULL, 'Failed login attempt: Invalid username - cas', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid username or password', '2025-11-19 13:43:38', '2025-11-19 13:43:38'),
('de246fac-cb1a-4f1c-a1cd-65af0505d66d', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 19:14:59', '2025-11-17 19:14:59'),
('de73e72f-6c18-495a-b550-024f015be723', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 09:01:51', '2025-11-19 09:01:51'),
('de767bee-e870-4818-b36f-0c85d333b3ae', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'DELETE', 'Lab Orders', 'lab_order', 'e4e5c4d0-e314-4c45-bf8f-bb3cacc27a9c', 'e4e5c4d0-e314-4c45-bf8f-bb3cacc27a9c', '{\"order_id\":\"e4e5c4d0-e314-4c45-bf8f-bb3cacc27a9c\",\"patient_id\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"ordering_provider_id\":\"11111111-1111-1111-1111-111111111111\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"order_date\":\"2025-11-15T16:00:00.000Z\",\"test_panel\":\"Viral Load\",\"priority\":\"urgent\",\"status\":\"cancelled\",\"collection_date\":\"2025-11-15T16:00:00.000Z\",\"notes\":null,\"created_at\":\"2025-11-16T13:35:53.000Z\"}', NULL, 'Cancelled lab order: Viral Load', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 12:46:50', '2025-11-17 12:46:50'),
('e1f698c9-c7f7-4fac-b6b7-ab0a069090b5', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 16:09:09', '2025-11-24 16:09:09');
INSERT INTO `audit_log` (`audit_id`, `user_id`, `user_name`, `user_role`, `action`, `module`, `entity_type`, `entity_id`, `record_id`, `old_value`, `new_value`, `change_summary`, `ip_address`, `device_type`, `user_agent`, `remarks`, `status`, `error_message`, `timestamp`, `created_at`) VALUES
('e205223e-f54b-442e-a749-c0da543d4acb', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', '8201188a-a4eb-4677-816f-08e0998056c2', NULL, NULL, NULL, NULL, '::1', NULL, 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36', NULL, 'failed', 'dispense_events is not defined', '2025-11-16 14:41:25', '2025-11-16 14:41:25'),
('e27a1f53-598f-4e0b-8cfb-7486e2e0b082', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-21 10:22:16', '2025-11-21 10:22:16'),
('e2809df2-9701-4e3c-a979-7681a6ca459c', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 18:43:23', '2025-11-17 18:43:23'),
('e293be08-3015-4414-92ba-3318550a8a37', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 13:32:30', '2025-11-27 13:32:30'),
('e2f32dfa-c9b3-4a34-a197-2888f17744de', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 17:28:12', '2025-11-17 17:28:12'),
('e338eb0a-a444-4d93-9cb2-37d37e6540dd', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-25 16:43:48', '2025-11-25 16:43:48'),
('e33b9e14-2617-449e-b064-bdc0df1186df', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 15:11:45', '2025-11-24 15:11:45'),
('e3e10940-204b-4106-b92d-5ea52edc7f91', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', '8201188a-a4eb-4677-816f-08e0998056c2', '8201188a-a4eb-4677-816f-08e0998056c2', NULL, '{\"prescription_id\":\"8201188a-a4eb-4677-816f-08e0998056c2\",\"prescription_number\":\"RX-20251116-0001\",\"dispense_events\":[{\"dispense_id\":\"5c4e5a12-976c-4355-9a8a-a6a74e97ab02\",\"medication_name\":\"Efavirenz 600mg\",\"quantity_dispensed\":1}]}', 'Dispensed medication for prescription RX-20251116-0001', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 14:21:53', '2025-11-16 14:21:53'),
('e4d08b0c-3d87-4569-b068-924134e3bd43', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', '', 'Prescriptions', 'prescription', '82f27f2c-2eaa-44de-9661-488f51d92c4b', '82f27f2c-2eaa-44de-9661-488f51d92c4b', NULL, '{\"prescription_id\":\"82f27f2c-2eaa-44de-9661-488f51d92c4b\",\"prescription_number\":\"RX-20251117-0001\",\"dispense_events\":[{\"dispense_id\":\"3173327c-71aa-4322-9806-df26694a0d6d\",\"medication_name\":\"Efavirenz 600mg\",\"quantity_dispensed\":10}]}', 'Dispensed medication for prescription RX-20251117-0001', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 09:23:56', '2025-11-24 09:23:56'),
('e55ce961-342a-41c1-9abd-b55ac0d8a4f6', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', 'Hanna N. Sarabia', 'admin', 'UPDATE', 'Clinical Visits', 'clinical_visit', '3202ceae-5caf-4a5b-8eb9-b087f9679d51', '3202ceae-5caf-4a5b-8eb9-b087f9679d51', '{\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"provider_id\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\",\"facility_id\":\"7092d90f-5986-44fc-a56d-87abbf6b003d\",\"visit_date\":\"2025-11-11T16:00:00.000Z\",\"visit_type\":\"follow_up\",\"who_stage\":\"Stage 2\",\"chief_complaint\":\"dadas\",\"clinical_notes\":\"\",\"assessment\":\"dasdaa\",\"plan\":\"dasda\",\"follow_up_date\":\"2025-10-31T16:00:00.000Z\",\"follow_up_reason\":\"Laging Galit sa buhay\",\"created_at\":\"2025-11-15T04:54:11.000Z\",\"updated_at\":\"2025-11-15T08:14:51.000Z\"}', '{\"visit_id\":\"3202ceae-5caf-4a5b-8eb9-b087f9679d51\",\"patient_id\":\"169b7991-2e21-4f62-8672-f06f129a8cbb\",\"provider_id\":\"ffa85dab-263d-48e6-9cb1-fdef46b9b4a8\",\"facility_id\":\"7092d90f-5986-44fc-a56d-87abbf6b003d\",\"visit_date\":\"2025-11-10T16:00:00.000Z\",\"visit_type\":\"follow_up\",\"who_stage\":\"Stage 2\",\"chief_complaint\":\"dadas\",\"clinical_notes\":\"\",\"assessment\":\"dasdaa\",\"plan\":\"dasda\",\"follow_up_date\":\"2025-10-30T16:00:00.000Z\",\"follow_up_reason\":\"Laging Galit sa buhay\",\"created_at\":\"2025-11-15T04:54:11.000Z\",\"updated_at\":\"2025-11-15T08:15:10.000Z\"}', 'Updated clinical visit 3202ceae-5caf-4a5b-8eb9-b087f9679d51', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-15 16:15:10', '2025-11-15 16:15:10'),
('e55d97b2-2470-4aa8-906d-f8410f3101fd', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 16:12:28', '2025-11-17 16:12:28'),
('e6b87bfa-e42c-40e9-bf2f-93ea84d251eb', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 16:22:27', '2025-11-17 16:22:27'),
('e75d4bde-e4a6-4412-9fa6-c536c5e0d448', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'CREATE', 'Roles', 'role_permission', '1ee8d17e-3e1f-4e51-a978-539f97a912dc', '1ee8d17e-3e1f-4e51-a978-539f97a912dc', NULL, '{\"role_id\":\"role-0000-0000-0000-000000000006\",\"permission_id\":\"perm-0000-0000-0000-000000000018\"}', 'Granted permission \"View Appointment\" to role \"Patient\"', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 10:26:30', '2025-11-27 10:26:30'),
('e7e7c1a1-50bc-45bb-a761-3c9dae65053c', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'DELETE', 'Roles', 'role_permission', '1ee8d17e-3e1f-4e51-a978-539f97a912dc', '1ee8d17e-3e1f-4e51-a978-539f97a912dc', '{\"role_id\":\"role-0000-0000-0000-000000000006\",\"permission_id\":\"perm-0000-0000-0000-000000000018\"}', NULL, 'Revoked permission \"View Appointment\" from role \"Patient\"', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 10:26:37', '2025-11-27 10:26:37'),
('e8552eef-98f4-48d0-ad0d-65c5a5d6c93a', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-17 15:31:26', '2025-11-17 15:31:26'),
('e8cb3f83-4391-463f-836d-3144b8a83e40', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 18:12:45', '2025-11-27 18:12:45'),
('ea069af8-7dc1-47e6-94dd-48c7ed6ae8e1', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'UPDATE', 'Care Tasks', 'care_task', '221db5f0-6abc-45a3-a6a7-ded8a6e690ca', '221db5f0-6abc-45a3-a6a7-ded8a6e690ca', '{\"status\":\"in_progress\"}', '{\"status\":\"completed\"}', 'Updated care task status to completed', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 15:50:06', '2025-11-19 15:50:06'),
('ea244ee3-c934-4ef0-b896-aa45d9a358c7', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'CREATE', 'Inventory', 'medication_inventory', '79642a00-11ce-47eb-934a-1e9c3be7dd5c', '79642a00-11ce-47eb-934a-1e9c3be7dd5c', NULL, '{\"inventory_id\":\"79642a00-11ce-47eb-934a-1e9c3be7dd5c\",\"medication_id\":\"9117b66c-a29f-43cc-ac78-5724222f7a38\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"quantity_on_hand\":150,\"reorder_level\":200,\"expiry_date\":\"2026-11-16\"}', 'Added inventory for Efavirenz 600mg at MyHubCares Main Facility', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 12:48:17', '2025-11-16 12:48:17'),
('ea990e24-bdde-49da-a1a9-8f0b5283fc81', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'DELETE', 'Roles', 'role_permission', 'rp-pat-0001-0001-0001-000000000002', 'rp-pat-0001-0001-0001-000000000002', '{\"role_id\":\"role-0000-0000-0000-000000000006\",\"permission_id\":\"perm-0000-0000-0000-000000000018\"}', NULL, 'Revoked permission \"View Appointment\" from role \"Patient\"', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 10:26:21', '2025-11-27 10:26:21'),
('eb3d9b5a-5556-4876-ae13-e9378de9c586', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 15:00:51', '2025-11-24 15:00:51'),
('eb5cd17e-ef79-4149-b625-2e51f0bac885', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-26 13:02:00', '2025-11-26 13:02:00'),
('ec59ecc4-44fc-420e-97a1-7b7bbea262c3', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-18 22:24:41', '2025-11-18 22:24:41'),
('ec6223e5-d4c8-4242-a10d-b3dd277be237', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-25 08:28:33', '2025-11-25 08:28:33'),
('ed01f291-e85b-4a32-b231-92ca6a2c5667', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Successful login: case_manager', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 11:32:07', '2025-11-27 11:32:07'),
('ef0addb3-58cb-422e-9900-66777a50ebaf', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-22 11:52:07', '2025-11-22 11:52:07'),
('ef2fa00f-d7ba-4653-85cb-6dec03860897', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-27 11:33:59', '2025-11-27 11:33:59'),
('f0a912da-23c6-41d2-b295-0a5cd7542196', '22222222-2222-2222-2222-222222222222', 'Dr. Juan Dela Cruz', 'physician', 'LOGIN', 'Authentication', 'user', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', NULL, NULL, 'Successful login: physician', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 15:21:08', '2025-11-19 15:21:08'),
('f0d2f4f4-6c2e-48d2-aa71-fcf5c03a3e8b', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Failed login attempt: Invalid password for Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-24 08:57:23', '2025-11-24 08:57:23'),
('f6fa9a26-39f5-43b5-81aa-225acc59d70e', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Failed login attempt: Invalid password for admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-18 22:02:00', '2025-11-18 22:02:00'),
('f727a263-e212-4143-bc54-3ef8b0b0bb5a', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', NULL, 'success', NULL, '2025-11-26 15:19:17', '2025-11-26 15:19:17'),
('f76a5cab-28eb-4af1-b2e8-0c4e5be58ff2', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'nurse', 'LOGIN', 'Authentication', 'user', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', NULL, NULL, 'Successful login: nurse', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-16 14:16:27', '2025-11-16 14:16:27'),
('f88b78b0-1feb-475f-af57-6bdc4c4667be', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'LOGIN', 'Authentication', 'user', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', NULL, NULL, 'Successful login: admin', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-25 08:28:52', '2025-11-25 08:28:52'),
('fae027bc-447c-4a05-81cd-d552c898c657', 'unknown', 'Unknown', 'unknown', 'LOGIN', 'Authentication', 'user', NULL, 'cas', NULL, NULL, 'Failed login attempt: Invalid username - cas', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid username or password', '2025-11-19 13:43:40', '2025-11-19 13:43:40'),
('fc86b285-667f-445b-bf60-39c4820ed4e0', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', 'trixie', 'physician', 'LOGIN', 'Authentication', 'user', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', NULL, NULL, 'Failed login attempt: Invalid password for trixie', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-15 20:33:55', '2025-11-15 20:33:55'),
('fcfdb490-f3b7-4690-9956-c70a4de4608d', '44444444-4444-4444-4444-444444444444', 'Pedro Garcia', 'case_manager', 'LOGIN', 'Authentication', 'user', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', NULL, NULL, 'Failed login attempt: Invalid password for case_manager', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'failed', 'Invalid password', '2025-11-17 18:09:54', '2025-11-17 18:09:54'),
('fd3198ed-32fb-4b5f-a41b-e5663f700305', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', 'trixie', 'physician', 'LOGIN', 'Authentication', 'user', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', NULL, NULL, 'Successful login: trixie', '::1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-15 20:33:59', '2025-11-15 20:33:59'),
('fd4fa85c-c0d7-4d11-aed7-54aabb7c699a', '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanna N. Sarabia', 'patient', 'LOGIN', 'Authentication', 'user', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', NULL, NULL, 'Successful login: Hanapot', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-18 22:00:31', '2025-11-18 22:00:31'),
('fdc87c08-ed5f-4787-9e07-6186c330dc2a', '11111111-1111-1111-1111-111111111111', 'System Administrator', 'admin', 'CREATE', 'Care Tasks', 'care_task', '5bd81d95-4c1e-4ddc-b69f-c2d7dfe45a66', '5bd81d95-4c1e-4ddc-b69f-c2d7dfe45a66', NULL, '{\"task_id\":\"5bd81d95-4c1e-4ddc-b69f-c2d7dfe45a66\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"assignee_id\":\"42356bf7-84ef-4aaa-9610-d74b65c3929f\",\"task_type\":\"follow_up\"}', 'Created follow_up care task for patient 80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-19 15:31:32', '2025-11-19 15:31:32'),
('ff4bde3e-927e-4bf5-b09b-b171b4a31656', '66666666-6666-6666-6666-666666666666', 'Jose Reyes', 'patient', 'LOGIN', 'Authentication', 'user', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', NULL, NULL, 'Successful login: patient', '127.0.0.1', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, 'success', NULL, '2025-11-24 08:55:30', '2025-11-24 08:55:30');

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
('02222689-04c2-48d5-85f3-324f9c1b93ab', '11111111-1111-1111-1111-111111111111', '$2b$10$HFJE6ldsIN2uocu9G1SPmOhELLkSRoviwSNny0zqRPE9lpGUYCkKK', '2025-11-16 12:01:45', '2025-11-17 12:01:45', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('04977f75-4a51-4ad1-8ab6-1093b67afee1', '22222222-2222-2222-2222-222222222222', '$2b$10$We8ife2uzQi12ubo5LNSkec/2tiy/5kTIOi1g.sGJW3vKU45HYU56', '2025-11-19 09:40:22', '2025-11-20 09:40:22', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('08a60929-9b82-4b55-b268-4766337cf65d', '66666666-6666-6666-6666-666666666666', '$2b$10$Mr1HYprM9EcFvtA2wZWsnOMCa2GvxuVL9XdFfrxFVxEVkElP14OK.', '2025-11-16 19:43:22', '2025-11-17 19:43:22', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('09e593c3-8ada-46b8-ae32-0b24a35204d6', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$6N79gVNNKxOCKBckDCqxaeQu24WYetYwJL05.7sIm5TFSZXSC3Tma', '2025-11-17 19:43:44', '2025-11-18 19:43:44', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('0c79dcc8-0ad6-4c26-8bb9-b9904944cf92', '11111111-1111-1111-1111-111111111111', '$2b$10$qb.la99FkrAEr02chwD9Hu.O6RikkA2TGCh/xKKtrltDR9vfJUF4i', '2025-11-25 08:28:52', '2025-11-26 08:28:52', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('0d647842-5671-4c0b-b386-f3e26b047b47', '11111111-1111-1111-1111-111111111111', '$2b$10$Ejuc8ldVq.DUeGIG7t9ObOAvfPmNQr4uCyvUwOuGazINpkdRqozri', '2025-11-18 22:02:02', '2025-11-19 22:02:02', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('0ee4bdf2-e29a-4fb9-982d-d79e75980b16', '11111111-1111-1111-1111-111111111111', '$2b$10$F7DsZCan40OCj99Z0is44OIIhGF1I./XEayblJhrVdIRrfp8D8HB.', '2025-11-16 12:17:33', '2025-11-17 12:17:33', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('10711d29-af79-4eb7-9210-8dbc57783967', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$TusCZO4u1Kr9CVFcZe75ouGuBXq03Ou4lX7GS2hhRoGjYYPnl0LUm', '2025-11-24 15:02:50', '2025-11-25 15:02:50', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('1137a9a0-d05b-48c1-901b-ce1949d68643', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$Bk2nFTEYSAD.OJwvbMcuq.tOvQ..zd/PGT2/W9tMvUZ0iXc1vkM0e', '2025-11-13 13:00:25', '2025-11-14 13:00:25', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('13d7accf-58a7-4445-bbfa-5c4015370e0e', '44444444-4444-4444-4444-444444444444', '$2b$10$nJJn3MqWsBuaRyGLu61rferkWuyEUer55gJs0ZR1v6O145bGYGDMS', '2025-11-19 13:43:42', '2025-11-20 13:43:42', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('13fa97ce-7a7a-4dec-9076-b8eff2687c05', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$b7L4DVel8lvDrwcprq5dROMUdw2K2EdzJSVnGjwMYjDk/JIJkW81i', '2025-11-11 21:49:37', '2025-11-12 21:49:37', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('15360f6c-3799-438b-bd57-5dfafdc81b97', '11111111-1111-1111-1111-111111111111', '$2b$10$sqWNCjOGsXq96HqhnPFOTOR/WHB7UzzMhxhPmFYzOR0xtUfU.4Zyy', '2025-11-16 12:20:18', '2025-11-17 12:20:18', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('1654bdfe-03f7-40b2-a064-de2b3dbf12fd', '22222222-2222-2222-2222-222222222222', '$2b$10$mO5MR2e2Difpu4xbPXz7ceIrqtNVyRL6SgYq.4eTHrAtVnDdforD2', '2025-11-19 09:23:14', '2025-11-20 09:23:14', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('167e22e1-aa23-4d3e-9ce5-69defa71ed0a', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$ccSVeVRubO.OM9OvgzpxWOQbGkt5/OjtP7eoB6bn5ijTdUq8Dlzgy', '2025-11-12 10:55:58', '2025-11-13 10:55:58', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('16b980a7-7f37-4a2b-95e9-0433e44aa0a4', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$f37CNrYBFPWpNUljKL536.Xsky75mu7teGtuz4QWkmtE8Z9JEYaJ2', '2025-11-19 09:01:51', '2025-11-20 09:01:51', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('175b0cef-b397-4447-9da1-3b8cc29308f1', '66666666-6666-6666-6666-666666666666', '$2b$10$qs6QmL7jFBCAmnOUI5SUIu0jHGIAaDrkZlZXh.2ySTHNervtR5hiC', '2025-11-24 08:55:30', '2025-11-25 08:55:30', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('194d97d5-c8da-44bf-8ba1-f6cb2cd5ac78', '11111111-1111-1111-1111-111111111111', '$2b$10$tzcK62wltXfGsR5pddAqs..KJ6dUht8Xzr.bvZ6cKE.V5oH45313S', '2025-11-26 11:12:48', '2025-11-27 11:12:48', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('1b605978-6019-49fa-ad26-7d1220380ab4', '44444444-4444-4444-4444-444444444444', '$2b$10$AvnsEDudGOJ91uqPZ467fu9N4zc.apr7MUx5H1S21bd.9jhCMskee', '2025-11-26 15:20:31', '2025-11-27 15:20:31', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('1b7acfe5-215c-4208-bf2c-2f82f3066884', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$TYn4DPcwrzbzZI1ePwmNl.xU5M6Ef/Y/9nIOX2qqsvZUJl6EHugDS', '2025-11-11 12:18:48', '2025-11-12 12:18:48', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('1bb403a3-eb7e-4642-bb43-dfc7685f5d1f', '44444444-4444-4444-4444-444444444444', '$2b$10$rqV.UvBh3gpZGGcksyq0nOl52A2B6eZgbanFWgrtYCFhKZoxdlQSS', '2025-11-19 13:38:20', '2025-11-20 13:38:20', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('1dfdd048-05be-4f6f-a8a5-96057211896f', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$qhdaek25USs0MvrZbIWI1.N60c2P4gbq2lyGQDfYm4IYHXy29wpwe', '2025-11-27 18:31:30', '2025-11-28 18:31:30', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('1ea6bd1d-f162-401b-a19b-137460707022', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$o78L0lCbouNGguoCKG7AlOIIIUESpMgHhExf/hFTr3VWOBBekCXQy', '2025-11-12 17:15:10', '2025-11-13 17:15:10', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('21107284-8353-4cad-88f5-77c2675bee9a', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$EJ0G8JW5y.pOzCgdnpxIluZiJ3MoLh.1mAUm33V9643LEwBX4OPN.', '2025-11-18 22:17:43', '2025-11-19 22:17:43', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('2455ff93-f200-44e7-8cb6-b6bc179da4d3', '22222222-2222-2222-2222-222222222222', '$2b$10$OgjbwWzjUsvbGDCMSmJTVe22pSceYAPXfCihr1mnca2vuBQxaiVAy', '2025-11-21 10:08:25', '2025-11-22 10:08:25', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('248d7ab8-19d2-4755-b4a4-366606ab42d8', '66666666-6666-6666-6666-666666666666', '$2b$10$l/TB4on0m.zhg0rc2GpoDulCZ1cs4kaT1ZrxsGVv4cBZF/qNOUEH.', '2025-11-27 14:10:48', '2025-11-28 14:10:48', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('26ba98b1-abda-4b6f-84a6-c12f489fc5cb', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$6xa4vjPSQYqaH1Yq7wfcTOrsTRaixcjucVJkHRZoTtYWZ.sMurwLq', '2025-11-17 19:14:59', '2025-11-18 19:14:59', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('28baf7ce-5006-436e-b008-1b6256e996f0', '66666666-6666-6666-6666-666666666666', '$2b$10$Uy7aj4zGqGJzQKqa6/oOsem3nJCZWs9dWcx2htTtd03r5geXAI1me', '2025-11-17 15:52:57', '2025-11-18 15:52:57', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('28e9032a-b81a-4042-bdca-5f186aa65953', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$btFNRSKKoXDTo6QsjVQF4.qujXjOqtbGclNFjZwIhO4XRNnsb9W5y', '2025-11-14 11:58:35', '2025-11-15 11:58:35', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('28f981ee-db76-4fec-839a-95e4edba24e4', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$cy5YNsauO8iAPL48KZjRu.kVn8unFzrgRsZLCiqhrdgq9HO7T/1ri', '2025-11-24 08:57:29', '2025-11-25 08:57:29', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('29d77157-8bbe-4bf6-9468-a14de0357851', '22222222-2222-2222-2222-222222222222', '$2b$10$nKTCKvY9i/.RQCJSmB3oaeiKz3sDHaUUEA4z0t5WM9Sb5YDMrF0LC', '2025-11-19 08:58:14', '2025-11-20 08:58:14', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('2acecd6b-7b06-44a7-b612-f1233d7b22e0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$sjwk2VYr.dP0kGgKlTTcF.JC7U5p2Tb1n0vZyTF/aMw4bFf9h94SO', '2025-11-17 17:22:53', '2025-11-18 17:22:53', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('2b19c973-b4c8-44e2-b178-9a8b0261aeef', '11111111-1111-1111-1111-111111111111', '$2b$10$VinHSmjnbrBhH8y0TDVVs.Ob3PQ8Imt25UXdWGW38GINh4rBC8uZa', '2025-11-21 08:46:28', '2025-11-22 08:46:28', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('2b2ab768-aaeb-4e45-8216-b4bb15859d99', '66666666-6666-6666-6666-666666666666', '$2b$10$JliHb4WrFfxoD2c6PqFH4OqtTzQ2XWTNE98ojEY72UBKm7YYWOXqm', '2025-11-27 13:51:57', '2025-11-28 13:51:57', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('2b4a891e-3049-446a-8056-179fea3208d7', '66666666-6666-6666-6666-666666666666', '$2b$10$chdtg4.xDX6ZHLLYZ8o/Ru6bGHNioeHkPtyGSMCZnbkLXgtFCij26', '2025-11-16 15:25:07', '2025-11-17 15:25:07', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('2dc6f3fd-6351-43af-97ba-741a0d132a32', '11111111-1111-1111-1111-111111111111', '$2b$10$bTG0gwr9MJhEMKZ.9X1Dne0.c28xvxIR02eeJQ2/.JugQlpYxYvxy', '2025-11-26 15:53:04', '2025-11-27 15:53:04', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('301c59c6-fb45-4bdd-9a1e-891579f6e481', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$XdNQuHf45YlzhsC9bVrqH.LCkDQhnPs35cqGbuw6zle04an2pCAee', '2025-11-17 16:15:37', '2025-11-18 16:15:37', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('31bc237f-6edc-4971-baa8-cbcd1afd8cb6', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$SvPMCgTel3//.B47Zi7NvetemRwHMOdoyF45dl8s4cdVpm0ASiYAO', '2025-11-17 16:22:26', '2025-11-18 16:22:26', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('31d33d11-b33a-4373-8d3c-9a1b6d24e2f2', '66666666-6666-6666-6666-666666666666', '$2b$10$K9m2/LsoMc0vidhShMa6POuJpCmBHkypvsXIGV2luzqj.Yj42Bfam', '2025-11-25 15:50:22', '2025-11-26 15:50:22', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('32df790b-7f94-4d9d-878a-99fa750d1d51', '22222222-2222-2222-2222-222222222222', '$2b$10$tTcIm0BYCnr5WhxuaRGTF.3ghlid1mWBPIqH4YBksuo6PwffSVZ5q', '2025-11-27 11:33:59', '2025-11-28 11:33:59', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('3351c631-4462-4554-8109-037e644d626d', '11111111-1111-1111-1111-111111111111', '$2b$10$kSzBYmnZoxMMyHWBKhULV.ZCeqsI7mEqAdYu.6r/1sPBmfWZ1Wh1m', '2025-11-22 11:52:07', '2025-11-23 11:52:07', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('342b6923-6884-4df8-a7fb-78da0cf33ab3', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$71jpzEANuKQ62BRkVYI6ae.c1gMF2K0QSS1oDORIvJVcCTFHzskyu', '2025-11-17 19:40:16', '2025-11-18 19:40:16', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('35122fa5-deb9-41c3-b0c4-c9241cb2ff59', '11111111-1111-1111-1111-111111111111', '$2b$10$2RkG8y0CGEyyY3CXTMftgeWSkY0RktwHXJ1Z8Ox9xciIPrjVyaEKe', '2025-11-16 12:47:47', '2025-11-17 12:47:47', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('364c75ba-0795-4917-b786-0c76ebab97c0', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '$2b$10$3nmRgu8NWQoyqsP/KcQVY.Ehr41oNG9B.rYl3x26geFPHHc9hIcqa', '2025-11-19 09:41:49', '2025-11-20 09:41:49', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('3672327e-9678-4c24-ae08-c05dc049d09d', '11111111-1111-1111-1111-111111111111', '$2b$10$56q/a2Y8TAg6fApPqHqIt.SO6TNWb9H5dE.dbo7ayPLuRx9uOYHvO', '2025-11-24 13:41:00', '2025-11-25 13:41:00', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('378f36d4-9ca3-489b-bc2e-f001460e0396', '22222222-2222-2222-2222-222222222222', '$2b$10$5vH0BQJYTQoe88BUd1xozetrRx.GBAipzTVAZZGGwg0v7.BC8r6J.', '2025-11-17 20:00:10', '2025-11-18 20:00:10', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('37d7a985-8633-4be3-8679-b52fe8ee2445', '22222222-2222-2222-2222-222222222222', '$2b$10$dFi9X4pWdO3.3YpguYwLIOWlAXn3gUAXI75QjeRqj2lPNoT0jdjRa', '2025-11-19 13:42:43', '2025-11-20 13:42:43', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('394711eb-3327-4bcf-a891-f9e900b87494', '11111111-1111-1111-1111-111111111111', '$2b$10$FMsEUemJOwhJhjgL9ojrKeYpCiSNFw0uUfkmzweBC9PwYIV45ecmG', '2025-11-25 17:30:48', '2025-11-26 17:30:48', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('39842f46-547c-4d34-a340-20237d5cfb15', '44444444-4444-4444-4444-444444444444', '$2b$10$OyDXIkdDlx4fAzDTqcP3fuxwzQw8eZGBHAhVIOuCh/mwU0a.s5ULC', '2025-11-17 17:28:12', '2025-11-18 17:28:12', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('3a8067d9-906b-4885-9ff8-3c486f4ef1c1', '66666666-6666-6666-6666-666666666666', '$2b$10$wJ1JwFeG0R3.C7t95cf63u/4M1XYsTNOqvPID8YxeZQs59kw9cTDm', '2025-11-17 15:45:45', '2025-11-18 15:45:45', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('3b4f532c-4379-44e1-82ca-d2088013f94b', '11111111-1111-1111-1111-111111111111', '$2b$10$YsOO1HAUG88MPSfIWgeLYeY5G4nGgxp2idVigkJraTnnkHhXp/lFy', '2025-11-21 10:08:12', '2025-11-22 10:08:12', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('3b87d9e6-3f69-495a-a52b-13144c8f7fe7', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$WC4hKOCaczUPcsN4ffbjD.0STwo0Xoym7PKcNKNcP4azSq4/zt65a', '2025-11-11 13:50:46', '2025-11-12 13:50:46', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('3b908d89-2768-44c7-b5b5-28543d7f3ab9', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$7DeMAFXl0FTp4x/9PI2UReB6RQirew9n90K6Nfo4dQBkbytbAWpvK', '2025-11-18 22:01:54', '2025-11-19 22:01:54', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('3e049d24-aab4-4001-b3aa-05e3a0ac1016', '33333333-3333-3333-3333-333333333333', '$2b$10$ShD0KRofeyl5Okq2GhUoneo99Kkh.fseSFRBXLxRx.JVueez8w1BW', '2025-11-16 14:16:26', '2025-11-17 14:16:26', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('3e64b759-ec68-41af-81e2-21b7074396fc', '66666666-6666-6666-6666-666666666666', '$2b$10$Q2aYBoNAjy2k3.cL342M8uYb8/mswUF3kPnUjgE3otTqS5reng1CK', '2025-11-27 17:57:50', '2025-11-28 17:57:50', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('422e0386-36fc-4d4c-b221-4b5fa0210cf2', '22222222-2222-2222-2222-222222222222', '$2b$10$laEqK804Wy7X2Mx8lRp2i.01hCB0/4JTFO.ZsnFeHZ2tFcl62768u', '2025-11-18 23:53:35', '2025-11-19 23:53:35', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('424b7303-bda9-488f-9bfb-39fc0dca8660', '11111111-1111-1111-1111-111111111111', '$2b$10$vI2fO27wJhEz8oFaKbFk0ukcwYs5fQL5KTD7px/FcfsBfi8Y/ZhlC', '2025-11-21 10:16:21', '2025-11-22 10:16:21', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('427310e2-ae3d-4b54-a2f2-3cdbbe8172ce', '33333333-3333-3333-3333-333333333333', '$2b$10$ZtNG2mGCT7BggkDgKLM1Pu/AarDG7GrbtZrIH26KbwPwLSaAK60he', '2025-11-27 10:32:59', '2025-11-28 10:32:59', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('4292a528-ef23-4148-949c-428fa31f1ffc', '44444444-4444-4444-4444-444444444444', '$2b$10$WuKN4suASmXREslo.tAIKeJT4cKoT4bk1h1D2LDf4D1l8dfv/YZZq', '2025-11-17 18:10:06', '2025-11-18 18:10:06', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('429c14c4-a50b-49bc-9123-18bf3f3d1114', '66666666-6666-6666-6666-666666666666', '$2b$10$ec42zTxZ9gZ/JducL6iNPeyeK05qviLpa9UoOixDYbxkAXC02KJSi', '2025-11-25 16:43:48', '2025-11-26 16:43:48', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('44820b53-2e0a-48db-ac16-0e83af936f4a', '66666666-6666-6666-6666-666666666666', '$2b$10$aAxIbgPb6gF0QZ3esRlR1eeXVlfcbGRmJotoEad0gt02g/OyCcm5K', '2025-11-16 12:30:32', '2025-11-17 12:30:32', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('45803be7-40cd-4b96-a09f-1ace094a48ba', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$vLVmucLkZvi5GIpIllgksO.vwDUL3uLfXuFuHP/efHXNl142Fb6se', '2025-11-19 11:27:46', '2025-11-20 11:27:46', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('4b07ee6e-ef41-49e7-8f51-a88c5894b0ce', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$tdsncwlh07OkHaRH1zTACerdD8BOeogAqIQREHstOC50dvSAOreu6', '2025-11-17 16:32:47', '2025-11-18 16:32:47', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('4b35fddf-44f7-451d-92b7-1f5645cc475c', '11111111-1111-1111-1111-111111111111', '$2b$10$x5X3xX2oQGdWIlY0lSwqoOm4ZvPBoVD/qj5zWK2HbvE6si3kOJNNy', '2025-11-21 12:40:13', '2025-11-22 12:40:13', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('4fefa43e-3c72-4980-b7cd-9b3ff6445b60', '11111111-1111-1111-1111-111111111111', '$2b$10$WUFnJO.d2Hd0jrwoasxyBeQz1W2P4Krl798ZiEldhJ32xU6dSh1CS', '2025-11-16 19:19:43', '2025-11-17 19:19:43', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('504e8955-52f8-4b4a-a5dd-848baa4e836a', '66666666-6666-6666-6666-666666666666', '$2b$10$bPvDJG9dxPRI2Pcokp2HjekLSHb8j6B0ymyU02x2/sna2R5kzUzwy', '2025-11-17 13:05:50', '2025-11-18 13:05:50', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('5266231a-f8c5-40a5-9522-bfbd38514e5d', '66666666-6666-6666-6666-666666666666', '$2b$10$Kg5da3SQrT37EhxR.jXIOOd0xa2t7x7D15ZjLFiMKISbuVnIqqSbi', '2025-11-26 11:00:03', '2025-11-27 11:00:03', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('58739fd3-bf31-4863-8d84-1a6b6dc80b8a', '22222222-2222-2222-2222-222222222222', '$2b$10$P0otzqfN/vEZCLFHkWtW2ukef6yGdPcchuzhGxRvD0IrDDbcoKh0G', '2025-11-24 15:12:25', '2025-11-25 15:12:25', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('58ebd118-63fb-4cc5-a530-9a35edc983d1', '44444444-4444-4444-4444-444444444444', '$2b$10$qRgiOSzPKx7b1TV2s99ToeyZwrcwiNzX/Bs9xr2HQULljYdq0QDuu', '2025-11-17 19:37:15', '2025-11-18 19:37:15', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('5b500c8c-80f5-4796-9e5b-b24ea5591b19', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '$2b$10$.xTxj0z/IAWhEqGfayKuOuLgu9Ah2uuYi6bcfKCyueTMbfxwkU8.6', '2025-11-24 15:04:55', '2025-11-25 15:04:55', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('5b75fc24-40ff-4cea-bde8-7e501c15afe6', '44444444-4444-4444-4444-444444444444', '$2b$10$7Xxg3B3mgSWK4l0Hbcu4y.5Wb2bxA8Y0Fg4nYkKSzHvTGiPKe6whi', '2025-11-27 18:27:29', '2025-11-28 18:27:29', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('5d771e66-f7f0-464d-85a4-ea32c8b39b97', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$kQRBD9ORoSXw1JqNwx7FDeBxky3cNPA9sW3Q/wLgrDkuBwPdu8lnu', '2025-11-15 12:29:18', '2025-11-16 12:29:18', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('5d9d030a-bf0a-4a0f-b731-7cc9d6108f28', '22222222-2222-2222-2222-222222222222', '$2b$10$QQsmquKOA3IfM.LNmeQmpOK7ZJPnjhC2K0LcbVXG7Kl0GLtLRBO3K', '2025-11-17 18:24:06', '2025-11-18 18:24:06', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('5f73f163-04f0-4647-b8e2-7d1a2bc02756', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$tYIR68wi7FhX0ycUklpg8.yuZAksZdVnpWWqs/sLIM50KlRAgyr..', '2025-11-27 16:01:13', '2025-11-28 16:01:13', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('62448c28-43dd-4a92-9b63-2f139962a907', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$xLpGNIZNY7Mtsdh8wYYpUeoSx35p8S1IeMrmVHK2u4hO/hRtvlplG', '2025-11-27 18:12:45', '2025-11-28 18:12:45', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('656d9bd2-cf7a-4720-94a4-514616548280', '55555555-5555-5555-5555-555555555555', '$2b$10$/AQjNUFQt6IN2pYmCbPwEuJWq00gdQu.UHdW7LlZGZoSahunyiXh2', '2025-11-27 10:34:44', '2025-11-28 10:34:44', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('662d2a2f-e22b-4fef-b8ea-59f4d09612bf', '22222222-2222-2222-2222-222222222222', '$2b$10$ZcIvuAL10RdJExZjMUZKneztNlvHo/jYQqwq.2FvplxNQNVYgt/Na', '2025-11-16 12:43:32', '2025-11-17 12:43:32', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('669a1f02-f1b8-46f3-8cce-a32956fd7198', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$VQcVk1j69VePUflIMrq97OvKDfqCbwjMRQiyL3xUeJh6PzQu6A6la', '2025-11-16 11:38:48', '2025-11-17 11:38:48', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('68803f0a-272b-4261-a82e-735c69cc8938', '44444444-4444-4444-4444-444444444444', '$2b$10$dvQ0rCjL2YAujQ26Ew7nh.YVloPCjqMo0iRocfW.1i1fK32fimGjy', '2025-11-27 13:32:41', '2025-11-28 13:32:41', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('6eb4f21b-d4d1-4706-a72c-482923e83ee6', '66666666-6666-6666-6666-666666666666', '$2b$10$YzCtUGjIa6DieSBlRcOapeIndXfDufYfvgdD1iEZfWSY9AE0/UUGi', '2025-11-16 16:07:35', '2025-11-17 16:07:35', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('7049a085-a4da-4051-8c16-127e9668189e', '44444444-4444-4444-4444-444444444444', '$2b$10$4ukZ9V6mpmDjeeAquil./unMGhwMktVOvSXTx4x6hWubdGfKTVzYe', '2025-11-27 10:45:27', '2025-11-28 10:45:27', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('70d031f4-20da-4a46-81ce-5733e51c769a', '22222222-2222-2222-2222-222222222222', '$2b$10$hTmXNhUI0yvtYtSxCLCrFORpvSFLQ9oxpwlBAkJ7oyDWKUVZl7yNq', '2025-11-17 16:12:28', '2025-11-18 16:12:28', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('70e5abb2-6161-42d8-ac53-cdf10b7e31d2', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$RytNuhUNOTDF0nNZ4fO8FOFU5mkaAVs/9B5FWB01n3lOzmYpXbnX.', '2025-11-11 21:52:30', '2025-11-12 21:52:30', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('71f8d77a-9355-44d7-83bd-222443b4b574', '66666666-6666-6666-6666-666666666666', '$2b$10$6VIdXz57fynjdJEvgJYhL.bP8JJ6VVAUkD3bY4aaNX/fN004h470y', '2025-11-17 13:07:23', '2025-11-18 13:07:23', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('782a55cb-88e8-4399-b57f-0687801a352f', '11111111-1111-1111-1111-111111111111', '$2b$10$lPQ.tOGh2sDEX5sDznaXMuXnzeG.L.HF36gq4NLS4MGGWOiH4ATQa', '2025-11-21 12:09:14', '2025-11-22 12:09:14', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('78509deb-3f1e-4d65-9454-3e1e8e099d09', '22222222-2222-2222-2222-222222222222', '$2b$10$2qik9vaX6h7PsyfRvc/aBOZ5V7DKClbdsebwxeZRG/mke0rmrGGSe', '2025-11-16 12:53:46', '2025-11-17 12:53:46', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('7893fed4-4d49-4d2a-96f2-ae863787c2e4', '11111111-1111-1111-1111-111111111111', '$2b$10$iKGYrawEmYypZyp74dnTfOJJRcTTCu0rHrJyw8K64lagKIvNw6c3O', '2025-11-24 08:05:55', '2025-11-25 08:05:55', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('78f73c71-7400-4e46-8531-1d16d5c799ff', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$fIc0zmOVCdP2/1983QFoauwnvzUmlD7d4YLmlc8TJ1Csa4Of7N7Ru', '2025-11-17 20:06:12', '2025-11-18 20:06:12', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('791130b2-2326-4cfb-9a6d-d005ff30062d', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$.2AGEm.3X1PzmfawYfcwxu7ipQZycFW22CDD/3fiDvw9NRZUPXhMy', '2025-11-24 08:51:41', '2025-11-25 08:51:41', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('79d1e113-70c9-4842-aa3a-182559e78422', '11111111-1111-1111-1111-111111111111', '$2b$10$7mIIb3ShmebMHogNr9gzuOIBBTdjioCfMLZFF.V9eRvhsXwc6uOdG', '2025-11-19 11:58:35', '2025-11-20 11:58:35', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('7a20e92f-26cd-4a8a-b32f-25e9b70f16b5', '66666666-6666-6666-6666-666666666666', '$2b$10$.K18Q1Jd8U/xV9u.d1OUjOdLTZXjixXYvv2QFcYU1bjD5qOZ2n.4C', '2025-11-17 13:56:37', '2025-11-18 13:56:37', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('7a347503-c988-43d5-aa9f-5b24e362b88f', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$hfLeeZJumpMl18ZNCRsEZe1oyv5poAtM.jM5wC3RNOqc0cCwXQYXK', '2025-11-17 16:08:06', '2025-11-18 16:08:06', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('7bb23cd6-9c0f-49d7-9e5e-77a78428bc8d', '66666666-6666-6666-6666-666666666666', '$2b$10$YLKOdNQF5kQUSqP9CKP8u.E7GqK2VIQT47SBuXAFJ0qNXQDTIEYG2', '2025-11-27 13:32:30', '2025-11-28 13:32:30', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('7c5a877d-53a6-4cda-88ff-bf7af7edc801', '11111111-1111-1111-1111-111111111111', '$2b$10$Bw0vbrAu9/ziiYLR4KmJ2uCBBUKQEST1zO9dQyB6YFGzhkzMQcG1i', '2025-11-19 11:26:01', '2025-11-20 11:26:01', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('7ca9113f-390d-4737-9344-6b9e53e066b1', '22222222-2222-2222-2222-222222222222', '$2b$10$Z.EQP3pVHNzH4uhG8COBQO5VY4e0ag6TNYbvXGZEiZ/c0.opcGtA.', '2025-11-24 16:41:52', '2025-11-25 16:41:52', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('7d0121ba-4849-44ea-86e9-9b4af95d4e63', '66666666-6666-6666-6666-666666666666', '$2b$10$tXO7O4.eWKjnkez8IC/kBeXWKDm/59DViYINtOX4M4aAOyy.u7yca', '2025-11-17 15:31:26', '2025-11-18 15:31:26', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('7edb40fa-fa1a-4a19-9672-eb551c29cb62', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$dfCy6I30XyTQGjfXHau93O8FP8DxBQLrrMgTN/a1syfijgPaXhGsO', '2025-11-14 09:15:31', '2025-11-15 09:15:31', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('7f6386cb-06ff-47da-9ea6-1ba80075e1fd', '66666666-6666-6666-6666-666666666666', '$2b$10$jfg/l4jbIHZKWQX4.2qWne7UMh0HpQ6Yqsh4G1pTwEmbRupko9sYG', '2025-11-27 10:17:10', '2025-11-28 10:17:10', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('7f8ef546-aa43-4d56-9cb3-f17bd4ad0c28', '22222222-2222-2222-2222-222222222222', '$2b$10$4YLuqdYP9HtNYopBs9oc8.osFtrKqPavIJSmU6S/33vLEpKFsdOhC', '2025-11-17 12:26:10', '2025-11-18 12:26:10', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('7fd939e0-5f4d-4926-af7b-ac50ad8f1f2f', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$74yig827Dxmc.iPuXeAAXed6IDYKsiADw1b9qRs9lQ264bWRMCLL.', '2025-11-27 11:30:43', '2025-11-28 11:30:43', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('825491cf-6291-4c95-b71c-693b2ace3344', '11111111-1111-1111-1111-111111111111', '$2b$10$vBQBOIJr067fJGrKTKT6XeWQGM3/9ZAXXx/NAjExzaZfnjv/BFOSq', '2025-11-21 10:09:08', '2025-11-22 10:09:08', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('832e9666-0375-4668-a058-db605e9a58db', '11111111-1111-1111-1111-111111111111', '$2b$10$unDW2E92tepxzKSV5fNdK.7i5Z1x9UTlXssy9BX.jLv1Mg2uy5lEG', '2025-11-16 14:16:05', '2025-11-17 14:16:05', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('832eec4a-bc57-4fca-8e47-90805e8303dc', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$cyXszGp.7TKXVp3j/7WoDusXatWRBay24MALByWyc9pgS4OA5KvwW', '2025-11-17 16:10:41', '2025-11-18 16:10:41', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('86332033-4db5-4bb9-85dd-15455e6c1d69', '66666666-6666-6666-6666-666666666666', '$2b$10$USrRtcwMNr8EhCYJijRij.dfVdSi.JPMMdAC2w0RMQ.WjaJ5LhROm', '2025-11-17 14:16:40', '2025-11-18 14:16:40', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('8702174d-4028-43d8-8a99-f0d53d03fb04', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$TwY9eDrcCedjNPnBCp3tdeln3mP64/2bZ/sb5tNrni2feYraECE6S', '2025-11-17 16:37:00', '2025-11-18 16:37:00', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('88763c24-0c45-497a-bee5-f2e0948c0099', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$7qPQAx..fxph2AlMtiOvVegiitO4Ph0PyxUb2kyXUqN21IWRCJMga', '2025-11-17 20:03:21', '2025-11-18 20:03:21', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('898c912e-68db-44c8-896f-e1d800c50916', '22222222-2222-2222-2222-222222222222', '$2b$10$9rlR7TfUT3ydqISNeDILw.9zue5KL4LaUqcYjXkL3bET124nRehfy', '2025-11-24 15:00:51', '2025-11-25 15:00:51', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('9144338a-cb05-4fc3-9cf4-b285a7351e13', '22222222-2222-2222-2222-222222222222', '$2b$10$9GhA/BPWMb5YYdDcaUQooOY36vFtHcOq4TpZ25x3ncWNpsRj8NDWi', '2025-11-17 16:33:43', '2025-11-18 16:33:43', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('9171ca51-16d4-4404-ab98-e54ab5477c54', '22222222-2222-2222-2222-222222222222', '$2b$10$7vpyIJ/Y6Qog2WY8iUqGqOIvtNVaUmwrJ7JoWoMzJnYWZvgZlJhyG', '2025-11-27 14:09:26', '2025-11-28 14:09:26', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('95ed10fc-543c-46da-8b8c-b4f60aae82ca', '11111111-1111-1111-1111-111111111111', '$2b$10$hZZkMThMq96SYa03Dbf6iuTS17ETc8wB2JOL098xpl9gELnymfXu2', '2025-11-19 15:25:43', '2025-11-20 15:25:43', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('972c0043-421b-428f-a172-987371ce6285', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$E3QdBhB3Ga6QgJ4LT4LGKO3W6dj04FMPO7vRUHYM/VfIYdaTtLkqa', '2025-11-18 22:10:47', '2025-11-19 22:10:47', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('9c80c5d9-b8d2-4834-b76b-9f37f3dc7fcc', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$WvUK5K3FkwuiljcOcT/r1eVnFwV.iQwcFAIzQLLTBkGkJ7pmTns5e', '2025-11-13 07:47:47', '2025-11-14 07:47:47', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('9d24d9b9-5291-40c3-b858-6b3fb485b7a1', '44444444-4444-4444-4444-444444444444', '$2b$10$o5cBSQGM9bwLQagaww7SzOviZb3GkmKLHSPVqgjsxTkU.Occ0KSvq', '2025-11-17 19:33:08', '2025-11-18 19:33:08', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('9d658ba4-04f5-4065-9ee5-fe78a6375bbe', '11111111-1111-1111-1111-111111111111', '$2b$10$Y4Q9vbvTxb3hiCGIqlODmOiPoA/QB9TG7cmRv6NrlHw0AHq8Oh6zq', '2025-11-17 12:20:05', '2025-11-18 12:20:05', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('9e19432f-9943-481a-9477-c378deef3a67', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$mYK7ZbNz4X50O0W.5Chwj.ewj/Lo.WROtdoO6RgbrqIwLlFHy0Ta.', '2025-11-27 11:25:27', '2025-11-28 11:25:27', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('9e896b04-a6da-4669-bb45-a93dc0ad61e2', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$8aRM6of1js79PnNZ0SuLL.Mt34NFDP66KgqzWOiWQ0mRYR0XcFE9q', '2025-11-24 15:11:45', '2025-11-25 15:11:45', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('9f1dcf58-3e24-4e39-a7c5-9e7240e41d30', '22222222-2222-2222-2222-222222222222', '$2b$10$wut8aDwo68ggetTcQ1pBteyOlwcfBD1QZdBfud6VqNJt29.z5YUte', '2025-11-27 11:20:29', '2025-11-28 11:20:29', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('9f5926eb-c9b4-4731-993d-33775cd33aeb', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$.Y4AzkzZYnM2/r9kAT0zpuLKoGi0abwI1UN3.WDDNBwL.rZ2DNXaG', '2025-11-27 18:43:37', '2025-11-28 18:43:37', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('a186521d-e769-45ac-af4e-43af9470662e', '66666666-6666-6666-6666-666666666666', '$2b$10$eHHviJ1vuvVAJEgTfoQ4Z.UwcI3e1sg/efXo9/fyeHUA13zYnrDvK', '2025-11-17 15:13:22', '2025-11-18 15:13:22', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('a294cc88-957f-431e-bbd6-6bbf5774ab1c', '11111111-1111-1111-1111-111111111111', '$2b$10$eAlQIaTWz8BH4DgPhj1CJusSn2o57QXyhv7BnYaeTzfUY71WX3.ca', '2025-11-16 21:30:11', '2025-11-17 21:30:11', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('a2de013a-403c-48b1-a717-583bb25fd913', '22222222-2222-2222-2222-222222222222', '$2b$10$SiiZLm7bWrrl3vioMzsyHONj7mJuT3RH2uQwPLdtNwqvSFAxdbV5u', '2025-11-19 09:42:31', '2025-11-20 09:42:31', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('a3be2b10-a7e6-4d38-bdcc-27da585ea974', '11111111-1111-1111-1111-111111111111', '$2b$10$KTYppJUpYL.vWLEVF4Ahq.y52Uk0btRQ9axxR53X2k3Z3ZeoJSk86', '2025-11-27 10:15:44', '2025-11-28 10:15:44', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('a3ddd25c-f97f-43f0-9b4d-9d1183032203', '11111111-1111-1111-1111-111111111111', '$2b$10$fbZnNa8owOGPk6mb4nl20uGvJLskfYGzxb1KL6OOU8R6WYhUYr5Uq', '2025-11-21 13:34:29', '2025-11-22 13:34:29', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('a7560797-c057-48db-9157-1bb4cb1e092a', '66666666-6666-6666-6666-666666666666', '$2b$10$mdVAwR75w/I/Sn4WMs0eW.VJdc8uzSoB7mTv2EPw.cXmh0fq/TNFa', '2025-11-17 15:28:39', '2025-11-18 15:28:39', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('a75675db-cbcc-412e-befd-21fa734d84a7', '44444444-4444-4444-4444-444444444444', '$2b$10$0xFBEjuyLY9dNXC/Qkn5re.HXQE/lN4PGZE0vfxoOTkJH/dIWmp12', '2025-11-19 13:40:57', '2025-11-20 13:40:57', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('a76fb352-5ff7-4452-b578-f659f6a2e9c4', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$PKmRdTdy6oQ0ZZ1S2W.lMeV3P3G0Z2Gvwx8CDSW16tvs5Pm82dgr.', '2025-11-19 10:14:40', '2025-11-20 10:14:40', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('a7c00bcc-9572-44e7-81ab-467bf091663c', '11111111-1111-1111-1111-111111111111', '$2b$10$9UiqdgUzrKDTh4ARmZWNhO5iBG/mbj7WMn8V9miX/YpF.PkY5mAmu', '2025-11-26 08:15:09', '2025-11-27 08:15:09', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('a83984dd-be87-48a3-99b0-fd1f1de05ebf', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$UxjLLYF28bQSG83HYZBTgueAUW4AMg.ckm4om8gUjdlPB.eUHp1CS', '2025-11-15 20:34:26', '2025-11-16 20:34:26', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('a9ea01ac-0ddf-48da-9d03-9ac6bdb8e3ee', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$DpaTcIa2CY.xvcLDHt.pcu73zucexqTkSp/mUGcCFwM2wCL82i5YG', '2025-11-17 18:42:17', '2025-11-18 18:42:17', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('ab6512a1-5bc7-477a-bcf2-5aa24df810a1', '44444444-4444-4444-4444-444444444444', '$2b$10$LSS1F1bjqyDAMq/en77R1.nXXHnmkiew1q0w1mLrMvA.0NSxR.uea', '2025-11-17 20:02:32', '2025-11-18 20:02:32', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('aef33d5d-22ca-4d58-b9e3-a5d3cdd1436b', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$YiRE21ahgNgCBESuhE9D0.VlExIgTeJUAUy04sZk794gT6udR0wI6', '2025-11-24 13:38:18', '2025-11-25 13:38:18', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('aff8b162-6a63-49af-bbb2-f74d66738259', '44444444-4444-4444-4444-444444444444', '$2b$10$T8nO8X3UktkMBseKOin6qe4dqOvYSxGBWc/Gh9gfc.Q4XODLzmBq6', '2025-11-27 10:32:35', '2025-11-28 10:32:35', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('b00af86b-424a-48b8-bcdc-9ad1a862b9ac', '11111111-1111-1111-1111-111111111111', '$2b$10$OwtR4soVRlZaBoO1uIvLb.cLuY8LVxcuW2xPMYp5vld.7kQnKjCby', '2025-11-22 12:03:09', '2025-11-23 12:03:09', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('b0ab2363-7ccd-4449-9da6-52fcc94c5e0a', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$M6oMXcnryFr3LivofFemN.WDAwKfggeEC3Txw2se86e8DiDXVwnDK', '2025-11-24 17:09:28', '2025-11-25 17:09:28', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('b0d684e9-c73d-4d6c-9cac-f09a184f2654', '66666666-6666-6666-6666-666666666666', '$2b$10$BY1BxRZYhoafOnBu2ZoOUeFeZALwQtXvI6irarP/WGk07C2j6EAcm', '2025-11-24 16:09:09', '2025-11-25 16:09:09', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('b0f14fab-3853-41ba-9df3-13c3acb334de', '11111111-1111-1111-1111-111111111111', '$2b$10$hSeJ6GTTY/YGtSySYuVvUOXJfBNeiNDMrLJu5GkFk9ZccllWQg6Z.', '2025-11-26 10:46:16', '2025-11-27 10:46:16', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('b61814ce-31e8-4e17-98e7-b5914479e970', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$KZk0lHtkJffpfdF/gB3b0.EIRQrFvgM6s9xri2h.pWwT8aNgoncFK', '2025-11-17 17:16:45', '2025-11-18 17:16:45', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('b66c0efd-1417-4c1d-bcba-5a8f0e14df95', '44444444-4444-4444-4444-444444444444', '$2b$10$5JbiSp2Z6GzvvdX6Odp.dOENOO2M.sTFnCQ8yvi4sr/d/1aCHcmq6', '2025-11-17 18:28:33', '2025-11-18 18:28:33', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('b67826cb-c6ca-47b8-aa1d-dc0f139ea2e8', '11111111-1111-1111-1111-111111111111', '$2b$10$bGo8gcIRLB9lMysa/d5UGurEHdV51U/SBDkh4w9gXuKazs03GCblO', '2025-11-22 11:14:13', '2025-11-23 11:14:13', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('b74d982a-dda7-4a6b-a945-80db4bfd5c85', '66666666-6666-6666-6666-666666666666', '$2b$10$vYwB6d8HCQOw77c6E1hto.cZKEVz/D7R4d5Xjstml9iUJaHz1VziG', '2025-11-27 12:00:31', '2025-11-28 12:00:31', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('bba186e2-30f4-4872-b94a-18ce43ae1194', '66666666-6666-6666-6666-666666666666', '$2b$10$UCJnYQC8UxNl9/OmPe4NqeVPcJ1jQlRvsVNm2.GvCMoxV3mXQMo.u', '2025-11-26 08:45:12', '2025-11-27 08:45:12', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('bc8d957e-fd0d-4d7b-96fa-2ba2e61bb94a', '11111111-1111-1111-1111-111111111111', '$2b$10$GfzuVvFgi/xx3L50XQeRyOydf.zN3kxV09kNmsXD/./I8XUb3L4eG', '2025-11-26 12:12:27', '2025-11-27 12:12:27', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('bff8ed6e-8750-49ca-af0a-8c5f2fbac93d', '11111111-1111-1111-1111-111111111111', '$2b$10$Dngo/Xq/VFkfu./PvHLcEeWz5ITF5OFo5r.qpRTFCnX4PKjQ9VKnK', '2025-11-27 13:05:07', '2025-11-28 13:05:07', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('c015e090-9392-490d-a9fe-61abe8e2a980', '11111111-1111-1111-1111-111111111111', '$2b$10$lXfCgGz..XFX84DMj3ug9.ccZr4hKpnqA4D/xnjHNYOAmp.vMMBVm', '2025-11-24 14:59:08', '2025-11-25 14:59:08', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('c214fcd4-2b49-4882-a88c-ef2f58c22f25', '44444444-4444-4444-4444-444444444444', '$2b$10$HgabA3td0uD34flj3G3LIeEwkH9A1BBwLUIygrTOr/CO9Zs5frmTO', '2025-11-27 11:32:07', '2025-11-28 11:32:07', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('c4391c0f-f06a-4543-81ce-9b6e03c4ed8b', '11111111-1111-1111-1111-111111111111', '$2b$10$rvcQp0z5AttKjK3wyVwyeeED8BYh9uC5pnNoJbIZmSAPE8xSIXmAK', '2025-11-27 18:41:38', '2025-11-28 18:41:38', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('c461dbb2-b62b-4652-908b-638e2f5511c7', '33333333-3333-3333-3333-333333333333', '$2b$10$x.j.VU9UNpQnDWrEmUajDuZrW5lvmpFirgt22dh6w/Fp0qozSXxOm', '2025-11-24 09:23:20', '2025-11-25 09:23:20', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('c519b4b0-3064-4f72-a978-285a883c04b0', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$7CFtqAFrhIa402Gra1WVR.iLVVXBg8awuwbR6KKPc9zK/2bidns2q', '2025-11-18 23:43:01', '2025-11-19 23:43:01', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('c55c2497-21ad-439c-aa6f-44df866571e3', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$4eieeivKZT0WoRbtHAv.p.jNv9X3khFTtICj41pXJATLhhW1JBp6.', '2025-11-11 12:19:24', '2025-11-12 12:19:24', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('c5b9d0eb-c65d-495a-818b-3f2551678562', '66666666-6666-6666-6666-666666666666', '$2b$10$IniPLCOnVB8UhXU5kcsjcucJ.llLTk6T8Qu4bcP.UJRlNJdgDNj.m', '2025-11-27 10:35:09', '2025-11-28 10:35:09', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('c7cbecd9-d50d-4f33-bda1-95f015c5c7d9', '44444444-4444-4444-4444-444444444444', '$2b$10$l90Fb7.GwosrGoiTusJayuXK.c0SFWqeSYaCv5s5IsAHQtkOJwIWq', '2025-11-17 18:19:15', '2025-11-18 18:19:15', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL);
INSERT INTO `auth_sessions` (`session_id`, `user_id`, `token_hash`, `issued_at`, `expires_at`, `ip_address`, `user_agent`, `is_active`, `revoked_at`) VALUES
('c7df0ccd-b874-41b8-9853-c17c05e87932', '44444444-4444-4444-4444-444444444444', '$2b$10$64wwRkOGuUHzm3FYLjJr4OpcyhWpivxGJlvMwiGtYGLS8RsMfhN8q', '2025-11-27 11:35:56', '2025-11-28 11:35:56', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('c803b40b-36f5-4e77-9916-22a806bb0af7', '22222222-2222-2222-2222-222222222222', '$2b$10$G2x4cuBE4BAybkJe3s1jNuBRpysRHz4bCQOaBK0pTp541tLjtUGoW', '2025-11-17 19:12:25', '2025-11-18 19:12:25', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('c9074578-a4fa-4a36-8bad-8925ec953b6d', '66666666-6666-6666-6666-666666666666', '$2b$10$Ab/jgGct5paN88S1/.YOiOMSQvBIq4JVH8VZoPhrvTGigra327Xce', '2025-11-17 13:53:40', '2025-11-18 13:53:40', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('ce6b4f65-f7df-4e31-9017-76bc3f4d0f72', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$r3UTODOE5ifbLsZ6wYqK3uzs45y9kecpnRkcRq.l5IdInW57Rzv5i', '2025-11-25 08:28:33', '2025-11-26 08:28:33', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('cf30ed5d-d90a-4dc1-b58e-00708846fcec', '22222222-2222-2222-2222-222222222222', '$2b$10$ti2VAcqFDbIsfxk514gzseFsW3Q02/7PsItyKSC1EZ0VF7lNPhPju', '2025-11-27 10:34:00', '2025-11-28 10:34:00', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('d1b03bd5-6a8e-4cf8-bb91-9218a95a3245', '11111111-1111-1111-1111-111111111111', '$2b$10$e0EmUN87DDfZ8u220/vq4.jqTzRkgmFs.TvNjm9vTxIXy6Gf7o3Pi', '2025-11-21 10:22:16', '2025-11-22 10:22:16', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('d1f2db10-a37b-4bf4-9303-20e43484f661', '66666666-6666-6666-6666-666666666666', '$2b$10$VsUZzXhWBCiwCdY6jIzaauI9T0/7pcEEvuv4Pc/2F1D19/BnJKA0W', '2025-11-24 16:17:55', '2025-11-25 16:17:55', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('d4879351-c848-40a8-a103-d86a2cedddfe', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$6U2s2iTigrIc9BiGmFaneuaeuDlIuL3sTVls6dw2StAZWgl1JSHoS', '2025-11-15 13:05:21', '2025-11-16 13:05:21', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('d637daa6-0d2e-4ed8-a5d0-35faa9744528', '44444444-4444-4444-4444-444444444444', '$2b$10$I8oYdvtoizg1UQqUON51/.WzoJeEXaUJPlzxfrTj3dTPJwP7Nxc.C', '2025-11-17 19:42:48', '2025-11-18 19:42:48', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('d6eaca6d-8285-41c6-a9f3-8c4803f58122', '66666666-6666-6666-6666-666666666666', '$2b$10$YlJVY/ZYUTPNiBMlYal6Vu92hG3.jvCWkn1.4edI0owvQj9UXNstu', '2025-11-26 14:14:01', '2025-11-27 14:14:01', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('d7d6d54a-4154-4e94-9363-82251a34a82c', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$lwOyJhnzTik9Hcy7WAPsSu.6hPtj8Z/vkmBgQw8xP0NBN5/uKHgkG', '2025-11-26 15:19:17', '2025-11-27 15:19:17', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('d9e36487-5a02-4a73-907c-3184c5731f02', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$EFSSmad.oOa2p65lXGswWurPj.1hJIwSH0RZ3yq15HL1Rh0Nqwx5y', '2025-11-18 22:24:41', '2025-11-19 22:24:41', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('dd381f38-c6b7-4c22-a7cb-740f13ca05ff', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$X.HcMJN4yu/Z32StOvmOnO6Ku8U4QRI2jwF1eJdgMIEziKrkZ10OG', '2025-11-12 12:36:27', '2025-11-13 12:36:27', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('dd5612a5-c0ac-409e-835d-8909887839f8', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$Hoh054J4MAowTBMIzDGzyu1/pQODWeY2lU8Jangm9Tdi653Ind8Xu', '2025-11-17 20:36:51', '2025-11-18 20:36:51', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('de31e964-d37d-45b2-8462-5c362f44f44b', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', '$2b$10$XrrHRlXVJ3SdWBDDpfMPkeazfoVyu1bp0pMNjqmQrOI5CNqDq8gb6', '2025-11-15 20:33:59', '2025-11-16 20:33:59', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('de330c94-89c3-4892-88ec-43cd01037cc6', '11111111-1111-1111-1111-111111111111', '$2b$10$KYEdXd/Lw8Ywy/QhmC6TqeUCK0dDgEaRYeA30Gr9E2Hub3PrJlun6', '2025-11-19 14:06:06', '2025-11-20 14:06:06', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('dffda8a4-5d4f-49c2-90ef-f0d631965843', '44444444-4444-4444-4444-444444444444', '$2b$10$NSbUZ2cRgX/OXb0SwRZdoOSpnlatsn62QqeARLB3u42zrfuZGwGC.', '2025-11-27 18:49:11', '2025-11-28 18:49:11', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('e2975cbf-a571-4ec5-a784-b5e7a504ab3c', '22222222-2222-2222-2222-222222222222', '$2b$10$kHbWoBPDXCqcW4EuIeayK.vbnw2LHFiHYtd6GdA47o2BwbE04PSd.', '2025-11-19 09:04:09', '2025-11-20 09:04:09', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('e2b24278-d849-4819-9327-825ccaa34327', '44444444-4444-4444-4444-444444444444', '$2b$10$81o3u7DHR.gy1sSdudHt2uio7GDPPh6q65aaO9WFS9nwIxzj4SQg2', '2025-11-27 14:11:38', '2025-11-28 14:11:38', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('e33c6075-139a-46cc-a64d-b45fe82ad352', '11111111-1111-1111-1111-111111111111', '$2b$10$/HI0MVWrYTM0T6llUNI.yurHBsyrKJD/IdAx22Dl7OxYRnDD9XkOi', '2025-11-24 09:24:05', '2025-11-25 09:24:05', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('e40ff8d5-3198-4c64-bd1d-ce4749bb4d47', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '$2b$10$WzOS5kfTdwe7tYaGzanmT.EODB04HEntzloaFNCnbfpCX5aj93onq', '2025-11-17 19:13:26', '2025-11-18 19:13:26', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('e510fe3d-811c-4c55-ace5-358fc8335e4f', '33333333-3333-3333-3333-333333333333', '$2b$10$b3/V/iufnx.Jig89G7aGy.irZZMEfDogrn6t7LqqD/SPdebk37/cq', '2025-11-16 14:21:27', '2025-11-17 14:21:27', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('e55acc7f-8474-4020-961e-13dd5982e95a', '22222222-2222-2222-2222-222222222222', '$2b$10$sE9sQ77Z.Vna.FoKQyGfS.fIX3CsMyobi6GnK9jraS18XBiTXG1cW', '2025-11-27 11:31:14', '2025-11-28 11:31:14', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('e5ecefa1-3b25-471a-a002-80498577181e', '33333333-3333-3333-3333-333333333333', '$2b$10$hR3br3QDv5Doh.K7vKzUAelKjags/Trpty4mCB.si7KIXmGZRETCe', '2025-11-16 12:58:22', '2025-11-17 12:58:22', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('e7d0658d-bc7e-4c83-b36d-a91c869cb61a', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$T7RaaNekXGwSoYUptEnZsugvwibAzV5xTOf6BzzKbunxZ780PtJPm', '2025-11-17 16:20:02', '2025-11-18 16:20:02', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('e99de6f0-5c0e-4a00-a6eb-fa68d98ee700', '66666666-6666-6666-6666-666666666666', '$2b$10$JlAPbYcrP6WSl4IbWXUJy.f13jsgt73JCaPMf7Y2ibliHf0Cx4NpC', '2025-11-26 08:15:28', '2025-11-27 08:15:28', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 1, NULL),
('ea217454-4d95-4c96-bc97-fe4b2fd868ba', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '$2b$10$IwqcqJ2OQaVrU0XwPVTjGuErQkR1R506OGjqCbcs20Cpk/Q.r52H.', '2025-11-24 15:05:39', '2025-11-25 15:05:39', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('efc5d8f7-5bf5-4571-b117-dd7ee1685e92', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', '$2b$10$Y4KzYJSd2nCB..1BaTbmBOe9QdwXGvXCBnWX9I3f7jiLWVjUQjnC6', '2025-11-16 10:42:17', '2025-11-17 10:42:17', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('f0064fef-f013-4129-85a6-3d87b8b6ae90', '22222222-2222-2222-2222-222222222222', '$2b$10$UMzDiWD8/T6YhB6BGaItI.2b1c8Ta.4kkS1NeuZSyDMm5F5Fkoee2', '2025-11-17 16:30:41', '2025-11-18 16:30:41', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('f09efb83-86ad-48b2-8f33-cf6b61428706', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$VnhrhTCc5JvIbSYuTFr.outYQqMF7QI/nRfaHk0ijppzPBnnyTrp2', '2025-11-18 23:52:40', '2025-11-19 23:52:40', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('f16b32a6-c96a-42f9-becb-56fb938d05d5', '66666666-6666-6666-6666-666666666666', '$2b$10$lE2kEjjm0BaTcMUdvgjCEOcwUmp.terL09nHS/XP1OhRpsH3k4jHC', '2025-11-17 14:40:42', '2025-11-18 14:40:42', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('f29d9e4c-2708-4d44-a908-ad7c67c20deb', '22222222-2222-2222-2222-222222222222', '$2b$10$ZvL8ED1xSRouwl7RheUnE.8Oi6KO55QD.1W6yUB1wPK6YiA5A0VG.', '2025-11-19 15:21:08', '2025-11-20 15:21:08', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('f3213e56-d291-4e54-9e41-c26fe8defc0e', '22222222-2222-2222-2222-222222222222', '$2b$10$r9p6N/P2lCEWWsS1ki19FupdhIhsc4Zcx44kesh0M9/NWIvOcflwm', '2025-11-16 16:06:23', '2025-11-17 16:06:23', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('f3729f66-a924-4adb-a034-be2315cf4261', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$1FixLCsi1DHM10v0XZ3kje/2d27wt4dRnnjMQoOsxDgOYY8GIhbWi', '2025-11-19 00:03:09', '2025-11-20 00:03:09', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('f39e7a9d-1660-4923-baf2-e1720eb48c3b', '11111111-1111-1111-1111-111111111111', '$2b$10$Q7TimSsReKou4S0XL4o8H.8LArf1jIOqKDHi8By3sOS4iZK0Xpr6y', '2025-11-18 22:24:33', '2025-11-19 22:24:33', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('f43a956b-5832-4481-8d88-cac845fc637c', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$b.wGTcHZrKD05cPNQcgpBOZ5qi5LAVxglOoxGNw/XfLU2J8yGd4A2', '2025-11-17 19:21:37', '2025-11-18 19:21:37', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('f59c7f56-418e-4086-8102-4622ba83a89a', '3fdb00a0-7774-40f1-96f6-7d4c179bcd93', '$2b$10$QCdPEPHEce.aEadSQ.p1mexWkYx/zTgtKQwNXFpVcCczz.lnrkZ2W', '2025-11-14 11:32:28', '2025-11-15 11:32:28', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('f5cb319a-e4f2-4255-ac7a-b3153fce3f99', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$QFfiv9kxcG3ahMzqleWE5OP9qhh85qypJgWrd4TONL75xNb99N1OC', '2025-11-14 11:59:49', '2025-11-15 11:59:49', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL),
('f79e1af2-1071-4b5b-930c-c1d9bbe548db', '22222222-2222-2222-2222-222222222222', '$2b$10$ofFgGMPq9KdTRXrL5jNTAed7o4o32DXUyQyxWhjazshu8OZvkhaDq', '2025-11-18 23:53:04', '2025-11-19 23:53:04', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('f8036349-1f97-49a3-87f7-9b2a1a00a098', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '$2b$10$7Tw3q3j9JO2zxrqEz7G/6OqdjwaB2DniWOEG5WQDwNvKWeL/I3bKm', '2025-11-17 16:15:10', '2025-11-18 16:15:10', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('f8cf142d-5d6b-4b3b-aaca-b8ac3f3592e7', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$fDOTi2bG/mix6HV/bykihOkYFEGudooIBOkp9FRckeLLMiWqYQm.i', '2025-11-17 16:34:38', '2025-11-18 16:34:38', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('f9815dfd-bc29-4dab-9fd9-b43c045db314', '66666666-6666-6666-6666-666666666666', '$2b$10$qraRjbk2RtfI94lU2iuaiuRu8.mnlP5gPWN1M5VZWmklYrCEIytda', '2025-11-17 15:33:23', '2025-11-18 15:33:23', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('f9b1905f-194f-4318-ba40-61100e3c1430', '11111111-1111-1111-1111-111111111111', '$2b$10$tf9a8O/OtIB4gtP4MMS..uSaONkmEqM7GW7bfRZ7qScENBCl1J0Ia', '2025-11-24 13:31:45', '2025-11-25 13:31:45', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('f9c923fe-99d0-4017-925e-13dbd3604443', '16bec9d0-6123-4428-b9a3-fea81c3592a0', '$2b$10$oCFlu8jhn6D/GzpEyf9r1e56hUS5YBW6SzoR6SuSbrzdo8Dzu5U7a', '2025-11-24 14:33:11', '2025-11-25 14:33:11', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
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
  `facility_id` char(36) NOT NULL,
  `slot_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `slot_status` enum('available','booked','blocked','unavailable','locked') DEFAULT 'available',
  `appointment_id` char(36) DEFAULT NULL,
  `assignment_id` char(36) DEFAULT NULL,
  `lock_status` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Stores provider availability slots for appointment scheduling. Status: available, booked, blocked, unavailable, locked';

--
-- Dumping data for table `availability_slots`
--

INSERT INTO `availability_slots` (`slot_id`, `provider_id`, `facility_id`, `slot_date`, `start_time`, `end_time`, `slot_status`, `appointment_id`, `created_at`) VALUES
('18bd6f2f-09ee-402e-88a1-e48b823c62ed', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440001', '2025-11-26', '12:00:00', '17:00:00', 'available', NULL, '2025-11-24 17:09:01'),
('1eb0e688-97fc-4d3a-97a0-667ff5f1fda0', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440001', '2025-11-27', '08:00:00', '16:00:00', 'available', NULL, '2025-11-24 17:09:01'),
('3947de45-e4fd-4b08-9969-f5df3aee15a1', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440001', '2025-11-25', '10:00:00', '17:00:00', 'available', NULL, '2025-11-24 17:09:01'),
('8cb2c86e-1d5d-404e-af2c-069979ecbb71', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440001', '2025-11-28', '07:00:00', '17:00:00', 'available', NULL, '2025-11-24 17:09:01'),
('a0297351-e483-4a34-a792-46ada08f517f', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440001', '2025-11-29', '10:00:00', '19:00:00', 'available', NULL, '2025-11-24 17:09:01');

-- --------------------------------------------------------

--
-- Table structure for table `doctor_assignments`
--

CREATE TABLE `doctor_assignments` (
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

-- --------------------------------------------------------

--
-- Table structure for table `doctor_conflicts`
--

CREATE TABLE `doctor_conflicts` (
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
-- Table structure for table `appointment_requests`
--

CREATE TABLE `appointment_requests` (
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
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Captures patient appointment requests prior to case manager approval.';

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
('dd9cbd0b-1a7d-40a1-8a86-d83f4c60d04e', NULL, '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '11111111-1111-1111-1111-111111111111', 'counseling', 'Follow-up counseling session for adherence', '2025-11-20', 'in_progress', NULL, '2025-11-19 16:13:36', '11111111-1111-1111-1111-111111111111');

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
('062cea3c-ff0c-44a5-9879-ec40b501b375', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440000', '2025-11-14', 'emergency', 'Stage 1', 'Fever and body weakness for 2 days', 'Patient presented with mild fever, stable vitals.', 'Likely viral infection.', 'Hydration and rest. Paracetamol 500mg every 6 hours.', '2025-11-28', 'ART refill and viral load test.', '2025-11-16 12:47:06', '2025-11-16 12:51:55');

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
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `counseling_sessions`
--

INSERT INTO `counseling_sessions` (`session_id`, `patient_id`, `counselor_id`, `facility_id`, `session_date`, `session_type`, `session_notes`, `follow_up_required`, `follow_up_date`, `created_at`) VALUES
('051d4885-44d1-4770-9cdb-80baa79b3f9e', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440001', '2025-11-19', 'adherence', '{\"duration\":45,\"topics\":[\"Lifestyle Modifications\",\"Stigma Management\"],\"notes\":\"fasdfsdf\"}', 0, NULL, '2025-11-19 15:29:34'),
('45534bc6-d2b6-4213-a582-7256f268cf33', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440001', '2025-11-19', 'adherence', '{\"duration\":45,\"topics\":[\"Medication Adherence\",\"Side Effect Management\"],\"notes\":\"dasdasd\"}', 1, '2025-11-20', '2025-11-19 16:13:36');

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
('18c2e058-00f4-48c2-9ef0-9e0f82583769', 'admin_dashboard_overview', '{\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\"}', '{\"stats\":{\"totalPatients\":3,\"todayAppointments\":0,\"lowStockAlerts\":0,\"monthlyPrescriptions\":3},\"patientRegistrationData\":[{\"name\":\"Nov\",\"patients\":3}],\"monthlyAppointmentsData\":[{\"name\":\"Nov\",\"appointments\":1}],\"riskDistributionData\":[{\"name\":\"Medium\",\"value\":33.3,\"color\":\"#ff9800\"},{\"name\":\"Unknown\",\"value\":66.7,\"color\":\"#9e9e9e\"}],\"monthlyPrescriptionsData\":[{\"name\":\"Nov\",\"prescriptions\":3}]}', '2025-11-21 10:11:28', '2025-11-21 10:16:28'),
('e6f76010-7df1-49e1-84ac-4b2a19b98f92', 'system_summary', '{}', '{\"patientDemographics\":[{\"name\":\"Male\",\"value\":33.3,\"color\":\"#1976d2\"},{\"name\":\"Female\",\"value\":66.7,\"color\":\"#ec407a\"}],\"adherenceTrends\":[{\"name\":\"Nov\",\"value\":50}],\"inventoryLevels\":[{\"name\":\"Tenofovir/Lamivudine/Dolutegravir (TLD)\",\"value\":\"800\"},{\"name\":\"Efavirenz 600mg\",\"value\":\"370\"}],\"appointmentAttendance\":[{\"name\":\"Completed\",\"value\":0,\"color\":\"#4caf50\"},{\"name\":\"Scheduled\",\"value\":100,\"color\":\"#1976d2\"}]}', '2025-11-21 10:06:13', '2025-11-21 10:11:13'),
('f0619619-efe9-4453-b30d-772c3719c4b4', 'admin_dashboard_overview', '{\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\"}', '{\"stats\":{\"totalPatients\":3,\"todayAppointments\":0,\"lowStockAlerts\":0,\"monthlyPrescriptions\":3},\"patientRegistrationData\":[{\"name\":\"Nov\",\"patients\":3}],\"monthlyAppointmentsData\":[{\"name\":\"Nov\",\"appointments\":1}],\"riskDistributionData\":[{\"name\":\"Medium\",\"value\":33.3,\"color\":\"#ff9800\"},{\"name\":\"Unknown\",\"value\":66.7,\"color\":\"#9e9e9e\"}],\"monthlyPrescriptionsData\":[{\"name\":\"Nov\",\"prescriptions\":3}]}', '2025-11-21 10:06:26', '2025-11-21 10:11:26');

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
('53b14af5-6f96-4a40-8749-00175687f846', '062cea3c-ff0c-44a5-9879-ec40b501b375', 'J11', 'Influenza due to unidentified influenza virus', 'primary', 0, '2025-01-08', '1899-11-29');

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
('18b81369-0723-475c-848d-1e42635e36ee', '8201188a-a4eb-4677-816f-08e0998056c2', '73771305-0ea9-4194-9997-4795ac0307dd', '33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000', '2025-11-16', 10, NULL, NULL, '2025-11-16 14:16:37'),
('3173327c-71aa-4322-9806-df26694a0d6d', '82f27f2c-2eaa-44de-9661-488f51d92c4b', 'acb91d51-cf61-4d84-bf8e-4278c739eefe', '33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000', '2025-11-24', 10, NULL, NULL, '2025-11-24 09:23:56'),
('4fe503a0-a9c0-4a4d-b3e5-8c199d274e07', '8201188a-a4eb-4677-816f-08e0998056c2', '73771305-0ea9-4194-9997-4795ac0307dd', '33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000', '2025-11-16', 12, NULL, NULL, '2025-11-16 14:40:56'),
('5c4e5a12-976c-4355-9a8a-a6a74e97ab02', '8201188a-a4eb-4677-816f-08e0998056c2', '73771305-0ea9-4194-9997-4795ac0307dd', '33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000', '2025-11-16', 1, NULL, NULL, '2025-11-16 14:21:53'),
('69c4d690-0433-4f6e-966a-efa5187c0537', '8201188a-a4eb-4677-816f-08e0998056c2', '73771305-0ea9-4194-9997-4795ac0307dd', '33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000', '2025-11-16', 1, NULL, NULL, '2025-11-16 14:22:19'),
('869e38b5-9591-4f4d-8357-dcf2d6b13d84', '8201188a-a4eb-4677-816f-08e0998056c2', '73771305-0ea9-4194-9997-4795ac0307dd', '33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000', '2025-11-16', 1, NULL, NULL, '2025-11-16 14:41:25'),
('d21ee17d-42f9-41b4-8d7e-ca12065de34f', '8201188a-a4eb-4677-816f-08e0998056c2', '73771305-0ea9-4194-9997-4795ac0307dd', '33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000', '2025-11-16', 4, NULL, NULL, '2025-11-16 14:45:22'),
('ebb1908b-a668-42c7-9e21-b96b27df753f', '8201188a-a4eb-4677-816f-08e0998056c2', '73771305-0ea9-4194-9997-4795ac0307dd', '33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000', '2025-11-16', 1, NULL, NULL, '2025-11-16 14:21:58');

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
  `updated_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `facilities`
--

INSERT INTO `facilities` (`facility_id`, `facility_name`, `facility_type`, `address`, `region_id`, `contact_person`, `contact_number`, `email`, `is_active`, `created_at`, `updated_at`) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'MyHubCares Main Facility', 'main', '{\"street\": \"123 Healthcare St\", \"city\": \"Manila\", \"province\": \"Metro Manila\", \"zip_code\": \"1000\"}', 1, 'Admin Office', '+63-2-1234-5678', 'main@myhubcares.com', 1, '2025-11-16 12:16:22', '2025-11-16 12:16:22'),
('550e8400-e29b-41d4-a716-446655440001', 'MyHubCares Main Clinic', 'main', '{\"street\": \"123 Health Avenue\", \"barangay\": \"Barangay Health\", \"city\": \"Manila\", \"province\": \"Metro Manila\", \"zip\": \"1000\"}', 1, 'Dr. Maria Santos', '+63-2-1234-5678', 'main@myhubcares.com', 1, '2025-11-19 14:05:46', '2025-11-19 14:05:46'),
('550e8400-e29b-41d4-a716-446655440002', 'MyHubCares Quezon City Branch', 'branch', '{\"street\": \"456 Wellness Street\", \"barangay\": \"Barangay Care\", \"city\": \"Quezon City\", \"province\": \"Metro Manila\", \"zip\": \"1100\"}', 1, 'Dr. Juan dela Cruz', '+63-2-2345-6789', 'qc@myhubcares.com', 1, '2025-11-19 14:05:46', '2025-11-19 14:05:46'),
('550e8400-e29b-41d4-a716-446655440003', 'MyHubCares Makati Satellite', 'satellite', '{\"street\": \"789 Medical Plaza\", \"barangay\": \"Barangay Medical\", \"city\": \"Makati\", \"province\": \"Metro Manila\", \"zip\": \"1200\"}', 1, 'Nurse Anna Garcia', '+63-2-3456-7890', 'makati@myhubcares.com', 1, '2025-11-19 14:05:46', '2025-11-19 14:05:46');

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
) ;

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
('d96c127c-c8d2-11f0-90fc-98eecbd0e112', 'fcfefa31-7b0e-4e49-b11f-a11ef45c9694', 'low_stock', 'warning', 50.00, 50.00, 'Efavirenz 600mg is at or below reorder level. Current: 50, Reorder level: 50', 1, '11111111-1111-1111-1111-111111111111', '2025-11-24 09:22:03', '2025-11-24 09:13:56');

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
('d97e466a-c8d2-11f0-90fc-98eecbd0e112', 'd9716cb6-c8d2-11f0-90fc-98eecbd0e112', '65af6445-7630-4a2b-8851-d43fb66807ab', 200, 0, 50.00, 'BATCH-20261124-001', '2026-11-24', 'pending'),
('d97e5250-c8d2-11f0-90fc-98eecbd0e112', 'd9716cb6-c8d2-11f0-90fc-98eecbd0e112', '9117b66c-a29f-43cc-ac78-5724222f7a38', 200, 0, 7.00, 'BATCH-20261124-001', '2026-11-24', 'pending'),
('d9881fcf-c8d2-11f0-90fc-98eecbd0e112', 'd980a464-c8d2-11f0-90fc-98eecbd0e112', '65af6445-7630-4a2b-8851-d43fb66807ab', 150, 150, 45.00, 'BATCH-20261124-002', '2026-11-24', 'received');

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
('a47cc7ca-8b87-406b-86eb-0e7de0a0d57f', 'fcfefa31-7b0e-4e49-b11f-a11ef45c9694', 'restock', 50, 50, 100, NULL, 'Manual restock', '11111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440001', '2025-11-24', NULL, NULL, NULL, '2025-11-24 09:22:03'),
('d966b5c8-c8d2-11f0-90fc-98eecbd0e112', '666db96b-ade7-4582-85d4-77e4edc49706', 'restock', 100, 600, 700, 'BATCH-20251124-001', 'Initial stock replenishment', '11111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440002', '2025-11-17', NULL, 'manual', 'Sample transaction data', '2025-11-24 09:13:56'),
('d966b619-c8d2-11f0-90fc-98eecbd0e112', '79642a00-11ce-47eb-934a-1e9c3be7dd5c', 'restock', 100, 270, 370, 'BATCH-20251124-001', 'Initial stock replenishment', '11111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440000', '2025-11-17', NULL, 'manual', 'Sample transaction data', '2025-11-24 09:13:56'),
('d9694233-c8d2-11f0-90fc-98eecbd0e112', '666db96b-ade7-4582-85d4-77e4edc49706', 'dispense', -30, 600, 570, '1', 'Medication dispensed to patient', '33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440002', '2025-11-21', NULL, 'prescription', 'Sample dispense transaction', '2025-11-24 09:13:56');

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

--
-- Dumping data for table `in_app_messages`
--

INSERT INTO `in_app_messages` (`message_id`, `sender_id`, `recipient_id`, `recipient_type`, `group_id`, `subject`, `body`, `payload`, `is_read`, `sent_at`, `read_at`, `priority`) VALUES
('016f557f-c8cc-4176-817a-3d46a103f46e', NULL, '22222222-2222-2222-2222-222222222222', 'user', NULL, 'Appointment Confirmation Required: Hanna Sarabia', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Thursday, November 20, 2025 at 10:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"57cfc6e9-db15-40fc-92c3-b776b3b8f37e\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":null,\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-20T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 1, '2025-11-17 19:17:08', '2025-11-19 08:58:24', 'high'),
('02039d2b-a736-449e-ba34-9d80bd5f69a7', NULL, '22222222-2222-2222-2222-222222222222', 'user', NULL, 'New Appointment', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Wednesday, November 19, 2025 at 10:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"0ebf2c1f-41b0-4729-9c8c-2148bfd5a057\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-19T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 0, '2025-11-19 10:44:23', NULL, 'high'),
('03d09fc0-ca33-4f7d-b61a-ee2766359df1', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'Appointment Request Submitted', 'Your initial appointment request for Wednesday, November 19, 2025 at 10:00 AM at MyHubCares Main Facility has been submitted. Waiting for provider confirmation.', '{\"type\":\"appointment_created\",\"appointment_id\":\"8526a799-cfa0-41b9-84ba-7ac3ad4e0eb7\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"42356bf7-84ef-4aaa-9610-d74b65c3929f\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-19T02:00:00.000Z\",\"appointment_type\":\"initial\"}', 1, '2025-11-18 22:42:34', '2025-11-18 22:45:01', 'normal'),
('09d7c87f-a6fb-48f1-af10-a37382175e6d', NULL, '22222222-2222-2222-2222-222222222222', 'user', NULL, 'New Appointment', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Clinic on Tuesday, November 25, 2025 at 11:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"c4546682-ae74-4a23-b20a-7dd638c1a8b3\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"provider_name\":\"Dr. Juan Dela Cruz\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440001\",\"scheduled_start\":\"2025-11-25T03:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 1, '2025-11-24 17:16:36', '2025-11-24 17:23:09', 'high'),
('0ca60a7b-e17a-4c8e-9b51-08442b4b5a1c', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'Appointment Request Submitted', 'Your initial appointment request for Wednesday, November 19, 2025 at 11:00 AM at MyHubCares Main Facility has been submitted. Waiting for provider confirmation.', '{\"type\":\"appointment_created\",\"appointment_id\":\"68b12581-ed06-4402-bfd3-800ccdca7065\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-19T03:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":false}', 1, '2025-11-19 09:07:53', '2025-11-19 09:14:03', 'normal'),
('0d18ca2c-8753-4546-82bb-88f8cafc32a8', NULL, '44444444-4444-4444-4444-444444444444', 'user', NULL, 'Appointment Confirmation Required: Hanna Sarabia', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Thursday, November 20, 2025 at 10:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"b73db237-d8ec-49d2-8dbb-2c91f4f312d2\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-20T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 0, '2025-11-19 09:43:41', NULL, 'normal'),
('0d2a7116-a0ba-49f3-8d24-445851c261cf', NULL, '33333333-3333-3333-3333-333333333333', 'user', NULL, 'New Appointment', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Thursday, November 20, 2025 at 10:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"14278b62-e8fa-4f3a-b6b9-58c4a92d5cda\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-20T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 0, '2025-11-19 10:28:37', NULL, 'high'),
('0d5fc1e2-da94-4ed1-8d22-3298e634cffe', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'New Appointment', 'Your initial appointment request for Tuesday, November 25, 2025 at 10:00 AM at MyHubCares Main Clinic has been submitted. Waiting for provider confirmation.', '{\"type\":\"appointment_created\",\"appointment_id\":\"24897c4f-6d4f-4075-b87b-9e51d1a86b98\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"provider_name\":\"Dr. Juan Dela Cruz\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440001\",\"scheduled_start\":\"2025-11-25T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":false}', 1, '2025-11-24 16:02:50', '2025-11-24 16:07:29', 'normal'),
('0f81d5d2-97dc-490e-b6e4-de0a65999504', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'Appointment Accepted', 'Your initial appointment with Dr. Juan Dela Cruz at MyHubCares Main Facility on Wednesday, November 19, 2025 at 10:00 AM has been accepted.', '{\"type\":\"appointment_pending_confirmation\",\"appointment_id\":\"0ebf2c1f-41b0-4729-9c8c-2148bfd5a057\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-19T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 1, '2025-11-19 10:44:33', '2025-11-24 13:40:01', 'high'),
('0feefc5f-7745-4df5-8520-beb1dbc2f5ec', NULL, '22222222-2222-2222-2222-222222222222', 'user', NULL, 'New Appointment', 'A new follow up appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Thursday, November 20, 2025 at 12:00 PM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"50237314-55ea-40e7-b0a6-8afabda5d71d\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-20T04:00:00.000Z\",\"appointment_type\":\"follow_up\",\"requires_confirmation\":true}', 1, '2025-11-19 10:36:36', '2025-11-19 10:36:43', 'high'),
('125317a5-9b3d-4a7b-8dcd-af4ceda4228f', NULL, '22222222-2222-2222-2222-222222222222', 'user', NULL, 'New Appointment', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Thursday, November 20, 2025 at 10:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"601d8d27-7669-4003-aff7-85816dc731c1\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-20T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 1, '2025-11-19 10:19:19', '2025-11-19 10:19:42', 'high'),
('1268fdb6-8146-4a9e-a786-253c580f0ccb', NULL, '44444444-4444-4444-4444-444444444444', 'user', NULL, 'Appointment Confirmation Required: Hanna Sarabia', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Wednesday, November 19, 2025 at 11:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"6aef89f9-5ab8-45a4-94fd-fcbd5e3c3415\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"42356bf7-84ef-4aaa-9610-d74b65c3929f\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-19T03:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 0, '2025-11-19 09:18:23', NULL, 'normal'),
('142e9a6e-3164-45b6-a99f-929151d42606', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'Appointment Accepted', 'Your initial appointment with Dr. Juan Dela Cruz at MyHubCares Main Facility on Wednesday, November 19, 2025 at 10:00 AM has been accepted. Please confirm to finalize your appointment.', '{\"type\":\"appointment_pending_confirmation\",\"appointment_id\":\"5b57a6ef-f753-49dd-a171-cb881130499f\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-19T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 1, '2025-11-19 10:03:37', '2025-11-24 14:48:02', 'high'),
('14e6374d-a027-4202-9333-8551dae18721', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'New Appointment', 'Your follow up appointment request for Thursday, November 20, 2025 at 12:00 PM at MyHubCares Main Facility has been submitted. Waiting for provider confirmation.', '{\"type\":\"appointment_created\",\"appointment_id\":\"50237314-55ea-40e7-b0a6-8afabda5d71d\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-20T04:00:00.000Z\",\"appointment_type\":\"follow_up\",\"requires_confirmation\":false}', 1, '2025-11-19 10:36:36', '2025-11-24 14:48:02', 'normal'),
('18bf8854-f063-40a5-82d8-e22e04d4a1cf', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'New Appointment', 'Your initial appointment request for Wednesday, November 19, 2025 at 10:00 AM at MyHubCares Main Facility has been submitted. Waiting for provider confirmation.', '{\"type\":\"appointment_created\",\"appointment_id\":\"0ebf2c1f-41b0-4729-9c8c-2148bfd5a057\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-19T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":false}', 1, '2025-11-19 10:44:23', '2025-11-19 10:44:29', 'normal'),
('19bd5e39-826b-4d78-98b2-89e85590d094', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'Appointment Request Submitted', 'Your initial appointment request for Tuesday, November 18, 2025 at 10:00 AM at MyHubCares Main Facility has been submitted. Waiting for provider confirmation.', '{\"type\":\"appointment_created\",\"appointment_id\":\"622a6a79-2e6e-4368-af26-f6cc7a16918d\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":null,\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-18T02:00:00.000Z\",\"appointment_type\":\"initial\"}', 1, '2025-11-17 20:06:37', '2025-11-17 20:42:39', 'normal'),
('1b2abf7f-3b73-42a8-9861-e5183376e16b', NULL, '42356bf7-84ef-4aaa-9610-d74b65c3929f', 'user', NULL, 'Appointment Confirmation Required: Hanna Sarabia', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Wednesday, November 19, 2025 at 10:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"8526a799-cfa0-41b9-84ba-7ac3ad4e0eb7\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"42356bf7-84ef-4aaa-9610-d74b65c3929f\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-19T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 0, '2025-11-18 22:42:37', NULL, 'high'),
('2092308b-ebbd-4102-a73f-6e19db3859b4', NULL, '22222222-2222-2222-2222-222222222222', 'user', NULL, 'New Appointment', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Clinic on Tuesday, November 25, 2025 at 10:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"24897c4f-6d4f-4075-b87b-9e51d1a86b98\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"provider_name\":\"Dr. Juan Dela Cruz\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440001\",\"scheduled_start\":\"2025-11-25T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 1, '2025-11-24 16:02:50', '2025-11-24 16:03:02', 'high'),
('2ce8fa36-dbd9-4382-ba2f-a30e2e28750e', NULL, '42356bf7-84ef-4aaa-9610-d74b65c3929f', 'user', NULL, 'Appointment Confirmation Required: Hanna Sarabia', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Tuesday, November 18, 2025 at 10:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"622a6a79-2e6e-4368-af26-f6cc7a16918d\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":null,\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-18T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 0, '2025-11-17 20:06:38', NULL, 'high'),
('30912b8b-f414-442a-bc14-59c58db0edd1', NULL, '22222222-2222-2222-2222-222222222222', 'user', NULL, 'Appointment Confirmation Required: Hanna Sarabia', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Wednesday, November 19, 2025 at 12:00 PM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"952fa5c0-05c3-43f2-9d14-6236f057304b\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-19T04:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 0, '2025-11-18 23:14:34', NULL, 'high'),
('317ce94d-46ff-4014-a8da-5e8a22d35c7b', NULL, '44444444-4444-4444-4444-444444444444', 'user', NULL, 'New Appointment', 'A new follow up appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Thursday, November 20, 2025 at 12:00 PM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"50237314-55ea-40e7-b0a6-8afabda5d71d\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-20T04:00:00.000Z\",\"appointment_type\":\"follow_up\",\"requires_confirmation\":true}', 0, '2025-11-19 10:36:36', NULL, 'normal'),
('3922294f-98c7-4484-8ca1-7e7ad9d48b48', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'New Appointment', 'Your follow up appointment request for Monday, November 24, 2025 at 10:00 AM at MyHubCares Main Clinic has been submitted. Waiting for provider confirmation.', '{\"type\":\"appointment_created\",\"appointment_id\":\"cca401d6-b35f-417f-aec9-21b4ad4b86e6\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"provider_name\":\"Dr. Juan Dela Cruz\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440001\",\"scheduled_start\":\"2025-11-24T02:00:00.000Z\",\"appointment_type\":\"follow_up\",\"requires_confirmation\":false}', 0, '2025-11-24 15:12:06', NULL, 'normal'),
('3fa3a873-a3a6-4a65-bcc7-4db34d77ed6f', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'New Appointment', 'Your initial appointment request for Thursday, November 20, 2025 at 10:00 AM at MyHubCares Main Facility has been submitted. Waiting for provider confirmation.', '{\"type\":\"appointment_created\",\"appointment_id\":\"601d8d27-7669-4003-aff7-85816dc731c1\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-20T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":false}', 1, '2025-11-19 10:19:19', '2025-11-24 14:48:02', 'normal'),
('3fe5e1b7-623c-4ee9-957f-730d1de688ed', NULL, '44444444-4444-4444-4444-444444444444', 'user', NULL, 'Appointment Confirmation Required: Hanna Sarabia', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Wednesday, November 19, 2025 at 10:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"718dd879-e315-42d7-87ae-48fe7e55753e\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":null,\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-19T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 1, '2025-11-17 19:12:07', '2025-11-17 20:41:02', 'normal'),
('4632aa8a-5379-4cb1-8096-82c75d69ebf3', NULL, '22222222-2222-2222-2222-222222222222', 'user', NULL, 'New Appointment', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Makati Satellite on Friday, November 21, 2025 at 10:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"52c91faa-2602-4165-8bc2-38bf1647a27e\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"provider_name\":\"Dr. Juan Dela Cruz\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440003\",\"scheduled_start\":\"2025-11-21T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 0, '2025-11-21 10:07:39', NULL, 'high'),
('48069980-a894-47bc-87f5-8c8b040fb286', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'New Appointment', 'Your initial appointment request for Wednesday, November 19, 2025 at 10:00 AM at MyHubCares Main Facility has been submitted. Waiting for provider confirmation.', '{\"type\":\"appointment_created\",\"appointment_id\":\"5b57a6ef-f753-49dd-a171-cb881130499f\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-19T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":false}', 1, '2025-11-19 09:58:06', '2025-11-19 09:58:38', 'normal'),
('65280353-91c1-4b41-a65e-51358079d3be', NULL, '22222222-2222-2222-2222-222222222222', 'user', NULL, 'New Appointment', 'A new initial appointment has been scheduled for Jose Reyes at MyHubCares Main Clinic on Tuesday, November 25, 2025 at 10:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"f5e868d0-b078-4b22-b380-760099dcd035\",\"patient_id\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"provider_name\":\"Dr. Juan Dela Cruz\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440001\",\"scheduled_start\":\"2025-11-25T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 1, '2025-11-24 16:41:21', '2025-11-24 16:41:27', 'high'),
('6bb49434-9fc2-4f7f-a745-b97e6bbb65d6', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'Appointment Accepted', 'Your initial appointment with Dr. Juan Dela Cruz at MyHubCares Main Facility on Thursday, November 20, 2025 at 10:00 AM has been accepted.', '{\"type\":\"appointment_pending_confirmation\",\"appointment_id\":\"14278b62-e8fa-4f3a-b6b9-58c4a92d5cda\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-20T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 1, '2025-11-19 10:30:40', '2025-11-19 10:30:52', 'high'),
('6caff5b3-7f8b-4322-ba6f-d757cf9121de', NULL, '42356bf7-84ef-4aaa-9610-d74b65c3929f', 'user', NULL, 'Appointment Confirmation Required: Hanna Sarabia', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Wednesday, November 19, 2025 at 11:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"6aef89f9-5ab8-45a4-94fd-fcbd5e3c3415\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"42356bf7-84ef-4aaa-9610-d74b65c3929f\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-19T03:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 0, '2025-11-19 09:18:23', NULL, 'high'),
('6cc2d45e-9b84-441c-a3f7-ae5bfc419e4e', NULL, '44444444-4444-4444-4444-444444444444', 'user', NULL, 'New Appointment Scheduled: Hanna Sarabia', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Tuesday, November 18, 2025 at 10:00 AM.', '{\"type\":\"appointment_created\",\"appointment_id\":\"5fd7a1d6-4ec7-4be6-b546-d589eca42c1f\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":null,\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-18T02:00:00.000Z\",\"appointment_type\":\"initial\"}', 1, '2025-11-17 18:58:12', '2025-11-17 20:41:04', 'normal'),
('6f1cd650-3e12-45b5-8909-a166bb7dd43e', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'New Appointment', 'Your initial appointment request for Tuesday, November 25, 2025 at 11:00 AM at MyHubCares Main Clinic has been submitted. Waiting for provider confirmation.', '{\"type\":\"appointment_created\",\"appointment_id\":\"c4546682-ae74-4a23-b20a-7dd638c1a8b3\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"provider_name\":\"Dr. Juan Dela Cruz\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440001\",\"scheduled_start\":\"2025-11-25T03:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":false}', 0, '2025-11-24 17:16:36', NULL, 'normal'),
('7067d699-168b-4c52-8aa5-fec9610a64c2', NULL, '22222222-2222-2222-2222-222222222222', 'user', NULL, 'New Appointment', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Clinic on Tuesday, November 25, 2025 at 10:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"3fce843b-72d9-4918-a223-f23b72b26876\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"provider_name\":\"Dr. Juan Dela Cruz\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440001\",\"scheduled_start\":\"2025-11-25T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 1, '2025-11-24 17:11:13', '2025-11-24 17:11:19', 'high'),
('71ef8051-2dee-4629-b080-c7c2b9d05fb2', NULL, '44444444-4444-4444-4444-444444444444', 'user', NULL, 'New Appointment', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Wednesday, November 19, 2025 at 10:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"0ebf2c1f-41b0-4729-9c8c-2148bfd5a057\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-19T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 0, '2025-11-19 10:44:23', NULL, 'normal'),
('784cfdee-7b15-4277-90ae-039409315c07', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'Appointment Accepted', 'Your initial appointment with Dr. Juan Dela Cruz at MyHubCares Main Facility on Thursday, November 20, 2025 at 10:00 AM has been accepted.', '{\"type\":\"appointment_pending_confirmation\",\"appointment_id\":\"14278b62-e8fa-4f3a-b6b9-58c4a92d5cda\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-20T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 1, '2025-11-19 10:28:50', '2025-11-24 14:48:02', 'high'),
('86926ebd-720e-4759-a19b-f2e2961682f4', NULL, '44444444-4444-4444-4444-444444444444', 'user', NULL, 'New Appointment', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Wednesday, November 19, 2025 at 10:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"5b57a6ef-f753-49dd-a171-cb881130499f\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-19T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 0, '2025-11-19 09:58:06', NULL, 'normal'),
('8d77b52d-bc20-4f00-ba2d-c6655662e454', NULL, '44444444-4444-4444-4444-444444444444', 'user', NULL, 'Appointment Confirmation Required: Hanna Sarabia', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Wednesday, November 19, 2025 at 10:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"1d158955-a429-416c-95f4-8029225ca3b5\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-19T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 0, '2025-11-18 23:07:23', NULL, 'normal'),
('8de9da51-ae59-4e54-abe0-f53560f60fb0', NULL, '44444444-4444-4444-4444-444444444444', 'user', NULL, 'Appointment Confirmation Required: Hanna Sarabia', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Wednesday, November 19, 2025 at 11:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"68b12581-ed06-4402-bfd3-800ccdca7065\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-19T03:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 0, '2025-11-19 09:07:53', NULL, 'normal'),
('901f9f7e-beb1-4b9a-a7fa-6be528955d0f', NULL, '22222222-2222-2222-2222-222222222222', 'user', NULL, 'Appointment Confirmation Required: Hanna Sarabia', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Tuesday, November 18, 2025 at 10:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"622a6a79-2e6e-4368-af26-f6cc7a16918d\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":null,\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-18T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 0, '2025-11-17 20:06:37', NULL, 'high'),
('9083255e-f926-4cf5-8614-e67f65e8256d', NULL, '44444444-4444-4444-4444-444444444444', 'user', NULL, 'Appointment Confirmation Required: Hanna Sarabia', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Thursday, November 20, 2025 at 10:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"57cfc6e9-db15-40fc-92c3-b776b3b8f37e\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":null,\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-20T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 1, '2025-11-17 19:17:07', '2025-11-17 20:41:00', 'normal'),
('91b87444-4fda-4265-8c1d-422fc93de033', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'New Appointment', 'Your initial appointment request for Tuesday, November 25, 2025 at 01:00 PM at MyHubCares Main Clinic has been submitted. Waiting for provider confirmation.', '{\"type\":\"appointment_created\",\"appointment_id\":\"4fb003a0-5c34-438e-a1cf-54da19a0c792\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"provider_name\":\"Dr. Juan Dela Cruz\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440001\",\"scheduled_start\":\"2025-11-25T05:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":false}', 0, '2025-11-24 17:34:14', NULL, 'normal'),
('929f1e38-53b9-4833-8522-5b99a4bdbe95', NULL, '22222222-2222-2222-2222-222222222222', 'user', NULL, 'New Appointment', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Thursday, November 20, 2025 at 10:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"14278b62-e8fa-4f3a-b6b9-58c4a92d5cda\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-20T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 1, '2025-11-19 10:28:37', '2025-11-19 10:30:49', 'high'),
('9983ee45-c6fa-4e74-87c5-0bed4042b8ac', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'Appointment Accepted', 'Your follow up appointment with Dr. Juan Dela Cruz at MyHubCares Main Clinic on Monday, November 24, 2025 at 10:00 AM has been accepted.', '{\"type\":\"appointment_accepted\",\"appointment_id\":\"cca401d6-b35f-417f-aec9-21b4ad4b86e6\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"provider_name\":\"Dr. Juan Dela Cruz\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440001\",\"scheduled_start\":\"2025-11-24T02:00:00.000Z\",\"appointment_type\":\"follow_up\",\"requires_confirmation\":true}', 0, '2025-11-24 15:13:21', NULL, 'high'),
('9baf4d80-0e6e-4e4d-8eaa-1037cdccb6dc', NULL, '22222222-2222-2222-2222-222222222222', 'user', NULL, 'New Appointment', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Clinic on Tuesday, November 25, 2025 at 01:00 PM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"4fb003a0-5c34-438e-a1cf-54da19a0c792\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"provider_name\":\"Dr. Juan Dela Cruz\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440001\",\"scheduled_start\":\"2025-11-25T05:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 1, '2025-11-24 17:34:14', '2025-11-27 11:20:35', 'high'),
('9dd2c942-e2a3-43e9-bb02-7cbb314b7df2', NULL, '44444444-4444-4444-4444-444444444444', 'user', NULL, 'New Appointment', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Thursday, November 20, 2025 at 10:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"601d8d27-7669-4003-aff7-85816dc731c1\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-20T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 0, '2025-11-19 10:19:19', NULL, 'normal'),
('9e87b135-b107-416c-a9f4-dd603055f04e', NULL, '44444444-4444-4444-4444-444444444444', 'user', NULL, 'Appointment Confirmation Required: Hanna Sarabia', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Wednesday, November 19, 2025 at 12:00 PM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"952fa5c0-05c3-43f2-9d14-6236f057304b\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-19T04:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 0, '2025-11-18 23:14:34', NULL, 'normal'),
('a0496dc8-eca8-4991-9c64-8ec9f30c2eea', NULL, '33333333-3333-3333-3333-333333333333', 'user', NULL, 'New Appointment', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Wednesday, November 19, 2025 at 10:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"0ebf2c1f-41b0-4729-9c8c-2148bfd5a057\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-19T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 0, '2025-11-19 10:44:23', NULL, 'high'),
('a1ee797e-c669-42c9-bc73-46a2859194de', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'Appointment Accepted', 'Your follow up appointment with Dr. Juan Dela Cruz at MyHubCares Main Facility on Thursday, November 20, 2025 at 12:00 PM has been accepted.', '{\"type\":\"appointment_pending_confirmation\",\"appointment_id\":\"50237314-55ea-40e7-b0a6-8afabda5d71d\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-20T04:00:00.000Z\",\"appointment_type\":\"follow_up\",\"requires_confirmation\":true}', 1, '2025-11-19 10:40:13', '2025-11-24 14:48:02', 'high'),
('a2ba4a3a-5856-4ebd-8cc1-ef55aeeae019', NULL, '22222222-2222-2222-2222-222222222222', 'user', NULL, 'Appointment Confirmation Required: Hanna Sarabia', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Wednesday, November 19, 2025 at 10:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"1d158955-a429-416c-95f4-8029225ca3b5\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-19T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 0, '2025-11-18 23:07:23', NULL, 'high'),
('a422c588-aeb0-47a4-9b8b-c963e37a597a', NULL, '11111111-1111-1111-1111-111111111111', 'user', NULL, 'New Appointment', 'Your initial appointment request for Tuesday, November 25, 2025 at 10:00 AM at MyHubCares Main Clinic has been submitted. Waiting for provider confirmation.', '{\"type\":\"appointment_created\",\"appointment_id\":\"f5e868d0-b078-4b22-b380-760099dcd035\",\"patient_id\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"provider_name\":\"Dr. Juan Dela Cruz\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440001\",\"scheduled_start\":\"2025-11-25T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":false}', 0, '2025-11-24 16:41:21', NULL, 'normal'),
('a47cb465-7d9f-4cc5-ab00-a24ae672e6eb', NULL, '44444444-4444-4444-4444-444444444444', 'user', NULL, 'Appointment Confirmation Required: Hanna Sarabia', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Tuesday, November 18, 2025 at 10:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"622a6a79-2e6e-4368-af26-f6cc7a16918d\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":null,\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-18T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 1, '2025-11-17 20:06:37', '2025-11-17 20:43:05', 'normal'),
('a8aa0bbe-d547-4a0f-9cb8-82c08ae70aca', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'Appointment Request Submitted', 'Your initial appointment request for Thursday, November 20, 2025 at 10:00 AM at MyHubCares Main Facility has been submitted. Waiting for provider confirmation.', '{\"type\":\"appointment_created\",\"appointment_id\":\"b73db237-d8ec-49d2-8dbb-2c91f4f312d2\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-20T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":false}', 1, '2025-11-19 09:43:41', '2025-11-24 14:48:02', 'normal'),
('a8ef44a1-2e6b-4a11-b044-cfefd62e4e60', NULL, '22222222-2222-2222-2222-222222222222', 'user', NULL, 'Appointment Confirmation Required: Hanna Sarabia', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Thursday, November 20, 2025 at 10:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"b73db237-d8ec-49d2-8dbb-2c91f4f312d2\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-20T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 1, '2025-11-19 09:43:41', '2025-11-19 09:43:48', 'high'),
('ac7a451f-1a3f-4c73-b2a1-52b2a6e3e3b6', NULL, '44444444-4444-4444-4444-444444444444', 'user', NULL, 'Appointment Confirmation Required: Hanna Sarabia', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Wednesday, November 19, 2025 at 10:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"8526a799-cfa0-41b9-84ba-7ac3ad4e0eb7\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"42356bf7-84ef-4aaa-9610-d74b65c3929f\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-19T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 0, '2025-11-18 22:42:38', NULL, 'normal'),
('af200aac-2b18-4132-9800-2ca6ca9d3e33', NULL, '22222222-2222-2222-2222-222222222222', 'user', NULL, 'Appointment Confirmation Required: Hanna Sarabia', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Thursday, November 20, 2025 at 10:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"aebc132a-b44b-4600-8c8f-516ec55f28da\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-20T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 0, '2025-11-19 00:01:09', NULL, 'high'),
('b1962200-02b0-4923-9711-a9b7ed63f780', NULL, '22222222-2222-2222-2222-222222222222', 'user', NULL, 'New Appointment', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Wednesday, November 19, 2025 at 10:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"5b57a6ef-f753-49dd-a171-cb881130499f\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-19T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 1, '2025-11-19 09:58:06', '2025-11-19 10:03:34', 'high'),
('b23cab9e-e12c-4fc5-bb80-dbd54912ddba', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'New Appointment', 'Your initial appointment request for Thursday, November 20, 2025 at 10:00 AM at MyHubCares Main Facility has been submitted. Waiting for provider confirmation.', '{\"type\":\"appointment_created\",\"appointment_id\":\"14278b62-e8fa-4f3a-b6b9-58c4a92d5cda\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-20T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":false}', 1, '2025-11-19 10:28:37', '2025-11-19 10:28:53', 'normal'),
('b36d1f48-aa68-48d4-8a2a-d0ef1d7c5a47', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'Appointment Accepted', 'Your initial appointment with Dr. Juan Dela Cruz at MyHubCares Makati Satellite on Friday, November 21, 2025 at 10:00 AM has been accepted.', '{\"type\":\"appointment_accepted\",\"appointment_id\":\"52c91faa-2602-4165-8bc2-38bf1647a27e\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"provider_name\":\"Dr. Juan Dela Cruz\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440003\",\"scheduled_start\":\"2025-11-21T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 1, '2025-11-21 10:08:33', '2025-11-24 14:47:58', 'high'),
('b79adc4b-113c-407e-b565-b1e4742aba67', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'New Appointment', 'Your initial appointment request for Tuesday, November 25, 2025 at 10:00 AM at MyHubCares Main Clinic has been submitted. Waiting for provider confirmation.', '{\"type\":\"appointment_created\",\"appointment_id\":\"3fce843b-72d9-4918-a223-f23b72b26876\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"provider_name\":\"Dr. Juan Dela Cruz\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440001\",\"scheduled_start\":\"2025-11-25T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":false}', 0, '2025-11-24 17:11:13', NULL, 'normal'),
('b95cc4e7-c56d-4b61-9275-dfe22777cbb4', NULL, '42356bf7-84ef-4aaa-9610-d74b65c3929f', 'user', NULL, 'New Appointment', 'Your follow up appointment request for Friday, November 21, 2025 at 12:00 PM at MyHubCares Main Clinic has been submitted. Waiting for provider confirmation.', '{\"type\":\"appointment_created\",\"appointment_id\":\"9c55636b-9d6f-4654-b86f-3cfd61f7c25c\",\"patient_id\":\"2fe2674f-5147-4d96-8c68-54caa67efcfc\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"provider_name\":\"Dr. Juan Dela Cruz\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440001\",\"scheduled_start\":\"2025-11-21T04:00:00.000Z\",\"appointment_type\":\"follow_up\",\"requires_confirmation\":false}', 0, '2025-11-21 10:22:43', NULL, 'normal'),
('badbbf24-bec5-4f99-bf3e-923b7cb51bfd', NULL, '44444444-4444-4444-4444-444444444444', 'user', NULL, 'New Appointment', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Thursday, November 20, 2025 at 10:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"14278b62-e8fa-4f3a-b6b9-58c4a92d5cda\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-20T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 0, '2025-11-19 10:28:37', NULL, 'normal'),
('bd3b81be-7e61-4eb3-a67e-13c98dc46e7f', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'Appointment Confirmation Required', 'Your initial appointment with Dr. Juan Dela Cruz at MyHubCares Main Facility on Thursday, November 20, 2025 at 10:00 AM has been accepted. Please confirm to finalize your appointment.', '{\"type\":\"appointment_pending_confirmation\",\"appointment_id\":\"b73db237-d8ec-49d2-8dbb-2c91f4f312d2\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-20T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 1, '2025-11-19 09:43:51', '2025-11-24 14:48:02', 'high'),
('c36d24f8-9762-472c-8f7e-73b77393e004', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'Appointment Declined', 'Your initial appointment with Dr. Juan Dela Cruz at MyHubCares Main Clinic on Friday, November 28, 2025 at 10:53 AM has been declined. Reason: 00000000000000000000000000', '{\"type\":\"appointment_declined\",\"appointment_id\":\"65248595-e59d-4d5f-a6fa-5d28d6d350ac\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"provider_name\":\"Dr. Juan Dela Cruz\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440001\",\"scheduled_start\":\"2025-11-28T02:53:00.000Z\",\"appointment_type\":\"initial\",\"decline_reason\":\"00000000000000000000000000\"}', 1, '2025-11-27 18:49:57', '2025-11-27 18:50:31', 'high'),
('c54e418d-8f18-4bc5-ba18-8805d221a37b', NULL, '22222222-2222-2222-2222-222222222222', 'user', NULL, 'New Appointment', 'A new follow up appointment has been scheduled for Trixie Morales at MyHubCares Main Clinic on Friday, November 21, 2025 at 12:00 PM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"9c55636b-9d6f-4654-b86f-3cfd61f7c25c\",\"patient_id\":\"2fe2674f-5147-4d96-8c68-54caa67efcfc\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"provider_name\":\"Dr. Juan Dela Cruz\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440001\",\"scheduled_start\":\"2025-11-21T04:00:00.000Z\",\"appointment_type\":\"follow_up\",\"requires_confirmation\":true}', 0, '2025-11-21 10:22:43', NULL, 'high'),
('c6c1d02d-3d98-463c-8c3e-e593820543b8', NULL, '44444444-4444-4444-4444-444444444444', 'user', NULL, 'Appointment Confirmation Required: Hanna Sarabia', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Thursday, November 20, 2025 at 10:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"aebc132a-b44b-4600-8c8f-516ec55f28da\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-20T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 0, '2025-11-19 00:01:09', NULL, 'normal'),
('c8087318-0da4-4a6b-8280-5af5735a170f', NULL, '42356bf7-84ef-4aaa-9610-d74b65c3929f', 'user', NULL, 'Appointment Confirmation Required: Hanna Sarabia', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Thursday, November 20, 2025 at 10:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"57cfc6e9-db15-40fc-92c3-b776b3b8f37e\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":null,\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-20T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 1, '2025-11-17 19:17:08', '2025-11-17 19:31:21', 'high'),
('cde7595c-2ce5-4eff-b7b0-25f3c2bd1d91', NULL, '33333333-3333-3333-3333-333333333333', 'user', NULL, 'New Appointment', 'A new follow up appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Thursday, November 20, 2025 at 12:00 PM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"50237314-55ea-40e7-b0a6-8afabda5d71d\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-20T04:00:00.000Z\",\"appointment_type\":\"follow_up\",\"requires_confirmation\":true}', 0, '2025-11-19 10:36:36', NULL, 'high'),
('ce1683ef-ae48-4923-8f70-626becd8a7c4', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'Appointment Request Submitted', 'Your initial appointment request for Thursday, November 20, 2025 at 10:00 AM at MyHubCares Main Facility has been submitted. Waiting for provider confirmation.', '{\"type\":\"appointment_created\",\"appointment_id\":\"57cfc6e9-db15-40fc-92c3-b776b3b8f37e\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":null,\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-20T02:00:00.000Z\",\"appointment_type\":\"initial\"}', 1, '2025-11-17 19:17:07', '2025-11-17 20:42:48', 'normal');
INSERT INTO `in_app_messages` (`message_id`, `sender_id`, `recipient_id`, `recipient_type`, `group_id`, `subject`, `body`, `payload`, `is_read`, `sent_at`, `read_at`, `priority`) VALUES
('d245c00e-f723-4032-b785-234a4175aa67', NULL, '11111111-1111-1111-1111-111111111111', 'user', NULL, 'Appointment Declined', 'Your art pickup appointment with Trixie Morales at MyHubCares Main Facility on Thursday, November 27, 2025 at 10:35 AM has been declined. Reason: 11111111111111111111111111111111', '{\"type\":\"appointment_declined\",\"appointment_id\":\"e589dffc-2939-4ab5-ae2a-6cfaab870bed\",\"patient_id\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"provider_id\":\"42356bf7-84ef-4aaa-9610-d74b65c3929f\",\"provider_name\":\"Trixie Morales\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-27T02:35:00.000Z\",\"appointment_type\":\"art_pickup\",\"decline_reason\":\"11111111111111111111111111111111\"}', 0, '2025-11-27 18:48:34', NULL, 'high'),
('d3c973d4-5fe1-471f-ad27-114d380af3b9', NULL, '22222222-2222-2222-2222-222222222222', 'user', NULL, 'Appointment Confirmation Required: Hanna Sarabia', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Wednesday, November 19, 2025 at 11:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"68b12581-ed06-4402-bfd3-800ccdca7065\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-19T03:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 1, '2025-11-19 09:07:53', '2025-11-19 09:08:15', 'high'),
('d3f06e59-7365-439a-bc35-e25031b8a8a4', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'Appointment Request Submitted', 'Your initial appointment request for Wednesday, November 19, 2025 at 11:00 AM at MyHubCares Main Facility has been submitted. Waiting for provider confirmation.', '{\"type\":\"appointment_created\",\"appointment_id\":\"6aef89f9-5ab8-45a4-94fd-fcbd5e3c3415\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"42356bf7-84ef-4aaa-9610-d74b65c3929f\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-19T03:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":false}', 1, '2025-11-19 09:18:23', '2025-11-24 14:48:02', 'normal'),
('db7805f0-d19c-4967-a7b2-459daf057409', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'Appointment Declined', 'Your counseling appointment with Trixie Morales at MyHubCares Main Facility on Thursday, November 27, 2025 at 09:01 AM has been declined. Reason: HAHAHAHAHHHA BALIW', '{\"type\":\"appointment_declined\",\"appointment_id\":\"a1a20ff3-3d0c-457f-9788-7ee0809ee959\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"42356bf7-84ef-4aaa-9610-d74b65c3929f\",\"provider_name\":\"Trixie Morales\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-27T01:01:00.000Z\",\"appointment_type\":\"counseling\",\"decline_reason\":\"HAHAHAHAHHHA BALIW\"}', 1, '2025-11-27 11:30:28', '2025-11-27 11:30:50', 'high'),
('dfcb0d50-eb4d-41f2-9351-d8379b524064', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'Appointment Accepted', 'Your initial appointment with Dr. Juan Dela Cruz at MyHubCares Main Facility on Wednesday, November 19, 2025 at 10:00 AM has been accepted. Please confirm to finalize your appointment.', '{\"type\":\"appointment_pending_confirmation\",\"appointment_id\":\"5b57a6ef-f753-49dd-a171-cb881130499f\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-19T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 1, '2025-11-19 10:03:43', '2025-11-19 10:03:51', 'high'),
('e31f5fc0-e835-46f3-ab82-a88edce983b6', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'Appointment Request Submitted', 'Your initial appointment request for Thursday, November 20, 2025 at 10:00 AM at MyHubCares Main Facility has been submitted. Waiting for provider confirmation.', '{\"type\":\"appointment_created\",\"appointment_id\":\"aebc132a-b44b-4600-8c8f-516ec55f28da\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-20T02:00:00.000Z\",\"appointment_type\":\"initial\"}', 1, '2025-11-19 00:01:09', '2025-11-24 14:48:02', 'normal'),
('e46846d7-77c7-4eb9-9a38-a9206f49a610', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'Appointment Declined', 'Your art pickup appointment with Trixie Morales at MyHubCares Main Facility on Thursday, November 27, 2025 at 10:35 AM has been declined. Reason: HAHA TANGA', '{\"type\":\"appointment_declined\",\"appointment_id\":\"56c000c3-dd06-4002-adb2-58b841931147\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"42356bf7-84ef-4aaa-9610-d74b65c3929f\",\"provider_name\":\"Trixie Morales\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-27T02:35:00.000Z\",\"appointment_type\":\"art_pickup\",\"decline_reason\":\"HAHA TANGA\"}', 1, '2025-11-27 11:36:16', '2025-11-27 11:36:21', 'high'),
('e6b1504b-0eb5-4e41-9aeb-b7a71173a93b', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'Appointment Confirmation Required', 'Your initial appointment with Dr. Juan Dela Cruz at MyHubCares Main Facility on Thursday, November 20, 2025 at 10:00 AM has been accepted. Please confirm to finalize your appointment.', '{\"type\":\"appointment_pending_confirmation\",\"appointment_id\":\"aebc132a-b44b-4600-8c8f-516ec55f28da\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-20T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 1, '2025-11-19 00:01:33', '2025-11-24 14:48:02', 'high'),
('e81f506e-6c8e-45c7-a649-9012591a3080', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'Appointment Request Submitted', 'Your initial appointment request for Wednesday, November 19, 2025 at 10:00 AM at MyHubCares Main Facility has been submitted. Waiting for provider confirmation.', '{\"type\":\"appointment_created\",\"appointment_id\":\"718dd879-e315-42d7-87ae-48fe7e55753e\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":null,\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-19T02:00:00.000Z\",\"appointment_type\":\"initial\"}', 1, '2025-11-17 19:12:06', '2025-11-17 20:35:36', 'normal'),
('f00c6521-3c8c-442e-b4ff-cf104aca3f12', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'Appointment Request Submitted', 'Your initial appointment request for Wednesday, November 19, 2025 at 10:00 AM at MyHubCares Main Facility has been submitted. Waiting for provider confirmation.', '{\"type\":\"appointment_created\",\"appointment_id\":\"1d158955-a429-416c-95f4-8029225ca3b5\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-19T02:00:00.000Z\",\"appointment_type\":\"initial\"}', 1, '2025-11-18 23:07:22', '2025-11-24 14:48:02', 'normal'),
('f526d268-1c22-44c0-a43b-9b873ca1fc18', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'Appointment Request Submitted', 'Your initial appointment request for Wednesday, November 19, 2025 at 12:00 PM at MyHubCares Main Facility has been submitted. Waiting for provider confirmation.', '{\"type\":\"appointment_created\",\"appointment_id\":\"952fa5c0-05c3-43f2-9d14-6236f057304b\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-19T04:00:00.000Z\",\"appointment_type\":\"initial\"}', 1, '2025-11-18 23:14:34', '2025-11-24 14:48:02', 'normal'),
('f5d627a9-6ac0-4196-b061-2a6694bfe333', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'Appointment Declined', 'Your initial appointment with Dr. Juan Dela Cruz at MyHubCares Main Facility on Thursday, November 20, 2025 at 10:00 AM has been declined. Please contact the facility to reschedule.', '{\"type\":\"appointment_declined\",\"appointment_id\":\"14278b62-e8fa-4f3a-b6b9-58c4a92d5cda\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-20T02:00:00.000Z\",\"appointment_type\":\"initial\",\"decline_reason\":null}', 1, '2025-11-19 10:29:05', '2025-11-19 10:29:13', 'high'),
('f897a7ea-71e4-4a66-a8bb-384a081f7b62', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'New Appointment', 'Your initial appointment request for Friday, November 21, 2025 at 10:00 AM at MyHubCares Makati Satellite has been submitted. Waiting for provider confirmation.', '{\"type\":\"appointment_created\",\"appointment_id\":\"52c91faa-2602-4165-8bc2-38bf1647a27e\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"provider_name\":\"Dr. Juan Dela Cruz\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440003\",\"scheduled_start\":\"2025-11-21T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":false}', 1, '2025-11-21 10:07:39', '2025-11-24 14:48:02', 'normal'),
('fa0dbd76-5e6f-403f-9e85-da5661fc5473', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'Appointment Accepted', 'Your initial appointment with Dr. Juan Dela Cruz at MyHubCares Main Facility on Thursday, November 20, 2025 at 10:00 AM has been accepted.', '{\"type\":\"appointment_pending_confirmation\",\"appointment_id\":\"601d8d27-7669-4003-aff7-85816dc731c1\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-20T02:00:00.000Z\",\"appointment_type\":\"initial\",\"requires_confirmation\":true}', 1, '2025-11-19 10:19:44', '2025-11-19 10:20:24', 'high'),
('ff2f2aea-c1e4-4fc3-8c40-4630635124d4', NULL, '22222222-2222-2222-2222-222222222222', 'user', NULL, 'New Appointment', 'A new follow up appointment has been scheduled for Hanna Sarabia at MyHubCares Main Clinic on Monday, November 24, 2025 at 10:00 AM. Please accept or decline this appointment.', '{\"type\":\"appointment_created\",\"appointment_id\":\"cca401d6-b35f-417f-aec9-21b4ad4b86e6\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":\"22222222-2222-2222-2222-222222222222\",\"provider_name\":\"Dr. Juan Dela Cruz\",\"facility_id\":\"550e8400-e29b-41d4-a716-446655440001\",\"scheduled_start\":\"2025-11-24T02:00:00.000Z\",\"appointment_type\":\"follow_up\",\"requires_confirmation\":true}', 0, '2025-11-24 15:12:06', NULL, 'high'),
('ff8d6b2d-ea3a-46b7-a220-d1e88ee1b58e', NULL, '16bec9d0-6123-4428-b9a3-fea81c3592a0', 'user', NULL, 'Appointment Confirmed', 'Your initial appointment has been scheduled for Tuesday, November 18, 2025 at 10:00 AM at MyHubCares Main Facility.', '{\"type\":\"appointment_created\",\"appointment_id\":\"5fd7a1d6-4ec7-4be6-b546-d589eca42c1f\",\"patient_id\":\"80f7668b-3d92-42d0-a75c-eb4873fcc8c4\",\"provider_id\":null,\"facility_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"scheduled_start\":\"2025-11-18T02:00:00.000Z\",\"appointment_type\":\"initial\"}', 1, '2025-11-17 18:58:11', '2025-11-18 23:54:18', 'normal');

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
('9573db2c-7c7c-4e96-9de9-eac49eaae743', 'd1cc561a-c533-4c17-bf09-4bc4d9841094', '545832021_1689460425052578_6722400524695115105_n.jpg', 'uploads\\lab-files\\1763354738746-355905833.jpg', 165137, 'image/jpeg', '2025-11-17 12:45:38', '22222222-2222-2222-2222-222222222222');

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
('e3768174-a8b4-41f0-8579-83038959c1a5', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-11-17', 'CD4 Count', 'routine', 'completed', '2025-11-30', NULL, '2025-11-17 12:28:23'),
('e4e5c4d0-e314-4c45-bf8f-bb3cacc27a9c', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440000', '2025-11-16', 'Viral Load', 'urgent', 'cancelled', '2025-11-16', NULL, '2025-11-16 21:35:53');

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
('d1cc561a-c533-4c17-bf09-4bc4d9841094', 'e3768174-a8b4-41f0-8579-83038959c1a5', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'CD4COUNT', 'CD4 Count', 'Okay naman siya', NULL, NULL, NULL, NULL, 0, 0, '2025-11-30', '2025-11-17', NULL, NULL, NULL, '2025-11-17 12:30:14', '22222222-2222-2222-2222-222222222222');

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
('65af6445-7630-4a2b-8851-d43fb66807ab', 'Tenofovir/Lamivudine/Dolutegravir (TLD)', 'TLD', 'tablet', '500mg', NULL, 1, 1, 1),
('9117b66c-a29f-43cc-ac78-5724222f7a38', 'Efavirenz 600mg', NULL, 'tablet', '600mg', NULL, 1, 1, 1);

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
('2ced69d2-8f05-4404-99e2-3f15062465f1', '69688306-fd70-41a5-8a71-9d41d0304072', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2025-11-16', 0, NULL, 100.00, '2025-11-16 19:17:38'),
('578827d5-0254-4a9d-b0ff-a91fdf6e9981', '8201188a-a4eb-4677-816f-08e0998056c2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2025-11-16', 1, NULL, 999.99, '2025-11-16 19:17:33');

-- --------------------------------------------------------

--
-- Table structure for table `medication_dispensing`
--

CREATE TABLE `medication_dispensing` (
  `dispensing_id` char(36) NOT NULL,
  `refill_id` char(36) DEFAULT NULL,
  `patient_id` char(36) NOT NULL,
  `medication_id` char(36) NOT NULL,
  `facility_id` char(36) NOT NULL,
  `quantity_dispensed` int(11) NOT NULL,
  `pickup_date` date NOT NULL,
  `dispenser_id` char(36) NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `medication_inventory`
--

CREATE TABLE `medication_inventory` (
  `inventory_id` char(36) NOT NULL,
  `medication_id` char(36) NOT NULL,
  `facility_id` char(36) NOT NULL,
  `batch_number` varchar(50) DEFAULT NULL,
  `quantity_on_hand` int(11) DEFAULT 0,
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
('666db96b-ade7-4582-85d4-77e4edc49706', '65af6445-7630-4a2b-8851-d43fb66807ab', '550e8400-e29b-41d4-a716-446655440002', '1', 600, 'tablets', '2026-11-12', 200, '2025-11-15', 'MyHubCares Pharmacy', NULL, '2025-11-15 17:39:40'),
('79642a00-11ce-47eb-934a-1e9c3be7dd5c', '9117b66c-a29f-43cc-ac78-5724222f7a38', '550e8400-e29b-41d4-a716-446655440000', NULL, 260, 'tablets', '2026-11-16', 200, '2025-11-16', 'MyHubCares Pharmacy', 7.00, '2025-11-16 12:48:17'),
('f8788bf9-153b-4599-b162-3daee7bd95cb', '65af6445-7630-4a2b-8851-d43fb66807ab', '550e8400-e29b-41d4-a716-446655440000', NULL, 200, 'capsules', '2027-11-16', 50, NULL, NULL, NULL, '2025-11-16 12:48:51'),
('fcfefa31-7b0e-4e49-b11f-a11ef45c9694', '9117b66c-a29f-43cc-ac78-5724222f7a38', '550e8400-e29b-41d4-a716-446655440001', NULL, 100, 'tablets', '2026-11-15', 50, '2025-11-24', 'MyHubCares Pharmacy', 6.50, '2025-11-15 18:56:04');

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
  `updated_at` datetime DEFAULT current_timestamp(),
  `last_triggered_at` datetime DEFAULT NULL COMMENT 'Last time this reminder was triggered',
  `last_acknowledged_at` datetime DEFAULT NULL COMMENT 'Last time patient acknowledged this reminder',
  `acknowledgment_count` int(11) DEFAULT 0 COMMENT 'Total number of times reminder was acknowledged'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medication_reminders`
--

INSERT INTO `medication_reminders` (`reminder_id`, `prescription_id`, `patient_id`, `medication_name`, `dosage`, `frequency`, `reminder_time`, `sound_preference`, `browser_notifications`, `special_instructions`, `active`, `missed_doses`, `created_at`, `updated_at`, `last_triggered_at`, `last_acknowledged_at`, `acknowledgment_count`) VALUES
('0f164e3c-60be-4892-9039-65e780ba49b9', '82f27f2c-2eaa-44de-9661-488f51d92c4b', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', 'Efavirenz 600mg', '1 tablet', 'Once Daily', '09:00:00', 'default', 1, NULL, 1, 0, '2025-11-24 09:23:56', '2025-11-24 09:23:56', NULL, NULL, 0),
('8eaddc06-269f-41a7-b590-023e9be2daac', NULL, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Mefenamic', '500mg', 'daily', '17:36:00', 'gentle', 1, NULL, 1, 0, '2025-11-24 14:35:33', '2025-11-24 14:35:33', NULL, NULL, 0),
('95875138-2098-424a-a8ca-5fe659480ca8', '8201188a-a4eb-4677-816f-08e0998056c2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Efavirenz 600mg', '1 tablet', 'Once daily', '09:00:00', 'default', 1, NULL, 1, 1, '2025-11-16 14:16:37', '2025-11-16 15:56:39', NULL, NULL, 0);

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
('02bd7b7f-dfae-4e70-a2b4-ce73439a6caf', '11111111-1111-1111-1111-111111111111', 'New Appointment', 'A new initial appointment has been scheduled for Jose Reyes at MyHubCares Main Clinic on Tuesday, November 25, 2025 at 10:00 AM.', 'appointment', 0, NULL, '2025-11-24 16:41:21'),
('07da154e-76ce-426c-a811-021562de0bdb', '44444444-4444-4444-4444-444444444444', 'New Appointment', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Clinic on Tuesday, November 25, 2025 at 11:00 AM.', 'appointment', 0, NULL, '2025-11-24 17:16:36'),
('0a122997-5b13-40d5-9284-1d686a51fab1', '44444444-4444-4444-4444-444444444444', 'New Appointment', 'A new follow up appointment has been scheduled for Trixie Morales at MyHubCares Main Clinic on Friday, November 21, 2025 at 12:00 PM.', 'appointment', 0, NULL, '2025-11-21 10:22:43'),
('0a5667df-a058-40c0-bfbf-d158505e8b0c', '44444444-4444-4444-4444-444444444444', 'New Appointment', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Clinic on Tuesday, November 25, 2025 at 01:00 PM.', 'appointment', 1, NULL, '2025-11-24 17:34:14'),
('0c1bad44-c2bd-4184-a7dc-29e74b7aee77', '44444444-4444-4444-4444-444444444444', 'New Appointment', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Clinic on Tuesday, November 25, 2025 at 10:00 AM.', 'appointment', 0, NULL, '2025-11-24 16:02:50'),
('11da1c6b-44c7-416c-ad5e-14a9b19e9353', '55555555-5555-5555-5555-555555555555', 'New Appointment', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Clinic on Tuesday, November 25, 2025 at 11:00 AM.', 'appointment', 0, NULL, '2025-11-24 17:16:36'),
('176ab6a2-d227-4d7c-80d4-bf184c94ba5f', '44444444-4444-4444-4444-444444444444', 'New Appointment', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Wednesday, November 19, 2025 at 10:00 AM.', 'appointment', 0, NULL, '2025-11-19 10:44:23'),
('185937b3-0781-4421-926e-557190ffed87', '11111111-1111-1111-1111-111111111111', 'New Appointment', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Makati Satellite on Friday, November 21, 2025 at 10:00 AM.', 'appointment', 1, NULL, '2025-11-21 10:07:39'),
('1b4f6c70-04e4-4eed-abd0-3c797d74ac14', '44444444-4444-4444-4444-444444444444', 'New Appointment', 'A new follow up appointment has been scheduled for Hanna Sarabia at MyHubCares Main Clinic on Monday, November 24, 2025 at 10:00 AM.', 'appointment', 0, NULL, '2025-11-24 15:12:06'),
('1c799e7e-4b3b-430b-bf68-dc187ae3d1b6', '55555555-5555-5555-5555-555555555555', 'New Appointment', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Makati Satellite on Friday, November 21, 2025 at 10:00 AM.', 'appointment', 0, NULL, '2025-11-21 10:07:39'),
('200c4be3-93ce-4dbd-b71e-3dcf417b727d', '55555555-5555-5555-5555-555555555555', 'New Appointment', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Wednesday, November 19, 2025 at 10:00 AM.', 'appointment', 0, NULL, '2025-11-19 10:44:23'),
('20a575ef-6caa-44a1-ac76-823e392f633d', '11111111-1111-1111-1111-111111111111', 'New Appointment', 'A new follow up appointment has been scheduled for Trixie Morales at MyHubCares Main Clinic on Friday, November 21, 2025 at 12:00 PM.', 'appointment', 1, NULL, '2025-11-21 10:22:43'),
('3fc43205-1e70-4a4e-8efe-40a7c51f5795', '44444444-4444-4444-4444-444444444444', 'New Appointment', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Makati Satellite on Friday, November 21, 2025 at 10:00 AM.', 'appointment', 0, NULL, '2025-11-21 10:07:39'),
('5f5b3ad8-825f-4141-b55e-b0744ad8f197', '11111111-1111-1111-1111-111111111111', 'New Appointment', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Clinic on Tuesday, November 25, 2025 at 01:00 PM.', 'appointment', 0, NULL, '2025-11-24 17:34:14'),
('74097028-4d84-41de-85bb-716e320271b9', '55555555-5555-5555-5555-555555555555', 'New Appointment', 'A new initial appointment has been scheduled for Jose Reyes at MyHubCares Main Clinic on Tuesday, November 25, 2025 at 10:00 AM.', 'appointment', 0, NULL, '2025-11-24 16:41:21'),
('9f6ccdaa-d53b-4bf3-80f0-e57ddc0cd925', '55555555-5555-5555-5555-555555555555', 'New Appointment', 'A new follow up appointment has been scheduled for Hanna Sarabia at MyHubCares Main Clinic on Monday, November 24, 2025 at 10:00 AM.', 'appointment', 0, NULL, '2025-11-24 15:12:06'),
('abc75fce-3005-4d90-beb0-28633cce2554', '55555555-5555-5555-5555-555555555555', 'New Appointment', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Clinic on Tuesday, November 25, 2025 at 10:00 AM.', 'appointment', 0, NULL, '2025-11-24 17:11:13'),
('ac106943-eadd-41e6-a651-73e7922344d4', '55555555-5555-5555-5555-555555555555', 'New Appointment', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Clinic on Tuesday, November 25, 2025 at 10:00 AM.', 'appointment', 0, NULL, '2025-11-24 16:02:50'),
('bf14548b-154b-4cab-819b-27181f822a65', '11111111-1111-1111-1111-111111111111', 'New Appointment', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Clinic on Tuesday, November 25, 2025 at 10:00 AM.', 'appointment', 0, NULL, '2025-11-24 17:11:13'),
('c0a9c6aa-c830-4441-9502-7a5d0b136622', '44444444-4444-4444-4444-444444444444', 'New Appointment', 'A new initial appointment has been scheduled for Jose Reyes at MyHubCares Main Clinic on Tuesday, November 25, 2025 at 10:00 AM.', 'appointment', 0, NULL, '2025-11-24 16:41:21'),
('c5baeaa9-1c14-4685-98c4-629436118e5c', '11111111-1111-1111-1111-111111111111', 'New Appointment', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Facility on Wednesday, November 19, 2025 at 10:00 AM.', 'appointment', 0, NULL, '2025-11-19 10:44:23'),
('cc915693-cc38-494a-9824-c7c6e48c46fc', '11111111-1111-1111-1111-111111111111', 'New Appointment', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Clinic on Tuesday, November 25, 2025 at 10:00 AM.', 'appointment', 0, NULL, '2025-11-24 16:02:50'),
('dd92734a-f74e-4455-9a30-319411ba4ae4', '11111111-1111-1111-1111-111111111111', 'New Appointment', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Clinic on Tuesday, November 25, 2025 at 11:00 AM.', 'appointment', 0, NULL, '2025-11-24 17:16:36'),
('e1345012-a84e-4ccd-b536-068fc13346c7', '11111111-1111-1111-1111-111111111111', 'New Appointment', 'A new follow up appointment has been scheduled for Hanna Sarabia at MyHubCares Main Clinic on Monday, November 24, 2025 at 10:00 AM.', 'appointment', 0, NULL, '2025-11-24 15:12:06'),
('e1beb412-2272-4280-8538-d9ffb7717de7', '55555555-5555-5555-5555-555555555555', 'New Appointment', 'A new follow up appointment has been scheduled for Trixie Morales at MyHubCares Main Clinic on Friday, November 21, 2025 at 12:00 PM.', 'appointment', 0, NULL, '2025-11-21 10:22:43'),
('e9c9a805-4843-4a32-9421-878ef8964fe6', '44444444-4444-4444-4444-444444444444', 'New Appointment', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Clinic on Tuesday, November 25, 2025 at 10:00 AM.', 'appointment', 0, NULL, '2025-11-24 17:11:13'),
('fd7f9e64-763e-4bd4-803d-a6c2bf59d752', '55555555-5555-5555-5555-555555555555', 'New Appointment', 'A new initial appointment has been scheduled for Hanna Sarabia at MyHubCares Main Clinic on Tuesday, November 25, 2025 at 01:00 PM.', 'appointment', 0, NULL, '2025-11-24 17:34:14');

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
('80f7668b-3d92-42d0-a75c-eb4873fcc8c4', 'EDDE0106-01-2004', NULL, 'Hanna', 'N.', 'Sarabia', NULL, '2004-06-01', 'F', 'Single', 'Filipino', 'Caloocan', 'Metro Manila', '{\"city\":\"Caloocan\",\"province\":\"Metro Manila\"}', '0966-312-2562', 'sarabia.hanna.bsinfotech@gmail.com', 'Edita Narzoles Sarabia', 'Delfin Mirano Sarabia', 1, NULL, NULL, '550e8400-e29b-41d4-a716-446655440000', NULL, NULL, 'active', '2025-11-17 16:07:51', '2025-11-17 16:07:51', '16bec9d0-6123-4428-b9a3-fea81c3592a0'),
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
('69688306-fd70-41a5-8a71-9d41d0304072', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-11-16', 'RX-20251116-0002', '2025-11-16', '2025-12-16', NULL, NULL, 'active', '2025-11-16 16:07:16'),
('8201188a-a4eb-4677-816f-08e0998056c2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-11-16', 'RX-20251116-0001', '2025-11-16', '2025-12-16', NULL, 'if symptoms persist, please contact immediately the doctor', 'active', '2025-11-16 12:55:04'),
('82f27f2c-2eaa-44de-9661-488f51d92c4b', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-11-17', 'RX-20251117-0001', '2025-11-17', '2025-12-17', NULL, NULL, 'active', '2025-11-17 16:31:30');

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
('73771305-0ea9-4194-9997-4795ac0307dd', '8201188a-a4eb-4677-816f-08e0998056c2', '9117b66c-a29f-43cc-ac78-5724222f7a38', '1 tablet', 'Once daily', 1, 'After lunch, when the stomach is full', 30),
('acb91d51-cf61-4d84-bf8e-4278c739eefe', '82f27f2c-2eaa-44de-9661-488f51d92c4b', '9117b66c-a29f-43cc-ac78-5724222f7a38', '1 tablet', 'Once Daily', 1, NULL, 30),
('e527cebd-be4e-4e8e-a51a-405c5d3ddfaa', '69688306-fd70-41a5-8a71-9d41d0304072', '65af6445-7630-4a2b-8851-d43fb66807ab', '1 tablet', 'Once', 1, 'after lunch, 1 pm', 30);

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
('4b7f8aef-abfc-42dc-beb5-580148c154a3', '062cea3c-ff0c-44a5-9879-ec40b501b375', '71045', 'Chest X-ray', 'Standard PA chest radiograph performed.', 'No acute findings.', '2025-11-16 04:49:00');

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

-- --------------------------------------------------------

--
-- Table structure for table `refill_requests`
--

CREATE TABLE `refill_requests` (
  `refill_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `medication_id` char(36) NOT NULL,
  `facility_id` char(36) NOT NULL,
  `quantity` int(11) NOT NULL,
  `pickup_date` date NOT NULL,
  `status` enum('pending','approved','ready','dispensed','declined','cancelled') DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `submitted_at` datetime DEFAULT current_timestamp(),
  `processed_at` datetime DEFAULT NULL,
  `processed_by` char(36) DEFAULT NULL,
  `remaining_pill_count` int(11) DEFAULT NULL,
  `pill_status` enum('kulang','sakto','sobra') DEFAULT NULL,
  `kulang_explanation` text DEFAULT NULL,
  `is_eligible_for_refill` tinyint(1) DEFAULT 0,
  `pills_per_day` int(11) DEFAULT 1,
  `preferred_pickup_time` time DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `refill_request_notes`
--

CREATE TABLE `refill_request_notes` (
  `note_id` char(36) NOT NULL,
  `refill_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `note_text` text NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
(1, 'National Capital Region (NCR)', 'NCR', 1, '2025-11-11 09:51:22'),
(2, 'Cordillera Administrative Region', 'CAR', 1, '2025-11-11 09:51:22'),
(3, 'Ilocos Region', 'I', 1, '2025-11-11 09:51:22'),
(4, 'Cagayan Valley', 'II', 1, '2025-11-11 09:51:22'),
(5, 'Central Luzon', 'III', 1, '2025-11-11 09:51:22'),
(6, 'CALABARZON', 'IV-A', 1, '2025-11-11 09:51:22'),
(7, 'MIMAROPA', 'IV-B', 1, '2025-11-11 09:51:22'),
(8, 'Bicol Region', 'V', 1, '2025-11-11 09:51:22'),
(9, 'Western Visayas', 'VI', 1, '2025-11-11 09:51:22'),
(10, 'Central Visayas', 'VII', 1, '2025-11-11 09:51:22');

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
('183c47d9-b77e-4f11-8e60-48fb0da1f889', 'Adherence Statistics Report', 'Standard adherence statistics and analytics report', '', '{\"type\":\"adherence\",\"standard\":true}', '{}', NULL, '11111111-1111-1111-1111-111111111111', 1, '2025-11-22 12:03:23'),
('3abccdc0-6f7f-4bef-ac22-251c142149a8', 'Patient Statistics Report', NULL, 'patient', '{\"report_key\":\"reports_page_patient_statistics\",\"report_type\":\"patient\",\"source\":\"frontend_default\"}', NULL, NULL, '11111111-1111-1111-1111-111111111111', 0, '2025-11-22 11:14:27'),
('3eafc94c-1159-42d1-9eea-cf1d8e809606', 'Appointment Statistics Report', 'Standard appointment statistics and analytics report', '', '{\"type\":\"appointment\",\"standard\":true}', '{}', NULL, '11111111-1111-1111-1111-111111111111', 1, '2025-11-22 12:03:24'),
('8b7c0f29-9fe3-4426-b38c-2879004b6d3e', 'Inventory Statistics Report', 'Standard inventory statistics and analytics report', 'inventory', '{\"type\":\"inventory\",\"standard\":true}', '{}', NULL, '11111111-1111-1111-1111-111111111111', 1, '2025-11-22 12:03:24');

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
('16a466f9-ffb8-494a-ba30-98c7c03b3d56', '3abccdc0-6f7f-4bef-ac22-251c142149a8', '2025-11-22 11:14:27', '2025-11-22 11:14:27', 'completed', '{\"triggered_from\":\"ReportsPage\",\"report_type_label\":\"Patient Statistics\",\"generated_at\":\"2025-11-22T03:14:27.926Z\"}', NULL, NULL, '11111111-1111-1111-1111-111111111111'),
('6b26e2ee-ea27-4e05-998b-9891f47f0f5a', '3abccdc0-6f7f-4bef-ac22-251c142149a8', '2025-11-22 15:01:54', '2025-11-22 15:01:54', 'completed', '{}', '{\"total_patients\":3,\"male_count\":1,\"female_count\":2}', NULL, '11111111-1111-1111-1111-111111111111'),
('716a6953-fbca-4237-ae12-35b1d363ed48', '3abccdc0-6f7f-4bef-ac22-251c142149a8', '2025-11-22 13:51:37', '2025-11-22 13:51:37', 'completed', '{}', '{\"total_patients\":3,\"male_count\":1,\"female_count\":2}', NULL, '11111111-1111-1111-1111-111111111111'),
('768fca97-684d-4409-a8f4-dca94193b91c', '3eafc94c-1159-42d1-9eea-cf1d8e809606', '2025-11-22 12:03:24', '2025-11-22 12:03:24', 'completed', '{}', '{\"total_appointments\":3,\"completed_count\":0,\"scheduled_count\":1,\"cancelled_count\":0,\"no_show_count\":0}', NULL, '11111111-1111-1111-1111-111111111111'),
('8bc18ed7-eef2-4324-8152-6b797ab3fc60', '183c47d9-b77e-4f11-8e60-48fb0da1f889', '2025-11-22 12:03:23', '2025-11-22 12:03:23', 'completed', '{}', '{\"avg_adherence\":549.995,\"total_records\":2,\"taken_count\":1,\"missed_count\":1}', NULL, '11111111-1111-1111-1111-111111111111'),
('b403baec-92bc-4fd8-b70f-2c126fb23937', '8b7c0f29-9fe3-4426-b38c-2879004b6d3e', '2025-11-22 12:03:24', '2025-11-22 12:03:24', 'completed', '{}', '{\"total_items\":4,\"total_stock\":\"1120\",\"low_stock_count\":1,\"expiring_soon_count\":0}', NULL, '11111111-1111-1111-1111-111111111111'),
('bee78826-9f90-4d94-b7e7-b8b9fedbc4b0', '3abccdc0-6f7f-4bef-ac22-251c142149a8', '2025-11-22 12:03:23', '2025-11-22 12:03:23', 'completed', '{}', '{\"total_patients\":3,\"male_count\":1,\"female_count\":2}', NULL, '11111111-1111-1111-1111-111111111111'),
('cc1fb930-078f-43bd-b65d-8460029b5efb', '3abccdc0-6f7f-4bef-ac22-251c142149a8', '2025-11-22 15:02:01', '2025-11-22 15:02:01', 'completed', '{}', '{\"total_patients\":3,\"male_count\":1,\"female_count\":2}', NULL, '11111111-1111-1111-1111-111111111111');

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
  `updated_at` datetime DEFAULT current_timestamp(),
  `updated_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
('11111111-1111-1111-1111-111111111111', 'admin', 'admin@myhubcares.com', '$2b$10$y.8OIKHZgCeiQiugZ.zG/uh2KMlKm43mW0MQD0bZhV4s83chdJEJm', 'System Administrator', 'admin', 'active', '550e8400-e29b-41d4-a716-446655440000', '+63-912-345-6789', '2025-11-27 18:41:38', 0, NULL, 0, '2025-11-16 12:16:22', '2025-11-16 12:16:22', NULL),
('16bec9d0-6123-4428-b9a3-fea81c3592a0', 'Hanapot', 'sarabia.hanna.bsinfotech@gmail.com', '$2b$10$aLwTcLHqWtUvn899h6lWXeuUXn/qWIS6YmqIn6l0fQn/Cnzm/Ofde', 'Hanna N. Sarabia', 'patient', 'active', '550e8400-e29b-41d4-a716-446655440000', '0966-312-2562', '2025-11-27 18:43:37', 0, NULL, 0, '2025-11-17 16:07:50', '2025-11-17 16:07:50', NULL),
('22222222-2222-2222-2222-222222222222', 'physician', 'physician@myhubcares.com', '$2b$10$ofhNZLH1Fz0Ifa3MXDszw.mmdF.//52oSfNwBnmAqPFugn2U4.oXy', 'Dr. Juan Dela Cruz', 'physician', 'active', '550e8400-e29b-41d4-a716-446655440000', '+63-912-345-6790', '2025-11-27 14:09:26', 0, NULL, 0, '2025-11-16 12:16:22', '2025-11-16 12:16:22', NULL),
('33333333-3333-3333-3333-333333333333', 'nurse', 'nurse@myhubcares.com', '$2b$10$BYMKMtPXH6J1jAPGZIcGN.hKRkV5jjUEePcqYnscOvdE99gpn1jn.', 'Maria Santos', 'nurse', 'active', '550e8400-e29b-41d4-a716-446655440000', '+63-912-345-6791', '2025-11-27 10:32:59', 0, NULL, 0, '2025-11-16 12:16:23', '2025-11-16 12:16:23', NULL),
('42356bf7-84ef-4aaa-9610-d74b65c3929f', 'Trixie', 'hannasarabia879@gmail.com', '$2b$10$vJRdKCkyHjJy2CbEG0oJMuZJkTzUYNONxs/YmyluIGIf9wOzJIfp.', 'Trixie Morales', 'physician', 'active', '550e8400-e29b-41d4-a716-446655440000', '09275649283', '2025-11-24 15:05:39', 0, NULL, 0, '2025-11-17 16:14:27', '2025-11-17 16:14:27', NULL),
('44444444-4444-4444-4444-444444444444', 'case_manager', 'casemanager@myhubcares.com', '$2b$10$jTwo7uslBQw3H7IIExQhy.AcOr9/WoEKbCYESggVsRnAQ2458UXD6', 'Pedro Garcia', 'case_manager', 'active', '550e8400-e29b-41d4-a716-446655440000', '+63-912-345-6792', '2025-11-27 18:49:11', 0, NULL, 0, '2025-11-16 12:16:23', '2025-11-16 12:16:23', NULL),
('55555555-5555-5555-5555-555555555555', 'lab_personnel', 'lab@myhubcares.com', '$2b$10$r9sKBgkbSVBEcyKsjhjhUupcIrmWooCUDkVokj.GVvbuRd9ZcD/uu', 'Ana Rodriguez', 'lab_personnel', 'active', '550e8400-e29b-41d4-a716-446655440000', '+63-912-345-6793', '2025-11-27 10:34:44', 0, NULL, 0, '2025-11-16 12:16:23', '2025-11-16 12:16:23', NULL),
('66666666-6666-6666-6666-666666666666', 'patient', 'patient@myhubcares.com', '$2b$10$fOHLfsU/xrmSwXWJygw3luHwaj4GO90abp.Kzcp.EPPDuBHqfeJCi', 'Jose Reyes', 'patient', 'active', '550e8400-e29b-41d4-a716-446655440000', '+63-912-345-6794', '2025-11-27 17:57:50', 0, NULL, 0, '2025-11-16 12:16:23', '2025-11-16 12:16:23', NULL);

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
('c9853565-9700-4b99-8eb3-3f85054856e5', '062cea3c-ff0c-44a5-9879-ec40b501b375', 170.00, 63.50, 21.97, 120, 80, 82, 37.8, 18, NULL, '2025-11-16 12:47:06', '22222222-2222-2222-2222-222222222222');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`appointment_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `provider_id` (`provider_id`),
  ADD KEY `facility_id` (`facility_id`),
  ADD KEY `booked_by` (`booked_by`),
  ADD KEY `cancelled_by` (`cancelled_by`);

--
-- Indexes for table `appointment_reminders`
--
ALTER TABLE `appointment_reminders`
  ADD PRIMARY KEY (`reminder_id`),
  ADD KEY `appointment_id` (`appointment_id`);

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
  ADD KEY `idx_art_regimen_drugs_regimen_id` (`regimen_id`),
  ADD KEY `idx_art_regimen_drugs_medication_id` (`medication_id`);

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
  ADD KEY `provider_id` (`provider_id`),
  ADD KEY `facility_id` (`facility_id`),
  ADD KEY `appointment_id` (`appointment_id`),
  ADD KEY `idx_availability_slots_provider_id` (`provider_id`),
  ADD KEY `idx_availability_slots_facility_id` (`facility_id`),
  ADD KEY `idx_availability_slots_date` (`slot_date`),
  ADD KEY `idx_availability_slots_status` (`slot_status`),
  ADD KEY `idx_availability_slots_appointment_id` (`appointment_id`),
  ADD KEY `idx_availability_slots_provider_date_status` (`provider_id`,`slot_date`,`slot_status`),
  ADD KEY `idx_availability_slots_facility_date` (`facility_id`,`slot_date`),
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
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `client_types`
--
ALTER TABLE `client_types`
  ADD PRIMARY KEY (`client_type_id`),
  ADD UNIQUE KEY `type_code` (`type_code`);

--
-- Indexes for table `clinical_visits`
--
ALTER TABLE `clinical_visits`
  ADD PRIMARY KEY (`visit_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `provider_id` (`provider_id`),
  ADD KEY `facility_id` (`facility_id`);

--
-- Indexes for table `counseling_sessions`
--
ALTER TABLE `counseling_sessions`
  ADD PRIMARY KEY (`session_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `counselor_id` (`counselor_id`),
  ADD KEY `facility_id` (`facility_id`);

--
-- Indexes for table `dashboard_cache`
--
ALTER TABLE `dashboard_cache`
  ADD PRIMARY KEY (`cache_id`);

--
-- Indexes for table `diagnoses`
--
ALTER TABLE `diagnoses`
  ADD PRIMARY KEY (`diagnosis_id`),
  ADD KEY `visit_id` (`visit_id`);

--
-- Indexes for table `dispense_events`
--
ALTER TABLE `dispense_events`
  ADD PRIMARY KEY (`dispense_id`),
  ADD KEY `prescription_id` (`prescription_id`),
  ADD KEY `prescription_item_id` (`prescription_item_id`),
  ADD KEY `nurse_id` (`nurse_id`),
  ADD KEY `facility_id` (`facility_id`);

--
-- Indexes for table `facilities`
--
ALTER TABLE `facilities`
  ADD PRIMARY KEY (`facility_id`);

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
  ADD KEY `facility_id` (`facility_id`);

--
-- Indexes for table `inventory_alerts`
--
ALTER TABLE `inventory_alerts`
  ADD PRIMARY KEY (`alert_id`),
  ADD KEY `idx_inventory_alerts_inventory_id` (`inventory_id`),
  ADD KEY `idx_inventory_alerts_alert_type` (`alert_type`),
  ADD KEY `idx_inventory_alerts_acknowledged` (`acknowledged`),
  ADD KEY `idx_inventory_alerts_created_at` (`created_at`),
  ADD KEY `idx_inventory_alerts_alert_level` (`alert_level`),
  ADD KEY `inventory_alerts_ibfk_2` (`acknowledged_by`);

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
  ADD KEY `idx_inventory_order_items_order_id` (`order_id`),
  ADD KEY `idx_inventory_order_items_medication_id` (`medication_id`),
  ADD KEY `idx_inventory_order_items_status` (`status`);

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
  ADD KEY `idx_inventory_transactions_inventory_id` (`inventory_id`),
  ADD KEY `idx_inventory_transactions_transaction_type` (`transaction_type`),
  ADD KEY `idx_inventory_transactions_transaction_date` (`transaction_date`),
  ADD KEY `idx_inventory_transactions_facility_id` (`facility_id`),
  ADD KEY `idx_inventory_transactions_performed_by` (`performed_by`);

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
  ADD KEY `result_id` (`result_id`),
  ADD KEY `uploaded_by` (`uploaded_by`);

--
-- Indexes for table `lab_orders`
--
ALTER TABLE `lab_orders`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `ordering_provider_id` (`ordering_provider_id`),
  ADD KEY `facility_id` (`facility_id`);

--
-- Indexes for table `lab_results`
--
ALTER TABLE `lab_results`
  ADD PRIMARY KEY (`result_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `reviewer_id` (`reviewer_id`),
  ADD KEY `created_by` (`created_by`);

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
  ADD KEY `prescription_id` (`prescription_id`),
  ADD KEY `patient_id` (`patient_id`);

--
-- Indexes for table `medication_dispensing`
--
ALTER TABLE `medication_dispensing`
  ADD PRIMARY KEY (`dispensing_id`),
  ADD KEY `refill_id` (`refill_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `medication_id` (`medication_id`),
  ADD KEY `facility_id` (`facility_id`),
  ADD KEY `dispenser_id` (`dispenser_id`);

--
-- Indexes for table `medication_inventory`
--
ALTER TABLE `medication_inventory`
  ADD PRIMARY KEY (`inventory_id`),
  ADD KEY `medication_id` (`medication_id`),
  ADD KEY `facility_id` (`facility_id`),
  ADD KEY `idx_inventory_medication_id` (`medication_id`),
  ADD KEY `idx_inventory_facility_id` (`facility_id`),
  ADD KEY `idx_inventory_expiry_date` (`expiry_date`),
  ADD KEY `idx_inventory_batch_number` (`batch_number`);

--
-- Indexes for table `medication_reminders`
--
ALTER TABLE `medication_reminders`
  ADD PRIMARY KEY (`reminder_id`),
  ADD KEY `prescription_id` (`prescription_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `idx_medication_reminders_active` (`active`),
  ADD KEY `idx_medication_reminders_reminder_time` (`reminder_time`),
  ADD KEY `idx_medication_reminders_patient_active` (`patient_id`,`active`),
  ADD KEY `idx_medication_reminders_last_triggered` (`last_triggered_at`);

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
  ADD UNIQUE KEY `prescription_number` (`prescription_number`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `prescriber_id` (`prescriber_id`),
  ADD KEY `facility_id` (`facility_id`);

--
-- Indexes for table `prescription_items`
--
ALTER TABLE `prescription_items`
  ADD PRIMARY KEY (`prescription_item_id`),
  ADD KEY `prescription_id` (`prescription_id`),
  ADD KEY `medication_id` (`medication_id`);

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
  ADD KEY `accepted_by` (`accepted_by`);

--
-- Indexes for table `refill_requests`
--
ALTER TABLE `refill_requests`
  ADD PRIMARY KEY (`refill_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `medication_id` (`medication_id`),
  ADD KEY `facility_id` (`facility_id`),
  ADD KEY `idx_refill_requests_status` (`status`),
  ADD KEY `idx_refill_requests_pickup_date` (`pickup_date`);

--
-- Indexes for table `refill_request_notes`
--
ALTER TABLE `refill_request_notes`
  ADD PRIMARY KEY (`note_id`),
  ADD KEY `refill_id` (`refill_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `regions`
--
ALTER TABLE `regions`
  ADD PRIMARY KEY (`region_id`),
  ADD UNIQUE KEY `region_code` (`region_code`);

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
  ADD KEY `owner_id` (`owner_id`);

--
-- Indexes for table `report_runs`
--
ALTER TABLE `report_runs`
  ADD PRIMARY KEY (`run_id`),
  ADD KEY `report_id` (`report_id`),
  ADD KEY `run_by` (`run_by`);

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
  ADD KEY `updated_by` (`updated_by`);

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
  ADD UNIQUE KEY `uq_user_facility_primary` (`user_id`,`facility_id`,`is_primary`),
  ADD KEY `facility_id` (`facility_id`),
  ADD KEY `assigned_by` (`assigned_by`);

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
-- AUTO_INCREMENT for table `learning_modules`
--
ALTER TABLE `learning_modules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`),
  ADD CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`provider_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `appointments_ibfk_3` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`),
  ADD CONSTRAINT `appointments_ibfk_4` FOREIGN KEY (`booked_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `appointments_ibfk_5` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `art_regimen_drugs`
--
ALTER TABLE `art_regimen_drugs`
  ADD CONSTRAINT `art_regimen_drugs_ibfk_1` FOREIGN KEY (`regimen_id`) REFERENCES `patient_art_regimens` (`regimen_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `art_regimen_drugs_ibfk_2` FOREIGN KEY (`medication_id`) REFERENCES `medications` (`medication_id`);

--
-- Constraints for table `art_regimen_history`
--
ALTER TABLE `art_regimen_history`
  ADD CONSTRAINT `art_regimen_history_ibfk_1` FOREIGN KEY (`regimen_id`) REFERENCES `patient_art_regimens` (`regimen_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `art_regimen_history_ibfk_2` FOREIGN KEY (`performed_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `inventory_alerts`
--
ALTER TABLE `inventory_alerts`
  ADD CONSTRAINT `inventory_alerts_ibfk_1` FOREIGN KEY (`inventory_id`) REFERENCES `medication_inventory` (`inventory_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inventory_alerts_ibfk_2` FOREIGN KEY (`acknowledged_by`) REFERENCES `users` (`user_id`);

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
  ADD CONSTRAINT `inventory_order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `inventory_orders` (`order_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inventory_order_items_ibfk_2` FOREIGN KEY (`medication_id`) REFERENCES `medications` (`medication_id`);

--
-- Constraints for table `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  ADD CONSTRAINT `inventory_transactions_ibfk_1` FOREIGN KEY (`inventory_id`) REFERENCES `medication_inventory` (`inventory_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inventory_transactions_ibfk_2` FOREIGN KEY (`performed_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `inventory_transactions_ibfk_3` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`);

--
-- Constraints for table `learning_modules`
--
ALTER TABLE `learning_modules`
  ADD CONSTRAINT `learning_modules_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `medication_dispensing`
--
ALTER TABLE `medication_dispensing`
  ADD CONSTRAINT `fk_medication_dispensing_dispenser` FOREIGN KEY (`dispenser_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `fk_medication_dispensing_facility` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`),
  ADD CONSTRAINT `fk_medication_dispensing_medication` FOREIGN KEY (`medication_id`) REFERENCES `medications` (`medication_id`),
  ADD CONSTRAINT `fk_medication_dispensing_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`),
  ADD CONSTRAINT `fk_medication_dispensing_refill` FOREIGN KEY (`refill_id`) REFERENCES `refill_requests` (`refill_id`);

--
-- Constraints for table `medication_reminders`
--
ALTER TABLE `medication_reminders`
  ADD CONSTRAINT `fk_medication_reminders_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_medication_reminders_prescription` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`prescription_id`) ON DELETE SET NULL;

--
-- Constraints for table `patient_art_regimens`
--
ALTER TABLE `patient_art_regimens`
  ADD CONSTRAINT `patient_art_regimens_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `patient_art_regimens_ibfk_2` FOREIGN KEY (`provider_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `patient_art_regimens_ibfk_3` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`);

--
-- Constraints for table `refill_requests`
--
ALTER TABLE `refill_requests`
  ADD CONSTRAINT `fk_refill_requests_facility` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`),
  ADD CONSTRAINT `fk_refill_requests_medication` FOREIGN KEY (`medication_id`) REFERENCES `medications` (`medication_id`),
  ADD CONSTRAINT `fk_refill_requests_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`);

--
-- Constraints for table `refill_request_notes`
--
ALTER TABLE `refill_request_notes`
  ADD CONSTRAINT `fk_refill_request_notes_refill` FOREIGN KEY (`refill_id`) REFERENCES `refill_requests` (`refill_id`),
  ADD CONSTRAINT `fk_refill_request_notes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

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
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
