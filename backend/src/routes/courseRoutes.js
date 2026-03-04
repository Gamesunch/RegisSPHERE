const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticateToken, requireRole } = require('../middlewares/authMiddleware');

router.get('/', authenticateToken, courseController.getAllCourses);
router.post('/', authenticateToken, requireRole(['ADMIN', 'PROFESSOR']), courseController.createCourse);

module.exports = router;
