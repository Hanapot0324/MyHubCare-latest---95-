# Module 6 Alignment Recommendations
## Preventing Mismatches and Ensuring Smooth Operation

### Current Implementation Analysis

**Two Booking Flows:**
1. **Direct Booking** (POST `/api/appointments`): Creates appointment and automatically assigns slot if available
2. **Accept Flow** (POST `/api/appointments/availability/slots/:slotId/accept-appointment`): Provider manually accepts scheduled appointment into slot

### Critical Recommendations

## 1. **Database Constraints & Validation**

### Add Database-Level Constraints
```sql
-- Prevent double-booking of slots
ALTER TABLE availability_slots 
ADD CONSTRAINT check_slot_booking 
CHECK (
  (slot_status = 'booked' AND appointment_id IS NOT NULL) OR
  (slot_status != 'booked' AND appointment_id IS NULL)
);

-- Ensure appointment times match slot times when linked
-- This should be enforced at application level, but add trigger for safety
CREATE OR REPLACE FUNCTION validate_slot_appointment_match()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.appointment_id IS NOT NULL THEN
    -- Verify appointment time matches slot time
    IF NOT EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.appointment_id = NEW.appointment_id
        AND DATE(a.scheduled_start) = NEW.slot_date
        AND TIME(a.scheduled_start) >= NEW.start_time
        AND TIME(a.scheduled_end) <= NEW.end_time
    ) THEN
      RAISE EXCEPTION 'Appointment time does not match slot time';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_slot_appointment
BEFORE UPDATE ON availability_slots
FOR EACH ROW
WHEN (NEW.appointment_id IS NOT NULL)
EXECUTE FUNCTION validate_slot_appointment_match();
```

## 2. **Transaction Improvements**

### Current Issue:
- Race conditions when multiple users book the same slot simultaneously
- No row-level locking on slot updates

### Solution: Add Row-Level Locking
```javascript
// In accept-appointment endpoint
await db.query('START TRANSACTION');

try {
  // Lock the slot row for update (prevents concurrent modifications)
  const [slots] = await db.query(`
    SELECT slot_id, slot_status, appointment_id
    FROM availability_slots
    WHERE slot_id = ?
    FOR UPDATE  -- This locks the row
  `, [slotId]);

  if (slots.length === 0) {
    await db.query('ROLLBACK');
    return res.status(404).json({...});
  }

  const slot = slots[0];
  
  // Check status again after lock (double-check pattern)
  if (slot.slot_status !== 'available') {
    await db.query('ROLLBACK');
    return res.status(400).json({
      success: false,
      message: `Slot is ${slot.slot_status}. Cannot accept appointment.`,
      scenario: `slot_${slot.slot_status}`
    });
  }

  // Proceed with updates...
  await db.query('COMMIT');
} catch (error) {
  await db.query('ROLLBACK');
  throw error;
}
```

## 3. **Time Matching Validation**

### Issue:
- Appointment scheduled times might not match slot times exactly
- Need to ensure appointment fits within slot boundaries

### Solution: Add Time Validation
```javascript
// In accept-appointment endpoint, before updating
const appointmentStart = new Date(appointment.scheduled_start);
const appointmentEnd = new Date(appointment.scheduled_end);
const slotStart = new Date(`${slot.slot_date} ${slot.start_time}`);
const slotEnd = new Date(`${slot.slot_date} ${slot.end_time}`);

// Validate appointment fits within slot
if (appointmentStart < slotStart || appointmentEnd > slotEnd) {
  return res.status(400).json({
    success: false,
    message: 'Appointment time does not match slot time boundaries',
    details: {
      appointment_start: appointment.scheduled_start,
      appointment_end: appointment.scheduled_end,
      slot_start: `${slot.slot_date} ${slot.start_time}`,
      slot_end: `${slot.slot_date} ${slot.end_time}`
    }
  });
}
```

## 4. **Automatic Cleanup Mechanisms**

### Issue:
- Cancelled appointments might leave slots in 'booked' state
- Orphaned slots (appointment deleted but slot still booked)

### Solution: Add Cleanup Function
```javascript
// Add to appointment cancellation endpoint
router.delete('/:id', authenticateToken, async (req, res) => {
  // ... existing code ...
  
  // After cancelling appointment, free up the slot
  if (existing[0].appointment_id && existing[0].slot_id) {
    await db.query(`
      UPDATE availability_slots
      SET slot_status = 'available',
          appointment_id = NULL
      WHERE slot_id = ? AND appointment_id = ?
    `, [existing[0].slot_id, id]);
  }
  
  // ... rest of code ...
});

// Add scheduled cleanup job (run daily)
async function cleanupOrphanedSlots() {
  // Find slots that are booked but appointment doesn't exist or is cancelled
  await db.query(`
    UPDATE availability_slots s
    LEFT JOIN appointments a ON s.appointment_id = a.appointment_id
    SET s.slot_status = 'available',
        s.appointment_id = NULL
    WHERE s.slot_status = 'booked'
      AND (
        a.appointment_id IS NULL OR
        a.status IN ('cancelled', 'no_show')
      )
  `);
}
```

## 5. **Enhanced Validation in Create Slot**

### Issue:
- Overlapping slots for same provider/facility/date
- Slots with invalid time ranges (end_time <= start_time)

### Solution: Add Validation
```javascript
// In POST /api/appointments/availability/slots
// Check for overlapping slots
const [overlapping] = await db.query(`
  SELECT slot_id
  FROM availability_slots
  WHERE provider_id = ?
    AND facility_id = ?
    AND slot_date = ?
    AND slot_status != 'blocked'
    AND (
      (start_time < ? AND end_time > ?) OR
      (start_time < ? AND end_time > ?) OR
      (start_time >= ? AND end_time <= ?)
    )
`, [
  provider_id, facility_id, slot_date,
  end_time, start_time,  // Check 1
  start_time, end_time,  // Check 2
  start_time, end_time   // Check 3
]);

if (overlapping.length > 0) {
  return res.status(400).json({
    success: false,
    message: 'Slot overlaps with existing slot for this provider/facility/date',
    overlapping_slot_id: overlapping[0].slot_id
  });
}
```

## 6. **Status Synchronization**

### Issue:
- Appointment status and slot status can get out of sync

### Solution: Add Status Sync Check
```javascript
// Add validation endpoint or middleware
async function validateSlotAppointmentSync(slotId) {
  const [slots] = await db.query(`
    SELECT s.*, a.status as appointment_status
    FROM availability_slots s
    LEFT JOIN appointments a ON s.appointment_id = a.appointment_id
    WHERE s.slot_id = ?
  `, [slotId]);

  if (slots.length === 0) return { valid: false, error: 'Slot not found' };

  const slot = slots[0];

  // Validation rules
  if (slot.slot_status === 'booked' && !slot.appointment_id) {
    return { valid: false, error: 'Slot marked as booked but no appointment linked' };
  }

  if (slot.appointment_id && slot.slot_status !== 'booked') {
    return { valid: false, error: 'Appointment linked but slot not marked as booked' };
  }

  if (slot.appointment_id && slot.appointment_status === 'cancelled') {
    return { valid: false, error: 'Slot booked but appointment is cancelled' };
  }

  return { valid: true };
}
```

## 7. **Frontend Improvements**

### Add Real-time Updates
```javascript
// In AvailabilitySlots.jsx
useEffect(() => {
  // Poll for slot updates when modal is open
  if (showAcceptModal) {
    const interval = setInterval(() => {
      fetchSlots(); // Refresh slots to detect changes
    }, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }
}, [showAcceptModal]);
```

### Add Optimistic Updates
```javascript
// In handleAcceptAppointment
const handleAcceptAppointment = async (slotId, appointmentId) => {
  // Optimistically update UI
  setSlots(prevSlots => 
    prevSlots.map(slot => 
      slot.slot_id === slotId 
        ? { ...slot, slot_status: 'booked', appointment_id: appointmentId }
        : slot
    )
  );

  try {
    // Make API call
    const response = await fetch(...);
    
    if (!response.ok) {
      // Revert on error
      fetchSlots();
      throw new Error('Failed to accept appointment');
    }
    
    // Success - refresh to get latest data
    fetchSlots();
  } catch (error) {
    // Revert on error
    fetchSlots();
    showToast('Failed to accept appointment', 'error');
  }
};
```

## 8. **API Response Consistency**

### Standardize Error Responses
```javascript
// All endpoints should return consistent error format
{
  success: false,
  message: "Human-readable error message",
  scenario: "error_scenario_code", // For frontend handling
  details: {
    // Additional context
  },
  recoverable: true // Whether user can retry
}
```

## 9. **Audit Trail Enhancement**

### Log All Slot State Changes
```javascript
// Add to all slot update operations
await logAudit({
  action: 'UPDATE',
  table_name: 'availability_slots',
  record_id: slotId,
  user_id: req.user.user_id,
  changes: JSON.stringify({
    previous_status: oldSlot.slot_status,
    new_status: newSlot.slot_status,
    previous_appointment_id: oldSlot.appointment_id,
    new_appointment_id: newSlot.appointment_id
  })
});
```

## 10. **Testing Scenarios**

### Critical Test Cases:
1. **Concurrent Booking**: Two users try to book the same slot simultaneously
2. **Time Mismatch**: Appointment time doesn't match slot time
3. **Cancellation**: Cancel appointment and verify slot is freed
4. **Overlapping Slots**: Create overlapping slots for same provider
5. **Orphaned Slots**: Delete appointment and verify slot cleanup
6. **Status Sync**: Verify slot and appointment status stay in sync

## Implementation Priority

1. **HIGH PRIORITY** (Prevent data corruption):
   - Row-level locking in accept-appointment
   - Time matching validation
   - Automatic cleanup on cancellation

2. **MEDIUM PRIORITY** (Improve reliability):
   - Overlapping slot validation
   - Status synchronization checks
   - Enhanced error responses

3. **LOW PRIORITY** (Enhance UX):
   - Real-time updates
   - Optimistic UI updates
   - Better error messages

## Summary

These recommendations will:
- ✅ Prevent race conditions with row-level locking
- ✅ Ensure data consistency with validation
- ✅ Automatically clean up orphaned records
- ✅ Provide better error handling
- ✅ Maintain audit trail
- ✅ Improve user experience

Implement these in phases, starting with HIGH PRIORITY items to prevent data corruption and mismatches.

