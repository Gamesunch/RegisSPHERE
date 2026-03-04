const db = require('../config/db');

exports.getAllCourses = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT c.*, u.first_name AS prof_first, u.last_name AS prof_last 
       FROM courses c 
       LEFT JOIN users u ON c.professor_id = u.id`
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching courses' });
    }
};

exports.createCourse = async (req, res) => {
    try {
        const { name, code, description, credits, schedule_time, room, capacity } = req.body;
        // Assume req.user is an ADMIN or PROFESSOR creating their own course
        const professor_id = req.user.role === 'PROFESSOR' ? req.user.id : req.body.professor_id;

        const result = await db.query(
            `INSERT INTO courses 
        (name, code, description, professor_id, credits, schedule_time, room, capacity) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
            [name, code, description, professor_id, credits, schedule_time, room, capacity]
        );

        res.status(201).json({ message: 'Course created successfully', course: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error creating course' });
    }
};
