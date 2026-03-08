const db = require('../config/db');

exports.getAllCourses = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT c.*, 
                COALESCE(
                    json_agg(
                        json_build_object('id', u.id, 'first_name', u.first_name, 'last_name', u.last_name)
                    ) FILTER (WHERE u.id IS NOT NULL), 
                '[]') as professors
            FROM courses c 
            LEFT JOIN course_professors cp ON c.id = cp.course_id
            LEFT JOIN users u ON cp.professor_id = u.id
            GROUP BY c.id
            ORDER BY c.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching courses' });
    }
};

exports.getProfessorCourses = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT c.*, 
                COALESCE(
                    json_agg(
                        json_build_object('id', u.id, 'first_name', u.first_name, 'last_name', u.last_name)
                    ) FILTER (WHERE u.id IS NOT NULL), 
                '[]') as professors
            FROM courses c
            JOIN course_professors my_cp ON c.id = my_cp.course_id AND my_cp.professor_id = $1
            LEFT JOIN course_professors cp ON c.id = cp.course_id
            LEFT JOIN users u ON cp.professor_id = u.id
            GROUP BY c.id
            ORDER BY c.created_at DESC
        `, [req.user.id]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching professor courses' });
    }
};

exports.createCourse = async (req, res) => {
    try {
        const { name, code, description, credits, schedule_time, room, capacity, professor_ids } = req.body;

        const result = await db.query(
            `INSERT INTO courses 
        (name, code, description, credits, schedule_time, room, capacity) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
            [name, code, description, credits, schedule_time, room, capacity]
        );
        const newCourse = result.rows[0];

        let profsToAssign = professor_ids || [];
        if (req.user.role === 'PROFESSOR') {
            profsToAssign = [req.user.id];
        }

        if (profsToAssign.length > 0) {
            const values = profsToAssign.map((pid, idx) => `($1, $${idx + 2})`).join(', ');
            await db.query(`INSERT INTO course_professors (course_id, professor_id) VALUES ${values}`, [newCourse.id, ...profsToAssign]);
        }

        res.status(201).json({ message: 'Course created successfully', course: newCourse });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error creating course' });
    }
};

exports.updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, description, credits, schedule_time, room, capacity, professor_ids } = req.body;

        const result = await db.query(
            `UPDATE courses 
             SET name=$1, code=$2, description=$3, credits=$4, schedule_time=$5, room=$6, capacity=$7 
             WHERE id=$8 RETURNING *`,
            [name, code, description, credits, schedule_time, room, capacity, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }

        if (professor_ids !== undefined) {
            await db.query(`DELETE FROM course_professors WHERE course_id = $1`, [id]);
            if (professor_ids.length > 0) {
                const values = professor_ids.map((pid, idx) => `($1, $${idx + 2})`).join(', ');
                await db.query(`INSERT INTO course_professors (course_id, professor_id) VALUES ${values}`, [id, ...professor_ids]);
            }
        }

        res.json({ message: 'Course updated successfully', course: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error updating course' });
    }
};

exports.deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;

        // Ensure cascading deletes or delete enrollments first if not setup
        await db.query("BEGIN");
        await db.query("DELETE FROM enrollments WHERE course_id = $1", [id]);
        const result = await db.query("DELETE FROM courses WHERE id = $1 RETURNING id", [id]);
        await db.query("COMMIT");

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        await db.query("ROLLBACK");
        console.error(error);
        res.status(500).json({ error: 'Server error deleting course' });
    }
};

exports.getCourseStudents = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            `SELECT e.id as enrollment_id, u.student_id, u.first_name, u.last_name, u.email, u.major, u.year_of_study, e.status as enrollment_status, e.grade 
             FROM enrollments e 
             JOIN users u ON e.student_id = u.id 
             WHERE e.course_id = $1 
             ORDER BY e.status, u.last_name`,
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching course students' });
    }
};

exports.downloadCourseStudents = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            `SELECT u.student_id, u.first_name, u.last_name, u.email, u.major, u.year_of_study, e.status as enrollment_status 
             FROM enrollments e 
             JOIN users u ON e.student_id = u.id 
             WHERE e.course_id = $1 
             ORDER BY e.status, u.last_name`,
            [id]
        );

        let csv = 'Student ID,First Name,Last Name,Email,Major,Year of Study,Enrollment Status\n';
        result.rows.forEach(row => {
            csv += `${row.student_id},${row.first_name},${row.last_name},${row.email},${row.major},${row.year_of_study},${row.enrollment_status}\n`;
        });

        res.header('Content-Type', 'text/csv; charset=utf-8');
        res.attachment(`course_${id}_students.csv`);
        res.send('\uFEFF' + csv);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error generating students CSV' });
    }
};
