-- =====================================================
-- MODULE 3: CLINICAL CARE - Database Only
-- =====================================================
-- This file contains ONLY Module 3 database tables:
--   - clinical_visits
--   - vital_signs
--   - diagnoses
--   - procedures
--
-- Includes: DROP, CREATE, INSERT, and INDEX statements
-- =====================================================

-- =====================================================
-- DROP TABLES (in reverse dependency order)
-- =====================================================

DROP TABLE IF EXISTS `procedures`;
DROP TABLE IF EXISTS `diagnoses`;
DROP TABLE IF EXISTS `vital_signs`;
DROP TABLE IF EXISTS `clinical_visits`;

-- =====================================================
-- CREATE TABLES
-- =====================================================

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

-- =====================================================
-- INSERT DUMMY DATA
-- =====================================================

-- --------------------------------------------------------
--
-- Dumping data for table `clinical_visits`
--
INSERT INTO `clinical_visits` (`visit_id`, `patient_id`, `provider_id`, `facility_id`, `visit_date`, `visit_type`, `who_stage`, `chief_complaint`, `clinical_notes`, `assessment`, `plan`, `follow_up_date`, `follow_up_reason`, `created_at`, `updated_at`) VALUES
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
-- Dumping data for table `vital_signs`
--
INSERT INTO `vital_signs` (`vital_id`, `visit_id`, `height_cm`, `weight_kg`, `bmi`, `systolic_bp`, `diastolic_bp`, `pulse_rate`, `temperature_c`, `respiratory_rate`, `oxygen_saturation`, `recorded_at`, `recorded_by`) VALUES
('v1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 175.00, 72.50, 23.67, 120, 80, 72, 36.8, 18, 98.0, '2025-01-10 09:30:00', '22222222-2222-2222-2222-222222222222'),
('v2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 175.00, 73.00, 23.84, 118, 78, 70, 36.6, 16, 99.0, '2025-01-24 10:15:00', '22222222-2222-2222-2222-222222222222'),
('v3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 175.00, 72.80, 23.75, 122, 82, 74, 36.7, 17, 98.5, '2025-02-15 14:20:00', '42356bf7-84ef-4aaa-9610-d74b65c3929f'),
('v4444444-4444-4444-4444-444444444444', 'a4444444-4444-4444-4444-444444444444', 175.00, 73.20, 23.90, 119, 79, 71, 36.6, 16, 99.0, '2025-03-20 11:00:00', '22222222-2222-2222-2222-222222222222'),
('v5555555-5555-5555-5555-555555555555', 'b1111111-1111-1111-1111-111111111111', 165.00, 58.00, 21.32, 110, 70, 78, 36.9, 20, 98.0, '2025-02-05 13:45:00', '42356bf7-84ef-4aaa-9610-d74b65c3929f'),
('v6666666-6666-6666-6666-666666666666', 'b2222222-2222-2222-2222-222222222222', 165.00, 57.50, 21.12, 115, 75, 88, 38.5, 22, 94.0, '2025-02-28 16:30:00', '22222222-2222-2222-2222-222222222222'),
('v7777777-7777-7777-7777-777777777777', 'b3333333-3333-3333-3333-333333333333', 165.00, 58.20, 21.40, 112, 72, 76, 36.7, 18, 98.5, '2025-03-15 10:00:00', '42356bf7-84ef-4aaa-9610-d74b65c3929f'),
('v8888888-8888-8888-8888-888888888888', 'b4444444-4444-4444-4444-444444444444', 165.00, 58.50, 21.50, 111, 71, 75, 36.6, 17, 99.0, '2025-04-10 09:15:00', '42356bf7-84ef-4aaa-9610-d74b65c3929f');

-- --------------------------------------------------------
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
('d8888888-8888-8888-8888-888888888889', 'b4444444-4444-4444-4444-444444444444', 'Z79.899', 'Other long term (current) drug therapy', 'secondary', 1, '2025-03-15', NULL);

-- --------------------------------------------------------
--
-- Dumping data for table `procedures`
--
INSERT INTO `procedures` (`procedure_id`, `visit_id`, `cpt_code`, `procedure_name`, `procedure_description`, `outcome`, `performed_at`) VALUES
('p1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '99213', 'Office or other outpatient visit for the evaluation and management of an established patient', 'Comprehensive physical examination including cardiovascular, respiratory, and neurological assessment', 'Normal findings. Patient cleared for treatment initiation.', '2025-01-10 09:30:00'),
('p2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', '99213', 'Office or other outpatient visit for the evaluation and management of an established patient', 'Review of laboratory results and treatment counseling', 'Patient counseled on ART adherence and side effects. Treatment plan accepted.', '2025-01-24 10:15:00'),
('p5555555-5555-5555-5555-555555555555', 'b1111111-1111-1111-1111-111111111111', '99203', 'Office or other outpatient visit for the evaluation and management of a new patient', 'Comprehensive initial evaluation including full physical examination', 'Baseline assessment completed. Patient referred for laboratory workup.', '2025-02-05 13:45:00'),
('p6666666-6666-6666-6666-666666666666', 'b2222222-2222-2222-2222-222222222222', '71045', 'Chest X-ray, single view', 'PA chest radiograph to rule out pneumonia', 'No acute findings. Mild peribronchial thickening noted. No evidence of pneumonia.', '2025-02-28 17:00:00'),
('p6666666-6666-6666-6666-666666666667', 'b2222222-2222-2222-2222-222222222222', '99284', 'Emergency department visit for the evaluation and management of a patient', 'Emergency evaluation and treatment of acute respiratory symptoms', 'Patient stabilized. Symptomatic treatment provided. Discharged with follow-up instructions.', '2025-02-28 16:30:00'),
('p7777777-7777-7777-7777-777777777777', 'b3333333-3333-3333-3333-333333333333', '99213', 'Office or other outpatient visit for the evaluation and management of an established patient', 'Post-emergency follow-up and ART initiation counseling', 'Patient recovered from respiratory infection. ART counseling completed. Treatment initiated.', '2025-03-15 10:00:00');

-- =====================================================
-- ADD INDEXES
-- =====================================================

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
-- Indexes for table `vital_signs`
--
ALTER TABLE `vital_signs`
  ADD PRIMARY KEY (`vital_id`),
  ADD KEY `visit_id` (`visit_id`),
  ADD KEY `recorded_by` (`recorded_by`);

--
-- Indexes for table `diagnoses`
--
ALTER TABLE `diagnoses`
  ADD PRIMARY KEY (`diagnosis_id`),
  ADD KEY `visit_id` (`visit_id`),
  ADD KEY `idx_diagnoses_icd10_code` (`icd10_code`);

--
-- Indexes for table `procedures`
--
ALTER TABLE `procedures`
  ADD PRIMARY KEY (`procedure_id`),
  ADD KEY `visit_id` (`visit_id`);

-- =====================================================
-- END OF MODULE 3 DATABASE
-- =====================================================

