const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middlewares/authMiddleware');

router.get('/professors', authenticateToken, requireRole(['ADMIN']), userController.getProfessors);

module.exports = router;
