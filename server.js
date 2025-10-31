const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// CORS middleware - Production ready
const allowedOrigins = [
  'http://localhost:5173', 
  'http://localhost:3000',
  'https://cloudbase-frontend-nezdfsqn3-chaitanya-sonars-projects.vercel.app/',
  process.env.FRONTEND_URL
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// Body parser middleware
app.use(express.json());

// Import and use routes
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const jobRoutes = require('./src/routes/job.routes');
const applicationRoutes = require('./src/routes/application.routes');
const messageRoutes = require('./src/routes/message.routes');
const externalJobsRoutes = require('./src/routes/externalJobs.routes');

// Use routes with error handling
const mountRoute = (path, router) => {
  try {
    app.use(path, router);
    console.log(`✅ Route mounted successfully: ${path}`);
  } catch (error) {
    console.error(`❌ Error mounting route ${path}:`, error);
  }
};

mountRoute('/api/auth', authRoutes);
mountRoute('/api/users', userRoutes);
mountRoute('/api/jobs', jobRoutes);
mountRoute('/api/applications', applicationRoutes);
mountRoute('/api/messages', messageRoutes);
mountRoute('/api/external-jobs', externalJobsRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Campus Placement & Recruitment Portal API is running',
    status: 'success',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      jobs: '/api/jobs',
      applications: '/api/applications',
      messages: '/api/messages',
      externalJobs: '/api/external-jobs',
      test: '/api/test'
    }
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API test successful!',
    status: 'success',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// Start server first, then connect to MongoDB
const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Connect to MongoDB after server is running
  console.log('🔄 Attempting to connect to MongoDB...');
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('✅ Connected to MongoDB');
      console.log(`📊 Database: ${mongoose.connection.name}`);
    })
    .catch((err) => {
      console.error('❌ MongoDB connection error:', err.message);
      // Server will continue running even if MongoDB connection fails
    });
});