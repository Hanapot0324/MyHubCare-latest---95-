# Appointment System Flow & Component Connections

## Overview
This document explains the flow and connections between the appointment-related components in the MyHubCare system.

## Component Hierarchy & Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    DOCTOR ASSIGNMENTS                           │
│  (DoctorAssignments.jsx)                                        │
│  - Admin/Case Manager creates doctor schedules                 │
│  - Defines: Provider, Facility, Date Range, Days, Time Windows │
│  - Automatically generates AVAILABILITY SLOTS                   │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ Generates
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                  AVAILABILITY SLOTS                              │
│  (AvailabilitySlots.jsx)                                         │
│  - Shows slots generated from assignments                       │
│  - Can manually create additional slots                         │
│  - Status: available, booked, blocked, unavailable              │
│  - Staff can "Accept Appointment" into a slot                   │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ Used for booking
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APPOINTMENT REQUESTS                          │
│  (MyAppointments.jsx - Patient View)                            │
│  - Patient creates appointment request                          │
│  - Status: pending → approved/declined                           │
│  - Case Manager reviews and approves                            │
│  - When approved → Creates APPOINTMENT                          │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ When approved
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPOINTMENTS                                │
│  (Appointment.jsx - Staff View)                                 │
│  (MyAppointments.jsx - Patient View)                           │
│  - Created by:                                                  │
│    1. Staff directly (physician/case_manager/admin)            │
│    2. Approved appointment request                              │
│  - Can be assigned to availability slot                        │
│  - Status: scheduled → confirmed → completed/cancelled       │
└─────────────────────────────────────────────────────────────────┘
```

## Detailed Flow

### 1. **Doctor Assignments** → **Availability Slots**

**Component:** `DoctorAssignments.jsx`
- **Purpose:** Define when doctors are available at facilities
- **Who uses it:** Admin, Case Managers
- **What it does:**
  - Creates assignments: Provider + Facility + Date Range + Days of Week + Time Windows
  - Automatically generates hourly availability slots for each day
  - Can add conflicts (blocked time periods)
  - Conflicts mark overlapping slots as "blocked"

**Flow:**
```
Assignment Created
    ↓
generateSlotsFromAssignment()
    ↓
Creates hourly slots (e.g., 9:00-10:00, 10:00-11:00, etc.)
    ↓
Slots stored in availability_slots table
    ↓
If conflicts exist → applyConflictsToSlots() → marks slots as "blocked"
```

### 2. **Availability Slots** → **Appointments**

**Component:** `AvailabilitySlots.jsx`
- **Purpose:** Manage and view availability slots, accept appointments into slots
- **Who uses it:** Admin, Physicians, Case Managers
- **What it does:**
  - View all availability slots (from assignments + manually created)
  - Filter by facility, provider, date, status
  - Manually create additional slots (single or bulk)
  - Accept appointments into available slots
  - Shows slot status: available, booked, blocked, unavailable

**Flow:**
```
View Available Slots
    ↓
Select slot → "Accept Appointment"
    ↓
Choose from list of scheduled appointments
    ↓
Validates:
  - Slot is available
  - Appointment time fits in slot
  - Provider/facility match
  - No conflicts
    ↓
Updates slot: status = "booked", appointment_id linked
    ↓
Updates appointment: status = "confirmed"
```

### 3. **Patient Appointment Request** → **Appointment**

**Component:** `MyAppointments.jsx` (Patient View)
- **Purpose:** Patients request appointments
- **Who uses it:** Patients
- **What it does:**
  - Patient fills form: Date, Time, Facility, Provider (optional), Type, Notes
  - Creates appointment request (not direct appointment)
  - Request status: "pending"
  - Case Manager reviews and approves/declines

**Flow:**
```
Patient creates request
    ↓
POST /api/appointment-requests
    ↓
Creates appointment_request record (status: "pending")
    ↓
Notifies case managers
    ↓
Case Manager reviews in Appointment Requests view
    ↓
Case Manager approves → Creates appointment
    ↓
Appointment created with status: "scheduled"
    ↓
Can be assigned to availability slot later
```

### 4. **Staff Direct Appointment Creation**

**Component:** `Appointment.jsx` (Staff View)
- **Purpose:** Staff create appointments directly
- **Who uses it:** Physicians, Case Managers, Admins
- **What it does:**
  - Staff can book appointments directly (no approval needed)
  - Creates appointment with status: "confirmed" (for staff) or "scheduled" (for patients)
  - Checks availability before creating
  - Can assign provider or leave unassigned

**Flow:**
```
Staff fills appointment form
    ↓
Checks availability (checkAvailabilityForRequest)
    ↓
Validates:
  - No conflicting appointments
  - No doctor conflicts
  - Available slots exist (if assignments exist)
    ↓
Creates appointment (status: "confirmed" for staff)
    ↓
Can be assigned to slot later via AvailabilitySlots
```

### 5. **Viewing Appointments**

**Component:** `Appointment.jsx` (Staff View)
- **Purpose:** View and manage all appointments
- **Who uses it:** Physicians, Case Managers, Admins
- **Features:**
  - Calendar view with all appointments
  - List view filtered by date
  - Edit appointments (provider assignment)
  - Cancel appointments
  - Real-time updates via Socket.IO

**Component:** `MyAppointments.jsx` (Patient View)
- **Purpose:** View own appointments
- **Who uses it:** Patients
- **Features:**
  - Calendar view (shows time slots, not patient names for privacy)
  - List view: All, Upcoming, Past, Requested
  - View appointment requests status
  - Book new appointments (creates requests)
  - Cancel own appointments (if not confirmed)
  - View time slot availability when clicking dates
  - Real-time notifications

## Data Relationships

```
doctor_assignments
    ↓ (assignment_id)
availability_slots
    ↓ (appointment_id)
appointments
    ↑ (appointment_id)
appointment_requests
```

### Key Tables:

1. **doctor_assignments**
   - Defines provider schedules
   - Generates availability_slots automatically

2. **availability_slots**
   - Created from assignments OR manually
   - Can be linked to appointments
   - Status: available, booked, blocked, unavailable

3. **appointments**
   - Can be created directly by staff
   - Can be created from approved appointment_requests
   - Can be assigned to availability_slots

4. **appointment_requests**
   - Created by patients
   - Reviewed by case managers
   - When approved, creates appointment

5. **doctor_conflicts**
   - Blocks specific time periods within assignments
   - Marks overlapping slots as "blocked"

## User Roles & Permissions

### **Patient**
- ✅ View own appointments (`MyAppointments.jsx`)
- ✅ Create appointment requests
- ✅ Cancel own appointments (if not confirmed)
- ❌ Cannot create direct appointments
- ❌ Cannot manage availability slots
- ❌ Cannot manage doctor assignments

### **Physician**
- ✅ View all appointments (`Appointment.jsx`)
- ✅ Create direct appointments
- ✅ Edit appointments (provider assignment)
- ✅ Cancel appointments
- ✅ Manage availability slots (`AvailabilitySlots.jsx`)
- ✅ Accept appointments into slots
- ❌ Cannot manage doctor assignments

### **Case Manager**
- ✅ View all appointments (`Appointment.jsx`)
- ✅ Create direct appointments
- ✅ Edit appointments
- ✅ Cancel appointments
- ✅ Approve/decline appointment requests
- ✅ Manage availability slots (`AvailabilitySlots.jsx`)
- ✅ Accept appointments into slots
- ❌ Cannot manage doctor assignments

### **Admin**
- ✅ All permissions above
- ✅ Manage doctor assignments (`DoctorAssignments.jsx`)
- ✅ Create conflicts in assignments
- ✅ Full system access

## Real-Time Features

All components use **Socket.IO** for real-time updates:

1. **Appointment.jsx**
   - Listens: `newAppointment`, `appointmentNotification`
   - Refreshes every 30 seconds

2. **MyAppointments.jsx**
   - Listens: `newNotification`
   - Joins user room for notifications
   - Shows notification dropdown with unread count

3. **AvailabilitySlots.jsx**
   - Listens: `newNotification`, `appointmentUpdated`, `appointmentCancelled`
   - Refreshes slots when appointments change
   - Periodic refresh every 30 seconds

## Key API Endpoints

### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment
- `GET /api/appointments/availability/check` - Check availability
- `GET /api/appointments/availability/slots` - Get availability slots

### Appointment Requests
- `GET /api/appointment-requests` - List requests
- `POST /api/appointment-requests` - Create request
- `POST /api/appointment-requests/:id/approve` - Approve request
- `POST /api/appointment-requests/:id/decline` - Decline request

### Availability Slots
- `GET /api/appointments/availability/slots` - List slots
- `POST /api/appointments/availability/slots` - Create slot
- `POST /api/appointments/availability/slots/:slotId/accept-appointment` - Accept appointment

### Doctor Assignments
- `GET /api/doctor-assignments` - List assignments
- `POST /api/doctor-assignments` - Create assignment (generates slots)
- `PUT /api/doctor-assignments/:id` - Update assignment
- `DELETE /api/doctor-assignments/:id` - Delete assignment

## Common Workflows

### Workflow 1: Patient Books Appointment
```
1. Patient opens MyAppointments.jsx
2. Clicks "Book Appointment"
3. Fills form → Creates appointment request
4. Request appears in "Requested" filter (status: pending)
5. Case Manager reviews in Appointment Requests
6. Case Manager approves → Creates appointment
7. Appointment appears in patient's "All" appointments
8. Staff can assign to availability slot if needed
```

### Workflow 2: Staff Books Appointment
```
1. Staff opens Appointment.jsx
2. Clicks "Book Appointment"
3. Fills form → Creates appointment directly (status: confirmed)
4. Appointment appears in calendar/list
5. Optionally assign to availability slot via AvailabilitySlots.jsx
```

### Workflow 3: Setup Provider Schedule
```
1. Admin opens DoctorAssignments.jsx
2. Creates assignment: Provider + Facility + Dates + Days + Times
3. System automatically generates availability slots
4. Admin can add conflicts to block specific times
5. Slots appear in AvailabilitySlots.jsx
6. Staff can accept appointments into these slots
```

### Workflow 4: Accept Appointment into Slot
```
1. Staff opens AvailabilitySlots.jsx
2. Views available slots (from assignments)
3. Clicks "Accept Appointment" on a slot
4. Selects from list of scheduled appointments
5. System validates:
   - Slot is available
   - Appointment time fits
   - Provider/facility match
   - No conflicts
6. Updates slot: status = "booked", links appointment_id
7. Updates appointment: status = "confirmed"
```

## State Management

Each component manages its own state:
- **Appointments list** - Fetched from API, refreshed on changes
- **Availability slots** - Fetched from API, refreshed on appointment changes
- **Filters** - Local state (facility, provider, date, status)
- **Real-time updates** - Socket.IO listeners update state

## Error Handling

All components handle:
- API errors with toast notifications
- Validation errors (time conflicts, missing fields)
- Permission errors (403 responses)
- Network errors with retry logic

