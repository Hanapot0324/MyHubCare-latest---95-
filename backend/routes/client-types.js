import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from './auth.js';
import { logAudit, getUserInfoForAudit, getClientIp } from '../utils/auditLogger.js';

const router = express.Router();

// GET /api/client-types - Get all client types
router.get('/', async (req, res) => {
  try {
    const { is_active, search } = req.query;

    let query = 'SELECT * FROM client_types WHERE 1=1';
    const params = [];

    if (is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(is_active === '1' || is_active === 1 ? 1 : 0);
    }

    if (search) {
      query += ' AND (type_name LIKE ? OR type_code LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY type_name ASC';

    const [clientTypes] = await db.query(query, params);
    res.json({ success: true, data: clientTypes });
  } catch (error) {
    console.error('Error fetching client types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client types',
    });
  }
});

// GET /api/client-types/:id - Get single client type
router.get('/:id', async (req, res) => {
  try {
    const [clientTypes] = await db.query(
      'SELECT * FROM client_types WHERE client_type_id = ?',
      [req.params.id]
    );

    if (clientTypes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Client type not found',
      });
    }

    res.json({ success: true, data: clientTypes[0] });
  } catch (error) {
    console.error('Error fetching client type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client type',
    });
  }
});

// POST /api/client-types - Create client type (admin only)
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

    const { type_name, type_code, description, is_active = 1 } = req.body;

    if (!type_name) {
      return res.status(400).json({
        success: false,
        message: 'Client type name is required',
      });
    }

    await connection.beginTransaction();

    // Check if type_code already exists (if provided)
    if (type_code) {
      const [existing] = await connection.query(
        'SELECT client_type_id FROM client_types WHERE type_code = ?',
        [type_code.toUpperCase()]
      );

      if (existing.length > 0) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: 'Client type code already exists',
        });
      }
    }

    const [result] = await connection.query(
      'INSERT INTO client_types (type_name, type_code, description, is_active) VALUES (?, ?, ?, ?)',
      [
        type_name,
        type_code ? type_code.toUpperCase() : null,
        description || null,
        is_active,
      ]
    );

    const [newClientType] = await connection.query(
      'SELECT * FROM client_types WHERE client_type_id = ?',
      [result.insertId]
    );

    userInfo = await getUserInfoForAudit(req.user.user_id);

    if (userInfo) {
      await logAudit({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_role: userInfo.user_role,
        action: 'CREATE',
        module: 'Client Types',
        entity_type: 'client_type',
        entity_id: result.insertId.toString(),
        record_id: type_code || type_name,
        new_value: { type_name, type_code, description, is_active },
        change_summary: `Created client type: ${type_name}`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
        status: 'success',
      });
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      data: newClientType[0],
      message: 'Client type created successfully',
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating client type:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Client type code already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create client type',
    });
  } finally {
    connection.release();
  }
});

// PUT /api/client-types/:id - Update client type (admin only)
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

    const { type_name, type_code, description, is_active } = req.body;
    const { id } = req.params;

    if (!type_name) {
      return res.status(400).json({
        success: false,
        message: 'Client type name is required',
      });
    }

    await connection.beginTransaction();

    // Check if client type exists
    const [existing] = await connection.query(
      'SELECT * FROM client_types WHERE client_type_id = ?',
      [id]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Client type not found',
      });
    }

    // Check if type_code already exists (for different client type)
    if (type_code && type_code !== existing[0].type_code) {
      const [duplicate] = await connection.query(
        'SELECT client_type_id FROM client_types WHERE type_code = ? AND client_type_id != ?',
        [type_code.toUpperCase(), id]
      );

      if (duplicate.length > 0) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: 'Client type code already exists',
        });
      }
    }

    await connection.query(
      'UPDATE client_types SET type_name = ?, type_code = ?, description = ?, is_active = ? WHERE client_type_id = ?',
      [
        type_name,
        type_code ? type_code.toUpperCase() : null,
        description !== undefined ? description : existing[0].description,
        is_active !== undefined ? is_active : existing[0].is_active,
        id,
      ]
    );

    const [updated] = await connection.query(
      'SELECT * FROM client_types WHERE client_type_id = ?',
      [id]
    );

    userInfo = await getUserInfoForAudit(req.user.user_id);

    if (userInfo) {
      await logAudit({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_role: userInfo.user_role,
        action: 'UPDATE',
        module: 'Client Types',
        entity_type: 'client_type',
        entity_id: id,
        record_id: type_code || type_name,
        old_value: {
          type_name: existing[0].type_name,
          type_code: existing[0].type_code,
          description: existing[0].description,
          is_active: existing[0].is_active,
        },
        new_value: { type_name, type_code, description, is_active },
        change_summary: `Updated client type: ${type_name}`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
        status: 'success',
      });
    }

    await connection.commit();

    res.json({
      success: true,
      data: updated[0],
      message: 'Client type updated successfully',
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating client type:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Client type code already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update client type',
    });
  } finally {
    connection.release();
  }
});

// DELETE /api/client-types/:id - Soft delete client type (admin only)
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

    // Check if client type exists
    const [existing] = await connection.query(
      'SELECT * FROM client_types WHERE client_type_id = ?',
      [id]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Client type not found',
      });
    }

    // Soft delete (set is_active = 0)
    await connection.query(
      'UPDATE client_types SET is_active = 0 WHERE client_type_id = ?',
      [id]
    );

    userInfo = await getUserInfoForAudit(req.user.user_id);

    if (userInfo) {
      await logAudit({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_role: userInfo.user_role,
        action: 'DELETE',
        module: 'Client Types',
        entity_type: 'client_type',
        entity_id: id,
        record_id: existing[0].type_code || existing[0].type_name,
        old_value: { type_name: existing[0].type_name },
        change_summary: `Deleted client type: ${existing[0].type_name}`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
        status: 'success',
      });
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Client type deleted successfully',
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting client type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete client type',
    });
  } finally {
    connection.release();
  }
});

// GET /api/client-types/stats/overview - Get client type statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    const [totalCount] = await db.query(
      'SELECT COUNT(*) as total FROM client_types WHERE is_active = 1'
    );

    const [byStatus] = await db.query(
      'SELECT is_active, COUNT(*) as count FROM client_types GROUP BY is_active'
    );

    res.json({
      success: true,
      data: {
        total: totalCount[0].total,
        byStatus: byStatus,
      },
    });
  } catch (error) {
    console.error('Error fetching client type statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
    });
  }
});

export default router;

