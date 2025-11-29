// backend/routes/forum.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../db.js';
import { authenticateToken } from './auth.js';
import { logAudit, getClientIp } from '../utils/auditLogger.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Helper function to get patient_id from user
async function getPatientId(userId, email) {
  try {
    // Try to find patient by created_by
    let [patients] = await db.query(
      'SELECT patient_id FROM patients WHERE created_by = ? AND status = "active" LIMIT 1',
      [userId]
    );
    
    // If not found, try by email
    if (patients.length === 0 && email) {
      [patients] = await db.query(
        'SELECT patient_id FROM patients WHERE email = ? AND status = "active" LIMIT 1',
        [email]
      );
    }
    
    return patients.length > 0 ? patients[0].patient_id : null;
  } catch (error) {
    console.error('Error getting patient_id:', error);
    return null;
  }
}

// GET /api/forum/categories - Get all active forum categories
router.get('/categories', async (req, res) => {
  try {
    console.log('[API] GET /api/forum/categories - Fetching categories');
    
    const [categories] = await db.query(`
      SELECT category_id, category_name, category_code, description, icon, is_active
      FROM forum_categories
      WHERE is_active = true
      ORDER BY category_name ASC
    `);
    
    console.log(`[API] Successfully fetched ${categories.length} categories`);
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('[API] Error fetching categories:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/forum/posts - Get all forum posts (with filters)
router.get('/posts', async (req, res) => {
  try {
    const { category_id, status = 'approved', limit = 50, offset = 0 } = req.query;
    console.log('[API] GET /api/forum/posts - Fetching posts', { category_id, status, limit, offset });
    
    let query = `
      SELECT 
        p.post_id,
        p.title,
        p.content,
        p.is_anonymous,
        p.reply_count,
        p.view_count,
        p.is_pinned,
        p.is_locked,
        p.status,
        p.created_at,
        p.updated_at,
        c.category_id,
        c.category_name,
        c.category_code,
        c.icon as category_icon,
        CASE 
          WHEN p.is_anonymous = true THEN 'Anonymous User'
          ELSE COALESCE(CONCAT(pat.first_name, ' ', pat.last_name), u.full_name, u.username)
        END as author_name,
        CASE 
          WHEN p.is_anonymous = true THEN NULL
          ELSE u.profile_image
        END as author_image
      FROM forum_posts p
      INNER JOIN forum_categories c ON p.category_id = c.category_id
      LEFT JOIN patients pat ON p.patient_id = pat.patient_id
      LEFT JOIN users u ON pat.created_by = u.user_id
      WHERE p.status = ?
    `;
    
    const params = [status];
    
    if (category_id) {
      query += ' AND p.category_id = ?';
      params.push(category_id);
    }
    
    query += ' ORDER BY p.is_pinned DESC, p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [posts] = await db.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM forum_posts WHERE status = ?';
    const countParams = [status];
    if (category_id) {
      countQuery += ' AND category_id = ?';
      countParams.push(category_id);
    }
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0]?.total || 0;
    
    console.log(`[API] Successfully fetched ${posts.length} posts (total: ${total})`);
    res.json({
      success: true,
      posts,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('[API] Error fetching posts:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/forum/posts/:postId - Get a specific post with replies
router.get('/posts/:postId', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    console.log(`[API] GET /api/forum/posts/${postId} - Fetching post details`);
    
    // Get post details
    const [postDetails] = await db.query(`
      SELECT 
        p.post_id,
        p.title,
        p.content,
        p.is_anonymous,
        p.reply_count,
        p.view_count,
        p.is_pinned,
        p.is_locked,
        p.status,
        p.created_at,
        p.updated_at,
        c.category_id,
        c.category_name,
        c.category_code,
        c.icon as category_icon,
        CASE 
          WHEN p.is_anonymous = true THEN 'Anonymous User'
          ELSE COALESCE(CONCAT(pat.first_name, ' ', pat.last_name), u.full_name, u.username)
        END as author_name,
        CASE 
          WHEN p.is_anonymous = true THEN NULL
          ELSE u.profile_image
        END as author_image
      FROM forum_posts p
      INNER JOIN forum_categories c ON p.category_id = c.category_id
      LEFT JOIN patients pat ON p.patient_id = pat.patient_id
      LEFT JOIN users u ON pat.created_by = u.user_id
      WHERE p.post_id = ? AND p.status = 'approved'
    `, [postId]);
    
    if (postDetails.length === 0) {
      console.log(`[API] Post not found with ID: ${postId}`);
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    const post = postDetails[0];
    
    // Get replies
    const [replies] = await db.query(`
      SELECT 
        r.reply_id,
        r.content,
        r.is_anonymous,
        r.status,
        r.created_at,
        CASE 
          WHEN r.is_anonymous = true THEN 'Anonymous User'
          ELSE COALESCE(CONCAT(pat.first_name, ' ', pat.last_name), u.full_name, u.username)
        END as author_name,
        CASE 
          WHEN r.is_anonymous = true THEN NULL
          ELSE u.profile_image
        END as author_image
      FROM forum_replies r
      LEFT JOIN patients pat ON r.patient_id = pat.patient_id
      LEFT JOIN users u ON pat.created_by = u.user_id
      WHERE r.post_id = ? AND r.status = 'approved'
      ORDER BY r.created_at ASC
    `, [postId]);
    
    // Update view count
    await db.query(`
      UPDATE forum_posts SET view_count = view_count + 1 WHERE post_id = ?
    `, [postId]);
    
    console.log(`[API] Successfully fetched post with ${replies.length} replies`);
    res.json({
      success: true,
      post,
      replies
    });
  } catch (error) {
    console.error('[API] Error fetching post details:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch post details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/forum/posts - Create a new forum post
router.post('/posts', 
  authenticateToken,
  [
    body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
    body('content').trim().isLength({ min: 10, max: 5000 }).withMessage('Content must be 10-5000 characters'),
    body('category_id').notEmpty().withMessage('Category is required'),
    body('is_anonymous').optional().isBoolean(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('[API] Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    try {
      const { title, content, category_id, is_anonymous = true } = req.body;
      const userId = req.user.user_id;
      const userEmail = req.user.email;
      
      console.log(`[API] Creating new post: ${title} by user ${userId}`);
      
      // Verify category exists and is active
      const [categoryCheck] = await db.query(`
        SELECT category_id FROM forum_categories WHERE category_id = ? AND is_active = true
      `, [category_id]);
      
      if (categoryCheck.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or inactive category'
        });
      }
      
      // Get patient_id if not anonymous
      let patientId = null;
      if (!is_anonymous) {
        patientId = await getPatientId(userId, userEmail);
        if (!patientId) {
          console.log('Warning: Could not find patient_id for user, posting as anonymous');
        }
      }
      
      const postId = uuidv4();
      
      // Create the post
      await db.query(`
        INSERT INTO forum_posts (
          post_id, patient_id, category_id, title, content, 
          is_anonymous, status, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())
      `, [postId, patientId, category_id, title, content, is_anonymous]);
      
      console.log(`[API] Post created with ID: ${postId}`);
      
      // Log audit entry
      await logAudit({
        user_id: userId,
        user_name: req.user.full_name || req.user.username,
        user_role: req.user.role,
        action: 'CREATE',
        module: 'Forum',
        entity_type: 'forum_post',
        entity_id: postId,
        record_id: postId,
        new_value: {
          title: title.substring(0, 100),
          category_id,
          is_anonymous
        },
        change_summary: `New forum post created: ${title.substring(0, 50)}...`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'] || 'unknown',
        status: 'success',
      });
      
      res.status(201).json({
        success: true,
        message: 'Post created successfully and is pending moderation',
        postId
      });
    } catch (error) {
      console.error('[API] Error creating post:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to create post',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// POST /api/forum/posts/:postId/replies - Create a reply to a post
router.post('/posts/:postId/replies', 
  authenticateToken,
  [
    body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Content must be 1-2000 characters'),
    body('is_anonymous').optional().isBoolean(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('[API] Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    try {
      const { postId } = req.params;
      const { content, is_anonymous = true } = req.body;
      const userId = req.user.user_id;
      const userEmail = req.user.email;
      
      // Verify post exists and is not locked
      const [postCheck] = await db.query(`
        SELECT post_id, is_locked, status FROM forum_posts 
        WHERE post_id = ? AND status = 'approved'
      `, [postId]);
      
      if (postCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Post not found or not approved'
        });
      }
      
      if (postCheck[0].is_locked) {
        return res.status(403).json({
          success: false,
          message: 'Post is locked and cannot receive replies'
        });
      }
      
      console.log(`[API] Adding reply to post ${postId} by user ${userId}`);
      
      // Get patient_id if not anonymous
      let patientId = null;
      if (!is_anonymous) {
        patientId = await getPatientId(userId, userEmail);
        if (!patientId) {
          console.log('Warning: Could not find patient_id for user, replying as anonymous');
        }
      }
      
      const replyId = uuidv4();
      
      // Create the reply
      await db.query(`
        INSERT INTO forum_replies (
          reply_id, post_id, patient_id, content, is_anonymous, status, created_at
        )
        VALUES (?, ?, ?, ?, ?, 'pending', NOW())
      `, [replyId, postId, patientId, content, is_anonymous]);
      
      // Update reply count
      await db.query(`
        UPDATE forum_posts SET reply_count = reply_count + 1, updated_at = NOW() WHERE post_id = ?
      `, [postId]);
      
      console.log(`[API] Reply created with ID: ${replyId}`);
      
      // Log audit entry
      await logAudit({
        user_id: userId,
        user_name: req.user.full_name || req.user.username,
        user_role: req.user.role,
        action: 'CREATE',
        module: 'Forum',
        entity_type: 'forum_reply',
        entity_id: replyId,
        record_id: replyId,
        new_value: {
          post_id: postId,
          content: content.substring(0, 100) + '...',
          is_anonymous
        },
        change_summary: `New reply added to post ${postId}`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'] || 'unknown',
        status: 'success',
      });
      
      res.status(201).json({
        success: true,
        message: 'Reply created successfully and is pending moderation',
        replyId
      });
    } catch (error) {
      console.error('[API] Error creating reply:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to create reply',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Legacy endpoint: GET /api/forum/threads (for backward compatibility)
// Maps to posts endpoint
router.get('/threads', async (req, res) => {
  try {
    console.log('[API] GET /api/forum/threads - Redirecting to posts');
    const { category, status, limit = 50, offset = 0 } = req.query;
    
    // First, check if the new forum tables exist
    try {
      const [tableCheck] = await db.query(`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name IN ('forum_categories', 'forum_posts')
      `);
      
      if (tableCheck[0].count < 2) {
        console.error('[API] Forum tables do not exist. Please run the migration.');
        return res.status(500).json({
          success: false,
          message: 'Forum tables not found. Please run the migration: backend/migrations/create_forum_tables.sql',
          error: 'Tables missing'
        });
      }
    } catch (checkError) {
      console.error('[API] Error checking tables:', checkError.message);
    }
    
    // Default to showing both approved and pending posts (for development/testing)
    // In production, you might want to default to 'approved' only
    // Map category code to category_id if needed
    let category_id = null;
    if (category && category !== 'all') {
      try {
        const [categories] = await db.query(
          'SELECT category_id FROM forum_categories WHERE category_code = ? AND is_active = true',
          [category]
        );
        if (categories.length > 0) {
          category_id = categories[0].category_id;
        }
      } catch (catError) {
        console.error('[API] Error fetching category:', catError.message);
      }
    }
    
    // Build query similar to posts endpoint
    // Show both approved and pending by default, or use specified status
    const statusParams = status ? [status] : ['approved', 'pending'];
    const statusWhere = status ? 'p.status = ?' : 'p.status IN (?, ?)';
    
    // Check which columns exist to handle both old and new table structures
    let hasCategoryId = false;
    let hasPatientId = false;
    let hasTitle = false;
    let hasStatus = false;
    
    try {
      const [columns] = await db.query(`
        SELECT COLUMN_NAME 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'forum_posts'
      `);
      
      const columnNames = columns.map(col => col.COLUMN_NAME);
      hasCategoryId = columnNames.includes('category_id');
      hasPatientId = columnNames.includes('patient_id');
      hasTitle = columnNames.includes('title');
      hasStatus = columnNames.includes('status');
      
      console.log('[API] Forum columns detected:', { hasCategoryId, hasPatientId, hasTitle, hasStatus });
    } catch (colErr) {
      console.error('[API] Error checking columns:', colErr.message);
    }
    
    // Build query based on available columns
    let query = `
      SELECT 
        p.post_id as topic_id,
        p.post_id,
        ${hasTitle ? 'COALESCE(p.title, "")' : '""'} as title,
        COALESCE(p.content, '') as description,
        COALESCE(p.reply_count, 0) as post_count,
        COALESCE(p.view_count, 0) as views,
        COALESCE(p.is_pinned, 0) as is_pinned,
        COALESCE(p.is_locked, 0) as is_locked,
        ${hasStatus ? 'COALESCE(p.status, "approved")' : '"approved"'} as status,
        COALESCE(p.is_anonymous, 1) as is_anonymous,
        ${hasPatientId ? 'p.patient_id' : 'NULL as patient_id'},
        p.created_at,
        COALESCE(p.updated_at, p.created_at) as last_post_at`;
    
    // Add category join if category_id exists, otherwise use default
    if (hasCategoryId) {
      query += `,
        COALESCE(c.category_code, 'general') as category,
        COALESCE(c.category_name, 'General') as category_name`;
    } else {
      query += `,
        'general' as category,
        'General' as category_name`;
    }
    
    // Add author info
    if (hasPatientId) {
      query += `,
        CASE 
          WHEN COALESCE(p.is_anonymous, 1) = 1 THEN 'Anonymous User'
          WHEN p.patient_id IS NULL THEN 'Anonymous User'
          ELSE COALESCE(CONCAT(pat.first_name, ' ', pat.last_name), u.full_name, u.username, 'Anonymous User')
        END as username,
        CASE 
          WHEN COALESCE(p.is_anonymous, 1) = 1 THEN NULL
          WHEN p.patient_id IS NULL THEN NULL
          ELSE u.profile_image
        END as profile_image,
        CASE 
          WHEN COALESCE(p.is_anonymous, 1) = 1 THEN 'Anonymous User'
          WHEN p.patient_id IS NULL THEN 'Anonymous User'
          ELSE COALESCE(CONCAT(pat.first_name, ' ', pat.last_name), u.full_name, u.username, 'Anonymous User')
        END as full_name,
        pat.created_by as author_id`;
    } else {
      // Use old structure with author_id
      query += `,
        COALESCE(u.full_name, u.username, 'Anonymous User') as username,
        u.profile_image,
        COALESCE(u.full_name, u.username, 'Anonymous User') as full_name,
        p.author_id`;
    }
    
    query += `
      FROM forum_posts p`;
    
    // Add joins based on available columns
    if (hasCategoryId) {
      query += ` LEFT JOIN forum_categories c ON p.category_id = c.category_id`;
    }
    
    if (hasPatientId) {
      query += ` LEFT JOIN patients pat ON p.patient_id = pat.patient_id
        LEFT JOIN users u ON pat.created_by = u.user_id`;
    } else {
      // Old structure: join directly to users via author_id
      query += ` LEFT JOIN users u ON p.author_id = u.user_id`;
    }
    
    query += ` WHERE 1=1`;
    
    const params = [];
    
    // Only filter by status if status column exists (check by trying to use it)
    // For now, we'll check if status column exists by wrapping in a subquery
    // If status doesn't exist, we'll just get all posts
    try {
      // Check if status column exists
      const [colCheck] = await db.query(`
        SELECT COUNT(*) as exists_col 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'forum_posts' 
        AND COLUMN_NAME = 'status'
      `);
      
      if (colCheck[0].exists_col > 0) {
        // Status column exists, use it
        query += ' AND COALESCE(p.status, "approved") IN (';
        statusParams.forEach((_, idx) => {
          query += idx > 0 ? ', ?' : '?';
          params.push(statusParams[idx]);
        });
        query += ')';
      } else {
        // Status column doesn't exist, get all posts (they're all "approved" by default)
        console.log('[API] Status column not found, returning all posts');
      }
    } catch (checkErr) {
      console.error('[API] Error checking status column:', checkErr.message);
      // Continue without status filter
    }
    
    if (category_id && hasCategoryId) {
      query += ' AND p.category_id = ?';
      params.push(category_id);
    }
    
    // Order by is_pinned if it exists, otherwise just by created_at
    query += ' ORDER BY COALESCE(p.is_pinned, 0) DESC, p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    console.log('[API] Executing query:', query.substring(0, 200) + '...');
    console.log('[API] Query params:', params);
    
    const [threads] = await db.query(query, params);
    
    console.log(`[API] Found ${threads.length} threads`);
    
    // Format as threads (for backward compatibility)
    const formattedThreads = threads.map(thread => ({
      ...thread,
      tags: [] // Empty tags for now
    }));
    
    res.json({
      success: true,
      threads: formattedThreads
    });
  } catch (error) {
    console.error('[API] Error fetching threads:', error.message);
    console.error('[API] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch threads',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Legacy endpoint: GET /api/forum/threads/:threadId (for backward compatibility)
router.get('/threads/:threadId', authenticateToken, async (req, res) => {
  try {
    const { threadId } = req.params;
    console.log(`[API] GET /api/forum/threads/${threadId} - Fetching thread details (legacy)`);
    
    // Get post details (using postId as threadId)
    const [postDetails] = await db.query(`
      SELECT 
        p.post_id,
        p.title,
        p.content,
        p.is_anonymous,
        p.reply_count,
        p.view_count,
        p.is_pinned,
        p.is_locked,
        p.status,
        p.patient_id,
        p.created_at,
        p.updated_at,
        c.category_id,
        c.category_name,
        c.category_code,
        c.icon as category_icon,
        CASE 
          WHEN p.is_anonymous = true THEN 'Anonymous User'
          ELSE COALESCE(CONCAT(pat.first_name, ' ', pat.last_name), u.full_name, u.username)
        END as author_name,
        CASE 
          WHEN p.is_anonymous = true THEN NULL
          ELSE u.profile_image
        END as author_image,
        pat.created_by as author_id
      FROM forum_posts p
      INNER JOIN forum_categories c ON p.category_id = c.category_id
      LEFT JOIN patients pat ON p.patient_id = pat.patient_id
      LEFT JOIN users u ON pat.created_by = u.user_id
      WHERE p.post_id = ? AND p.status = 'approved'
    `, [threadId]);
    
    if (postDetails.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Thread not found'
      });
    }
    
    const post = postDetails[0];
    
    // Get replies
    const [replies] = await db.query(`
      SELECT 
        r.reply_id,
        r.content,
        r.is_anonymous,
        r.status,
        r.created_at,
        CASE 
          WHEN r.is_anonymous = true THEN 'Anonymous User'
          ELSE COALESCE(CONCAT(pat.first_name, ' ', pat.last_name), u.full_name, u.username)
        END as author_name,
        CASE 
          WHEN r.is_anonymous = true THEN NULL
          ELSE u.profile_image
        END as author_image
      FROM forum_replies r
      LEFT JOIN patients pat ON r.patient_id = pat.patient_id
      LEFT JOIN users u ON pat.created_by = u.user_id
      WHERE r.post_id = ? AND r.status = 'approved'
      ORDER BY r.created_at ASC
    `, [threadId]);
    
    // Update view count
    await db.query(`
      UPDATE forum_posts SET view_count = view_count + 1 WHERE post_id = ?
    `, [threadId]);
    
    // Transform to thread format for backward compatibility
    res.json({
      success: true,
      thread: {
        topic_id: post.post_id,
        post_id: post.post_id,
        title: post.title,
        description: post.content,
        category: post.category_code,
        created_at: post.created_at,
        username: post.author_name,
        full_name: post.author_name,
        profile_image: post.author_image,
        is_pinned: post.is_pinned,
        is_locked: post.is_locked,
        status: post.status,
        author_id: post.author_id
      },
      posts: replies.map(reply => ({
        post_id: reply.reply_id || reply.post_id,
        reply_id: reply.reply_id,
        content: reply.content,
        created_at: reply.created_at,
        username: reply.author_name,
        full_name: reply.author_name,
        profile_image: reply.author_image,
        author_id: reply.author_id,
        reactions: {},
        user_reactions: []
      }))
    });
  } catch (error) {
    console.error('[API] Error fetching thread:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch thread',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Legacy endpoint: POST /api/forum/threads (for backward compatibility)
router.post('/threads', 
  authenticateToken,
  [
    body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
    body('content').trim().isLength({ min: 10, max: 5000 }).withMessage('Content must be 10-5000 characters'),
    body('category').optional().isIn(['general', 'health', 'art', 'support', 'announcement']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    try {
      const { title, content, category = 'general', tags } = req.body;
      
      // Get category_id from category code
      const [categories] = await db.query(
        'SELECT category_id FROM forum_categories WHERE category_code = ? AND is_active = true',
        [category]
      );
      
      if (categories.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category'
        });
      }
      
      const category_id = categories[0].category_id;
      
      // Create post directly (reuse logic from posts endpoint)
      const userId = req.user.user_id;
      const userEmail = req.user.email;
      
      // Get patient_id if not anonymous
      let patientId = null;
      const is_anonymous = req.body.is_anonymous !== false; // Default to true
      if (!is_anonymous) {
        patientId = await getPatientId(userId, userEmail);
      }
      
      const postId = uuidv4();
      
      // Create the post
      await db.query(`
        INSERT INTO forum_posts (
          post_id, patient_id, category_id, title, content, 
          is_anonymous, status, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())
      `, [postId, patientId, category_id, title, content, is_anonymous]);
      
      // Log audit entry
      await logAudit({
        user_id: userId,
        user_name: req.user.full_name || req.user.username,
        user_role: req.user.role,
        action: 'CREATE',
        module: 'Forum',
        entity_type: 'forum_post',
        entity_id: postId,
        record_id: postId,
        new_value: {
          title: title.substring(0, 100),
          category_id,
          is_anonymous
        },
        change_summary: `New forum post created: ${title.substring(0, 50)}...`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'] || 'unknown',
        status: 'success',
      });
      
      res.status(201).json({
        success: true,
        message: 'Thread created successfully and is pending moderation',
        threadId: postId
      });
    } catch (error) {
      console.error('[API] Error creating thread:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to create thread',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Legacy endpoint: POST /api/forum/threads/:threadId/posts (for backward compatibility)
router.post('/threads/:threadId/posts', 
  authenticateToken,
  [
    body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Content must be 1-2000 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    try {
      const { threadId } = req.params;
      
      const { content, parentPostId } = req.body;
      const userId = req.user.user_id;
      const userEmail = req.user.email;
      
      // Verify post exists and is not locked
      const [postCheck] = await db.query(`
        SELECT post_id, is_locked, status FROM forum_posts 
        WHERE post_id = ? AND status = 'approved'
      `, [threadId]);
      
      if (postCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Post not found or not approved'
        });
      }
      
      if (postCheck[0].is_locked) {
        return res.status(403).json({
          success: false,
          message: 'Post is locked and cannot receive replies'
        });
      }
      
      // Get patient_id if not anonymous
      let patientId = null;
      const is_anonymous = req.body.is_anonymous !== false; // Default to true
      if (!is_anonymous) {
        patientId = await getPatientId(userId, userEmail);
      }
      
      const replyId = uuidv4();
      
      // Create the reply
      await db.query(`
        INSERT INTO forum_replies (
          reply_id, post_id, patient_id, content, is_anonymous, status, created_at
        )
        VALUES (?, ?, ?, ?, ?, 'pending', NOW())
      `, [replyId, threadId, patientId, content, is_anonymous]);
      
      // Update reply count
      await db.query(`
        UPDATE forum_posts SET reply_count = reply_count + 1, updated_at = NOW() WHERE post_id = ?
      `, [threadId]);
      
      // Log audit entry
      await logAudit({
        user_id: userId,
        user_name: req.user.full_name || req.user.username,
        user_role: req.user.role,
        action: 'CREATE',
        module: 'Forum',
        entity_type: 'forum_reply',
        entity_id: replyId,
        record_id: replyId,
        new_value: {
          post_id: threadId,
          content: content.substring(0, 100) + '...',
          is_anonymous
        },
        change_summary: `New reply added to post ${threadId}`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'] || 'unknown',
        status: 'success',
      });
      
      res.status(201).json({
        success: true,
        message: 'Post added successfully and is pending moderation',
        postId: replyId
      });
    } catch (error) {
      console.error('[API] Error adding post:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to add post',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// POST /api/forum/posts/:postId/reactions - Add or remove a reaction (simplified, reactions table may not exist)
router.post('/posts/:postId/reactions', 
  authenticateToken,
  [
    body('reactionType').isIn(['like', 'love']).withMessage('Invalid reaction type'),
  ],
  async (req, res) => {
    // For now, return success but don't actually store reactions
    // This can be implemented later if forum_reactions table exists
    res.json({
      success: true,
      message: 'Reaction updated successfully',
      action: 'added'
    });
  }
);

// ==================== ADMIN MODERATION ENDPOINTS ====================

// PUT /api/forum/posts/:postId/approve - Approve a pending post (Admin only)
router.put('/posts/:postId/approve', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { postId } = req.params;
    console.log(`[API] Approving post ${postId} by admin ${req.user.user_id}`);

    // Check if post exists
    const [posts] = await db.query(
      'SELECT post_id, status FROM forum_posts WHERE post_id = ?',
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Update post status
    await db.query(
      'UPDATE forum_posts SET status = ?, updated_at = NOW() WHERE post_id = ?',
      ['approved', postId]
    );

    // Log audit entry
    await logAudit({
      user_id: req.user.user_id,
      user_name: req.user.full_name || req.user.username,
      user_role: req.user.role,
      action: 'UPDATE',
      module: 'Forum',
      entity_type: 'forum_post',
      entity_id: postId,
      record_id: postId,
      new_value: { status: 'approved' },
      change_summary: `Post ${postId} approved by admin`,
      ip_address: getClientIp(req),
      user_agent: req.headers['user-agent'] || 'unknown',
      status: 'success',
    });

    res.json({
      success: true,
      message: 'Post approved successfully'
    });
  } catch (error) {
    console.error('[API] Error approving post:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to approve post',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/forum/posts/:postId/reject - Reject a pending post (Admin only)
router.put('/posts/:postId/reject', 
  authenticateToken,
  [
    body('reason').optional().trim().isLength({ max: 500 }),
  ],
  async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const { postId } = req.params;
      const { reason } = req.body;
      console.log(`[API] Rejecting post ${postId} by admin ${req.user.user_id}`);

      // Check if post exists
      const [posts] = await db.query(
        'SELECT post_id, status FROM forum_posts WHERE post_id = ?',
        [postId]
      );

      if (posts.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }

      // Update post status
      await db.query(
        'UPDATE forum_posts SET status = ?, updated_at = NOW() WHERE post_id = ?',
        ['rejected', postId]
      );

      // Log audit entry
      await logAudit({
        user_id: req.user.user_id,
        user_name: req.user.full_name || req.user.username,
        user_role: req.user.role,
        action: 'UPDATE',
        module: 'Forum',
        entity_type: 'forum_post',
        entity_id: postId,
        record_id: postId,
        new_value: { status: 'rejected', reason },
        change_summary: `Post ${postId} rejected by admin${reason ? ': ' + reason : ''}`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'] || 'unknown',
        status: 'success',
      });

      res.json({
        success: true,
        message: 'Post rejected successfully'
      });
    } catch (error) {
      console.error('[API] Error rejecting post:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to reject post',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// PUT /api/forum/replies/:replyId/approve - Approve a pending reply (Admin only)
router.put('/replies/:replyId/approve', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { replyId } = req.params;
    console.log(`[API] Approving reply ${replyId} by admin ${req.user.user_id}`);

    // Check if reply exists
    const [replies] = await db.query(
      'SELECT reply_id, post_id, status FROM forum_replies WHERE reply_id = ?',
      [replyId]
    );

    if (replies.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reply not found'
      });
    }

    // Update reply status
    await db.query(
      'UPDATE forum_replies SET status = ? WHERE reply_id = ?',
      ['approved', replyId]
    );

    // Log audit entry
    await logAudit({
      user_id: req.user.user_id,
      user_name: req.user.full_name || req.user.username,
      user_role: req.user.role,
      action: 'UPDATE',
      module: 'Forum',
      entity_type: 'forum_reply',
      entity_id: replyId,
      record_id: replyId,
      new_value: { status: 'approved' },
      change_summary: `Reply ${replyId} approved by admin`,
      ip_address: getClientIp(req),
      user_agent: req.headers['user-agent'] || 'unknown',
      status: 'success',
    });

    res.json({
      success: true,
      message: 'Reply approved successfully'
    });
  } catch (error) {
    console.error('[API] Error approving reply:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to approve reply',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/forum/replies/:replyId/reject - Reject a pending reply (Admin only)
router.put('/replies/:replyId/reject', 
  authenticateToken,
  [
    body('reason').optional().trim().isLength({ max: 500 }),
  ],
  async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const { replyId } = req.params;
      const { reason } = req.body;
      console.log(`[API] Rejecting reply ${replyId} by admin ${req.user.user_id}`);

      // Check if reply exists
      const [replies] = await db.query(
        'SELECT reply_id, status FROM forum_replies WHERE reply_id = ?',
        [replyId]
      );

      if (replies.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Reply not found'
        });
      }

      // Update reply status
      await db.query(
        'UPDATE forum_replies SET status = ? WHERE reply_id = ?',
        ['rejected', replyId]
      );

      // Log audit entry
      await logAudit({
        user_id: req.user.user_id,
        user_name: req.user.full_name || req.user.username,
        user_role: req.user.role,
        action: 'UPDATE',
        module: 'Forum',
        entity_type: 'forum_reply',
        entity_id: replyId,
        record_id: replyId,
        new_value: { status: 'rejected', reason },
        change_summary: `Reply ${replyId} rejected by admin${reason ? ': ' + reason : ''}`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'] || 'unknown',
        status: 'success',
      });

      res.json({
        success: true,
        message: 'Reply rejected successfully'
      });
    } catch (error) {
      console.error('[API] Error rejecting reply:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to reject reply',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// ==================== POST MANAGEMENT ENDPOINTS ====================

// PUT /api/forum/posts/:postId - Update a post
router.put('/posts/:postId',
  authenticateToken,
  [
    body('title').optional().trim().isLength({ min: 3, max: 200 }),
    body('content').optional().trim().isLength({ min: 10, max: 5000 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    try {
      const { postId } = req.params;
      const { title, content } = req.body;
      const userId = req.user.user_id;

      // Check if post exists and user has permission
      const [posts] = await db.query(`
        SELECT p.*, pat.created_by as patient_created_by
        FROM forum_posts p
        LEFT JOIN patients pat ON p.patient_id = pat.patient_id
        WHERE p.post_id = ?
      `, [postId]);

      if (posts.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }

      const post = posts[0];
      const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
      const isOwner = post.patient_id && post.patient_created_by === userId;

      // Only admin or post owner can update
      if (!isAdmin && !isOwner) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this post'
        });
      }

      // Build update query
      const updates = [];
      const params = [];

      if (title) {
        updates.push('title = ?');
        params.push(title);
      }
      if (content) {
        updates.push('content = ?');
        params.push(content);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update'
        });
      }

      updates.push('updated_at = NOW()');
      params.push(postId);

      await db.query(
        `UPDATE forum_posts SET ${updates.join(', ')} WHERE post_id = ?`,
        params
      );

      // Log audit entry
      await logAudit({
        user_id: userId,
        user_name: req.user.full_name || req.user.username,
        user_role: req.user.role,
        action: 'UPDATE',
        module: 'Forum',
        entity_type: 'forum_post',
        entity_id: postId,
        record_id: postId,
        new_value: { title, content: content ? content.substring(0, 100) + '...' : undefined },
        change_summary: `Post ${postId} updated`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'] || 'unknown',
        status: 'success',
      });

      res.json({
        success: true,
        message: 'Post updated successfully'
      });
    } catch (error) {
      console.error('[API] Error updating post:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to update post',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// DELETE /api/forum/posts/:postId - Delete a post
router.delete('/posts/:postId', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.user_id;

    // Check if post exists and user has permission
    const [posts] = await db.query(`
      SELECT p.*, pat.created_by as patient_created_by
      FROM forum_posts p
      LEFT JOIN patients pat ON p.patient_id = pat.patient_id
      WHERE p.post_id = ?
    `, [postId]);

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const post = posts[0];
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
    const isOwner = post.patient_id && post.patient_created_by === userId;

    // Only admin or post owner can delete
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this post'
      });
    }

    // Delete post (cascade will handle replies)
    await db.query('DELETE FROM forum_posts WHERE post_id = ?', [postId]);

    // Log audit entry
    await logAudit({
      user_id: userId,
      user_name: req.user.full_name || req.user.username,
      user_role: req.user.role,
      action: 'DELETE',
      module: 'Forum',
      entity_type: 'forum_post',
      entity_id: postId,
      record_id: postId,
      old_value: {
        title: post.title,
        content: post.content ? post.content.substring(0, 100) + '...' : ''
      },
      change_summary: `Post ${postId} deleted`,
      ip_address: getClientIp(req),
      user_agent: req.headers['user-agent'] || 'unknown',
      status: 'success',
    });

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('[API] Error deleting post:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/forum/posts/:postId/pin - Pin/unpin a post (Admin only)
router.put('/posts/:postId/pin', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { postId } = req.params;
    const { is_pinned } = req.body;

    // Check if post exists
    const [posts] = await db.query(
      'SELECT post_id, is_pinned FROM forum_posts WHERE post_id = ?',
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Update pin status
    await db.query(
      'UPDATE forum_posts SET is_pinned = ?, updated_at = NOW() WHERE post_id = ?',
      [is_pinned ? 1 : 0, postId]
    );

    // Log audit entry
    await logAudit({
      user_id: req.user.user_id,
      user_name: req.user.full_name || req.user.username,
      user_role: req.user.role,
      action: 'UPDATE',
      module: 'Forum',
      entity_type: 'forum_post',
      entity_id: postId,
      record_id: postId,
      new_value: { is_pinned: is_pinned ? true : false },
      change_summary: `Post ${postId} ${is_pinned ? 'pinned' : 'unpinned'}`,
      ip_address: getClientIp(req),
      user_agent: req.headers['user-agent'] || 'unknown',
      status: 'success',
    });

    res.json({
      success: true,
      message: `Post ${is_pinned ? 'pinned' : 'unpinned'} successfully`
    });
  } catch (error) {
    console.error('[API] Error pinning/unpinning post:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update pin status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/forum/posts/:postId/lock - Lock/unlock a post (Admin only)
router.put('/posts/:postId/lock', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { postId } = req.params;
    const { is_locked } = req.body;

    // Check if post exists
    const [posts] = await db.query(
      'SELECT post_id, is_locked FROM forum_posts WHERE post_id = ?',
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Update lock status
    await db.query(
      'UPDATE forum_posts SET is_locked = ?, updated_at = NOW() WHERE post_id = ?',
      [is_locked ? 1 : 0, postId]
    );

    // Log audit entry
    await logAudit({
      user_id: req.user.user_id,
      user_name: req.user.full_name || req.user.username,
      user_role: req.user.role,
      action: 'UPDATE',
      module: 'Forum',
      entity_type: 'forum_post',
      entity_id: postId,
      record_id: postId,
      new_value: { is_locked: is_locked ? true : false },
      change_summary: `Post ${postId} ${is_locked ? 'locked' : 'unlocked'}`,
      ip_address: getClientIp(req),
      user_agent: req.headers['user-agent'] || 'unknown',
      status: 'success',
    });

    res.json({
      success: true,
      message: `Post ${is_locked ? 'locked' : 'unlocked'} successfully`
    });
  } catch (error) {
    console.error('[API] Error locking/unlocking post:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update lock status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== REPLY MANAGEMENT ENDPOINTS ====================

// PUT /api/forum/replies/:replyId - Update a reply
router.put('/replies/:replyId',
  authenticateToken,
  [
    body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Content must be 1-2000 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    try {
      const { replyId } = req.params;
      const { content } = req.body;
      const userId = req.user.user_id;

      // Check if reply exists and user has permission
      const [replies] = await db.query(`
        SELECT r.*, pat.created_by as patient_created_by
        FROM forum_replies r
        LEFT JOIN patients pat ON r.patient_id = pat.patient_id
        WHERE r.reply_id = ?
      `, [replyId]);

      if (replies.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Reply not found'
        });
      }

      const reply = replies[0];
      const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
      const isOwner = reply.patient_id && reply.patient_created_by === userId;

      // Only admin or reply owner can update
      if (!isAdmin && !isOwner) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this reply'
        });
      }

      // Update reply
      await db.query(
        'UPDATE forum_replies SET content = ? WHERE reply_id = ?',
        [content, replyId]
      );

      // Log audit entry
      await logAudit({
        user_id: userId,
        user_name: req.user.full_name || req.user.username,
        user_role: req.user.role,
        action: 'UPDATE',
        module: 'Forum',
        entity_type: 'forum_reply',
        entity_id: replyId,
        record_id: replyId,
        new_value: { content: content.substring(0, 100) + '...' },
        change_summary: `Reply ${replyId} updated`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'] || 'unknown',
        status: 'success',
      });

      res.json({
        success: true,
        message: 'Reply updated successfully'
      });
    } catch (error) {
      console.error('[API] Error updating reply:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to update reply',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// DELETE /api/forum/replies/:replyId - Delete a reply
router.delete('/replies/:replyId', authenticateToken, async (req, res) => {
  try {
    const { replyId } = req.params;
    const userId = req.user.user_id;

    // Check if reply exists and user has permission
    const [replies] = await db.query(`
      SELECT r.*, pat.created_by as patient_created_by, r.post_id
      FROM forum_replies r
      LEFT JOIN patients pat ON r.patient_id = pat.patient_id
      WHERE r.reply_id = ?
    `, [replyId]);

    if (replies.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reply not found'
      });
    }

    const reply = replies[0];
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
    const isOwner = reply.patient_id && reply.patient_created_by === userId;

    // Only admin or reply owner can delete
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this reply'
      });
    }

    // Delete reply
    await db.query('DELETE FROM forum_replies WHERE reply_id = ?', [replyId]);

    // Update reply count on post
    await db.query(`
      UPDATE forum_posts 
      SET reply_count = GREATEST(0, reply_count - 1), updated_at = NOW() 
      WHERE post_id = ?
    `, [reply.post_id]);

    // Log audit entry
    await logAudit({
      user_id: userId,
      user_name: req.user.full_name || req.user.username,
      user_role: req.user.role,
      action: 'DELETE',
      module: 'Forum',
      entity_type: 'forum_reply',
      entity_id: replyId,
      record_id: replyId,
      old_value: {
        content: reply.content ? reply.content.substring(0, 100) + '...' : ''
      },
      change_summary: `Reply ${replyId} deleted`,
      ip_address: getClientIp(req),
      user_agent: req.headers['user-agent'] || 'unknown',
      status: 'success',
    });

    res.json({
      success: true,
      message: 'Reply deleted successfully'
    });
  } catch (error) {
    console.error('[API] Error deleting reply:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete reply',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== CATEGORY MANAGEMENT ENDPOINTS (Admin) ====================

// POST /api/forum/categories - Create a new category (Admin only)
router.post('/categories',
  authenticateToken,
  [
    body('category_name').trim().isLength({ min: 3, max: 100 }).withMessage('Category name must be 3-100 characters'),
    body('category_code').trim().isLength({ min: 2, max: 50 }).withMessage('Category code must be 2-50 characters'),
    body('description').optional().trim().isLength({ max: 500 }),
    body('icon').optional().trim().isLength({ max: 10 }),
  ],
  async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    try {
      const { category_name, category_code, description, icon } = req.body;
      const categoryId = uuidv4();

      // Check if category_code already exists
      const [existing] = await db.query(
        'SELECT category_id FROM forum_categories WHERE category_code = ?',
        [category_code]
      );

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Category code already exists'
        });
      }

      // Create category
      await db.query(`
        INSERT INTO forum_categories (category_id, category_name, category_code, description, icon, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, 1, NOW())
      `, [categoryId, category_name, category_code, description || null, icon || null]);

      // Log audit entry
      await logAudit({
        user_id: req.user.user_id,
        user_name: req.user.full_name || req.user.username,
        user_role: req.user.role,
        action: 'CREATE',
        module: 'Forum',
        entity_type: 'forum_category',
        entity_id: categoryId,
        record_id: category_code,
        new_value: { category_name, category_code, description, icon },
        change_summary: `New category created: ${category_name}`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'] || 'unknown',
        status: 'success',
      });

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        category_id: categoryId
      });
    } catch (error) {
      console.error('[API] Error creating category:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to create category',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// PUT /api/forum/categories/:categoryId - Update a category (Admin only)
router.put('/categories/:categoryId',
  authenticateToken,
  [
    body('category_name').optional().trim().isLength({ min: 3, max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('icon').optional().trim().isLength({ max: 10 }),
    body('is_active').optional().isBoolean(),
  ],
  async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    try {
      const { categoryId } = req.params;
      const { category_name, description, icon, is_active } = req.body;

      // Check if category exists
      const [categories] = await db.query(
        'SELECT * FROM forum_categories WHERE category_id = ?',
        [categoryId]
      );

      if (categories.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      // Build update query
      const updates = [];
      const params = [];

      if (category_name) {
        updates.push('category_name = ?');
        params.push(category_name);
      }
      if (description !== undefined) {
        updates.push('description = ?');
        params.push(description);
      }
      if (icon !== undefined) {
        updates.push('icon = ?');
        params.push(icon);
      }
      if (is_active !== undefined) {
        updates.push('is_active = ?');
        params.push(is_active ? 1 : 0);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update'
        });
      }

      params.push(categoryId);

      await db.query(
        `UPDATE forum_categories SET ${updates.join(', ')} WHERE category_id = ?`,
        params
      );

      // Log audit entry
      await logAudit({
        user_id: req.user.user_id,
        user_name: req.user.full_name || req.user.username,
        user_role: req.user.role,
        action: 'UPDATE',
        module: 'Forum',
        entity_type: 'forum_category',
        entity_id: categoryId,
        record_id: categories[0].category_code,
        new_value: { category_name, description, icon, is_active },
        change_summary: `Category ${categoryId} updated`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'] || 'unknown',
        status: 'success',
      });

      res.json({
        success: true,
        message: 'Category updated successfully'
      });
    } catch (error) {
      console.error('[API] Error updating category:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to update category',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// DELETE /api/forum/categories/:categoryId - Delete a category (Admin only)
router.delete('/categories/:categoryId', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { categoryId } = req.params;

    // Check if category exists
    const [categories] = await db.query(
      'SELECT * FROM forum_categories WHERE category_id = ?',
      [categoryId]
    );

    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has posts
    const [posts] = await db.query(
      'SELECT COUNT(*) as count FROM forum_posts WHERE category_id = ?',
      [categoryId]
    );

    if (posts[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing posts. Deactivate it instead.'
      });
    }

    // Delete category
    await db.query('DELETE FROM forum_categories WHERE category_id = ?', [categoryId]);

    // Log audit entry
    await logAudit({
      user_id: req.user.user_id,
      user_name: req.user.full_name || req.user.username,
      user_role: req.user.role,
      action: 'DELETE',
      module: 'Forum',
      entity_type: 'forum_category',
      entity_id: categoryId,
      record_id: categories[0].category_code,
      old_value: {
        category_name: categories[0].category_name,
        category_code: categories[0].category_code
      },
      change_summary: `Category ${categoryId} deleted`,
      ip_address: getClientIp(req),
      user_agent: req.headers['user-agent'] || 'unknown',
      status: 'success',
    });

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('[API] Error deleting category:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/forum/pending - Get pending posts and replies for moderation (Admin only)
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const [pendingPosts] = await db.query(`
      SELECT 
        p.post_id,
        p.title,
        p.content,
        p.created_at,
        c.category_name,
        CASE 
          WHEN p.is_anonymous = true THEN 'Anonymous User'
          ELSE COALESCE(CONCAT(pat.first_name, ' ', pat.last_name), u.full_name, u.username)
        END as author_name
      FROM forum_posts p
      INNER JOIN forum_categories c ON p.category_id = c.category_id
      LEFT JOIN patients pat ON p.patient_id = pat.patient_id
      LEFT JOIN users u ON pat.created_by = u.user_id
      WHERE p.status = 'pending'
      ORDER BY p.created_at DESC
    `);

    const [pendingReplies] = await db.query(`
      SELECT 
        r.reply_id,
        r.content,
        r.created_at,
        p.title as post_title,
        p.post_id,
        CASE 
          WHEN r.is_anonymous = true THEN 'Anonymous User'
          ELSE COALESCE(CONCAT(pat.first_name, ' ', pat.last_name), u.full_name, u.username)
        END as author_name
      FROM forum_replies r
      INNER JOIN forum_posts p ON r.post_id = p.post_id
      LEFT JOIN patients pat ON r.patient_id = pat.patient_id
      LEFT JOIN users u ON pat.created_by = u.user_id
      WHERE r.status = 'pending'
      ORDER BY r.created_at DESC
    `);

    res.json({
      success: true,
      pending_posts: pendingPosts,
      pending_replies: pendingReplies
    });
  } catch (error) {
    console.error('[API] Error fetching pending items:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending items',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
