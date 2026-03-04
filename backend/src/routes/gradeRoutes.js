const express = require('express');
const router = express.Router();
const { getMyGrades } = require('../controllers/gradeController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/mine', authenticate, authorize('STUDENT'), getMyGrades);

module.exports = router;
