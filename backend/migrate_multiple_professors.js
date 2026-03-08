require('dotenv').config();
const db = require('./src/config/db');

async function migrate() {
    try {
        await db.query('BEGIN');

        console.log('Creating course_professors table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS course_professors (
                course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
                professor_id UUID REFERENCES users(id) ON DELETE CASCADE,
                PRIMARY KEY (course_id, professor_id)
            );
        `);

        console.log('Migrating existing professor_id to course_professors...');
        await db.query(`
            INSERT INTO course_professors (course_id, professor_id)
            SELECT id, professor_id FROM courses 
            WHERE professor_id IS NOT NULL
            ON CONFLICT DO NOTHING;
        `);

        console.log('Dropping professor_id from courses...');
        await db.query(`
            ALTER TABLE courses DROP COLUMN IF EXISTS professor_id;
        `);

        await db.query('COMMIT');
        console.log('Migration completed successfully.');
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Migration failed:', error);
    } finally {
        process.exit();
    }
}

migrate();
