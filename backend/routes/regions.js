import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// ==================== REGIONS ====================

// Get all regions
router.get('/', async (req, res) => {
  try {
    const { is_active, search } = req.query;

    let query = 'SELECT * FROM regions WHERE 1=1';
    const params = [];

    if (is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(is_active);
    }

    if (search) {
      query += ' AND (region_name LIKE ? OR region_code LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY region_name';

    const [regions] = await db.query(query, params);
    res.json({ success: true, data: regions });
  } catch (error) {
    console.error('Error fetching regions:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch regions' });
  }
});

// Get single region
router.get('/:id', async (req, res) => {
  try {
    const [regions] = await db.query(
      'SELECT * FROM regions WHERE region_id = ?',
      [req.params.id]
    );

    if (regions.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Region not found' });
    }

    res.json({ success: true, data: regions[0] });
  } catch (error) {
    console.error('Error fetching region:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch region' });
  }
});

// Create region
router.post('/', async (req, res) => {
  try {
    const { region_name, region_code, is_active = 1 } = req.body;

    if (!region_name) {
      return res
        .status(400)
        .json({ success: false, message: 'Region name is required' });
    }

    const [result] = await db.query(
      'INSERT INTO regions (region_name, region_code, is_active) VALUES (?, ?, ?)',
      [
        region_name,
        region_code,
        region_code ? region_code.toUpperCase() : null,
        is_active,
      ]
    );

    const [newRegion] = await db.query(
      'SELECT * FROM regions WHERE region_id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: newRegion[0],
      message: 'Region created successfully',
    });
  } catch (error) {
    console.error('Error creating region:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Region code already exists',
      });
    }

    res
      .status(500)
      .json({ success: false, message: 'Failed to create region' });
  }
});

// Update region
router.put('/:id', async (req, res) => {
  try {
    const { region_name, region_code, is_active } = req.body;
    const { id } = req.params;

    if (!region_name) {
      return res.status(400).json({
        success: false,
        message: 'Region name is required',
      });
    }

    const [result] = await db.query(
      'UPDATE regions SET region_name = ?, region_code = ?, is_active = ? WHERE region_id = ?',
      [
        region_name,
        region_code ? region_code.toUpperCase() : null,
        is_active,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Region not found',
      });
    }

    const [updatedRegion] = await db.query(
      'SELECT * FROM regions WHERE region_id = ?',
      [id]
    );

    res.json({
      success: true,
      data: updatedRegion[0],
      message: 'Region updated successfully',
    });
  } catch (error) {
    console.error('Error updating region:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Region code already exists',
      });
    }

    res
      .status(500)
      .json({ success: false, message: 'Failed to update region' });
  }
});

// Delete region (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    // Check if region is used by any facilities
    const [facilities] = await db.query(
      'SELECT COUNT(*) as count FROM facilities WHERE region_id = ? AND is_active = 1',
      [req.params.id]
    );

    if (facilities[0].count > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete region. ${facilities[0].count} active facilities are using this region.`,
      });
    }

    const [result] = await db.query(
      'UPDATE regions SET is_active = 0 WHERE region_id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Region not found',
      });
    }

    res.json({ success: true, message: 'Region deleted successfully' });
  } catch (error) {
    console.error('Error deleting region:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to delete region' });
  }
});

// Hard delete region (permanent)
router.delete('/:id/permanent', async (req, res) => {
  try {
    // Check if region is used by any facilities
    const [facilities] = await db.query(
      'SELECT COUNT(*) as count FROM facilities WHERE region_id = ?',
      [req.params.id]
    );

    if (facilities[0].count > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot permanently delete region. ${facilities[0].count} facilities are using this region.`,
      });
    }

    const [result] = await db.query('DELETE FROM regions WHERE region_id = ?', [
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Region not found',
      });
    }

    res.json({ success: true, message: 'Region permanently deleted' });
  } catch (error) {
    console.error('Error permanently deleting region:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to permanently delete region',
    });
  }
});

// Get region statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const [totalCount] = await db.query(
      'SELECT COUNT(*) as total FROM regions WHERE is_active = 1'
    );

    const [withFacilities] = await db.query(
      `SELECT 
        r.region_id,
        r.region_name,
        r.region_code,
        COUNT(f.facility_id) as facility_count
      FROM regions r
      LEFT JOIN facilities f ON r.region_id = f.region_id AND f.is_active = 1
      WHERE r.is_active = 1
      GROUP BY r.region_id
      ORDER BY facility_count DESC`
    );

    res.json({
      success: true,
      data: {
        total: totalCount[0].total,
        regions: withFacilities,
      },
    });
  } catch (error) {
    console.error('Error fetching region statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
    });
  }
});

export default router;
