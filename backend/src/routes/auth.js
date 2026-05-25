const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Public routes
router.post('/check-email', AuthController.checkEmail); // Smart email detection
router.post('/register', AuthController.register);
router.post('/login', authLimiter, AuthController.login);
router.post('/google', AuthController.googleAuth);


// Secure details route
router.get('/me', verifyToken, AuthController.getMe);
router.put('/profile', verifyToken, AuthController.updateProfile);

module.exports = router;
