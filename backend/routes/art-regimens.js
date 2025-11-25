import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { logAudit, getUserInfoForAudit, getClientIp } from '../utils/auditLogger.js';
import { authenticateToken } from './auth.js';
import { calculateARPARiskScore } from '../services/arpaService.js';

const router = express.Router();

// Get all ART regimens with filters
router.get('/', async (req, res) => {
  try {
    const { patient_id, provider_id, facility_id, status } = req.query;

    let query = `
      SELECT ar.*, 
             pa.first_name, pa.last_name, pa.birth_date, pa.sex as gender,
             u.full_name as provider_full_name,
             f.facility_name
      FROM patient_art_regimens ar
      LEFT JOIN patients pa ON ar.patient_id = pa.patient_id
      LEFT JOIN users u ON ar.provider_id = u.user_id
      LEFT JOIN facilities f ON ar.facility_id = f.facility_id
    `;

    const params = [];
    const conditions = [];

    if (patient_id) {
      conditions.push('ar.patient_id = ?');
      params.push(patient_id);
    }

    if (provider_id) {
      conditions.push('ar.provider_id = ?');
      params.push(provider_id);
    }

    if (facility_id) {
      conditions.push('ar.facility_id = ?');
      params.push(facility_id);
    }

    if (status) {
      conditions.push('ar.status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY ar.start_date DESC';

    const [results] = await db.query(query, params);

    // Get regimen drugs for each regimen
    for (const regimen of results) {
      const [drugs] = await db.query(
        `
        SELECT ard.*, m.medication_name as medication_full_name
        FROM art_regimen_drugs ard
        LEFT JOIN medications m ON ard.medication_id = m.medication_id
        WHERE ard.regimen_id = ?
        ORDER BY ard.created_at ASC
      `,
        [regimen.regimen_id]
      );

      regimen.drugs = drugs;
    }

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error fetching ART regimens:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ART regimens',
      error: error.message,
    });
  }
});

// Get single ART regimen by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT ar.*, 
             pa.first_name, pa.last_name, pa.birth_date, pa.sex as gender,
             u.full_name as provider_full_name,
             f.facility_name
      FROM patient_art_regimens ar
      LEFT JOIN patients pa ON ar.patient_id = pa.patient_id
      LEFT JOIN users u ON ar.provider_id = u.user_id
      LEFT JOIN facilities f ON ar.facility_id = f.facility_id
      WHERE ar.regimen_id = ?
    `;

    const [results] = await db.query(query, [id]);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ART regimen not found',
      });
    }

    const regimen = results[0];

    // Get regimen drugs
    const [drugs] = await db.query(
      `
      SELECT ard.*, m.medication_name as medication_full_name
      FROM art_regimen_drugs ard
      LEFT JOIN medications m ON ard.medication_id = m.medication_id
      WHERE ard.regimen_id = ?
      ORDER BY ard.created_at ASC
    `,
      [id]
    );

    regimen.drugs = drugs;

    // Get regimen history
    const [history] = await db.query(
      `
      SELECT arh.*, u.full_name as performed_by_name
      FROM art_regimen_history arh
      LEFT JOIN users u ON arh.performed_by = u.user_id
      WHERE arh.regimen_id = ?
      ORDER BY arh.created_at DESC
    `,
      [id]
    );

    regimen.history = history;

    res.json({
      success: true,
      data: regimen,
    });
  } catch (error) {
    console.error('Error fetching ART regimen:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ART regimen',
      error: error.message,
    });
  }
});

// Get regimens for a specific patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;

    const query = `
      SELECT ar.*, 
             u.full_name as provider_full_name,
             f.facility_name
      FROM patient_art_regimens ar
      LEFT JOIN users u ON ar.provider_id = u.user_id
      LEFT JOIN facilities f ON ar.facility_id = f.facility_id
      WHERE ar.patient_id = ?
      ORDER BY ar.start_date DESC
    `;

    const [results] = await db.query(query, [patientId]);

    // Get regimen drugs for each regimen
    for (const regimen of results) {
      const [drugs] = await db.query(
        `
        SELECT ard.*, m.medication_name as medication_full_name
        FROM art_regimen_drugs ard
        LEFT JOIN medications m ON ard.medication_id = m.medication_id
        WHERE ard.regimen_id = ?
        ORDER BY ard.created_at ASC
      `,
        [regimen.regimen_id]
      );

      regimen.drugs = drugs;
    }

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error fetching patient ART regimens:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient ART regimens',
      error: error.message,
    });
  }
});

// Start new ART regimen (P15.1)
router.post('/', authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  let userInfo = null;

  try {
    const {
      patient_id,
      provider_id,
      facility_id,
      start_date,
      notes,
      drugs, // Array of { medication_id, drug_name, dosage, pills_per_day, pills_dispensed }
    } = req.body;

    // Get authenticated user info
    const authenticatedUserId = req.user?.user_id;
    if (!authenticatedUserId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Use authenticated user as provider if not provided, or validate provided provider
    const finalProviderId = provider_id || authenticatedUserId;

    // Get user info for audit logging
    userInfo = await getUserInfoForAudit(authenticatedUserId);

    // Validate required fields
    if (!patient_id || !facility_id || !start_date || !drugs || drugs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: patient_id, facility_id, start_date, and drugs are required',
      });
    }

    await connection.beginTransaction();

    // Check if patient exists (D2)
    const [patientCheck] = await connection.query(
      'SELECT patient_id, first_name, last_name FROM patients WHERE patient_id = ?',
      [patient_id]
    );
    if (patientCheck.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Patient not found',
      });
    }

    // Check if provider exists and has appropriate role (physician or admin)
    const [providerCheck] = await connection.query(
      'SELECT user_id, full_name, role, status FROM users WHERE user_id = ?',
      [finalProviderId]
    );
    if (providerCheck.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Provider not found',
      });
    }

    const provider = providerCheck[0];
    
    // Validate provider role (must be physician or admin)
    if (!['physician', 'admin'].includes(provider.role)) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: 'Only physicians and administrators can start ART regimens',
      });
    }

    // Validate provider status
    if (provider.status !== 'active') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Provider account is not active',
      });
    }

    // Check if facility exists
    const [facilityCheck] = await connection.query(
      'SELECT facility_id, facility_name FROM facilities WHERE facility_id = ?',
      [facility_id]
    );
    if (facilityCheck.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Facility not found',
      });
    }

    // Validate all medications exist and are ART medications (D4)
    for (const drug of drugs) {
      if (!drug.medication_id || !drug.drug_name || !drug.dosage || !drug.pills_per_day) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Each drug must have medication_id, drug_name, dosage, and pills_per_day',
        });
      }

      const [medicationCheck] = await connection.query(
        'SELECT medication_id, medication_name, is_art FROM medications WHERE medication_id = ?',
        [drug.medication_id]
      );
      if (medicationCheck.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Medication ${drug.drug_name} not found`,
        });
      }

      if (!medicationCheck[0].is_art) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Medication ${drug.drug_name} is not an ART medication`,
        });
      }
    }

    // Create regimen
    const regimenId = uuidv4();
    await connection.query(
      `
      INSERT INTO patient_art_regimens 
        (regimen_id, patient_id, provider_id, facility_id, start_date, status, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'active', ?, NOW(), NOW())
    `,
      [regimenId, patient_id, finalProviderId, facility_id, start_date, notes || null]
    );

    // Add drugs to regimen
    for (const drug of drugs) {
      const drugId = uuidv4();
      await connection.query(
        `
        INSERT INTO art_regimen_drugs 
          (regimen_drug_id, regimen_id, medication_id, drug_name, dosage, pills_per_day, 
           pills_dispensed, pills_remaining, missed_doses, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())
      `,
        [
          drugId,
          regimenId,
          drug.medication_id,
          drug.drug_name,
          drug.dosage,
          drug.pills_per_day,
          drug.pills_dispensed || 0,
          drug.pills_dispensed || 0, // Initially, pills_remaining = pills_dispensed
        ]
      );
    }

    // Create history entry
    const historyId = uuidv4();
    await connection.query(
      `
      INSERT INTO art_regimen_history 
        (history_id, regimen_id, action_type, action_date, new_status, performed_by, notes, created_at)
      VALUES (?, ?, 'started', ?, 'active', ?, ?, NOW())
    `,
      [historyId, regimenId, start_date, authenticatedUserId, notes || null]
    );

    await connection.commit();

    // Log audit entry (D8)
    const patient = patientCheck[0];
    await logAudit({
      user_id: authenticatedUserId,
      user_name: userInfo.full_name,
      user_role: userInfo.role,
      action: 'CREATE',
      module: 'ART Regimens',
      entity_type: 'art_regimen',
      entity_id: regimenId,
      record_id: regimenId,
      new_value: {
        regimen_id: regimenId,
        patient_id,
        provider_id: finalProviderId,
        facility_id,
        start_date,
        drugs: drugs.map(d => d.drug_name),
      },
      change_summary: `Started ART regimen for patient ${patient.first_name} ${patient.last_name}`,
      ip_address: getClientIp(req),
      status: 'success',
    });

    // Fetch the created regimen with all details
    const [createdRegimen] = await connection.query(
      `
      SELECT ar.*, 
             pa.first_name, pa.last_name,
             u.full_name as provider_full_name,
             f.facility_name
      FROM patient_art_regimens ar
      LEFT JOIN patients pa ON ar.patient_id = pa.patient_id
      LEFT JOIN users u ON ar.provider_id = u.user_id
      LEFT JOIN facilities f ON ar.facility_id = f.facility_id
      WHERE ar.regimen_id = ?
    `,
      [regimenId]
    );

    const [createdDrugs] = await connection.query(
      `
      SELECT ard.*, m.medication_name as medication_full_name
      FROM art_regimen_drugs ard
      LEFT JOIN medications m ON ard.medication_id = m.medication_id
      WHERE ard.regimen_id = ?
    `,
      [regimenId]
    );

    createdRegimen[0].drugs = createdDrugs;

    res.status(201).json({
      success: true,
      message: 'ART regimen started successfully',
      data: createdRegimen[0],
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating ART regimen:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create ART regimen',
      error: error.message,
    });
  } finally {
    connection.release();
  }
});

// Update ART regimen
router.put('/:id', authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  let userInfo = null;

  try {
    const { id } = req.params;
    const { notes } = req.body;

    const authenticatedUserId = req.user?.user_id;
    if (!authenticatedUserId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    userInfo = await getUserInfoForAudit(authenticatedUserId);

    await connection.beginTransaction();

    // Check if regimen exists
    const [regimenCheck] = await connection.query(
      'SELECT * FROM patient_art_regimens WHERE regimen_id = ?',
      [id]
    );
    if (regimenCheck.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'ART regimen not found',
      });
    }

    const oldRegimen = regimenCheck[0];

    // Update regimen
    await connection.query(
      `
      UPDATE patient_art_regimens 
      SET notes = ?, updated_at = NOW()
      WHERE regimen_id = ?
    `,
      [notes || oldRegimen.notes, id]
    );

    await connection.commit();

    // Log audit entry
    await logAudit({
      user_id: authenticatedUserId,
      user_name: userInfo.full_name,
      user_role: userInfo.role,
      action: 'UPDATE',
      module: 'ART Regimens',
      entity_type: 'art_regimen',
      entity_id: id,
      record_id: id,
      old_value: oldRegimen,
      new_value: { ...oldRegimen, notes: notes || oldRegimen.notes },
      change_summary: 'Updated ART regimen notes',
      ip_address: getClientIp(req),
      status: 'success',
    });

    res.json({
      success: true,
      message: 'ART regimen updated successfully',
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating ART regimen:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ART regimen',
      error: error.message,
    });
  } finally {
    connection.release();
  }
});

// Stop ART regimen (P15.3)
router.put('/:id/stop', authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  let userInfo = null;

  try {
    const { id } = req.params;
    const { stop_date, stop_reason } = req.body;

    const authenticatedUserId = req.user?.user_id;
    if (!authenticatedUserId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    userInfo = await getUserInfoForAudit(authenticatedUserId);

    if (!stop_date || !stop_reason) {
      return res.status(400).json({
        success: false,
        message: 'stop_date and stop_reason are required',
      });
    }

    await connection.beginTransaction();

    // Check if regimen exists
    const [regimenCheck] = await connection.query(
      'SELECT * FROM patient_art_regimens WHERE regimen_id = ?',
      [id]
    );
    if (regimenCheck.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'ART regimen not found',
      });
    }

    const oldRegimen = regimenCheck[0];

    if (oldRegimen.status !== 'active') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Only active regimens can be stopped',
      });
    }

    // Update regimen
    await connection.query(
      `
      UPDATE patient_art_regimens 
      SET status = 'stopped', stop_date = ?, stop_reason = ?, updated_at = NOW()
      WHERE regimen_id = ?
    `,
      [stop_date, stop_reason, id]
    );

    // Create history entry
    const historyId = uuidv4();
    await connection.query(
      `
      INSERT INTO art_regimen_history 
        (history_id, regimen_id, action_type, action_date, previous_status, new_status, 
         details, performed_by, notes, created_at)
      VALUES (?, ?, 'stopped', ?, ?, 'stopped', ?, ?, ?, NOW())
    `,
      [
        historyId,
        id,
        stop_date,
        oldRegimen.status,
        JSON.stringify({ stop_reason }),
        authenticatedUserId,
        stop_reason,
      ]
    );

    await connection.commit();

    // Log audit entry
    await logAudit({
      user_id: authenticatedUserId,
      user_name: userInfo.full_name,
      user_role: userInfo.role,
      action: 'UPDATE',
      module: 'ART Regimens',
      entity_type: 'art_regimen',
      entity_id: id,
      record_id: id,
      old_value: oldRegimen,
      new_value: { ...oldRegimen, status: 'stopped', stop_date, stop_reason },
      change_summary: `Stopped ART regimen: ${stop_reason}`,
      ip_address: getClientIp(req),
      status: 'success',
    });

    res.json({
      success: true,
      message: 'ART regimen stopped successfully',
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error stopping ART regimen:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop ART regimen',
      error: error.message,
    });
  } finally {
    connection.release();
  }
});

// Change ART regimen (P15.3)
router.put('/:id/change', authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  let userInfo = null;

  try {
    const { id } = req.params;
    const { change_date, change_reason, new_drugs } = req.body;

    const authenticatedUserId = req.user?.user_id;
    if (!authenticatedUserId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    userInfo = await getUserInfoForAudit(authenticatedUserId);

    if (!change_date || !change_reason) {
      return res.status(400).json({
        success: false,
        message: 'change_date and change_reason are required',
      });
    }

    await connection.beginTransaction();

    // Check if regimen exists
    const [regimenCheck] = await connection.query(
      'SELECT * FROM patient_art_regimens WHERE regimen_id = ?',
      [id]
    );
    if (regimenCheck.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'ART regimen not found',
      });
    }

    const oldRegimen = regimenCheck[0];

    // Update old regimen
    await connection.query(
      `
      UPDATE patient_art_regimens 
      SET status = 'changed', stop_date = ?, change_reason = ?, updated_at = NOW()
      WHERE regimen_id = ?
    `,
      [change_date, change_reason, id]
    );

    // Create new regimen if new_drugs provided
    let newRegimenId = null;
    if (new_drugs && new_drugs.length > 0) {
      newRegimenId = uuidv4();
      await connection.query(
        `
        INSERT INTO patient_art_regimens 
          (regimen_id, patient_id, provider_id, facility_id, start_date, status, change_reason, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'active', ?, ?, NOW(), NOW())
      `,
        [
          newRegimenId,
          oldRegimen.patient_id,
          oldRegimen.provider_id,
          oldRegimen.facility_id,
          change_date,
          change_reason,
          oldRegimen.notes,
        ]
      );

      // Add new drugs
      for (const drug of new_drugs) {
        const drugId = uuidv4();
        await connection.query(
          `
          INSERT INTO art_regimen_drugs 
            (regimen_drug_id, regimen_id, medication_id, drug_name, dosage, pills_per_day, 
             pills_dispensed, pills_remaining, missed_doses, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())
        `,
          [
            drugId,
            newRegimenId,
            drug.medication_id,
            drug.drug_name,
            drug.dosage,
            drug.pills_per_day,
            drug.pills_dispensed || 0,
            drug.pills_dispensed || 0,
          ]
        );
      }
    }

    // Create history entry
    const historyId = uuidv4();
    await connection.query(
      `
      INSERT INTO art_regimen_history 
        (history_id, regimen_id, action_type, action_date, previous_status, new_status, 
         details, performed_by, notes, created_at)
      VALUES (?, ?, 'changed', ?, ?, 'changed', ?, ?, ?, NOW())
    `,
      [
        historyId,
        id,
        change_date,
        oldRegimen.status,
        JSON.stringify({ change_reason, new_regimen_id: newRegimenId }),
        authenticatedUserId,
        change_reason,
      ]
    );

    await connection.commit();

    // Log audit entry
    await logAudit({
      user_id: authenticatedUserId,
      user_name: userInfo.full_name,
      user_role: userInfo.role,
      action: 'UPDATE',
      module: 'ART Regimens',
      entity_type: 'art_regimen',
      entity_id: id,
      record_id: id,
      old_value: oldRegimen,
      new_value: { ...oldRegimen, status: 'changed', stop_date: change_date, change_reason },
      change_summary: `Changed ART regimen: ${change_reason}`,
      ip_address: getClientIp(req),
      status: 'success',
    });

    res.json({
      success: true,
      message: 'ART regimen changed successfully',
      data: newRegimenId ? { new_regimen_id: newRegimenId } : null,
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error changing ART regimen:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change ART regimen',
      error: error.message,
    });
  } finally {
    connection.release();
  }
});

// Dispense ART pills (P15.2)
router.post('/:id/dispense', authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  let userInfo = null;

  try {
    const { id } = req.params;
    const { regimen_drug_id, quantity_dispensed } = req.body;

    const authenticatedUserId = req.user?.user_id;
    if (!authenticatedUserId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    userInfo = await getUserInfoForAudit(authenticatedUserId);

    if (!regimen_drug_id || !quantity_dispensed || quantity_dispensed <= 0) {
      return res.status(400).json({
        success: false,
        message: 'regimen_drug_id and quantity_dispensed (positive number) are required',
      });
    }

    await connection.beginTransaction();

    // Check if regimen exists and is active
    const [regimenCheck] = await connection.query(
      'SELECT * FROM patient_art_regimens WHERE regimen_id = ?',
      [id]
    );
    if (regimenCheck.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'ART regimen not found',
      });
    }

    if (regimenCheck[0].status !== 'active') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Can only dispense pills for active regimens',
      });
    }

    // Check if regimen drug exists
    const [drugCheck] = await connection.query(
      'SELECT * FROM art_regimen_drugs WHERE regimen_drug_id = ? AND regimen_id = ?',
      [regimen_drug_id, id]
    );
    if (drugCheck.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Regimen drug not found',
      });
    }

    const oldDrug = drugCheck[0];

    // Update drug dispensing
    const newPillsDispensed = oldDrug.pills_dispensed + quantity_dispensed;
    const newPillsRemaining = oldDrug.pills_remaining + quantity_dispensed;

    await connection.query(
      `
      UPDATE art_regimen_drugs 
      SET pills_dispensed = ?, pills_remaining = ?, last_dispensed_date = CURRENT_DATE, 
          created_at = COALESCE(created_at, NOW())
      WHERE regimen_drug_id = ?
    `,
      [newPillsDispensed, newPillsRemaining, regimen_drug_id]
    );

    // Create history entry
    const historyId = uuidv4();
    await connection.query(
      `
      INSERT INTO art_regimen_history 
        (history_id, regimen_id, action_type, action_date, details, performed_by, notes, created_at)
      VALUES (?, ?, 'pills_dispensed', CURRENT_DATE, ?, ?, ?, NOW())
    `,
      [
        historyId,
        id,
        JSON.stringify({
          regimen_drug_id,
          drug_name: oldDrug.drug_name,
          quantity_dispensed,
          pills_dispensed_before: oldDrug.pills_dispensed,
          pills_dispensed_after: newPillsDispensed,
        }),
        authenticatedUserId,
        `Dispensed ${quantity_dispensed} pills of ${oldDrug.drug_name}`,
      ]
    );

    // TODO: Update medication_inventory (D4) if needed
    // This would require checking inventory and updating stock levels

    await connection.commit();

    // Log audit entry
    await logAudit({
      user_id: authenticatedUserId,
      user_name: userInfo.full_name,
      user_role: userInfo.role,
      action: 'UPDATE',
      module: 'ART Regimens',
      entity_type: 'art_regimen_drug',
      entity_id: regimen_drug_id,
      record_id: regimen_drug_id,
      old_value: oldDrug,
      new_value: {
        ...oldDrug,
        pills_dispensed: newPillsDispensed,
        pills_remaining: newPillsRemaining,
        last_dispensed_date: new Date().toISOString().split('T')[0],
      },
      change_summary: `Dispensed ${quantity_dispensed} pills of ${oldDrug.drug_name}`,
      ip_address: getClientIp(req),
      status: 'success',
    });

    res.json({
      success: true,
      message: 'Pills dispensed successfully',
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error dispensing pills:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to dispense pills',
      error: error.message,
    });
  } finally {
    connection.release();
  }
});

// Record missed dose (P15.4)
router.post('/:id/missed-dose', authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  let userInfo = null;

  try {
    const { id } = req.params;
    const { regimen_drug_id, missed_date, reason } = req.body;

    const authenticatedUserId = req.user?.user_id;
    if (!authenticatedUserId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    userInfo = await getUserInfoForAudit(authenticatedUserId);

    if (!regimen_drug_id) {
      return res.status(400).json({
        success: false,
        message: 'regimen_drug_id is required',
      });
    }

    await connection.beginTransaction();

    // Check if regimen exists
    const [regimenCheck] = await connection.query(
      'SELECT * FROM patient_art_regimens WHERE regimen_id = ?',
      [id]
    );
    if (regimenCheck.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'ART regimen not found',
      });
    }

    // Check if regimen drug exists
    const [drugCheck] = await connection.query(
      'SELECT * FROM art_regimen_drugs WHERE regimen_drug_id = ? AND regimen_id = ?',
      [regimen_drug_id, id]
    );
    if (drugCheck.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Regimen drug not found',
      });
    }

    const oldDrug = drugCheck[0];

    // Update missed doses count
    const newMissedDoses = oldDrug.missed_doses + 1;

    await connection.query(
      `
      UPDATE art_regimen_drugs 
      SET missed_doses = ?
      WHERE regimen_drug_id = ?
    `,
      [newMissedDoses, regimen_drug_id]
    );

    // Create history entry
    const historyId = uuidv4();
    await connection.query(
      `
      INSERT INTO art_regimen_history 
        (history_id, regimen_id, action_type, action_date, details, performed_by, notes, created_at)
      VALUES (?, ?, 'dose_missed', ?, ?, ?, ?, NOW())
    `,
      [
        historyId,
        id,
        missed_date || new Date().toISOString().split('T')[0],
        JSON.stringify({
          regimen_drug_id,
          drug_name: oldDrug.drug_name,
          missed_doses_before: oldDrug.missed_doses,
          missed_doses_after: newMissedDoses,
          reason: reason || null,
        }),
        authenticatedUserId,
        reason || `Missed dose of ${oldDrug.drug_name}`,
      ]
    );

    await connection.commit();

    // Log audit entry
    await logAudit({
      user_id: authenticatedUserId,
      user_name: userInfo.full_name,
      user_role: userInfo.role,
      action: 'UPDATE',
      module: 'ART Regimens',
      entity_type: 'art_regimen_drug',
      entity_id: regimen_drug_id,
      record_id: regimen_drug_id,
      old_value: oldDrug,
      new_value: { ...oldDrug, missed_doses: newMissedDoses },
      change_summary: `Recorded missed dose of ${oldDrug.drug_name}`,
      ip_address: getClientIp(req),
      status: 'success',
    });

    // Trigger ARPA risk score recalculation (P2.4)
    try {
      await calculateARPARiskScore(regimenCheck[0].patient_id);
    } catch (arpaError) {
      console.error('Error recalculating ARPA risk score:', arpaError);
      // Don't fail the request if ARPA calculation fails
    }

    res.json({
      success: true,
      message: 'Missed dose recorded successfully',
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error recording missed dose:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record missed dose',
      error: error.message,
    });
  } finally {
    connection.release();
  }
});

// Get regimen history
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;

    const [history] = await db.query(
      `
      SELECT arh.*, u.full_name as performed_by_name
      FROM art_regimen_history arh
      LEFT JOIN users u ON arh.performed_by = u.user_id
      WHERE arh.regimen_id = ?
      ORDER BY arh.created_at DESC
    `,
      [id]
    );

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error fetching regimen history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch regimen history',
      error: error.message,
    });
  }
});

export default router;

