const db = require('../config/db');

const GRADE_POINTS = {
    'A': 4.0, 'B+': 3.5, 'B': 3.0, 'C+': 2.5, 'C': 2.0, 'D+': 1.5, 'D': 1.0, 'F': 0.0
};

exports.getMyGrades = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT e.id as enrollment_id, e.grade, e.academic_year, e.semester,
                    c.code, c.name, c.credits
             FROM enrollments e
             JOIN courses c ON e.course_id = c.id
             WHERE e.student_id = $1 AND e.grade IS NOT NULL
             ORDER BY e.academic_year, e.semester, c.code`,
            [req.user.id]
        );

        // Group by academic year and semester
        const grouped = {};
        for (const row of result.rows) {
            const key = `${row.academic_year}-${row.semester}`;
            if (!grouped[key]) {
                grouped[key] = {
                    academic_year: row.academic_year,
                    semester: row.semester,
                    courses: [],
                    total_credits: 0,
                    total_grade_points: 0
                };
            }
            grouped[key].courses.push(row);
            const gp = GRADE_POINTS[row.grade] || 0;
            grouped[key].total_credits += row.credits;
            grouped[key].total_grade_points += gp * row.credits;
        }

        // Calculate GPA per semester and cumulative
        const semesters = Object.values(grouped).map(sem => ({
            ...sem,
            gpa: sem.total_credits > 0 ? (sem.total_grade_points / sem.total_credits).toFixed(2) : '0.00'
        }));

        // Cumulative
        let cumCredits = 0, cumGP = 0;
        for (const sem of semesters) {
            cumCredits += sem.total_credits;
            cumGP += sem.total_grade_points;
        }
        const gpax = cumCredits > 0 ? (cumGP / cumCredits).toFixed(2) : '0.00';

        res.json({ semesters, cumulative: { total_credits: cumCredits, gpax } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching grades' });
    }
};

exports.updateGrade = async (req, res) => {
    try {
        const { enrollmentId } = req.params;
        const { grade } = req.body;

        const checkCourse = await db.query(
            `SELECT cp.professor_id 
             FROM enrollments e 
             JOIN courses c ON e.course_id = c.id 
             LEFT JOIN course_professors cp ON c.id = cp.course_id AND cp.professor_id = $2
             WHERE e.id = $1`,
            [enrollmentId, req.user.id]
        );

        if (checkCourse.rows.length === 0) {
            return res.status(404).json({ error: 'Enrollment not found' });
        }

        if (!checkCourse.rows[0].professor_id) {
            return res.status(403).json({ error: 'You do not teach this course' });
        }

        const result = await db.query(
            `UPDATE enrollments SET grade = $1 WHERE id = $2 RETURNING *`,
            [grade, enrollmentId]
        );

        res.json({ message: 'Grade updated successfully', enrollment: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error updating grade' });
    }
};
