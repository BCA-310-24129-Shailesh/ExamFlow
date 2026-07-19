/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║           EXAMFLOW — Main Server Entry Point             ║
 * ║  Node.js + Express + MongoDB                             ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * HOW MONGODB CONNECTION WORKS:
 * 1. dotenv loads MONGO_URI from .env file
 * 2. mongoose.connect() creates the connection
 * 3. All route files use models.js which uses that connection
 */

const express    = require('express');
const mongoose   = require('mongoose');
const session    = require('express-session');
const MongoStore = require('connect-mongo');
const cors       = require('cors');
const path       = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') }); // Step 1: Load .env variables into process.env

const app = express();

// ════════════════════════════════════════════════════════════
//  STEP 2 — CONNECT TO MONGODB
//  mongoose.connect() takes the URI from .env and connects.
//  Once connected, all models (User, Exam, etc.) can query DB.
// ════════════════════════════════════════════════════════════
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('');
    console.log('  ✅  MongoDB connected successfully!');
    console.log(`  📦  Database: ${mongoose.connection.name}`);
    console.log(`  🌐  Host:     ${mongoose.connection.host}`);
    console.log('');
  })
  .catch((err) => {
    console.error('');
    console.error('  ❌  MongoDB connection FAILED!');
    console.error('  Error:', err.message);
    console.error('');
    console.error('  Troubleshooting:');
    console.error('  1. Is MongoDB running? Run: mongod');
    console.error('  2. Check MONGO_URI in your .env file');
    console.error('  3. For Atlas: check your IP whitelist');
    console.error('');
    process.exit(1); // Stop server if DB can't connect
  });

// Monitor connection events after initial connect
mongoose.connection.on('disconnected', () => console.warn('⚠️  MongoDB disconnected'));
mongoose.connection.on('reconnected',  () => console.log('🔄  MongoDB reconnected'));
mongoose.connection.on('error',        (err) => console.error('MongoDB error:', err));

// ════════════════════════════════════════════════════════════
//  STEP 3 — MIDDLEWARE
// ════════════════════════════════════════════════════════════
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve all static files (HTML, CSS, JS) from /public folder
app.use(express.static(path.join(__dirname, '../public')));

// Session stored IN MongoDB (so sessions survive server restarts)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    ttl: 60 * 60 * 24 // Sessions last 1 day
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day in milliseconds
    httpOnly: true
  }
}));

// ════════════════════════════════════════════════════════════
//  STEP 4 — API ROUTES
//  Each route file handles a specific feature area
// ════════════════════════════════════════════════════════════
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/admin',     require('./routes/admin'));
app.use('/api/student',   require('./routes/student'));
app.use('/api/subjects',  require('./routes/subjects'));
app.use('/api/exams',     require('./routes/exams'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/results',   require('./routes/results'));

// ════════════════════════════════════════════════════════════
//  STEP 5 — SERVE HTML PAGES
//  Express sends the HTML files; they load their own CSS & JS
// ════════════════════════════════════════════════════════════
app.get('/',          (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));
app.get(['/admin', '/admin/*'],     (req, res) => res.sendFile(path.join(__dirname, '../public/admin/index.html')));
app.get(['/student', '/student/*'], (req, res) => res.sendFile(path.join(__dirname, '../public/student/index.html')));

// 404 fallback
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ════════════════════════════════════════════════════════════
//  STEP 6 — START SERVER
// ════════════════════════════════════════════════════════════
const DEFAULT_PORT = 3000;
const START_PORT = Number(process.env.PORT) || DEFAULT_PORT;
const MAX_PORT_ATTEMPTS = process.env.NODE_ENV === 'production' ? 1 : 10;

function startServer(port, attempt = 1) {
  const server = app.listen(port, () => {
    console.log(`  🚀  Server running at: http://localhost:${port}`);
    console.log(`  📊  Admin Panel:       http://localhost:${port}/admin`);
    console.log(`  🎓  Student Portal:    http://localhost:${port}/student`);
    console.log('');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attempt < MAX_PORT_ATTEMPTS) {
      const nextPort = port + 1;
      console.warn('');
      console.warn(`  Port ${port} is already in use. Trying ${nextPort}...`);
      console.warn('');
      startServer(nextPort, attempt + 1);
      return;
    }

    if (err.code === 'EADDRINUSE') {
      console.error('');
      console.error(`  Port ${port} is already in use.`);
      console.error('  Close the other terminal running this app, or change PORT in .env.');
      console.error('');
      process.exit(1);
    }

    throw err;
  });
}

startServer(START_PORT);
