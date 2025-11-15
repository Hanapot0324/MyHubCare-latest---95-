import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';

const router = express.Router();

// Get all inventory items
router.get('/', async (req, res) => {
  try {
    const { facility_id } = req.query;

    let query = `
      SELECT mi.*, m.medication_name, f.facility_name
      FROM medication_inventory mi
      JOIN medications m ON mi.medication_id = m.medication_id
      JOIN facilities f ON mi.facility_id = f.facility_id
    `;

    const params = [];

    if (facility_id) {
      query += ' WHERE mi.facility_id = ?';
      params.push(facility_id);
    }

    query += ' ORDER BY m.medication_name';

    const [results] = await db.query(query, params);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory',
      error: error.message,
    });
  }
});

// Get inventory item by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT mi.*, m.medication_name, f.facility_name
      FROM medication_inventory mi
      JOIN medications m ON mi.medication_id = m.medication_id
      JOIN facilities f ON mi.facility_id = f.facility_id
      WHERE mi.inventory_id = ?
    `;

    const [results] = await db.query(query, [id]);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    res.json({
      success: true,
      data: results[0],
    });
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory item',
      error: error.message,
    });
  }
});

// Add new inventory item
router.post('/', async (req, res) => {
  try {
    const {
      medication_id,
      facility_id,
      batch_number,
      quantity_on_hand,
      unit,
      expiry_date,
      reorder_level,
      supplier,
      cost_per_unit,
    } = req.body;

    // Check if medication exists
    const [medCheck] = await db.query(
      'SELECT medication_id FROM medications WHERE medication_id = ?',
      [medication_id]
    );
    if (medCheck.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Medication not found',
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

    const inventory_id = uuidv4();

    const query = `
      INSERT INTO medication_inventory (
        inventory_id, medication_id, facility_id, batch_number, 
        quantity_on_hand, unit, expiry_date, reorder_level, 
        supplier, cost_per_unit
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(query, [
      inventory_id,
      medication_id,
      facility_id,
      batch_number,
      quantity_on_hand,
      unit,
      expiry_date,
      reorder_level,
      supplier,
      cost_per_unit,
    ]);

    // Log to audit
    await db.query(
      'INSERT INTO audit_log (table_name, record_id, action, user_id, timestamp) VALUES (?, ?, ?, ?, NOW())',
      [
        'medication_inventory',
        inventory_id,
        'CREATE',
        req.user?.user_id || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Inventory item added successfully',
      data: { inventory_id },
    });
  } catch (error) {
    console.error('Error adding inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add inventory item',
      error: error.message,
    });
  }
});

// Update inventory item
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      quantity_on_hand,
      unit,
      expiry_date,
      reorder_level,
      supplier,
      cost_per_unit,
    } = req.body;

    // Check if inventory item exists
    const [check] = await db.query(
      'SELECT inventory_id FROM medication_inventory WHERE inventory_id = ?',
      [id]
    );
    if (check.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    const query = `
      UPDATE medication_inventory SET
        quantity_on_hand = ?, unit = ?, expiry_date = ?, 
        reorder_level = ?, supplier = ?, cost_per_unit = ?
      WHERE inventory_id = ?
    `;

    await db.query(query, [
      quantity_on_hand,
      unit,
      expiry_date,
      reorder_level,
      supplier,
      cost_per_unit,
      id,
    ]);

    // Log to audit
    await db.query(
      'INSERT INTO audit_log (table_name, record_id, action, user_id, timestamp) VALUES (?, ?, ?, ?, NOW())',
      ['medication_inventory', id, 'UPDATE', req.user?.user_id || null]
    );

    res.json({
      success: true,
      message: 'Inventory item updated successfully',
    });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory item',
      error: error.message,
    });
  }
});

// Restock inventory item
router.post('/:id/restock', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, batch_number, cost_per_unit } = req.body;

    // Check if inventory item exists
    const [check] = await db.query(
      'SELECT inventory_id, quantity_on_hand FROM medication_inventory WHERE inventory_id = ?',
      [id]
    );

    if (check.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    const currentQuantity = check[0].quantity_on_hand;
    const newQuantity = currentQuantity + parseInt(quantity);

    const query = `
      UPDATE medication_inventory SET
        quantity_on_hand = ?, last_restocked = NOW()
    `;

    const params = [newQuantity];

    if (batch_number) {
      query += ', batch_number = ?';
      params.push(batch_number);
    }

    if (cost_per_unit) {
      query += ', cost_per_unit = ?';
      params.push(cost_per_unit);
    }

    query += ' WHERE inventory_id = ?';
    params.push(id);

    await db.query(query, params);

    // Log to audit
    await db.query(
      'INSERT INTO audit_log (table_name, record_id, action, user_id, timestamp, details) VALUES (?, ?, ?, ?, NOW(), ?)',
      [
        'medication_inventory',
        id,
        'RESTOCK',
        req.user?.user_id || null,
        `Restocked with ${quantity} units`,
      ]
    );

    res.json({
      success: true,
      message: 'Inventory item restocked successfully',
      data: {
        previousQuantity: currentQuantity,
        quantityAdded: parseInt(quantity),
        newQuantity,
      },
    });
  } catch (error) {
    console.error('Error restocking inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restock inventory item',
      error: error.message,
    });
  }
});

// Delete inventory item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if inventory item exists
    const [check] = await db.query(
      'SELECT inventory_id FROM medication_inventory WHERE inventory_id = ?',
      [id]
    );
    if (check.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    await db.query('DELETE FROM medication_inventory WHERE inventory_id = ?', [
      id,
    ]);

    // Log to audit
    await db.query(
      'INSERT INTO audit_log (table_name, record_id, action, user_id, timestamp) VALUES (?, ?, ?, ?, NOW())',
      ['medication_inventory', id, 'DELETE', req.user?.user_id || null]
    );

    res.json({
      success: true,
      message: 'Inventory item deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete inventory item',
      error: error.message,
    });
  }
});

// Get low stock items
router.get('/alerts/low-stock', async (req, res) => {
  try {
    const { facility_id } = req.query;

    let query = `
      SELECT mi.*, m.medication_name, f.facility_name
      FROM medication_inventory mi
      JOIN medications m ON mi.medication_id = m.medication_id
      JOIN facilities f ON mi.facility_id = f.facility_id
      WHERE mi.quantity_on_hand <= mi.reorder_level
    `;

    const params = [];

    if (facility_id) {
      query += ' AND mi.facility_id = ?';
      params.push(facility_id);
    }

    query += ' ORDER BY mi.quantity_on_hand ASC';

    const [results] = await db.query(query, params);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock items',
      error: error.message,
    });
  }
});

// Get expiring items
router.get('/alerts/expiring', async (req, res) => {
  try {
    const { facility_id, months = 3 } = req.query;

    let query = `
      SELECT mi.*, m.medication_name, f.facility_name
      FROM medication_inventory mi
      JOIN medications m ON mi.medication_id = m.medication_id
      JOIN facilities f ON mi.facility_id = f.facility_id
      WHERE mi.expiry_date <= DATE_ADD(CURRENT_DATE(), INTERVAL ? MONTH)
    `;

    const params = [months];

    if (facility_id) {
      query += ' AND mi.facility_id = ?';
      params.push(facility_id);
    }

    query += ' ORDER BY mi.expiry_date ASC';

    const [results] = await db.query(query, params);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error fetching expiring items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expiring items',
      error: error.message,
    });
  }
});

export default router;
