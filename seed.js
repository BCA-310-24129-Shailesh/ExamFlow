/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║              EXAMFLOW — Database Seeder                  ║
 * ║                                                          ║
 * ║  Run:  npm run seed                                      ║
 * ║  This will CLEAR and re-populate the database with       ║
 * ║  sample data so you can test immediately.                ║
 * ╚══════════════════════════════════════════════════════════╝
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { User, Subject, Question, Exam } = require('./server/models');

async function seed() {
  console.log('\n🌱  Starting database seed...\n');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅  MongoDB connected:', process.env.MONGO_URI);

  // Wipe existing data
  await Promise.all([
    User.deleteMany({}),
    Subject.deleteMany({}),
    Question.deleteMany({}),
    Exam.deleteMany({})
  ]);
  console.log('🗑   Cleared existing data\n');

  // ── CREATE ADMIN ──────────────────────────────────────────
  const admin = await User.create({
    name: 'Shailesh Verma',
    email: 'shaileshverma@gmail.com',
    password: 'shailesh@123',
    role: 'admin'
  });
  console.log('👤  Admin:   shaileshverma@gmail.com  /  shailesh@123');

  // ── CREATE SUBJECTS ───────────────────────────────────────
  const cs = await Subject.create({
    name: 'Computer Science',
    code: 'CS',
    description: 'Core computer science subjects including data structures and algorithms.',
    createdBy: admin._id
  });
  const db = await Subject.create({
    name: 'Database Management',
    code: 'DB',
    description: 'Relational database systems, SQL, and NoSQL databases.',
    createdBy: admin._id
  });
  const ec = await Subject.create({
    name: 'Digital Electronics',
    code: 'EC',
    description: 'Fundamental digital logic gates, circuits, and microprocessors.',
    createdBy: admin._id
  });
  console.log('📚  Subjects created: CS, DB, EC');

  // ── CREATE QUESTIONS ──────────────────────────────────────
  const csQuestionsData = [
    {
      subject: cs._id,
      text: 'Which data structure uses LIFO (Last In First Out) order?',
      options: ['Queue', 'Stack', 'Array', 'Linked List'],
      correctAnswer: 1,
      marks: 2,
      difficulty: 'easy',
      createdBy: admin._id
    },
    {
      subject: cs._id,
      text: 'What is the worst-case time complexity of searching in a Binary Search Tree?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
      correctAnswer: 2,
      marks: 2,
      difficulty: 'medium',
      createdBy: admin._id
    },
    {
      subject: cs._id,
      text: 'Which of the following is a non-linear data structure?',
      options: ['Stack', 'Queue', 'Array', 'Tree'],
      correctAnswer: 3,
      marks: 2,
      difficulty: 'easy',
      createdBy: admin._id
    },
    {
      subject: cs._id,
      text: 'What is the time complexity of inserting an element in a stack (push)?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
      correctAnswer: 0,
      marks: 2,
      difficulty: 'easy',
      createdBy: admin._id
    },
    {
      subject: cs._id,
      text: 'Which data structure is best suited for implementing Breadth First Search (BFS)?',
      options: ['Stack', 'Queue', 'Priority Queue', 'Tree'],
      correctAnswer: 1,
      marks: 2,
      difficulty: 'medium',
      createdBy: admin._id
    }
  ];

  const dbQuestionsData = [
    {
      subject: db._id,
      text: 'What does SQL stand for?',
      options: ['Structured Query Language', 'Strong Query Language', 'Structured Question Language', 'Structured Query Layout'],
      correctAnswer: 0,
      marks: 2,
      difficulty: 'easy',
      createdBy: admin._id
    },
    {
      subject: db._id,
      text: 'Which normal form is concerned with transitive functional dependencies?',
      options: ['1NF', '2NF', '3NF', 'BCNF'],
      correctAnswer: 2,
      marks: 2,
      difficulty: 'medium',
      createdBy: admin._id
    },
    {
      subject: db._id,
      text: 'Which key uniquely identifies each record in a database table?',
      options: ['Foreign Key', 'Primary Key', 'Secondary Key', 'Composite Key'],
      correctAnswer: 1,
      marks: 2,
      difficulty: 'easy',
      createdBy: admin._id
    },
    {
      subject: db._id,
      text: 'What is the default port for MongoDB server?',
      options: ['27017', '3306', '5432', '8080'],
      correctAnswer: 0,
      marks: 2,
      difficulty: 'easy',
      createdBy: admin._id
    },
    {
      subject: db._id,
      text: 'Which database constraint ensures that all values in a column are different?',
      options: ['NOT NULL', 'UNIQUE', 'PRIMARY KEY', 'CHECK'],
      correctAnswer: 1,
      marks: 2,
      difficulty: 'easy',
      createdBy: admin._id
    }
  ];

  const ecQuestionsData = [
    {
      subject: ec._id,
      text: 'Which logic gate is known as a universal gate?',
      options: ['AND', 'OR', 'NAND', 'XOR'],
      correctAnswer: 2,
      marks: 2,
      difficulty: 'easy',
      createdBy: admin._id
    },
    {
      subject: ec._id,
      text: 'How many select lines are there in a 4-to-1 multiplexer?',
      options: ['1', '2', '3', '4'],
      correctAnswer: 1,
      marks: 2,
      difficulty: 'medium',
      createdBy: admin._id
    },
    {
      subject: ec._id,
      text: 'What is the binary representation of decimal number 10?',
      options: ['1010', '1100', '1001', '1111'],
      correctAnswer: 0,
      marks: 2,
      difficulty: 'easy',
      createdBy: admin._id
    },
    {
      subject: ec._id,
      text: 'Which digital device stores exactly one bit of information?',
      options: ['Register', 'Flip-Flop', 'Multiplexer', 'Decoder'],
      correctAnswer: 1,
      marks: 2,
      difficulty: 'easy',
      createdBy: admin._id
    },
    {
      subject: ec._id,
      text: 'In Boolean algebra, what does A + A\' equal?',
      options: ['0', 'A', '1', '2A'],
      correctAnswer: 2,
      marks: 2,
      difficulty: 'easy',
      createdBy: admin._id
    }
  ];

  const csQs = await Question.insertMany(csQuestionsData);
  const dbQs = await Question.insertMany(dbQuestionsData);
  const ecQs = await Question.insertMany(ecQuestionsData);
  console.log('❓  Questions created for CS, DB, and EC subjects');

  // ── CREATE STUDENTS ───────────────────────────────────────
  await User.create([
    {
      name: 'Rahul Kumar',
      email: 'rahul@student.com',
      password: 'student123',
      role: 'student',
      rollNumber: '2021CS001',
      department: 'Computer Science'
    },
    {
      name: 'Priya Sharma',
      email: 'priya@student.com',
      password: 'student123',
      role: 'student',
      rollNumber: '2021CS002',
      department: 'Computer Science'
    },
    {
      name: 'Amit Patel',
      email: 'amit@student.com',
      password: 'student123',
      role: 'student',
      rollNumber: '2021EC001',
      department: 'Digital Electronics'
    }
  ]);
  console.log('🎓  Student users created');

  // ── CREATE EXAMS ──────────────────────────────────────────
  const now = new Date();

  // LIVE exam (started 15 min ago, ends in 2 hours)
  const liveExam = await Exam.create({
    title: 'Data Structures Midterm',
    subject: cs._id,
    questions: csQs.map(q => q._id),
    duration: 60,
    totalMarks: csQs.reduce((s, q) => s + q.marks, 0),
    passingMarks: 8,
    startTime: new Date(now.getTime() - 15 * 60000),
    endTime:   new Date(now.getTime() + 105 * 60000),
    instructions: 'Read each question carefully. Each question has only ONE correct answer. No negative marking.',
    shuffleQuestions: true,
    createdBy: admin._id
  });

  // UPCOMING exam (in 2 days)
  const upcomingExam = await Exam.create({
    title: 'Database Management Quiz',
    subject: db._id,
    questions: dbQs.map(q => q._id),
    duration: 45,
    totalMarks: dbQs.reduce((s, q) => s + q.marks, 0),
    passingMarks: 7,
    startTime: new Date(now.getTime() + 2 * 24 * 3600000),
    endTime:   new Date(now.getTime() + 2 * 24 * 3600000 + 2 * 3600000),
    instructions: 'All the best! Focus on SQL and normalization topics.',
    shuffleQuestions: false,
    createdBy: admin._id
  });

  // PAST exam (3 days ago)
  const pastExam = await Exam.create({
    title: 'Digital Electronics Test 1',
    subject: ec._id,
    questions: ecQs.map(q => q._id),
    duration: 30,
    totalMarks: ecQs.reduce((s, q) => s + q.marks, 0),
    passingMarks: 6,
    startTime: new Date(now.getTime() - 3 * 24 * 3600000),
    endTime:   new Date(now.getTime() - 3 * 24 * 3600000 + 2 * 3600000),
    instructions: 'Covers Unit 1 to Unit 3.',
    shuffleQuestions: false,
    createdBy: admin._id
  });

  console.log('📝  Exams: 1 Live (Data Structures), 1 Upcoming (DB Mgmt), 1 Past (Digital Electronics)');

  // ── PRINT SUMMARY ─────────────────────────────────────────
  console.log('\n' + '═'.repeat(52));
  console.log('  ✅  SEED COMPLETE');
  console.log('═'.repeat(52));
  console.log('');
  console.log('  LOGIN CREDENTIALS:');
  console.log('');
  console.log('  🔑 Admin');
  console.log('     Email:    shaileshverma@gmail.com');
  console.log('     Password: shailesh@123');
  console.log('');
  console.log('  🎓 Students (password: student123)');
  console.log('     rahul@student.com  (2021CS001 · CS)');
  console.log('     priya@student.com  (2021CS002 · CS)');
  console.log('     amit@student.com   (2021EC001 · EC)');
  console.log('');
  console.log('  🌐 Open: http://localhost:3000');
  console.log('═'.repeat(52) + '\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('\n❌  Seed failed:', err.message);
  process.exit(1);
});
