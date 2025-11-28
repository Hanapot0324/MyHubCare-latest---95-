import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { authenticateToken } from './auth.js';
import { logAudit, getUserInfoForAudit, getClientIp } from '../utils/auditLogger.js';
import { notifyAppointmentCreated } from './notifications.js';
import { calculateARPARiskScore } from '../services/arpaService.js';

const router = express.Router();

// Socket.IO instance (will be set by server.js)
let io = null;

// Function to set Socket.IO instance
export const setSocketIO = (socketIO) => {
  io = socketIO;
};

// Helper function to clean undefined values
function clean(obj) {
  const cleaned = {};
  for (const key in obj) {
    cleaned[key] = obj[key] === undefined ? null : obj[key];
  }
  return cleaned;
}

// GET /api/appointments - Get all appointments with filters
router.get('/', authenticateToken, async (req, res) => {
  console.log('=== GET /api/appointments ===');
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('Request query:', JSON.stringify(req.query, null, 2));
  console.log('Request user:', JSON.stringify(req.user, null, 2));
  
  try {
    const { 
      patient_id, 
      provider_id, 
      facility_id, 
      status, 
      date_from, 
      date_to,
      appointment_type 
    } = req.query;

    console.log('Query parameters:', {
      patient_id,
      provider_id,
      facility_id,
      status,
      date_from,
      date_to,
      appointment_type
    });

    let query = `
      SELECT 
        a.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        u.full_name AS provider_name,
        f.facility_name,
        u2.full_name AS booked_by_name,
        u3.full_name AS cancelled_by_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.patient_id
      LEFT JOIN users u ON a.provider_id = u.user_id
      LEFT JOIN facilities f ON a.facility_id = f.facility_id
      LEFT JOIN users u2 ON a.booked_by = u2.user_id
      LEFT JOIN users u3 ON a.cancelled_by = u3.user_id
      WHERE 1=1
    `;

    const params = [];

    // Role-based filtering
    if (req.user.role === 'patient') {
      // Patients only see their own appointments
      // Get patient_id from user's linked patient record
      console.log('🔍 Patient role detected, looking up patient_id for user:', req.user.user_id);
      const [patientRows] = await db.query(`
        SELECT patient_id FROM patients 
        WHERE created_by = ? OR email IN (SELECT email FROM users WHERE user_id = ?)
        LIMIT 1
      `, [req.user.user_id, req.user.user_id]);
      
      if (patientRows.length > 0) {
        const patientId = patientRows[0].patient_id;
        console.log('✅ Found patient_id:', patientId);
        
        // Debug: Check if appointments exist for this patient
        const [apptCheck] = await db.query(
          'SELECT COUNT(*) as count, patient_id FROM appointments WHERE patient_id = ? GROUP BY patient_id',
          [patientId]
        );
        console.log('📊 Appointments check for patient:', {
          patient_id: patientId,
          appointment_count: apptCheck[0]?.count || 0,
          all_appointments_in_db: apptCheck.length > 0 ? apptCheck[0] : 'none'
        });
        
        query += ' AND a.patient_id = ?';
        params.push(patientId);
      } else {
        console.log('❌ No patient record found for user:', req.user.user_id);
        // If no patient record found, return empty results
        query += ' AND 1=0';
      }
    } else if (req.user.role === 'case_manager') {
      // Case managers see appointments for their facility by default
      // Only filter by facility_id if not explicitly provided in query
      if (!facility_id && req.user.facility_id) {
        query += ' AND a.facility_id = ?';
        params.push(req.user.facility_id);
        console.log('Case manager: Auto-filtering by facility_id:', req.user.facility_id);
      }
    } else if (req.user.role === 'physician') {
      // Physicians see appointments assigned to them by default
      // Only filter by provider_id if not explicitly provided in query
      if (!provider_id && req.user.user_id) {
        query += ' AND a.provider_id = ?';
        params.push(req.user.user_id);
        console.log('Physician: Auto-filtering by provider_id:', req.user.user_id);
      }
    }
    // Admins see all appointments (no automatic filtering)

    if (patient_id) {
      query += ' AND a.patient_id = ?';
      params.push(patient_id);
    }

    if (provider_id) {
      query += ' AND a.provider_id = ?';
      params.push(provider_id);
    }

    if (facility_id) {
      query += ' AND a.facility_id = ?';
      params.push(facility_id);
    }

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    if (appointment_type) {
      query += ' AND a.appointment_type = ?';
      params.push(appointment_type);
    }

    if (date_from) {
      query += ' AND DATE(a.scheduled_start) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      query += ' AND DATE(a.scheduled_start) <= ?';
      params.push(date_to);
    }

    query += ' ORDER BY a.scheduled_start DESC'; // Module 6: newest on top, oldest at bottom

    console.log('Executing query:', query);
    console.log('Query params:', params);

    // Debug: Check total appointments in database (for admins)
    if (req.user.role === 'admin') {
      const [totalCount] = await db.query('SELECT COUNT(*) as total FROM appointments');
      console.log('📊 Total appointments in database:', totalCount[0]?.total || 0);
    }

    const [appointments] = await db.query(query, params);

    console.log('Query successful. Found', appointments.length, 'appointments');
    
    // Debug: Log first few appointments if found
    if (appointments.length > 0) {
      console.log('📋 Sample appointments:', appointments.slice(0, 3).map(apt => ({
        appointment_id: apt.appointment_id,
        patient_id: apt.patient_id,
        facility_id: apt.facility_id,
        status: apt.status,
        scheduled_start: apt.scheduled_start
      })));
    } else {
      console.log('⚠️ No appointments found. Checking if query is too restrictive...');
      // For debugging: try a simpler query to see if any appointments exist
      if (req.user.role === 'admin') {
        try {
          const [allAppointments] = await db.query('SELECT appointment_id, patient_id, facility_id, status, scheduled_start FROM appointments LIMIT 5');
          console.log('🔍 All appointments in DB (sample):', allAppointments);
          
          // Also check if there are appointments with the user's facility_id
          if (req.user.facility_id) {
            const [facilityAppointments] = await db.query(
              'SELECT COUNT(*) as count FROM appointments WHERE facility_id = ?',
              [req.user.facility_id]
            );
            console.log('🏥 Appointments for facility', req.user.facility_id + ':', facilityAppointments[0]?.count || 0);
          }
        } catch (debugError) {
          console.error('Error in debug query:', debugError);
        }
      }
      
      // For patients, check if patient_id exists in appointments
      if (req.user.role === 'patient') {
        try {
          const [patientRows] = await db.query(`
            SELECT patient_id FROM patients 
            WHERE created_by = ? OR email IN (SELECT email FROM users WHERE user_id = ?)
            LIMIT 1
          `, [req.user.user_id, req.user.user_id]);
          
          if (patientRows.length > 0) {
            const patientId = patientRows[0].patient_id;
            const [patientApptCount] = await db.query(
              'SELECT COUNT(*) as count FROM appointments WHERE patient_id = ?',
              [patientId]
            );
            console.log('👤 Appointments for patient', patientId + ':', patientApptCount[0]?.count || 0);
          }
        } catch (debugError) {
          console.error('Error checking patient appointments:', debugError);
        }
      }
    }

    res.json({ 
      success: true, 
      data: appointments,
      count: appointments.length
    });
  } catch (error) {
    console.error('=== ERROR fetching appointments ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error details:', JSON.stringify(error, null, 2));
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch appointments',
      error: error.message 
    });
  }
});

// GET /api/appointments/date/:date - Get appointments for a specific date
// NOTE: This route must come BEFORE /:id to avoid route conflicts
router.get('/date/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;

    let query = `
      SELECT 
        a.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        u.full_name AS provider_name,
        f.facility_name,
        u2.full_name AS booked_by_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.patient_id
      LEFT JOIN users u ON a.provider_id = u.user_id
      LEFT JOIN facilities f ON a.facility_id = f.facility_id
      LEFT JOIN users u2 ON a.booked_by = u2.user_id
      WHERE DATE(a.scheduled_start) = ?
    `;

    const params = [date];

    // Role-based filtering
    if (req.user.role === 'patient') {
      // Patients only see their own appointments
      const [patientRows] = await db.query(`
        SELECT patient_id FROM patients 
        WHERE created_by = ? OR email IN (SELECT email FROM users WHERE user_id = ?)
        LIMIT 1
      `, [req.user.user_id, req.user.user_id]);
      
      if (patientRows.length > 0) {
        query += ' AND a.patient_id = ?';
        params.push(patientRows[0].patient_id);
      } else {
        query += ' AND 1=0';
      }
    } else if (req.user.role === 'case_manager') {
      // Case managers see appointments for their facility
      if (req.user.facility_id) {
        query += ' AND a.facility_id = ?';
        params.push(req.user.facility_id);
      }
    } else if (req.user.role === 'physician') {
      // Physicians see appointments assigned to them
      if (req.user.user_id) {
        query += ' AND a.provider_id = ?';
        params.push(req.user.user_id);
      }
    }

    query += ' ORDER BY a.scheduled_start DESC'; // Module 6: newest on top, oldest at bottom

    const [appointments] = await db.query(query, params);

    res.json({ 
      success: true, 
      data: appointments 
    });
  } catch (error) {
    console.error('Error fetching appointments by date:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch appointments',
      error: error.message 
    });
  }
});

// GET /api/appointments/:id - Get single appointment
// NOTE: This route must come AFTER /date/:date to avoid route conflicts
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [appointments] = await db.query(`
      SELECT 
        a.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        u.full_name AS provider_name,
        f.facility_name,
        u2.full_name AS booked_by_name,
        u3.full_name AS cancelled_by_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.patient_id
      LEFT JOIN users u ON a.provider_id = u.user_id
      LEFT JOIN facilities f ON a.facility_id = f.facility_id
      LEFT JOIN users u2 ON a.booked_by = u2.user_id
      LEFT JOIN users u3 ON a.cancelled_by = u3.user_id
      WHERE a.appointment_id = ?
    `, [id]);

    if (appointments.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Appointment not found' 
      });
    }

    res.json({ 
      success: true, 
      data: appointments[0] 
    });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch appointment',
      error: error.message 
    });
  }
});

// Helper function to check availability (exported for use in appointment-requests.js)
export async function checkAvailabilityForRequest(facility_id, provider_id, scheduled_start, scheduled_end) {
  try {
    const startDate = new Date(scheduled_start);
    const endDate = new Date(scheduled_end);
    const slotDate = startDate.toISOString().split('T')[0];
    const startTime = startDate.toTimeString().slice(0, 8);
    const endTime = endDate.toTimeString().slice(0, 8);

    // Check for conflicting appointments
    let conflictQuery = `
      SELECT appointment_id, scheduled_start, scheduled_end, status
      FROM appointments
      WHERE facility_id = ?
        AND status NOT IN ('cancelled', 'no_show')
        AND (
          (scheduled_start < ? AND scheduled_end > ?) OR
          (scheduled_start < ? AND scheduled_end > ?) OR
          (scheduled_start >= ? AND scheduled_end <= ?)
        )
    `;
    const conflictParams = [
      facility_id,
      scheduled_end, scheduled_start,
      scheduled_start, scheduled_end,
      scheduled_start, scheduled_end
    ];

    if (provider_id) {
      conflictQuery += ' AND provider_id = ?';
      conflictParams.push(provider_id);
    }

    const [conflicts] = await db.query(conflictQuery, conflictParams);

    // Check for doctor conflicts (if provider_id is specified)
    let doctorConflicts = [];
    if (provider_id) {
      // Check for conflicts on the requested date
      const conflictDate = slotDate;
      const [conflictSlots] = await db.query(`
        SELECT dc.*
        FROM doctor_conflicts dc
        WHERE dc.doctor_id = ?
          AND dc.conflict_date = ?
          AND (
            dc.is_all_day = TRUE OR
            (dc.start_time IS NULL AND dc.end_time IS NULL) OR
            (dc.start_time <= ? AND dc.end_time >= ?)
          )
      `, [
        provider_id,
        conflictDate,
        endTime,
        startTime
      ]);
      doctorConflicts = conflictSlots;
    }

    // Check availability slots (respecting locked/blocked status)
    let availableSlots = [];
    let slotQuery = `
      SELECT slot_id, provider_id, slot_status, appointment_id, lock_status, assignment_id
      FROM availability_slots
      WHERE facility_id = ? 
        AND slot_date = ?
        AND start_time <= ?
        AND end_time >= ?
        AND slot_status IN ('available')
        AND (lock_status = FALSE OR lock_status IS NULL)
    `;
    const slotParams = [facility_id, slotDate, endTime, startTime];

    if (provider_id) {
      slotQuery += ' AND provider_id = ?';
      slotParams.push(provider_id);
    }

    const [slots] = await db.query(slotQuery, slotParams);
    availableSlots = slots;

    // Check if slots are required (if assignments exist for this facility/provider)
    const [assignmentCheck] = await db.query(`
      SELECT COUNT(*) as count
      FROM doctor_assignments
      WHERE facility_id = ?
        ${provider_id ? 'AND doctor_id = ?' : ''}
    `, provider_id ? [facility_id, provider_id] : [facility_id]);

    const hasAssignments = assignmentCheck[0].count > 0;
    const requiresSlots = hasAssignments;

    // Determine availability
    const hasConflicts = conflicts.length > 0 || doctorConflicts.length > 0;
    const hasAvailableSlots = !requiresSlots || availableSlots.length > 0;
    const isAvailable = !hasConflicts && hasAvailableSlots;

    return {
      available: isAvailable,
      conflicts: conflicts,
      doctor_conflicts: doctorConflicts,
      available_slots: availableSlots,
      requires_slots: requiresSlots
    };
  } catch (error) {
    console.error('Error in checkAvailabilityForRequest:', error);
    throw error;
  }
}

// GET /api/appointments/availability/check - Check availability for a specific time slot
router.get('/availability/check', authenticateToken, async (req, res) => {
  try {
    console.log('=== GET /api/appointments/availability/check ===');
    const { provider_id, facility_id, scheduled_start, scheduled_end, duration_minutes = 30 } = req.query;
    
    console.log('Availability check params:', {
      provider_id,
      facility_id,
      scheduled_start,
      scheduled_end,
      duration_minutes
    });

    if (!facility_id || !scheduled_start || !scheduled_end) {
      console.error('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: facility_id, scheduled_start, scheduled_end'
      });
    }

    const startDate = new Date(scheduled_start);
    const endDate = new Date(scheduled_end);
    const slotDate = startDate.toISOString().split('T')[0];
    const startTime = startDate.toTimeString().slice(0, 8);
    const endTime = endDate.toTimeString().slice(0, 8);

    console.log('Parsed dates:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      slotDate,
      startTime,
      endTime
    });

    // Use the helper function to check availability
    const availabilityResult = await checkAvailabilityForRequest(
      facility_id,
      provider_id || null,
      scheduled_start,
      scheduled_end
    );

    const isAvailable = availabilityResult.available;
    const conflicts = availabilityResult.conflicts;
    const doctorConflicts = availabilityResult.doctor_conflicts;
    const availableSlots = availabilityResult.available_slots;
    const requiresSlots = availabilityResult.requires_slots;

    console.log('Final availability result:', {
      isAvailable,
      requiresSlots,
      availableSlotsCount: availableSlots.length,
      conflictsCount: conflicts.length,
      doctorConflictsCount: doctorConflicts.length
    });

    res.json({
      success: true,
      data: {
        available: isAvailable,
        available_slots: availableSlots,
        conflicts: conflicts,
        doctor_conflicts: doctorConflicts,
        slot_id: isAvailable && availableSlots.length > 0 ? availableSlots[0].slot_id : null,
        requires_slots: requiresSlots
      }
    });
  } catch (error) {
    console.error('❌ Error checking availability:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to check availability',
      error: error.message
    });
  }
});

// POST /api/appointments - Create new appointment
router.post('/', authenticateToken, async (req, res) => {
  console.log('=== POST /api/appointments ===');
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Request user:', JSON.stringify(req.user, null, 2));
  
 try {
    const {
      patient_id,
      provider_id,
      facility_id,
      appointment_type,
      scheduled_start,
      scheduled_end,
      duration_minutes = 30,
      reason,
      notes,
      slot_id
    } = req.body;

    // Auto-populate patient_id if user is a patient and patient_id is not provided
    let finalPatientId = patient_id;
    if (!finalPatientId && req.user.role === 'patient') {
      console.log('Patient ID not provided, but user is a patient. Looking up patient record...');
      
      let [patients] = await db.query(
        'SELECT patient_id FROM patients WHERE created_by = ? AND status = "active"',
        [req.user.user_id]
      );
      
      if (patients.length === 0) {
        const [users] = await db.query('SELECT email FROM users WHERE user_id = ?', [req.user.user_id]);
        if (users.length > 0 && users[0].email) {
          [patients] = await db.query(
            'SELECT patient_id FROM patients WHERE email = ? AND status = "active"',
            [users[0].email]
          );
        }
      }
      
      if (patients.length > 0) {
        finalPatientId = patients[0].patient_id;
        console.log('Found patient_id from user profile:', finalPatientId);
      } else {
        console.error('=== ERROR: Could not find patient record for user ===');
        return res.status(400).json({
          success: false,
          message: 'Patient record not found. Please ensure your account is linked to a patient profile.'
        });
      }
    }

    // Validation
    if (!finalPatientId || !facility_id || !appointment_type || !scheduled_start || !scheduled_end) {
      console.error('=== VALIDATION ERROR ===');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: patient_id, facility_id, appointment_type, scheduled_start, scheduled_end'
      });
    }

    // Validate appointment type
    const validTypes = ['follow_up', 'art_pickup', 'lab_test', 'counseling', 'general', 'initial'];
    if (!validTypes.includes(appointment_type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid appointment_type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Validate date is not in the past or today (no same-day booking per Module 6 spec)
    const startDate = new Date(scheduled_start);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDateOnly = new Date(startDate);
    startDateOnly.setHours(0, 0, 0, 0);

    if (startDateOnly <= today) {
      return res.status(400).json({
        success: false,
        message: 'Appointments must be scheduled at least one day in advance (no same-day booking)'
      });
    }

    // Validate hourly intervals (minutes must be 0)
    if (startDate.getMinutes() !== 0) {
      return res.status(400).json({
        success: false,
        message: 'Appointments must start on the hour (e.g., 10:00, 11:00)'
      });
    }

    // Enforce 60-minute duration (Module 6 spec requirement)
    const finalDurationMinutes = 60;
    if (duration_minutes && duration_minutes !== 60) {
      return res.status(400).json({
        success: false,
        message: 'Appointment duration must be exactly 60 minutes'
      });
    }

    // Check if patient exists
    const [patients] = await db.query('SELECT patient_id FROM patients WHERE patient_id = ?', [finalPatientId]);
    if (patients.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check if facility exists
    const [facilities] = await db.query('SELECT facility_id FROM facilities WHERE facility_id = ?', [facility_id]);
    if (facilities.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Facility not found'
      });
    }

    // Check if provider exists (if provided)
    if (provider_id) {
      const [providers] = await db.query('SELECT user_id FROM users WHERE user_id = ?', [provider_id]);
      if (providers.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Provider not found'
        });
      }
    }

    // ========================================
    // CRITICAL CHANGE: Determine initial status based on user role
    // ========================================
    let initialStatus = 'scheduled'; // Default for staff bookings
    
    // If a PATIENT is booking, set status to 'scheduled' (pending approval)
    // This will make it appear in Appointment Requests for case manager review
    if (req.user.role === 'patient') {
      initialStatus = 'scheduled'; // Will be filtered in AppointmentRequests by status
      console.log('Patient booking detected - setting status to scheduled for case manager approval');
    } else {
      // Staff bookings (admin, case_manager, physician) are auto-confirmed
      initialStatus = 'confirmed';
      console.log('Staff booking detected - setting status to confirmed');
    }

    const appointment_id = uuidv4();
    const booked_by = req.user.user_id;

    const appointmentData = clean({
      appointment_id,
      patient_id: finalPatientId,
      provider_id: provider_id || null,
      facility_id,
      appointment_type,
      scheduled_start,
      scheduled_end,
      duration_minutes: finalDurationMinutes,
      status: initialStatus,
      reason: reason || null,
      notes: notes || null,
      booked_by,
      booked_at: new Date()
    });

    // Start transaction
    await db.query('START TRANSACTION');

    try {
      // Insert appointment
      await db.query(`
        INSERT INTO appointments (
          appointment_id, patient_id, provider_id, facility_id, appointment_type,
          scheduled_start, scheduled_end, duration_minutes, status, reason, notes,
          booked_by, booked_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        appointmentData.appointment_id,
        appointmentData.patient_id,
        appointmentData.provider_id,
        appointmentData.facility_id,
        appointmentData.appointment_type,
        appointmentData.scheduled_start,
        appointmentData.scheduled_end,
        appointmentData.duration_minutes,
        appointmentData.status,
        appointmentData.reason,
        appointmentData.notes,
        appointmentData.booked_by,
        appointmentData.booked_at
      ]);

      // Commit transaction
      await db.query('COMMIT');
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

    // Log audit
    const userInfo = await getUserInfoForAudit(req.user.user_id);
    await logAudit({
      action: 'CREATE',
      table_name: 'appointments',
      record_id: appointment_id,
      user_id: req.user.user_id,
      user_name: userInfo?.username || 'Unknown',
      ip_address: getClientIp(req),
      changes: JSON.stringify(appointmentData)
    });

    // Fetch the created appointment with joins
    const [created] = await db.query(`
      SELECT 
        a.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        u.full_name AS provider_name,
        f.facility_name,
        f.address AS facility_address,
        u2.full_name AS booked_by_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.patient_id
      LEFT JOIN users u ON a.provider_id = u.user_id
      LEFT JOIN facilities f ON a.facility_id = f.facility_id
      LEFT JOIN users u2 ON a.booked_by = u2.user_id
      WHERE a.appointment_id = ?
    `, [appointment_id]);

    const createdAppointment = created[0];

    // ========================================
    // NOTIFICATION LOGIC: Send to appropriate recipients
    // ========================================
    if (req.user.role === 'patient') {
      // Patient booking - notify ALL CASE MANAGERS for approval
      try {
        const [caseManagers] = await db.query(`
          SELECT user_id, role FROM users 
          WHERE role = 'case_manager' AND status = 'active'
        `);
        
        console.log('=== Notifying case managers of new patient appointment request ===');
        console.log('Case managers count:', caseManagers.length);
        
        // Create notifications for each case manager
        for (const cm of caseManagers) {
          // Create in-app notification
          await db.query(`
            INSERT INTO notifications (
              notification_id,
              user_id,
              patient_id,
              type,
              title,
              message,
              is_read,
              created_at
            ) VALUES (?, ?, NULL, 'appointment_request', ?, ?, FALSE, NOW())
          `, [
            uuidv4(),
            cm.user_id,
            'New Appointment Request',
            `${createdAppointment.patient_name} has requested an appointment for ${new Date(createdAppointment.scheduled_start).toLocaleDateString()} at ${new Date(createdAppointment.scheduled_start).toLocaleTimeString()}`
          ]);

          // Emit real-time notification
          if (io) {
            io.to(`user_${cm.user_id}`).emit('newNotification', {
              type: 'appointment_request',
              title: 'New Appointment Request',
              message: `${createdAppointment.patient_name} has requested an appointment`,
              appointment_id: appointment_id,
              timestamp: new Date().toISOString()
            });
          }
        }
      } catch (notificationError) {
        console.error('Error creating notifications (non-fatal):', notificationError);
      }
    } else {
      // Staff booking - notify providers as before
      try {
        const notificationResult = await notifyAppointmentCreated(createdAppointment);
        console.log('Staff booking notification result:', notificationResult.success);
      } catch (notificationError) {
        console.error('Error creating notifications (non-fatal):', notificationError);
      }
    }

    console.log('=== Appointment created successfully ===');
    console.log('Appointment ID:', appointment_id);
    console.log('Status:', initialStatus);

    res.status(201).json({
      success: true,
      message: req.user.role === 'patient' 
        ? 'Appointment request submitted successfully. Awaiting case manager approval.' 
        : 'Appointment created successfully',
      data: createdAppointment
    });
  } catch (error) {
    console.error('=== ERROR creating appointment ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to create appointment',
      error: error.message
    });
  }
});

// PUT /api/appointments/:id - Update appointment
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      provider_id,
      facility_id,
      appointment_type,
      scheduled_start,
      scheduled_end,
      duration_minutes,
      status,
      reason,
      notes
    } = req.body;

    // Check if appointment exists
    const [existing] = await db.query('SELECT * FROM appointments WHERE appointment_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const oldData = existing[0];

    // Validate appointment type if provided
    if (appointment_type) {
      const validTypes = ['follow_up', 'art_pickup', 'lab_test', 'counseling', 'general', 'initial'];
      if (!validTypes.includes(appointment_type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid appointment_type. Must be one of: ${validTypes.join(', ')}`
        });
      }
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['pending_provider_confirmation', 'pending_patient_confirmation', 'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }
    }

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (provider_id !== undefined) {
      updates.push('provider_id = ?');
      params.push(provider_id);
    }
    if (facility_id !== undefined) {
      updates.push('facility_id = ?');
      params.push(facility_id);
    }
    if (appointment_type !== undefined) {
      updates.push('appointment_type = ?');
      params.push(appointment_type);
    }
    if (scheduled_start !== undefined) {
      updates.push('scheduled_start = ?');
      params.push(scheduled_start);
    }
    if (scheduled_end !== undefined) {
      updates.push('scheduled_end = ?');
      params.push(scheduled_end);
    }
    if (duration_minutes !== undefined) {
      updates.push('duration_minutes = ?');
      params.push(duration_minutes);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (reason !== undefined) {
      updates.push('reason = ?');
      params.push(reason);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    params.push(id);

    await db.query(`
      UPDATE appointments 
      SET ${updates.join(', ')}
      WHERE appointment_id = ?
    `, params);

    // Auto-calculate ARPA risk score if appointment status changed (completed, no_show, cancelled)
    try {
      const statusChanged = req.body.status && oldData.status !== req.body.status;
      const statusAffectsRisk = ['completed', 'no_show', 'cancelled'].includes(req.body.status);
      
      if (statusChanged && statusAffectsRisk && oldData.patient_id && req.user?.user_id) {
        await calculateARPARiskScore(oldData.patient_id, req.user.user_id, { skipAudit: false });
      }
    } catch (arpaError) {
      console.error('ARPA auto-calculation error after appointment update:', arpaError);
      // Don't fail the request if ARPA calculation fails
    }

    // Log audit
    const userInfo = await getUserInfoForAudit(req.user.user_id);
    const newData = { ...oldData, ...req.body };
    await logAudit({
      action: 'UPDATE',
      table_name: 'appointments',
      record_id: id,
      user_id: req.user.user_id,
      user_name: userInfo?.username || 'Unknown',
      ip_address: getClientIp(req),
      changes: JSON.stringify({ old: oldData, new: newData })
    });

    // Fetch updated appointment
    const [updated] = await db.query(`
      SELECT 
        a.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        u.full_name AS provider_name,
        f.facility_name,
        u2.full_name AS booked_by_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.patient_id
      LEFT JOIN users u ON a.provider_id = u.user_id
      LEFT JOIN facilities f ON a.facility_id = f.facility_id
      LEFT JOIN users u2 ON a.booked_by = u2.user_id
      WHERE a.appointment_id = ?
    `, [id]);

    const updatedAppointment = updated[0];

    // Check if provider_id or scheduled_start changed and notify patient
    const providerChanged = provider_id !== undefined && oldData.provider_id !== provider_id;
    const providerAssigned = provider_id !== undefined && !oldData.provider_id && provider_id;
    const timeChanged = scheduled_start !== undefined && 
                        oldData.scheduled_start && 
                        new Date(oldData.scheduled_start).getTime() !== new Date(scheduled_start).getTime();

    if ((providerChanged || timeChanged) && updatedAppointment) {
      try {
        const { notifyAppointmentChanged } = await import('../routes/notifications.js');
        await notifyAppointmentChanged(updatedAppointment, {
          providerChanged,
          timeChanged,
          oldProviderId: oldData.provider_id,
          oldScheduledStart: oldData.scheduled_start
        });
      } catch (notificationError) {
        console.error('Error sending appointment change notification (non-fatal):', notificationError);
        // Don't fail the update if notification fails
      }
    }

    // Notify physician when provider is assigned or changed (if case manager is updating)
    if ((providerAssigned || providerChanged) && updatedAppointment && updatedAppointment.provider_id && 
        (req.user.role === 'case_manager' || req.user.role === 'admin')) {
      try {
        // Get provider role to check if it's a physician
        const [providerInfo] = await db.query(`
          SELECT role, full_name FROM users WHERE user_id = ?
        `, [updatedAppointment.provider_id]);
        
        if (providerInfo.length > 0) {
          const providerRole = providerInfo[0].role;
          const providerName = providerInfo[0].full_name || 'Provider';
          
          // Only notify if provider is a physician
          if (providerRole === 'physician') {
            const appointmentDate = new Date(updatedAppointment.scheduled_start);
            const formattedDate = appointmentDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            const physicianSubject = providerAssigned 
              ? 'New Patient Appointment Scheduled' 
              : 'Appointment Reassigned to You';
            const physicianBody = providerAssigned
              ? `A new patient (${updatedAppointment.patient_name}) has been scheduled under your name for ${formattedDate} at ${updatedAppointment.facility_name || 'the facility'}.`
              : `An appointment with ${updatedAppointment.patient_name} has been reassigned to you for ${formattedDate} at ${updatedAppointment.facility_name || 'the facility'}.`;

            const physicianPayload = {
              type: 'appointment_assigned',
              appointment_id: id,
              patient_id: updatedAppointment.patient_id,
              provider_id: updatedAppointment.provider_id,
              provider_name: providerName,
              facility_id: updatedAppointment.facility_id,
              scheduled_start: updatedAppointment.scheduled_start,
              scheduled_end: updatedAppointment.scheduled_end,
              appointment_type: updatedAppointment.appointment_type || 'general',
              requires_confirmation: false
            };

            // Import notification helper functions
            const { createNotification, createInAppMessage } = await import('./notifications.js');

            // Create in-app message for physician
            const physicianMessage = await createInAppMessage({
              sender_id: null, // System message
              recipient_id: updatedAppointment.provider_id,
              recipient_type: 'user',
              subject: physicianSubject,
              body: physicianBody,
              payload: physicianPayload,
              priority: 'high'
            });

            if (physicianMessage.success) {
              console.log(`✅ In-app message created for physician ${updatedAppointment.provider_id}`);
            } else {
              console.error(`❌ Failed to create in-app message for physician:`, physicianMessage.error);
            }

            // Create notification entry for physician
            console.log(`📝 Creating notification entry for physician ${updatedAppointment.provider_id}...`);
            console.log(`📝 Notification details:`, {
              recipient_id: updatedAppointment.provider_id,
              title: physicianSubject,
              message: `${updatedAppointment.patient_name} has been scheduled for an appointment on ${formattedDate}`,
              type: 'appointment'
            });
            
            const physicianNotification = await createNotification({
              recipient_id: updatedAppointment.provider_id,
              patient_id: updatedAppointment.patient_id, // Include patient_id so staff can see this (not used in INSERT but kept for consistency)
              title: physicianSubject,
              message: `${updatedAppointment.patient_name} has been scheduled for an appointment on ${formattedDate}`,
              type: 'appointment',
              payload: JSON.stringify(physicianPayload)
            });

            if (physicianNotification.success) {
              console.log(`✅ Notification created successfully for physician ${updatedAppointment.provider_id}, notification_id: ${physicianNotification.notification_id}`);
              
              // Verify notification was actually inserted into database
              try {
                const [verify] = await db.query(`
                  SELECT notification_id, recipient_id, title, message, type, created_at
                  FROM notifications
                  WHERE notification_id = ?
                `, [physicianNotification.notification_id]);
                
                if (verify.length > 0) {
                  console.log(`✅ Verified notification exists in database:`, verify[0]);
                } else {
                  console.error(`❌ Notification was not found in database after creation!`);
                }
              } catch (verifyError) {
                console.error(`❌ Error verifying notification in database:`, verifyError);
              }
            } else {
              console.error(`❌ Failed to create notification for physician:`, physicianNotification.error);
            }

            // Emit real-time socket notification
            if (io) {
              io.to(`user_${updatedAppointment.provider_id}`).emit('newNotification', {
                type: 'appointment_assigned',
                title: physicianSubject,
                message: providerAssigned 
                  ? `A new patient (${updatedAppointment.patient_name}) has been scheduled under your name`
                  : `An appointment with ${updatedAppointment.patient_name} has been reassigned to you`,
                appointment_id: id,
                patient_name: updatedAppointment.patient_name,
                facility_name: updatedAppointment.facility_name,
                scheduled_start: updatedAppointment.scheduled_start,
                timestamp: new Date().toISOString()
              });
              
              // Also emit appointment update event for real-time refresh
              io.to(`user_${updatedAppointment.provider_id}`).emit('appointmentUpdated', {
                appointment_id: id,
                action: providerAssigned ? 'assigned' : 'reassigned',
                status: updatedAppointment.status
              });
              
              console.log(`✅ Socket notification sent to physician ${updatedAppointment.provider_id}`);
            }
          }
        }
      } catch (physicianNotifError) {
        console.error('Error sending physician notification (non-fatal):', physicianNotifError);
        // Don't fail the update if notification fails
      }
    }

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: updatedAppointment
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment',
      error: error.message
    });
  }
});

// DELETE /api/appointments/:id - Cancel/Delete appointment
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;

    // Check if appointment exists
    const [existing] = await db.query('SELECT * FROM appointments WHERE appointment_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Start transaction
    await db.query('START TRANSACTION');

    try {
      // Update appointment status to cancelled instead of deleting
      await db.query(`
        UPDATE appointments 
        SET status = 'cancelled',
            cancelled_at = ?,
            cancelled_by = ?,
            cancellation_reason = ?
        WHERE appointment_id = ?
      `, [
        new Date(),
        req.user.user_id,
        cancellation_reason || null,
        id
      ]);

      // Free up the availability slot if one was assigned
      await db.query(`
        UPDATE availability_slots
        SET slot_status = 'available',
            appointment_id = NULL
        WHERE appointment_id = ?
      `, [id]);

      await db.query('COMMIT');
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

    // Auto-calculate ARPA risk score after appointment cancellation
    try {
      if (existing[0].patient_id && req.user?.user_id) {
        await calculateARPARiskScore(existing[0].patient_id, req.user.user_id, { skipAudit: false });
      }
    } catch (arpaError) {
      console.error('ARPA auto-calculation error after appointment cancellation:', arpaError);
      // Don't fail the request if ARPA calculation fails
    }

    // Log audit
    const userInfo = await getUserInfoForAudit(req.user.user_id);
    await logAudit({
      action: 'DELETE',
      table_name: 'appointments',
      record_id: id,
      user_id: req.user.user_id,
      user_name: userInfo?.username || 'Unknown',
      ip_address: getClientIp(req),
      changes: JSON.stringify({ cancellation_reason })
    });

    res.json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment',
      error: error.message
    });
  }
});

// POST /api/appointments/:id/accept - Physician accepts appointment
router.post('/:id/accept', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id;
    const user_role = req.user.role;

    // Only physicians can accept appointments
    if (user_role !== 'physician' && user_role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only physicians can accept appointments'
      });
    }

    // Check if appointment exists
    const [existing] = await db.query(`
      SELECT 
        a.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        u.full_name AS provider_name,
        f.facility_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.patient_id
      LEFT JOIN users u ON a.provider_id = u.user_id
      LEFT JOIN facilities f ON a.facility_id = f.facility_id
      WHERE a.appointment_id = ?
    `, [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const appointment = existing[0];

    // Check if provider matches (unless admin)
    if (user_role === 'physician' && appointment.provider_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'You can only accept appointments assigned to you'
      });
    }

    // Update appointment status to 'confirmed' (provider has accepted)
    // Note: Database enum doesn't have 'pending_patient_confirmation', so we use 'confirmed'
    await db.query(`
      UPDATE appointments 
      SET status = 'confirmed'
      WHERE appointment_id = ?
    `, [id]);

    // Fetch updated appointment
    const [updated] = await db.query(`
      SELECT 
        a.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        u.full_name AS provider_name,
        f.facility_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.patient_id
      LEFT JOIN users u ON a.provider_id = u.user_id
      LEFT JOIN facilities f ON a.facility_id = f.facility_id
      WHERE a.appointment_id = ?
    `, [id]);

    // Notify patient that provider accepted
    const { notifyAppointmentProviderAccepted } = await import('./notifications.js');
    await notifyAppointmentProviderAccepted(updated[0]);

    // Log audit
    const userInfo = await getUserInfoForAudit(user_id);
    await logAudit({
      action: 'UPDATE',
      table_name: 'appointments',
      record_id: id,
      user_id: user_id,
      user_name: userInfo?.username || 'Unknown',
      ip_address: getClientIp(req),
      changes: JSON.stringify({ status: 'pending_patient_confirmation', action: 'accepted' })
    });

    // Emit socket event
    if (io) {
      io.to(`user_${appointment.patient_id}`).emit('newNotification', {
        title: 'Appointment Accepted',
        message: `Your appointment has been accepted by ${appointment.provider_name || 'the provider'}`,
        appointment_id: id
      });
    }

    res.json({
      success: true,
      message: 'Appointment accepted successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('Error accepting appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept appointment',
      error: error.message
    });
  }
});

// POST /api/appointments/:id/decline - Physician declines appointment
router.post('/:id/decline', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user_id = req.user.user_id;
    const user_role = req.user.role;

    // Only physicians can decline appointments
    if (user_role !== 'physician' && user_role !== 'case_manager' && user_role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only physicians can decline appointments'
      });
    }

    // Check if appointment exists
    const [existing] = await db.query(`
      SELECT 
        a.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        u.full_name AS provider_name,
        f.facility_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.patient_id
      LEFT JOIN users u ON a.provider_id = u.user_id
      LEFT JOIN facilities f ON a.facility_id = f.facility_id
      WHERE a.appointment_id = ?
    `, [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const appointment = existing[0];

    // Check if provider matches (unless admin)
    if (user_role === 'physician' && appointment.provider_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'You can only decline appointments assigned to you'
      });
    }

    // Update appointment status
    await db.query(`
      UPDATE appointments 
      SET status = 'cancelled',
          cancellation_reason = ?,
          cancelled_at = NOW(),
          cancelled_by = ?
      WHERE appointment_id = ?
    `, [reason || 'Declined by provider', user_id, id]);

    // Fetch updated appointment
    const [updated] = await db.query(`
      SELECT 
        a.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        u.full_name AS provider_name,
        f.facility_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.patient_id
      LEFT JOIN users u ON a.provider_id = u.user_id
      LEFT JOIN facilities f ON a.facility_id = f.facility_id
      WHERE a.appointment_id = ?
    `, [id]);

    // Notify patient that provider declined
    const { notifyAppointmentProviderDeclined } = await import('./notifications.js');
    await notifyAppointmentProviderDeclined(updated[0], reason);

    // Log audit
    const userInfo = await getUserInfoForAudit(user_id);
    await logAudit({
      action: 'UPDATE',
      table_name: 'appointments',
      record_id: id,
      user_id: user_id,
      user_name: userInfo?.username || 'Unknown',
      ip_address: getClientIp(req),
      changes: JSON.stringify({ status: 'cancelled', action: 'declined', reason })
    });

    // Emit socket event
    if (io) {
      io.to(`user_${appointment.patient_id}`).emit('newNotification', {
        title: 'Appointment Declined',
        message: `Your appointment has been declined. ${reason ? `Reason: ${reason}` : ''}`,
        appointment_id: id
      });
    }

    res.json({
      success: true,
      message: 'Appointment declined successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('Error declining appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to decline appointment',
      error: error.message
    });
  }
});

// POST /api/appointments/:id/confirm - Patient confirms appointment
router.post('/:id/confirm', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id;
    const user_role = req.user.role;

    // Only patients can confirm appointments
    if (user_role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only patients can confirm appointments'
      });
    }

    // Get patient_id
    const [patientRows] = await db.query(`
      SELECT patient_id FROM patients 
      WHERE created_by = ? OR email IN (SELECT email FROM users WHERE user_id = ?)
      LIMIT 1
    `, [user_id, user_id]);

    if (patientRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient record not found'
      });
    }

    const patient_id = patientRows[0].patient_id;

    // Check if appointment exists and belongs to patient
    const [existing] = await db.query(`
      SELECT 
        a.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        u.full_name AS provider_name,
        f.facility_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.patient_id
      LEFT JOIN users u ON a.provider_id = u.user_id
      LEFT JOIN facilities f ON a.facility_id = f.facility_id
      WHERE a.appointment_id = ? AND a.patient_id = ?
    `, [id, patient_id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or access denied'
      });
    }

    const appointment = existing[0];

    // Check if appointment is in correct status (scheduled or confirmed)
    if (appointment.status !== 'scheduled' && appointment.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: `Appointment cannot be confirmed. Current status: ${appointment.status}`
      });
    }

    // Update appointment status
    await db.query(`
      UPDATE appointments 
      SET status = 'confirmed'
      WHERE appointment_id = ?
    `, [id]);

    // Fetch updated appointment
    const [updated] = await db.query(`
      SELECT 
        a.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        u.full_name AS provider_name,
        f.facility_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.patient_id
      LEFT JOIN users u ON a.provider_id = u.user_id
      LEFT JOIN facilities f ON a.facility_id = f.facility_id
      WHERE a.appointment_id = ?
    `, [id]);

    // Notify provider that patient confirmed
    const { notifyAppointmentPatientConfirmed } = await import('./notifications.js');
    await notifyAppointmentPatientConfirmed(updated[0]);

    // Log audit
    const userInfo = await getUserInfoForAudit(user_id);
    await logAudit({
      action: 'UPDATE',
      table_name: 'appointments',
      record_id: id,
      user_id: user_id,
      user_name: userInfo?.username || 'Unknown',
      ip_address: getClientIp(req),
      changes: JSON.stringify({ status: 'confirmed', action: 'confirmed_by_patient' })
    });

    // Emit socket event
    if (io && appointment.provider_id) {
      io.to(`user_${appointment.provider_id}`).emit('newNotification', {
        title: 'Appointment Confirmed',
        message: `${appointment.patient_name} has confirmed the appointment`,
        appointment_id: id
      });
    }

    res.json({
      success: true,
      message: 'Appointment confirmed successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('Error confirming appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm appointment',
      error: error.message
    });
  }
});

// GET /api/appointments/availability/slots - Get availability slots
router.get('/availability/slots', authenticateToken, async (req, res) => {
  try {
    const { provider_id, facility_id, date, date_from, date_to, status } = req.query;

    let query = `
      SELECT 
        s.slot_id,
        s.provider_id,
        s.facility_id,
        DATE_FORMAT(s.slot_date, '%Y-%m-%d') AS slot_date,
        s.start_time,
        s.end_time,
        s.slot_status,
        s.appointment_id,
        s.lock_status,
        s.assignment_id,
        s.created_at,
        u.full_name AS provider_name,
        f.facility_name,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name
      FROM availability_slots s
      LEFT JOIN users u ON s.provider_id = u.user_id
      LEFT JOIN facilities f ON s.facility_id = f.facility_id
      LEFT JOIN appointments a ON s.appointment_id = a.appointment_id
      LEFT JOIN patients p ON a.patient_id = p.patient_id
      WHERE 1=1
    `;

    const params = [];

    if (provider_id) {
      query += ' AND s.provider_id = ?';
      params.push(provider_id);
    }

    if (facility_id) {
      query += ' AND s.facility_id = ?';
      params.push(facility_id);
    }

    if (status) {
      query += ' AND s.slot_status = ?';
      params.push(status);
    }

    if (date) {
      query += ' AND s.slot_date = ?';
      params.push(date);
    } else if (date_from) {
      query += ' AND s.slot_date >= ?';
      params.push(date_from);
    }

    if (date_to) {
      query += ' AND s.slot_date <= ?';
      params.push(date_to);
    }

    query += ' ORDER BY s.slot_date ASC, s.start_time ASC';

    console.log('Availability slots query:', query);
    console.log('Query params:', params);

    const [slots] = await db.query(query, params);

    console.log('Availability slots found:', slots.length);

    res.json({
      success: true,
      data: slots
    });
  } catch (error) {
    console.error('Error fetching availability slots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch availability slots',
      error: error.message
    });
  }
});

// POST /api/appointments/availability/slots - Create availability slots
router.post('/availability/slots', authenticateToken, async (req, res) => {
  try {
    // Check permissions - only admins, physicians, and case managers can manage slots
    if (!['admin', 'physician', 'case_manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators, physicians, and case managers can manage availability slots.',
      });
    }

    const {
      provider_id,
      facility_id,
      slot_date,
      start_time,
      end_time,
      slot_status = 'available'
    } = req.body;

    // Validation
    if (!provider_id || !facility_id || !slot_date || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: provider_id, facility_id, slot_date, start_time, end_time'
      });
    }

    // Validate slot_status
    const validStatuses = ['available', 'booked', 'blocked', 'unavailable'];
    if (!validStatuses.includes(slot_status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid slot_status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Check if provider exists
    const [providers] = await db.query('SELECT user_id FROM users WHERE user_id = ?', [provider_id]);
    if (providers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    // Check if facility exists
    const [facilities] = await db.query('SELECT facility_id FROM facilities WHERE facility_id = ?', [facility_id]);
    if (facilities.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Facility not found'
      });
    }

    const slot_id = uuidv4();

    await db.query(`
      INSERT INTO availability_slots (
        slot_id, provider_id, facility_id, slot_date, start_time, end_time, slot_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [slot_id, provider_id, facility_id, slot_date, start_time, end_time, slot_status]);

    // Fetch created slot
    const [created] = await db.query(`
      SELECT 
        s.*,
        u.full_name AS provider_name,
        f.facility_name
      FROM availability_slots s
      LEFT JOIN users u ON s.provider_id = u.user_id
      LEFT JOIN facilities f ON s.facility_id = f.facility_id
      WHERE s.slot_id = ?
    `, [slot_id]);

    // Log audit
    const userInfo = await getUserInfoForAudit(req.user.user_id);
    await logAudit({
      action: 'CREATE',
      table_name: 'availability_slots',
      record_id: slot_id,
      user_id: req.user.user_id,
      user_name: userInfo?.username || 'Unknown',
      ip_address: getClientIp(req),
      changes: JSON.stringify(created[0])
    });

    res.status(201).json({
      success: true,
      message: 'Availability slot created successfully',
      data: created[0]
    });
  } catch (error) {
    console.error('Error creating availability slot:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create availability slot',
      error: error.message
    });
  }
});

// PUT /api/appointments/availability/slots/:id - Update availability slot
router.put('/availability/slots/:id', authenticateToken, async (req, res) => {
  try {
    // Check permissions
    if (!['admin', 'physician', 'case_manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators, physicians, and case managers can manage availability slots.',
      });
    }

    const { id } = req.params;
    const {
      slot_date,
      start_time,
      end_time,
      slot_status
    } = req.body;

    // Check if slot exists
    const [existing] = await db.query('SELECT * FROM availability_slots WHERE slot_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Availability slot not found'
      });
    }

    const oldData = existing[0];

    // Validate slot_status if provided
    if (slot_status) {
      const validStatuses = ['available', 'booked', 'blocked', 'unavailable'];
      if (!validStatuses.includes(slot_status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid slot_status. Must be one of: ${validStatuses.join(', ')}`
        });
      }
    }

    // Build update query
    const updates = [];
    const params = [];

    if (slot_date !== undefined) {
      updates.push('slot_date = ?');
      params.push(slot_date);
    }
    if (start_time !== undefined) {
      updates.push('start_time = ?');
      params.push(start_time);
    }
    if (end_time !== undefined) {
      updates.push('end_time = ?');
      params.push(end_time);
    }
    if (slot_status !== undefined) {
      updates.push('slot_status = ?');
      params.push(slot_status);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    params.push(id);

    await db.query(`
      UPDATE availability_slots 
      SET ${updates.join(', ')}
      WHERE slot_id = ?
    `, params);

    // Fetch updated slot
    const [updated] = await db.query(`
      SELECT 
        s.*,
        u.full_name AS provider_name,
        f.facility_name
      FROM availability_slots s
      LEFT JOIN users u ON s.provider_id = u.user_id
      LEFT JOIN facilities f ON s.facility_id = f.facility_id
      WHERE s.slot_id = ?
    `, [id]);

    // Log audit
    const userInfo = await getUserInfoForAudit(req.user.user_id);
    await logAudit({
      action: 'UPDATE',
      table_name: 'availability_slots',
      record_id: id,
      user_id: req.user.user_id,
      user_name: userInfo?.username || 'Unknown',
      ip_address: getClientIp(req),
      changes: JSON.stringify({ old: oldData, new: updated[0] })
    });

    res.json({
      success: true,
      message: 'Availability slot updated successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('Error updating availability slot:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update availability slot',
      error: error.message
    });
  }
});

// POST /api/appointments/availability/slots/:slotId/accept-appointment - Accept appointment into slot
router.post('/availability/slots/:slotId/accept-appointment', authenticateToken, async (req, res) => {
  try {
    // Check permissions - only admins, physicians, and case managers can accept appointments
    if (!['admin', 'physician', 'case_manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators, physicians, and case managers can accept appointments into slots.',
      });
    }

    const { slotId } = req.params;
    const { appointment_id } = req.body;

    if (!appointment_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: appointment_id'
      });
    }

    // Start transaction early and lock the slot row to prevent race conditions
    await db.query('START TRANSACTION');

    // Check if slot exists WITH ROW LOCK to prevent concurrent modifications
    const [slots] = await db.query(`
      SELECT 
        s.*,
        u.full_name AS provider_name,
        f.facility_name
      FROM availability_slots s
      LEFT JOIN users u ON s.provider_id = u.user_id
      LEFT JOIN facilities f ON s.facility_id = f.facility_id
      WHERE s.slot_id = ?
      FOR UPDATE  -- Lock this row to prevent concurrent updates
    `, [slotId]);

    if (slots.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Availability slot not found'
      });
    }

    const slot = slots[0];

    // Scenario 1: Slot is already booked
    if (slot.slot_status === 'booked') {
      await db.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Slot is already booked. Cannot accept appointment.',
        scenario: 'slot_already_booked',
        slot: {
          slot_id: slot.slot_id,
          appointment_id: slot.appointment_id,
          status: slot.slot_status
        }
      });
    }

    // Scenario 2: Slot is blocked
    if (slot.slot_status === 'blocked') {
      await db.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Slot is blocked. Cannot accept appointment.',
        scenario: 'slot_blocked',
        slot: {
          slot_id: slot.slot_id,
          status: slot.slot_status
        }
      });
    }

    // Scenario 3: Slot is unavailable
    if (slot.slot_status === 'unavailable') {
      await db.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Slot is unavailable. Cannot accept appointment.',
        scenario: 'slot_unavailable',
        slot: {
          slot_id: slot.slot_id,
          status: slot.slot_status
        }
      });
    }

    // Scenario 4: Slot is expired (past date/time)
    const slotDateTime = new Date(`${slot.slot_date} ${slot.end_time}`);
    if (slotDateTime < new Date()) {
      await db.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Slot has expired. Cannot accept appointment.',
        scenario: 'slot_expired',
        slot: {
          slot_id: slot.slot_id,
          slot_date: slot.slot_date,
          end_time: slot.end_time
        }
      });
    }

    // Check if appointment exists
    const [appointments] = await db.query(`
      SELECT 
        a.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.patient_id
      WHERE a.appointment_id = ?
      FOR UPDATE  -- Lock appointment row as well
    `, [appointment_id]);

    if (appointments.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const appointment = appointments[0];

    // NEW: Validate appointment time matches slot time boundaries
    const appointmentStart = new Date(appointment.scheduled_start);
    const appointmentEnd = new Date(appointment.scheduled_end);
    const slotStart = new Date(`${slot.slot_date}T${slot.start_time}`);
    const slotEnd = new Date(`${slot.slot_date}T${slot.end_time}`);

    // Check if appointment fits within slot boundaries
    if (appointmentStart < slotStart || appointmentEnd > slotEnd) {
      await db.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Appointment time does not match slot time boundaries',
        scenario: 'time_mismatch',
        details: {
          appointment_start: appointment.scheduled_start,
          appointment_end: appointment.scheduled_end,
          slot_start: `${slot.slot_date} ${slot.start_time}`,
          slot_end: `${slot.slot_date} ${slot.end_time}`
        }
      });
    }

    // Scenario 5: Appointment already has a slot assigned
    const [existingSlot] = await db.query(`
      SELECT slot_id, slot_status, appointment_id
      FROM availability_slots
      WHERE appointment_id = ?
    `, [appointment_id]);

    if (existingSlot.length > 0 && existingSlot[0].slot_id !== slotId) {
      await db.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Appointment is already assigned to another slot.',
        scenario: 'appointment_has_slot',
        existing_slot: {
          slot_id: existingSlot[0].slot_id,
          status: existingSlot[0].slot_status
        }
      });
    }

    // Scenario 7: Check if provider matches (if slot has provider)
    if (slot.provider_id && appointment.provider_id && slot.provider_id !== appointment.provider_id) {
      await db.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Provider mismatch. Slot provider does not match appointment provider.',
        scenario: 'provider_mismatch',
        slot_provider_id: slot.provider_id,
        appointment_provider_id: appointment.provider_id
      });
    }

    // Scenario 8: Check if facility matches
    if (slot.facility_id !== appointment.facility_id) {
      await db.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Facility mismatch. Slot facility does not match appointment facility.',
        scenario: 'facility_mismatch',
        slot_facility_id: slot.facility_id,
        appointment_facility_id: appointment.facility_id
      });
    }

    // Scenario 9: Check for conflicting appointments in the same slot
    const [conflicts] = await db.query(`
      SELECT appointment_id, scheduled_start, scheduled_end, status
      FROM appointments
      WHERE facility_id = ?
        AND status NOT IN ('cancelled', 'no_show')
        AND appointment_id != ?
        AND (
          (scheduled_start < ? AND scheduled_end > ?) OR
          (scheduled_start < ? AND scheduled_end > ?) OR
          (scheduled_start >= ? AND scheduled_end <= ?)
        )
    `, [
      slot.facility_id,
      appointment_id,
      appointment.scheduled_end, appointment.scheduled_start,
      appointment.scheduled_start, appointment.scheduled_end,
      appointment.scheduled_start, appointment.scheduled_end
    ]);

    if (conflicts.length > 0) {
      await db.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Time conflict detected. Another appointment exists in this time slot.',
        scenario: 'time_conflict',
        conflicts: conflicts
      });
    }

    // All checks passed - accept appointment into slot (transaction already started)

    try {
      // Update slot to booked and link to appointment
      await db.query(`
        UPDATE availability_slots
        SET slot_status = 'booked',
            appointment_id = ?
        WHERE slot_id = ?
      `, [appointment_id, slotId]);

      // Update appointment status to confirmed if it's scheduled
      if (appointment.status === 'scheduled') {
        await db.query(`
          UPDATE appointments
          SET status = 'confirmed'
          WHERE appointment_id = ?
        `, [appointment_id]);
      }

      await db.query('COMMIT');
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

    // Fetch updated slot and appointment
    const [updated] = await db.query(`
      SELECT 
        s.*,
        u.full_name AS provider_name,
        f.facility_name,
        a.appointment_id,
        a.patient_id,
        a.provider_id,
        a.facility_id,
        a.scheduled_start,
        a.scheduled_end,
        a.appointment_type,
        a.status,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name
      FROM availability_slots s
      LEFT JOIN users u ON s.provider_id = u.user_id
      LEFT JOIN facilities f ON s.facility_id = f.facility_id
      LEFT JOIN appointments a ON s.appointment_id = a.appointment_id
      LEFT JOIN patients p ON a.patient_id = p.patient_id
      WHERE s.slot_id = ?
    `, [slotId]);

    // Send confirmation notification to patient when appointment is accepted into slot
    if (updated.length > 0 && updated[0].appointment_id) {
      try {
        const { notifyAppointmentSlotConfirmed } = await import('./notifications.js');
        await notifyAppointmentSlotConfirmed(updated[0]);
      } catch (notifError) {
        console.error('Error sending confirmation notification to patient:', notifError);
        // Don't fail the request if notification fails
      }
    }

    // Log audit
    const userInfo = await getUserInfoForAudit(req.user.user_id);
    await logAudit({
      action: 'UPDATE',
      table_name: 'availability_slots',
      record_id: slotId,
      user_id: req.user.user_id,
      user_name: userInfo?.username || 'Unknown',
      ip_address: getClientIp(req),
      changes: JSON.stringify({
        action: 'accept_appointment',
        appointment_id: appointment_id,
        previous_status: slot.slot_status,
        new_status: 'booked'
      })
    });

    res.json({
      success: true,
      message: 'Appointment accepted into slot successfully',
      data: updated[0],
      scenario: 'success'
    });
  } catch (error) {
    console.error('Error accepting appointment into slot:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept appointment into slot',
      error: error.message
    });
  }
});

// DELETE /api/appointments/availability/slots/:id - Delete/block availability slot
router.delete('/availability/slots/:id', authenticateToken, async (req, res) => {
  try {
    // Check permissions
    if (!['admin', 'physician', 'case_manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators, physicians, and case managers can manage availability slots.',
      });
    }

    const { id } = req.params;

    // Check if slot exists
    const [existing] = await db.query('SELECT * FROM availability_slots WHERE slot_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Availability slot not found'
      });
    }

    const slot = existing[0];

    // If slot is booked, don't allow deletion - only allow blocking
    if (slot.slot_status === 'booked' && slot.appointment_id) {
      // Update to blocked instead of deleting
      await db.query(`
        UPDATE availability_slots 
        SET slot_status = 'blocked'
        WHERE slot_id = ?
      `, [id]);

      // Log audit
      const userInfo = await getUserInfoForAudit(req.user.user_id);
      await logAudit({
        action: 'UPDATE',
        table_name: 'availability_slots',
        record_id: id,
        user_id: req.user.user_id,
        user_name: userInfo?.username || 'Unknown',
        ip_address: getClientIp(req),
        changes: JSON.stringify({ action: 'blocked', reason: 'Slot has booked appointment' })
      });

      return res.json({
        success: true,
        message: 'Availability slot blocked successfully (cannot delete booked slot)'
      });
    }

    // Delete the slot
    await db.query('DELETE FROM availability_slots WHERE slot_id = ?', [id]);

    // Log audit
    const userInfo = await getUserInfoForAudit(req.user.user_id);
    await logAudit({
      action: 'DELETE',
      table_name: 'availability_slots',
      record_id: id,
      user_id: req.user.user_id,
      user_name: userInfo?.username || 'Unknown',
      ip_address: getClientIp(req),
      changes: JSON.stringify(slot)
    });

    res.json({
      success: true,
      message: 'Availability slot deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting availability slot:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete availability slot',
      error: error.message
    });
  }
});

// GET /api/appointments/:id/reminders - Get reminders for appointment
router.get('/:id/reminders', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if appointment exists
    const [appointments] = await db.query('SELECT appointment_id FROM appointments WHERE appointment_id = ?', [id]);
    if (appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const [reminders] = await db.query(`
      SELECT 
        ar.*,
        a.scheduled_start,
        a.appointment_type
      FROM appointment_reminders ar
      LEFT JOIN appointments a ON ar.appointment_id = a.appointment_id
      WHERE ar.appointment_id = ?
      ORDER BY ar.reminder_scheduled_at ASC
    `, [id]);

    res.json({
      success: true,
      data: reminders
    });
  } catch (error) {
    console.error('Error fetching appointment reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment reminders',
      error: error.message
    });
  }
});

// PUT /api/appointments/reminders/:id - Update reminder status
router.put('/reminders/:id', authenticateToken, async (req, res) => {
  try {
    // Check permissions - only admins can manually update reminders
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can update reminder status.',
      });
    }

    const { id } = req.params;
    const { status, reminder_sent_at } = req.body;

    // Check if reminder exists
    const [existing] = await db.query('SELECT * FROM appointment_reminders WHERE reminder_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    const oldData = existing[0];

    // Validate status if provided
    if (status) {
      const validStatuses = ['pending', 'sent', 'failed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }
    }

    // Build update query
    const updates = [];
    const params = [];

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (reminder_sent_at !== undefined) {
      updates.push('reminder_sent_at = ?');
      params.push(reminder_sent_at);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    params.push(id);

    await db.query(`
      UPDATE appointment_reminders 
      SET ${updates.join(', ')}
      WHERE reminder_id = ?
    `, params);

    // Fetch updated reminder
    const [updated] = await db.query(`
      SELECT 
        ar.*,
        a.scheduled_start,
        a.appointment_type
      FROM appointment_reminders ar
      LEFT JOIN appointments a ON ar.appointment_id = a.appointment_id
      WHERE ar.reminder_id = ?
    `, [id]);

    // Log audit
    const userInfo = await getUserInfoForAudit(req.user.user_id);
    await logAudit({
      action: 'UPDATE',
      table_name: 'appointment_reminders',
      record_id: id,
      user_id: req.user.user_id,
      user_name: userInfo?.username || 'Unknown',
      ip_address: getClientIp(req),
      changes: JSON.stringify({ old: oldData, new: updated[0] })
    });

    res.json({
      success: true,
      message: 'Reminder updated successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update reminder',
      error: error.message
    });
  }
});



//CASE MANAGER APPROVAL OF APPOINTMENTS
// POST /api/appointments/:id/approve - Case Manager approves appointment request
router.post('/:id/approve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id;
    const user_role = req.user.role;

    // Only case managers and admins can approve
    if (user_role !== 'case_manager' && user_role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only case managers can approve appointment requests'
      });
    }

    // Check if appointment exists
    const [existing] = await db.query(`
      SELECT 
        a.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        p.email AS patient_email,
        u.full_name AS provider_name,
        f.facility_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.patient_id
      LEFT JOIN users u ON a.provider_id = u.user_id
      LEFT JOIN facilities f ON a.facility_id = f.facility_id
      WHERE a.appointment_id = ?
    `, [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const appointment = existing[0];

    // Check if already confirmed
    if (appointment.status === 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Appointment already confirmed'
      });
    }

    // Update appointment status to confirmed
    await db.query(`
      UPDATE appointments 
      SET status = 'confirmed'
      WHERE appointment_id = ?
    `, [id]);

    // Fetch updated appointment
    const [updated] = await db.query(`
      SELECT 
        a.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        u.full_name AS provider_name,
        f.facility_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.patient_id
      LEFT JOIN users u ON a.provider_id = u.user_id
      LEFT JOIN facilities f ON a.facility_id = f.facility_id
      WHERE a.appointment_id = ?
    `, [id]);

    // Notify patient that appointment was approved
    try {
      // Get patient's user_id
      const [patientUsers] = await db.query(`
        SELECT u.user_id 
        FROM patients p
        LEFT JOIN users u ON p.created_by = u.user_id OR p.email = u.email
        WHERE p.patient_id = ?
        LIMIT 1
      `, [appointment.patient_id]);

      if (patientUsers.length > 0) {
        const patientUserId = patientUsers[0].user_id;
        
        // Create notification using helper function
        const { createNotification } = await import('./notifications.js');
        const patientNotification = await createNotification({
          recipient_id: patientUserId,
          patient_id: appointment.patient_id,
          title: 'Appointment Approved',
          message: `Your appointment for ${new Date(appointment.scheduled_start).toLocaleDateString()} at ${new Date(appointment.scheduled_start).toLocaleTimeString()} has been approved by the case manager.`,
          type: 'appointment',
          payload: JSON.stringify({
            type: 'appointment_approved',
            appointment_id: id,
            patient_id: appointment.patient_id
          })
        });

        if (!patientNotification.success) {
          console.error('Failed to create patient notification:', patientNotification.error);
        }

        // Emit real-time notification
        if (io) {
          io.to(`user_${patientUserId}`).emit('newNotification', {
            type: 'appointment_approved',
            title: 'Appointment Approved',
            message: 'Your appointment has been approved',
            appointment_id: id,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Notify provider (physician) if assigned
      if (appointment.provider_id) {
        console.log(`🔔 Checking provider notification for provider_id: ${appointment.provider_id}`);
        
        // Get provider role to check if it's a physician
        const [providerInfo] = await db.query(`
          SELECT role, full_name FROM users WHERE user_id = ?
        `, [appointment.provider_id]);
        
        if (providerInfo.length > 0) {
          const providerRole = providerInfo[0].role;
          const providerName = providerInfo[0].full_name || 'Provider';
          
          console.log(`📋 Provider role: ${providerRole}, name: ${providerName}`);
          
          // Only notify if provider is a physician
          if (providerRole === 'physician') {
            console.log(`✅ Provider is a physician, creating notifications...`);
            
            const appointmentDate = new Date(appointment.scheduled_start);
            const formattedDate = appointmentDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            const physicianSubject = 'New Patient Appointment Scheduled';
            const physicianBody = `A new patient (${appointment.patient_name}) has been scheduled under your name for ${formattedDate} at ${appointment.facility_name || 'the facility'}.`;

            const physicianPayload = {
              type: 'appointment_assigned',
              appointment_id: id,
              patient_id: appointment.patient_id,
              provider_id: appointment.provider_id,
              provider_name: providerName,
              facility_id: appointment.facility_id,
              scheduled_start: appointment.scheduled_start,
              scheduled_end: updated[0].scheduled_end,
              appointment_type: appointment.appointment_type || 'general',
              requires_confirmation: false
            };

            try {
              // Import notification helper functions
              const { createNotification, createInAppMessage } = await import('./notifications.js');
              console.log(`📦 Notification functions imported successfully`);

              // Create in-app message for physician
              console.log(`💬 Creating in-app message for physician ${appointment.provider_id}...`);
              const physicianMessage = await createInAppMessage({
                sender_id: null, // System message
                recipient_id: appointment.provider_id,
                recipient_type: 'user',
                subject: physicianSubject,
                body: physicianBody,
                payload: physicianPayload,
                priority: 'high'
              });

              if (physicianMessage.success) {
                console.log(`✅ In-app message created for physician ${appointment.provider_id}`);
              } else {
                console.error(`❌ Failed to create in-app message for physician:`, physicianMessage.error);
              }

              // Create notification entry for physician
              console.log(`📝 Creating notification entry for physician ${appointment.provider_id}...`);
              console.log(`📝 Notification details:`, {
                recipient_id: appointment.provider_id,
                title: 'New Patient Appointment Scheduled',
                message: `${appointment.patient_name} has been scheduled for an appointment on ${formattedDate}`,
                type: 'appointment'
              });
              
              const physicianNotification = await createNotification({
                recipient_id: appointment.provider_id,
                patient_id: appointment.patient_id, // Include patient_id so staff can see this (not used in INSERT but kept for consistency)
                title: 'New Patient Appointment Scheduled',
                message: `${appointment.patient_name} has been scheduled for an appointment on ${formattedDate}`,
                type: 'appointment',
                payload: JSON.stringify(physicianPayload)
              });

              if (physicianNotification.success) {
                console.log(`✅ Notification created successfully for physician ${appointment.provider_id}, notification_id: ${physicianNotification.notification_id}`);
                
                // Verify notification was actually inserted into database
                try {
                  const [verify] = await db.query(`
                    SELECT notification_id, recipient_id, title, message, type, created_at
                    FROM notifications
                    WHERE notification_id = ?
                  `, [physicianNotification.notification_id]);
                  
                  if (verify.length > 0) {
                    console.log(`✅ Verified notification exists in database:`, verify[0]);
                  } else {
                    console.error(`❌ Notification was not found in database after creation!`);
                  }
                } catch (verifyError) {
                  console.error(`❌ Error verifying notification in database:`, verifyError);
                }
              } else {
                console.error(`❌ Failed to create notification for physician:`, physicianNotification.error);
              }

              // Emit real-time socket notification
              if (io) {
                console.log(`🔌 Emitting socket notification to physician ${appointment.provider_id}...`);
                io.to(`user_${appointment.provider_id}`).emit('newNotification', {
                  type: 'appointment_assigned',
                  title: 'New Patient Appointment Scheduled',
                  message: `A new patient (${appointment.patient_name}) has been scheduled under your name`,
                  appointment_id: id,
                  patient_name: appointment.patient_name,
                  facility_name: appointment.facility_name,
                  scheduled_start: appointment.scheduled_start,
                  timestamp: new Date().toISOString()
                });
                
                // Also emit appointment update event for real-time refresh
                io.to(`user_${appointment.provider_id}`).emit('appointmentUpdated', {
                  appointment_id: id,
                  action: 'assigned',
                  status: 'confirmed'
                });
                
                console.log(`✅ Socket notification sent to physician ${appointment.provider_id}`);
              } else {
                console.warn(`⚠️ Socket.IO (io) is not available, skipping real-time notification`);
              }
            } catch (notificationError) {
              console.error(`❌ Error creating physician notifications:`, notificationError);
              console.error(`Error stack:`, notificationError.stack);
              // Don't fail the approval if notification fails
            }
          } else {
            console.log(`⚠️ Provider role is ${providerRole}, not a physician. Skipping notification.`);
          }
        } else {
          console.error(`❌ Provider not found for user_id: ${appointment.provider_id}`);
        }
      } else {
        console.log(`⚠️ No provider_id assigned to appointment ${id}`);
      }
    } catch (notifError) {
      console.error('Error sending approval notifications (non-fatal):', notifError);
    }

    // Log audit
    const userInfo = await getUserInfoForAudit(user_id);
    await logAudit({
      action: 'UPDATE',
      table_name: 'appointments',
      record_id: id,
      user_id: user_id,
      user_name: userInfo?.username || 'Unknown',
      ip_address: getClientIp(req),
      changes: JSON.stringify({ status: 'confirmed', action: 'approved_by_case_manager' })
    });

    res.json({
      success: true,
      message: 'Appointment approved successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('Error approving appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve appointment',
      error: error.message
    });
  }
});

// Add these endpoints to your appointments.js router file (after the accept/decline endpoints)

// POST /api/appointments/:id/decline - Case Manager declines appointment request
router.post('/:id/decline', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user_id = req.user.user_id;
    const user_role = req.user.role;

    // Only case managers and admins can decline
    if (user_role !== 'case_manager' && user_role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only case managers can decline appointment requests'
      });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Decline reason is required'
      });
    }

    // Check if appointment exists
    const [existing] = await db.query(`
      SELECT 
        a.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        u.full_name AS provider_name,
        f.facility_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.patient_id
      LEFT JOIN users u ON a.provider_id = u.user_id
      LEFT JOIN facilities f ON a.facility_id = f.facility_id
      WHERE a.appointment_id = ?
    `, [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const appointment = existing[0];

    // Update appointment status to cancelled with reason
    await db.query(`
      UPDATE appointments 
      SET status = 'cancelled',
          cancellation_reason = ?,
          cancelled_at = NOW(),
          cancelled_by = ?
      WHERE appointment_id = ?
    `, [reason, user_id, id]);

    // Fetch updated appointment
    const [updated] = await db.query(`
      SELECT 
        a.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        u.full_name AS provider_name,
        f.facility_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.patient_id
      LEFT JOIN users u ON a.provider_id = u.user_id
      LEFT JOIN facilities f ON a.facility_id = f.facility_id
      WHERE a.appointment_id = ?
    `, [id]);

    // Notify patient that appointment was declined
    try {
      const [patientUsers] = await db.query(`
        SELECT u.user_id 
        FROM patients p
        LEFT JOIN users u ON p.created_by = u.user_id OR p.email = u.email
        WHERE p.patient_id = ?
        LIMIT 1
      `, [appointment.patient_id]);

      if (patientUsers.length > 0) {
        const patientUserId = patientUsers[0].user_id;
        
        await db.query(`
          INSERT INTO notifications (
            notification_id,
            user_id,
            patient_id,
            type,
            title,
            message,
            is_read,
            created_at
          ) VALUES (?, ?, NULL, 'appointment_declined', ?, ?, FALSE, NOW())
        `, [
          uuidv4(),
          patientUserId,
          'Appointment Declined',
          `Your appointment request for ${new Date(appointment.scheduled_start).toLocaleDateString()} has been declined. Reason: ${reason}`
        ]);

        if (io) {
          io.to(`user_${patientUserId}`).emit('newNotification', {
            type: 'appointment_declined',
            title: 'Appointment Declined',
            message: `Your appointment request has been declined`,
            decline_reason: reason,
            appointment_id: id,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (notifError) {
      console.error('Error sending decline notifications (non-fatal):', notifError);
    }

    // Log audit
    const userInfo = await getUserInfoForAudit(user_id);
    await logAudit({
      action: 'UPDATE',
      table_name: 'appointments',
      record_id: id,
      user_id: user_id,
      user_name: userInfo?.username || 'Unknown',
      ip_address: getClientIp(req),
      changes: JSON.stringify({ status: 'cancelled', action: 'declined_by_case_manager', reason })
    });

    res.json({
      success: true,
      message: 'Appointment declined successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('Error declining appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to decline appointment',
      error: error.message
    });
  }
});

export default router;

