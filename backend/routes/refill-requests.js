// refill-requests.js
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';

const router = express.Router();

// Get all refill requests with filtering
router.get('/', async (req, res) => {
  try {
    const { search, status, facility_id } = req.query;

    let query = `
      SELECT 
        rr.*, 
        p.first_name, 
        p.last_name,
        m.medication_name,
        m.generic_name,
        m.form,
        m.strength,
        f.facility_name
      FROM refill_requests rr
      JOIN patients p ON rr.patient_id = p.patient_id
      JOIN medications m ON rr.medication_id = m.medication_id
      JOIN facilities f ON rr.facility_id = f.facility_id
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
        p.date_of_birth,
        p.phone,
        p.email,
        m.medication_name,
        m.generic_name,
        m.form,
        m.strength,
        f.facility_name,
        f.address,
        f.phone as facility_phone
      FROM refill_requests rr
      JOIN patients p ON rr.patient_id = p.patient_id
      JOIN medications m ON rr.medication_id = m.medication_id
      JOIN facilities f ON rr.facility_id = f.facility_id
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
      medication_id,
      facility_id,
      quantity,
      pickup_date,
      notes
    } = req.body;

    if (!patient_id || !medication_id || !facility_id || !quantity || !pickup_date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const refill_id = uuidv4();

    await connection.query(
      `INSERT INTO refill_requests (
        refill_id, patient_id, medication_id, facility_id, 
        quantity, pickup_date, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [refill_id, patient_id, medication_id, facility_id, quantity, pickup_date, notes]
    );

    await connection.commit();

    // Fetch the created refill request with details
    const [result] = await connection.query(
      `
      SELECT 
        rr.*, 
        p.first_name, 
        p.last_name,
        m.medication_name,
        m.form,
        m.strength,
        f.facility_name
      FROM refill_requests rr
      JOIN patients p ON rr.patient_id = p.patient_id
      JOIN medications m ON rr.medication_id = m.medication_id
      JOIN facilities f ON rr.facility_id = f.facility_id
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
    const { user_id, notes } = req.body;

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

    // Update refill request status
    await connection.query(
      `UPDATE refill_requests 
       SET status = 'approved', processed_at = CURRENT_TIMESTAMP, processed_by = ?
       WHERE refill_id = ?`,
      [user_id, id]
    );

    // Add note if provided
    if (notes) {
      await connection.query(
        `INSERT INTO refill_request_notes (note_id, refill_id, user_id, note_text, created_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [uuidv4(), id, user_id, notes]
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
    const { user_id, reason } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    if (!reason) {
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

    // Update refill request status
    await connection.query(
      `UPDATE refill_requests 
       SET status = 'declined', processed_at = CURRENT_TIMESTAMP, processed_by = ?
       WHERE refill_id = ?`,
      [user_id, id]
    );

    // Add decline reason as a note
    await connection.query(
      `INSERT INTO refill_request_notes (note_id, refill_id, user_id, note_text, created_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [uuidv4(), id, user_id, `Declined: ${reason}`]
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
  try {
    const { id } = req.params;
    const { status, user_id } = req.body;

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
    const [check] = await db.query(
      'SELECT * FROM refill_requests WHERE refill_id = ?',
      [id]
    );
    
    if (check.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Refill request not found',
      });
    }

    // Update refill request status
    await db.query(
      `UPDATE refill_requests 
       SET status = ?, processed_at = CURRENT_TIMESTAMP, processed_by = ?
       WHERE refill_id = ?`,
      [status, user_id, id]
    );

    // If status is dispensed, create a medication dispensing record
    if (status === 'dispensed') {
      const request = check[0];
      await db.query(
        `INSERT INTO medication_dispensing (
          dispensing_id, refill_id, patient_id, medication_id, facility_id,
          quantity_dispensed, pickup_date, dispenser_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), id, request.patient_id, request.medication_id, request.facility_id, 
         request.quantity, request.pickup_date, user_id]
      );
    }

    res.json({
      success: true,
      message: `Refill request marked as ${status} successfully`,
    });

  } catch (error) {
    console.error('Error updating refill request status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update refill request status',
      error: error.message
    });
  }
});

export default router;