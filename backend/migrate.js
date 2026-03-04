require('dotenv').config();
const db = require('./src/config/db');

async function migrate() {
    try {
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '',
            ADD COLUMN IF NOT EXISTS profile_picture_url TEXT DEFAULT '',
            ADD COLUMN IF NOT EXISTS university VARCHAR(255) DEFAULT '',
            ADD COLUMN IF NOT EXISTS major VARCHAR(255) DEFAULT '',
            ADD COLUMN IF NOT EXISTS year_of_study VARCHAR(50) DEFAULT ''
        `);
        console.log('Migration successful: columns added to users table');
        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e.message);
        process.exit(1);
    }
}

migrate();
