import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from './auth.js';
import { logAudit, getUserInfoForAudit, getClientIp } from '../utils/auditLogger.js';

const router = express.Router();

// GET /api/users/providers - Get all physicians/providers (available to all authenticated users)
router.get('/providers', authenticateToken, async (req, res) => {
  try {
    const { facility_id } = req.query;

    console.log('=== GET /api/users/providers ===');
    console.log('Request user:', req.user);
    console.log('Query params:', { facility_id });

    // First, let's check ALL users with physician role (for debugging)
    const [allPhysicians] = await db.query(`
      SELECT user_id, username, email, full_name, role, status, facility_id
      FROM users
      WHERE role = 'physician'
    `);
    console.log('🔍 ALL physicians in database (any status):', allPhysicians.length);
    allPhysicians.forEach(p => {
      console.log(`  - ${p.full_name} (${p.username}): role=${p.role}, status=${p.status}, facility_id=${p.facility_id}`);
    });

    // Query: Get all physicians (regardless of status for now, to see all records)
    // You can change back to 'AND u.status = 'active'' if needed
    let query = `
      SELECT u.user_id, u.username, u.email, u.full_name, u.role, u.status, 
             u.facility_id, u.phone,
             f.facility_name
      FROM users u
      LEFT JOIN facilities f ON u.facility_id = f.facility_id
      WHERE u.role = 'physician'
    `;

    const params = [];

    if (facility_id) {
      query += ' AND u.facility_id = ?';
      params.push(facility_id);
    }

    query += ' ORDER BY u.full_name ASC';

    console.log('Executing query:', query);
    console.log('Query params:', params);

    const [providers] = await db.query(query, params);

    console.log('✅ Found active providers:', providers.length);
    providers.forEach(p => {
      console.log(`  - ${p.full_name} (${p.username}): facility=${p.facility_name || 'N/A'}`);
    });

    res.json({ success: true, providers });
  } catch (error) {
    console.error('❌ Error fetching providers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch providers',
      error: error.message 
    });
  }
});

// GET /api/users - Get all users (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Only admin can view all users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin role required.' 
      });
    }

    const { search, role, status } = req.query;

    let query = `
      SELECT u.user_id, u.username, u.email, u.full_name, u.role, u.status, 
             u.facility_id, u.phone, u.last_login, u.created_at,
             f.facility_name
      FROM users u
      LEFT JOIN facilities f ON u.facility_id = f.facility_id
      WHERE 1=1
    `;

    const params = [];

    if (search) {
      query += ` AND (
        u.username LIKE ? OR 
        u.email LIKE ? OR 
        u.full_name LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (role) {
      query += ' AND u.role = ?';
      params.push(role);
    }

    if (status) {
      query += ' AND u.status = ?';
      params.push(status);
    }

    query += ' ORDER BY u.created_at DESC';

    const [users] = await db.query(query, params);

    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch users',
      error: error.message 
    });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Users can view their own profile, or admin can view any
    if (req.user.user_id !== id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    const [users] = await db.query(
      `SELECT u.user_id, u.username, u.email, u.full_name, u.role, u.status, 
              u.facility_id, u.phone, u.last_login, u.created_at,
              f.facility_name
       FROM users u
       LEFT JOIN facilities f ON u.facility_id = f.facility_id
       WHERE u.user_id = ?`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({ success: true, user: users[0] });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user',
      error: error.message 
    });
  }
});

// PUT /api/users/:id/role - Update user role (admin only)
router.put('/:id/role', authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  let userInfo = null;

  try {
    // Only admin can change roles
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin role required.' 
      });
    }

    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    const validRoles = ['admin', 'physician', 'nurse', 'case_manager', 'lab_personnel', 'patient'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
      });
    }

    // Prevent admin from changing their own role
    if (req.user.user_id === id && role !== 'admin') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot change your own role from admin' 
      });
    }

    await connection.beginTransaction();

    // Check if user exists
    const [users] = await connection.query(
      'SELECT user_id, username, full_name, role FROM users WHERE user_id = ?',
      [id]
    );

    if (users.length === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const user = users[0];

    // Update role
    await connection.query(
      'UPDATE users SET role = ?, updated_at = NOW() WHERE user_id = ?',
      [role, id]
    );

    // Get user info for audit logging
    userInfo = await getUserInfoForAudit(req.user.user_id);

    // Log audit entry
    if (userInfo) {
      await logAudit({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_role: userInfo.user_role,
        action: 'UPDATE',
        module: 'Users',
        entity_type: 'user',
        entity_id: id,
        record_id: id,
        old_value: { role: user.role },
        new_value: { role },
        change_summary: `Changed role of ${user.full_name} (${user.username}) from ${user.role} to ${role}`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
        status: 'success',
      });
    }

    await connection.commit();

    res.json({ 
      success: true, 
      message: 'User role updated successfully',
      user: {
        user_id: id,
        role
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating user role:', error);

    // Log failed audit entry
    if (userInfo) {
      await logAudit({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_role: userInfo.user_role,
        action: 'UPDATE',
        module: 'Users',
        entity_type: 'user',
        entity_id: req.params.id,
        status: 'failed',
        error_message: error.message,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Failed to update user role',
      error: error.message 
    });
  } finally {
    connection.release();
  }
});

// PUT /api/users/:id/status - Update user status (admin only)
router.put('/:id/status', authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  let userInfo = null;

  try {
    // Only admin can change status
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin role required.' 
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['active', 'inactive', 'suspended', 'pending'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    // Prevent admin from deactivating themselves
    if (req.user.user_id === id && status !== 'active') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot change your own status from active' 
      });
    }

    await connection.beginTransaction();

    // Check if user exists
    const [users] = await connection.query(
      'SELECT user_id, username, full_name, status FROM users WHERE user_id = ?',
      [id]
    );

    if (users.length === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const user = users[0];

    // Update status
    await connection.query(
      'UPDATE users SET status = ?, updated_at = NOW() WHERE user_id = ?',
      [status, id]
    );

    // Get user info for audit logging
    userInfo = await getUserInfoForAudit(req.user.user_id);

    // Log audit entry
    if (userInfo) {
      await logAudit({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_role: userInfo.user_role,
        action: 'UPDATE',
        module: 'Users',
        entity_type: 'user',
        entity_id: id,
        record_id: id,
        old_value: { status: user.status },
        new_value: { status },
        change_summary: `Changed status of ${user.full_name} (${user.username}) from ${user.status} to ${status}`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
        status: 'success',
      });
    }

    await connection.commit();

    res.json({ 
      success: true, 
      message: 'User status updated successfully',
      user: {
        user_id: id,
        status
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating user status:', error);

    // Log failed audit entry
    if (userInfo) {
      await logAudit({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_role: userInfo.user_role,
        action: 'UPDATE',
        module: 'Users',
        entity_type: 'user',
        entity_id: req.params.id,
        status: 'failed',
        error_message: error.message,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Failed to update user status',
      error: error.message 
    });
  } finally {
    connection.release();
  }
});

/**
 * GET /api/users/:id/permissions - Get all permissions for a user
 * 
 * HOW IT WORKS:
 * 1. User can view their own permissions
 * 2. Admin can view any user's permissions
 * 3. Queries: user_roles → role_permissions → permissions
 * 4. Returns list of all permissions the user has through their roles
 * 
 * USAGE:
 * GET /api/users/{user_id}/permissions
 * Headers: Authorization: Bearer {token}
 */
router.get('/:id/permissions', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user.user_id;
    const requestingUserRole = req.user.role;

    // Users can only view their own permissions, unless they're admin
    if (requestingUserId !== id && requestingUserRole !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view your own permissions.' 
      });
    }

    // Query: Get all permissions for this user through their roles
    // Flow: user_roles → role_permissions → permissions
    const [permissions] = await db.query(
      `SELECT DISTINCT 
         p.permission_id,
         p.permission_code,
         p.permission_name,
         p.module,
         p.action,
         p.description,
         r.role_id,
         r.role_name,
         r.role_code,
         ur.assigned_at
       FROM permissions p
       INNER JOIN role_permissions rp ON p.permission_id = rp.permission_id
       INNER JOIN roles r ON rp.role_id = r.role_id
       INNER JOIN user_roles ur ON r.role_id = ur.role_id
       WHERE ur.user_id = ?
       ORDER BY p.module, p.permission_name ASC`,
      [id]
    );

    // Also get user's roles for context
    const [roles] = await db.query(
      `SELECT r.role_id, r.role_code, r.role_name, r.description, ur.assigned_at
       FROM roles r
       INNER JOIN user_roles ur ON r.role_id = ur.role_id
       WHERE ur.user_id = ?
       ORDER BY r.role_name ASC`,
      [id]
    );

    res.json({ 
      success: true, 
      permissions,
      roles,
      user_id: id
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user permissions',
      error: error.message 
    });
  }
});

export default router;













