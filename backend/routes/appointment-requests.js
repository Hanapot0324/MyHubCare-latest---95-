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
    const { 
      patient_id, 
      status, 
      reviewer_id,
      date_from,
      date_to
    } = req.query;

    let query = `
      SELECT 
        ar.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        p.email AS patient_email,
        u.full_name AS reviewer_name,
        f.facility_name,
        a.appointment_id,
        a.status AS appointment_status
      FROM appointment_requests ar
      LEFT JOIN patients p ON ar.patient_id = p.patient_id
      LEFT JOIN users u ON ar.reviewer_id = u.user_id
      LEFT JOIN facilities f ON ar.preferred_facility_id = f.facility_id
      LEFT JOIN appointments a ON ar.appointment_id = a.appointment_id
      WHERE 1=1
    `;

    const params = [];

    // Role-based filtering
    if (req.user.role === 'patient') {
      // Patients only see their own requests
      query += ' AND ar.patient_id = ?';
      params.push(req.user.patient_id || req.user.user_id);
    } else if (req.user.role === 'case_manager' || req.user.role === 'admin') {
      // Case managers and admins see all requests
      if (patient_id) {
        query += ' AND ar.patient_id = ?';
        params.push(patient_id);
      }
    } else {
      // Other roles see nothing
      return res.json({ success: true, data: [] });
    }

    if (status) {
      query += ' AND ar.status = ?';
      params.push(status);
    }

    if (reviewer_id) {
      query += ' AND ar.reviewer_id = ?';
      params.push(reviewer_id);
    }

    if (date_from) {
      query += ' AND DATE(ar.preferred_start) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      query += ' AND DATE(ar.preferred_start) <= ?';
      params.push(date_to);
    }

    query += ' ORDER BY ar.created_at DESC';

    const [requests] = await db.query(query, params);

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
        a.appointment_id,
        a.status AS appointment_status,
        a.scheduled_start AS appointment_start,
        a.scheduled_end AS appointment_end
      FROM appointment_requests ar
      LEFT JOIN patients p ON ar.patient_id = p.patient_id
      LEFT JOIN users u ON ar.reviewer_id = u.user_id
      LEFT JOIN facilities f ON ar.preferred_facility_id = f.facility_id
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
      preferred_start,
      preferred_end,
      preferred_facility_id,
      notes
    } = req.body;

    // Validation
    if (!preferred_start || !preferred_end) {
      return res.status(400).json({
        success: false,
        message: 'preferred_start and preferred_end are required'
      });
    }

    // Validate date is not in the past - allow same-day booking
    const startDate = new Date(preferred_start);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Appointments cannot be scheduled in the past'
      });
    }

    // Validate hourly intervals
    if (startDate.getMinutes() !== 0) {
      return res.status(400).json({
        success: false,
        message: 'Appointments must start on the hour (e.g., 10:00, 11:00)'
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
        preferred_start,
        preferred_end,
        preferred_facility_id,
        status,
        notes,
        created_at
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?, NOW())
    `, [request_id, patient_id, preferred_start, preferred_end, preferred_facility_id || null, notes || null]);

    // Log audit
    const userInfo = await getUserInfoForAudit(req.user.user_id);
    await logAudit({
      action: 'CREATE',
      table_name: 'appointment_requests',
      record_id: request_id,
      user_id: req.user.user_id,
      user_name: userInfo?.username || 'Unknown',
      ip_address: getClientIp(req),
      changes: JSON.stringify({ preferred_start, preferred_end, preferred_facility_id })
    });

    // Fetch created request
    const [created] = await db.query(`
      SELECT 
        ar.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        f.facility_name
      FROM appointment_requests ar
      LEFT JOIN patients p ON ar.patient_id = p.patient_id
      LEFT JOIN facilities f ON ar.preferred_facility_id = f.facility_id
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
          `${created[0].patient_name} has requested an appointment for ${new Date(preferred_start).toLocaleDateString()} at ${new Date(preferred_start).toLocaleTimeString()}`
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

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}`
      });
    }

    // Check availability and conflicts
    const availabilityCheck = await checkAvailabilityForRequest(
      request.preferred_facility_id,
      null, // provider_id - can be assigned later
      request.preferred_start,
      request.preferred_end
    );

    if (!availabilityCheck.available) {
      return res.status(400).json({
        success: false,
        message: 'The requested time slot is not available',
        conflicts: availabilityCheck.conflicts
      });
    }

    // Start transaction
    await db.query('START TRANSACTION');

    try {
      // Create appointment record
      const appointment_id = uuidv4();
      const duration_minutes = Math.round((new Date(request.preferred_end) - new Date(request.preferred_start)) / 60000);

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
        ) VALUES (?, ?, NULL, ?, 'general', ?, ?, ?, 'scheduled', NULL, ?, ?, NOW())
      `, [
        appointment_id,
        request.patient_id,
        request.preferred_facility_id,
        request.preferred_start,
        request.preferred_end,
        duration_minutes || 60,
        request.notes,
        user_id
      ]);

      // Update request with appointment_id and status
      await db.query(`
        UPDATE appointment_requests
        SET status = 'approved',
            reviewer_id = ?,
            reviewed_at = NOW(),
            appointment_id = ?
        WHERE request_id = ?
      `, [user_id, appointment_id, id]);

      // Find and book an available slot for this appointment
      const startDate = new Date(request.preferred_start);
      const endDate = new Date(request.preferred_end);
      const slotDate = startDate.toISOString().split('T')[0];
      const startTime = startDate.toTimeString().slice(0, 8);
      const endTime = endDate.toTimeString().slice(0, 8);

      // Find available slot that matches the appointment time
      const [availableSlots] = await db.query(`
        SELECT slot_id, provider_id
        FROM availability_slots
        WHERE facility_id = ?
          AND slot_date = ?
          AND start_time <= ?
          AND end_time >= ?
          AND slot_status = 'available'
          AND (lock_status = FALSE OR lock_status IS NULL)
          AND appointment_id IS NULL
        ORDER BY start_time ASC
        LIMIT 1
      `, [request.preferred_facility_id, slotDate, startTime, endTime]);

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
        if (slot.provider_id) {
          await db.query(`
            UPDATE appointments
            SET provider_id = ?
            WHERE appointment_id = ?
          `, [slot.provider_id, appointment_id]);
        }

        console.log(`✅ Booked appointment ${appointment_id} into slot ${slot.slot_id}`);
      } else {
        console.log(`⚠️ No available slot found for appointment ${appointment_id}, appointment created without slot assignment`);
      }

      // Update appointment status to confirmed since it's approved
      await db.query(`
        UPDATE appointments
        SET status = 'confirmed'
        WHERE appointment_id = ?
      `, [appointment_id]);

      await db.query('COMMIT');
    } catch (error) {
      await db.query('ROLLBACK');
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
      LEFT JOIN facilities f ON ar.preferred_facility_id = f.facility_id
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
          `Your appointment request for ${new Date(request.preferred_start).toLocaleDateString()} at ${new Date(request.preferred_start).toLocaleTimeString()} has been approved and booked.`
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
        }
      }
    } catch (notifError) {
      console.error('Error sending approval notification (non-fatal):', notifError);
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
    console.error('Error approving appointment request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve appointment request',
      error: error.message
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
          reviewer_id = ?,
          reviewed_at = NOW(),
          decline_reason = ?
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
          `Your appointment request for ${new Date(request.preferred_start).toLocaleDateString()} at ${new Date(request.preferred_start).toLocaleTimeString()} has been declined. Reason: ${reason}`
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
        }
      }
    } catch (notifError) {
      console.error('Error sending decline notification (non-fatal):', notifError);
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

