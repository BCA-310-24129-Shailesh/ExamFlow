/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║              EXAMFLOW — MongoDB Models                   ║
 * ║                                                          ║
 * ║  HOW THIS WORKS:                                         ║
 * ║  • Each Schema defines the shape of a MongoDB document   ║
 * ║  • mongoose.model() creates a Model (a class) that       ║
 * ║    maps to a MongoDB collection                          ║
 * ║  • Collection names are auto-pluralized:                 ║
 * ║    'User' → users collection                             ║
 * ║    'Exam' → exams collection                             ║
 * ╚══════════════════════════════════════════════════════════╝
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ─────────────────────────────────────────────────────────────
//  USER MODEL  →  MongoDB collection: "users"
// ─────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:   { type: String, required: true },
  role:       { type: String, enum: ['admin', 'student'], default: 'student' },
  rollNumber: { type: String, trim: true },
  department: { type: String, trim: true },
  phoneNumber: { type: String, trim: true },
  isActive:   { type: Boolean, default: true },
  createdAt:  { type: Date, default: Date.now }
});

// Hash password automatically before saving to MongoDB
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); // Only hash if password changed
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to check password on login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─────────────────────────────────────────────────────────────
//  SUBJECT MODEL  →  MongoDB collection: "subjects"
// ─────────────────────────────────────────────────────────────
const subjectSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  code:        { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, default: '' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt:   { type: Date, default: Date.now }
});

// ─────────────────────────────────────────────────────────────
//  QUESTION MODEL  →  MongoDB collection: "questions"
// ─────────────────────────────────────────────────────────────
const questionSchema = new mongoose.Schema({
  subject:       { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  text:          { type: String, required: true, trim: true },
  options:       [{ type: String, required: true }], // Array of 4 option strings
  correctAnswer: { type: Number, required: true, min: 0, max: 3 }, // Index 0-3
  marks:         { type: Number, default: 1, min: 1 },
  difficulty:    { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt:     { type: Date, default: Date.now }
});

// ─────────────────────────────────────────────────────────────
//  EXAM MODEL  →  MongoDB collection: "exams"
// ─────────────────────────────────────────────────────────────
const examSchema = new mongoose.Schema({
  title:            { type: String, required: true, trim: true },
  subject:          { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  questions:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  duration:         { type: Number, required: true }, // in minutes
  totalMarks:       { type: Number, default: 0 },
  passingMarks:     { type: Number, required: true },
  startTime:        { type: Date, required: true },
  endTime:          { type: Date, required: true },
  instructions:     { type: String, default: '' },
  shuffleQuestions: { type: Boolean, default: false },
  isActive:         { type: Boolean, default: true },
  createdBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt:        { type: Date, default: Date.now }
});

// ─────────────────────────────────────────────────────────────
//  RESULT MODEL  →  MongoDB collection: "results"
// ─────────────────────────────────────────────────────────────
const resultSchema = new mongoose.Schema({
  student:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  exam:         { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  answers: [{
    question:       { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    selectedOption: { type: Number, default: null }, // null = skipped
    isCorrect:      { type: Boolean, default: false },
    marksObtained:  { type: Number, default: 0 }
  }],
  totalMarks:    { type: Number },
  obtainedMarks: { type: Number },
  percentage:    { type: Number },
  isPassed:      { type: Boolean },
  timeTaken:     { type: Number }, // seconds
  startedAt:     { type: Date },
  autoSubmitted:     { type: Boolean, default: false },
  autoSubmitReason:  { type: String, default: '' },
  submittedAt:   { type: Date, default: Date.now }
});

// Export all models
module.exports = {
  User:     mongoose.model('User',     userSchema),
  Subject:  mongoose.model('Subject',  subjectSchema),
  Question: mongoose.model('Question', questionSchema),
  Exam:     mongoose.model('Exam',     examSchema),
  Result:   mongoose.model('Result',   resultSchema)
};
