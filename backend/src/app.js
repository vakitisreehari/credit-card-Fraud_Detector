const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const analyticRoutes = require('./routes/analytics');
const ruleRoutes = require('./routes/rules');
const chatRoutes = require('./routes/chat');
const TransactionModel = require('./models/Transaction');

const app = express();

// Set security headers — allow Google OAuth iframes & scripts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'", "'unsafe-inline'", "https://accounts.google.com", "https://apis.google.com"],
      frameSrc:       ["'self'", "https://accounts.google.com"],
      connectSrc:     ["'self'", "https://accounts.google.com", "https://oauth2.googleapis.com", "https://openidconnect.googleapis.com", "https://generativelanguage.googleapis.com"],
      imgSrc:         ["'self'", "data:", "https://lh3.googleusercontent.com"],
      styleSrc:       ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:        ["'self'", "https://fonts.gstatic.com"],
    }
  },
  crossOriginEmbedderPolicy: false,  // needed for Google OAuth popup
}));

// Enable CORS
app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Request Logging
app.use(morgan('dev'));

// Parse JSON payloads
app.use(express.json());

// Register TLS JA3 Handshake Bot Shield Middleware globally
const ja3FingerprintMiddleware = require('./middleware/ja3FingerprintMiddleware');
app.use(ja3FingerprintMiddleware);

// Initialize Database & Mock fallback loader
const initializeApp = async () => {
  await connectDB();

  // If in database fallback mode, load pre-seeded mock transactions from file
  if (global.useMockDB) {
    const backupPath = path.join(__dirname, 'mock_transactions_seed.json');
    if (fs.existsSync(backupPath)) {
      try {
        const raw = fs.readFileSync(backupPath, 'utf8');
        const transactions = JSON.parse(raw);
        TransactionModel.setMockData(transactions);
        console.log(`Loaded ${transactions.length} mock transactions from JSON backup.`);
      } catch (err) {
        console.error('Failed to load mock transactions backup:', err.message);
      }
    } else {
      console.log('No mock transactions JSON backup found. Run seeder to pre-populate mock data.');
    }
  }
};

initializeApp();

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    databaseFallback: global.useMockDB ? 'IN-MEMORY MOCK' : 'MONGODB'
  });
});

// Routing
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/analytics', analyticRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/chat', chatRoutes);

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Resource not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

module.exports = app;
