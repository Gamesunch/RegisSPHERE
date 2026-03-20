require('dotenv').config();
const db = require('./src/config/db');

async function addIndexes() {
    try {
        console.log('Adding indexes to enrollments table...');
        
        // 1. Index for course + status + enrolled_at (speeds up get pre-enrolled/waitlisted)
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_enrollments_course_status_date 
            ON enrollments(course_id, status, enrolled_at);
        `);
        console.log('Index idx_enrollments_course_status_date created.');

        // 2. Index for student_id in enrollments
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_enrollments_student_id 
            ON enrollments(student_id);
        `);
        console.log('Index idx_enrollments_student_id created.');

        console.log('All indexes added successfully.');
        process.exit(0);
    } catch (e) {
        console.error('Failed to add indexes:', e.message);
        process.exit(1);
    }
}

addIndexes();
