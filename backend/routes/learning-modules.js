// routes/learning-modules.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../db.js';
import { authenticateToken } from './auth.js';
import { logAudit, getClientIp } from '../utils/auditLogger.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

const router = express.Router();

// Function to extract and clean content from URL
const extractContentFromUrl = async (url) => {
  console.log(`[EXTRACT] Starting extraction for URL: ${url}`);
  try {
    // Fetch the HTML content of the page with a timeout
    console.log('[EXTRACT] Fetching HTML content...');
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000 // 15 second timeout
    });

    console.log(`[EXTRACT] Fetch successful, status: ${response.status}`);
    
    // Load the HTML into cheerio
    const $ = cheerio.load(response.data);
    console.log('[EXTRACT] HTML loaded into Cheerio');
    
    // Remove script and style elements
    $('script, style, nav, header, footer, aside, .navigation, .menu, .sidebar, .ads, .advertisement').remove();
    
    // Remove elements with common ad or navigation class names
    $('[class*="ad"], [class*="banner"], [class*="popup"], [class*="modal"], [class*="nav"], [class*="menu"]').remove();
    
    // Extract title with multiple fallbacks
    let title = $('title').text().trim();
    if (!title) {
      title = $('h1').first().text().trim();
    }
    if (!title) {
      title = $('meta[property="og:title"]').attr('content');
    }
    if (!title) {
      title = $('h2').first().text().trim();
    }
    console.log(`[EXTRACT] Extracted title: ${title}`);

    // Extract description from meta tags with multiple fallbacks
    let description = $('meta[name="description"]').attr('content');
    if (!description) {
      description = $('meta[property="og:description"]').attr('content');
    }
    if (!description) {
      description = $('meta[name="twitter:description"]').attr('content');
    }
    if (!description) {
      // If no meta description, get the first paragraph
      description = $('p').first().text().trim();
      // Limit description to 300 characters
      if (description.length > 300) {
        description = description.substring(0, 300) + '...';
      }
    }
    console.log(`[EXTRACT] Extracted description: ${description.substring(0, 100)}...`);

    // Try to find main content area with specific selectors
    let contentHtml = '';
    const contentSelectors = [
      'article',
      '.content',
      '.main-content',
      '.post-content',
      '.entry-content',
      '.article-content',
      'main',
      '.post-body',
      '.entry-body',
      '#content',
      '#main-content'
    ];
    
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        // Get the HTML content
        contentHtml = $.html(element.first());
        console.log(`[EXTRACT] Found content with selector: ${selector}`);
        break;
      }
    }
    
    // If no main content found, get all paragraphs
    if (!contentHtml) {
      console.log('[EXTRACT] No main content found, falling back to all paragraphs');
      contentHtml = $('p').map((i, el) => `<p>${$(el).text().trim()}</p>`).get().join('');
    }
    
    // Clean up the HTML content
    const content = cleanContent(contentHtml);
    console.log(`[EXTRACT] Extracted content length: ${content.length} characters`);
    
    // Estimate read time (average reading speed: 200 words per minute)
    const textContent = $(content).text();
    const wordCount = textContent.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / 200);
    const readTimeText = `${readTime} min`;
    console.log(`[EXTRACT] Calculated read time: ${readTimeText} (${wordCount} words)`);
    
    return {
      title: title || 'Untitled Module',
      description: description || 'No description available',
      content: content,
      read_time: readTimeText
    };
  } catch (error) {
    console.error('[EXTRACT] Error extracting content from URL:', error.message);
    console.error('[EXTRACT] Full error object:', error);
    
    // Return default values on error
    return {
      title: 'Untitled Module',
      description: 'No description available',
      content: '<p>No content available for this module.</p>',
      read_time: '10 min'
    };
  }
};

// Function to clean and format content
const cleanContent = (html) => {
  const $ = cheerio.load(html);
  
  // Remove any remaining script or style elements
  $('script, style').remove();
  
  // Process each paragraph to ensure proper formatting
  $('p').each(function() {
    const text = $(this).text().trim();
    if (text) {
      // Replace the content with clean text
      $(this).text(text);
    } else {
      // Remove empty paragraphs
      $(this).remove();
    }
  });
  
  // Process headings
  $('h1, h2, h3, h4, h5, h6').each(function() {
    const text = $(this).text().trim();
    if (text) {
      $(this).text(text);
    } else {
      $(this).remove();
    }
  });
  
  // Process lists
  $('ul, ol').each(function() {
    $(this).find('li').each(function() {
      const text = $(this).text().trim();
      if (text) {
        $(this).text(text);
      } else {
        $(this).remove();
      }
    });
    
    // Remove empty lists
    if ($(this).find('li').length === 0) {
      $(this).remove();
    }
  });
  
  // Return the cleaned HTML
  return $.html();
};

// Get all learning modules
router.get('/', async (req, res) => {
  try {
    console.log('[API] GET /api/learning-modules - Fetching all modules');
    const { category, is_published, search } = req.query;
    const isUserAdmin = (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin'));
    
    let query = `
      SELECT lm.*, u.full_name 
      FROM learning_modules lm
      LEFT JOIN users u ON lm.created_by = u.user_id
      WHERE 1=1
    `;
    const params = [];
    
    // Non-admin users only see published modules
    if (!isUserAdmin) {
      query += ' AND (lm.is_published = 1 OR lm.is_published IS NULL)';
    } else if (is_published !== undefined) {
      query += ' AND lm.is_published = ?';
      params.push(is_published === 'true' ? 1 : 0);
    }
    
    if (category) {
      query += ' AND lm.category = ?';
      params.push(category);
    }
    
    if (search) {
      query += ' AND (lm.title LIKE ? OR lm.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }
    
    query += ' ORDER BY lm.created_at DESC';
    
    const [modules] = await db.query(query, params);
    
    console.log(`[API] Successfully fetched ${modules.length} modules`);
    res.json({
      success: true,
      modules
    });
  } catch (error) {
    console.error('[API] Error fetching learning modules:', error.message);
    console.error('[API] Full error object:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch learning modules',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get a specific learning module
router.get('/:id', async (req, res) => {
  try {
    const moduleId = req.params.id;
    const isUserAdmin = (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin'));
    console.log(`[API] GET /api/learning-modules/${moduleId} - Fetching specific module`);
    
    let query = `
      SELECT lm.*, u.full_name 
      FROM learning_modules lm
      LEFT JOIN users u ON lm.created_by = u.user_id
      WHERE lm.id = ?
    `;
    const params = [moduleId];
    
    // Non-admin users only see published modules
    if (!isUserAdmin) {
      query += ' AND (lm.is_published = 1 OR lm.is_published IS NULL)';
    }
    
    const [modules] = await db.query(query, params);
    
    if (modules.length === 0) {
      console.log(`[API] Module not found with ID: ${moduleId}`);
      return res.status(404).json({
        success: false,
        message: 'Learning module not found'
      });
    }
    
    // Increment view count
    await db.query('UPDATE learning_modules SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?', [moduleId]);
    
    console.log(`[API] Successfully fetched module: ${modules[0].title}`);
    res.json({
      success: true,
      module: modules[0]
    });
  } catch (error) {
    console.error('[API] Error fetching learning module:', error.message);
    console.error('[API] Full error object:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch learning module',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create a new learning module (admin only)
router.post('/', 
  authenticateToken,
  [
    body('link_url').optional().isURL().withMessage('Valid URL is required'),
    body('category').optional().isIn(['BASICS', 'LIFESTYLE', 'TREATMENT', 'PREVENTION', 'OTHER']),
    body('module_type').optional().isIn(['article', 'video', 'infographic', 'pdf']),
    body('tags').optional().isArray(),
    body('is_published').optional().isBoolean(),
  ],
  async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      console.log(`[API] Unauthorized access attempt by user: ${req.user.user_id} with role: ${req.user.role}`);
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

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
      const { link_url, category, module_type = 'article', tags, is_published = false, title, description, content, read_time } = req.body;
      const createdBy = req.user.user_id;
      
      let extractedContent = {};
      
      // If URL provided, extract content
      if (link_url) {
        console.log(`[API] Creating new module with URL: ${link_url}`);
        extractedContent = await extractContentFromUrl(link_url);
        console.log('[API] Content extraction completed');
      } else if (!title || !content) {
        return res.status(400).json({
          success: false,
          message: 'Either link_url or title and content are required'
        });
      } else {
        extractedContent = {
          title: title,
          description: description || '',
          content: content,
          read_time: read_time || '10 min'
        };
      }
      
      // Convert tags array to JSON string if provided
      const tagsJson = tags && Array.isArray(tags) ? JSON.stringify(tags) : null;
      
      const [result] = await db.query(`
        INSERT INTO learning_modules 
        (title, description, category, link_url, read_time, created_by, content, module_type, tags, is_published, view_count) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `, [
        extractedContent.title,
        extractedContent.description,
        category || 'OTHER',
        link_url || null,
        extractedContent.read_time,
        createdBy,
        extractedContent.content,
        module_type,
        tagsJson,
        is_published ? 1 : 0
      ]);
      
      console.log(`[API] Module created with ID: ${result.insertId}`);
      
      // Log audit entry
      await logAudit({
        user_id: req.user.user_id,
        user_name: req.user.full_name || req.user.username,
        user_role: req.user.role,
        action: 'CREATE',
        module: 'Education',
        entity_type: 'learning_module',
        entity_id: result.insertId,
        record_id: result.insertId,
        new_value: {
          title: extractedContent.title,
          description: extractedContent.description,
          category: category || 'OTHER',
          module_type,
          tags: tags,
          is_published,
          content: extractedContent.content.substring(0, 100) + '...'
        },
        change_summary: `New learning module created: ${extractedContent.title}`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'] || 'unknown',
        status: 'success',
      });
      
      res.status(201).json({
        success: true,
        message: 'Learning module created successfully',
        moduleId: result.insertId,
        extractedContent
      });
    } catch (error) {
      console.error('[API] Error creating learning module:', error.message);
      console.error('[API] Full error object:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create learning module',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Update a learning module (admin only)
router.put('/:id', 
  authenticateToken,
  [
    body('link_url').optional().isURL().withMessage('Valid URL is required'),
    body('category').optional().isIn(['BASICS', 'LIFESTYLE', 'TREATMENT', 'PREVENTION', 'OTHER']),
    body('module_type').optional().isIn(['article', 'video', 'infographic', 'pdf']),
    body('tags').optional().isArray(),
    body('is_published').optional().isBoolean(),
  ],
  async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      console.log(`[API] Unauthorized access attempt by user: ${req.user.user_id} with role: ${req.user.role}`);
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

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
      const moduleId = req.params.id;
      const { link_url, category, module_type, tags, is_published, title, description, content, read_time } = req.body;
      
      console.log(`[API] Updating module ${moduleId}`);
      
      // Get current module for audit log
      const [currentModules] = await db.query('SELECT * FROM learning_modules WHERE id = ?', [moduleId]);
      
      if (currentModules.length === 0) {
        console.log(`[API] Module not found with ID: ${moduleId}`);
        return res.status(404).json({
          success: false,
          message: 'Learning module not found'
        });
      }
      
      const currentModule = currentModules[0];
      
      // If URL is provided and different from current, extract content
      let extractedContent = {};
      if (link_url && link_url !== currentModule.link_url) {
        console.log('[API] URL changed, extracting new content');
        extractedContent = await extractContentFromUrl(link_url);
      } else {
        // Use provided or existing content
        extractedContent = {
          title: title || currentModule.title,
          description: description || currentModule.description,
          content: content || currentModule.content,
          read_time: read_time || currentModule.read_time
        };
      }
      
      // Build update query
      const updates = [];
      const params = [];
      
      updates.push('title = ?');
      params.push(extractedContent.title);
      
      updates.push('description = ?');
      params.push(extractedContent.description);
      
      if (category !== undefined) {
        updates.push('category = ?');
        params.push(category);
      }
      
      if (link_url !== undefined) {
        updates.push('link_url = ?');
        params.push(link_url);
      }
      
      updates.push('read_time = ?');
      params.push(extractedContent.read_time);
      
      updates.push('content = ?');
      params.push(extractedContent.content);
      
      if (module_type !== undefined) {
        updates.push('module_type = ?');
        params.push(module_type);
      }
      
      if (tags !== undefined) {
        const tagsJson = Array.isArray(tags) ? JSON.stringify(tags) : null;
        updates.push('tags = ?');
        params.push(tagsJson);
      }
      
      if (is_published !== undefined) {
        updates.push('is_published = ?');
        params.push(is_published ? 1 : 0);
      }
      
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(moduleId);
      
      // Update module
      await db.query(
        `UPDATE learning_modules SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
      
      console.log(`[API] Module ${moduleId} updated successfully`);
      
      // Log audit entry
      await logAudit({
        user_id: req.user.user_id,
        user_name: req.user.full_name || req.user.username,
        user_role: req.user.role,
        action: 'UPDATE',
        module: 'Education',
        entity_type: 'learning_module',
        entity_id: moduleId,
        record_id: moduleId,
        old_value: {
          title: currentModule.title,
          description: currentModule.description,
          category: currentModule.category,
          module_type: currentModule.module_type,
          is_published: currentModule.is_published,
          content: currentModule.content ? currentModule.content.substring(0, 100) + '...' : ''
        },
        new_value: {
          title: extractedContent.title,
          description: extractedContent.description,
          category: category !== undefined ? category : currentModule.category,
          module_type: module_type !== undefined ? module_type : currentModule.module_type,
          is_published: is_published !== undefined ? is_published : currentModule.is_published,
          tags: tags,
          content: extractedContent.content ? extractedContent.content.substring(0, 100) + '...' : ''
        },
        change_summary: `Learning module updated: ${extractedContent.title}`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'] || 'unknown',
        status: 'success',
      });
      
      res.json({
        success: true,
        message: 'Learning module updated successfully',
        extractedContent
      });
    } catch (error) {
      console.error('[API] Error updating learning module:', error.message);
      console.error('[API] Full error object:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update learning module',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Delete a learning module (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    console.log(`[API] Unauthorized access attempt by user: ${req.user.user_id} with role: ${req.user.role}`);
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  try {
    const moduleId = req.params.id;
    console.log(`[API] Deleting module with ID: ${moduleId}`);
    
    // Get current module for audit log
    const [currentModules] = await db.query('SELECT * FROM learning_modules WHERE id = ?', [moduleId]);
    
    if (currentModules.length === 0) {
      console.log(`[API] Module not found with ID: ${moduleId}`);
      return res.status(404).json({
        success: false,
        message: 'Learning module not found'
      });
    }
    
    const currentModule = currentModules[0];
    
    // Delete module
    await db.query('DELETE FROM learning_modules WHERE id = ?', [moduleId]);
    
    console.log(`[API] Module ${moduleId} deleted successfully`);
    
    // Log audit entry
    await logAudit({
      user_id: req.user.user_id,
      user_name: req.user.full_name || req.user.username,
      user_role: req.user.role,
      action: 'DELETE',
      module: 'Education',
      entity_type: 'learning_module',
      entity_id: moduleId,
      record_id: moduleId,
      old_value: {
        title: currentModule.title,
        description: currentModule.description,
        category: currentModule.category,
        link_url: currentModule.link_url,
        read_time: currentModule.read_time,
        content: currentModule.content ? currentModule.content.substring(0, 100) +   '...' : ''
      },
      change_summary: `Learning module deleted: ${currentModule.title}`,
      ip_address: getClientIp(req),
      user_agent: req.headers['user-agent'] || 'unknown',
      status: 'success',
    });
    
    res.json({
      success: true,
      message: 'Learning module deleted successfully'
    });
  } catch (error) {
    console.error('[API] Error deleting learning module:', error.message);
    console.error('[API] Full error object:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete learning module',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;