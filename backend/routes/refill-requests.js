// refill-requests.js
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { authenticateToken } from './auth.js';
import { logAudit, getUserInfoForAudit, getClientIp } from '../utils/auditLogger.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all refill requests with filtering
router.get('/', async (req, res) => {
  try {
    const { search, status, facility_id, patient_id } = req.query;

    let query = `
      SELECT 
        rr.refill_id,
        rr.patient_id,
        rr.prescription_id,
        rr.regimen_id,
        rr.medication_id,
        COALESCE(rr.medication_name, m.medication_name) as medication_name,
        rr.facility_id,
        rr.quantity,
        rr.unit,
        rr.pickup_date,
        rr.preferred_pickup_time,
        rr.patient_notes as notes,
        rr.remaining_pill_count,
        rr.pill_status,
        rr.kulang_explanation,
        rr.is_eligible_for_refill,
        rr.pills_per_day,
        rr.status,
        COALESCE(rr.submitted_at, rr.updated_at) as submitted_at,
        rr.processed_at,
        rr.processed_at as approved_at,
        rr.processed_by,
        rr.review_notes,
        rr.decline_reason,
        rr.approved_quantity,
        rr.ready_for_pickup_date,
        rr.dispensed_by,
        rr.dispensed_at,
        rr.updated_at,
        rr.created_by,
        p.first_name, 
        p.last_name,
        m.generic_name,
        m.form,
        m.strength,
        f.facility_name,
        u_dispensed.full_name as dispensed_by_name,
        u_created.full_name as created_by_name
      FROM refill_requests rr
      LEFT JOIN patients p ON rr.patient_id = p.patient_id
      LEFT JOIN medications m ON rr.medication_id = m.medication_id
      LEFT JOIN facilities f ON rr.facility_id = f.facility_id
      LEFT JOIN users u_dispensed ON rr.dispensed_by = u_dispensed.user_id
      LEFT JOIN users u_created ON rr.created_by = u_created.user_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (p.first_name LIKE ? OR p.last_name LIKE ? OR COALESCE(rr.medication_name, m.medication_name) LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status && status !== 'all') {
      query += ' AND rr.status = ?';
      params.push(status);
    }

    if (facility_id) {
      query += ' AND rr.facility_id = ?';
      params.push(facility_id);
    }

    if (patient_id) {
      query += ' AND rr.patient_id = ?';
      params.push(patient_id);
    }

    query += ' ORDER BY COALESCE(rr.submitted_at, rr.updated_at) DESC';

    // Log query in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Refill requests query:', query);
      console.log('Query params:', params);
    }

    const [results] = await db.query(query, params);
    
    // Handle empty results
    if (!results || results.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    // For each refill request, get adherence data and last pickup date
    for (let i = 0; i < results.length; i++) {
      const request = results[i];
      
      // Only fetch adherence if we have patient_id and medication_id
      if (request.patient_id && request.medication_id) {
        try {
          // Get adherence data for this patient and medication
          const [adherenceData] = await db.query(
            `
            SELECT 
              AVG(adherence_percentage) as avg_adherence
            FROM medication_adherence
            WHERE patient_id = ? 
            AND prescription_id IN (
              SELECT prescription_id FROM prescriptions 
              WHERE patient_id = ? AND medication_id = ?
            )
            AND adherence_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
            `,
            [request.patient_id, request.patient_id, request.medication_id]
          );

          // Get last pickup data
          const [lastPickup] = await db.query(
            `
            SELECT pickup_date
            FROM medication_dispensing
            WHERE patient_id = ? AND medication_id = ?
            ORDER BY pickup_date DESC
            LIMIT 1
            `,
            [request.patient_id, request.medication_id]
          );

          // Calculate adherence percentage
          let adherencePercentage = 0;
          if (adherenceData.length > 0 && adherenceData[0].avg_adherence) {
            adherencePercentage = Math.round(adherenceData[0].avg_adherence);
          }

          // Add additional data to the request
          results[i].adherence = adherencePercentage;
          results[i].lastPickup = lastPickup.length > 0 ? lastPickup[0].pickup_date : null;
        } catch (adherenceError) {
          // If adherence query fails, just set defaults
          console.warn('Error fetching adherence for request:', request.refill_id, adherenceError);
          results[i].adherence = 0;
          results[i].lastPickup = null;
        }
      } else {
        // Set defaults if patient_id or medication_id is missing
        results[i].adherence = 0;
        results[i].lastPickup = null;
      }
    }

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error fetching refill requests:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch refill requests',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
});

// Get refill request by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [results] = await db.query(
      `
      SELECT 
        rr.*, 
        p.first_name, 
        p.last_name,
        p.birth_date as date_of_birth,
        p.contact_phone as phone,
        p.email,
        m.medication_name as medication_name_from_table,
        m.generic_name,
        m.form,
        m.strength,
        f.facility_name,
        f.address,
        f.contact_number as facility_phone,
        u_dispensed.full_name as dispensed_by_name,
        u_created.full_name as created_by_name,
        u_processed.full_name as processed_by_name
      FROM refill_requests rr
      JOIN patients p ON rr.patient_id = p.patient_id
      JOIN medications m ON rr.medication_id = m.medication_id
      JOIN facilities f ON rr.facility_id = f.facility_id
      LEFT JOIN users u_dispensed ON rr.dispensed_by = u_dispensed.user_id
      LEFT JOIN users u_created ON rr.created_by = u_created.user_id
      LEFT JOIN users u_processed ON rr.processed_by = u_processed.user_id
      WHERE rr.refill_id = ?
      `,
      [id]
    );

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Refill request not found',
      });
    }

    // Get adherence data for this patient and medication
    const [adherenceData] = await db.query(
      `
      SELECT 
        AVG(adherence_percentage) as avg_adherence
      FROM medication_adherence
      WHERE patient_id = ? 
      AND prescription_id IN (
        SELECT prescription_id FROM prescriptions 
        WHERE patient_id = ? AND medication_id = ?
      )
      AND adherence_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
      `,
      [results[0].patient_id, results[0].patient_id, results[0].medication_id]
    );

    // Get last pickup data
    const [lastPickup] = await db.query(
      `
      SELECT pickup_date
      FROM medication_dispensing
      WHERE patient_id = ? AND medication_id = ?
      ORDER BY pickup_date DESC
      LIMIT 1
      `,
      [results[0].patient_id, results[0].medication_id]
    );

    // Calculate adherence percentage
    let adherencePercentage = 0;
    if (adherenceData.length > 0 && adherenceData[0].avg_adherence) {
      adherencePercentage = Math.round(adherenceData[0].avg_adherence);
    }

    const refillRequest = {
      ...results[0],
      adherence: adherencePercentage,
      lastPickup: lastPickup.length > 0 ? lastPickup[0].pickup_date : null
    };

    res.json({
      success: true,
      data: refillRequest,
    });
  } catch (error) {
    console.error('Error fetching refill request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch refill request',
      error: error.message,
    });
  }
});

// GET /api/refill-requests/dispense-events/:patientId
// Get all dispense events for a patient to select for refill request
router.get('/dispense-events/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;

    const query = `
      SELECT 
        de.dispense_id,
        de.prescription_id,
        de.prescription_item_id,
        de.quantity_dispensed,
        de.dispensed_date,
        de.batch_number,
        de.notes as dispense_notes,
        m.medication_id,
        m.medication_name,
        m.generic_name,
        m.form,
        m.strength,
        pi.dosage,
        pi.frequency,
        pi.quantity as prescribed_quantity,
        p.prescription_number,
        f.facility_name,
        u.full_name as nurse_name
      FROM dispense_events de
      INNER JOIN prescription_items pi ON de.prescription_item_id = pi.prescription_item_id
      INNER JOIN prescriptions p ON de.prescription_id = p.prescription_id
      INNER JOIN medications m ON pi.medication_id = m.medication_id
      LEFT JOIN facilities f ON de.facility_id = f.facility_id
      LEFT JOIN users u ON de.nurse_id = u.user_id
      WHERE p.patient_id = ?
        AND p.status = 'active'
      ORDER BY de.dispensed_date DESC, m.medication_name ASC
    `;

    const [results] = await db.query(query, [patientId]);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error fetching dispense events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dispense events',
      error: error.message,
    });
  }
});

// GET /api/refill-requests/calculate-remaining/:patientId/:medicationId
// Helper endpoint to auto-calculate remaining pills based on dispense events and adherence
router.get('/calculate-remaining/:patientId/:medicationId', async (req, res) => {
  try {
    const { patientId, medicationId } = req.params;
    const { prescription_id } = req.query;

    // Get last dispense event for this patient and medication
    let lastDispenseQuery = '';
    let queryParams = [];

    if (prescription_id) {
      lastDispenseQuery = `
        SELECT 
          MAX(de.dispensed_date) as last_dispense_date,
          SUM(de.quantity_dispensed) as total_dispensed
        FROM dispense_events de
        INNER JOIN prescription_items pi ON de.prescription_item_id = pi.prescription_item_id
        WHERE de.prescription_id = ? 
          AND pi.medication_id = ?
      `;
      queryParams = [prescription_id, medicationId];
    } else {
      lastDispenseQuery = `
        SELECT 
          MAX(de.dispensed_date) as last_dispense_date,
          SUM(de.quantity_dispensed) as total_dispensed
        FROM dispense_events de
        INNER JOIN prescription_items pi ON de.prescription_item_id = pi.prescription_item_id
        INNER JOIN prescriptions p ON de.prescription_id = p.prescription_id
        WHERE p.patient_id = ? 
          AND pi.medication_id = ?
      `;
      queryParams = [patientId, medicationId];
    }

    const [lastDispense] = await db.query(lastDispenseQuery, queryParams);

    if (!lastDispense[0]?.last_dispense_date) {
      return res.json({
        success: true,
        data: {
          estimated_remaining: null,
          message: 'No dispense records found for this medication',
        },
      });
    }

    const lastDispenseDate = new Date(lastDispense[0].last_dispense_date);
    const today = new Date();
    const daysSinceLastDispense = Math.ceil((today - lastDispenseDate) / (1000 * 60 * 60 * 24));
    const totalDispensed = lastDispense[0].total_dispensed || 0;

    // Get adherence data
    let adherenceQuery = '';
    let adherenceParams = [];

    if (prescription_id) {
      adherenceQuery = `
        SELECT 
          AVG(adherence_percentage) as avg_adherence,
          COUNT(CASE WHEN taken = TRUE THEN 1 END) as taken_count,
          COUNT(*) as total_records
        FROM medication_adherence
        WHERE prescription_id = ?
          AND adherence_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
      `;
      adherenceParams = [prescription_id];
    } else {
      adherenceQuery = `
        SELECT 
          AVG(adherence_percentage) as avg_adherence,
          COUNT(CASE WHEN taken = TRUE THEN 1 END) as taken_count,
          COUNT(*) as total_records
        FROM medication_adherence ma
        INNER JOIN prescriptions p ON ma.prescription_id = p.prescription_id
        INNER JOIN prescription_items pi ON p.prescription_id = pi.prescription_id
        WHERE p.patient_id = ?
          AND pi.medication_id = ?
          AND ma.adherence_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
      `;
      adherenceParams = [patientId, medicationId];
    }

    const [adherenceData] = await db.query(adherenceQuery, adherenceParams);
    const adherencePercentage = adherenceData[0]?.avg_adherence || 100;

    // Get frequency to estimate pills per day
    let frequencyQuery = '';
    let frequencyParams = [];

    if (prescription_id) {
      frequencyQuery = `
        SELECT frequency
        FROM prescription_items pi
        WHERE pi.prescription_id = ? AND pi.medication_id = ?
        LIMIT 1
      `;
      frequencyParams = [prescription_id, medicationId];
    } else {
      frequencyQuery = `
        SELECT pi.frequency
        FROM prescription_items pi
        INNER JOIN prescriptions p ON pi.prescription_id = p.prescription_id
        WHERE p.patient_id = ? AND pi.medication_id = ?
        ORDER BY p.prescription_date DESC
        LIMIT 1
      `;
      frequencyParams = [patientId, medicationId];
    }

    const [frequencyData] = await db.query(frequencyQuery, frequencyParams);
    const frequency = frequencyData[0]?.frequency || 'Once daily';
    
    // Estimate pills per day from frequency
    const pillsPerDay = frequency.toLowerCase().includes('twice') ? 2 :
                       frequency.toLowerCase().includes('three') ? 3 :
                       frequency.toLowerCase().includes('four') ? 4 : 1;

    // Calculate estimated remaining pills
    const expectedConsumed = daysSinceLastDispense * pillsPerDay * (adherencePercentage / 100);
    const estimatedRemaining = Math.max(0, Math.round(totalDispensed - expectedConsumed));

    res.json({
      success: true,
      data: {
        estimated_remaining: estimatedRemaining,
        total_dispensed: totalDispensed,
        days_since_last_dispense: daysSinceLastDispense,
        adherence_percentage: Math.round(adherencePercentage),
        pills_per_day: pillsPerDay,
        last_dispense_date: lastDispense[0].last_dispense_date,
        is_eligible_for_refill: estimatedRemaining <= 10,
      },
    });
  } catch (error) {
    console.error('Error calculating remaining pills:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate remaining pills',
      error: error.message,
    });
  }
});

// Create new refill request
router.post('/', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      patient_id,
      prescription_id,
      regimen_id,
      medication_id,
      facility_id,
      quantity,
      unit,
      preferred_pickup_date,
      preferred_pickup_time,
      patient_notes,
      remaining_pill_count,
      pills_per_day
    } = req.body;

    // Required fields validation
    if (!patient_id || !medication_id || !facility_id || !quantity || !preferred_pickup_date) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: patient_id, medication_id, facility_id, quantity, preferred_pickup_date',
      });
    }

    // Validate remaining_pill_count is provided and is a number
    if (remaining_pill_count === null || remaining_pill_count === undefined || remaining_pill_count === '') {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'remaining_pill_count is required',
      });
    }

    const remainingPillCountInt = parseInt(remaining_pill_count);
    if (isNaN(remainingPillCountInt) || remainingPillCountInt < 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'remaining_pill_count must be a valid non-negative number',
      });
    }

    // Get medication details for denormalized fields
    const [medication] = await connection.query(
      'SELECT medication_name, form FROM medications WHERE medication_id = ?',
      [medication_id]
    );

    if (medication.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Medication not found',
      });
    }

    // Calculate days since last dispense from dispense_events
    let daysSinceLastPickup = 30; // Default fallback
    let lastDispenseDate = null;
    let totalDispensed = 0;
    
    if (prescription_id) {
      // Get last dispense date and total dispensed from dispense_events
      const [lastDispense] = await connection.query(
        `SELECT 
          MAX(de.dispensed_date) as last_dispense_date,
          SUM(de.quantity_dispensed) as total_dispensed
         FROM dispense_events de
         INNER JOIN prescription_items pi ON de.prescription_item_id = pi.prescription_item_id
         WHERE de.prescription_id = ? 
           AND pi.medication_id = ?`,
        [prescription_id, medication_id]
      );
      
      if (lastDispense[0]?.last_dispense_date) {
        lastDispenseDate = new Date(lastDispense[0].last_dispense_date);
        const today = new Date();
        const diffTime = Math.abs(today - lastDispenseDate);
        daysSinceLastPickup = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalDispensed = lastDispense[0].total_dispensed || 0;
      }
    } else {
      // If no prescription_id, try to find from medication_id and patient_id
      const [lastDispense] = await connection.query(
        `SELECT 
          MAX(de.dispensed_date) as last_dispense_date,
          SUM(de.quantity_dispensed) as total_dispensed
         FROM dispense_events de
         INNER JOIN prescription_items pi ON de.prescription_item_id = pi.prescription_item_id
         INNER JOIN prescriptions p ON de.prescription_id = p.prescription_id
         WHERE p.patient_id = ? 
           AND pi.medication_id = ?`,
        [patient_id, medication_id]
      );
      
      if (lastDispense[0]?.last_dispense_date) {
        lastDispenseDate = new Date(lastDispense[0].last_dispense_date);
        const today = new Date();
        const diffTime = Math.abs(today - lastDispenseDate);
        daysSinceLastPickup = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalDispensed = lastDispense[0].total_dispensed || 0;
      }
    }

    // Calculate expected pills based on days since last pickup and pills per day
    const pillsPerDayInt = parseInt(pills_per_day) || 1;
    const expectedPills = daysSinceLastPickup * pillsPerDayInt;
    
    // Calculate pill status (kulang/sakto/sobra)
    // kulang = remaining < expected - 5
    // sakto = expected - 5 <= remaining <= expected + 5
    // sobra = remaining > expected + 5
    let pill_status = 'sakto';
    if (remainingPillCountInt < expectedPills - 5) {
      pill_status = 'kulang';
    } else if (remainingPillCountInt > expectedPills + 5) {
      pill_status = 'sobra';
    }

    // Check if kulang explanation is required (database trigger will also check this)
    if (pill_status === 'kulang' && (!req.body.kulang_explanation || req.body.kulang_explanation.trim() === '')) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Explanation is required when pill status is kulang',
      });
    }

    // Determine unit if not provided
    const medicationUnit = unit || (medication[0].form === 'tablet' ? 'tablets' : 
                                    medication[0].form === 'capsule' ? 'capsules' :
                                    medication[0].form === 'syrup' ? 'ml' :
                                    medication[0].form === 'injection' ? 'vials' : 'units');

    // Check eligibility (≤10 pills)
    const is_eligible_for_refill = remainingPillCountInt <= 10;

    // Get user_id from token (patient creating request)
    const user_id = req.user?.user_id || patient_id; // Fallback to patient_id if no user context

    const refill_id = uuidv4();

    // Check which columns exist in the table
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'refill_requests'
    `);
    
    const columnNames = columns.map(col => col.COLUMN_NAME);
    const hasNewColumns = columnNames.includes('prescription_id');
    
    if (hasNewColumns) {
      // Use new schema with all fields - matching database column names
      await connection.query(
        `INSERT INTO refill_requests (
          refill_id, patient_id, prescription_id, regimen_id, medication_id, medication_name,
          facility_id, quantity, unit, pickup_date, preferred_pickup_time,
          patient_notes, remaining_pill_count, pill_status, kulang_explanation,
          is_eligible_for_refill, pills_per_day, status, created_by, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, CURRENT_TIMESTAMP)`,
        [
          refill_id, patient_id, prescription_id || null, regimen_id || null, medication_id,
          medication[0].medication_name, facility_id, parseInt(quantity), medicationUnit,
          preferred_pickup_date, preferred_pickup_time || null, patient_notes || null,
          remainingPillCountInt, pill_status, (req.body.kulang_explanation && req.body.kulang_explanation.trim() !== '') ? req.body.kulang_explanation : null,
          is_eligible_for_refill, pillsPerDayInt, user_id
        ]
      );
    } else {
      // Use old schema (backward compatible) - matching database column names
      await connection.query(
        `INSERT INTO refill_requests (
          refill_id, patient_id, medication_id, facility_id, 
          quantity, pickup_date, preferred_pickup_time,
          patient_notes, remaining_pill_count, pill_status, kulang_explanation,
          is_eligible_for_refill, pills_per_day, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          refill_id, patient_id, medication_id, facility_id, parseInt(quantity),
          preferred_pickup_date, preferred_pickup_time || null, patient_notes || null,
          remainingPillCountInt, pill_status, (req.body.kulang_explanation && req.body.kulang_explanation.trim() !== '') ? req.body.kulang_explanation : null,
          is_eligible_for_refill, pillsPerDayInt
        ]
      );
    }

    // Get user info for audit logging before commit
    let userInfo = null;
    if (req.user?.user_id) {
      userInfo = await getUserInfoForAudit(req.user.user_id);
    }

    await connection.commit();

    // Log audit entry (D8)
    if (userInfo) {
      await logAudit({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_role: userInfo.user_role,
        action: 'CREATE',
        module: 'Refill Requests',
        entity_type: 'refill_request',
        entity_id: refill_id,
        record_id: refill_id,
        new_value: {
          refill_id,
          patient_id,
          medication_id,
          medication_name: medication[0].medication_name,
          quantity: parseInt(quantity),
          remaining_pill_count: remainingPillCountInt,
          pill_status,
          is_eligible_for_refill,
          status: 'pending',
        },
        change_summary: `Created refill request for ${medication[0].medication_name} (${remainingPillCountInt} pills remaining, status: ${pill_status})`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
        status: 'success',
      });
    }

    // Fetch the created refill request with details
    const [result] = await connection.query(
      `
      SELECT 
        rr.*, 
        p.first_name, 
        p.last_name,
        m.medication_name as medication_name_from_table,
        m.form,
        m.strength,
        f.facility_name,
        u_created.full_name as created_by_name
      FROM refill_requests rr
      JOIN patients p ON rr.patient_id = p.patient_id
      JOIN medications m ON rr.medication_id = m.medication_id
      JOIN facilities f ON rr.facility_id = f.facility_id
      LEFT JOIN users u_created ON rr.created_by = u_created.user_id
      WHERE rr.refill_id = ?
      `,
      [refill_id]
    );

    connection.release();

    res.status(201).json({
      success: true,
      message: 'Refill request created successfully',
      data: result[0]
    });

  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Error creating refill request:', error);
    console.error('Error details:', {
      message: error.message,
      sqlMessage: error.sqlMessage,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to create refill request',
      error: error.sqlMessage || error.message,
      details: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
      } : undefined,
    });
  } finally {
    connection.release();
  }
});

// Approve refill request
router.put('/:id/approve', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { user_id, review_notes, approved_quantity, ready_for_pickup_date } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    // Check if refill request exists and is in pending status
    const [check] = await connection.query(
      'SELECT * FROM refill_requests WHERE refill_id = ? AND status = "pending"',
      [id]
    );
    
    if (check.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Refill request not found or already processed',
      });
    }

    const request = check[0];

    // Check which columns exist
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'refill_requests'
    `);
    const columnNames = columns.map(col => col.COLUMN_NAME);
    const hasNewColumns = columnNames.includes('review_notes');

    // Update refill request status
    if (hasNewColumns) {
      await connection.query(
        `UPDATE refill_requests 
         SET status = 'approved', 
             processed_at = CURRENT_TIMESTAMP, 
             processed_by = ?,
             review_notes = ?,
             approved_quantity = ?,
             ready_for_pickup_date = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE refill_id = ?`,
        [
          user_id, 
          review_notes || null, 
          approved_quantity || request.quantity,
          ready_for_pickup_date || request.pickup_date,
          id
        ]
      );
    } else {
      // Old schema - just update basic fields
      await connection.query(
        `UPDATE refill_requests 
         SET status = 'approved', 
             processed_at = CURRENT_TIMESTAMP, 
             processed_by = ?
         WHERE refill_id = ?`,
        [user_id, id]
      );
    }

    // Add note if provided (for audit trail)
    // Note: This is optional - table may not exist in all database versions
    if (review_notes) {
      try {
        await connection.query(
          `INSERT INTO refill_request_notes (note_id, refill_id, user_id, note_text, created_at)
           VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [uuidv4(), id, user_id, `Approved: ${review_notes}`]
        );
      } catch (noteError) {
        // Table may not exist - log warning but don't fail the approval
        console.warn('Could not add note to refill_request_notes table:', noteError.message);
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Refill request approved successfully',
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error approving refill request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve refill request',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

// Decline refill request
router.put('/:id/decline', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { user_id, decline_reason, review_notes } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    if (!decline_reason) {
      return res.status(400).json({
        success: false,
        message: 'Decline reason is required',
      });
    }

    // Check if refill request exists and is in pending status
    const [check] = await connection.query(
      'SELECT * FROM refill_requests WHERE refill_id = ? AND status = "pending"',
      [id]
    );
    
    if (check.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Refill request not found or already processed',
      });
    }

    // Check which columns exist
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'refill_requests'
    `);
    const columnNames = columns.map(col => col.COLUMN_NAME);
    const hasNewColumns = columnNames.includes('decline_reason');

    // Update refill request status
    if (hasNewColumns) {
      await connection.query(
        `UPDATE refill_requests 
         SET status = 'declined', 
             processed_at = CURRENT_TIMESTAMP, 
             processed_by = ?,
             decline_reason = ?,
             review_notes = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE refill_id = ?`,
        [user_id, decline_reason, review_notes || null, id]
      );
    } else {
      // Old schema
      await connection.query(
        `UPDATE refill_requests 
         SET status = 'declined', 
             processed_at = CURRENT_TIMESTAMP, 
             processed_by = ?
         WHERE refill_id = ?`,
        [user_id, id]
      );
    }

    // Add decline reason as a note (for audit trail)
    // Note: This is optional - table may not exist in all database versions
    try {
      await connection.query(
        `INSERT INTO refill_request_notes (note_id, refill_id, user_id, note_text, created_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [uuidv4(), id, user_id, `Declined: ${decline_reason}${review_notes ? ` - ${review_notes}` : ''}`]
      );
    } catch (noteError) {
      // Table may not exist - log warning but don't fail the decline
      console.warn('Could not add note to refill_request_notes table:', noteError.message);
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Refill request declined successfully',
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error declining refill request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to decline refill request',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

// Update refill request status (for marking as ready, dispensed, etc.)
router.put('/:id/status', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { status, user_id, ready_for_pickup_date } = req.body;

    if (!status || !user_id) {
      return res.status(400).json({
        success: false,
        message: 'Status and user ID are required',
      });
    }

    const validStatuses = ['approved', 'ready', 'dispensed', 'declined', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    // Check if refill request exists
    const [check] = await connection.query(
      'SELECT * FROM refill_requests WHERE refill_id = ?',
      [id]
    );
    
    if (check.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Refill request not found',
      });
    }

    const request = check[0];

    // Check which columns exist
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'refill_requests'
    `);
    const columnNames = columns.map(col => col.COLUMN_NAME);
    const hasNewColumns = columnNames.includes('ready_for_pickup_date');

    // Update refill request status
    if (status === 'ready') {
      // Mark as ready for pickup
      if (hasNewColumns) {
        await connection.query(
          `UPDATE refill_requests 
           SET status = ?, 
               ready_for_pickup_date = ?,
               processed_at = CURRENT_TIMESTAMP, 
               processed_by = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE refill_id = ?`,
          [status, ready_for_pickup_date || request.pickup_date, user_id, id]
        );
      } else {
        await connection.query(
          `UPDATE refill_requests 
           SET status = ?, 
               processed_at = CURRENT_TIMESTAMP, 
               processed_by = ?
           WHERE refill_id = ?`,
          [status, user_id, id]
        );
      }
    } else if (status === 'dispensed') {
      // Mark as dispensed and record who dispensed
      if (hasNewColumns) {
        await connection.query(
          `UPDATE refill_requests 
           SET status = ?, 
               dispensed_by = ?,
               dispensed_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE refill_id = ?`,
          [status, user_id, id]
        );
      } else {
        await connection.query(
          `UPDATE refill_requests 
           SET status = ?, 
               processed_at = CURRENT_TIMESTAMP, 
               processed_by = ?
           WHERE refill_id = ?`,
          [status, user_id, id]
        );
      }

      // Get quantity to dispense
      const quantityToDispense = (hasNewColumns && request.approved_quantity) 
        ? request.approved_quantity 
        : request.quantity;

      // Check inventory availability and reduce inventory (similar to prescriptions dispense)
      const [inventoryCheck] = await connection.query(
        `SELECT inventory_id, quantity_on_hand, medication_name
         FROM medication_inventory mi
         JOIN medications m ON mi.medication_id = m.medication_id
         WHERE mi.medication_id = ? AND mi.facility_id = ?
         ORDER BY expiry_date ASC, quantity_on_hand DESC
         LIMIT 1`,
        [request.medication_id, request.facility_id]
      );

      if (inventoryCheck.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `No inventory found for this medication at this facility`,
        });
      }

      const inventory = inventoryCheck[0];

      // Verify quantity_on_hand >= quantity_dispensed
      if (inventory.quantity_on_hand < quantityToDispense) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient inventory. Available: ${inventory.quantity_on_hand}, Requested: ${quantityToDispense}`,
        });
      }

      // Store quantity before for transaction record
      const quantityBefore = inventory.quantity_on_hand;
      
      // Update inventory: quantity_on_hand = quantity_on_hand - quantity_dispensed
      await connection.query(
        'UPDATE medication_inventory SET quantity_on_hand = quantity_on_hand - ? WHERE inventory_id = ?',
        [quantityToDispense, inventory.inventory_id]
      );

      const quantityAfter = quantityBefore - quantityToDispense;

      // Create inventory transaction record (Module 4 alignment)
      const transactionId = uuidv4();
      await connection.query(
        `INSERT INTO inventory_transactions (
          transaction_id, inventory_id, transaction_type, quantity_change,
          quantity_before, quantity_after, performed_by, facility_id,
          transaction_reason, reference_id, reference_type, created_at
        ) VALUES (?, ?, 'dispense', ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          transactionId,
          inventory.inventory_id,
          -quantityToDispense,
          quantityBefore,
          quantityAfter,
          user_id,
          request.facility_id,
          `Dispensed for refill request ${id}`,
          id,
          'refill_request'
        ]
      );

      // Create a medication dispensing record
      await connection.query(
        `INSERT INTO medication_dispensing (
          dispensing_id, refill_id, patient_id, medication_id, facility_id,
          quantity_dispensed, pickup_date, dispenser_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(), id, request.patient_id, request.medication_id, request.facility_id, 
          quantityToDispense, 
          (hasNewColumns && request.ready_for_pickup_date) ? request.ready_for_pickup_date : request.pickup_date, 
          user_id
        ]
      );
    } else {
      // Other status updates
      if (hasNewColumns) {
        await connection.query(
          `UPDATE refill_requests 
           SET status = ?, 
               processed_at = CURRENT_TIMESTAMP, 
               processed_by = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE refill_id = ?`,
          [status, user_id, id]
        );
      } else {
        await connection.query(
          `UPDATE refill_requests 
           SET status = ?, 
               processed_at = CURRENT_TIMESTAMP, 
               processed_by = ?
           WHERE refill_id = ?`,
          [status, user_id, id]
        );
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: `Refill request marked as ${status} successfully`,
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error updating refill request status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update refill request status',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

// Get patient's refill requests
router.get('/patient/:patient_id', async (req, res) => {
  try {
    const { patient_id } = req.params;

    const [results] = await db.query(
      `
      SELECT 
        rr.*, 
        m.medication_name,
        m.generic_name,
        m.form,
        m.strength,
        f.facility_name
      FROM refill_requests rr
      JOIN medications m ON rr.medication_id = m.medication_id
      JOIN facilities f ON rr.facility_id = f.facility_id
      WHERE rr.patient_id = ?
      ORDER BY rr.submitted_at DESC
      `,
      [patient_id]
    );

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error fetching patient refill requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient refill requests',
      error: error.message,
    });
  }
});

export default router;