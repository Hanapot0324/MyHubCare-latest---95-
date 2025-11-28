# Module 6: Appointment Scheduling - Alignment Summary

## Overview
This document summarizes all changes made to align the system with Module 6 (Appointment Scheduling) specifications.

## Database Changes

### 1. Migration Script
**File:** `backend/migrations/align_module6_appointment_scheduling.sql`

**Changes:**
- Updated `appointments` table constraints
- Added triggers to enforce:
  - No same-day booking (date >= tomorrow)
  - Hourly intervals only (minutes = 0)
  - 60-minute duration enforced
- Updated `availability_slots` table:
  - Verified `assignment_id` and `lock_status` columns exist
  - Added foreign keys and indexes
- Updated `appointment_requests` table:
  - Migrated from old structure (`preferred_start`, `preferred_end`) to new structure (`requested_date`, `requested_time`)
  - Added all required columns and indexes
- Verified `doctor_assignments` and `doctor_conflicts` tables structure
- Updated `appointment_reminders` table structure

### 2. Key Constraints Enforced

#### Appointments Table:
- ✅ No same-day booking: `DATE(scheduled_start) >= CURRENT_DATE + INTERVAL '1 day'`
- ✅ Hourly intervals only: `EXTRACT(MINUTE FROM scheduled_start) = 0`
- ✅ 60-minute duration: `duration_minutes = 60`
- ✅ `booked_by` is required (NOT NULL)

#### Appointment Requests Table:
- ✅ No same-day booking: `requested_date >= CURRENT_DATE + INTERVAL '1 day'`
- ✅ Hourly intervals only: `EXTRACT(MINUTE FROM requested_time) = 0`
- ✅ `created_by` is required (NOT NULL)

## Backend Changes

### 1. `backend/routes/appointments.js`

**Changes:**
- ✅ Updated validation to prevent same-day booking (date >= tomorrow)
- ✅ Enforced 60-minute duration (reject if not 60)
- ✅ Updated sorting: `ORDER BY scheduled_start DESC` (newest first, per Module 6 spec)

**Key Updates:**
```javascript
// Before: allowed same-day booking
if (startDate < today) { ... }

// After: no same-day booking
if (startDateOnly <= today) {
  message: 'Appointments must be scheduled at least one day in advance (no same-day booking)'
}

// Before: default 60, but allowed other values
const finalDurationMinutes = duration_minutes || 60;

// After: enforce 60 minutes
const finalDurationMinutes = 60;
if (duration_minutes && duration_minutes !== 60) {
  return error: 'Appointment duration must be exactly 60 minutes'
}
```

### 2. `backend/routes/appointment-requests.js`

**Status:** ✅ Already updated in previous migration
- Uses `requested_date` and `requested_time` (not `preferred_start`/`preferred_end`)
- Uses `facility_id` and `provider_id` (not `preferred_facility_id`/`preferred_provider_id`)
- Uses `patient_notes` (not `notes`)
- Uses `reviewed_by` (not `reviewer_id`)

### 3. `backend/routes/doctor-assignments.js`

**Status:** ✅ Already updated in previous migration
- Uses per-day assignment model (`assignment_date` instead of date ranges)
- Generates availability slots automatically
- Links slots to assignments via `assignment_id`
- Sets `lock_status` based on `is_locked` in assignment

## Frontend Changes

### 1. `frontend/src/components/Appointment.jsx`

**Changes:**
- ✅ Updated date validation to prevent same-day booking
- ✅ Fixed duration to 60 minutes (removed user input, set to disabled field)
- ✅ Updated minimum date to tomorrow (not today)
- ✅ Updated all duration references to 60 minutes

**Key Updates:**
```javascript
// Date validation
if (startDateOnly <= today) {
  message: 'Appointments must be scheduled at least one day in advance (no same-day booking)'
}

// Duration field
duration_minutes: 60, // Fixed value
disabled={true}
title="Appointment duration is fixed at 60 minutes per Module 6 specification"

// Minimum date
min={(() => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
})()}
```

### 2. `frontend/src/components/MyAppointments.jsx`

**Changes:**
- ✅ Already prevents same-day booking (existing validation)
- ✅ Updated duration to 60 minutes in all appointment creation/update calls
- ✅ Already has `getMinDate()` function that returns tomorrow

**Key Updates:**
```javascript
// Duration enforcement
duration_minutes: 60, // Module 6: Fixed 60-minute duration

// Date validation (already exists)
if (startDateOnly <= today) {
  message: 'Appointments must be scheduled in advance (not available for today or past dates)'
}
```

### 3. `frontend/src/components/AppointmentRequests.jsx`

**Status:** ✅ Already updated in previous migration
- Uses `requested_date` and `requested_time` for display
- Uses `patient_notes` instead of `notes`
- Uses `facility_id` and `provider_id` (not `preferred_*`)

### 4. `frontend/src/components/DoctorAssignments.jsx`

**Status:** ✅ Already updated in previous migration
- Uses per-day assignment model
- Uses `doctor_id`, `assignment_date`, `start_time`, `end_time`
- Removed `days_of_week`, `start_date`, `end_date`

### 5. `frontend/src/components/AvailabilitySlots.jsx`

**Status:** ✅ No changes needed
- Already handles `assignment_id` and `lock_status` if present
- Bulk creation is separate from doctor assignments (manual slot creation)

## System Flow Alignment

### ✅ Book Appointment (P6.1)
- **Validation:** No same-day booking, hourly intervals, 60-minute duration
- **Availability Check:** Queries `availability_slots` with `lock_status` check
- **Slot Update:** Sets `slot_status = 'booked'` and links `appointment_id`
- **Sorting:** Newest appointments first (DESC order)

### ✅ Patient Appointment Request (P6.1a)
- **Submission:** Patient submits with `requested_date`, `requested_time`, `facility_id`, `appointment_type`
- **Validation:** Future date only, hourly time slots
- **Review:** Case Manager reviews and approves/declines
- **Approval:** Creates appointment record and links via `appointment_id`

### ✅ Admin Doctor Availability Management (P6.5)
- **Assignment:** Admin creates per-day assignments
- **Slot Generation:** System automatically generates hourly slots
- **Locking:** Admin can lock assignments (prevents edits)
- **Conflicts:** Admin adds conflicts that block scheduling

### ✅ Check Availability (P6.2)
- **Query:** Filters by `provider_id`, `facility_id`, `slot_date`
- **Exclusions:**
  - Slots with `slot_status != 'available'`
  - Slots with `lock_status = true`
  - Slots blocked by `doctor_conflicts`
  - Slots already booked (`appointment_id IS NOT NULL`)

## Testing Checklist

### Database
- [ ] Run migration script: `backend/migrations/align_module6_appointment_scheduling.sql`
- [ ] Verify triggers are created and working
- [ ] Test constraint violations (same-day booking, non-hourly times, non-60-minute duration)

### Backend
- [ ] Test appointment creation with tomorrow's date (should succeed)
- [ ] Test appointment creation with today's date (should fail)
- [ ] Test appointment creation with non-hourly time (should fail)
- [ ] Test appointment creation with non-60-minute duration (should fail)
- [ ] Verify appointments are sorted newest first

### Frontend
- [ ] Test date picker shows tomorrow as minimum date
- [ ] Test duration field is disabled and shows 60 minutes
- [ ] Test appointment request creation uses new field names
- [ ] Test appointment request display shows `requested_date` and `requested_time`
- [ ] Test doctor assignment creation uses per-day model
- [ ] Test availability slots show `lock_status` and `assignment_id` if present

## Issues Fixed

### 1. ✅ Appointment.jsx
- Fixed duplicate `value="60"` attribute in duration field
- Duration field now correctly shows 60 and is disabled

### 2. ✅ MyAppointments.jsx
- Removed references to old `preferred_start` and `preferred_end` fields
- Fixed `handleSubmit` to always set `duration_minutes` to 60
- Updated comment from "30-minute intervals" to "60-minute intervals"

### 3. ✅ Migration Script
- Converted from PostgreSQL syntax to MySQL-compatible syntax
- Added proper conditional checks for columns/indexes/foreign keys
- Uses `PREPARE`/`EXECUTE` statements for conditional ALTER TABLE operations

## Remaining Considerations

### 1. Data Migration (if needed)
- If old `appointment_requests` data exists with `preferred_start`/`preferred_end`, a separate data migration script may be needed
- Current migration only ensures new structure exists, doesn't migrate existing data

### 2. Testing Required
- Test migration script in development environment first
- Verify all triggers work correctly
- Test appointment creation/update flows

## Next Steps

1. **Run Migration:** Execute `backend/migrations/align_module6_appointment_scheduling.sql`
2. **Test Backend:** Verify all validations work correctly
3. **Test Frontend:** Verify UI prevents same-day booking and shows 60-minute duration
4. **Data Migration:** If old appointment_requests data exists, create migration script
5. **Documentation:** Update API documentation with new constraints

## Files Modified

### Database
- `backend/migrations/align_module6_appointment_scheduling.sql` (NEW)

### Backend
- `backend/routes/appointments.js` (UPDATED)
- `backend/routes/appointment-requests.js` (ALREADY UPDATED)
- `backend/routes/doctor-assignments.js` (ALREADY UPDATED)

### Frontend
- `frontend/src/components/Appointment.jsx` (UPDATED)
- `frontend/src/components/MyAppointments.jsx` (UPDATED)
- `frontend/src/components/AppointmentRequests.jsx` (ALREADY UPDATED)
- `frontend/src/components/DoctorAssignments.jsx` (ALREADY UPDATED)

## Notes

- All changes align with Module 6 specification
- Sorting is now newest first (DESC) as per spec
- Duration is fixed at 60 minutes as per spec
- No same-day booking enforced as per spec
- Hourly intervals only enforced as per spec


