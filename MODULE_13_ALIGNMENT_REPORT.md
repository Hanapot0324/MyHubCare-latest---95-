# Module 13: Medication Reminders - Alignment Report

## Executive Summary

Module 13 (Medication Reminders) is **partially implemented** across backend, frontend, and database. The core functionality exists, but there are several gaps and misalignments that need to be addressed for full compliance with the DATABASE_STRUCTURE.md specification.

---

## 1. Database Schema Alignment

### ✅ **What's Aligned:**

1. **Table Structure**: The `medication_reminders` table exists in SQL with all required columns:
   - `reminder_id` (PRIMARY KEY)
   - `prescription_id` (nullable FK)
   - `patient_id` (NOT NULL FK)
   - `medication_name` (VARCHAR(150))
   - `dosage` (VARCHAR(50))
   - `frequency` (VARCHAR(50))
   - `reminder_time` (TIME)
   - `sound_preference` (ENUM: 'default', 'gentle', 'urgent')
   - `browser_notifications` (BOOLEAN)
   - `special_instructions` (TEXT)
   - `active` (BOOLEAN)
   - `missed_doses` (INTEGER)
   - `created_at`, `updated_at` (TIMESTAMPTZ)

### ❌ **What's Missing/Incorrect:**

1. **Indexes**: Missing recommended indexes from DATABASE_STRUCTURE.md:
   - ❌ `idx_medication_reminders_patient_id` - Only basic `patient_id` key exists
   - ❌ `idx_medication_reminders_prescription_id` - Only basic `prescription_id` key exists
   - ❌ `idx_medication_reminders_active` - **MISSING** - Critical for querying active reminders

2. **Foreign Key Constraints**: 
   - ❌ No explicit FOREIGN KEY constraints defined in SQL
   - ❌ Should have: `FOREIGN KEY (patient_id) REFERENCES patients(patient_id)`
   - ❌ Should have: `FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id)`

3. **Data Type Consistency**:
   - ⚠️ SQL uses `char(36)` for UUIDs, but DATABASE_STRUCTURE.md specifies `UUID` (PostgreSQL type)
   - ⚠️ SQL uses `tinyint(1)` for BOOLEAN, but DATABASE_STRUCTURE.md specifies `BOOLEAN`
   - ⚠️ SQL uses `datetime` for TIMESTAMPTZ, but DATABASE_STRUCTURE.md specifies `TIMESTAMPTZ`

---

## 2. Backend Implementation Alignment

### ✅ **What's Implemented:**

1. **API Routes** (`backend/routes/medication-adherence.js`):
   - ✅ `GET /api/medication-adherence/reminders` - List reminders with filters
   - ✅ `POST /api/medication-adherence/reminders` - Create reminder
   - ✅ `PUT /api/medication-adherence/reminders/:id` - Update reminder
   - ✅ `DELETE /api/medication-adherence/reminders/:id` - Delete reminder
   - ✅ `PUT /api/medication-adherence/reminders/:id/toggle` - Toggle active status
   - ✅ All routes include audit logging
   - ✅ Validation and error handling

2. **Integration with Adherence Tracking**:
   - ✅ Updates `missed_doses` when adherence is recorded as missed
   - ✅ Links reminders to prescriptions

3. **Auto-Creation**:
   - ✅ Reminders are auto-created when prescriptions are dispensed (in `prescriptions.js`)

### ❌ **What's Missing:**

1. **Medication Reminder Processing Service**:
   - ❌ **CRITICAL**: No backend service to process medication reminders at scheduled times
   - ❌ `reminderService.js` only handles **appointment reminders**, not medication reminders
   - ❌ No scheduled job/cron to check and trigger medication reminders
   - ❌ No server-side notification sending for medication reminders

2. **Notification Channels**:
   - ❌ No SMS notification support for medication reminders
   - ❌ No email notification support for medication reminders
   - ❌ No in-app notification creation for medication reminders (unlike appointment reminders)

3. **Sound Preference Implementation**:
   - ❌ No backend logic to handle `sound_preference` field
   - ❌ Field exists in database but not utilized

4. **Frequency-Based Scheduling**:
   - ❌ No logic to calculate next reminder time based on `frequency` field
   - ❌ Module 13 spec says: "Calculate next reminder time based on `frequency` and `reminder_time`"
   - ❌ Currently only uses single `reminder_time`, doesn't handle multiple daily doses

---

## 3. Frontend Implementation Alignment

### ✅ **What's Implemented:**

1. **Component**: `MedicationAdherence.jsx` exists with:
   - ✅ Reminder list display
   - ✅ Add/Edit/Delete reminder modals
   - ✅ Toggle active status
   - ✅ Display missed doses count
   - ✅ Client-side notification checking (checks every minute)
   - ✅ Browser notification support
   - ✅ Sound notification support (client-side)

2. **UI Features**:
   - ✅ Form fields for all reminder properties
   - ✅ Sound preference selector
   - ✅ Browser notification toggle
   - ✅ Special instructions field
   - ✅ Adherence tracking integration

### ⚠️ **What's Partially Implemented:**

1. **Client-Side Time Checking**:
   - ⚠️ Frontend checks reminder times every minute (client-side)
   - ⚠️ Relies on browser's local time, not server time
   - ⚠️ No synchronization with server
   - ⚠️ If user closes browser, reminders won't trigger

2. **Notification Permissions**:
   - ⚠️ Requests browser notification permission
   - ⚠️ But no fallback if permission denied

### ❌ **What's Missing:**

1. **Server-Side Integration**:
   - ❌ No API call to check for due reminders
   - ❌ No WebSocket/Socket.IO integration for real-time reminders
   - ❌ No polling mechanism to fetch reminders from server

2. **Mobile Support**:
   - ❌ Module 13 mentions "mobile reminders" but no mobile-specific implementation
   - ❌ No push notification support for mobile devices

---

## 4. System Flow Alignment

### ✅ **Aligned Flows:**

1. **Create Medication Reminder** (P13.1):
   - ✅ Patient selects medication → Enter reminder details
   - ✅ Save reminder → Save to `medication_reminders` (D4)
   - ✅ Log audit entry to `audit_log` (D8)

### ❌ **Missing Flows:**

1. **Trigger Reminder** (P13.2):
   - ❌ **NOT IMPLEMENTED**: System should check `medication_reminders` where `active = true` AND `reminder_time = CURRENT_TIME`
   - ❌ **NOT IMPLEMENTED**: Send browser notification → play alarm sound based on `sound_preference`
   - ❌ **NOT IMPLEMENTED**: Patient acknowledges → update reminder status

2. **Track Missed Dose** (P13.3):
   - ⚠️ Partially implemented: Updates `missed_doses` when adherence is recorded
   - ❌ **MISSING**: Auto-detect missed doses if reminder not acknowledged
   - ❌ **MISSING**: Update adherence → save to `medication_adherence` (D4) automatically

---

## 5. Recommendations

### 🔴 **Critical (Must Fix):**

1. **Create Medication Reminder Processing Service**:
   ```javascript
   // backend/services/reminderService.js
   // Add: processMedicationReminders()
   ```
   - Create a function similar to `processAppointmentReminders()` but for medication reminders
   - Check `medication_reminders` table where `active = true` and `reminder_time = CURRENT_TIME`
   - Send notifications via multiple channels (in-app, SMS, email)
   - Schedule to run every minute via cron job in `server.js`

2. **Add Missing Database Indexes**:
   ```sql
   ALTER TABLE medication_reminders
   ADD INDEX idx_medication_reminders_active (active),
   ADD INDEX idx_medication_reminders_reminder_time (reminder_time);
   ```

3. **Add Foreign Key Constraints**:
   ```sql
   ALTER TABLE medication_reminders
   ADD CONSTRAINT fk_medication_reminders_patient
     FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
   ADD CONSTRAINT fk_medication_reminders_prescription
     FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id);
   ```

4. **Implement Server-Side Notification Sending**:
   - Send in-app notifications via notifications API
   - Integrate SMS service for medication reminders
   - Integrate email service for medication reminders

### 🟡 **High Priority (Should Fix):**

5. **Implement Frequency-Based Scheduling**:
   - Parse `frequency` field (e.g., "Twice daily", "Every 8 hours")
   - Calculate multiple reminder times per day
   - Store next reminder time or use calculation logic

6. **Add WebSocket/Socket.IO Integration**:
   - Emit medication reminder events to connected clients
   - Real-time notification delivery
   - Better than client-side polling

7. **Improve Missed Dose Detection**:
   - Auto-detect if reminder not acknowledged within time window
   - Automatically update `medication_adherence` table
   - Increment `missed_doses` counter

8. **Add Reminder Acknowledgment Tracking**:
   - Add `acknowledged_at` timestamp field
   - Track when patient acknowledges reminder
   - Use for missed dose detection

### 🟢 **Medium Priority (Nice to Have):**

9. **Mobile Push Notifications**:
   - Integrate with Firebase Cloud Messaging (FCM) or similar
   - Support for mobile app reminders

10. **Reminder History**:
    - Track when reminders were sent
    - Track acknowledgment status
    - Add `reminder_history` table or log to audit_log

11. **Sound Preference Implementation**:
    - Backend should store sound preference
    - Frontend should play different sounds based on preference
    - Add sound files for 'gentle', 'urgent', 'default'

12. **Multiple Daily Doses**:
    - Support multiple reminder times per day
    - Store array of times or use frequency calculation
    - Update schema if needed

---

## 6. Implementation Checklist

### Database:
- [ ] Add `idx_medication_reminders_active` index
- [ ] Add `idx_medication_reminders_reminder_time` index
- [ ] Add foreign key constraints for `patient_id` and `prescription_id`
- [ ] Consider adding `acknowledged_at` timestamp field
- [ ] Consider adding `last_triggered_at` timestamp field

### Backend:
- [ ] Create `processMedicationReminders()` function in `reminderService.js`
- [ ] Add scheduled job in `server.js` to run every minute
- [ ] Implement in-app notification sending for medication reminders
- [ ] Implement SMS notification for medication reminders
- [ ] Implement email notification for medication reminders
- [ ] Add frequency parsing logic for multiple daily doses
- [ ] Add missed dose auto-detection logic
- [ ] Add reminder acknowledgment endpoint

### Frontend:
- [ ] Add WebSocket listener for medication reminder events
- [ ] Improve notification permission handling
- [ ] Add sound playback based on `sound_preference`
- [ ] Add reminder acknowledgment UI
- [ ] Add mobile push notification support (if mobile app exists)

### Testing:
- [ ] Test reminder triggering at scheduled time
- [ ] Test multiple notification channels
- [ ] Test missed dose detection
- [ ] Test frequency-based scheduling
- [ ] Test sound preferences

---

## 7. Code Examples

### Example: Medication Reminder Processing Service

```javascript
// backend/services/reminderService.js

/**
 * Process medication reminders that are due to be sent
 * This should be called periodically (e.g., every minute via cron job)
 */
export async function processMedicationReminders() {
  try {
    // Get all active reminders that are due now (within current minute)
    const [reminders] = await db.query(`
      SELECT 
        mr.*,
        p.first_name,
        p.last_name,
        p.contact_phone AS phone_number,
        p.email,
        u.user_id AS patient_user_id
      FROM medication_reminders mr
      INNER JOIN patients p ON mr.patient_id = p.patient_id
      LEFT JOIN users u ON p.created_by = u.user_id OR p.email = u.email
      WHERE mr.active = 1
        AND TIME(mr.reminder_time) = TIME(NOW())
        AND DATE(mr.last_triggered_at) != CURDATE() -- Don't trigger twice in same day
    `);

    console.log(`Processing ${reminders.length} medication reminders...`);

    for (const reminder of reminders) {
      try {
        await sendMedicationReminder(reminder);
        
        // Update last_triggered_at
        await db.query(`
          UPDATE medication_reminders
          SET last_triggered_at = NOW()
          WHERE reminder_id = ?
        `, [reminder.reminder_id]);
        
        console.log(`Medication reminder sent successfully: ${reminder.reminder_id}`);
      } catch (error) {
        console.error(`Error sending medication reminder ${reminder.reminder_id}:`, error);
      }
    }

    return { success: true, processed: reminders.length };
  } catch (error) {
    console.error('Error processing medication reminders:', error);
    return { success: false, error: error.message };
  }
}

async function sendMedicationReminder(reminder) {
  const {
    reminder_id,
    patient_id,
    medication_name,
    dosage,
    frequency,
    sound_preference,
    browser_notifications,
    special_instructions,
    patient_user_id,
    phone_number,
    email,
    first_name,
    last_name
  } = reminder;

  const patientName = `${first_name || ''} ${last_name || ''}`.trim() || 'Patient';
  const message = `Time to take ${medication_name}${dosage ? ` (${dosage})` : ''}${special_instructions ? `. ${special_instructions}` : ''}`;

  // Send in-app notification
  if (patient_user_id) {
    await createNotification({
      recipient_id: patient_user_id,
      patient_id: patient_id,
      title: 'Medication Reminder',
      message: message,
      type: 'medication_reminder',
      payload: JSON.stringify({
        reminder_id,
        medication_name,
        dosage,
        sound_preference
      })
    });
  }

  // Send SMS if enabled and phone number exists
  if (browser_notifications && phone_number) {
    await sendSMSReminder(phone_number, patientName, message, reminder);
  }

  // Send email if enabled and email exists
  if (browser_notifications && email) {
    await sendEmailReminder(email, patientName, message, reminder);
  }
}
```

### Example: Add to server.js

```javascript
// In server.js, add alongside processAppointmentReminders:

import { processAppointmentReminders, processMedicationReminders } from './services/reminderService.js';

// In server.listen callback:
setInterval(async () => {
  try {
    await processAppointmentReminders();
    await processMedicationReminders(); // Add this
  } catch (error) {
    console.error('Error processing reminders:', error);
  }
}, 60000); // Run every 60 seconds
```

---

## 8. Summary

**Current Status**: Module 13 is **60% complete**

**Critical Gaps**:
1. No server-side medication reminder processing
2. Missing database indexes
3. No foreign key constraints
4. No multi-channel notification support

**Priority Actions**:
1. Implement `processMedicationReminders()` service (Critical)
2. Add missing database indexes (Critical)
3. Add scheduled job in server.js (Critical)
4. Implement notification channels (High)
5. Add frequency-based scheduling (High)

**Estimated Effort**: 
- Critical fixes: 4-6 hours
- High priority: 6-8 hours
- Medium priority: 4-6 hours
- **Total**: 14-20 hours

---

**Report Generated**: 2025-01-XX
**Reviewed By**: AI Assistant
**Status**: Ready for Implementation

