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

// Helper function to generate availability slots from assignment
async function generateSlotsFromAssignment(assignment) {
  const slots = [];
  const startDate = new Date(assignment.start_date);
  const endDate = new Date(assignment.end_date);
  const daysOfWeek = assignment.days_of_week.split(',');

  // Map day names to numbers (0 = Sunday, 1 = Monday, etc.)
  const dayMap = {
    'sun': 0, 'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 'fri': 5, 'sat': 6
  };

  const enabledDays = daysOfWeek.map(day => dayMap[day.trim()]);

  // Generate slots for each day in the date range
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay();
    
    // Skip if this day is not in the enabled days
    if (!enabledDays.includes(dayOfWeek)) {
      continue;
    }

    // Generate hourly slots from daily_start to daily_end
    const [startHour, startMin] = assignment.daily_start.split(':').map(Number);
    const [endHour, endMin] = assignment.daily_end.split(':').map(Number);
    
    const slotDate = date.toISOString().split('T')[0];
    
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
        provider_id: assignment.provider_id,
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
  }

  // Insert all slots in batch using parameterized queries
  if (slots.length > 0) {
    // Insert slots in batches to avoid query size limits
    const batchSize = 100;
    for (let i = 0; i < slots.length; i += batchSize) {
      const batch = slots.slice(i, i + batchSize);
      const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)').join(',');
      const values = batch.flatMap(slot => [
        slot.slot_id,
        slot.provider_id,
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
          slot_id, provider_id, facility_id, slot_date, start_time, end_time, 
          slot_status, appointment_id, assignment_id, lock_status
        ) VALUES ${placeholders}
      `, values);
    }
  }

  return slots.length;
}

// Helper function to apply conflicts to slots
async function applyConflictsToSlots(assignment_id) {
  // Get all conflicts for this assignment
  const [conflicts] = await db.query(`
    SELECT * FROM doctor_conflicts 
    WHERE assignment_id = ?
  `, [assignment_id]);

  if (conflicts.length === 0) {
    return;
  }

  // For each conflict, mark overlapping slots as blocked
  for (const conflict of conflicts) {
    const conflictStart = new Date(conflict.conflict_start);
    const conflictEnd = new Date(conflict.conflict_end);
    const conflictDate = conflictStart.toISOString().split('T')[0];
    const conflictStartTime = conflictStart.toTimeString().slice(0, 8);
    const conflictEndTime = conflictEnd.toTimeString().slice(0, 8);

    await db.query(`
      UPDATE availability_slots
      SET slot_status = 'blocked'
      WHERE assignment_id = ?
        AND slot_date = ?
        AND (
          (start_time < ? AND end_time > ?) OR
          (start_time >= ? AND end_time <= ?)
        )
    `, [
      assignment_id,
      conflictDate,
      conflictEndTime, conflictStartTime,
      conflictStartTime, conflictEndTime
    ]);
  }
}

// GET /api/doctor-assignments/providers - Get providers from doctor assignments (for appointment booking)
// This endpoint is accessible to all authenticated users (patients, case managers, physicians, admins)
router.get('/providers', authenticateToken, async (req, res) => {
  try {
    const { facility_id } = req.query;

    console.log('Fetching providers from doctor assignments, facility_id:', facility_id);

    let query = `
      SELECT DISTINCT
        da.provider_id,
        u.full_name AS provider_name,
        u.user_id,
        f.facility_id,
        f.facility_name
      FROM doctor_assignments da
      LEFT JOIN users u ON da.provider_id = u.user_id
      LEFT JOIN facilities f ON da.facility_id = f.facility_id
      WHERE u.role = 'physician' AND u.status = 'active'
        AND da.start_date <= CURDATE()
        AND da.end_date >= CURDATE()
    `;

    const params = [];

    if (facility_id) {
      query += ' AND da.facility_id = ?';
      params.push(facility_id);
    }

    query += ' ORDER BY u.full_name ASC';

    console.log('Provider query:', query);
    console.log('Provider params:', params);

    const [providers] = await db.query(query, params);

    console.log('Found providers:', providers.length);

    res.json({
      success: true,
      providers: providers
    });
  } catch (error) {
    console.error('Error fetching providers from doctor assignments:', error);
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

    const { provider_id, facility_id, is_locked } = req.query;

    let query = `
      SELECT 
        da.*,
        u.full_name AS provider_name,
        f.facility_name
      FROM doctor_assignments da
      LEFT JOIN users u ON da.provider_id = u.user_id
      LEFT JOIN facilities f ON da.facility_id = f.facility_id
      WHERE 1=1
    `;

    const params = [];

    if (provider_id) {
      query += ' AND da.provider_id = ?';
      params.push(provider_id);
    }

    if (facility_id) {
      query += ' AND da.facility_id = ?';
      params.push(facility_id);
    }

    if (is_locked !== undefined) {
      query += ' AND da.is_locked = ?';
      params.push(is_locked === 'true' || is_locked === true);
    }

    query += ' ORDER BY da.start_date DESC, da.created_at DESC';

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
        u.full_name AS provider_name,
        f.facility_name
      FROM doctor_assignments da
      LEFT JOIN users u ON da.provider_id = u.user_id
      LEFT JOIN facilities f ON da.facility_id = f.facility_id
      WHERE da.assignment_id = ?
    `, [id]);

    if (assignments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor assignment not found'
      });
    }

    // Get conflicts for this assignment
    const [conflicts] = await db.query(`
      SELECT 
        dc.*,
        u.full_name AS created_by_name
      FROM doctor_conflicts dc
      LEFT JOIN users u ON dc.created_by = u.user_id
      WHERE dc.assignment_id = ?
      ORDER BY dc.conflict_start ASC
    `, [id]);

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

// POST /api/doctor-assignments - Create new doctor assignment
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
      provider_id,
      facility_id,
      start_date,
      end_date,
      daily_start,
      daily_end,
      days_of_week,
      is_locked = false
    } = req.body;

    // Validation
    if (!provider_id || !facility_id || !start_date || !end_date || !daily_start || !daily_end || !days_of_week) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: provider_id, facility_id, start_date, end_date, daily_start, daily_end, days_of_week'
      });
    }

    // Validate provider exists
    const [providers] = await db.query('SELECT user_id FROM users WHERE user_id = ? AND role = "physician"', [provider_id]);
    if (providers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found or is not a physician'
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

    // Validate dates
    const start = new Date(start_date);
    const end = new Date(end_date);
    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'start_date must be before end_date'
      });
    }

    // Validate days_of_week format
    const validDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const days = days_of_week.split(',').map(d => d.trim());
    if (!days.every(d => validDays.includes(d))) {
      return res.status(400).json({
        success: false,
        message: `days_of_week must be comma-separated values from: ${validDays.join(', ')}`
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
          provider_id,
          facility_id,
          start_date,
          end_date,
          daily_start,
          daily_end,
          days_of_week,
          is_locked,
          created_by,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [assignment_id, provider_id, facility_id, start_date, end_date, daily_start, daily_end, days_of_week, is_locked, req.user.user_id]);

      // Generate availability slots automatically
      const assignment = {
        assignment_id,
        provider_id,
        facility_id,
        start_date,
        end_date,
        daily_start,
        daily_end,
        days_of_week,
        is_locked
      };

      const slotsGenerated = await generateSlotsFromAssignment(assignment);

      // Apply conflicts if any exist (though there won't be any for a new assignment)
      await applyConflictsToSlots(assignment_id);

      await db.query('COMMIT');
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

    // Fetch created assignment
    const [created] = await db.query(`
      SELECT 
        da.*,
        u.full_name AS provider_name,
        f.facility_name
      FROM doctor_assignments da
      LEFT JOIN users u ON da.provider_id = u.user_id
      LEFT JOIN facilities f ON da.facility_id = f.facility_id
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
      start_date,
      end_date,
      daily_start,
      daily_end,
      days_of_week,
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

    // Build update query
    const updates = [];
    const params = [];

    if (start_date !== undefined) {
      updates.push('start_date = ?');
      params.push(start_date);
    }
    if (end_date !== undefined) {
      updates.push('end_date = ?');
      params.push(end_date);
    }
    if (daily_start !== undefined) {
      updates.push('daily_start = ?');
      params.push(daily_start);
    }
    if (daily_end !== undefined) {
      updates.push('daily_end = ?');
      params.push(daily_end);
    }
    if (days_of_week !== undefined) {
      updates.push('days_of_week = ?');
      params.push(days_of_week);
    }
    if (is_locked !== undefined) {
      updates.push('is_locked = ?');
      params.push(is_locked);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

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
      if (start_date || end_date || daily_start || daily_end || days_of_week || is_locked !== undefined) {
        // Delete existing slots for this assignment
        await db.query(`
          DELETE FROM availability_slots
          WHERE assignment_id = ? AND appointment_id IS NULL
        `, [id]);

        // Regenerate slots
        const updatedAssignment = {
          ...oldData,
          ...(start_date && { start_date }),
          ...(end_date && { end_date }),
          ...(daily_start && { daily_start }),
          ...(daily_end && { daily_end }),
          ...(days_of_week && { days_of_week }),
          ...(is_locked !== undefined && { is_locked })
        };

        await generateSlotsFromAssignment(updatedAssignment);
        await applyConflictsToSlots(id);
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
        u.full_name AS provider_name,
        f.facility_name
      FROM doctor_assignments da
      LEFT JOIN users u ON da.provider_id = u.user_id
      LEFT JOIN facilities f ON da.facility_id = f.facility_id
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

    // Start transaction
    await db.query('START TRANSACTION');

    try {
      // Delete conflicts first
      await db.query('DELETE FROM doctor_conflicts WHERE assignment_id = ?', [id]);

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

// POST /api/doctor-assignments/:id/conflicts - Add conflict to assignment
router.post('/:id/conflicts', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { id } = req.params;
    const { conflict_start, conflict_end, reason } = req.body;

    if (!conflict_start || !conflict_end) {
      return res.status(400).json({
        success: false,
        message: 'conflict_start and conflict_end are required'
      });
    }

    // Check if assignment exists
    const [assignments] = await db.query('SELECT * FROM doctor_assignments WHERE assignment_id = ?', [id]);
    if (assignments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor assignment not found'
      });
    }

    const conflict_id = uuidv4();

    await db.query(`
      INSERT INTO doctor_conflicts (
        conflict_id,
        assignment_id,
        conflict_start,
        conflict_end,
        reason,
        created_by,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [conflict_id, id, conflict_start, conflict_end, reason || null, req.user.user_id]);

    // Apply conflict to slots
    await applyConflictsToSlots(id);

    // Fetch created conflict
    const [created] = await db.query(`
      SELECT 
        dc.*,
        u.full_name AS created_by_name
      FROM doctor_conflicts dc
      LEFT JOIN users u ON dc.created_by = u.user_id
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

// DELETE /api/doctor-assignments/:id/conflicts/:conflictId - Remove conflict
router.delete('/:id/conflicts/:conflictId', authenticateToken, async (req, res) => {
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
    await applyConflictsToSlots(conflict.assignment_id);

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

