import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';

const router = express.Router();

// Get all prescriptions
router.get('/', async (req, res) => {
  try {
    const { patient_id, prescriber_id, facility_id, status } = req.query;

    let query = `
      SELECT p.*, pa.first_name, pa.last_name, pa.date_of_birth, pa.gender,
             u.first_name as prescriber_first_name, u.last_name as prescriber_last_name,
             f.facility_name
      FROM prescriptions p
      JOIN patients pa ON p.patient_id = pa.patient_id
      JOIN users u ON p.prescriber_id = u.user_id
      JOIN facilities f ON p.facility_id = f.facility_id
    `;

    const params = [];
    const conditions = [];

    if (patient_id) {
      conditions.push('p.patient_id = ?');
      params.push(patient_id);
    }

    if (prescriber_id) {
      conditions.push('p.prescriber_id = ?');
      params.push(prescriber_id);
    }

    if (facility_id) {
      conditions.push('p.facility_id = ?');
      params.push(facility_id);
    }

    if (status) {
      conditions.push('p.status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY p.prescription_date DESC';

    const [results] = await db.query(query, params);

    // Get prescription items for each prescription
    for (const prescription of results) {
      const [items] = await db.query(
        `
        SELECT pi.*, m.medication_name
        FROM prescription_items pi
        JOIN medications m ON pi.medication_id = m.medication_id
        WHERE pi.prescription_id = ?
      `,
        [prescription.prescription_id]
      );

      prescription.items = items;
    }

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prescriptions',
      error: error.message,
    });
  }
});

// Get prescription by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT p.*, pa.first_name, pa.last_name, pa.date_of_birth, pa.gender,
             u.first_name as prescriber_first_name, u.last_name as prescriber_last_name,
             f.facility_name
      FROM prescriptions p
      JOIN patients pa ON p.patient_id = pa.patient_id
      JOIN users u ON p.prescriber_id = u.user_id
      JOIN facilities f ON p.facility_id = f.facility_id
      WHERE p.prescription_id = ?
    `;

    const [results] = await db.query(query, [id]);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found',
      });
    }

    const prescription = results[0];

    // Get prescription items
    const [items] = await db.query(
      `
      SELECT pi.*, m.medication_name
      FROM prescription_items pi
      JOIN medications m ON pi.medication_id = m.medication_id
      WHERE pi.prescription_id = ?
    `,
      [id]
    );

    prescription.items = items;

    res.json({
      success: true,
      data: prescription,
    });
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prescription',
      error: error.message,
    });
  }
});

// Create new prescription
router.post('/', async (req, res) => {
  try {
    const {
      patient_id,
      prescriber_id,
      facility_id,
      start_date,
      end_date,
      duration_days,
      notes,
      items,
    } = req.body;

    // Validate required fields
    if (
      !patient_id ||
      !prescriber_id ||
      !facility_id ||
      !start_date ||
      !items ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Check if patient exists
    const [patientCheck] = await db.query(
      'SELECT patient_id FROM patients WHERE patient_id = ?',
      [patient_id]
    );
    if (patientCheck.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Patient not found',
      });
    }

    // Check if prescriber exists
    const [prescriberCheck] = await db.query(
      'SELECT user_id FROM users WHERE user_id = ?',
      [prescriber_id]
    );
    if (prescriberCheck.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Prescriber not found',
      });
    }

    // Check if facility exists
    const [facilityCheck] = await db.query(
      'SELECT facility_id FROM facilities WHERE facility_id = ?',
      [facility_id]
    );
    if (facilityCheck.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Facility not found',
      });
    }

    // Generate prescription number
    const [countResult] = await db.query(
      'SELECT COUNT(*) as count FROM prescriptions WHERE DATE(prescription_date) = CURDATE()'
    );
    const count = countResult[0].count;
    const prescription_number = `RX-${new Date().getFullYear()}${String(
      new Date().getMonth() + 1
    ).padStart(2, '0')}${String(new Date().getDate()).padStart(
      2,
      '0'
    )}-${String(count + 1).padStart(4, '0')}`;

    const prescription_id = uuidv4();

    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Insert prescription
      await connection.query(
        `
        INSERT INTO prescriptions (
          prescription_id, patient_id, prescriber_id, facility_id,
          prescription_date, prescription_number, start_date, end_date,
          duration_days, notes
        ) VALUES (?, ?, ?, ?, CURDATE(), ?, ?, ?, ?, ?)
      `,
        [
          prescription_id,
          patient_id,
          prescriber_id,
          facility_id,
          prescription_number,
          start_date,
          end_date,
          duration_days,
          notes,
        ]
      );

      // Insert prescription items
      for (const item of items) {
        const prescription_item_id = uuidv4();

        // Check if medication exists
        const [medCheck] = await connection.query(
          'SELECT medication_id FROM medications WHERE medication_id = ?',
          [item.medication_id]
        );
        if (medCheck.length === 0) {
          throw new Error(`Medication with ID ${item.medication_id} not found`);
        }

        await connection.query(
          `
          INSERT INTO prescription_items (
            prescription_item_id, prescription_id, medication_id,
            dosage, frequency, quantity, instructions, duration_days
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            prescription_item_id,
            prescription_id,
            item.medication_id,
            item.dosage,
            item.frequency,
            item.quantity,
            item.instructions,
            item.duration_days,
          ]
        );
      }

      // Log to audit
      await connection.query(
        'INSERT INTO audit_log (table_name, record_id, action, user_id, timestamp) VALUES (?, ?, ?, ?, NOW())',
        ['prescriptions', prescription_id, 'CREATE', req.user?.user_id || null]
      );

      await connection.commit();

      res.status(201).json({
        success: true,
        message: 'Prescription created successfully',
        data: {
          prescription_id,
          prescription_number,
        },
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create prescription',
      error: error.message,
    });
  }
});

// Update prescription
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date, duration_days, notes, status } = req.body;

    // Check if prescription exists
    const [check] = await db.query(
      'SELECT prescription_id FROM prescriptions WHERE prescription_id = ?',
      [id]
    );
    if (check.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found',
      });
    }

    const query = `
      UPDATE prescriptions SET
        start_date = ?, end_date = ?, duration_days = ?, notes = ?, status = ?
      WHERE prescription_id = ?
    `;

    await db.query(query, [
      start_date,
      end_date,
      duration_days,
      notes,
      status,
      id,
    ]);

    // Log to audit
    await db.query(
      'INSERT INTO audit_log (table_name, record_id, action, user_id, timestamp) VALUES (?, ?, ?, ?, NOW())',
      ['prescriptions', id, 'UPDATE', req.user?.user_id || null]
    );

    res.json({
      success: true,
      message: 'Prescription updated successfully',
    });
  } catch (error) {
    console.error('Error updating prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update prescription',
      error: error.message,
    });
  }
});

// Cancel prescription
router.put('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Check if prescription exists
    const [check] = await db.query(
      'SELECT prescription_id, status FROM prescriptions WHERE prescription_id = ?',
      [id]
    );
    if (check.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found',
      });
    }

    if (check[0].status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Prescription is already cancelled',
      });
    }

    await db.query(
      'UPDATE prescriptions SET status = ?, notes = CONCAT(IFNULL(notes, ""), "\n\nCancellation reason: ", ?) WHERE prescription_id = ?',
      ['cancelled', reason || 'No reason provided', id]
    );

    // Log to audit
    await db.query(
      'INSERT INTO audit_log (table_name, record_id, action, user_id, timestamp, details) VALUES (?, ?, ?, ?, NOW(), ?)',
      [
        'prescriptions',
        id,
        'CANCEL',
        req.user?.user_id || null,
        reason || 'No reason provided',
      ]
    );

    res.json({
      success: true,
      message: 'Prescription cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel prescription',
      error: error.message,
    });
  }
});

// Dispense medication from prescription
router.post('/:id/dispense', async (req, res) => {
  try {
    const { id } = req.params;
    const { nurse_id, facility_id, items } = req.body;

    // Check if prescription exists
    const [prescriptionCheck] = await db.query(
      'SELECT prescription_id, patient_id, status FROM prescriptions WHERE prescription_id = ?',
      [id]
    );

    if (prescriptionCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found',
      });
    }

    if (prescriptionCheck[0].status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Prescription is not active',
      });
    }

    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Process each dispense item
      for (const item of items) {
        const {
          prescription_item_id,
          quantity_dispensed,
          batch_number,
          notes,
        } = item;

        // Check if prescription item exists
        const [itemCheck] = await connection.query(
          'SELECT prescription_item_id, medication_id, quantity FROM prescription_items WHERE prescription_item_id = ? AND prescription_id = ?',
          [prescription_item_id, id]
        );

        if (itemCheck.length === 0) {
          throw new Error(
            `Prescription item with ID ${prescription_item_id} not found`
          );
        }

        const medication_id = itemCheck[0].medication_id;

        // Check inventory
        const [inventoryCheck] = await connection.query(
          'SELECT inventory_id, quantity_on_hand FROM medication_inventory WHERE medication_id = ? AND facility_id = ?',
          [medication_id, facility_id]
        );

        if (inventoryCheck.length === 0) {
          throw new Error(`No inventory found for medication at this facility`);
        }

        if (inventoryCheck[0].quantity_on_hand < quantity_dispensed) {
          throw new Error(
            `Insufficient inventory. Available: ${inventoryCheck[0].quantity_on_hand}, Requested: ${quantity_dispensed}`
          );
        }

        // Create dispense event
        const dispense_id = uuidv4();
        await connection.query(
          `
          INSERT INTO dispense_events (
            dispense_id, prescription_id, prescription_item_id, nurse_id,
            facility_id, dispensed_date, quantity_dispensed, batch_number, notes
          ) VALUES (?, ?, ?, ?, ?, CURDATE(), ?, ?, ?)
        `,
          [
            dispense_id,
            id,
            prescription_item_id,
            nurse_id,
            facility_id,
            quantity_dispensed,
            batch_number,
            notes,
          ]
        );

        // Update inventory
        await connection.query(
          'UPDATE medication_inventory SET quantity_on_hand = quantity_on_hand - ? WHERE inventory_id = ?',
          [quantity_dispensed, inventoryCheck[0].inventory_id]
        );

        // Create medication reminder
        const [prescriptionItem] = await connection.query(
          `
          SELECT pi.*, m.medication_name
          FROM prescription_items pi
          JOIN medications m ON pi.medication_id = m.medication_id
          WHERE pi.prescription_item_id = ?
        `,
          [prescription_item_id]
        );

        if (prescriptionItem.length > 0) {
          const reminder_id = uuidv4();
          await connection.query(
            `
            INSERT INTO medication_reminders (
              reminder_id, prescription_id, patient_id, medication_name,
              dosage, frequency, reminder_time
            ) VALUES (?, ?, ?, ?, ?, ?, '09:00:00')
          `,
            [
              reminder_id,
              id,
              prescriptionCheck[0].patient_id,
              prescriptionItem[0].medication_name,
              prescriptionItem[0].dosage,
              prescriptionItem[0].frequency,
            ]
          );
        }
      }

      // Log to audit
      await connection.query(
        'INSERT INTO audit_log (table_name, record_id, action, user_id, timestamp) VALUES (?, ?, ?, ?, NOW())',
        ['prescriptions', id, 'DISPENSE', req.user?.user_id || null]
      );

      await connection.commit();

      res.json({
        success: true,
        message: 'Medication dispensed successfully',
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error dispensing medication:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to dispense medication',
      error: error.message,
    });
  }
});

// Get dispense events for a prescription
router.get('/:id/dispense-events', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT de.*, u.first_name as nurse_first_name, u.last_name as nurse_last_name,
             f.facility_name
      FROM dispense_events de
      JOIN users u ON de.nurse_id = u.user_id
      JOIN facilities f ON de.facility_id = f.facility_id
      WHERE de.prescription_id = ?
      ORDER BY de.dispensed_date DESC
    `;

    const [results] = await db.query(query, [id]);

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

export default router;
