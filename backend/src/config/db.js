const mongoose = require('mongoose');

const connectDB = async () => {
  if (process.env.USE_MOCK_DB === 'true') {
    console.log('==================================================');
    console.log('FORCE MOCK MODE: Initializing IN-MEMORY MOCK DATABASE.');
    console.log('==================================================');
    global.useMockDB = true;
    return;
  }

  const mongoURI = process.env.MONGO_URI || "mongodb://vakitisrihari90108_db_user:fraudshield123@ac-g7vavel-shard-00-00.1ncox4m.mongodb.net:27017,ac-g7vavel-shard-00-01.1ncox4m.mongodb.net:27017,ac-g7vavel-shard-00-02.1ncox4m.mongodb.net:27017/fraud_detection?ssl=true&authSource=admin&retryWrites=true&w=majority";
  
  console.log('Connecting to MongoDB...');
  try {
    // Set connection timeout to 3 seconds for quick local fallback
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 8000,
      family: 4
    });
    console.log('MongoDB database connected successfully.');
    global.useMockDB = false;
  } catch (error) {
    console.error('==================================================');
    console.error('DATABASE WARNING: Could not connect to MongoDB.');
    console.error(`Attempted URI: ${mongoURI}`);
    console.error('Error message:', error.message);
    console.error('Fallback Mode: Initializing IN-MEMORY MOCK DATABASE.');
    console.error('This allows the system to run locally without a database.');
    console.error('==================================================');
    global.useMockDB = true;
  }
};

module.exports = connectDB;
