# Availability Slots - Complete System Flow

## Overview
This document explains the complete flow of the Availability Slots system, from creating slots to accepting appointments.

---

## 🔄 Complete Flow Diagram

```
1. Provider Creates Availability Slots
   ↓
2. Patient Books Appointment (without slot assignment)
   ↓
3. Appointment Status: 'scheduled' (waiting for slot assignment)
   ↓
4. Provider/Admin Views Availability Slots
   ↓
5. Provider/Admin Selects Slot & Appointment
   ↓
6. System Validates All Scenarios
   ↓
7a. If Valid → Accept Appointment into Slot
   ↓
   Slot Status: 'available' → 'booked'
   Appointment Status: 'scheduled' → 'confirmed'
   Slot.appointment_id = appointment_id
   ↓
7b. If Invalid → Show Error Message
   ↓
8. Appointment Cancellation → Free Slot
```

---

## 📋 Step-by-Step Flow

### **Step 1: Provider Creates Availability Slots**

**Who:** Admin, Physician, or Case Manager  
**Endpoint:** `POST /api/appointments/availability/slots`

**Process:**
1. Provider logs into system
2. Navigates to "Availability Slots" (or uses API directly)
3. Creates slots with:
   - Provider ID
   - Facility ID
   - Date
   - Start Time
   - End Time
   - Status: 'available' (default)

**Example Request:**
```json
{
  "provider_id": "uuid",
  "facility_id": "uuid",
  "slot_date": "2025-01-20",
  "start_time": "09:00:00",
  "end_time": "10:00:00",
  "slot_status": "available"
}
```

**Database State:**
```sql
availability_slots:
- slot_id: "abc-123"
- provider_id: "provider-uuid"
- facility_id: "facility-uuid"
- slot_date: "2025-01-20"
- start_time: "09:00:00"
- end_time: "10:00:00"
- slot_status: "available"
- appointment_id: NULL
```

---

### **Step 2: Patient Books Appointment**

**Who:** Patient or Staff booking on behalf of patient  
**Endpoint:** `POST /api/appointments`

**Process:**
1. Patient selects facility, provider, date, time
2. System checks for conflicts
3. If slots exist for facility/provider:
   - System finds matching available slot
   - OR appointment created without slot (status: 'scheduled')
4. If no slots exist:
   - Appointment created normally (status: 'scheduled')

**Example Request:**
```json
{
  "patient_id": "patient-uuid",
  "provider_id": "provider-uuid",
  "facility_id": "facility-uuid",
  "appointment_type": "follow_up",
  "scheduled_start": "2025-01-20 09:00:00",
  "scheduled_end": "2025-01-20 09:30:00",
  "duration_minutes": 30
}
```

**Database State:**
```sql
appointments:
- appointment_id: "appt-456"
- patient_id: "patient-uuid"
- provider_id: "provider-uuid"
- facility_id: "facility-uuid"
- scheduled_start: "2025-01-20 09:00:00"
- scheduled_end: "2025-01-20 09:30:00"
- status: "scheduled"  ← Waiting for slot assignment
```

**Note:** At this point, the appointment may or may not have a slot assigned, depending on whether slots were found during booking.

---

### **Step 3: Provider/Admin Views Availability Slots**

**Who:** Admin, Physician, or Case Manager  
**Endpoint:** `GET /api/appointments/availability/slots`

**Process:**
1. User navigates to "Availability Slots" in sidebar
2. Frontend fetches all slots (with filters)
3. Displays slots in cards showing:
   - Date and time
   - Facility and provider
   - Status (available, booked, blocked, unavailable)
   - Appointment info (if booked)

**Frontend Flow:**
```
User clicks "Availability Slots" in sidebar
  ↓
Component mounts → fetchSlots()
  ↓
API call: GET /api/appointments/availability/slots?facility_id=...&provider_id=...
  ↓
Backend returns slots with appointment details
  ↓
Frontend displays slots in grid
  ↓
User can filter by facility, provider, date, status
```

**Visual Display:**
- ✅ **Green border** = Available slot
- 🔵 **Blue border** = Booked slot
- 🔴 **Red border** = Blocked slot
- ⚪ **Gray border** = Unavailable slot
- ⚠️ **Warning badge** = Expired slot

---

### **Step 4: Provider/Admin Selects Slot & Appointment**

**Who:** Admin, Physician, or Case Manager  
**Process:**
1. User clicks "Accept Appointment" button on an available slot
2. Modal opens showing:
   - Selected slot details
   - List of scheduled appointments that match slot criteria
3. User selects an appointment from the list
4. System filters appointments by:
   - Facility match
   - Provider match (if slot has provider)
   - Time range match (appointment must fit within slot)

**Frontend Flow:**
```
User clicks "Accept Appointment" on slot card
  ↓
Modal opens → fetchAppointments()
  ↓
API call: GET /api/appointments?status=scheduled
  ↓
Frontend filters appointments:
  - Facility matches slot facility
  - Provider matches slot provider (if exists)
  - Appointment time fits within slot time range
  ↓
User selects appointment from filtered list
  ↓
User clicks "Accept Appointment" button
```

---

### **Step 5: System Validates All Scenarios**

**Who:** Backend System  
**Endpoint:** `POST /api/appointments/availability/slots/:slotId/accept-appointment`

**Validation Checks (in order):**

#### ✅ **Check 1: Slot Status**
```javascript
if (slot.slot_status === 'booked') {
  return error: "Slot is already booked"
}
if (slot.slot_status === 'blocked') {
  return error: "Slot is blocked"
}
if (slot.slot_status === 'unavailable') {
  return error: "Slot is unavailable"
}
```

#### ✅ **Check 2: Slot Expiration**
```javascript
const slotEnd = new Date(`${slot.slot_date} ${slot.end_time}`);
if (slotEnd < new Date()) {
  return error: "Slot has expired"
}
```

#### ✅ **Check 3: Appointment Already Has Slot**
```javascript
const existingSlot = await db.query(
  "SELECT slot_id FROM availability_slots WHERE appointment_id = ?",
  [appointment_id]
);
if (existingSlot.length > 0 && existingSlot[0].slot_id !== slotId) {
  return error: "Appointment already assigned to another slot"
}
```

#### ✅ **Check 4: Time Match**
```javascript
const appointmentStart = new Date(appointment.scheduled_start);
const appointmentEnd = new Date(appointment.scheduled_end);
const slotStart = new Date(`${slot.slot_date} ${slot.start_time}`);
const slotEnd = new Date(`${slot.slot_date} ${slot.end_time}`);

if (appointmentStart < slotStart || appointmentEnd > slotEnd) {
  return error: "Appointment time does not match slot time"
}
```

#### ✅ **Check 5: Provider Match**
```javascript
if (slot.provider_id && appointment.provider_id && 
    slot.provider_id !== appointment.provider_id) {
  return error: "Provider mismatch"
}
```

#### ✅ **Check 6: Facility Match**
```javascript
if (slot.facility_id !== appointment.facility_id) {
  return error: "Facility mismatch"
}
```

#### ✅ **Check 7: Time Conflict**
```javascript
const conflicts = await db.query(`
  SELECT appointment_id FROM appointments
  WHERE facility_id = ?
    AND status NOT IN ('cancelled', 'no_show')
    AND appointment_id != ?
    AND (
      (scheduled_start < ? AND scheduled_end > ?) OR
      (scheduled_start < ? AND scheduled_end > ?) OR
      (scheduled_start >= ? AND scheduled_end <= ?)
    )
`, [facility_id, appointment_id, ...timeParams]);

if (conflicts.length > 0) {
  return error: "Time conflict detected"
}
```

**All checks pass?** → Proceed to Step 6

---

### **Step 6: Accept Appointment into Slot**

**Who:** Backend System  
**Process:**
1. Start database transaction
2. Update slot:
   - `slot_status` = 'booked'
   - `appointment_id` = appointment_id
3. Update appointment:
   - `status` = 'confirmed' (if currently 'scheduled')
4. Commit transaction
5. Log audit entry
6. Return success response

**Database Transaction:**
```sql
START TRANSACTION;

-- Update slot
UPDATE availability_slots
SET slot_status = 'booked',
    appointment_id = 'appt-456'
WHERE slot_id = 'slot-123';

-- Update appointment
UPDATE appointments
SET status = 'confirmed'
WHERE appointment_id = 'appt-456'
  AND status = 'scheduled';

COMMIT;
```

**After Transaction:**
```sql
availability_slots:
- slot_id: "slot-123"
- slot_status: "booked"  ← Changed from 'available'
- appointment_id: "appt-456"  ← Now linked

appointments:
- appointment_id: "appt-456"
- status: "confirmed"  ← Changed from 'scheduled'
```

**Response:**
```json
{
  "success": true,
  "message": "Appointment accepted into slot successfully",
  "data": {
    "slot_id": "slot-123",
    "slot_status": "booked",
    "appointment_id": "appt-456",
    "patient_name": "John Doe",
    ...
  },
  "scenario": "success"
}
```

---

### **Step 7: Frontend Updates**

**Who:** Frontend Component  
**Process:**
1. Receives success response
2. Shows success toast notification
3. Refreshes slots list (`fetchSlots()`)
4. Refreshes appointments list (`fetchAppointments()`)
5. Closes modal
6. Updates UI to show slot as "booked"

**Visual Changes:**
- Slot card border changes from green to blue
- Status badge changes to "BOOKED"
- Appointment info appears in slot card
- "Accept Appointment" button disappears

---

### **Step 8: Appointment Cancellation (Frees Slot)**

**Who:** Patient, Provider, or Admin  
**Endpoint:** `DELETE /api/appointments/:id`

**Process:**
1. User cancels appointment
2. System starts transaction
3. Updates appointment:
   - `status` = 'cancelled'
   - `cancelled_at` = NOW()
   - `cancelled_by` = user_id
4. **Frees the slot:**
   - `slot_status` = 'available'
   - `appointment_id` = NULL
5. Commits transaction
6. Logs audit entry

**Database Transaction:**
```sql
START TRANSACTION;

-- Cancel appointment
UPDATE appointments
SET status = 'cancelled',
    cancelled_at = NOW(),
    cancelled_by = 'user-uuid'
WHERE appointment_id = 'appt-456';

-- Free the slot
UPDATE availability_slots
SET slot_status = 'available',
    appointment_id = NULL
WHERE appointment_id = 'appt-456';

COMMIT;
```

**After Transaction:**
```sql
availability_slots:
- slot_id: "slot-123"
- slot_status: "available"  ← Freed!
- appointment_id: NULL  ← Cleared

appointments:
- appointment_id: "appt-456"
- status: "cancelled"
```

**Result:** Slot becomes available again for other appointments

---

## 🔍 Error Scenarios Flow

### **Scenario A: Slot Already Booked**
```
User clicks "Accept Appointment"
  ↓
Backend checks: slot_status === 'booked'
  ↓
Returns error: "Slot is already booked"
  ↓
Frontend shows error toast
  ↓
User cannot proceed
```

### **Scenario B: Time Mismatch**
```
User selects appointment
  ↓
Backend checks: appointment time vs slot time
  ↓
Appointment: 09:00-10:00
Slot: 08:00-09:00
  ↓
Returns error: "Appointment time does not match slot time"
  ↓
Frontend shows error toast
  ↓
User must select different appointment or slot
```

### **Scenario C: Provider Mismatch**
```
User selects appointment
  ↓
Backend checks: slot.provider_id vs appointment.provider_id
  ↓
Slot provider: Dr. Smith
Appointment provider: Dr. Jones
  ↓
Returns error: "Provider mismatch"
  ↓
Frontend shows error toast
```

---

## 📊 State Transitions

### **Slot Status Flow:**
```
available → booked → available (on cancellation)
available → blocked (admin action)
available → unavailable (admin action)
```

### **Appointment Status Flow:**
```
scheduled → confirmed (when accepted into slot)
scheduled → cancelled (if cancelled before slot assignment)
confirmed → cancelled (frees slot)
```

---

## 🎯 Key Points

1. **Slots are created independently** - Providers create availability slots in advance
2. **Appointments can be booked without slots** - System works even if no slots exist
3. **Slot assignment is manual** - Provider/admin must explicitly accept appointment into slot
4. **Validation is comprehensive** - 9 different error scenarios are checked
5. **Cancellation frees slots** - When appointment is cancelled, slot becomes available again
6. **Real-time updates** - Frontend refreshes data after operations

---

## 🔄 Alternative Flows

### **Flow A: Automatic Slot Assignment (Future Enhancement)**
```
Patient books appointment
  ↓
System automatically finds matching available slot
  ↓
Automatically assigns appointment to slot
  ↓
Both updated in single transaction
```

### **Flow B: Bulk Slot Creation**
```
Provider creates multiple slots at once
  ↓
System creates slots for date range
  ↓
All slots start as 'available'
```

---

## 📝 Summary

The flow ensures:
- ✅ Providers can manage their availability
- ✅ Appointments can be properly scheduled
- ✅ System validates all business rules
- ✅ Slots are properly tracked and freed
- ✅ Users get clear feedback on all operations

This creates a robust appointment scheduling system with proper slot management!

