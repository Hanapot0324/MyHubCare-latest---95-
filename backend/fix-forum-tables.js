import { db } from './db.js';

async function fixForumTables() {
  const connection = await db.getConnection();
  
  try {
    console.log('Checking forum_posts table structure...\n');
    
    // Check current structure
    const [columns] = await connection.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = DATABASE() 
      AND table_name = 'forum_posts'
      ORDER BY ordinal_position
    `);
    
    const columnNames = columns.map(c => c.column_name);
    const hasOldStructure = columnNames.includes('topic_id') && columnNames.includes('author_id');
    const hasNewStructure = columnNames.includes('category_id') && columnNames.includes('title') && columnNames.includes('status');
    
    console.log('Current columns:', columnNames);
    console.log('Has old structure:', hasOldStructure);
    console.log('Has new structure:', hasNewStructure);
    
    if (hasOldStructure && !hasNewStructure) {
      console.log('\n⚠️  Old table structure detected. Dropping old table...');
      
      // Check if there's data to backup
      const [rowCount] = await connection.query('SELECT COUNT(*) as count FROM forum_posts');
      if (rowCount[0].count > 0) {
        console.log(`⚠️  Warning: ${rowCount[0].count} rows will be lost. Creating backup...`);
        await connection.query('CREATE TABLE IF NOT EXISTS forum_posts_backup_old AS SELECT * FROM forum_posts');
      }
      
      // Disable foreign key checks temporarily
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');
      
      // Drop dependent tables first
      console.log('Dropping dependent tables...');
      await connection.query('DROP TABLE IF EXISTS forum_replies');
      await connection.query('DROP TABLE IF EXISTS forum_attachments');
      await connection.query('DROP TABLE IF EXISTS forum_reactions');
      
      // Drop old table
      await connection.query('DROP TABLE IF EXISTS forum_posts');
      
      // Re-enable foreign key checks
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
      console.log('✅ Old table dropped');
    }
    
    // Create new table structure
    console.log('\nCreating new forum_posts table structure...');
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS forum_posts (
        post_id CHAR(36) PRIMARY KEY,
        patient_id CHAR(36) NULL,
        category_id CHAR(36) NOT NULL,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        is_anonymous BOOLEAN DEFAULT true,
        reply_count INTEGER DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        is_pinned BOOLEAN DEFAULT false,
        is_locked BOOLEAN DEFAULT false,
        status ENUM('pending', 'approved', 'rejected', 'flagged') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_forum_posts_category_id (category_id),
        INDEX idx_forum_posts_patient_id (patient_id),
        INDEX idx_forum_posts_status (status),
        INDEX idx_forum_posts_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
    
    // Add foreign keys separately (in case they fail)
    try {
      await connection.query(`
        ALTER TABLE forum_posts
        ADD CONSTRAINT fk_forum_posts_patient 
        FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE SET NULL
      `);
    } catch (err) {
      if (err.code !== 'ER_DUP_FKEYNAME' && !err.message.includes('already exists')) {
        console.log('⚠️  Could not add patient foreign key:', err.message);
      }
    }
    
    try {
      await connection.query(`
        ALTER TABLE forum_posts
        ADD CONSTRAINT fk_forum_posts_category 
        FOREIGN KEY (category_id) REFERENCES forum_categories(category_id) ON DELETE RESTRICT
      `);
    } catch (err) {
      if (err.code !== 'ER_DUP_FKEYNAME' && !err.message.includes('already exists')) {
        console.log('⚠️  Could not add category foreign key:', err.message);
      }
    }
    
    console.log('✅ New table structure created');
    
    // Recreate forum_replies table if it doesn't exist
    console.log('\nCreating forum_replies table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS forum_replies (
        reply_id CHAR(36) PRIMARY KEY,
        post_id CHAR(36) NOT NULL,
        patient_id CHAR(36) NULL,
        content TEXT NOT NULL,
        is_anonymous BOOLEAN DEFAULT true,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_forum_replies_post_id (post_id),
        INDEX idx_forum_replies_patient_id (patient_id),
        INDEX idx_forum_replies_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
    
    // Add foreign keys for forum_replies
    try {
      await connection.query(`
        ALTER TABLE forum_replies
        ADD CONSTRAINT fk_forum_replies_post 
        FOREIGN KEY (post_id) REFERENCES forum_posts(post_id) ON DELETE CASCADE
      `);
    } catch (err) {
      if (err.code !== 'ER_DUP_FKEYNAME' && !err.message.includes('already exists')) {
        console.log('⚠️  Could not add post foreign key:', err.message);
      }
    }
    
    try {
      await connection.query(`
        ALTER TABLE forum_replies
        ADD CONSTRAINT fk_forum_replies_patient 
        FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE SET NULL
      `);
    } catch (err) {
      if (err.code !== 'ER_DUP_FKEYNAME' && !err.message.includes('already exists')) {
        console.log('⚠️  Could not add patient foreign key:', err.message);
      }
    }
    
    console.log('✅ forum_replies table created');
    
    // Verify structure
    const [newColumns] = await connection.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = DATABASE() 
      AND table_name = 'forum_posts'
      ORDER BY ordinal_position
    `);
    
    console.log('\n✅ New table columns:', newColumns.map(c => c.column_name).join(', '));
    
    console.log('\n✅ Forum tables fixed! You can now add posts to the database.');
    
  } catch (error) {
    console.error('❌ Error fixing tables:', error);
    throw error;
  } finally {
    connection.release();
  }
}

fixForumTables()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });

