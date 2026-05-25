const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: false, default: null },  // null for Google OAuth users
  email: { type: String, required: true },
  role: { type: String, enum: ['admin', 'operator'], default: 'operator' },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  google_id: { type: String, default: null },
  avatar: { type: String, default: null },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  createdAt: { type: Date, default: Date.now }
});

const MongoUser = mongoose.model('User', UserSchema);

// In-memory mock storage
const mockUsers = [];

// Seed default admin in-memory
const seedDefaultAdmin = async () => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('admin123', salt);
  mockUsers.push({
    _id: 'usr_admin',
    username: 'admin',
    password: hashedPassword,
    email: 'admin@fraudshield.ai',
    role: 'admin',
    status: 'active',
    createdAt: new Date()
  });
};
seedDefaultAdmin();

class UserModel {
  static getMongoModel() {
    return MongoUser;
  }

  static async findOne(query) {
    if (!global.useMockDB) {
      try {
        const user = await MongoUser.findOne(query);
        if (user) return user;
      } catch (err) {
        console.log("Mongoose lookup failed, using mock fallback.");
      }
    }
    return mockUsers.find(u => {
      for (let key in query) {
        if (u[key] !== query[key]) return false;
      }
      return true;
    });
  }

  static async findById(id) {
    if (!global.useMockDB) {
      try {
        const user = await MongoUser.findById(id);
        if (user) return user;
      } catch (err) {
        console.log("Mongoose lookup failed, using mock fallback.");
      }
    }
    return mockUsers.find(u => u._id === id);
  }

  static async create(userData) {
    // Only hash password if one is provided (Google OAuth users have no password)
    let hashedPassword = null;
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(userData.password, salt);
    }
    
    if (!global.useMockDB) {
      try {
        const user = new MongoUser({
          ...userData,
          password: hashedPassword
        });
        return await user.save();
      } catch (err) {
        console.log("Mongoose save failed, saving to mock instead.");
      }
    }

    const newUser = {
      _id: 'usr_' + Math.random().toString(36).substr(2, 9),
      username: userData.username,
      password: hashedPassword,
      email: userData.email,
      role: userData.role || 'operator',
      status: userData.status || 'active',
      google_id: userData.google_id || null,
      avatar: userData.avatar || null,
      authProvider: userData.authProvider || 'local',
      createdAt: new Date()
    };
    mockUsers.push(newUser);
    return newUser;
  }

  // Upsert a Google OAuth user (find by google_id or email, create if not found)
  static async upsertGoogle({ google_id, email, name, avatar }) {
    // Try to find existing user by google_id first, then by email
    let user = await UserModel.findOne({ google_id });
    if (!user) user = await UserModel.findOne({ email });

    if (user) {
      // Update google_id and avatar if signing in via Google for first time
      if (!user.google_id) {
        const updateData = { google_id, avatar, authProvider: 'google' };
        user = await UserModel.findByIdAndUpdate(user._id, updateData, { new: true });
      }
      return user;
    }

    // Create new user from Google profile
    const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') + '_' + Math.random().toString(36).substr(2, 4);
    return await UserModel.create({
      username,
      email,
      password: null,  // no password for Google users
      google_id,
      avatar,
      authProvider: 'google',
      role: 'operator'
    });
  }

  static async comparePassword(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }

  static async findByIdAndUpdate(id, updateData, options = { new: true }) {
    let dataToUpdate = { ...updateData };
    if (dataToUpdate.password) {
      const salt = await bcrypt.genSalt(10);
      dataToUpdate.password = await bcrypt.hash(dataToUpdate.password, salt);
    }

    if (!global.useMockDB) {
      try {
        return await MongoUser.findByIdAndUpdate(id, dataToUpdate, options);
      } catch (err) {
        console.log("Mongoose update failed, using mock fallback.");
      }
    }

    const index = mockUsers.findIndex(u => u._id === id);
    if (index !== -1) {
      mockUsers[index] = { ...mockUsers[index], ...dataToUpdate };
      return mockUsers[index];
    }
    return null;
  }

  static async find(query = {}) {
    if (!global.useMockDB) {
      try {
        return await MongoUser.find(query);
      } catch (err) {}
    }
    return mockUsers;
  }
}

module.exports = UserModel;
