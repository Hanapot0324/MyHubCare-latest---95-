import express from 'express';
import { db } from '../db.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { authenticateToken } from './auth.js';

const router = express.Router();

// GET /api/patients - Get all patients (for staff only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (
      !['admin', 'physician', 'nurse', 'case_manager'].includes(req.user.role)
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { search, sex, status = 'active' } = req.query;

    let query = `
      SELECT p.*, f.facility_name, u.username 
      FROM patients p
      LEFT JOIN facilities f ON p.facility_id = f.facility_id
      LEFT JOIN users u ON p.created_by = u.user_id
      WHERE p.status = ?
    `;

    const params = [status];

    if (search) {
      query += ` AND (
        CONCAT(p.first_name, ' ', p.last_name) LIKE ? OR
        p.uic LIKE ? OR
        p.contact_phone LIKE ? OR
        p.email LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (sex) {
      query += ' AND p.sex = ?';
      params.push(sex);
    }

    query += ' ORDER BY p.created_at DESC';

    const [patients] = await db.query(query, params);

    res.json({ success: true, patients });
  } catch (err) {
    console.error('Fetch patients error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/patients/:id - Get patient by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [patients] = await db.query(
      `SELECT p.*, f.facility_name, f.facility_type
       FROM patients p
       LEFT JOIN facilities f ON p.facility_id = f.facility_id
       WHERE p.patient_id = ?`,
      [req.params.id]
    );

    if (patients.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Patient not found' });
    }

    // Check if user has permission to view this patient
    const patient = patients[0];
    if (
      req.user.role === 'patient' &&
      patient.created_by !== req.user.user_id
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, patient });
  } catch (err) {
    console.error('Fetch patient error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
// POST /api/patients/register - Register a new patient
router.post('/register', async (req, res) => {
  try {
    const {
      // Personal Information
      firstName,
      middleName,
      lastName,
      suffix,
      birthDate,
      sex,
      civilStatus,
      nationality,

      // Contact Information
      contactPhone,
      email,
      currentCity,
      currentProvince,
      philhealthNo,
      branch,

      // Account Setup
      username,
      password,
      termsConsent,
      dataConsent,
      smsConsent,
    } = req.body;

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !birthDate ||
      !sex ||
      !civilStatus ||
      !contactPhone ||
      !email ||
      !currentCity ||
      !currentProvince ||
      !branch ||
      !username ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Check if username already exists
    const [existingUsers] = await db.query(
      'SELECT user_id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists',
      });
    }

    // Check if email already exists
    const [existingEmails] = await db.query(
      'SELECT user_id FROM users WHERE email = ?',
      [email]
    );

    if (existingEmails.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Generate UUIDs
      const userId = crypto.randomUUID();
      const patientId = crypto.randomUUID();
      const uic = `UIC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user account
      await connection.query(
        `INSERT INTO users 
        (user_id, username, email, password_hash, role, status, created_at, updated_at) 
      VALUES (?, ?, ?, ?, 'patient', 'active', NOW(), NOW())`,
        [userId, username, email, hashedPassword]
      );

      // Create patient record
      const currentAddress = JSON.stringify({
        city: currentCity,
        province: currentProvince,
      });

      await connection.query(
        `INSERT INTO patients 
        (patient_id, uic, first_name, middle_name, last_name, suffix, 
         birth_date, sex, civil_status, nationality, contact_phone, email, 
         current_address, current_city, current_province, philhealth_no, 
         facility_id, created_by, status, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
        [
          patientId,
          uic,
          firstName,
          middleName,
          lastName,
          suffix,
          birthDate,
          sex,
          civilStatus,
          nationality,
          contactPhone,
          email,
          currentAddress,
          currentCity,
          currentProvince,
          philhealthNo,
          branch,
          userId,
        ]
      );

      // Commit transaction
      await connection.commit();

      res.status(201).json({
        success: true,
        message: 'Patient registered successfully',
        data: {
          uic,
          username,
          patientId,
        },
      });
    } catch (error) {
      // Rollback transaction if error occurs
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Patient registration error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
    });
  }
});

// PUT /api/patients/:id - Update patient
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const {
      // Personal information
      first_name,
      middle_name,
      last_name,
      suffix,
      birth_date,
      sex,
      civil_status,
      nationality,

      // Contact information
      contact_phone,
      email,
      current_city,
      current_province,
      philhealth_no,
      guardian_name,
      guardian_relationship,
    } = req.body;

    const [patients] = await db.query(
      'SELECT * FROM patients WHERE patient_id = ?',
      [req.params.id]
    );

    if (patients.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Patient not found' });
    }

    // Check permissions
    const patient = patients[0];
    if (
      req.user.role === 'patient' &&
      patient.created_by !== req.user.user_id
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const currentAddress = JSON.stringify({
      city: current_city,
      province: current_province,
    });

    // Build the update query dynamically based on provided fields
    let updateFields = [];
    let updateValues = [];

    if (first_name !== undefined) {
      updateFields.push('first_name = ?');
      updateValues.push(first_name);
    }

    if (middle_name !== undefined) {
      updateFields.push('middle_name = ?');
      updateValues.push(middle_name);
    }

    if (last_name !== undefined) {
      updateFields.push('last_name = ?');
      updateValues.push(last_name);
    }

    if (suffix !== undefined) {
      updateFields.push('suffix = ?');
      updateValues.push(suffix);
    }

    if (birth_date !== undefined) {
      updateFields.push('birth_date = ?');
      updateValues.push(birth_date);
    }

    if (sex !== undefined) {
      updateFields.push('sex = ?');
      updateValues.push(sex);
    }

    if (civil_status !== undefined) {
      updateFields.push('civil_status = ?');
      updateValues.push(civil_status);
    }

    if (nationality !== undefined) {
      updateFields.push('nationality = ?');
      updateValues.push(nationality);
    }

    if (contact_phone !== undefined) {
      updateFields.push('contact_phone = ?');
      updateValues.push(contact_phone);
    }

    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }

    if (current_city !== undefined) {
      updateFields.push('current_city = ?');
      updateValues.push(current_city);
    }

    if (current_province !== undefined) {
      updateFields.push('current_province = ?');
      updateValues.push(current_province);
    }

    if (philhealth_no !== undefined) {
      updateFields.push('philhealth_no = ?');
      updateValues.push(philhealth_no);
    }

    updateFields.push('current_address = ?');
    updateValues.push(currentAddress);

    if (guardian_name !== undefined) {
      updateFields.push('guardian_name = ?');
      updateValues.push(guardian_name);
    }

    if (guardian_relationship !== undefined) {
      updateFields.push('guardian_relationship = ?');
      updateValues.push(guardian_relationship);
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(req.params.id);

    await db.query(
      `UPDATE patients SET ${updateFields.join(', ')} WHERE patient_id = ?`,
      updateValues
    );

    // Get updated patient data
    const [updatedPatients] = await db.query(
      `SELECT p.*, f.facility_name 
       FROM patients p
       LEFT JOIN facilities f ON p.facility_id = f.facility_id
       WHERE p.patient_id = ?`,
      [req.params.id]
    );

    res.json({
      success: true,
      message: 'Patient updated successfully',
      patient: updatedPatients[0],
    });
  } catch (err) {
    console.error('Update patient error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/patients/:id - Soft delete patient (change status to inactive)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Only admins and physicians can delete patients
    if (!['admin', 'physician'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          'Access denied. Only administrators and physicians can delete patients.',
      });
    }

    const [patients] = await db.query(
      'SELECT * FROM patients WHERE patient_id = ?',
      [req.params.id]
    );

    if (patients.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Patient not found' });
    }

    // Soft delete - change status to inactive
    await db.query(
      "UPDATE patients SET status = 'inactive', updated_at = NOW() WHERE patient_id = ?",
      [req.params.id]
    );

    // Also deactivate associated user account
    await db.query(
      "UPDATE users SET status = 'inactive' WHERE user_id = (SELECT created_by FROM patients WHERE patient_id = ?)",
      [req.params.id]
    );

    res.json({
      success: true,
      message: 'Patient deactivated successfully',
    });
  } catch (err) {
    console.error('Delete patient error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/patients/stats/overview - Get patient statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'physician', 'case_manager'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Total active patients
    const [totalCount] = await db.query(
      "SELECT COUNT(*) as total FROM patients WHERE status = 'active'"
    );

    // By gender
    const [byGender] = await db.query(
      "SELECT sex, COUNT(*) as count FROM patients WHERE status = 'active' GROUP BY sex"
    );

    // By facility
    const [byFacility] = await db.query(
      `SELECT f.facility_name, COUNT(p.patient_id) as count
       FROM facilities f
       LEFT JOIN patients p ON f.facility_id = p.facility_id AND p.status = 'active'
       WHERE f.is_active = 1
       GROUP BY f.facility_id
       ORDER BY count DESC
       LIMIT 10`
    );

    // New patients this month
    const [newThisMonth] = await db.query(
      `SELECT COUNT(*) as count 
       FROM patients 
       WHERE status = 'active' 
       AND MONTH(created_at) = MONTH(CURRENT_DATE())
       AND YEAR(created_at) = YEAR(CURRENT_DATE())`
    );

    res.json({
      success: true,
      data: {
        total: totalCount[0].total,
        byGender: byGender,
        byFacility: byFacility,
        newThisMonth: newThisMonth[0].count,
      },
    });
  } catch (err) {
    console.error('Fetch patient stats error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
