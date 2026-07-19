  const router = require('express').Router();
  const { User, Exam, Subject, Result } = require('../models');
  const { requireAdmin } = require('../middleware');

  // GET /api/admin/dashboard
  router.get('/dashboard', requireAdmin, async (req, res) => {
    try {
      const [students, exams, subjects, results] = await Promise.all([
        User.countDocuments({ role: 'student' }),
        Exam.countDocuments(),
        Subject.countDocuments(),
        Result.countDocuments()
      ]);
      const recentResults = await Result.find()
        .populate('student', 'name rollNumber')
        .populate({ path: 'exam', select: 'title subject', populate: { path: 'subject', select: 'name code' } })
        .sort({ submittedAt: -1 }).limit(6);
      const performanceExamWindow = { startTime: { $lte: new Date() } };
      const performanceResults = await Result.find()
        .populate({
          path: 'exam',
          match: performanceExamWindow,
          select: 'title subject startTime endTime',
          populate: { path: 'subject', select: 'name code' }
        })
        .sort({ submittedAt: -1 });
      const performanceExams = await Exam.find(performanceExamWindow)
        .populate('subject', 'name code')
        .sort({ startTime: -1 });
      const upcomingExams = await Exam.find({ startTime: { $gt: new Date() } })
        .populate('subject', 'name code')
        .sort({ startTime: 1 }).limit(5);
      res.json({
        success: true,
        stats: { students, exams, subjects, results },
        recentResults,
        performanceResults: performanceResults.filter(r => r.exam),
        performanceExams,
        upcomingExams
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // GET /api/admin/students
  router.get('/students', requireAdmin, async (req, res) => {
    try {
      const students = await User.find({ role: 'student' }).select('-password').sort({ createdAt: -1 });
      res.json({ success: true, students });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // PATCH /api/admin/students/:id/toggle
  router.patch('/students/:id/toggle', requireAdmin, async (req, res) => {
    try {
      const student = await User.findById(req.params.id);
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
      student.isActive = !student.isActive;
      await student.save();
      res.json({ success: true, isActive: student.isActive });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // DELETE /api/admin/students/:id
  router.delete('/students/:id', requireAdmin, async (req, res) => {
    try {
      await User.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: 'Student deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // GET /api/admin/results
  router.get('/results', requireAdmin, async (req, res) => {
    try {
      const results = await Result.find()
        .populate('student', 'name email rollNumber department')
        .populate({ path: 'exam', populate: { path: 'subject', select: 'name code' } })
        .sort({ submittedAt: -1 });
      res.json({ success: true, results });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  module.exports = router;
