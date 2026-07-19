const router = require('express').Router();
const { Result, Exam } = require('../models');
const { requireAuth } = require('../middleware');

router.post('/submit', requireAuth, async (req, res) => {
  try {
    const { examId, answers, startedAt, timeTaken } = req.body;
    const exam = await Exam.findById(examId).populate('questions');
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    const existing = await Result.findOne({
      student: req.session.userId,
      exam: examId,
      submittedAt: { $gte: exam.startTime }
    });
    if (existing) return res.status(400).json({ success: false, message: 'Already submitted' });
    let obtainedMarks = 0;
    const questionsList = exam.questions.filter(q => q != null);
    const processedAnswers = questionsList.map(q => {
      const selected = answers[q._id.toString()];
      const isCorrect = selected !== undefined && selected !== null && Number(selected) === q.correctAnswer;
      const marksObtained = isCorrect ? q.marks : 0;
      obtainedMarks += marksObtained;
      return { question: q._id, selectedOption: selected !== undefined ? Number(selected) : null, isCorrect, marksObtained };
    });
    const percentage = exam.totalMarks > 0 ? Math.round((obtainedMarks / exam.totalMarks) * 100) : 0;
    
    // Secure time calculation
    const currentWindowStart = new Date(exam.startTime).getTime();
    const sessionStart = req.session.startedExams?.[examId] >= currentWindowStart
      ? req.session.startedExams[examId]
      : null;
    const actualTimeTaken = sessionStart ? Math.floor((Date.now() - sessionStart) / 1000) : timeTaken;
    const actualStartedAt = sessionStart ? new Date(sessionStart) : new Date(startedAt);

    const result = await Result.create({
      student: req.session.userId, exam: examId, answers: processedAnswers,
      totalMarks: exam.totalMarks, obtainedMarks, percentage,
      isPassed: obtainedMarks >= exam.passingMarks,
      timeTaken: actualTimeTaken, startedAt: actualStartedAt,
      autoSubmitted: Boolean(req.body.autoSubmitted),
      autoSubmitReason: req.body.autoSubmitReason || ''
    });
    res.json({ success: true, result: { obtainedMarks, totalMarks: exam.totalMarks, percentage, isPassed: result.isPassed }, resultId: result._id });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/my', requireAuth, async (req, res) => {
  try {
    const results = await Result.find({ student: req.session.userId })
      .populate({ path: 'exam', populate: { path: 'subject', select: 'name code' } })
      .sort({ submittedAt: -1 });
    res.json({ success: true, results });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate({ path: 'exam', populate: [{ path: 'subject', select: 'name' }, { path: 'questions' }] })
      .populate('student', 'name email rollNumber');
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
    if (req.session.role !== 'admin' && result.student._id.toString() !== req.session.userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to result' });
    }
    res.json({ success: true, result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
module.exports = router;
