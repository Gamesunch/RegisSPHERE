const db = require('../config/db');

exports.getPhase = async (req, res) => {
    try {
        const result = await db.query("SELECT value FROM system_settings WHERE key = 'enrollment_phase'");
        if (result.rows.length > 0) {
            res.json({ phase: result.rows[0].value });
        } else {
            res.json({ phase: 'ENROLLMENT' }); // Default fallback
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching phase' });
    }
};

exports.setPhase = async (req, res) => {
    const { phase } = req.body;
    if (!['PRE_ENROLLMENT', 'ENROLLMENT', 'CLOSED'].includes(phase)) {
        return res.status(400).json({ error: 'Invalid phase' });
    }

    try {
        await db.query("BEGIN");

        await db.query(
            "INSERT INTO system_settings (key, value) VALUES ('enrollment_phase', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
            [phase]
        );

        // If transitioning to ENROLLMENT, process PRE_ENROLLED students
        if (phase === 'ENROLLMENT') {
            // Get all courses
            const coursesRes = await db.query("SELECT id, capacity FROM courses");

            for (const course of coursesRes.rows) {
                const course_id = course.id;
                let capacity = course.capacity;

                // Count current officially ENROLLED
                const enrolledRes = await db.query(
                    "SELECT COUNT(*) FROM enrollments WHERE course_id = $1 AND status = 'ENROLLED'",
                    [course_id]
                );
                let currentEnrolled = parseInt(enrolledRes.rows[0].count);
                let availableSeats = capacity - currentEnrolled;

                // Optimized: Process all PRE_ENROLLED students for this course in ONE query
                await db.query(`
                    UPDATE enrollments
                    SET status = CASE 
                        WHEN sub.row_num <= $2 THEN 'ENROLLED'::enrollment_status 
                        ELSE 'WAITLISTED'::enrollment_status 
                    END
                    FROM (
                        SELECT id, ROW_NUMBER() OVER (ORDER BY enrolled_at ASC) as row_num
                        FROM enrollments
                        WHERE course_id = $1 AND status = 'PRE_ENROLLED'
                    ) as sub
                    WHERE enrollments.id = sub.id
                `, [course_id, availableSeats]);

                // Recalculate available seats for waitlist promotion
                const preEnrolledCountRes = await db.query(
                    "SELECT COUNT(*) FROM enrollments WHERE course_id = $1 AND status = 'PRE_ENROLLED' AND created_at < NOW()", // Hack to get original count if needed
                    [course_id]
                );
                // Actually easier to just check how many are ENROLLED now
                const newTotalEnrolledRes = await db.query(
                    "SELECT COUNT(*) FROM enrollments WHERE course_id = $1 AND status = 'ENROLLED'",
                    [course_id]
                );
                const newTotalEnrolled = parseInt(newTotalEnrolledRes.rows[0].count);
                availableSeats = capacity - newTotalEnrolled;

                // Optimized: Promote current WAITLISTED students if seats remain
                if (availableSeats > 0) {
                    await db.query(`
                        UPDATE enrollments 
                        SET status = 'ENROLLED' 
                        WHERE id IN (
                            SELECT id FROM enrollments 
                            WHERE course_id = $1 AND status = 'WAITLISTED' 
                            ORDER BY enrolled_at ASC 
                            LIMIT $2
                        )
                    `, [course_id, availableSeats]);
                }
            }
        }

        await db.query("COMMIT");
        res.json({ message: `Phase updated to ${phase}`, phase });
    } catch (error) {
        await db.query("ROLLBACK");
        console.error(error);
        res.status(500).json({ error: 'Server error updating phase' });
    }
};

exports.getDemand = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                c.id, c.code, c.name, c.capacity,
                COUNT(e.id) FILTER (WHERE e.status = 'ENROLLED') as enrolled_count,
                COUNT(e.id) FILTER (WHERE e.status = 'PRE_ENROLLED') as pre_enrolled_count,
                COUNT(e.id) FILTER (WHERE e.status = 'WAITLISTED') as waitlisted_count
            FROM courses c
            LEFT JOIN enrollments e ON c.id = e.course_id
            GROUP BY c.id
            ORDER BY c.code
        `);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching demand' });
    }
};

exports.updateCapacity = async (req, res) => {
    try {
        const { id } = req.params;
        const { capacity } = req.body;

        await db.query('BEGIN');

        // 1. Get current course
        const oldCourseRes = await db.query("SELECT capacity FROM courses WHERE id = $1", [id]);
        if (oldCourseRes.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ error: 'Course not found' });
        }

        // 2. Update capacity
        const result = await db.query(
            "UPDATE courses SET capacity = $1 WHERE id = $2 RETURNING *",
            [capacity, id]
        );
        const updatedCourse = result.rows[0];

        // 3. Optimized: Promote waitlisted students if there are available seats
        const enrolledRes = await db.query(
            "SELECT COUNT(*) FROM enrollments WHERE course_id = $1 AND status = 'ENROLLED'",
            [id]
        );
        const currentEnrolled = parseInt(enrolledRes.rows[0].count);
        let availableSeats = capacity - currentEnrolled;

        if (availableSeats > 0) {
            await db.query(`
                UPDATE enrollments 
                SET status = 'ENROLLED' 
                WHERE id IN (
                    SELECT id FROM enrollments 
                    WHERE course_id = $1 AND status = 'WAITLISTED' 
                    ORDER BY enrolled_at ASC 
                    LIMIT $2
                )
            `, [id, availableSeats]);
        }

        await db.query('COMMIT');
        res.json(updatedCourse);
    } catch (error) {
        await db.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: 'Server error updating capacity' });
    }
};

exports.getStudents = async (req, res) => {
    try {
        const result = await db.query(
            "SELECT id, student_id, first_name, last_name, email, university, major, year_of_study, created_at FROM users WHERE role = 'STUDENT' ORDER BY last_name, first_name"
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching students' });
    }
};

exports.updateStudentYear = async (req, res) => {
    try {
        const { id } = req.params;
        const { year_of_study } = req.body;

        const result = await db.query(
            "UPDATE users SET year_of_study = $1 WHERE id = $2 AND role = 'STUDENT' RETURNING id, email, first_name, last_name, year_of_study",
            [year_of_study, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json({ message: 'Student year updated successfully', user: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error updating student year' });
    }
};
