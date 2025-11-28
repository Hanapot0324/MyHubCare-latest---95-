import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { authenticateToken } from './auth.js';
import { logAudit, getUserInfoForAudit, getClientIp } from '../utils/auditLogger.js';

const router = express.Router();

// Socket.IO instance (will be set by server.js)
let io = null;

// Function to set Socket.IO instance
export const setSocketIO = (socketIO) => {
  io = socketIO;
};

// Helper function to generate availability slots from assignment (per-day model)
async function generateSlotsFromAssignment(assignment) {
  const slots = [];
  const assignmentDate = new Date(assignment.assignment_date);
  const slotDate = assignmentDate.toISOString().split('T')[0];

  // Generate hourly slots from start_time to end_time
  const [startHour, startMin] = assignment.start_time.split(':').map(Number);
  const [endHour, endMin] = assignment.end_time.split(':').map(Number);
  
  // Generate hourly slots
  for (let hour = startHour; hour < endHour; hour++) {
    const slot_id = uuidv4();
    const startTime = `${String(hour).padStart(2, '0')}:00:00`;
    const endTime = `${String(hour + 1).padStart(2, '0')}:00:00`;
    
    // Determine slot status based on assignment lock status
    const slotStatus = assignment.is_locked ? 'locked' : 'available';
    const lockStatus = assignment.is_locked ? true : false;

    slots.push({
      slot_id,
      provider_id: assignment.doctor_id, // Use doctor_id as provider_id for slots
      doctor_id: assignment.doctor_id,
      facility_id: assignment.facility_id,
      slot_date: slotDate,
      start_time: startTime,
      end_time: endTime,
      slot_status: slotStatus,
      appointment_id: null,
      assignment_id: assignment.assignment_id,
      lock_status: lockStatus
    });
  }

  // Insert all slots in batch using parameterized queries
  if (slots.length > 0) {
    // Insert slots in batches to avoid query size limits
    const batchSize = 100;
    for (let i = 0; i < slots.length; i += batchSize) {
      const batch = slots.slice(i, i + batchSize);
      const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)').join(',');
      const values = batch.flatMap(slot => [
        slot.slot_id,
        slot.provider_id,
        slot.doctor_id,
        slot.facility_id,
        slot.slot_date,
        slot.start_time,
        slot.end_time,
        slot.slot_status,
        slot.assignment_id,
        slot.lock_status ? 1 : 0
      ]);

      await db.query(`
        INSERT INTO availability_slots (
          slot_id, provider_id, doctor_id, facility_id, slot_date, start_time, end_time, 
          slot_status, appointment_id, assignment_id, lock_status
        ) VALUES ${placeholders}
      `, values);
    }
  }

  return slots.length;
}

// Helper function to apply conflicts to slots (standalone conflicts model)
async function applyConflictsToSlots(doctor_id, facility_id, assignment_date) {
  // Get all conflicts for this doctor on this date
  const [conflicts] = await db.query(`
    SELECT * FROM doctor_conflicts 
    WHERE doctor_id = ?
      AND conflict_date = ?
      AND (facility_id IS NULL OR facility_id = ?)
  `, [doctor_id, assignment_date, facility_id]);

  if (conflicts.length === 0) {
    return;
  }

  // For each conflict, mark overlapping slots as blocked
  for (const conflict of conflicts) {
    if (conflict.is_all_day) {
      // Block all slots for this day
      await db.query(`
        UPDATE availability_slots
        SET slot_status = 'blocked'
        WHERE doctor_id = ?
          AND facility_id = ?
          AND slot_date = ?
          AND assignment_id IS NOT NULL
      `, [doctor_id, facility_id, assignment_date]);
    } else {
      // Block only overlapping time slots
      await db.query(`
        UPDATE availability_slots
        SET slot_status = 'blocked'
        WHERE doctor_id = ?
          AND facility_id = ?
          AND slot_date = ?
          AND assignment_id IS NOT NULL
          AND (
            (start_time < ? AND end_time > ?) OR
            (start_time >= ? AND end_time <= ?)
          )
      `, [
        doctor_id,
        facility_id,
        assignment_date,
        conflict.end_time || '23:59:59',
        conflict.start_time || '00:00:00',
        conflict.start_time || '00:00:00',
        conflict.end_time || '23:59:59'
      ]);
    }
  }
}

// GET /api/doctor-assignments/providers - Get providers from doctor assignments (for appointment booking)
// This endpoint is accessible to all authenticated users (patients, case managers, physicians, admins)
router.get('/providers', authenticateToken, async (req, res) => {
  try {
    const { facility_id } = req.query;

    console.log('🔍 Fetching providers from doctor assignments, facility_id:', facility_id);

    // First, try to get providers from active doctor assignments
    let query = `
      SELECT DISTINCT
        da.doctor_id AS provider_id,
        u.full_name AS provider_name,
        u.user_id,
        f.facility_id,
        f.facility_name
      FROM doctor_assignments da
      INNER JOIN users u ON da.doctor_id = u.user_id
      LEFT JOIN facilities f ON da.facility_id = f.facility_id
      WHERE u.role = 'physician' AND u.status = 'active'
        AND da.assignment_date >= CURDATE()
    `;

    const params = [];

    if (facility_id) {
      query += ' AND da.facility_id = ?';
      params.push(facility_id);
    }

    query += ' ORDER BY u.full_name ASC';

    console.log('📋 Provider query:', query);
    console.log('📋 Provider params:', params);

    const [providers] = await db.query(query, params);

    console.log('✅ Found providers from assignments:', providers.length);

    // If no providers found from assignments, fallback to all active physicians
    if (providers.length === 0) {
      console.log('⚠️ No providers found from assignments, falling back to all active physicians...');
      
      let fallbackQuery = `
        SELECT DISTINCT
          u.user_id AS provider_id,
          u.full_name AS provider_name,
          u.user_id,
          f.facility_id,
          f.facility_name
        FROM users u
        LEFT JOIN facilities f ON u.facility_id = f.facility_id
        WHERE u.role = 'physician' AND u.status = 'active'
      `;

      const fallbackParams = [];

      if (facility_id) {
        fallbackQuery += ' AND u.facility_id = ?';
        fallbackParams.push(facility_id);
      }

      fallbackQuery += ' ORDER BY u.full_name ASC';

      console.log('📋 Fallback query:', fallbackQuery);
      console.log('📋 Fallback params:', fallbackParams);

      const [fallbackProviders] = await db.query(fallbackQuery, fallbackParams);
      console.log('✅ Found providers from fallback:', fallbackProviders.length);

      return res.json({
        success: true,
        providers: fallbackProviders
      });
    }

    res.json({
      success: true,
      providers: providers
    });
  } catch (error) {
    console.error('❌ Error fetching providers from doctor assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch providers',
      error: error.message
    });
  }
});

// GET /api/doctor-assignments - Get all doctor assignments
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Only admins can view all assignments
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can view doctor assignments.'
      });
    }

    const { doctor_id, facility_id, is_locked, assignment_date } = req.query;

    let query = `
      SELECT 
        da.*,
        u.full_name AS doctor_name,
        f.facility_name,
        locked_by_user.full_name AS locked_by_name,
        created_by_user.full_name AS created_by_name
      FROM doctor_assignments da
      LEFT JOIN users u ON da.doctor_id = u.user_id
      LEFT JOIN facilities f ON da.facility_id = f.facility_id
      LEFT JOIN users locked_by_user ON da.locked_by = locked_by_user.user_id
      LEFT JOIN users created_by_user ON da.created_by = created_by_user.user_id
      WHERE 1=1
    `;

    const params = [];

    if (doctor_id) {
      query += ' AND da.doctor_id = ?';
      params.push(doctor_id);
    }

    if (facility_id) {
      query += ' AND da.facility_id = ?';
      params.push(facility_id);
    }

    if (is_locked !== undefined) {
      query += ' AND da.is_locked = ?';
      params.push(is_locked === 'true' || is_locked === true);
    }

    if (assignment_date) {
      query += ' AND da.assignment_date = ?';
      params.push(assignment_date);
    }

    query += ' ORDER BY da.assignment_date DESC, da.created_at DESC';

    const [assignments] = await db.query(query, params);

    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching doctor assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor assignments',
      error: error.message
    });
  }
});

// GET /api/doctor-assignments/:id - Get single assignment
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { id } = req.params;

    const [assignments] = await db.query(`
      SELECT 
        da.*,
        u.full_name AS doctor_name,
        f.facility_name,
        locked_by_user.full_name AS locked_by_name,
        created_by_user.full_name AS created_by_name
      FROM doctor_assignments da
      LEFT JOIN users u ON da.doctor_id = u.user_id
      LEFT JOIN facilities f ON da.facility_id = f.facility_id
      LEFT JOIN users locked_by_user ON da.locked_by = locked_by_user.user_id
      LEFT JOIN users created_by_user ON da.created_by = created_by_user.user_id
      WHERE da.assignment_id = ?
    `, [id]);

    if (assignments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor assignment not found'
      });
    }

    const assignment = assignments[0];

    // Get conflicts for this doctor on this date
    const [conflicts] = await db.query(`
      SELECT 
        dc.*,
        u.full_name AS created_by_name
      FROM doctor_conflicts dc
      LEFT JOIN users u ON dc.created_by = u.user_id
      WHERE dc.doctor_id = ?
        AND dc.conflict_date = ?
        AND (dc.facility_id IS NULL OR dc.facility_id = ?)
      ORDER BY dc.conflict_date ASC, dc.start_time ASC
    `, [assignment.doctor_id, assignment.assignment_date, assignment.facility_id]);

    res.json({
      success: true,
      data: {
        ...assignments[0],
        conflicts
      }
    });
  } catch (error) {
    console.error('Error fetching doctor assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor assignment',
      error: error.message
    });
  }
});

// POST /api/doctor-assignments - Create new doctor assignment (per-day model)
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Only admins can create assignments
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can create doctor assignments.'
      });
    }

    const {
      doctor_id,
      facility_id,
      assignment_date,
      start_time,
      end_time,
      max_patients = 8,
      notes,
      is_locked = false
    } = req.body;

    // Validation
    if (!doctor_id || !facility_id || !assignment_date || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: doctor_id, facility_id, assignment_date, start_time, end_time'
      });
    }

    // Validate doctor exists and is a physician
    const [doctors] = await db.query('SELECT user_id FROM users WHERE user_id = ? AND role = "physician"', [doctor_id]);
    if (doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found or is not a physician'
      });
    }

    // Validate facility exists
    const [facilities] = await db.query('SELECT facility_id FROM facilities WHERE facility_id = ?', [facility_id]);
    if (facilities.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Facility not found'
      });
    }

    // Validate date is not in the past
    const assignmentDate = new Date(assignment_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (assignmentDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Assignment date cannot be in the past'
      });
    }

    // Validate time format
    const startTime = new Date(`2000-01-01 ${start_time}`);
    const endTime = new Date(`2000-01-01 ${end_time}`);
    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: 'start_time must be before end_time'
      });
    }

    // Check for existing assignment (unique constraint)
    const [existing] = await db.query(`
      SELECT assignment_id FROM doctor_assignments 
      WHERE doctor_id = ? AND assignment_date = ?
    `, [doctor_id, assignment_date]);
    
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An assignment already exists for this doctor on this date'
      });
    }

    const assignment_id = uuidv4();

    // Start transaction
    await db.query('START TRANSACTION');

    try {
      // Create assignment
      await db.query(`
        INSERT INTO doctor_assignments (
          assignment_id,
          doctor_id,
          facility_id,
          assignment_date,
          start_time,
          end_time,
          max_patients,
          notes,
          is_locked,
          created_by,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [assignment_id, doctor_id, facility_id, assignment_date, start_time, end_time, max_patients, notes || null, is_locked, req.user.user_id]);

      // Generate availability slots automatically
      const assignment = {
        assignment_id,
        doctor_id,
        facility_id,
        assignment_date,
        start_time,
        end_time,
        is_locked
      };

      const slotsGenerated = await generateSlotsFromAssignment(assignment);

      // Apply conflicts if any exist
      await applyConflictsToSlots(doctor_id, facility_id, assignment_date);

      await db.query('COMMIT');
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

    // Fetch created assignment
    const [created] = await db.query(`
      SELECT 
        da.*,
        u.full_name AS doctor_name,
        f.facility_name,
        created_by_user.full_name AS created_by_name
      FROM doctor_assignments da
      LEFT JOIN users u ON da.doctor_id = u.user_id
      LEFT JOIN facilities f ON da.facility_id = f.facility_id
      LEFT JOIN users created_by_user ON da.created_by = created_by_user.user_id
      WHERE da.assignment_id = ?
    `, [assignment_id]);

    // Log audit
    const userInfo = await getUserInfoForAudit(req.user.user_id);
    await logAudit({
      action: 'CREATE',
      table_name: 'doctor_assignments',
      record_id: assignment_id,
      user_id: req.user.user_id,
      user_name: userInfo?.username || 'Unknown',
      ip_address: getClientIp(req),
      changes: JSON.stringify(created[0])
    });

    res.status(201).json({
      success: true,
      message: 'Doctor assignment created successfully. Availability slots generated automatically.',
      data: created[0]
    });
  } catch (error) {
    console.error('Error creating doctor assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create doctor assignment',
      error: error.message
    });
  }
});

// PUT /api/doctor-assignments/:id - Update doctor assignment
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { id } = req.params;
    const {
      start_time,
      end_time,
      max_patients,
      notes,
      is_locked
    } = req.body;

    // Check if assignment exists
    const [existing] = await db.query('SELECT * FROM doctor_assignments WHERE assignment_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor assignment not found'
      });
    }

    const oldData = existing[0];

    // Check if assignment is locked (only admin can unlock)
    if (oldData.is_locked && !is_locked && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify locked assignment. Only admin can unlock.'
      });
    }

    // Build update query
    const updates = [];
    const params = [];

    if (start_time !== undefined) {
      updates.push('start_time = ?');
      params.push(start_time);
    }
    if (end_time !== undefined) {
      updates.push('end_time = ?');
      params.push(end_time);
    }
    if (max_patients !== undefined) {
      updates.push('max_patients = ?');
      params.push(max_patients);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }
    if (is_locked !== undefined) {
      updates.push('is_locked = ?');
      params.push(is_locked);
      if (is_locked && !oldData.is_locked) {
        // Locking assignment
        updates.push('locked_at = NOW()');
        updates.push('locked_by = ?');
        params.push(req.user.user_id);
      } else if (!is_locked && oldData.is_locked) {
        // Unlocking assignment
        updates.push('locked_at = NULL');
        updates.push('locked_by = NULL');
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    // Start transaction
    await db.query('START TRANSACTION');

    try {
      // Update assignment
      await db.query(`
        UPDATE doctor_assignments
        SET ${updates.join(', ')}
        WHERE assignment_id = ?
      `, params);

      // If schedule changed, regenerate slots
      if (start_time || end_time || is_locked !== undefined) {
        // Delete existing slots for this assignment (only unbooked ones)
        await db.query(`
          DELETE FROM availability_slots
          WHERE assignment_id = ? AND appointment_id IS NULL
        `, [id]);

        // Regenerate slots
        const updatedAssignment = {
          ...oldData,
          ...(start_time && { start_time }),
          ...(end_time && { end_time }),
          ...(is_locked !== undefined && { is_locked })
        };

        await generateSlotsFromAssignment(updatedAssignment);
        await applyConflictsToSlots(oldData.doctor_id, oldData.facility_id, oldData.assignment_date);
      }

      await db.query('COMMIT');
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

    // Fetch updated assignment
    const [updated] = await db.query(`
      SELECT 
        da.*,
        u.full_name AS doctor_name,
        f.facility_name,
        locked_by_user.full_name AS locked_by_name,
        created_by_user.full_name AS created_by_name
      FROM doctor_assignments da
      LEFT JOIN users u ON da.doctor_id = u.user_id
      LEFT JOIN facilities f ON da.facility_id = f.facility_id
      LEFT JOIN users locked_by_user ON da.locked_by = locked_by_user.user_id
      LEFT JOIN users created_by_user ON da.created_by = created_by_user.user_id
      WHERE da.assignment_id = ?
    `, [id]);

    // Log audit
    const userInfo = await getUserInfoForAudit(req.user.user_id);
    await logAudit({
      action: 'UPDATE',
      table_name: 'doctor_assignments',
      record_id: id,
      user_id: req.user.user_id,
      user_name: userInfo?.username || 'Unknown',
      ip_address: getClientIp(req),
      changes: JSON.stringify({ old: oldData, new: updated[0] })
    });

    res.json({
      success: true,
      message: 'Doctor assignment updated successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('Error updating doctor assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update doctor assignment',
      error: error.message
    });
  }
});

// DELETE /api/doctor-assignments/:id - Delete doctor assignment
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { id } = req.params;

    // Check if assignment exists
    const [existing] = await db.query('SELECT * FROM doctor_assignments WHERE assignment_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor assignment not found'
      });
    }

    // Check if assignment is locked
    if (existing[0].is_locked) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete locked assignment. Unlock it first.'
      });
    }

    // Start transaction
    await db.query('START TRANSACTION');

    try {
      // Delete slots that aren't booked
      await db.query(`
        DELETE FROM availability_slots
        WHERE assignment_id = ? AND appointment_id IS NULL
      `, [id]);

      // Delete assignment
      await db.query('DELETE FROM doctor_assignments WHERE assignment_id = ?', [id]);

      await db.query('COMMIT');
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

    // Log audit
    const userInfo = await getUserInfoForAudit(req.user.user_id);
    await logAudit({
      action: 'DELETE',
      table_name: 'doctor_assignments',
      record_id: id,
      user_id: req.user.user_id,
      user_name: userInfo?.username || 'Unknown',
      ip_address: getClientIp(req),
      changes: JSON.stringify(existing[0])
    });

    res.json({
      success: true,
      message: 'Doctor assignment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting doctor assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete doctor assignment',
      error: error.message
    });
  }
});

// POST /api/doctor-conflicts - Create standalone conflict (not tied to assignment)
router.post('/conflicts', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can create conflicts.'
      });
    }

    const {
      doctor_id,
      facility_id,
      conflict_date,
      conflict_type,
      reason,
      start_time,
      end_time,
      is_all_day = true
    } = req.body;

    // Validation
    if (!doctor_id || !conflict_date || !conflict_type || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: doctor_id, conflict_date, conflict_type, reason'
      });
    }

    // Validate doctor exists
    const [doctors] = await db.query('SELECT user_id FROM users WHERE user_id = ? AND role = "physician"', [doctor_id]);
    if (doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found or is not a physician'
      });
    }

    // Validate conflict_type
    const validTypes = ['leave', 'meeting', 'training', 'emergency', 'other'];
    if (!validTypes.includes(conflict_type)) {
      return res.status(400).json({
        success: false,
        message: `conflict_type must be one of: ${validTypes.join(', ')}`
      });
    }

    // Validate partial day conflicts have times
    if (!is_all_day && (!start_time || !end_time)) {
      return res.status(400).json({
        success: false,
        message: 'start_time and end_time are required for partial day conflicts'
      });
    }

    const conflict_id = uuidv4();

    await db.query(`
      INSERT INTO doctor_conflicts (
        conflict_id,
        doctor_id,
        facility_id,
        conflict_date,
        conflict_type,
        reason,
        start_time,
        end_time,
        is_all_day,
        created_by,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      conflict_id,
      doctor_id,
      facility_id || null,
      conflict_date,
      conflict_type,
      reason,
      start_time || null,
      end_time || null,
      is_all_day ? 1 : 0,
      req.user.user_id
    ]);

    // Apply conflict to all affected slots
    await applyConflictsToSlots(doctor_id, facility_id, conflict_date);

    // Fetch created conflict
    const [created] = await db.query(`
      SELECT 
        dc.*,
        u.full_name AS doctor_name,
        f.facility_name,
        created_by_user.full_name AS created_by_name
      FROM doctor_conflicts dc
      LEFT JOIN users u ON dc.doctor_id = u.user_id
      LEFT JOIN facilities f ON dc.facility_id = f.facility_id
      LEFT JOIN users created_by_user ON dc.created_by = created_by_user.user_id
      WHERE dc.conflict_id = ?
    `, [conflict_id]);

    // Log audit
    const userInfo = await getUserInfoForAudit(req.user.user_id);
    await logAudit({
      action: 'CREATE',
      table_name: 'doctor_conflicts',
      record_id: conflict_id,
      user_id: req.user.user_id,
      user_name: userInfo?.username || 'Unknown',
      ip_address: getClientIp(req),
      changes: JSON.stringify(created[0])
    });

    res.status(201).json({
      success: true,
      message: 'Conflict added successfully',
      data: created[0]
    });
  } catch (error) {
    console.error('Error adding conflict:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add conflict',
      error: error.message
    });
  }
});

// DELETE /api/doctor-conflicts/:conflictId - Remove conflict
router.delete('/conflicts/:conflictId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { conflictId } = req.params;

    // Get conflict before deletion
    const [conflicts] = await db.query('SELECT * FROM doctor_conflicts WHERE conflict_id = ?', [conflictId]);
    if (conflicts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Conflict not found'
      });
    }

    const conflict = conflicts[0];

    await db.query('DELETE FROM doctor_conflicts WHERE conflict_id = ?', [conflictId]);

    // Reapply conflicts to slots (to unblock slots that were only blocked by this conflict)
    // First, unblock all slots for this doctor/date/facility
    await db.query(`
      UPDATE availability_slots
      SET slot_status = 'available'
      WHERE doctor_id = ?
        AND slot_date = ?
        AND (facility_id = ? OR ? IS NULL)
        AND slot_status = 'blocked'
        AND assignment_id IS NOT NULL
    `, [conflict.doctor_id, conflict.conflict_date, conflict.facility_id, conflict.facility_id]);

    // Then reapply remaining conflicts
    await applyConflictsToSlots(conflict.doctor_id, conflict.facility_id, conflict.conflict_date);

    // Log audit
    const userInfo = await getUserInfoForAudit(req.user.user_id);
    await logAudit({
      action: 'DELETE',
      table_name: 'doctor_conflicts',
      record_id: conflictId,
      user_id: req.user.user_id,
      user_name: userInfo?.username || 'Unknown',
      ip_address: getClientIp(req),
      changes: JSON.stringify(conflict)
    });

    res.json({
      success: true,
      message: 'Conflict removed successfully'
    });
  } catch (error) {
    console.error('Error removing conflict:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove conflict',
      error: error.message
    });
  }
});

export default router;

