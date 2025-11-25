-- Migration: Improve Availability Slots Table
-- Purpose: Add indexes and ensure proper constraints for availability_slots table
-- Date: 2025-01-XX

-- Add indexes if they don't exist (for better query performance)
-- Note: These indexes may already exist, but this ensures they're in place

-- Index for provider_id lookups
CREATE INDEX IF NOT EXISTS idx_availability_slots_provider_id 
ON availability_slots(provider_id);

-- Index for facility_id lookups
CREATE INDEX IF NOT EXISTS idx_availability_slots_facility_id 
ON availability_slots(facility_id);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_availability_slots_date 
ON availability_slots(slot_date);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_availability_slots_status 
ON availability_slots(slot_status);

-- Index for appointment_id lookups (when slot is booked)
CREATE INDEX IF NOT EXISTS idx_availability_slots_appointment_id 
ON availability_slots(appointment_id);

-- Composite index for common query patterns (provider + date + status)
CREATE INDEX IF NOT EXISTS idx_availability_slots_provider_date_status 
ON availability_slots(provider_id, slot_date, slot_status);

-- Composite index for facility + date queries
CREATE INDEX IF NOT EXISTS idx_availability_slots_facility_date 
ON availability_slots(facility_id, slot_date);

-- Add foreign key constraint for appointment_id if it doesn't exist
-- Note: This may fail if the constraint already exists, which is fine
-- ALTER TABLE availability_slots
-- ADD CONSTRAINT fk_availability_slots_appointment
-- FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id)
-- ON DELETE SET NULL
-- ON UPDATE CASCADE;

-- Add comment to table for documentation
ALTER TABLE availability_slots 
COMMENT = 'Stores provider availability slots for appointment scheduling. Status: available, booked, blocked, unavailable';

