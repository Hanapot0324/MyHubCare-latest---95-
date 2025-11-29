-- Fix appointment_id values that incorrectly contain 'available' string
-- This should only affect slots that are not actually booked

UPDATE availability_slots
SET appointment_id = NULL
WHERE appointment_id = 'available'
  AND slot_status = 'available'
  AND appointment_id IS NOT NULL;

-- Verify the fix
SELECT 
    slot_id,
    slot_status,
    appointment_id,
    assignment_id,
    slot_date,
    start_time
FROM availability_slots
WHERE appointment_id = 'available'
LIMIT 10;

