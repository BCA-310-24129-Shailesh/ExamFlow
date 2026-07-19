/**
 * AUTH ROUTES — /api/auth
 * Includes server-side validation mirroring the frontend Rules.
 */
const router = require('express').Router();
const { User } = require('../models');

/* ── Server-side validation helpers ── */
function validateName(name) {
  if (!name || !name.trim()) return 'Name is required.';
  const v = name.trim();
  if (/^\d/.test(v))        return 'Name cannot start with a number.';
  if (/^[^a-zA-Z]/.test(v)) return 'Name must start with a letter.';
  if (v.length < 2)         return 'Name must be at least 2 characters.';
  if (v.length > 60)        return 'Name must be under 60 characters.';
  if (/[^a-zA-Z\s'\-.]/.test(v)) return "Name may only contain letters, spaces, hyphens, apostrophes, or dots.";
  return null;
}
function validateEmail(email) {
  if (!email || !email.trim()) return 'Email is required.';
  const re = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  if (!re.test(email.trim())) return 'Enter a valid email address.';
  return null;
}
function validatePassword(password) {
  if (!password)           return 'Password is required.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  if (password.length > 64) return 'Password must be under 64 characters.';
  return null;
}
function validateRollNumber(roll) {
  if (!roll) return null; // optional
  if (roll.length < 3)  return 'Roll number is too short.';
  if (roll.length > 20) return 'Roll number is too long.';
  if (/[^a-zA-Z0-9\-_]/.test(roll)) return 'Roll number may only contain letters, digits, hyphens, or underscores.';
  return null;
}
function validateDepartment(dept) {
  if (!dept) return null; // optional
  if (/^\d/.test(dept)) return 'Department name cannot start with a number.';
  if (dept.length < 2)  return 'Department name is too short.';
  if (dept.length > 60) return 'Department name is too long.';
  return null;
}
function validatePhoneNumber(phone) {
  if (!phone) return { error: null, value: undefined }; // optional
  const trimmed = String(phone).trim();

  if (/^\+91[6-9]\d{9}$/.test(trimmed)) {
    return { error: null, value: trimmed };
  }
  if (/^[6-9]\d{9}$/.test(trimmed)) {
    return { error: null, value: `+91${trimmed}` };
  }
  if (/^(\+91)?[0-5]\d{9}$/.test(trimmed)) {
    return { error: 'Indian mobile numbers must start with 6, 7, 8, or 9.', value: null };
  }
  if (/^\+/.test(trimmed)) {
    return { error: 'Use a valid Indian mobile number in E.164 format (e.g. +919876543210).', value: null };
  }
  if (/\D/.test(trimmed)) {
    return { error: 'Phone number may contain only digits, or +91 followed by 10 digits.', value: null };
  }
  if (trimmed.length !== 10) {
    return { error: 'Phone number must be exactly 10 digits.', value: null };
  }
  return { error: 'Indian mobile numbers must start with 6, 7, 8, or 9.', value: null };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phoneNumber, rollNumber, department } = req.body;

    // Server-side validation
    const errors = [];
    const nameErr = validateName(name);       if (nameErr)     errors.push(nameErr);
    const emailErr = validateEmail(email);    if (emailErr)    errors.push(emailErr);
    const passErr = validatePassword(password); if (passErr)   errors.push(passErr);
    const phoneResult = validatePhoneNumber(phoneNumber);
    if (phoneResult.error) errors.push(phoneResult.error);
    if (role === 'student') {
      const rollErr = validateRollNumber(rollNumber); if (rollErr) errors.push(rollErr);
      const deptErr = validateDepartment(department); if (deptErr) errors.push(deptErr);
    }
    if (!['admin','student'].includes(role))  errors.push('Invalid role.');
    if (errors.length) return res.status(400).json({ success: false, message: errors[0] });

    if (role === 'admin') {
      const adminSecret = (req.body.adminSecret || '').trim();
      const serverSecret = (process.env.ADMIN_SECRET || '').trim();
      if (!serverSecret) {
        return res.status(500).json({ success: false, message: 'Server misconfiguration: admin secret not set.' });
      }
      if (adminSecret !== serverSecret) {
        return res.status(403).json({ success: false, message: 'Invalid Admin Secret Key. Access denied.' });
      }
    }

    const exists = await User.findOne({ email: email.trim().toLowerCase() });
    if (exists) return res.status(400).json({ success: false, message: 'This email is already registered. Please sign in.' });

    if (role === 'student' && rollNumber && rollNumber.trim()) {
      const rollExists = await User.findOne({ rollNumber: rollNumber.trim() });
      if (rollExists) return res.status(400).json({ success: false, message: 'Roll number is already taken.' });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: role||'student',
      phoneNumber: phoneResult.value,
      rollNumber: rollNumber?.trim(),
      department: department?.trim()
    });
    req.session.userId = user._id;
    req.session.role   = user.role;
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const emailErr = validateEmail(email);
    if (emailErr) return res.status(400).json({ success: false, message: emailErr });
    if (!password) return res.status(400).json({ success: false, message: 'Password is required.' });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(400).json({ success: false, message: 'No account found with this email.' });
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact admin.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Incorrect password. Please try again.' });

    req.session.userId = user._id;
    req.session.role   = user.role;
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    const emailErr = validateEmail(email);
    if (emailErr) return res.status(400).json({ success: false, message: emailErr });
    const passErr = validatePassword(password);
    if (passErr) return res.status(400).json({ success: false, message: passErr });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'No account found with this email.' });
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact admin.' });

    user.password = password;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully. You can now sign in.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {});
  res.clearCookie('connect.sid');
  res.json({ success: true });
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  if (!req.session.userId) return res.json({ success: false });
  try {
    const user = await User.findById(req.session.userId).select('-password');
    if (!user) return res.json({ success: false });
    res.json({ success: true, user });
  } catch { res.json({ success: false }); }
});

module.exports = router;
