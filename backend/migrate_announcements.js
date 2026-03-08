require('dotenv').config();
const db = require('./src/config/db');

async function migrate() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS announcements (
                id SERIAL PRIMARY KEY,
                course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
                professor_id UUID REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Announcements table created/verified successfully.");
    } catch (error) {
        console.error("Error creating announcements table:", error);
    } finally {
        process.exit(0);
    }
}

migrate();
