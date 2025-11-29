import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from './auth.js';
import { logAudit, getUserInfoForAudit, getClientIp } from '../utils/auditLogger.js';
import crypto from 'crypto';

const router = express.Router();

// GET /api/user-facility-assignments/user/:userId - Get all facility assignments for a user
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    // Users can view their own assignments, admins can view any
    if (req.user.user_id !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const [assignments] = await db.query(
      `SELECT 
        ufa.*,
        f.facility_name,
        f.facility_type,
        f.is_active as facility_is_active,
        u1.full_name,
        u1.username,
        u1.email,
        u1.role,
        u2.full_name as assigned_by_name
      FROM user_facility_assignments ufa
      LEFT JOIN facilities f ON ufa.facility_id = f.facility_id
      LEFT JOIN users u1 ON ufa.user_id = u1.user_id
      LEFT JOIN users u2 ON ufa.assigned_by = u2.user_id
      WHERE ufa.user_id = ?
      ORDER BY ufa.is_primary DESC, ufa.assigned_at DESC`,
      [req.params.userId]
    );

    res.json({ success: true, data: assignments });
  } catch (error) {
    console.error('Error fetching user facility assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user facility assignments',
    });
  }
});

// GET /api/user-facility-assignments/facility/:facilityId - Get all users assigned to a facility
router.get('/facility/:facilityId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    const [assignments] = await db.query(
      `SELECT 
        ufa.*,
        u.username,
        u.email,
        u.full_name,
        u.role,
        u.status as user_status,
        u2.full_name as assigned_by_name
      FROM user_facility_assignments ufa
      LEFT JOIN users u ON ufa.user_id = u.user_id
      LEFT JOIN users u2 ON ufa.assigned_by = u2.user_id
      WHERE ufa.facility_id = ?
      ORDER BY ufa.is_primary DESC, u.full_name ASC`,
      [req.params.facilityId]
    );

    res.json({ success: true, data: assignments });
  } catch (error) {
    console.error('Error fetching facility user assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch facility user assignments',
    });
  }
});

// POST /api/user-facility-assignments - Assign user to facility (admin only)
router.post('/', authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  let userInfo = null;

  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    const { user_id, facility_id, is_primary = false } = req.body;

    if (!user_id || !facility_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Facility ID are required',
      });
    }

    await connection.beginTransaction();

    // Check if user exists
    const [users] = await connection.query(
      'SELECT user_id, full_name FROM users WHERE user_id = ?',
      [user_id]
    );

    if (users.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if facility exists
    const [facilities] = await connection.query(
      'SELECT facility_id, facility_name FROM facilities WHERE facility_id = ?',
      [facility_id]
    );

    if (facilities.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Facility not found',
      });
    }

    // Check if assignment already exists
    const [existing] = await connection.query(
      'SELECT assignment_id FROM user_facility_assignments WHERE user_id = ? AND facility_id = ?',
      [user_id, facility_id]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'User is already assigned to this facility',
      });
    }

    // If setting as primary, unset other primary assignments for this user
    if (is_primary) {
      await connection.query(
        'UPDATE user_facility_assignments SET is_primary = 0 WHERE user_id = ? AND is_primary = 1',
        [user_id]
      );

      // Also update users.facility_id to match
      await connection.query(
        'UPDATE users SET facility_id = ? WHERE user_id = ?',
        [facility_id, user_id]
      );
    }

    const assignment_id = crypto.randomUUID();

    await connection.query(
      `INSERT INTO user_facility_assignments 
       (assignment_id, user_id, facility_id, is_primary, assigned_by)
       VALUES (?, ?, ?, ?, ?)`,
      [assignment_id, user_id, facility_id, is_primary ? 1 : 0, req.user.user_id]
    );

    const [newAssignment] = await connection.query(
      `SELECT 
        ufa.*,
        f.facility_name,
        u.full_name as user_name
      FROM user_facility_assignments ufa
      LEFT JOIN facilities f ON ufa.facility_id = f.facility_id
      LEFT JOIN users u ON ufa.user_id = u.user_id
      WHERE ufa.assignment_id = ?`,
      [assignment_id]
    );

    userInfo = await getUserInfoForAudit(req.user.user_id);

    if (userInfo) {
      await logAudit({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_role: userInfo.user_role,
        action: 'CREATE',
        module: 'User Facility Assignments',
        entity_type: 'user_facility_assignment',
        entity_id: assignment_id,
        record_id: `${users[0].full_name} → ${facilities[0].facility_name}`,
        new_value: {
          user_id,
          facility_id,
          is_primary,
        },
        change_summary: `Assigned user ${users[0].full_name} to facility ${facilities[0].facility_name}${is_primary ? ' (Primary)' : ''}`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
        status: 'success',
      });
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      data: newAssignment[0],
      message: 'User assigned to facility successfully',
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error assigning user to facility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign user to facility',
    });
  } finally {
    connection.release();
  }
});

// PUT /api/user-facility-assignments/:id - Update assignment (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  let userInfo = null;

  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    const { is_primary } = req.body;
    const { id } = req.params;

    await connection.beginTransaction();

    // Check if assignment exists
    const [existing] = await connection.query(
      `SELECT 
        ufa.*,
        u.full_name as user_name,
        f.facility_name
      FROM user_facility_assignments ufa
      LEFT JOIN users u ON ufa.user_id = u.user_id
      LEFT JOIN facilities f ON ufa.facility_id = f.facility_id
      WHERE ufa.assignment_id = ?`,
      [id]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    const oldIsPrimary = existing[0].is_primary;

    // If setting as primary, unset other primary assignments for this user
    if (is_primary && !oldIsPrimary) {
      await connection.query(
        'UPDATE user_facility_assignments SET is_primary = 0 WHERE user_id = ? AND is_primary = 1',
        [existing[0].user_id]
      );

      // Also update users.facility_id to match
      await connection.query(
        'UPDATE users SET facility_id = ? WHERE user_id = ?',
        [existing[0].facility_id, existing[0].user_id]
      );
    }

    // Update assignment
    await connection.query(
      'UPDATE user_facility_assignments SET is_primary = ? WHERE assignment_id = ?',
      [is_primary ? 1 : 0, id]
    );

    const [updated] = await connection.query(
      `SELECT 
        ufa.*,
        f.facility_name,
        u.full_name as user_name
      FROM user_facility_assignments ufa
      LEFT JOIN facilities f ON ufa.facility_id = f.facility_id
      LEFT JOIN users u ON ufa.user_id = u.user_id
      WHERE ufa.assignment_id = ?`,
      [id]
    );

    userInfo = await getUserInfoForAudit(req.user.user_id);

    if (userInfo) {
      await logAudit({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_role: userInfo.user_role,
        action: 'UPDATE',
        module: 'User Facility Assignments',
        entity_type: 'user_facility_assignment',
        entity_id: id,
        record_id: `${existing[0].user_name} → ${existing[0].facility_name}`,
        old_value: { is_primary: oldIsPrimary },
        new_value: { is_primary: is_primary },
        change_summary: `${is_primary ? 'Set' : 'Unset'} primary facility for ${existing[0].user_name}`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
        status: 'success',
      });
    }

    await connection.commit();

    res.json({
      success: true,
      data: updated[0],
      message: 'Assignment updated successfully',
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update assignment',
    });
  } finally {
    connection.release();
  }
});

// DELETE /api/user-facility-assignments/:id - Remove assignment (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  let userInfo = null;

  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    const { id } = req.params;

    await connection.beginTransaction();

    // Get assignment details before deletion
    const [existing] = await connection.query(
      `SELECT 
        ufa.*,
        u.full_name as user_name,
        f.facility_name
      FROM user_facility_assignments ufa
      LEFT JOIN users u ON ufa.user_id = u.user_id
      LEFT JOIN facilities f ON ufa.facility_id = f.facility_id
      WHERE ufa.assignment_id = ?`,
      [id]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    await connection.query(
      'DELETE FROM user_facility_assignments WHERE assignment_id = ?',
      [id]
    );

    // If this was the primary facility, set users.facility_id to NULL or another primary
    if (existing[0].is_primary) {
      const [otherPrimary] = await connection.query(
        'SELECT facility_id FROM user_facility_assignments WHERE user_id = ? AND is_primary = 1 LIMIT 1',
        [existing[0].user_id]
      );

      if (otherPrimary.length > 0) {
        await connection.query(
          'UPDATE users SET facility_id = ? WHERE user_id = ?',
          [otherPrimary[0].facility_id, existing[0].user_id]
        );
      } else {
        await connection.query(
          'UPDATE users SET facility_id = NULL WHERE user_id = ?',
          [existing[0].user_id]
        );
      }
    }

    userInfo = await getUserInfoForAudit(req.user.user_id);

    if (userInfo) {
      await logAudit({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_role: userInfo.user_role,
        action: 'DELETE',
        module: 'User Facility Assignments',
        entity_type: 'user_facility_assignment',
        entity_id: id,
        record_id: `${existing[0].user_name} → ${existing[0].facility_name}`,
        old_value: {
          user_id: existing[0].user_id,
          facility_id: existing[0].facility_id,
          is_primary: existing[0].is_primary,
        },
        change_summary: `Removed assignment: ${existing[0].user_name} from ${existing[0].facility_name}`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
        status: 'success',
      });
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Assignment removed successfully',
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error removing assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove assignment',
    });
  } finally {
    connection.release();
  }
});

export default router;

