const db = require('../config/db');

exports.enrollCourse = async (req, res) => {
    try {
        const student_id = req.user.id;
        const { course_id } = req.body;

        // 1. Check if course exists and has capacity
        const courseRes = await db.query('SELECT * FROM courses WHERE id = $1', [course_id]);
        if (courseRes.rows.length === 0) return res.status(404).json({ error: 'Course not found' });

        // Simplistic capacity check (Production logic would COUNT enrollments) 
        // const enrolledCount = await db.query('SELECT COUNT(*) FROM enrollments WHERE course_id = $1', [course_id]);

        // 2. Simplistic Time conflict check
        const currentCourses = await db.query(
            `SELECT c.schedule_time 
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       WHERE e.student_id = $1`,
            [student_id]
        );

        const courseToEnroll = courseRes.rows[0];
        const hasConflict = currentCourses.rows.some(
            c => c.schedule_time === courseToEnroll.schedule_time
        );

        if (hasConflict) {
            return res.status(409).json({ error: 'Time conflict with an existing enrolled course' });
        }

        // 3. Enroll
        const result = await db.query(
            'INSERT INTO enrollments (student_id, course_id, status) VALUES ($1, $2, $3) RETURNING *',
            [student_id, course_id, 'ENROLLED']
        );

        res.status(201).json({ message: 'Successfully enrolled', enrollment: result.rows[0] });
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

        // Only allow the student who enrolled to drop
        const result = await db.query(
            'DELETE FROM enrollments WHERE id = $1 AND student_id = $2 RETURNING *',
            [id, student_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Enrollment not found or not authorized' });
        }

        res.json({ message: 'Course dropped successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error dropping course' });
    }
};
