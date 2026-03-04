require('dotenv').config();
const db = require('./src/config/db');

async function migrate() {
    try {
        // Add grade, academic_year, semester columns to enrollments
        await db.query(`
            ALTER TABLE enrollments 
            ADD COLUMN IF NOT EXISTS grade VARCHAR(5),
            ADD COLUMN IF NOT EXISTS academic_year VARCHAR(20),
            ADD COLUMN IF NOT EXISTS semester INT
        `);
        console.log('Added grade, academic_year, semester columns.');

        // Set default academic year/semester for existing enrollments
        await db.query(`UPDATE enrollments SET academic_year = '2025', semester = 2 WHERE academic_year IS NULL`);
        console.log('Set default academic_year=2025, semester=2 for existing.');

        // Give sample grades to some enrollments to demo the grades page
        const enrollments = await db.query('SELECT id, course_id FROM enrollments ORDER BY enrolled_at');
        const sampleGrades = ['A', 'B+', 'A', 'B', 'C+', 'A', 'B+', 'B'];
        for (let i = 0; i < enrollments.rows.length; i++) {
            const grade = sampleGrades[i % sampleGrades.length];
            await db.query('UPDATE enrollments SET grade = $1 WHERE id = $2', [grade, enrollments.rows[i].id]);
            console.log(`Set grade ${grade} for enrollment ${enrollments.rows[i].id}`);
        }

        console.log('\nGrades migration complete!');
        process.exit(0);
    } catch (e) {
        console.error('Migration error:', e.message);
        process.exit(1);
    }
}
migrate();
