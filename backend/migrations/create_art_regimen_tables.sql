-- Create ART Regimen Management Tables (Module 15)
-- Run this migration to create the necessary tables for ART regimen tracking
-- 
-- IMPORTANT NOTE: 
-- The existing `art_regimens` table in the database is a reference/catalog table.
-- This migration creates `patient_art_regimens` for patient-specific regimens.
-- If you want to align with DATABASE_STRUCTURE.md exactly, you should:
-- 1. Rename existing `art_regimens` to `art_regimen_catalog` (or similar)
-- 2. Then rename `patient_art_regimens` to `art_regimens` after this migration
-- OR keep both tables (reference + patient-specific) as implemented here.

-- 1. patient_art_regimens table (Patient-specific regimens)
-- This table tracks individual patient ART regimens
CREATE TABLE IF NOT EXISTS patient_art_regimens (
    regimen_id CHAR(36) PRIMARY KEY,
    patient_id CHAR(36) NOT NULL,
    provider_id CHAR(36) NOT NULL,
    facility_id CHAR(36) NOT NULL,
    start_date DATE NOT NULL,
    stop_date DATE,
    status ENUM('active', 'stopped', 'changed') DEFAULT 'active',
    stop_reason TEXT,
    change_reason TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES users(user_id),
    FOREIGN KEY (facility_id) REFERENCES facilities(facility_id),
    INDEX idx_art_regimens_patient_id (patient_id),
    INDEX idx_art_regimens_status (status),
    INDEX idx_art_regimens_start_date (start_date),
    INDEX idx_art_regimens_provider_id (provider_id),
    INDEX idx_art_regimens_facility_id (facility_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. art_regimen_drugs table
CREATE TABLE IF NOT EXISTS art_regimen_drugs (
    regimen_drug_id CHAR(36) PRIMARY KEY,
    regimen_id CHAR(36) NOT NULL,
    medication_id CHAR(36) NOT NULL,
    drug_name VARCHAR(200) NOT NULL,
    dosage VARCHAR(50) NOT NULL,
    pills_per_day INTEGER NOT NULL,
    pills_dispensed INTEGER DEFAULT 0,
    pills_remaining INTEGER DEFAULT 0,
    missed_doses INTEGER DEFAULT 0,
    last_dispensed_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (regimen_id) REFERENCES patient_art_regimens(regimen_id) ON DELETE CASCADE,
    FOREIGN KEY (medication_id) REFERENCES medications(medication_id),
    INDEX idx_art_regimen_drugs_regimen_id (regimen_id),
    INDEX idx_art_regimen_drugs_medication_id (medication_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3. art_regimen_history table
CREATE TABLE IF NOT EXISTS art_regimen_history (
    history_id CHAR(36) PRIMARY KEY,
    regimen_id CHAR(36) NOT NULL,
    action_type ENUM('started', 'stopped', 'changed', 'drug_added', 'drug_removed', 'pills_dispensed', 'dose_missed') NOT NULL,
    action_date DATE DEFAULT (CURRENT_DATE),
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    details LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
    performed_by CHAR(36) NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (regimen_id) REFERENCES patient_art_regimens(regimen_id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(user_id),
    INDEX idx_art_regimen_history_regimen_id (regimen_id),
    INDEX idx_art_regimen_history_action_date (action_date),
    INDEX idx_art_regimen_history_action_type (action_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

