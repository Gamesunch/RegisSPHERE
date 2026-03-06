require('dotenv').config();
const db = require('./src/config/db');

async function debugWaitlist() {
    try {
        console.log('--- Full Waitlist Audit ---');
        const coursesRes = await db.query('SELECT id, code, capacity FROM courses');

        for (const course of coursesRes.rows) {
            const enrolledRes = await db.query("SELECT COUNT(*) FROM enrollments WHERE course_id = $1 AND status = 'ENROLLED'", [course.id]);
            const waitlistedRes = await db.query("SELECT COUNT(*) FROM enrollments WHERE course_id = $1 AND status = 'WAITLISTED'", [course.id]);
            const preEnrolledRes = await db.query("SELECT COUNT(*) FROM enrollments WHERE course_id = $1 AND status = 'PRE_ENROLLED'", [course.id]);

            const enrolled = parseInt(enrolledRes.rows[0].count);
            const waitlisted = parseInt(waitlistedRes.rows[0].count);
            const pre = parseInt(preEnrolledRes.rows[0].count);

            console.log(`Course: ${course.code.padEnd(10)} | Cap: ${course.capacity.toString().padEnd(3)} | Enrolled: ${enrolled} | Waitlisted: ${waitlisted} | Pre: ${pre}`);

            const available = course.capacity - enrolled;
            if (available > 0 && waitlisted > 0) {
                console.log(`   >>> ACTION: Promoting ${Math.min(available, waitlisted)} students...`);
                const promoteRes = await db.query(
                    "SELECT id FROM enrollments WHERE course_id = $1 AND status = 'WAITLISTED' ORDER BY enrolled_at ASC LIMIT $2",
                    [course.id, available]
                );
                for (const row of promoteRes.rows) {
                    await db.query("UPDATE enrollments SET status = 'ENROLLED' WHERE id = $1", [row.id]);
                    console.log(`   - Promoted ${row.id}`);
                }
            }
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
debugWaitlist();
