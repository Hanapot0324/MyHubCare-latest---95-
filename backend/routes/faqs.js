import express from "express";
import { db } from "../db.js";
import { authenticateToken } from "./auth.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: "Unauthorized. Admin access required.",
    });
  }
  next();
};

// GET /api/faqs - Get all FAQs (published for users, all for admins)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { category, search } = req.query;
    const isUserAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';

    let query = "SELECT * FROM faqs";
    const params = [];
    const conditions = [];

    // Non-admin users only see published FAQs
    if (!isUserAdmin) {
      conditions.push("is_published = TRUE");
    }

    if (category) {
      conditions.push("category = ?");
      params.push(category);
    }

    if (search) {
      conditions.push("(question LIKE ? OR answer LIKE ?)");
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY display_order ASC, created_at DESC";

    const [faqs] = await db.query(query, params);

    res.json({
      success: true,
      faqs: faqs || [],
    });
  } catch (err) {
    console.error("Error fetching FAQs:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// GET /api/faqs/categories/list - Get all unique categories (for filtering)
// MUST come before /:id route to avoid being caught by it
router.get("/categories/list", authenticateToken, async (req, res) => {
  try {
    const isUserAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    
    let query = "SELECT DISTINCT category FROM faqs WHERE category IS NOT NULL";
    
    if (!isUserAdmin) {
      query += " AND is_published = TRUE";
    }
    
    query += " ORDER BY category ASC";

    const [categories] = await db.query(query);

    res.json({
      success: true,
      categories: categories.map(c => c.category),
    });
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// GET /api/faqs/:id - Get single FAQ
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const isUserAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';

    let query = "SELECT * FROM faqs WHERE faq_id = ?";
    const params = [id];

    // Non-admin users only see published FAQs
    if (!isUserAdmin) {
      query += " AND is_published = TRUE";
    }

    const [faqs] = await db.query(query, params);

    if (faqs.length === 0) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }

    // Increment view count
    await db.query("UPDATE faqs SET view_count = view_count + 1 WHERE faq_id = ?", [id]);

    res.json({
      success: true,
      faq: faqs[0],
    });
  } catch (err) {
    console.error("Error fetching FAQ:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// POST /api/faqs - Create new FAQ (Admin only)
router.post("/", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { question, answer, category, display_order, is_published } = req.body;

    // Validation
    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: "Question and answer are required",
      });
    }

    // Generate UUID for faq_id
    const faqId = uuidv4();

    await db.query(
      `INSERT INTO faqs (faq_id, question, answer, category, display_order, is_published, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        faqId,
        question.trim(),
        answer.trim(),
        category ? category.trim() : null,
        display_order || 0,
        is_published !== undefined ? (is_published ? 1 : 0) : 1
      ]
    );

    res.status(201).json({
      success: true,
      message: "FAQ created successfully",
      faq_id: faqId,
    });
  } catch (err) {
    console.error("Error creating FAQ:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// PUT /api/faqs/:id - Update FAQ (Admin only)
router.put("/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, category, display_order, is_published } = req.body;

    // Validation
    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: "Question and answer are required",
      });
    }

    // Check if FAQ exists
    const [existing] = await db.query("SELECT faq_id FROM faqs WHERE faq_id = ?", [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }

    await db.query(
      `UPDATE faqs 
       SET question = ?, answer = ?, category = ?, display_order = ?, is_published = ?, updated_at = NOW() 
       WHERE faq_id = ?`,
      [
        question.trim(),
        answer.trim(),
        category ? category.trim() : null,
        display_order || 0,
        is_published !== undefined ? (is_published ? 1 : 0) : 1,
        id
      ]
    );

    res.json({
      success: true,
      message: "FAQ updated successfully",
    });
  } catch (err) {
    console.error("Error updating FAQ:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// DELETE /api/faqs/:id - Delete FAQ (Admin only)
router.delete("/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if FAQ exists
    const [existing] = await db.query("SELECT faq_id FROM faqs WHERE faq_id = ?", [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }

    await db.query("DELETE FROM faqs WHERE faq_id = ?", [id]);

    res.json({
      success: true,
      message: "FAQ deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting FAQ:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

export default router;