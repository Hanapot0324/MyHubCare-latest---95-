import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// GET /api/audit-logs - Get audit logs with optional filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { action, module, date, limit = 1000, offset = 0 } = req.query;
    const userId = req.user.user_id;
    const userRole = req.user.role;

    // Build query
    let query = 'SELECT * FROM audit_log WHERE 1=1';
    const params = [];

    // Non-admin users can only see their own logs
    if (userRole !== 'admin') {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    // Filter by action
    if (action) {
      query += ' AND LOWER(action) = LOWER(?)';
      params.push(action);
    }

    // Filter by module
    if (module) {
      query += ' AND LOWER(module) = LOWER(?)';
      params.push(module);
    }

    // Filter by date
    if (date) {
      query += ' AND DATE(timestamp) = ?';
      params.push(date);
    }

    // Order by timestamp (newest first)
    query += ' ORDER BY timestamp DESC';

    // Add limit and offset
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [logs] = await db.query(query, params);

    // Format logs to match frontend expectations
    const formattedLogs = logs.map((log) => ({
      audit_id: log.audit_id,
      id: log.audit_id, // Alias for compatibility
      user_id: log.user_id,
      user_name: log.user_name,
      user_role: log.user_role,
      action: log.action,
      module: log.module,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      record_id: log.record_id,
      old_value: log.old_value,
      new_value: log.new_value,
      change_summary: log.change_summary,
      ip_address: log.ip_address,
      device_type: log.device_type || (log.user_agent ? extractDeviceType(log.user_agent) : null),
      status: log.status || 'success',
      error_message: log.error_message,
      remarks: log.remarks,
      timestamp: log.timestamp || log.created_at,
      created_at: log.created_at || log.timestamp,
    }));

    res.json({
      success: true,
      logs: formattedLogs,
      total: formattedLogs.length,
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: error.message,
    });
  }
});

// Helper function to extract device type from user agent
function extractDeviceType(userAgent) {
  if (!userAgent) return 'Unknown';
  
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'Mobile';
  }
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'Tablet';
  }
  return 'Desktop';
}

export default router;

