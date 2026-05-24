const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, enum: ['admin', 'operator'], default: 'operator' },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
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
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
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
      createdAt: new Date()
    };
    mockUsers.push(newUser);
    return newUser;
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
