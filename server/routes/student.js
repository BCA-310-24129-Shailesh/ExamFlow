const router = require('express').Router();
const { User } = require('../models');
const { requireAuth } = require('../middleware');

function validatePhoneNumber(phone) {
  if (!phone) return { error: null, value: undefined };
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

router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select('-password');
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { name, department, rollNumber, phoneNumber } = req.body;
    const phoneResult = validatePhoneNumber(phoneNumber);
    if (phoneResult.error) {
      return res.status(400).json({ success: false, message: phoneResult.error });
    }
    if (rollNumber && rollNumber.trim()) {
      const existingRoll = await User.findOne({ rollNumber: rollNumber.trim(), _id: { $ne: req.session.userId } });
      if (existingRoll) {
        return res.status(400).json({ success: false, message: 'Roll number is already taken.' });
      }
    }
    const updates = { name, department, rollNumber: rollNumber?.trim() };
    if (phoneNumber !== undefined) updates.phoneNumber = phoneResult.value || '';
    const user = await User.findByIdAndUpdate(req.session.userId, updates, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
module.exports = router;
