const db = require('../config/db');

exports.enrollCourse = async (req, res) => {
    try {
        const student_id = req.user.id;
        const { course_id } = req.body;

        // Fetch current phase
        const phaseRes = await db.query("SELECT value FROM system_settings WHERE key = 'enrollment_phase'");
        const phase = phaseRes.rows.length > 0 ? phaseRes.rows[0].value : 'ENROLLMENT';

        if (phase === 'CLOSED') {
            return res.status(403).json({ error: 'Enrollment is currently closed.' });
        }

        // 1. Check if course exists
        const courseRes = await db.query('SELECT * FROM courses WHERE id = $1', [course_id]);
        if (courseRes.rows.length === 0) return res.status(404).json({ error: 'Course not found' });
        const courseToEnroll = courseRes.rows[0];

        // Ensure capacity is respected only during active ENROLLMENT
        if (phase === 'ENROLLMENT') {
            const enrolledCountRes = await db.query("SELECT COUNT(*) FROM enrollments WHERE course_id = $1 AND status = 'ENROLLED'", [course_id]);
            const currentEnrolled = parseInt(enrolledCountRes.rows[0].count);
            if (currentEnrolled >= courseToEnroll.capacity) {
                return res.status(400).json({ error: 'Course is at full capacity' });
            }
        }

        // 2. Simplistic Time conflict check
        const currentCourses = await db.query(
            `SELECT c.schedule_time 
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       WHERE e.student_id = $1`,
            [student_id]
        );
        const hasConflict = currentCourses.rows.some(
            c => c.schedule_time === courseToEnroll.schedule_time
        );

        if (hasConflict) {
            return res.status(409).json({ error: 'Time conflict with an existing enrolled course' });
        }

        // 3. Enroll or Pre-Enroll
        const statusToInsert = phase === 'PRE_ENROLLMENT' ? 'PRE_ENROLLED' : 'ENROLLED';
        const result = await db.query(
            'INSERT INTO enrollments (student_id, course_id, status) VALUES ($1, $2, $3) RETURNING *',
            [student_id, course_id, statusToInsert]
        );

        res.status(201).json({
            message: phase === 'PRE_ENROLLMENT' ? 'Successfully pre-enrolled' : 'Successfully enrolled',
            enrollment: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') { // Unique violation Postgres code
            return res.status(400).json({ error: 'Already enrolled in this course' });
        }
        console.error(error);
        res.status(500).json({ error: 'Server error during enrollment' });
    }
};

exports.getMyEnrollments = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT e.id as enrollment_id, e.status, e.grade, c.*, u.last_name as prof_last 
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       LEFT JOIN users u ON c.professor_id = u.id
       WHERE e.student_id = $1`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching enrollments' });
    }
};

exports.dropCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const student_id = req.user.id;

        await db.query('BEGIN');

        // 1. Get the enrollment details before deleting
        const enrollmentRes = await db.query(
            'SELECT course_id, status FROM enrollments WHERE id = $1 AND student_id = $2',
            [id, student_id]
        );

        if (enrollmentRes.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ error: 'Enrollment not found or not authorized' });
        }

        const { course_id, status } = enrollmentRes.rows[0];

        // 2. Delete the enrollment
        await db.query('DELETE FROM enrollments WHERE id = $1', [id]);

        // 3. If the dropped course was 'ENROLLED', promote the next waitlisted student
        if (status === 'ENROLLED') {
            const nextWaitlisted = await db.query(
                "SELECT id FROM enrollments WHERE course_id = $1 AND status = 'WAITLISTED' ORDER BY enrolled_at ASC LIMIT 1",
                [course_id]
            );

            if (nextWaitlisted.rows.length > 0) {
                await db.query(
                    "UPDATE enrollments SET status = 'ENROLLED' WHERE id = $1",
                    [nextWaitlisted.rows[0].id]
                );
            }
        }

        await db.query('COMMIT');
        res.json({ message: 'Course dropped successfully' });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: 'Server error dropping course' });
    }
};
