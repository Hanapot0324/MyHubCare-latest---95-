import { db } from './db.js';

async function checkForumTables() {
  try {
    console.log('Checking forum tables in database...\n');
    
    // Check if new tables exist
    const [newTables] = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name IN ('forum_categories', 'forum_posts', 'forum_replies')
      ORDER BY table_name
    `);
    
    console.log('New forum tables found:', newTables.map(t => t.table_name));
    
    // Check if old tables exist
    const [oldTables] = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name IN ('forum_threads', 'forum_topics', 'forum_attachments', 'forum_reactions')
      ORDER BY table_name
    `);
    
    console.log('Old forum tables found:', oldTables.map(t => t.table_name));
    
    // Check forum_categories structure
    if (newTables.some(t => t.table_name === 'forum_categories')) {
      const [categories] = await db.query('SELECT COUNT(*) as count FROM forum_categories');
      console.log(`\nforum_categories: ${categories[0].count} rows`);
      
      const [catSample] = await db.query('SELECT * FROM forum_categories LIMIT 3');
      console.log('Sample categories:', JSON.stringify(catSample, null, 2));
    }
    
    // Check forum_posts structure
    if (newTables.some(t => t.table_name === 'forum_posts')) {
      const [posts] = await db.query('SELECT COUNT(*) as count FROM forum_posts');
      console.log(`\nforum_posts: ${posts[0].count} rows`);
      
      // Check table structure
      const [columns] = await db.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_schema = DATABASE() 
        AND table_name = 'forum_posts'
        ORDER BY ordinal_position
      `);
      console.log('\nforum_posts columns:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
      });
      
      if (posts[0].count > 0) {
        const [postSample] = await db.query('SELECT post_id, title, status, category_id, patient_id FROM forum_posts LIMIT 3');
        console.log('\nSample posts:', JSON.stringify(postSample, null, 2));
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking tables:', error);
    process.exit(1);
  }
}

checkForumTables();


