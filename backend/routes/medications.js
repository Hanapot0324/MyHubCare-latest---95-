import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';

const router = express.Router();

// Get all medications
router.get('/', async (req, res) => {
  try {
    const { search, is_art, is_controlled, active } = req.query;

    let query = 'SELECT * FROM medications WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (medication_name LIKE ? OR generic_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (is_art !== undefined) {
      query += ' AND is_art = ?';
      params.push(is_art === 'true');
    }

    if (is_controlled !== undefined) {
      query += ' AND is_controlled = ?';
      params.push(is_controlled === 'true');
    }

    if (active !== undefined) {
      query += ' AND active = ?';
      params.push(active === 'true');
    }

    query += ' ORDER BY medication_name';

    const [results] = await db.query(query, params);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medications',
      error: error.message,
    });
  }
});

// Get medication by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [results] = await db.query(
      'SELECT * FROM medications WHERE medication_id = ?',
      [id]
    );

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found',
      });
    }

    res.json({
      success: true,
      data: results[0],
    });
  } catch (error) {
    console.error('Error fetching medication:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medication',
      error: error.message,
    });
  }
});

// Add new medication
router.post('/', async (req, res) => {
  try {
    const {
      medication_name,
      generic_name,
      form,
      strength,
      atc_code,
      is_art,
      is_controlled,
      active,
    } = req.body;

    if (!medication_name || !form) {
      return res.status(400).json({
        success: false,
        message: 'Medication name and form are required',
      });
    }

    const medication_id = uuidv4();

    const query = `
      INSERT INTO medications (
        medication_id, medication_name, generic_name, form,
        strength, atc_code, is_art, is_controlled, active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(query, [
      medication_id,
      medication_name,
      generic_name || null,
      form,
      strength || null,
      atc_code || null,
      is_art || false,
      is_controlled || false,
      active !== false,
    ]);

    // Fetch the full inserted row
    const [results] = await db.query(
      'SELECT * FROM medications WHERE medication_id = ?',
      [medication_id]
    );

    res.status(201).json({
      success: true,
      message: 'Medication added successfully',
      data: results[0],
    });
  } catch (error) {
    console.error('Error adding medication:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add medication',
      error: error.message,
    });
  }
});

// Update medication
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { medication_name, generic_name, form, strength, atc_code } =
      req.body;

    // Check if medication exists
    const [check] = await db.query(
      'SELECT medication_id FROM medications WHERE medication_id = ?',
      [id]
    );
    if (check.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found',
      });
    }

    const query = `
      UPDATE medications SET
        medication_name = ?, generic_name = ?, form = ?,
        strength = ?, atc_code = ?
      WHERE medication_id = ?
    `;

    await db.query(query, [
      medication_name,
      generic_name || null,
      form,
      strength || null,
      atc_code || null,
      id,
    ]);

    // Fetch updated row
    const [results] = await db.query(
      'SELECT * FROM medications WHERE medication_id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Medication updated successfully',
      data: results[0],
    });
  } catch (error) {
    console.error('Error updating medication:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update medication',
      error: error.message,
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if medication exists
    const [check] = await db.query(
      'SELECT medication_id FROM medications WHERE medication_id = ?',
      [id]
    );
    if (check.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found',
      });
    }

    // Check if medication is used in prescriptions or inventory
    const [usageCheck] = await db.query(
      `
      SELECT COUNT(*) as count FROM (
        SELECT medication_id FROM prescription_items WHERE medication_id = ?
        UNION
        SELECT medication_id FROM medication_inventory WHERE medication_id = ?
      ) as med_usage
      `,
      [id, id]
    );

    if (usageCheck[0].count > 0) {
      // Instead of deleting, mark as inactive
      await db.query(
        'UPDATE medications SET active = FALSE WHERE medication_id = ?',
        [id]
      );

      res.json({
        success: true,
        message: 'Medication deactivated successfully as it is in use',
      });
    } else {
      // Safe to delete
      await db.query('DELETE FROM medications WHERE medication_id = ?', [id]);

      res.json({
        success: true,
        message: 'Medication deleted successfully',
      });
    }
  } catch (error) {
    console.error('Error deleting medication:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete medication',
      error: error.message,
    });
  }
});

export default router;
