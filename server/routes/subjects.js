const router = require('express').Router();
const { Subject } = require('../models');
const { requireAuth, requireAdmin } = require('../middleware');

router.get('/', requireAuth, async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ name: 1 });
    res.json({ success: true, subjects });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
router.post('/', requireAdmin, async (req, res) => {
  try {
    const subject = await Subject.create({ ...req.body, createdBy: req.user._id });
    res.json({ success: true, subject });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, subject });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
module.exports = router;
