const express = require('express');
const router = express.Router();
const { getMyGrades, updateGrade } = require('../controllers/gradeController');
const { authenticateToken, requireRole } = require('../middlewares/authMiddleware');

router.get('/mine', authenticateToken, requireRole(['STUDENT']), getMyGrades);
router.put('/:enrollmentId', authenticateToken, requireRole(['PROFESSOR']), updateGrade);

module.exports = router;
