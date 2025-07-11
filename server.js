const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const searchRoutes = require('./routes/search'); // ✅ NEW: Import search route

dotenv.config(); // Load .env variables

const app = express();

// Middleware to parse incoming JSON
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/jobboard', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

// Routes
app.use('/auth', authRoutes);         // Existing auth routes
app.use('/jobs', searchRoutes);       // ✅ NEW: Search route under /jobs



module.exports = app; // ✅ Required for Supertest to work with Jest
