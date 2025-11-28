-- =====================================================
-- MODULE 4: MEDICATION MANAGEMENT - DUMMY DATA SCRIPT
-- =====================================================
-- This script drops existing Module 4 data and inserts
-- comprehensive dummy data based on existing users/patients
-- =====================================================

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- STEP 1: DELETE EXISTING MODULE 4 DATA
-- (In reverse dependency order)
-- =====================================================

DELETE FROM `dispense_events`;
DELETE FROM `medication_adherence`;
DELETE FROM `medication_reminders`;
DELETE FROM `refill_requests`;
DELETE FROM `prescription_items`;
DELETE FROM `prescriptions`;
DELETE FROM `medication_inventory`;

-- Delete specific medications that we'll be inserting (if they exist)
DELETE FROM `medications` WHERE `medication_id` IN (
  'med-0001-0000-0000-000000000001',
  'med-0002-0000-0000-000000000002',
  'med-0003-0000-0000-000000000003',
  'med-0004-0000-0000-000000000004',
  'med-0005-0000-0000-000000000005',
  'med-0006-0000-0000-000000000006',
  'med-0007-0000-0000-000000000007',
  'med-0008-0000-0000-000000000008'
);

-- =====================================================
-- STEP 2: INSERT DUMMY MEDICATIONS
-- =====================================================

INSERT INTO `medications` (`medication_id`, `medication_name`, `generic_name`, `form`, `strength`, `atc_code`, `is_art`, `is_controlled`, `active`) VALUES
-- ART Medications
('med-0001-0000-0000-000000000001', 'Tenofovir/Lamivudine/Dolutegravir (TLD)', 'TLD', 'tablet', '300/300/50mg', 'J05AR20', 1, 1, 1),
('med-0002-0000-0000-000000000002', 'Efavirenz 600mg', 'Efavirenz', 'tablet', '600mg', 'J05AG03', 1, 1, 1),
('med-0003-0000-0000-000000000003', 'Atazanavir/Ritonavir', 'ATV/r', 'capsule', '300/100mg', 'J05AE08', 1, 1, 1),
('med-0004-0000-0000-000000000004', 'Abacavir/Lamivudine', 'ABC/3TC', 'tablet', '600/300mg', 'J05AR06', 1, 1, 1),
-- Non-ART Medications
('med-0005-0000-0000-000000000005', 'Paracetamol 500mg', 'Acetaminophen', 'tablet', '500mg', 'N02BE01', 0, 0, 1),
('med-0006-0000-0000-000000000006', 'Amoxicillin 500mg', 'Amoxicillin', 'capsule', '500mg', 'J01CA04', 0, 0, 1),
('med-0007-0000-0000-000000000007', 'Metformin 500mg', 'Metformin', 'tablet', '500mg', 'A10BA02', 0, 0, 1),
('med-0008-0000-0000-000000000008', 'Ibuprofen 400mg', 'Ibuprofen', 'tablet', '400mg', 'M01AE01', 0, 0, 1);

-- =====================================================
-- STEP 3: INSERT MEDICATION INVENTORY
-- =====================================================

-- Delete existing inventory items we'll be inserting
DELETE FROM `medication_inventory` WHERE `inventory_id` IN (
  'inv-0001-0000-0000-000000000001',
  'inv-0002-0000-0000-000000000002',
  'inv-0003-0000-0000-000000000003',
  'inv-0004-0000-0000-000000000004',
  'inv-0005-0000-0000-000000000005',
  'inv-0006-0000-0000-000000000006',
  'inv-0007-0000-0000-000000000007',
  'inv-0008-0000-0000-000000000008'
);

INSERT INTO `medication_inventory` (`inventory_id`, `medication_id`, `facility_id`, `batch_number`, `quantity_on_hand`, `unit`, `expiry_date`, `reorder_level`, `last_restocked`, `supplier`, `cost_per_unit`, `created_at`) VALUES
-- Main Facility Inventory
('inv-0001-0000-0000-000000000001', 'med-0001-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 'TLD-2025-001', 500, 'tablets', '2027-12-31', 100, '2025-11-15', 'MyHubCares Pharmacy', 15.50, '2025-11-15 10:00:00'),
('inv-0002-0000-0000-000000000002', 'med-0002-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440000', 'EFV-2025-001', 300, 'tablets', '2027-11-30', 50, '2025-11-16', 'MyHubCares Pharmacy', 12.00, '2025-11-16 10:00:00'),
('inv-0003-0000-0000-000000000003', 'med-0003-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440000', 'ATV-2025-001', 200, 'capsules', '2027-10-15', 50, '2025-11-10', 'MyHubCares Pharmacy', 18.75, '2025-11-10 10:00:00'),
('inv-0004-0000-0000-000000000004', 'med-0005-0000-0000-000000000005', '550e8400-e29b-41d4-a716-446655440000', 'PAR-2025-001', 1000, 'tablets', '2026-06-30', 200, '2025-11-20', 'MyHubCares Pharmacy', 2.50, '2025-11-20 10:00:00'),
-- Main Clinic Inventory
('inv-0005-0000-0000-000000000005', 'med-0001-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440001', 'TLD-2025-002', 400, 'tablets', '2027-12-31', 100, '2025-11-18', 'MyHubCares Pharmacy', 15.50, '2025-11-18 10:00:00'),
('inv-0006-0000-0000-000000000006', 'med-0002-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440001', 'EFV-2025-002', 250, 'tablets', '2027-11-30', 50, '2025-11-19', 'MyHubCares Pharmacy', 12.00, '2025-11-19 10:00:00'),
-- Quezon City Branch Inventory (Low stock for testing)
('inv-0007-0000-0000-000000000007', 'med-0001-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440002', 'TLD-2025-003', 80, 'tablets', '2027-12-31', 100, '2025-11-12', 'MyHubCares Pharmacy', 15.50, '2025-11-12 10:00:00'),
('inv-0008-0000-0000-000000000008', 'med-0002-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440002', 'EFV-2025-003', 45, 'tablets', '2027-11-30', 50, '2025-11-14', 'MyHubCares Pharmacy', 12.00, '2025-11-14 10:00:00');

-- =====================================================
-- STEP 4: INSERT PRESCRIPTIONS
-- =====================================================

-- Delete existing prescriptions we'll be inserting
DELETE FROM `prescriptions` WHERE `prescription_id` IN (
  'rx-0001-0000-0000-000000000001',
  'rx-0002-0000-0000-000000000002',
  'rx-0003-0000-0000-000000000003',
  'rx-0004-0000-0000-000000000004',
  'rx-0005-0000-0000-000000000005',
  'rx-0006-0000-0000-000000000006'
);

INSERT INTO `prescriptions` (`prescription_id`, `patient_id`, `prescriber_id`, `facility_id`, `prescription_date`, `prescription_number`, `start_date`, `end_date`, `duration_days`, `notes`, `status`, `created_at`) VALUES
-- Active prescriptions for Jose Reyes (patient: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa)
('rx-0001-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-11-20', 'RX-20251120-0001', '2025-11-20', '2026-11-20', 365, 'Long-term ART regimen. Monitor for side effects.', 'active', '2025-11-20 09:00:00'),
('rx-0002-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-11-25', 'RX-20251125-0001', '2025-11-25', '2025-12-25', 30, 'Short-term medication for infection.', 'active', '2025-11-25 10:00:00'),
-- Active prescriptions for Hanna Sarabia (patient: 80f7668b-3d92-42d0-a75c-eb4873fcc8c4)
('rx-0003-0000-0000-000000000003', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-11-22', 'RX-20251122-0001', '2025-11-22', '2026-11-22', 365, 'ART initiation. Follow-up in 2 weeks.', 'active', '2025-11-22 11:00:00'),
('rx-0004-0000-0000-000000000004', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '42356bf7-84ef-4aaa-9610-d74b65c3929f', '550e8400-e29b-41d4-a716-446655440000', '2025-11-28', 'RX-20251128-0001', '2025-11-28', '2025-12-28', 30, 'Pain management medication.', 'active', '2025-11-28 14:00:00'),
-- Completed prescription
('rx-0005-0000-0000-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-10-15', 'RX-20251015-0001', '2025-10-15', '2025-11-15', 30, 'Completed course of antibiotics.', 'completed', '2025-10-15 09:00:00'),
-- Cancelled prescription
('rx-0006-0000-0000-000000000006', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', '2025-11-10', 'RX-20251110-0001', '2025-11-10', '2025-12-10', 30, 'Cancelled due to patient allergy.', 'cancelled', '2025-11-10 10:00:00');

-- =====================================================
-- STEP 5: INSERT PRESCRIPTION ITEMS
-- =====================================================

-- Delete existing prescription items we'll be inserting
DELETE FROM `prescription_items` WHERE `prescription_item_id` IN (
  'pi-0001-0000-0000-000000000001',
  'pi-0002-0000-0000-000000000002',
  'pi-0003-0000-0000-000000000003',
  'pi-0004-0000-0000-000000000004',
  'pi-0005-0000-0000-000000000005',
  'pi-0006-0000-0000-000000000006'
);

INSERT INTO `prescription_items` (`prescription_item_id`, `prescription_id`, `medication_id`, `dosage`, `frequency`, `quantity`, `instructions`, `duration_days`) VALUES
-- Prescription 1: TLD for Jose Reyes
('pi-0001-0000-0000-000000000001', 'rx-0001-0000-0000-000000000001', 'med-0001-0000-0000-000000000001', '1 tablet', 'Once daily', 365, 'Take with food. Do not skip doses.', 365),
-- Prescription 2: Amoxicillin for Jose Reyes
('pi-0002-0000-0000-000000000002', 'rx-0002-0000-0000-000000000002', 'med-0006-0000-0000-000000000006', '1 capsule', 'Three times daily', 90, 'Take with meals to reduce stomach upset.', 30),
-- Prescription 3: TLD for Hanna Sarabia
('pi-0003-0000-0000-000000000003', 'rx-0003-0000-0000-000000000003', 'med-0001-0000-0000-000000000001', '1 tablet', 'Once daily', 365, 'Take with food. Important: Do not miss doses.', 365),
-- Prescription 4: Paracetamol for Hanna Sarabia
('pi-0004-0000-0000-000000000004', 'rx-0004-0000-0000-000000000004', 'med-0005-0000-0000-000000000005', '1 tablet', 'As needed (max 4 per day)', 30, 'Take for pain or fever. Do not exceed 4 tablets per day.', 30),
-- Prescription 5: Completed - Amoxicillin
('pi-0005-0000-0000-000000000005', 'rx-0005-0000-0000-000000000005', 'med-0006-0000-0000-000000000006', '1 capsule', 'Three times daily', 90, 'Complete full course even if feeling better.', 30),
-- Prescription 6: Cancelled - Ibuprofen
('pi-0006-0000-0000-000000000006', 'rx-0006-0000-0000-000000000006', 'med-0008-0000-0000-000000000008', '1 tablet', 'Twice daily', 60, 'Take with food.', 30);

-- =====================================================
-- STEP 6: INSERT DISPENSE EVENTS
-- =====================================================

-- Delete existing dispense events we'll be inserting
DELETE FROM `dispense_events` WHERE `dispense_id` IN (
  'de-0001-0000-0000-000000000001',
  'de-0002-0000-0000-000000000002',
  'de-0003-0000-0000-000000000003',
  'de-0004-0000-0000-000000000004',
  'de-0005-0000-0000-000000000005'
);

INSERT INTO `dispense_events` (`dispense_id`, `prescription_id`, `prescription_item_id`, `nurse_id`, `facility_id`, `dispensed_date`, `quantity_dispensed`, `batch_number`, `notes`, `created_at`) VALUES
-- Dispensing for Jose Reyes - TLD (30-day supply)
('de-0001-0000-0000-000000000001', 'rx-0001-0000-0000-000000000001', 'pi-0001-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000', '2025-11-20', 30, 'TLD-2025-001', 'Initial 30-day supply dispensed.', '2025-11-20 10:00:00'),
-- Dispensing for Jose Reyes - Amoxicillin
('de-0002-0000-0000-000000000002', 'rx-0002-0000-0000-000000000002', 'pi-0002-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000', '2025-11-25', 90, 'AMX-2025-001', 'Full course dispensed.', '2025-11-25 11:00:00'),
-- Dispensing for Hanna Sarabia - TLD (30-day supply)
('de-0003-0000-0000-000000000003', 'rx-0003-0000-0000-000000000003', 'pi-0003-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000', '2025-11-22', 30, 'TLD-2025-001', 'ART initiation - first supply.', '2025-11-22 12:00:00'),
-- Dispensing for Hanna Sarabia - Paracetamol
('de-0004-0000-0000-000000000004', 'rx-0004-0000-0000-000000000004', 'pi-0004-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000', '2025-11-28', 30, 'PAR-2025-001', 'Pain management supply.', '2025-11-28 15:00:00'),
-- Refill for Jose Reyes - TLD (another 30-day supply)
('de-0005-0000-0000-000000000005', 'rx-0001-0000-0000-000000000001', 'pi-0001-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000', '2025-12-20', 30, 'TLD-2025-001', 'Monthly refill.', '2025-12-20 10:00:00');

-- =====================================================
-- STEP 7: INSERT MEDICATION REMINDERS
-- =====================================================

-- Delete existing medication reminders we'll be inserting
DELETE FROM `medication_reminders` WHERE `reminder_id` IN (
  'mr-0001-0000-0000-000000000001',
  'mr-0002-0000-0000-000000000002',
  'mr-0003-0000-0000-000000000003',
  'mr-0004-0000-0000-000000000004'
);

INSERT INTO `medication_reminders` (`reminder_id`, `prescription_id`, `patient_id`, `medication_name`, `dosage`, `frequency`, `reminder_time`, `sound_preference`, `browser_notifications`, `special_instructions`, `active`, `missed_doses`, `created_at`, `updated_at`, `last_triggered_at`, `last_acknowledged_at`, `acknowledgment_count`) VALUES
-- Reminder for Jose Reyes - TLD
('mr-0001-0000-0000-000000000001', 'rx-0001-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Tenofovir/Lamivudine/Dolutegravir (TLD)', '1 tablet', 'Once daily', '09:00:00', 'default', 1, 'Take with breakfast. Do not skip.', 1, 2, '2025-11-20 10:00:00', '2025-11-28 09:00:00', '2025-11-28 09:00:00', '2025-11-28 09:15:00', 25),
-- Reminder for Jose Reyes - Amoxicillin
('mr-0002-0000-0000-000000000002', 'rx-0002-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Amoxicillin 500mg', '1 capsule', 'Three times daily', '08:00:00', 'gentle', 1, 'Take with meals: breakfast, lunch, dinner.', 1, 0, '2025-11-25 11:00:00', '2025-11-28 08:00:00', '2025-11-28 08:00:00', '2025-11-28 08:05:00', 12),
-- Reminder for Hanna Sarabia - TLD
('mr-0003-0000-0000-000000000003', 'rx-0003-0000-0000-000000000003', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', 'Tenofovir/Lamivudine/Dolutegravir (TLD)', '1 tablet', 'Once daily', '20:00:00', 'urgent', 1, 'Take with dinner. Critical medication - do not miss!', 1, 1, '2025-11-22 12:00:00', '2025-11-28 20:00:00', '2025-11-28 20:00:00', '2025-11-28 20:10:00', 6),
-- Reminder for Hanna Sarabia - Paracetamol (as needed)
('mr-0004-0000-0000-000000000004', 'rx-0004-0000-0000-000000000004', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', 'Paracetamol 500mg', '1 tablet', 'As needed', '12:00:00', 'default', 1, 'Take only when experiencing pain or fever.', 1, 0, '2025-11-28 15:00:00', '2025-11-28 15:00:00', NULL, NULL, 0);

-- =====================================================
-- STEP 8: INSERT MEDICATION ADHERENCE RECORDS
-- =====================================================

-- Delete existing medication adherence records we'll be inserting
DELETE FROM `medication_adherence` WHERE `adherence_id` IN (
  'ma-0001-0000-0000-000000000001',
  'ma-0002-0000-0000-000000000002',
  'ma-0003-0000-0000-000000000003',
  'ma-0004-0000-0000-000000000004',
  'ma-0005-0000-0000-000000000005',
  'ma-0006-0000-0000-000000000006',
  'ma-0007-0000-0000-000000000007',
  'ma-0008-0000-0000-000000000008',
  'ma-0009-0000-0000-000000000009',
  'ma-0010-0000-0000-000000000010',
  'ma-0011-0000-0000-000000000011',
  'ma-0012-0000-0000-000000000012',
  'ma-0013-0000-0000-000000000013'
);

INSERT INTO `medication_adherence` (`adherence_id`, `prescription_id`, `patient_id`, `adherence_date`, `taken`, `missed_reason`, `adherence_percentage`, `recorded_at`) VALUES
-- Jose Reyes - TLD adherence (last 7 days)
('ma-0001-0000-0000-000000000001', 'rx-0001-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2025-11-22', 1, NULL, 95.00, '2025-11-22 09:30:00'),
('ma-0002-0000-0000-000000000002', 'rx-0001-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2025-11-23', 1, NULL, 95.00, '2025-11-23 09:30:00'),
('ma-0003-0000-0000-000000000003', 'rx-0001-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2025-11-24', 0, 'Forgot to take medication', 93.33, '2025-11-24 10:00:00'),
('ma-0004-0000-0000-000000000004', 'rx-0001-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2025-11-25', 1, NULL, 94.00, '2025-11-25 09:30:00'),
('ma-0005-0000-0000-000000000005', 'rx-0001-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2025-11-26', 1, NULL, 94.50, '2025-11-26 09:30:00'),
('ma-0006-0000-0000-000000000006', 'rx-0001-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2025-11-27', 0, 'Ran out of medication', 92.86, '2025-11-27 10:00:00'),
('ma-0007-0000-0000-000000000007', 'rx-0001-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2025-11-28', 1, NULL, 93.33, '2025-11-28 09:30:00'),
-- Hanna Sarabia - TLD adherence (last 6 days)
('ma-0008-0000-0000-000000000008', 'rx-0003-0000-0000-000000000003', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '2025-11-23', 1, NULL, 100.00, '2025-11-23 20:30:00'),
('ma-0009-0000-0000-000000000009', 'rx-0003-0000-0000-000000000003', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '2025-11-24', 1, NULL, 100.00, '2025-11-24 20:30:00'),
('ma-0010-0000-0000-000000000010', 'rx-0003-0000-0000-000000000003', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '2025-11-25', 1, NULL, 100.00, '2025-11-25 20:30:00'),
('ma-0011-0000-0000-000000000011', 'rx-0003-0000-0000-000000000003', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '2025-11-26', 1, NULL, 100.00, '2025-11-26 20:30:00'),
('ma-0012-0000-0000-000000000012', 'rx-0003-0000-0000-000000000003', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '2025-11-27', 1, NULL, 100.00, '2025-11-27 20:30:00'),
('ma-0013-0000-0000-000000000013', 'rx-0003-0000-0000-000000000003', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', '2025-11-28', 0, 'Forgot to take', 98.33, '2025-11-28 21:00:00');

-- =====================================================
-- STEP 9: INSERT REFILL REQUESTS
-- =====================================================
-- NOTE: Run migration_refill_requests_safe.sql FIRST before running this script
-- =====================================================

-- Delete existing refill requests we'll be inserting
DELETE FROM `refill_requests` WHERE `refill_id` IN (
  'rr-0001-0000-0000-000000000001',
  'rr-0002-0000-0000-000000000002',
  'rr-0003-0000-0000-000000000003',
  'rr-0004-0000-0000-000000000004',
  'rr-0005-0000-0000-000000000005',
  'rr-0006-0000-0000-000000000006'
);

-- Build INSERT statement dynamically based on available columns
-- First, let's insert with only the columns that definitely exist
INSERT INTO `refill_requests` (
  `refill_id`, `patient_id`, `medication_id`, `facility_id`, `quantity`, `pickup_date`, 
  `preferred_pickup_time`, `status`, `notes`, `submitted_at`, `processed_at`, `processed_by`,
  `remaining_pill_count`, `pill_status`, `kulang_explanation`, `is_eligible_for_refill`, 
  `pills_per_day`
) VALUES
-- Pending refill request - Jose Reyes (eligible: 8 pills remaining)
('rr-0001-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'med-0001-0000-0000-000000000001',
  '550e8400-e29b-41d4-a716-446655440000', 30, '2025-12-01', '09:00:00', 'pending',
  'Need refill soon. Running low on medication.', '2025-11-28 08:00:00', NULL, NULL,
  8, 'kulang', 'Used more than expected due to missed doses earlier in the month', 1, 1),

-- Approved refill request - Hanna Sarabia (eligible: 5 pills remaining)
('rr-0002-0000-0000-000000000002', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', 'med-0001-0000-0000-000000000001',
  '550e8400-e29b-41d4-a716-446655440000', 30, '2025-12-02', '14:00:00', 'approved',
  'Regular monthly refill request.', '2025-11-27 10:00:00', '2025-11-27 14:30:00', '44444444-4444-4444-4444-444444444444',
  5, 'sakto', NULL, 1, 1),

-- Ready for pickup - Jose Reyes (approved and ready)
('rr-0003-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'med-0002-0000-0000-000000000002',
  '550e8400-e29b-41d4-a716-446655440000', 30, '2025-11-30', '10:00:00', 'ready',
  'Backup medication refill.', '2025-11-26 09:00:00', '2025-11-26 11:00:00', '44444444-4444-4444-4444-444444444444',
  10, 'sakto', NULL, 1, 1),

-- Dispensed refill request - Hanna Sarabia
('rr-0004-0000-0000-000000000004', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', 'med-0005-0000-0000-000000000005',
  '550e8400-e29b-41d4-a716-446655440000', 30, '2025-11-25', '11:00:00', 'dispensed',
  'Pain medication refill.', '2025-11-24 08:00:00', '2025-11-24 10:00:00', '44444444-4444-4444-4444-444444444444',
  2, 'kulang', 'Used more due to persistent pain', 1, 1),

-- Declined refill request - Jose Reyes (not eligible: 25 pills remaining)
('rr-0005-0000-0000-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'med-0006-0000-0000-000000000006',
  '550e8400-e29b-41d4-a716-446655440000', 90, '2025-12-05', '15:00:00', 'declined',
  'Requested refill too early.', '2025-11-25 15:00:00', '2025-11-25 16:00:00', '44444444-4444-4444-4444-444444444444',
  25, 'sobra', NULL, 0, 3),

-- Cancelled refill request - Hanna Sarabia
('rr-0006-0000-0000-000000000006', '80f7668b-3d92-42d0-a75c-eb4873fcc8c4', 'med-0008-0000-0000-000000000008',
  '550e8400-e29b-41d4-a716-446655440000', 20, '2025-12-03', '13:00:00', 'cancelled',
  'Patient cancelled - found alternative medication.', '2025-11-27 11:00:00', NULL, NULL,
  15, 'sakto', NULL, 0, 2);

-- =====================================================
-- STEP 9b: UPDATE REFILL REQUESTS WITH NEW FIELDS (if migration was run)
-- =====================================================
-- This section updates the refill requests with additional fields
-- that are only available after running the migration script
-- =====================================================

-- Update with prescription_id, medication_name, unit, and other new fields
-- Only run this AFTER migration_refill_requests_safe.sql has been executed

UPDATE `refill_requests` SET
  `prescription_id` = CASE 
    WHEN `refill_id` = 'rr-0001-0000-0000-000000000001' THEN 'rx-0001-0000-0000-000000000001'
    WHEN `refill_id` = 'rr-0002-0000-0000-000000000002' THEN 'rx-0003-0000-0000-000000000003'
    WHEN `refill_id` = 'rr-0004-0000-0000-000000000004' THEN 'rx-0004-0000-0000-000000000004'
    WHEN `refill_id` = 'rr-0005-0000-0000-000000000005' THEN 'rx-0002-0000-0000-000000000002'
    ELSE NULL
  END,
  `medication_name` = CASE
    WHEN `medication_id` = 'med-0001-0000-0000-000000000001' THEN 'Tenofovir/Lamivudine/Dolutegravir (TLD)'
    WHEN `medication_id` = 'med-0002-0000-0000-000000000002' THEN 'Efavirenz 600mg'
    WHEN `medication_id` = 'med-0005-0000-0000-000000000005' THEN 'Paracetamol 500mg'
    WHEN `medication_id` = 'med-0006-0000-0000-000000000006' THEN 'Amoxicillin 500mg'
    WHEN `medication_id` = 'med-0008-0000-0000-000000000008' THEN 'Ibuprofen 400mg'
    ELSE NULL
  END,
  `unit` = CASE
    WHEN `medication_id` IN ('med-0001-0000-0000-000000000001', 'med-0002-0000-0000-000000000002', 'med-0005-0000-0000-000000000005', 'med-0008-0000-0000-000000000008') THEN 'tablets'
    WHEN `medication_id` = 'med-0006-0000-0000-000000000006' THEN 'capsules'
    ELSE 'tablets'
  END,
  `review_notes` = CASE
    WHEN `refill_id` = 'rr-0002-0000-0000-000000000002' THEN 'Approved for monthly refill. Patient has good adherence.'
    WHEN `refill_id` = 'rr-0003-0000-0000-000000000003' THEN 'Approved and ready for pickup.'
    WHEN `refill_id` = 'rr-0004-0000-0000-000000000004' THEN 'Dispensed as requested.'
    WHEN `refill_id` = 'rr-0005-0000-0000-000000000005' THEN 'Patient has sufficient medication remaining.'
    ELSE NULL
  END,
  `decline_reason` = CASE
    WHEN `refill_id` = 'rr-0005-0000-0000-000000000005' THEN 'Patient has 25 pills remaining, which is more than the 10-pill threshold. Refill not needed at this time.'
    ELSE NULL
  END,
  `approved_quantity` = CASE
    WHEN `refill_id` IN ('rr-0002-0000-0000-000000000002', 'rr-0003-0000-0000-000000000003', 'rr-0004-0000-0000-000000000004') THEN `quantity`
    ELSE NULL
  END,
  `ready_for_pickup_date` = CASE
    WHEN `refill_id` = 'rr-0002-0000-0000-000000000002' THEN '2025-12-02'
    WHEN `refill_id` = 'rr-0003-0000-0000-000000000003' THEN '2025-11-30'
    WHEN `refill_id` = 'rr-0004-0000-0000-000000000004' THEN '2025-11-25'
    ELSE NULL
  END,
  `dispensed_by` = CASE
    WHEN `refill_id` = 'rr-0004-0000-0000-000000000004' THEN '33333333-3333-3333-3333-333333333333'
    ELSE NULL
  END,
  `dispensed_at` = CASE
    WHEN `refill_id` = 'rr-0004-0000-0000-000000000004' THEN '2025-11-25 11:15:00'
    ELSE NULL
  END,
  `created_by` = CASE
    WHEN `patient_id` = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' THEN 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    WHEN `patient_id` = '80f7668b-3d92-42d0-a75c-eb4873fcc8c4' THEN '80f7668b-3d92-42d0-a75c-eb4873fcc8c4'
    ELSE `patient_id`
  END,
  `updated_at` = `submitted_at`
WHERE `refill_id` IN (
  'rr-0001-0000-0000-000000000001',
  'rr-0002-0000-0000-000000000002',
  'rr-0003-0000-0000-000000000003',
  'rr-0004-0000-0000-000000000004',
  'rr-0005-0000-0000-000000000005',
  'rr-0006-0000-0000-000000000006'
);

-- =====================================================
-- RE-ENABLE FOREIGN KEY CHECKS
-- =====================================================

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- VERIFICATION QUERIES (Optional - uncomment to run)
-- =====================================================

-- SELECT COUNT(*) as medication_count FROM medications;
-- SELECT COUNT(*) as inventory_count FROM medication_inventory;
-- SELECT COUNT(*) as prescription_count FROM prescriptions;
-- SELECT COUNT(*) as prescription_item_count FROM prescription_items;
-- SELECT COUNT(*) as dispense_count FROM dispense_events;
-- SELECT COUNT(*) as reminder_count FROM medication_reminders;
-- SELECT COUNT(*) as adherence_count FROM medication_adherence;
-- SELECT COUNT(*) as refill_request_count FROM refill_requests;

-- =====================================================
-- END OF SCRIPT
-- =====================================================


