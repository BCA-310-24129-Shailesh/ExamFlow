const router = require('express').Router();
const { Exam } = require('../models');
const { requireAuth, requireAdmin } = require('../middleware');

router.get('/', requireAuth, async (req, res) => {
  try {
    const exams = await Exam.find().populate('subject', 'name code').sort({ createdAt: -1 });
    res.json({ success: true, exams });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('subject','name code').populate('questions');
    if (req.session.role !== 'admin' && new Date() < new Date(exam.startTime)) {
      return res.status(403).json({ success: false, message: 'Exam has not started yet' });
    }

    if (req.session.role === 'student') {
      req.session.startedExams = req.session.startedExams || {};
      const sessionStartedAt = req.session.startedExams[exam._id];
      const currentWindowStart = new Date(exam.startTime).getTime();
      if (!sessionStartedAt || sessionStartedAt < currentWindowStart) {
        req.session.startedExams[exam._id] = Date.now();
      }
    }

    let questions = [...exam.questions].filter(q => q != null);
    if (exam.shuffleQuestions) questions = questions.sort(() => Math.random() - 0.5);
    const sanitized = questions.map(q => ({ _id: q._id, text: q.text, options: q.options, marks: q.marks, difficulty: q.difficulty }));
    res.json({ 
      success: true, 
      exam: { ...exam.toObject(), questions: sanitized },
      serverStartTime: req.session.role === 'student' ? req.session.startedExams[exam._id] : null
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
router.post('/', requireAdmin, async (req, res) => {
  try {
    const exam = await Exam.create({ ...req.body, createdBy: req.session.userId });
    res.json({ success: true, exam });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, exam });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await Exam.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
module.exports = router;
