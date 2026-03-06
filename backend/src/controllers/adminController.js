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

                // Get all PRE_ENROLLED students for this course, ordered by enrolled_at
                const preEnrolledRes = await db.query(
                    "SELECT id FROM enrollments WHERE course_id = $1 AND status = 'PRE_ENROLLED' ORDER BY enrolled_at ASC",
                    [course_id]
                );

                for (const row of preEnrolledRes.rows) {
                    if (availableSeats > 0) {
                        // Enroll them
                        await db.query("UPDATE enrollments SET status = 'ENROLLED' WHERE id = $1", [row.id]);
                        availableSeats--;
                    } else {
                        // Waitlist them
                        await db.query("UPDATE enrollments SET status = 'WAITLISTED' WHERE id = $1", [row.id]);
                    }
                }

                // If there are STILL available seats, check if anyone is currently WAITLISTED and promote them
                if (availableSeats > 0) {
                    const waitlistedRes = await db.query(
                        "SELECT id FROM enrollments WHERE course_id = $1 AND status = 'WAITLISTED' ORDER BY enrolled_at ASC LIMIT $2",
                        [course_id, availableSeats]
                    );
                    for (const row of waitlistedRes.rows) {
                        await db.query("UPDATE enrollments SET status = 'ENROLLED' WHERE id = $1", [row.id]);
                    }
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
        // Return courses with their capacity, current ENROLLED count, PRE_ENROLLED count, and WAITLISTED count
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

        // 1. Get old capacity
        const oldCourseRes = await db.query("SELECT capacity FROM courses WHERE id = $1", [id]);
        if (oldCourseRes.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ error: 'Course not found' });
        }
        const oldCapacity = oldCourseRes.rows[0].capacity;

        // 2. Update capacity
        const result = await db.query(
            "UPDATE courses SET capacity = $1 WHERE id = $2 RETURNING *",
            [capacity, id]
        );
        const updatedCourse = result.rows[0];

        // 3. Promote waitlisted students if there are available seats
        // Count current officially ENROLLED to find actual available seats
        const enrolledRes = await db.query(
            "SELECT COUNT(*) FROM enrollments WHERE course_id = $1 AND status = 'ENROLLED'",
            [id]
        );
        const currentEnrolled = parseInt(enrolledRes.rows[0].count);
        let availableSeats = capacity - currentEnrolled;

        if (availableSeats > 0) {
            const waitlistedRes = await db.query(
                "SELECT id FROM enrollments WHERE course_id = $1 AND status = 'WAITLISTED' ORDER BY enrolled_at ASC LIMIT $2",
                [id, availableSeats]
            );

            for (const row of waitlistedRes.rows) {
                await db.query("UPDATE enrollments SET status = 'ENROLLED' WHERE id = $1", [row.id]);
            }
        }

        await db.query('COMMIT');
        res.json(updatedCourse);
    } catch (error) {
        await db.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: 'Server error updating capacity' });
    }
};
