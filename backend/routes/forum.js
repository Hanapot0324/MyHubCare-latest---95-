// backend/routes/forum.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../db.js';
import { authenticateToken } from './auth.js';
import { logAudit, getClientIp } from '../utils/auditLogger.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all forum topics/threads
router.get('/threads', async (req, res) => {
  try {
    console.log('[API] GET /api/forum/threads - Fetching all threads');
    
    const query = `
      SELECT t.*, u.username, u.profile_image, u.full_name,
        (SELECT COUNT(*) FROM forum_posts p WHERE p.topic_id = t.topic_id) as post_count,
        (SELECT MAX(p.created_at) FROM forum_posts p WHERE p.topic_id = t.topic_id) as last_post_at,
        (SELECT COUNT(*) FROM forum_reactions r JOIN forum_posts p ON r.post_id = p.post_id WHERE p.topic_id = t.topic_id) as total_reactions
      FROM forum_topics t
      JOIN users u ON t.created_by = u.id
      WHERE t.status = 'open'
      ORDER BY t.last_post_at DESC, t.created_at DESC
    `;
    
    const [threads] = await db.query(query);
    
    // Parse tags from JSON for each thread
    const threadsWithTags = threads.map(thread => ({
      ...thread,
      tags: thread.tags ? JSON.parse(thread.tags) : []
    }));
    
    console.log(`[API] Successfully fetched ${threadsWithTags.length} threads`);
    res.json({
      success: true,
      threads: threadsWithTags
    });
  } catch (error) {
    console.error('[API] Error fetching forum threads:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch forum threads',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get a specific thread with all posts
router.get('/threads/:threadId', authenticateToken, async (req, res) => {
  try {
    const { threadId } = req.params;
    console.log(`[API] GET /api/forum/threads/${threadId} - Fetching thread details`);
    
    // Get thread details
    const [threadDetails] = await db.query(`
      SELECT t.*, u.username, u.profile_image, u.full_name
      FROM forum_topics t
      JOIN users u ON t.created_by = u.id
      WHERE t.topic_id = ? AND t.status = 'open'
    `, [threadId]);
    
    if (threadDetails.length === 0) {
      console.log(`[API] Thread not found with ID: ${threadId}`);
      return res.status(404).json({
        success: false,
        message: 'Thread not found'
      });
    }
    
    const thread = {
      ...threadDetails[0],
      tags: threadDetails[0].tags ? JSON.parse(threadDetails[0].tags) : []
    };
    
    // Get all posts in thread with reactions
    const [posts] = await db.query(`
      SELECT p.*, u.username, u.profile_image, u.full_name,
        (SELECT GROUP_CONCAT(r.reaction_type) FROM forum_reactions r WHERE r.post_id = p.post_id AND r.user_id = ?) as user_reactions
      FROM forum_posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.topic_id = ?
      ORDER BY p.created_at ASC
    `, [req.user ? req.user.id : null, threadId]);
    
    // Get reactions for each post
    for (const post of posts) {
      const [reactions] = await db.query(`
        SELECT reaction_type, COUNT(*) as count
        FROM forum_reactions
        WHERE post_id = ?
        GROUP BY reaction_type
      `, [post.post_id]);
      
      post.reactions = reactions.reduce((acc, reaction) => {
        acc[reaction.reaction_type] = reaction.count;
        return acc;
      }, {});
      
      post.user_reactions = post.user_reactions ? post.user_reactions.split(',') : [];
    }
    
    // Update view count
    await db.query(`
      UPDATE forum_topics SET views = views + 1 WHERE topic_id = ?
    `, [threadId]);
    
    console.log(`[API] Successfully fetched thread with ${posts.length} posts`);
    res.json({
      success: true,
      thread,
      posts
    });
  } catch (error) {
    console.error('[API] Error fetching thread details:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch thread details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create a new thread (all authenticated users)
router.post('/threads', 
  authenticateToken,
  [
    body('title').trim().isLength({ min: 3, max: 300 }).withMessage('Title must be 3-300 characters'),
    body('content').trim().isLength({ min: 10, max: 5000 }).withMessage('Content must be 10-5000 characters'),
    body('category').optional().isIn(['general', 'health', 'art', 'support', 'announcement']),
  ],
  async (req, res) => {
    // ... validation code ...

    try {
      const { title, content, category, tags } = req.body;
      const userId = req.user.id;
      
      console.log(`[API] Creating new thread: ${title} by user ${userId}`);
      
      const threadId = uuidv4();
      const postId = uuidv4();
      
      // FIX: Use 'forum_threads' instead of 'forum_topics'
      await db.query(`
        INSERT INTO forum_threads (thread_id, title, description, category, created_by, tags)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [threadId, title, content, category || 'general', userId, JSON.stringify(tags || [])]);
      
      // Create initial post
      await db.query(`
        INSERT INTO forum_posts (post_id, thread_id, author_id, content)
        VALUES (?, ?, ?, ?)
      `, [postId, threadId, userId, content]);
      
      // Update the last_post_at time
      await db.query(`
        UPDATE forum_threads SET last_post_at = NOW() WHERE thread_id = ?
      `, [threadId]);
      
      // ... rest of the code
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

// Add a post to a thread (all authenticated users)
router.post('/threads/:threadId/posts', 
  authenticateToken,
  [
    body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Content must be 1-2000 characters'),
  ],
  async (req, res) => {
    // Check for validation errors
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
      const { threadId } = req.params;
      const { content, parentPostId } = req.body;
      const userId = req.user.id;
      
      // Verify thread exists and is open
      const [threadCheck] = await db.query(`
        SELECT topic_id FROM forum_topics WHERE topic_id = ? AND status = 'open'
      `, [threadId]);
      
      if (threadCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Thread not found or closed'
        });
      }
      
      console.log(`[API] Adding post to thread ${threadId} by user ${userId}`);
      
      const postId = uuidv4();
      
      // Add the post
      await db.query(`
        INSERT INTO forum_posts (post_id, topic_id, author_id, content, parent_post_id)
        VALUES (?, ?, ?, ?, ?)
      `, [postId, threadId, userId, content, parentPostId || null]);
      
      // Update the last_post_at time
      await db.query(`
        UPDATE forum_topics SET last_post_at = NOW() WHERE topic_id = ?
      `, [threadId]);
      
      console.log(`[API] Post created with ID: ${postId}`);
      
      // Log audit entry
      await logAudit({
        user_id: req.user.id,
        user_name: req.user.full_name || req.user.username,
        user_role: req.user.role,
        action: 'CREATE',
        module: 'Forum',
        entity_type: 'forum_post',
        entity_id: postId,
        record_id: postId,
        new_value: {
          content: content.substring(0, 100) + '...',
          parent_post_id: parentPostId || null
        },
        change_summary: `New forum post added to thread ${threadId}`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'] || 'unknown',
        status: 'success',
      });
      
      res.status(201).json({
        success: true,
        message: 'Post added successfully',
        postId
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

// Add or remove a reaction to a post (all authenticated users)
router.post('/posts/:postId/reactions', 
  authenticateToken,
  [
    body('reactionType').isIn(['like', 'love', 'insightful', 'thankful', 'sad', 'angry'])
      .withMessage('Invalid reaction type'),
  ],
  async (req, res) => {
    // Check for validation errors
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
      const { reactionType } = req.body;
      const userId = req.user.id;
      
      // Verify post exists
      const [postCheck] = await db.query(`
        SELECT post_id FROM forum_posts WHERE post_id = ?
      `, [postId]);
      
      if (postCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      
      console.log(`[API] Updating reaction ${reactionType} for post ${postId} by user ${userId}`);
      
      // Check if user already reacted to this post
      const [existingReaction] = await db.query(`
        SELECT reaction_id, reaction_type FROM forum_reactions
        WHERE post_id = ? AND user_id = ?
      `, [postId, userId]);
      
      let action;
      
      if (existingReaction.length > 0) {
        // If same reaction, remove it (toggle)
        if (existingReaction[0].reaction_type === reactionType) {
          await db.query(`
            DELETE FROM forum_reactions WHERE reaction_id = ?
          `, [existingReaction[0].reaction_id]);
          
          action = 'removed';
        } else {
          // Update to new reaction type
          await db.query(`
            UPDATE forum_reactions SET reaction_type = ? WHERE reaction_id = ?
          `, [reactionType, existingReaction[0].reaction_id]);
          
          action = 'updated';
        }
      } else {
        // Add new reaction
        const reactionId = uuidv4();
        await db.query(`
          INSERT INTO forum_reactions (reaction_id, post_id, user_id, reaction_type)
          VALUES (?, ?, ?, ?)
        `, [reactionId, postId, userId, reactionType]);
        
        action = 'added';
      }
      
      console.log(`[API] Reaction ${action} successfully`);
      
      // Log audit entry
      await logAudit({
        user_id: req.user.id,
        user_name: req.user.full_name || req.user.username,
        user_role: req.user.role,
        action: action === 'removed' ? 'DELETE' : action === 'updated' ? 'UPDATE' : 'CREATE',
        module: 'Forum',
        entity_type: 'forum_reaction',
        entity_id: postId,
        record_id: postId,
        new_value: {
          reaction_type: reactionType
        },
        change_summary: `Reaction ${action} for post ${postId}`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'] || 'unknown',
        status: 'success',
      });
      
      res.json({
        success: true,
        message: `Reaction ${action} successfully`,
        action
      });
    } catch (error) {
      console.error('[API] Error updating reaction:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to update reaction',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

export default router;