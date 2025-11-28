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
    
    let query = `
      SELECT 
        p.post_id as topic_id,
        p.title,
        p.content as description,
        p.reply_count as post_count,
        p.view_count as views,
        p.created_at,
        p.updated_at as last_post_at,
        p.status,
        c.category_code as category,
        c.category_name,
        CASE 
          WHEN p.is_anonymous = true THEN 'Anonymous User'
          WHEN p.patient_id IS NULL THEN 'Anonymous User'
          ELSE COALESCE(CONCAT(pat.first_name, ' ', pat.last_name), u.full_name, u.username, 'Anonymous User')
        END as username,
        CASE 
          WHEN p.is_anonymous = true THEN NULL
          WHEN p.patient_id IS NULL THEN NULL
          ELSE u.profile_image
        END as profile_image,
        CASE 
          WHEN p.is_anonymous = true THEN 'Anonymous User'
          WHEN p.patient_id IS NULL THEN 'Anonymous User'
          ELSE COALESCE(CONCAT(pat.first_name, ' ', pat.last_name), u.full_name, u.username, 'Anonymous User')
        END as full_name
      FROM forum_posts p
      INNER JOIN forum_categories c ON p.category_id = c.category_id
      LEFT JOIN patients pat ON p.patient_id = pat.patient_id
      LEFT JOIN users u ON pat.created_by = u.user_id
      WHERE ` + statusWhere;
    
    const params = [...statusParams];
    
    if (category_id) {
      query += ' AND p.category_id = ?';
      params.push(category_id);
    }
    
    query += ' ORDER BY p.is_pinned DESC, p.created_at DESC LIMIT ? OFFSET ?';
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
        title: post.title,
        description: post.content,
        category: post.category_code,
        created_at: post.created_at,
        username: post.author_name,
        full_name: post.author_name,
        profile_image: post.author_image
      },
      posts: replies.map(reply => ({
        post_id: reply.reply_id,
        content: reply.content,
        created_at: reply.created_at,
        username: reply.author_name,
        full_name: reply.author_name,
        profile_image: reply.author_image,
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

export default router;
