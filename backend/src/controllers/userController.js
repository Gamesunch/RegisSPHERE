const db = require('../config/db');

exports.getProfessors = async (req, res) => {
    try {
        const result = await db.query(
            "SELECT id, first_name, last_name, email FROM users WHERE role = 'PROFESSOR' ORDER BY last_name ASC"
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching professors' });
    }
};
