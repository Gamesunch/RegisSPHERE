const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const { authenticateToken, requireRole } = require('../middlewares/authMiddleware');

router.post('/', authenticateToken, requireRole(['STUDENT']), enrollmentController.enrollCourse);
router.get('/mine', authenticateToken, requireRole(['STUDENT']), enrollmentController.getMyEnrollments);

module.exports = router;
