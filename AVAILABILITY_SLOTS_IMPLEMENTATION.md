# Availability Slots Implementation Guide

## Overview
This document describes the implementation of the Availability Slots component for Module 6 (Appointment Scheduling). The system allows providers to manage their availability slots and accept appointments into those slots.

## Backend Implementation

### New Endpoint: Accept Appointment into Slot
**POST** `/api/appointments/availability/slots/:slotId/accept-appointment`

**Request Body:**
```json
{
  "appointment_id": "uuid"
}
```

**Response Scenarios:**

#### ✅ Success Scenario
```json
{
  "success": true,
  "message": "Appointment accepted into slot successfully",
  "data": { /* slot with appointment details */ },
  "scenario": "success"
}
```

#### ❌ Error Scenarios

1. **Slot Already Booked** (`slot_already_booked`)
   - Slot status is 'booked'
   - Another appointment is already assigned
   - **Response:** 400 Bad Request
   - **Message:** "Slot is already booked. Cannot accept appointment."

2. **Slot Blocked** (`slot_blocked`)
   - Slot status is 'blocked'
   - Slot is intentionally blocked by provider
   - **Response:** 400 Bad Request
   - **Message:** "Slot is blocked. Cannot accept appointment."

3. **Slot Unavailable** (`slot_unavailable`)
   - Slot status is 'unavailable'
   - Slot is marked as unavailable
   - **Response:** 400 Bad Request
   - **Message:** "Slot is unavailable. Cannot accept appointment."

4. **Slot Expired** (`slot_expired`)
   - Slot's end time is in the past
   - Cannot accept appointments into expired slots
   - **Response:** 400 Bad Request
   - **Message:** "Slot has expired. Cannot accept appointment."

5. **Appointment Has Slot** (`appointment_has_slot`)
   - Appointment is already assigned to another slot
   - **Response:** 400 Bad Request
   - **Message:** "Appointment is already assigned to another slot."

6. **Time Mismatch** (`time_mismatch`)
   - Appointment time doesn't fit within slot time range
   - **Response:** 400 Bad Request
   - **Message:** "Appointment time does not match slot time."

7. **Provider Mismatch** (`provider_mismatch`)
   - Slot provider doesn't match appointment provider
   - **Response:** 400 Bad Request
   - **Message:** "Provider mismatch between slot and appointment."

8. **Facility Mismatch** (`facility_mismatch`)
   - Slot facility doesn't match appointment facility
   - **Response:** 400 Bad Request
   - **Message:** "Facility mismatch between slot and appointment."

9. **Time Conflict** (`time_conflict`)
   - Another appointment exists in the same time slot
   - **Response:** 400 Bad Request
   - **Message:** "Time conflict detected. Another appointment exists in this time slot."

### Updated Endpoints

#### GET `/api/appointments/availability/slots`
- Now returns all slots (not just 'available')
- Added `status` query parameter for filtering
- Returns appointment and patient information when slot is booked

#### DELETE `/api/appointments/:id`
- Updated to free up availability slot when appointment is cancelled
- Sets slot status back to 'available' and clears appointment_id

## Frontend Implementation

### Component: `AvailabilitySlots.jsx`

**Features:**
- View all availability slots with filtering
- Filter by facility, provider, date, and status
- Visual status indicators (available, booked, blocked, unavailable)
- Accept appointments into available slots
- Modal for selecting appointment to accept
- Real-time validation and error handling
- Toast notifications for all scenarios

**Key Functions:**

1. **`canAcceptAppointment(slot)`**
   - Checks if slot is available
   - Verifies slot hasn't expired
   - Returns boolean

2. **`isSlotExpired(slot)`**
   - Checks if slot's end time is in the past
   - Returns boolean

3. **`handleAcceptAppointment(slotId, appointmentId)`**
   - Calls backend API
   - Handles all error scenarios with user-friendly messages
   - Refreshes data on success

**UI Elements:**
- Status badges with color coding
- Expired slot warnings
- Appointment selection modal
- Filter controls
- Responsive grid layout

## Database Schema

### Table: `availability_slots`

```sql
CREATE TABLE availability_slots (
  slot_id CHAR(36) PRIMARY KEY,
  provider_id CHAR(36) NOT NULL,
  facility_id CHAR(36) NOT NULL,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_status ENUM('available', 'booked', 'blocked', 'unavailable') DEFAULT 'available',
  appointment_id CHAR(36) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes (Migration: `improve_availability_slots.sql`)

- `idx_availability_slots_provider_id` - For provider lookups
- `idx_availability_slots_facility_id` - For facility lookups
- `idx_availability_slots_date` - For date-based queries
- `idx_availability_slots_status` - For status filtering
- `idx_availability_slots_appointment_id` - For appointment lookups
- `idx_availability_slots_provider_date_status` - Composite index
- `idx_availability_slots_facility_date` - Composite index

## All Possible Scenarios

### Scenario 1: Slot Available - Success ✅
- Slot status: `available`
- Slot not expired
- Appointment time matches slot time
- No conflicts
- **Result:** Appointment accepted, slot status → `booked`

### Scenario 2: Slot Already Booked ❌
- Slot status: `booked`
- Another appointment already assigned
- **Result:** Error - "Slot is already booked"

### Scenario 3: Slot Blocked ❌
- Slot status: `blocked`
- Provider intentionally blocked the slot
- **Result:** Error - "Slot is blocked"

### Scenario 4: Slot Unavailable ❌
- Slot status: `unavailable`
- Slot marked as unavailable
- **Result:** Error - "Slot is unavailable"

### Scenario 5: Slot Expired ❌
- Slot's end time is in the past
- **Result:** Error - "Slot has expired"

### Scenario 6: Appointment Already Has Slot ❌
- Appointment is assigned to different slot
- **Result:** Error - "Appointment already assigned to another slot"

### Scenario 7: Time Mismatch ❌
- Appointment start/end time outside slot time range
- **Result:** Error - "Appointment time does not match slot time"

### Scenario 8: Provider Mismatch ❌
- Slot provider ≠ Appointment provider
- **Result:** Error - "Provider mismatch"

### Scenario 9: Facility Mismatch ❌
- Slot facility ≠ Appointment facility
- **Result:** Error - "Facility mismatch"

### Scenario 10: Time Conflict ❌
- Another appointment exists in same time slot
- **Result:** Error - "Time conflict detected"

### Scenario 11: Appointment Cancellation - Slot Freed ✅
- When appointment is cancelled
- Slot status → `available`
- appointment_id → `NULL`
- **Result:** Slot becomes available again

## Usage Flow

1. **Provider creates availability slots** (via existing endpoint)
2. **Patient books appointment** (via existing appointment booking)
3. **Provider/Admin views availability slots** (new component)
4. **Provider/Admin selects slot and appointment** (modal)
5. **System validates all scenarios** (backend checks)
6. **If valid, appointment accepted into slot** (slot → booked, appointment → confirmed)
7. **If invalid, error message shown** (specific scenario message)

## Testing Checklist

- [ ] Accept appointment into available slot (success)
- [ ] Try to accept into booked slot (error)
- [ ] Try to accept into blocked slot (error)
- [ ] Try to accept into unavailable slot (error)
- [ ] Try to accept into expired slot (error)
- [ ] Try to accept appointment that already has slot (error)
- [ ] Try to accept with time mismatch (error)
- [ ] Try to accept with provider mismatch (error)
- [ ] Try to accept with facility mismatch (error)
- [ ] Try to accept with time conflict (error)
- [ ] Cancel appointment and verify slot is freed
- [ ] Filter slots by facility
- [ ] Filter slots by provider
- [ ] Filter slots by date
- [ ] Filter slots by status

## Files Created/Modified

### Created:
- `frontend/src/components/AvailabilitySlots.jsx` - Main component
- `backend/migrations/improve_availability_slots.sql` - Database indexes
- `AVAILABILITY_SLOTS_IMPLEMENTATION.md` - This document

### Modified:
- `backend/routes/appointments.js` - Added accept-appointment endpoint, updated GET slots, updated DELETE appointment

## Next Steps

1. Add the component to the main App.jsx routing
2. Add navigation link in the dashboard
3. Test all scenarios in development
4. Deploy to staging for user testing
5. Gather feedback and iterate

## Notes

- All scenarios are handled with specific error messages
- Frontend provides visual feedback for all states
- Backend validates all business rules
- Database indexes ensure good performance
- Audit logging tracks all slot changes

