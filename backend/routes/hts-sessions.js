import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { authenticateToken } from './auth.js';
import { logAudit, getUserInfoForAudit, getClientIp } from '../utils/auditLogger.js';

const router = express.Router();

// GET /api/hts-sessions - Get all HTS sessions with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'physician', 'nurse', 'case_manager', 'lab_personnel'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { patient_id, tester_id, facility_id, test_result, test_date_from, test_date_to } = req.query;

    let query = `
      SELECT 
        hts.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        u.full_name AS tester_name,
        f.facility_name
      FROM hts_sessions hts
      LEFT JOIN patients p ON hts.patient_id = p.patient_id
      LEFT JOIN users u ON hts.tester_id = u.user_id
      LEFT JOIN facilities f ON hts.facility_id = f.facility_id
      WHERE 1=1
    `;

    const params = [];

    if (patient_id) {
      query += ' AND hts.patient_id = ?';
      params.push(patient_id);
    }

    if (tester_id) {
      query += ' AND hts.tester_id = ?';
      params.push(tester_id);
    }

    if (facility_id) {
      query += ' AND hts.facility_id = ?';
      params.push(facility_id);
    }

    if (test_result) {
      query += ' AND hts.test_result = ?';
      params.push(test_result);
    }

    if (test_date_from) {
      query += ' AND hts.test_date >= ?';
      params.push(test_date_from);
    }

    if (test_date_to) {
      query += ' AND hts.test_date <= ?';
      params.push(test_date_to);
    }

    // Filter by role - only patients see limited data, staff roles see all sessions
    // Admin, physician, nurse, case_manager, and lab_personnel can see all sessions
    // No filtering needed for these roles

    query += ' ORDER BY hts.test_date DESC, hts.created_at DESC';

    const [sessions] = await db.query(query, params);

    res.json({ success: true, sessions });
  } catch (err) {
    console.error('Fetch HTS sessions error:', err);
    console.error('Error details:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET /api/hts-sessions/:id - Get HTS session by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [sessions] = await db.query(
      `SELECT 
        hts.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        u.full_name AS tester_name,
        f.facility_name
      FROM hts_sessions hts
      LEFT JOIN patients p ON hts.patient_id = p.patient_id
      LEFT JOIN users u ON hts.tester_id = u.user_id
      LEFT JOIN facilities f ON hts.facility_id = f.facility_id
      WHERE hts.hts_id = ?`,
      [req.params.id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ success: false, message: 'HTS session not found' });
    }

    // Check access - staff roles (admin, physician, nurse, case_manager, lab_personnel) can see all sessions
    // Only patients would be restricted, but they don't have access to this endpoint
    const allowedRoles = ['admin', 'physician', 'nurse', 'case_manager', 'lab_personnel'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, session: sessions[0] });
  } catch (err) {
    console.error('Fetch HTS session error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/hts-sessions - Conduct HTS session (P7.3)
router.post('/', authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    if (!['admin', 'physician', 'nurse', 'lab_personnel'].includes(req.user.role)) {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const {
      patient_id,
      facility_id,
      tester_id, // Allow selecting a specific tester/counselor
      test_date,
      test_result,
      test_type,
      pre_test_counseling = false,
      post_test_counseling = false,
      linked_to_care = false,
      care_link_date,
      notes,
    } = req.body;

    // Validate required fields
    if (!patient_id || !facility_id || !test_date || !test_result) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: patient_id, facility_id, test_date, test_result',
      });
    }

    // Use provided tester_id or default to current user
    const finalTesterId = tester_id || req.user.user_id;

    // Check if test result is positive/reactive (case-insensitive)
    const testResultLower = (test_result || '').toLowerCase();
    const isPositive = testResultLower === 'positive' || testResultLower === 'reactive';
    
    // If positive, automatically link to care
    const finalLinkedToCare = linked_to_care || isPositive;
    const finalCareLinkDate = finalLinkedToCare 
      ? (care_link_date || test_date) 
      : null;

    // Generate UUID
    const hts_id = uuidv4();

    // Insert HTS session
    await connection.query(
      `INSERT INTO hts_sessions (
        hts_id, patient_id, tester_id, facility_id, test_date,
        test_result, test_type, pre_test_counseling, post_test_counseling,
        linked_to_care, care_link_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        hts_id,
        patient_id,
        finalTesterId, // Use selected tester or current user
        facility_id,
        test_date,
        test_result,
        test_type || null,
        pre_test_counseling ? 1 : 0,
        post_test_counseling ? 1 : 0,
        finalLinkedToCare ? 1 : 0,
        finalCareLinkDate,
        notes || null,
      ]
    );

    // Record Counseling (P7.4): Create counseling_sessions records
    const counselingSessionsCreated = [];
    
    // Create pre-test counseling session if provided
    if (pre_test_counseling) {
      const preCounselingId = uuidv4();
      try {
        await connection.query(
          `INSERT INTO counseling_sessions (
            session_id, patient_id, counselor_id, facility_id, session_date,
            session_type, session_notes, follow_up_required, follow_up_date
          ) VALUES (?, ?, ?, ?, ?, 'pre_test', ?, 0, NULL)`,
          [
            preCounselingId,
            patient_id,
            finalTesterId,
            facility_id,
            test_date,
            `Pre-test counseling for HTS session ${hts_id}. ${notes || ''}`.trim(),
          ]
        );
        counselingSessionsCreated.push({ id: preCounselingId, type: 'pre_test' });
      } catch (counselingErr) {
        // Log but don't fail the transaction if counseling session creation fails
        console.error('Failed to create pre-test counseling session:', counselingErr);
      }
    }

    // Create post-test counseling session if provided
    if (post_test_counseling) {
      const postCounselingId = uuidv4();
      try {
        await connection.query(
          `INSERT INTO counseling_sessions (
            session_id, patient_id, counselor_id, facility_id, session_date,
            session_type, session_notes, follow_up_required, follow_up_date
          ) VALUES (?, ?, ?, ?, ?, 'post_test', ?, 0, NULL)`,
          [
            postCounselingId,
            patient_id,
            finalTesterId,
            facility_id,
            test_date,
            `Post-test counseling for HTS session ${hts_id}. Test result: ${test_result}. ${notes || ''}`.trim(),
          ]
        );
        counselingSessionsCreated.push({ id: postCounselingId, type: 'post_test' });
      } catch (counselingErr) {
        // Log but don't fail the transaction if counseling session creation fails
        console.error('Failed to create post-test counseling session:', counselingErr);
      }
    }

    await connection.commit();

    // Log audit for HTS session creation
    const auditInfo = await getUserInfoForAudit(req.user.user_id);
    await logAudit({
      ...auditInfo,
      action: 'CREATE',
      module: 'HTS Sessions',
      entity_type: 'hts_session',
      entity_id: hts_id,
      record_id: hts_id,
      new_value: { 
        hts_id, 
        patient_id, 
        test_result, 
        linked_to_care: finalLinkedToCare,
        care_link_date: finalCareLinkDate,
        pre_test_counseling,
        post_test_counseling 
      },
      change_summary: `Conducted HTS session for patient ${patient_id}, result: ${test_result}${isPositive ? ', automatically linked to care' : ''}`,
      ip_address: getClientIp(req),
      user_agent: req.get('user-agent'),
    });

    // Log audit for counseling sessions created (P7.4)
    for (const counselingSession of counselingSessionsCreated) {
      await logAudit({
        ...auditInfo,
        action: 'CREATE',
        module: 'Counseling Sessions',
        entity_type: 'counseling_session',
        entity_id: counselingSession.id,
        record_id: counselingSession.id,
        new_value: { 
          session_id: counselingSession.id, 
          patient_id, 
          session_type: counselingSession.type,
          related_hts_session: hts_id 
        },
        change_summary: `Recorded ${counselingSession.type} counseling session for HTS session ${hts_id}`,
        ip_address: getClientIp(req),
        user_agent: req.get('user-agent'),
      });
    }

    res.json({
      success: true,
      message: 'HTS session recorded successfully',
      session: { hts_id, patient_id, test_result },
    });
  } catch (err) {
    await connection.rollback();
    console.error('Create HTS session error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  } finally {
    connection.release();
  }
});

// PUT /api/hts-sessions/:id - Update HTS session
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const [sessions] = await db.query(
      'SELECT * FROM hts_sessions WHERE hts_id = ?',
      [req.params.id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ success: false, message: 'HTS session not found' });
    }

    // Check access - staff roles (admin, physician, nurse, case_manager, lab_personnel) can update any session
    const allowedRoles = ['admin', 'physician', 'nurse', 'case_manager', 'lab_personnel'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const {
      test_date,
      test_result,
      test_type,
      pre_test_counseling,
      post_test_counseling,
      linked_to_care,
      care_link_date,
      notes,
    } = req.body;

    // Determine final values
    const finalTestDate = test_date || sessions[0].test_date;
    const finalTestResult = test_result || sessions[0].test_result;
    
    // Check if test result is positive/reactive (case-insensitive)
    const testResultLower = (finalTestResult || '').toLowerCase();
    const isPositive = testResultLower === 'positive' || testResultLower === 'reactive';
    
    // If positive, automatically link to care if not already linked
    const currentLinkedToCare = linked_to_care !== undefined 
      ? linked_to_care 
      : (sessions[0].linked_to_care === 1);
    const finalLinkedToCare = currentLinkedToCare || isPositive;
    
    // Set care_link_date if linking to care
    const finalCareLinkDate = finalLinkedToCare 
      ? (care_link_date || finalTestDate)
      : (care_link_date !== undefined ? care_link_date : sessions[0].care_link_date);

    await db.query(
      `UPDATE hts_sessions 
       SET test_date = COALESCE(?, test_date),
           test_result = COALESCE(?, test_result),
           test_type = COALESCE(?, test_type),
           pre_test_counseling = COALESCE(?, pre_test_counseling),
           post_test_counseling = COALESCE(?, post_test_counseling),
           linked_to_care = ?,
           care_link_date = ?,
           notes = COALESCE(?, notes)
       WHERE hts_id = ?`,
      [
        test_date || sessions[0].test_date,
        test_result || sessions[0].test_result,
        test_type !== undefined ? test_type : sessions[0].test_type,
        pre_test_counseling !== undefined ? (pre_test_counseling ? 1 : 0) : sessions[0].pre_test_counseling,
        post_test_counseling !== undefined ? (post_test_counseling ? 1 : 0) : sessions[0].post_test_counseling,
        finalLinkedToCare ? 1 : 0,
        finalCareLinkDate,
        notes !== undefined ? notes : sessions[0].notes,
        req.params.id,
      ]
    );

    // Log audit
    const auditInfo = await getUserInfoForAudit(req.user.user_id);
    await logAudit({
      ...auditInfo,
      action: 'UPDATE',
      module: 'HTS Sessions',
      entity_type: 'hts_session',
      entity_id: req.params.id,
      record_id: req.params.id,
      old_value: sessions[0],
      new_value: req.body,
      change_summary: `Updated HTS session ${req.params.id}`,
      ip_address: getClientIp(req),
      user_agent: req.get('user-agent'),
    });

    res.json({ success: true, message: 'HTS session updated successfully' });
  } catch (err) {
    console.error('Update HTS session error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/hts-sessions/:id - Delete HTS session
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const [sessions] = await db.query(
      'SELECT * FROM hts_sessions WHERE hts_id = ?',
      [req.params.id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ success: false, message: 'HTS session not found' });
    }

    // Check access - only admin or the tester who created it
    if (req.user.role !== 'admin' && sessions[0].tester_id !== req.user.user_id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await db.query('DELETE FROM hts_sessions WHERE hts_id = ?', [req.params.id]);

    // Log audit
    const auditInfo = await getUserInfoForAudit(req.user.user_id);
    await logAudit({
      ...auditInfo,
      action: 'DELETE',
      module: 'HTS Sessions',
      entity_type: 'hts_session',
      entity_id: req.params.id,
      record_id: req.params.id,
      old_value: sessions[0],
      change_summary: `Deleted HTS session ${req.params.id}`,
      ip_address: getClientIp(req),
      user_agent: req.get('user-agent'),
    });

    res.json({ success: true, message: 'HTS session deleted successfully' });
  } catch (err) {
    console.error('Delete HTS session error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;

