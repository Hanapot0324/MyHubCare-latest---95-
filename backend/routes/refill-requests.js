// refill-requests.js
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all refill requests with filtering
router.get('/', async (req, res) => {
  try {
    const { search, status, facility_id } = req.query;

    let query = `
      SELECT 
        rr.*, 
        p.first_name, 
        p.last_name,
        m.medication_name as medication_name_from_table,
        m.generic_name,
        m.form,
        m.strength,
        f.facility_name,
        u_dispensed.full_name as dispensed_by_name,
        u_created.full_name as created_by_name
      FROM refill_requests rr
      JOIN patients p ON rr.patient_id = p.patient_id
      JOIN medications m ON rr.medication_id = m.medication_id
      JOIN facilities f ON rr.facility_id = f.facility_id
      LEFT JOIN users u_dispensed ON rr.dispensed_by = u_dispensed.user_id
      LEFT JOIN users u_created ON rr.created_by = u_created.user_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (p.first_name LIKE ? OR p.last_name LIKE ? OR m.medication_name LIKE ?)';
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

    query += ' ORDER BY rr.submitted_at DESC';

    const [results] = await db.query(query, params);

    // For each refill request, get adherence data and last pickup date
    for (let i = 0; i < results.length; i++) {
      const request = results[i];
      
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
    }

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error fetching refill requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch refill requests',
      error: error.message,
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
    if (!patient_id || !medication_id || !facility_id || !quantity || !preferred_pickup_date || !remaining_pill_count) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: patient_id, medication_id, facility_id, quantity, preferred_pickup_date, remaining_pill_count',
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

    // Calculate pill status (kulang/sakto/sobra)
    // Expected pills = days since last pickup * pills_per_day
    // For now, we'll use a simple calculation based on remaining vs expected
    const daysSinceLastPickup = 30; // Default assumption, should be calculated from last pickup
    const expectedPills = daysSinceLastPickup * (pills_per_day || 1);
    let pill_status = 'sakto';
    if (remaining_pill_count < expectedPills - 5) {
      pill_status = 'kulang';
    } else if (remaining_pill_count > expectedPills + 5) {
      pill_status = 'sobra';
    }

    // Check if kulang explanation is required
    if (pill_status === 'kulang' && !req.body.kulang_explanation) {
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
    const is_eligible_for_refill = remaining_pill_count <= 10;

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
      // Use new schema with all fields
      await connection.query(
        `INSERT INTO refill_requests (
          refill_id, patient_id, prescription_id, regimen_id, medication_id, medication_name,
          facility_id, quantity, unit, pickup_date, preferred_pickup_time,
          notes, remaining_pill_count, pill_status, kulang_explanation,
          is_eligible_for_refill, pills_per_day, status, created_by, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, CURRENT_TIMESTAMP)`,
        [
          refill_id, patient_id, prescription_id || null, regimen_id || null, medication_id,
          medication[0].medication_name, facility_id, quantity, medicationUnit,
          preferred_pickup_date, preferred_pickup_time || null, patient_notes || null,
          remaining_pill_count, pill_status, req.body.kulang_explanation || null,
          is_eligible_for_refill, pills_per_day || 1, user_id
        ]
      );
    } else {
      // Use old schema (backward compatible)
      await connection.query(
        `INSERT INTO refill_requests (
          refill_id, patient_id, medication_id, facility_id, 
          quantity, pickup_date, preferred_pickup_time,
          notes, remaining_pill_count, pill_status, kulang_explanation,
          is_eligible_for_refill, pills_per_day, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          refill_id, patient_id, medication_id, facility_id, quantity,
          preferred_pickup_date, preferred_pickup_time || null, patient_notes || null,
          remaining_pill_count, pill_status, req.body.kulang_explanation || null,
          is_eligible_for_refill, pills_per_day || 1
        ]
      );
    }

    await connection.commit();

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

    res.status(201).json({
      success: true,
      message: 'Refill request created successfully',
      data: result[0]
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error creating refill request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create refill request',
      error: error.message
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
    if (review_notes) {
      await connection.query(
        `INSERT INTO refill_request_notes (note_id, refill_id, user_id, note_text, created_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [uuidv4(), id, user_id, `Approved: ${review_notes}`]
      );
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
    await connection.query(
      `INSERT INTO refill_request_notes (note_id, refill_id, user_id, note_text, created_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [uuidv4(), id, user_id, `Declined: ${decline_reason}${review_notes ? ` - ${review_notes}` : ''}`]
    );

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

      // Create a medication dispensing record
      await connection.query(
        `INSERT INTO medication_dispensing (
          dispensing_id, refill_id, patient_id, medication_id, facility_id,
          quantity_dispensed, pickup_date, dispenser_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(), id, request.patient_id, request.medication_id, request.facility_id, 
          (hasNewColumns && request.approved_quantity) ? request.approved_quantity : request.quantity, 
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