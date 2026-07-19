/**
 * Route protection middleware.
 * These functions run BEFORE route handlers to check if the user is logged in.
 */
const { User } = require('./models');

// Check if any user is logged in
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Please login to continue' });
  }
  next();
};

// Check if logged-in user is an Admin
const requireAdmin = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  try {
    const user = await User.findById(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Check if logged-in user is a Student
const requireStudent = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  try {
    const user = await User.findById(req.session.userId);
    if (!user || user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Student access required' });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { requireAuth, requireAdmin, requireStudent };
