require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// CORS Configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com', 'https://www.your-frontend-domain.com'] 
    : 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Handle preflight requests
app.options('*', cors(corsOptions));

// Connect to MongoDB
connectDB();

// Debug: Log every request
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.originalUrl}`);
  next();
});

// Routes
app.get('/', (req, res) => {
    res.send('Student Management System API');
});
app.use('/api/auth', require('./routes/auth'));
app.use('/api/marks', require('./routes/marks'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/subject', require('./routes/subject'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/student', require('./routes/student'));
app.use('/api/student-registration', require('./routes/studentRegistration'));
app.use('/api/report', require('./routes/report'));
app.use('/api/notification', require('./routes/notification'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/import', require('./routes/import'));
app.use('/api/admin/dashboard', require('./routes/dashboard'));

// --- DEBUG TEST ROUTE ---
app.get('/api/debug/error', (req, res) => {
  throw new Error('This is a test error!');
});

// Error handling middleware (guaranteed to catch all errors)
app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR HANDLER]', err);
  if (res.headersSent) return next(err);
  res.status(500).json({
    message: 'Global error handler caught an error',
    error: err.message,
    stack: err.stack,
    received: req.body
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
