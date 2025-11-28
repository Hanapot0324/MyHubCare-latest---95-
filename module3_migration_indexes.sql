-- =====================================================
-- Module 3: Clinical Care - Missing Indexes Migration
-- =====================================================
-- This script adds the missing indexes for Module 3
-- as specified in the DATABASE_STRUCTURE documentation
-- 
-- Run this script after the main database schema is created
-- =====================================================

-- Add missing index on clinical_visits.visit_date
-- Required for efficient querying by visit date (P3.5 - View Visit History)
ALTER TABLE `clinical_visits`
  ADD INDEX `idx_clinical_visits_visit_date` (`visit_date`);

-- Add missing index on diagnoses.icd10_code
-- Required for efficient querying by ICD-10 code
ALTER TABLE `diagnoses`
  ADD INDEX `idx_diagnoses_icd10_code` (`icd10_code`);

-- =====================================================
-- Verification Queries (Optional - run to verify indexes)
-- =====================================================
-- SHOW INDEXES FROM clinical_visits WHERE Key_name = 'idx_clinical_visits_visit_date';
-- SHOW INDEXES FROM diagnoses WHERE Key_name = 'idx_diagnoses_icd10_code';
-- =====================================================

