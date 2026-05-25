const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const UserModel = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


class AuthController {
  static async register(req, res) {
    const { username, password, email, role } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ success: false, message: 'Please provide username, email, and password.' });
    }

    try {
      // Check if user already exists
      const existingUser = await UserModel.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Username is already taken.' });
      }

      const existingEmail = await UserModel.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email is already registered.' });
      }

      // Create new user (Role can only be admin if requested and permitted, or fallback to operator)
      const user = await UserModel.create({
        username,
        password,
        email,
        role: role || 'operator'
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully.',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Registration error:', error.message);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }

  static async login(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username/email and password.' });
    }

    try {
      const isEmail = username.includes('@');
      const searchKey = isEmail ? { email: username } : { username };
      const user = await UserModel.findOne(searchKey);
      if (!user) {
        return res.status(400).json({ success: false, message: 'Invalid username, email, or password.' });
      }

      // Check password
      const isMatch = await UserModel.comparePassword(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Invalid username, email, or password.' });
      }

      if (user.status === 'suspended') {
        return res.status(403).json({ success: false, message: 'Your account has been suspended.' });
      }

      // Generate JWT Token
      const token = jwt.sign(
        { id: user._id, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(200).json({
        success: true,
        message: 'Login successful.',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error.message);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }

  static async getMe(req, res) {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.status(200).json({
        success: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }

  static async updateProfile(req, res) {
    const { username, email, password } = req.body;
    const userId = req.user.id;

    try {
      const currentUser = await UserModel.findById(userId);
      if (!currentUser) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const updateData = {};

      if (username && username !== currentUser.username) {
        if (username.length < 3) {
          return res.status(400).json({ success: false, message: 'Username must be at least 3 characters long.' });
        }
        const existingUser = await UserModel.findOne({ username });
        if (existingUser && existingUser._id.toString() !== userId.toString()) {
          return res.status(400).json({ success: false, message: 'Username is already taken.' });
        }
        updateData.username = username;
      }

      if (email && email !== currentUser.email) {
        const existingEmail = await UserModel.findOne({ email });
        if (existingEmail && existingEmail._id.toString() !== userId.toString()) {
          return res.status(400).json({ success: false, message: 'Email is already registered.' });
        }
        updateData.email = email;
      }

      if (password) {
        if (password.length < 8) {
          return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
        }
        updateData.password = password;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No changes detected.',
          user: {
            id: currentUser._id,
            username: currentUser.username,
            email: currentUser.email,
            role: currentUser.role,
            status: currentUser.status,
            createdAt: currentUser.createdAt
          }
        });
      }

      const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, { new: true });
      
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        user: {
          id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role,
          status: updatedUser.status,
          createdAt: updatedUser.createdAt
        }
      });
    } catch (error) {
      console.error('Update profile error:', error.message);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }
  static async googleAuth(req, res) {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential (id_token) is required.' });
    }

    try {
      // Verify the id_token JWT using Google's OAuth2Client
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return res.status(401).json({ success: false, message: 'Invalid Google token payload.' });
      }

      const { sub: google_id, email, name, picture: avatar } = payload;

      if (!email) {
        return res.status(400).json({ success: false, message: 'Could not retrieve email from Google account.' });
      }

      // Upsert user in DB (find by google_id or email, create if not found)
      const user = await UserModel.upsertGoogle({ google_id, email, name, avatar });

      if (!user) {
        return res.status(500).json({ success: false, message: 'Failed to create or find user account.' });
      }

      if (user.status === 'suspended') {
        return res.status(403).json({ success: false, message: 'Your account has been suspended.' });
      }

      // Issue FraudShield JWT
      const token = jwt.sign(
        { id: user._id, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        success: true,
        message: 'Google login successful.',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          authProvider: 'google'
        }
      });
    } catch (error) {
      console.error('Google auth error:', error.message);
      return res.status(401).json({ success: false, message: 'Google authentication failed. Invalid or expired token.' });
    }
  }
}

module.exports = AuthController;

