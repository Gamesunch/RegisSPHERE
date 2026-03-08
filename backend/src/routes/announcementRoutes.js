const express = require('express');
const router = express.Router({ mergeParams: true });
const announcementController = require('../controllers/announcementController');
const { authenticateToken, requireRole } = require('../middlewares/authMiddleware');

// Base route is /api/courses/:courseId/announcements (or similar if mounted there)
// But let's build standard routes

router.get('/course/:courseId', authenticateToken, announcementController.getCourseAnnouncements);
router.post('/course/:courseId', authenticateToken, requireRole(['PROFESSOR']), announcementController.createAnnouncement);

module.exports = router;
