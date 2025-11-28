import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { authenticateToken } from './auth.js';
import { logAudit, getUserInfoForAudit, getClientIp } from '../utils/auditLogger.js';
import { checkAvailabilityForRequest } from './appointments.js';

const router = express.Router();

// Socket.IO instance (will be set by server.js)
let io = null;

// Function to set Socket.IO instance
export const setSocketIO = (socketIO) => {
  io = socketIO;
};

// GET /api/appointment-requests - Get all appointment requests with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('=== GET /api/appointment-requests ===');
    console.log('Request user:', {
      user_id: req.user.user_id,
      role: req.user.role,
      patient_id: req.user.patient_id
    });
    
    const { 
      patient_id, 
      status, 
      reviewer_id,
      date_from,
      date_to
    } = req.query;

    console.log('Query parameters:', { patient_id, status, reviewer_id, date_from, date_to });

    let query = `
      SELECT 
        ar.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        p.email AS patient_email,
        u.full_name AS reviewer_name,
        f.facility_name,
        prov.full_name AS provider_name,
        a.appointment_id,
        a.status AS appointment_status
      FROM appointment_requests ar
      LEFT JOIN patients p ON ar.patient_id = p.patient_id
      LEFT JOIN users u ON ar.reviewed_by = u.user_id
      LEFT JOIN facilities f ON ar.facility_id = f.facility_id
      LEFT JOIN users prov ON ar.provider_id = prov.user_id
      LEFT JOIN appointments a ON ar.appointment_id = a.appointment_id
      WHERE 1=1
    `;

    const params = [];

    // Role-based filtering
    if (req.user.role === 'patient') {
      console.log('🔍 User is patient, filtering by patient_id...');
      // Patients only see their own requests
      // Get patient_id from user (look up if not in token)
      let patient_id = req.user.patient_id;
      if (!patient_id) {
        console.log('Patient ID not in token, looking up patient record for user:', req.user.user_id);
        
        // Try to find patient record - check both created_by and email in one query
        let [patients] = await db.query(`
          SELECT patient_id FROM patients 
          WHERE (created_by = ? OR email IN (SELECT email FROM users WHERE user_id = ?))
          AND status = "active"
          LIMIT 1
        `, [req.user.user_id, req.user.user_id]);
        
        // If not found with status filter, try without status filter (in case status is different)
        if (patients.length === 0) {
          console.log('No active patient found, trying without status filter...');
          [patients] = await db.query(`
            SELECT patient_id FROM patients 
            WHERE created_by = ? OR email IN (SELECT email FROM users WHERE user_id = ?)
            LIMIT 1
          `, [req.user.user_id, req.user.user_id]);
        }
        
        if (patients.length > 0) {
          patient_id = patients[0].patient_id;
          console.log('✅ Found patient_id for GET request:', patient_id);
        } else {
          console.error('❌ Patient record not found for user:', req.user.user_id);
          // Return empty array instead of error for GET requests
          return res.json({ success: true, data: [] });
        }
      }
      
      query += ' AND ar.patient_id = ?';
      params.push(patient_id);
      console.log('✅ Added patient_id filter:', patient_id);
    } else if (req.user.role === 'case_manager' || req.user.role === 'admin') {
      console.log('🔍 User is case_manager/admin, showing all requests (or filtered by patient_id if provided)');
      // Case managers and admins see all requests
      if (patient_id) {
        query += ' AND ar.patient_id = ?';
        params.push(patient_id);
        console.log('✅ Added patient_id filter for admin/case_manager:', patient_id);
      }
    } else {
      console.log('❌ User role not authorized:', req.user.role);
      // Other roles see nothing
      return res.json({ success: true, data: [] });
    }

    if (status) {
      query += ' AND ar.status = ?';
      params.push(status);
      console.log('✅ Added status filter:', status);
    }

    if (reviewer_id) {
      query += ' AND ar.reviewer_id = ?';
      params.push(reviewer_id);
      console.log('✅ Added reviewer_id filter:', reviewer_id);
    }

    if (date_from) {
      query += ' AND ar.requested_date >= ?';
      params.push(date_from);
      console.log('✅ Added date_from filter:', date_from);
    }

    if (date_to) {
      query += ' AND ar.requested_date <= ?';
      params.push(date_to);
      console.log('✅ Added date_to filter:', date_to);
    }

    query += ' ORDER BY ar.created_at DESC';

    console.log('📊 Executing query:', query);
    console.log('📊 Query params:', params);

    const [requests] = await db.query(query, params);

    console.log('✅ Found', requests.length, 'appointment requests');
    if (requests.length > 0) {
      console.log('📋 Sample requests:', requests.slice(0, 3).map(r => ({
        request_id: r.request_id,
        patient_id: r.patient_id,
        patient_name: r.patient_name,
        status: r.status,
        requested_date: r.requested_date,
        requested_time: r.requested_time
      })));
    }

    res.json({ 
      success: true, 
      data: requests 
    });
  } catch (error) {
    console.error('Error fetching appointment requests:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch appointment requests',
      error: error.message 
    });
  }
});

// GET /api/appointment-requests/:id - Get single appointment request
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [requests] = await db.query(`
      SELECT 
        ar.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        p.email AS patient_email,
        u.full_name AS reviewer_name,
        f.facility_name,
        prov.full_name AS provider_name,
        a.appointment_id,
        a.status AS appointment_status,
        a.scheduled_start AS appointment_start,
        a.scheduled_end AS appointment_end
      FROM appointment_requests ar
      LEFT JOIN patients p ON ar.patient_id = p.patient_id
      LEFT JOIN users u ON ar.reviewed_by = u.user_id
      LEFT JOIN facilities f ON ar.facility_id = f.facility_id
      LEFT JOIN users prov ON ar.provider_id = prov.user_id
      LEFT JOIN appointments a ON ar.appointment_id = a.appointment_id
      WHERE ar.request_id = ?
    `, [id]);

    if (requests.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Appointment request not found' 
      });
    }

    const request = requests[0];

    // Check permissions
    if (req.user.role === 'patient' && request.patient_id !== req.user.patient_id && request.patient_id !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({ 
      success: true, 
      data: request 
    });
  } catch (error) {
    console.error('Error fetching appointment request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch appointment request',
      error: error.message 
    });
  }
});

// POST /api/appointment-requests - Create new appointment request (Patient only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Only patients can create appointment requests
    if (req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only patients can create appointment requests'
      });
    }

    const {
      facility_id,
      provider_id,
      requested_date,
      requested_time,
      appointment_type,
      patient_notes
    } = req.body;

    // Validation
    if (!facility_id || !requested_date || !requested_time || !appointment_type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: facility_id, requested_date, requested_time, appointment_type'
      });
    }

    // Validate appointment_type
    const validTypes = ['follow_up', 'art_pickup', 'lab_test', 'counseling', 'general', 'initial'];
    if (!validTypes.includes(appointment_type)) {
      return res.status(400).json({
        success: false,
        message: `appointment_type must be one of: ${validTypes.join(', ')}`
      });
    }

    // Validate date is not in the past (no same-day booking per spec)
    const requestDate = new Date(requested_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (requestDate <= today) {
      return res.status(400).json({
        success: false,
        message: 'Appointments can only be requested for future dates (no same-day booking)'
      });
    }

    // Validate time format (hourly only, e.g., '09:00:00')
    const timePattern = /^([0-1][0-9]|2[0-3]):00:00$/;
    if (!timePattern.test(requested_time)) {
      return res.status(400).json({
        success: false,
        message: 'Time must be in hourly format (e.g., 09:00:00, 10:00:00)'
      });
    }

    // Get patient_id from user
    let patient_id = req.user.patient_id;
    if (!patient_id) {
      console.log('Patient ID not in token, looking up patient record for user:', req.user.user_id);
      
      // Try to find patient record - check both created_by and email in one query
      let [patients] = await db.query(`
        SELECT patient_id FROM patients 
        WHERE (created_by = ? OR email IN (SELECT email FROM users WHERE user_id = ?))
        AND status = "active"
        LIMIT 1
      `, [req.user.user_id, req.user.user_id]);
      
      // If not found with status filter, try without status filter (in case status is different)
      if (patients.length === 0) {
        console.log('No active patient found, trying without status filter...');
        [patients] = await db.query(`
          SELECT patient_id FROM patients 
          WHERE created_by = ? OR email IN (SELECT email FROM users WHERE user_id = ?)
          LIMIT 1
        `, [req.user.user_id, req.user.user_id]);
      }
      
      if (patients.length > 0) {
        patient_id = patients[0].patient_id;
        console.log('✅ Found patient_id:', patient_id);
      } else {
        console.error('❌ Patient record not found for user:', req.user.user_id);
        console.error('User details:', { user_id: req.user.user_id, email: req.user.email, role: req.user.role });
        return res.status(400).json({
          success: false,
          message: 'Patient record not found. Please ensure your account is linked to a patient profile.'
        });
      }
    }

    const request_id = uuidv4();

    await db.query(`
      INSERT INTO appointment_requests (
        request_id,
        patient_id,
        facility_id,
        provider_id,
        requested_date,
        requested_time,
        appointment_type,
        patient_notes,
        status,
        created_by,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW(), NOW())
    `, [
      request_id,
      patient_id,
      facility_id,
      provider_id || null,
      requested_date,
      requested_time,
      appointment_type,
      patient_notes || null,
      req.user.user_id
    ]);

    // Log audit
    const userInfo = await getUserInfoForAudit(req.user.user_id);
    await logAudit({
      action: 'CREATE',
      table_name: 'appointment_requests',
      record_id: request_id,
      user_id: req.user.user_id,
      user_name: userInfo?.username || 'Unknown',
      ip_address: getClientIp(req),
      changes: JSON.stringify({ facility_id, provider_id, requested_date, requested_time, appointment_type })
    });

    // Fetch created request
    const [created] = await db.query(`
      SELECT 
        ar.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        f.facility_name,
        prov.full_name AS provider_name
      FROM appointment_requests ar
      LEFT JOIN patients p ON ar.patient_id = p.patient_id
      LEFT JOIN facilities f ON ar.facility_id = f.facility_id
      LEFT JOIN users prov ON ar.provider_id = prov.user_id
      WHERE ar.request_id = ?
    `, [request_id]);

    // Notify all case managers
    try {
      const [caseManagers] = await db.query(`
        SELECT u.user_id 
        FROM users u
        WHERE u.role = 'case_manager' AND u.status = 'active'
      `);

      for (const cm of caseManagers) {
        await db.query(`
          INSERT INTO notifications (
            notification_id,
            recipient_id,
            title,
            message,
            type,
            is_read,
            created_at
          ) VALUES (?, ?, ?, ?, 'appointment', FALSE, NOW())
        `, [
          uuidv4(),
          cm.user_id,
          'New Appointment Request',
          `${created[0].patient_name} has requested an appointment for ${new Date(requested_date).toLocaleDateString()} at ${requested_time}`
        ]);

        if (io) {
          io.to(`user_${cm.user_id}`).emit('newNotification', {
            type: 'appointment_request',
            title: 'New Appointment Request',
            message: `${created[0].patient_name} has requested an appointment`,
            request_id: request_id,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (notifError) {
      console.error('Error sending notifications (non-fatal):', notifError);
    }

    // Emit socket event to patient for real-time update
    if (io) {
      io.to(`user_${req.user.user_id}`).emit('appointmentRequestUpdated', {
        request_id: request_id,
        status: 'pending',
        action: 'created'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Appointment request submitted successfully. Awaiting case manager approval.',
      data: created[0]
    });
  } catch (error) {
    console.error('Error creating appointment request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create appointment request',
      error: error.message
    });
  }
});

// POST /api/appointment-requests/:id/approve - Case Manager approves request
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

    // Get request details
    const [requests] = await db.query(`
      SELECT 
        ar.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        p.email AS patient_email
      FROM appointment_requests ar
      LEFT JOIN patients p ON ar.patient_id = p.patient_id
      WHERE ar.request_id = ?
    `, [id]);

    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment request not found'
      });
    }

    const request = requests[0];
    
    console.log('📋 Request details from database:', {
      request_id: request.request_id,
      requested_date: request.requested_date,
      requested_time: request.requested_time,
      requested_date_type: typeof request.requested_date,
      requested_time_type: typeof request.requested_time,
      status: request.status,
      facility_id: request.facility_id,
      provider_id: request.provider_id
    });

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}`
      });
    }

    // Build scheduled_start and scheduled_end from requested_date and requested_time
    console.log('📅 Building scheduled date/time from request:', {
      requested_date: request.requested_date,
      requested_time: request.requested_time,
      request_id: id
    });
    
    // Validate that requested_date and requested_time exist
    if (!request.requested_date || !request.requested_time) {
      console.error('❌ Missing date/time in request:', {
        requested_date: request.requested_date,
        requested_time: request.requested_time
      });
      return res.status(400).json({
        success: false,
        message: 'Request is missing required date/time information'
      });
    }
    
    // Normalize date format (ensure YYYY-MM-DD)
    // MySQL DATE columns are returned as strings in YYYY-MM-DD format or as Date objects
    let dateStr = request.requested_date;
    if (!dateStr) {
      console.error('❌ requested_date is null/undefined');
      return res.status(400).json({
        success: false,
        message: 'Request is missing requested_date'
      });
    }
    
    if (dateStr instanceof Date) {
      dateStr = dateStr.toISOString().split('T')[0];
    } else if (typeof dateStr === 'string') {
      // MySQL DATE format is YYYY-MM-DD, but might have time component
      // Extract just the date part
      dateStr = dateStr.split(' ')[0].split('T')[0];
      
      // Validate it's in YYYY-MM-DD format
      const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!dateMatch) {
        // Try to parse as Date and reformat
        const dateObj = new Date(dateStr);
        if (!isNaN(dateObj.getTime())) {
          dateStr = dateObj.toISOString().split('T')[0];
        } else {
          console.error('❌ Cannot parse date:', dateStr);
          return res.status(400).json({
            success: false,
            message: `Invalid date format: ${request.requested_date}`
          });
        }
      }
    } else {
      console.error('❌ Date is not a string or Date object:', typeof dateStr, dateStr);
      return res.status(400).json({
        success: false,
        message: `Invalid date type: ${typeof dateStr}`
      });
    }
    
    // Normalize time format (ensure HH:MM:SS)
    // MySQL TIME columns are returned as strings in HH:MM:SS format
    let timeStr = request.requested_time;
    if (!timeStr) {
      console.error('❌ requested_time is null/undefined');
      return res.status(400).json({
        success: false,
        message: 'Request is missing requested_time'
      });
    }
    
    if (typeof timeStr === 'string') {
      // Remove any whitespace
      timeStr = timeStr.trim();
      
      // MySQL TIME format can be HH:MM:SS or HH:MM:SS.microseconds
      // Extract just the time part (remove microseconds if present)
      timeStr = timeStr.split('.')[0];
      
      // If time is in HH:MM format, add :00 for seconds
      const timeParts = timeStr.split(':');
      if (timeParts.length === 2) {
        timeStr = `${timeStr}:00`;
      } else if (timeParts.length === 3) {
        // Already has seconds, use as is
        timeStr = timeStr;
      } else {
        console.error('❌ Invalid time format:', timeStr);
        return res.status(400).json({
          success: false,
          message: `Invalid time format: ${request.requested_time}. Expected HH:MM:SS or HH:MM`
        });
      }
      
      // Validate time parts are numbers
      const finalTimeParts = timeStr.split(':');
      const hours = parseInt(finalTimeParts[0], 10);
      const minutes = parseInt(finalTimeParts[1], 10);
      const seconds = parseInt(finalTimeParts[2], 10);
      
      if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
        console.error('❌ Invalid time values:', finalTimeParts);
        return res.status(400).json({
          success: false,
          message: `Invalid time values: ${timeStr}`
        });
      }
      
      // Ensure time is in valid range
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
        console.error('❌ Time out of range:', timeStr);
        return res.status(400).json({
          success: false,
          message: `Time out of valid range: ${timeStr}`
        });
      }
    } else if (timeStr instanceof Date) {
      // If it's a Date object, extract time
      const hours = String(timeStr.getHours()).padStart(2, '0');
      const minutes = String(timeStr.getMinutes()).padStart(2, '0');
      const secs = String(timeStr.getSeconds()).padStart(2, '0');
      timeStr = `${hours}:${minutes}:${secs}`;
    } else {
      console.error('❌ Time is not a string or Date:', typeof timeStr, timeStr);
      return res.status(400).json({
        success: false,
        message: `Invalid time type: ${typeof timeStr}. Value: ${timeStr}`
      });
    }
    
    // Build datetime string
    const datetimeStr = `${dateStr}T${timeStr}`;
    console.log('📅 Creating date from:', datetimeStr);
    
    const scheduledStart = new Date(datetimeStr);
    
    // Validate date is valid
    if (isNaN(scheduledStart.getTime())) {
      console.error('❌ Invalid date created from:', {
        dateStr,
        timeStr,
        datetimeStr,
        requested_date: request.requested_date,
        requested_time: request.requested_time
      });
      return res.status(400).json({
        success: false,
        message: `Invalid date/time combination: ${dateStr} ${timeStr}`,
        details: {
          requested_date: request.requested_date,
          requested_time: request.requested_time,
          parsed_date: dateStr,
          parsed_time: timeStr
        }
      });
    }
    
    console.log('✅ Valid date created:', scheduledStart.toISOString());
    
    const scheduledEnd = new Date(scheduledStart);
    scheduledEnd.setHours(scheduledEnd.getHours() + 1); // Default 1 hour duration
    
    // Validate end date is valid
    if (isNaN(scheduledEnd.getTime())) {
      console.error('Invalid end date calculated');
      return res.status(400).json({
        success: false,
        message: 'Error calculating appointment end time'
      });
    }

    // Check availability and conflicts
    const availabilityCheck = await checkAvailabilityForRequest(
      request.facility_id,
      request.provider_id || null, // provider_id - can be assigned later
      scheduledStart.toISOString(),
      scheduledEnd.toISOString()
    );

    if (!availabilityCheck.available) {
      return res.status(400).json({
        success: false,
        message: 'The requested time slot is not available',
        conflicts: availabilityCheck.conflicts
      });
    }

    const { review_notes } = req.body;

    // Start transaction
    await db.query('START TRANSACTION');

    try {
      // Create appointment record
      const appointment_id = uuidv4();
      const duration_minutes = 60; // Default 1 hour

      const scheduledStartStr = scheduledStart.toISOString().slice(0, 19).replace('T', ' ');
      const scheduledEndStr = scheduledEnd.toISOString().slice(0, 19).replace('T', ' ');

      console.log('📝 Creating appointment with:', {
        appointment_id,
        patient_id: request.patient_id,
        provider_id: request.provider_id || null,
        facility_id: request.facility_id,
        appointment_type: request.appointment_type,
        scheduled_start: scheduledStartStr,
        scheduled_end: scheduledEndStr,
        duration_minutes,
        booked_by: user_id
      });

      await db.query(`
        INSERT INTO appointments (
          appointment_id,
          patient_id,
          provider_id,
          facility_id,
          appointment_type,
          scheduled_start,
          scheduled_end,
          duration_minutes,
          status,
          reason,
          notes,
          booked_by,
          booked_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', NULL, ?, ?, NOW())
      `, [
        appointment_id,
        request.patient_id,
        request.provider_id || null,
        request.facility_id,
        request.appointment_type,
        scheduledStartStr,
        scheduledEndStr,
        duration_minutes,
        request.patient_notes || null,
        user_id
      ]);

      console.log('✅ Appointment created successfully:', appointment_id);

      // Update request with appointment_id and status
      console.log('📝 Updating appointment request:', id);
      await db.query(`
        UPDATE appointment_requests
        SET status = 'approved',
            reviewed_by = ?,
            reviewed_at = NOW(),
            review_notes = ?,
            appointment_id = ?,
            updated_at = NOW()
        WHERE request_id = ?
      `, [user_id, review_notes || null, appointment_id, id]);
      console.log('✅ Appointment request updated successfully');

      // Find and book an available slot for this appointment
      const slotDate = request.requested_date;
      let startTime = request.requested_time;
      // Ensure time is in HH:MM:SS format
      if (startTime.split(':').length === 2) {
        startTime = `${startTime}:00`;
      }
      const endTime = `${String(parseInt(startTime.split(':')[0]) + 1).padStart(2, '0')}:00:00`;

      console.log('🔍 Looking for available slot:', {
        facility_id: request.facility_id,
        slot_date: slotDate,
        start_time: startTime,
        end_time: endTime
      });

      // Find available slot that matches the appointment time
      const [availableSlots] = await db.query(`
        SELECT slot_id, provider_id
        FROM availability_slots
        WHERE facility_id = ?
          AND slot_date = ?
          AND start_time = ?
          AND end_time = ?
          AND slot_status = 'available'
          AND (lock_status = FALSE OR lock_status IS NULL)
          AND appointment_id IS NULL
        ORDER BY start_time ASC
        LIMIT 1
      `, [request.facility_id, slotDate, startTime, endTime]);
      
      console.log('📋 Found', availableSlots.length, 'available slots');

      // If slot found, book it
      if (availableSlots.length > 0) {
        const slot = availableSlots[0];
        await db.query(`
          UPDATE availability_slots
          SET slot_status = 'booked',
              appointment_id = ?
          WHERE slot_id = ?
        `, [appointment_id, slot.slot_id]);

        // Update appointment with provider_id from slot if not already set
        const providerId = slot.provider_id;
        if (providerId && !request.provider_id) {
          await db.query(`
            UPDATE appointments
            SET provider_id = ?
            WHERE appointment_id = ?
          `, [providerId, appointment_id]);
          
          // Store provider_id for notification later
          request.provider_id = providerId;
        }

        console.log(`✅ Booked appointment ${appointment_id} into slot ${slot.slot_id}`);
      } else {
        console.log(`⚠️ No available slot found for appointment ${appointment_id}, appointment created without slot assignment`);
      }

      // Update appointment status to confirmed since it's approved
      console.log('📝 Updating appointment status to confirmed');
      await db.query(`
        UPDATE appointments
        SET status = 'confirmed'
        WHERE appointment_id = ?
      `, [appointment_id]);
      console.log('✅ Appointment status updated to confirmed');

      console.log('💾 Committing transaction...');
      await db.query('COMMIT');
      console.log('✅ Transaction committed successfully');
    } catch (error) {
      console.error('❌ Error in transaction, rolling back:', error);
      console.error('Error stack:', error.stack);
      try {
        await db.query('ROLLBACK');
        console.log('✅ Transaction rolled back');
      } catch (rollbackError) {
        console.error('❌ Error during rollback:', rollbackError);
      }
      throw error;
    }

    // Fetch updated request
    const [updated] = await db.query(`
      SELECT 
        ar.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        f.facility_name,
        a.appointment_id,
        a.status AS appointment_status
      FROM appointment_requests ar
      LEFT JOIN patients p ON ar.patient_id = p.patient_id
      LEFT JOIN facilities f ON ar.facility_id = f.facility_id
      LEFT JOIN appointments a ON ar.appointment_id = a.appointment_id
      WHERE ar.request_id = ?
    `, [id]);

    // Notify patient
    try {
      const [patientUsers] = await db.query(`
        SELECT u.user_id 
        FROM patients p
        LEFT JOIN users u ON p.created_by = u.user_id OR p.email = u.email
        WHERE p.patient_id = ?
        LIMIT 1
      `, [request.patient_id]);

      if (patientUsers.length > 0) {
        const patientUserId = patientUsers[0].user_id;

        await db.query(`
          INSERT INTO notifications (
            notification_id,
            recipient_id,
            title,
            message,
            type,
            is_read,
            created_at
          ) VALUES (?, ?, ?, ?, 'appointment', FALSE, NOW())
        `, [
          uuidv4(),
          patientUserId,
          'Appointment Request Approved',
          `Your appointment request for ${new Date(request.requested_date).toLocaleDateString()} at ${request.requested_time} has been approved and booked.`
        ]);

        // Emit real-time notification via socket
        if (io) {
          io.to(`user_${patientUserId}`).emit('newNotification', {
            type: 'appointment_request_approved',
            title: 'Appointment Request Approved',
            message: `Your appointment request has been approved and booked`,
            appointment_id: appointment_id,
            timestamp: new Date().toISOString()
          });
          
          // Emit appointment request update event for real-time refresh
          io.to(`user_${patientUserId}`).emit('appointmentRequestUpdated', {
            request_id: id,
            status: 'approved',
            appointment_id: appointment_id,
            action: 'approved'
          });
        }
      }
    } catch (notifError) {
      console.error('Error sending approval notification (non-fatal):', notifError);
    }

    // Notify case managers about the slot booking (for AvailabilitySlots refresh)
    try {
      const [caseManagers] = await db.query(`
        SELECT u.user_id 
        FROM users u
        WHERE u.role IN ('case_manager', 'admin') AND u.status = 'active'
      `);

      // Emit real-time notification to all case managers for slot refresh
      if (io && caseManagers.length > 0) {
        caseManagers.forEach(cm => {
          io.to(`user_${cm.user_id}`).emit('newNotification', {
            type: 'appointment_request_approved',
            title: 'Appointment Request Approved',
            message: `Appointment request approved and slot booked`,
            appointment_id: appointment_id,
            request_id: id,
            timestamp: new Date().toISOString()
          });
          
          // Emit appointment request update event for real-time refresh in AppointmentRequests component
          io.to(`user_${cm.user_id}`).emit('appointmentRequestUpdated', {
            request_id: id,
            status: 'approved',
            appointment_id: appointment_id,
            action: 'approved'
          });
        });
      }
    } catch (notifError) {
      console.error('Error sending case manager notification (non-fatal):', notifError);
    }

    // Notify physicians when appointment is approved
    try {
      // Get the appointment details
      const [appointmentData] = await db.query(`
        SELECT a.provider_id, a.scheduled_start, a.scheduled_end, a.appointment_type,
               CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
               f.facility_name, a.facility_id
        FROM appointments a
        LEFT JOIN patients p ON a.patient_id = p.patient_id
        LEFT JOIN facilities f ON a.facility_id = f.facility_id
        WHERE a.appointment_id = ?
      `, [appointment_id]);

      if (appointmentData.length > 0) {
        const appointment = appointmentData[0];
        // Use provider_id from appointment (which may have been set from slot)
        // Also check if we stored it in request object during slot booking
        const provider_id = appointment.provider_id || request.provider_id;
        const facility_id = appointment.facility_id || request.facility_id;
        
        console.log(`📋 Appointment data for notification:`, {
          appointment_id: appointment_id,
          provider_id: provider_id,
          facility_id: facility_id,
          patient_name: appointment.patient_name,
          scheduled_start: appointment.scheduled_start
        });

        // If provider_id exists, notify that specific physician
        if (provider_id) {
          console.log(`🔔 Provider assigned: ${provider_id}, creating notifications...`);
          
          // Get provider role to check if it's a physician or nurse
          const [providerInfo] = await db.query(`
            SELECT role, full_name FROM users WHERE user_id = ?
          `, [provider_id]);
          
          if (providerInfo.length > 0) {
            const providerRole = providerInfo[0].role;
            const providerName = providerInfo[0].full_name || 'Provider';
            
            console.log(`📋 Provider role: ${providerRole}, name: ${providerName}`);
            
            // Only notify if provider is physician
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
                appointment_id: appointment_id,
                patient_id: request.patient_id,
                provider_id: provider_id,
                provider_name: providerName,
                facility_id: facility_id,
                scheduled_start: appointment.scheduled_start,
                scheduled_end: appointment.scheduled_end,
                appointment_type: appointment.appointment_type || 'general',
                requires_confirmation: false
              };

              // Import notification helper functions
              const { createNotification, createInAppMessage } = await import('./notifications.js');

              // Create in-app message for physician
              console.log(`💬 Creating in-app message for physician ${provider_id}...`);
              const physicianMessage = await createInAppMessage({
                sender_id: null, // System message
                recipient_id: provider_id,
                recipient_type: 'user',
                subject: physicianSubject,
                body: physicianBody,
                payload: physicianPayload,
                priority: 'high'
              });

              if (physicianMessage.success) {
                console.log(`✅ In-app message created for physician ${provider_id}`);
              } else {
                console.error(`❌ Failed to create in-app message for physician:`, physicianMessage.error);
              }

              // Create notification entry for physician
              console.log(`📝 Creating notification entry for physician ${provider_id}...`);
              const physicianNotification = await createNotification({
                recipient_id: provider_id,
                patient_id: request.patient_id, // Include patient_id so staff can see this
                title: 'New Patient Appointment Scheduled',
                message: `${appointment.patient_name} has been scheduled for an appointment on ${formattedDate}`,
                type: 'appointment',
                payload: JSON.stringify(physicianPayload)
              });

              if (physicianNotification.success) {
                console.log(`✅ Notification created successfully for physician ${provider_id}, notification_id: ${physicianNotification.notification_id}`);
                
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

              // Also emit real-time socket notification to ensure it's received
              if (io) {
                console.log(`🔌 Emitting socket notification to physician ${provider_id}...`);
                io.to(`user_${provider_id}`).emit('newNotification', {
                  type: 'appointment_assigned',
                  title: 'New Patient Appointment Scheduled',
                  message: `A new patient (${appointment.patient_name}) has been scheduled under your name`,
                  appointment_id: appointment_id,
                  patient_name: appointment.patient_name,
                  facility_name: appointment.facility_name,
                  scheduled_start: appointment.scheduled_start,
                  timestamp: new Date().toISOString()
                });
                
                // Also emit appointment update event for real-time refresh
                io.to(`user_${provider_id}`).emit('appointmentUpdated', {
                  appointment_id: appointment_id,
                  action: 'assigned',
                  status: 'confirmed'
                });
                
                console.log(`✅ Socket notification sent to physician ${provider_id}`);
              } else {
                console.warn(`⚠️ Socket.IO (io) is not available, skipping real-time notification`);
              }
            } else {
              console.log(`⚠️ Provider role is ${providerRole}, not a physician. Skipping notification.`);
            }
          } else {
            console.error(`❌ Provider not found for user_id: ${provider_id}`);
          }
        } else {
          // No provider_id assigned yet - notify all physicians at the facility
          console.log(`⚠️ No provider_id set for appointment ${appointment_id}, notifying all physicians at facility ${facility_id}`);
          
          if (facility_id) {
            console.log(`🔍 Looking for physicians at facility ${facility_id}`);
            
            // Get all physicians assigned to this facility via doctor_assignments
            const [facilityPhysicians] = await db.query(`
              SELECT DISTINCT u.user_id, u.full_name, u.role, u.email
              FROM users u
              INNER JOIN doctor_assignments da ON u.user_id = da.doctor_id
              WHERE u.role = 'physician' 
                AND u.status = 'active'
                AND da.facility_id = ?
            `, [facility_id]);

            console.log(`📋 Found ${facilityPhysicians.length} physicians assigned to facility ${facility_id}`);

            // Also get all active physicians (in case facility-based filtering is too restrictive)
            const [allPhysicians] = await db.query(`
              SELECT user_id, full_name, role, email
              FROM users
              WHERE role = 'physician' AND status = 'active'
            `);

            console.log(`📋 Found ${allPhysicians.length} total active physicians`);

            // Combine and deduplicate (prefer facility-specific ones)
            const physicianMap = new Map();
            
            // First add facility-specific physicians
            facilityPhysicians.forEach(physician => {
              physicianMap.set(physician.user_id, physician);
            });
            
            // Then add any other active physicians (if not already added)
            allPhysicians.forEach(physician => {
              if (!physicianMap.has(physician.user_id)) {
                physicianMap.set(physician.user_id, physician);
              }
            });

            const physiciansToNotify = Array.from(physicianMap.values());
            console.log(`📧 Will notify ${physiciansToNotify.length} physicians:`, physiciansToNotify.map(p => ({ user_id: p.user_id, name: p.full_name })));

            console.log(`📧 Notifying ${physiciansToNotify.length} physicians about new appointment`);

            // Import notification functions
            const { createNotification, createInAppMessage } = await import('./notifications.js');

            for (const physician of physiciansToNotify) {
              try {
                const formattedDate = new Date(appointment.scheduled_start).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                const physicianSubject = 'New Appointment Scheduled';
                const physicianBody = `A new appointment has been scheduled for ${appointment.patient_name} at ${appointment.facility_name} on ${formattedDate}.`;

                const physicianPayload = {
                  type: 'appointment_scheduled',
                  appointment_id: appointment_id,
                  patient_id: request.patient_id,
                  provider_id: physician.user_id,
                  facility_id: facility_id,
                  scheduled_start: appointment.scheduled_start,
                  scheduled_end: appointment.scheduled_end,
                  appointment_type: appointment.appointment_type || 'general',
                  requires_confirmation: false
                };

                // Create in-app message for physician
                const physicianMessage = await createInAppMessage({
                  sender_id: null, // System message
                  recipient_id: physician.user_id,
                  recipient_type: 'user',
                  subject: physicianSubject,
                  body: physicianBody,
                  payload: physicianPayload,
                  priority: 'high'
                });

                if (physicianMessage.success) {
                  console.log(`✅ In-app message created for physician ${physician.user_id}`);
                } else {
                  console.error(`❌ Failed to create in-app message for physician ${physician.user_id}:`, physicianMessage.error);
                }

                // Create notification entry for physician
                const physicianNotification = await createNotification({
                  recipient_id: physician.user_id,
                  patient_id: request.patient_id, // Include patient_id so staff can see this
                  title: 'New Appointment Scheduled',
                  message: `${appointment.patient_name} has an appointment scheduled on ${formattedDate}`,
                  type: 'appointment',
                  payload: JSON.stringify(physicianPayload)
                });

                if (physicianNotification.success) {
                  console.log(`✅ Notification created for physician ${physician.user_id}`);
                } else {
                  console.error(`❌ Failed to create notification for physician ${physician.user_id}:`, physicianNotification.error);
                }

                // Emit real-time socket notification
                if (io) {
                  io.to(`user_${physician.user_id}`).emit('newNotification', {
                    type: 'appointment_scheduled',
                    title: 'New Appointment Scheduled',
                    message: physicianBody,
                    appointment_id: appointment_id,
                    patient_name: appointment.patient_name,
                    facility_name: appointment.facility_name,
                    timestamp: new Date().toISOString()
                  });
                  
                  // Also emit appointment update event for real-time refresh
                  io.to(`user_${physician.user_id}`).emit('appointmentUpdated', {
                    appointment_id: appointment_id,
                    action: 'created',
                    status: 'confirmed'
                  });
                  
                  console.log(`✅ Socket events sent to physician ${physician.user_id}`);
                }
              } catch (notifErr) {
                console.error(`Error notifying physician ${physician.user_id}:`, notifErr);
                console.error('Error stack:', notifErr.stack);
              }
            }

            console.log(`✅ Notified ${physiciansToNotify.length} physicians about appointment ${appointment_id}`);
          } else {
            console.log(`⚠️ No facility_id available, cannot notify physicians`);
          }
        }
      }
    } catch (physicianNotifError) {
      console.error('Error sending physician notification (non-fatal):', physicianNotifError);
      console.error('Error stack:', physicianNotifError.stack);
    }

    // Log audit
    const userInfo = await getUserInfoForAudit(user_id);
    await logAudit({
      action: 'UPDATE',
      table_name: 'appointment_requests',
      record_id: id,
      user_id: user_id,
      user_name: userInfo?.username || 'Unknown',
      ip_address: getClientIp(req),
      changes: JSON.stringify({ status: 'approved', appointment_id: updated[0].appointment_id })
    });

    res.json({
      success: true,
      message: 'Appointment request approved successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('❌ Error approving appointment request:', error);
    console.error('Error stack:', error.stack);
    console.error('Request ID:', id);
    console.error('User ID:', user_id);
    console.error('User Role:', user_role);
    
    // If transaction was started, rollback
    try {
      await db.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to approve appointment request',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST /api/appointment-requests/:id/decline - Case Manager declines request
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

    // Get request
    const [requests] = await db.query(`
      SELECT 
        ar.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name
      FROM appointment_requests ar
      LEFT JOIN patients p ON ar.patient_id = p.patient_id
      WHERE ar.request_id = ?
    `, [id]);

    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment request not found'
      });
    }

    const request = requests[0];

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}`
      });
    }

    // Update request status
    await db.query(`
      UPDATE appointment_requests
      SET status = 'declined',
            reviewed_by = ?,
            reviewed_at = NOW(),
            decline_reason = ?,
            updated_at = NOW()
      WHERE request_id = ?
    `, [user_id, reason, id]);

    // Fetch updated request
    const [updated] = await db.query(`
      SELECT 
        ar.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name
      FROM appointment_requests ar
      LEFT JOIN patients p ON ar.patient_id = p.patient_id
      WHERE ar.request_id = ?
    `, [id]);

    // Notify patient
    try {
      const [patientUsers] = await db.query(`
        SELECT u.user_id 
        FROM patients p
        LEFT JOIN users u ON p.created_by = u.user_id OR p.email = u.email
        WHERE p.patient_id = ?
        LIMIT 1
      `, [request.patient_id]);

      if (patientUsers.length > 0) {
        const patientUserId = patientUsers[0].user_id;

        await db.query(`
          INSERT INTO notifications (
            notification_id,
            recipient_id,
            title,
            message,
            type,
            is_read,
            created_at
          ) VALUES (?, ?, ?, ?, 'appointment', FALSE, NOW())
        `, [
          uuidv4(),
          patientUserId,
          'Appointment Request Declined',
          `Your appointment request for ${new Date(request.requested_date).toLocaleDateString()} at ${request.requested_time} has been declined. Reason: ${reason}`
        ]);

        if (io) {
          io.to(`user_${patientUserId}`).emit('newNotification', {
            type: 'appointment_request_declined',
            title: 'Appointment Request Declined',
            message: 'Your appointment request has been declined',
            decline_reason: reason,
            request_id: id,
            timestamp: new Date().toISOString()
          });
          
          // Emit appointment request update event for real-time refresh
          io.to(`user_${patientUserId}`).emit('appointmentRequestUpdated', {
            request_id: id,
            status: 'declined',
            decline_reason: reason,
            action: 'declined'
          });
        }
      }
    } catch (notifError) {
      console.error('Error sending decline notification (non-fatal):', notifError);
    }

    // Notify case managers about the decline (for real-time refresh)
    try {
      const [caseManagers] = await db.query(`
        SELECT u.user_id 
        FROM users u
        WHERE u.role IN ('case_manager', 'admin') AND u.status = 'active'
      `);

      // Emit real-time update event to all case managers
      if (io && caseManagers.length > 0) {
        caseManagers.forEach(cm => {
          io.to(`user_${cm.user_id}`).emit('newNotification', {
            type: 'appointment_request_declined',
            title: 'Appointment Request Declined',
            message: `Appointment request declined`,
            request_id: id,
            decline_reason: reason,
            timestamp: new Date().toISOString()
          });
          
          // Emit appointment request update event for real-time refresh in AppointmentRequests component
          io.to(`user_${cm.user_id}`).emit('appointmentRequestUpdated', {
            request_id: id,
            status: 'declined',
            decline_reason: reason,
            action: 'declined'
          });
        });
      }
    } catch (notifError) {
      console.error('Error sending case manager decline notification (non-fatal):', notifError);
    }

    // Log audit
    const userInfo = await getUserInfoForAudit(user_id);
    await logAudit({
      action: 'UPDATE',
      table_name: 'appointment_requests',
      record_id: id,
      user_id: user_id,
      user_name: userInfo?.username || 'Unknown',
      ip_address: getClientIp(req),
      changes: JSON.stringify({ status: 'declined', decline_reason: reason })
    });

    res.json({
      success: true,
      message: 'Appointment request declined successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('Error declining appointment request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to decline appointment request',
      error: error.message
    });
  }
});

// DELETE /api/appointment-requests/:id - Cancel appointment request (Patient only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get request
    const [requests] = await db.query(`
      SELECT * FROM appointment_requests WHERE request_id = ?
    `, [id]);

    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment request not found'
      });
    }

    const request = requests[0];

    // Check permissions
    if (req.user.role === 'patient') {
      let patient_id = req.user.patient_id;
      if (!patient_id) {
        const [patients] = await db.query(
          'SELECT patient_id FROM patients WHERE created_by = ? LIMIT 1',
          [req.user.user_id]
        );
        if (patients.length > 0) {
          patient_id = patients[0].patient_id;
        }
      }
      if (request.patient_id !== patient_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Only allow cancellation if status is pending
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending requests can be cancelled'
      });
    }

    // Update status to cancelled
    await db.query(`
      UPDATE appointment_requests
      SET status = 'cancelled'
      WHERE request_id = ?
    `, [id]);

    // Emit socket event for real-time update
    if (io) {
      // Get patient user_id for socket room
      const [patientUsers] = await db.query(`
        SELECT u.user_id 
        FROM patients p
        LEFT JOIN users u ON p.created_by = u.user_id OR p.email = u.email
        WHERE p.patient_id = ?
        LIMIT 1
      `, [request.patient_id]);

      if (patientUsers.length > 0) {
        const patientUserId = patientUsers[0].user_id;
        io.to(`user_${patientUserId}`).emit('appointmentRequestUpdated', {
          request_id: id,
          status: 'cancelled',
          action: 'cancelled'
        });
      }
    }

    // Log audit
    const userInfo = await getUserInfoForAudit(req.user.user_id);
    await logAudit({
      action: 'UPDATE',
      table_name: 'appointment_requests',
      record_id: id,
      user_id: req.user.user_id,
      user_name: userInfo?.username || 'Unknown',
      ip_address: getClientIp(req),
      changes: JSON.stringify({ status: 'cancelled' })
    });

    res.json({
      success: true,
      message: 'Appointment request cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling appointment request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment request',
      error: error.message
    });
  }
});

export default router;

