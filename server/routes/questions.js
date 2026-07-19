const router = require('express').Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Question, Exam } = require('../models');
const { requireAuth, requireAdmin } = require('../middleware');

router.get('/', requireAdmin, async (req, res) => {
  try {
    const filter = req.query.subject ? { subject: req.query.subject } : {};
    const questions = await Question.find(filter).populate('subject', 'name code').sort({ createdAt: -1 });
    res.json({ success: true, questions });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
router.post('/', requireAdmin, async (req, res) => {
  try {
    const attachToSubjectExams = req.body.attachToSubjectExams;
    const createBody = { ...req.body };
    delete createBody.attachToSubjectExams;

    const q = await Question.create({ ...createBody, createdBy: req.user._id });
    if (attachToSubjectExams) {
      await syncQuestionToSubjectExams(q);
    }
    res.json({ success: true, question: q });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});
async function syncQuestionToSubjectExams(question, oldMarks = null) {
  const exams = await Exam.find({
    $or: [
      { subject: question.subject },
      { questions: question._id }
    ]
  });

  await Promise.all(exams.map(async (exam) => {
    const existing = new Set(exam.questions.map(id => id.toString()));
    const hasQuestion = existing.has(question._id.toString());

    if (hasQuestion) {
      if (oldMarks !== null && question.marks !== oldMarks) {
        exam.totalMarks = (exam.totalMarks || 0) + (question.marks - oldMarks);
        await exam.save();
      }
      return;
    }

    if (question.subject && exam.subject?.toString() === question.subject.toString()) {
      exam.questions.push(question._id);
      exam.totalMarks = (exam.totalMarks || 0) + (question.marks || 1);
      await exam.save();
    }
  }));
}

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const attachToSubjectExams = req.body.attachToSubjectExams;
    const oldQuestion = attachToSubjectExams ? await Question.findById(req.params.id) : null;
    const updateBody = { ...req.body };
    delete updateBody.attachToSubjectExams;

    const q = await Question.findByIdAndUpdate(req.params.id, updateBody, { new: true });

    if (attachToSubjectExams && q) {
      await syncQuestionToSubjectExams(q, oldQuestion?.marks ?? null);
    }

    res.json({ success: true, question: q });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/generate-ai', requireAdmin, async (req, res) => {
  try {
    const { Subject } = require('../models');
    const { subject: subjectId, count } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ success: false, message: 'GEMINI_API_KEY is not configured in the server environment.' });
    }

    const subjectObj = await Subject.findById(subjectId);
    if (!subjectObj) return res.status(404).json({ success: false, message: 'Subject not found' });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelNames = ['gemini-flash-latest', 'gemini-2.5-flash-lite', 'gemini-2.5-flash'];
    const prompt = `Generate exactly ${Math.min(count, 20)} multiple choice questions for the subject "${subjectObj.name} (${subjectObj.code})".
Use only subject-specific content and do not generate questions for unrelated topics.
Return strictly a JSON array of objects. Do not include markdown blocks like \`\`\`json.
Each object MUST have:
"text": string (the question)
"options": array of exactly 4 strings
"correctAnswer": integer (0, 1, 2, or 3 representing the index of the correct option)
"difficulty": string (either "easy", "medium", or "hard")`;

    let content = null;
    let lastError = null;
    for (let i = 0; i < modelNames.length; i += 1) {
      const modelName = modelNames[i];
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        content = response.text().trim();
        if (content) break;
      } catch (err) {
        lastError = err;
        console.warn(`Gemini model ${modelName} failed:`, err.message || err);
        if (i === modelNames.length - 1) {
          throw err;
        }
      }
    }
    if (content === null) {
      console.error('All Gemini models failed to generate content.', lastError);
      return res.status(503).json({ success: false, message: 'AI generation is currently unavailable. Please try again later.' });
    }

    // Strip markdown blocks if the AI ignored instructions
    if (content.startsWith('\`\`\`json')) content = content.substring(7);
    if (content.startsWith('\`\`\`')) content = content.substring(3);
    if (content.endsWith('\`\`\`')) content = content.substring(0, content.length - 3);

    let parsedQuestions;
    try {
      parsedQuestions = JSON.parse(content);
    } catch (err) {
      console.error('JSON Parse Error. Raw output:', content);
      return res.status(500).json({ success: false, message: 'Gemini returned invalid JSON format.' });
    }

    if (!Array.isArray(parsedQuestions)) {
      return res.status(500).json({ success: false, message: 'Gemini did not return an array.' });
    }

    // Insert into database
    const toInsert = parsedQuestions.map(q => ({
      subject: subjectId,
      text: q.text,
      options: q.options,
      correctAnswer: q.correctAnswer,
      marks: 1,
      difficulty: q.difficulty || 'medium',
      createdBy: req.session.userId
    }));

    const inserted = await Question.insertMany(toInsert);

    const exams = await Exam.find({ subject: subjectId });
    await Promise.all(exams.map(async (exam) => {
      const existing = new Set(exam.questions.map(id => id.toString()));
      const newQuestions = inserted.filter(q => !existing.has(q._id.toString()));
      if (!newQuestions.length) return;
      exam.questions.push(...newQuestions.map(q => q._id));
      exam.totalMarks = (exam.totalMarks || 0) + newQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
      await exam.save();
    }));

    res.json({ success: true, insertedCount: inserted.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
