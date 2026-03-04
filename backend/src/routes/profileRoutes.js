const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../middlewares/authMiddleware');
const profileController = require('../controllers/profileController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        // Create unique filename: userId_timestamp.extension
        const ext = path.extname(file.originalname);
        const filename = `profile_${req.user.id}_${Date.now()}${ext}`;
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// Routes
router.get('/', authenticateToken, profileController.getProfile);
router.put('/', authenticateToken, profileController.updateProfile);
router.post('/picture', authenticateToken, upload.single('profilePicture'), profileController.uploadProfilePicture);

module.exports = router;
