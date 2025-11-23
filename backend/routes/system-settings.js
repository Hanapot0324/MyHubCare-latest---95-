import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from './auth.js';
import { logAudit, getUserInfoForAudit, getClientIp } from '../utils/auditLogger.js';

const router = express.Router();

// GET /api/system-settings - Get all settings (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    const { search, category } = req.query;

    let query = 'SELECT * FROM system_settings WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (setting_key LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (category) {
      query += ' AND setting_key LIKE ?';
      params.push(`${category}.%`);
    }

    query += ' ORDER BY setting_key ASC';

    const [settings] = await db.query(query, params);

    // Parse JSON values
    const settingsWithParsedValues = settings.map((setting) => ({
      ...setting,
      setting_value:
        typeof setting.setting_value === 'string'
          ? JSON.parse(setting.setting_value)
          : setting.setting_value,
    }));

    res.json({ success: true, data: settingsWithParsedValues });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system settings',
    });
  }
});

// GET /api/system-settings/:key - Get specific setting
router.get('/:key', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    const [settings] = await db.query(
      'SELECT * FROM system_settings WHERE setting_key = ?',
      [req.params.key]
    );

    if (settings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found',
      });
    }

    const setting = {
      ...settings[0],
      setting_value:
        typeof settings[0].setting_value === 'string'
          ? JSON.parse(settings[0].setting_value)
          : settings[0].setting_value,
    };

    res.json({ success: true, data: setting });
  } catch (error) {
    console.error('Error fetching system setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system setting',
    });
  }
});

// POST /api/system-settings - Create or update setting (admin only)
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

    const { setting_key, setting_value, description } = req.body;

    if (!setting_key || setting_value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Setting key and value are required',
      });
    }

    await connection.beginTransaction();

    // Check if setting exists
    const [existing] = await connection.query(
      'SELECT * FROM system_settings WHERE setting_key = ?',
      [setting_key]
    );

    const settingValueJson = JSON.stringify(setting_value);

    if (existing.length > 0) {
      // Update existing setting
      await connection.query(
        `UPDATE system_settings 
         SET setting_value = ?, description = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ?
         WHERE setting_key = ?`,
        [settingValueJson, description || null, req.user.user_id, setting_key]
      );

      userInfo = await getUserInfoForAudit(req.user.user_id);

      if (userInfo) {
        await logAudit({
          user_id: userInfo.user_id,
          user_name: userInfo.user_name,
          user_role: userInfo.user_role,
          action: 'UPDATE',
          module: 'System Settings',
          entity_type: 'system_setting',
          entity_id: setting_key,
          record_id: setting_key,
          old_value: { setting_value: existing[0].setting_value },
          new_value: { setting_value: setting_value },
          change_summary: `Updated system setting: ${setting_key}`,
          ip_address: getClientIp(req),
          user_agent: req.headers['user-agent'],
          status: 'success',
        });
      }

      await connection.commit();

      const [updated] = await connection.query(
        'SELECT * FROM system_settings WHERE setting_key = ?',
        [setting_key]
      );

      res.json({
        success: true,
        data: {
          ...updated[0],
          setting_value:
            typeof updated[0].setting_value === 'string'
              ? JSON.parse(updated[0].setting_value)
              : updated[0].setting_value,
        },
        message: 'System setting updated successfully',
      });
    } else {
      // Create new setting
      await connection.query(
        `INSERT INTO system_settings (setting_key, setting_value, description, updated_by)
         VALUES (?, ?, ?, ?)`,
        [setting_key, settingValueJson, description || null, req.user.user_id]
      );

      userInfo = await getUserInfoForAudit(req.user.user_id);

      if (userInfo) {
        await logAudit({
          user_id: userInfo.user_id,
          user_name: userInfo.user_name,
          user_role: userInfo.user_role,
          action: 'CREATE',
          module: 'System Settings',
          entity_type: 'system_setting',
          entity_id: setting_key,
          record_id: setting_key,
          new_value: { setting_key, setting_value: setting_value, description },
          change_summary: `Created system setting: ${setting_key}`,
          ip_address: getClientIp(req),
          user_agent: req.headers['user-agent'],
          status: 'success',
        });
      }

      await connection.commit();

      const [newSetting] = await connection.query(
        'SELECT * FROM system_settings WHERE setting_key = ?',
        [setting_key]
      );

      res.status(201).json({
        success: true,
        data: {
          ...newSetting[0],
          setting_value:
            typeof newSetting[0].setting_value === 'string'
              ? JSON.parse(newSetting[0].setting_value)
              : newSetting[0].setting_value,
        },
        message: 'System setting created successfully',
      });
    }
  } catch (error) {
    await connection.rollback();
    console.error('Error saving system setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save system setting',
    });
  } finally {
    connection.release();
  }
});

// PUT /api/system-settings/:key - Update setting (admin only)
router.put('/:key', authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  let userInfo = null;

  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    const { setting_value, description } = req.body;
    const { key } = req.params;

    if (setting_value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Setting value is required',
      });
    }

    await connection.beginTransaction();

    // Check if setting exists
    const [existing] = await connection.query(
      'SELECT * FROM system_settings WHERE setting_key = ?',
      [key]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Setting not found',
      });
    }

    const settingValueJson = JSON.stringify(setting_value);

    await connection.query(
      `UPDATE system_settings 
       SET setting_value = ?, description = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ?
       WHERE setting_key = ?`,
      [
        settingValueJson,
        description !== undefined ? description : existing[0].description,
        req.user.user_id,
        key,
      ]
    );

    userInfo = await getUserInfoForAudit(req.user.user_id);

    if (userInfo) {
      await logAudit({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_role: userInfo.user_role,
        action: 'UPDATE',
        module: 'System Settings',
        entity_type: 'system_setting',
        entity_id: key,
        record_id: key,
        old_value: { setting_value: existing[0].setting_value },
        new_value: { setting_value: setting_value },
        change_summary: `Updated system setting: ${key}`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
        status: 'success',
      });
    }

    await connection.commit();

    const [updated] = await connection.query(
      'SELECT * FROM system_settings WHERE setting_key = ?',
      [key]
    );

    res.json({
      success: true,
      data: {
        ...updated[0],
        setting_value:
          typeof updated[0].setting_value === 'string'
            ? JSON.parse(updated[0].setting_value)
            : updated[0].setting_value,
      },
      message: 'System setting updated successfully',
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating system setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update system setting',
    });
  } finally {
    connection.release();
  }
});

// DELETE /api/system-settings/:key - Delete setting (admin only)
router.delete('/:key', authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  let userInfo = null;

  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    const { key } = req.params;

    await connection.beginTransaction();

    // Check if setting exists
    const [existing] = await connection.query(
      'SELECT * FROM system_settings WHERE setting_key = ?',
      [key]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Setting not found',
      });
    }

    await connection.query('DELETE FROM system_settings WHERE setting_key = ?', [
      key,
    ]);

    userInfo = await getUserInfoForAudit(req.user.user_id);

    if (userInfo) {
      await logAudit({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_role: userInfo.user_role,
        action: 'DELETE',
        module: 'System Settings',
        entity_type: 'system_setting',
        entity_id: key,
        record_id: key,
        old_value: { setting_value: existing[0].setting_value },
        change_summary: `Deleted system setting: ${key}`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
        status: 'success',
      });
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'System setting deleted successfully',
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting system setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete system setting',
    });
  } finally {
    connection.release();
  }
});

export default router;

