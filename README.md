# ExamFlow - Advanced Exam Management Portal

A robust, real-time exam management and preparation portal built with **Node.js, Express, MongoDB, and Vanilla HTML/CSS/JS**.

ExamFlow bridges the gap between academic assessment and seamless digital execution by providing students with an intuitive test-taking interface, and equipping administrators with a centralized dashboard to create, track, and manage exams efficiently.

---

## 🚀 Features

### 🎓 Student Portal
- **Dashboard:** A clear, personalized view of upcoming, live, and past exams.
- **Mock Tests & Live Exams:** Attempt practice tests and actual exams with a timed, secure interface.
- **AI Integration (Gemini):** Optional AI-powered assistance for test preparation or explanations (based on implementation).
- **Performance Analytics:** Review test results, scores, and past performance automatically graded by the system.
- **Department/Subject Segregation:** Exams are tailored to the student's enrolled department and subjects.

### ⚙️ Admin Panel
- **Dashboard Overview:** At-a-glance metrics of total students, exams, and subjects.
- **Student Management:** View, add, and monitor student profiles and enrollment details.
- **Exam & Question Management:** Create subjects, manage question banks, and schedule live or upcoming exams with dynamic time bounds.
- **Result Generation:** Automatic grading and consolidated reports for completed exams.
- **Secure Configuration:** Environment-controlled admin registration process via `.env` configurations avoiding exposed hardcoded credentials.

---

## 🛠 Technology Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **AI Integration:** Google Gemini API
- **Authentication/Sessions:** express-session, bcryptjs

---

## 📂 Project Structure

```text
examflow/
├── public/                 # Static frontend files
│   ├── admin/              # Admin portal UI (HTML/CSS/JS)
│   ├── student/            # Student portal UI (HTML/CSS/JS)
│   ├── css/                # Global stylesheets
│   ├── js/                 # Global scripts
│   └── index.html          # Main landing page
├── server/                 # Node.js + Express backend server
│   ├── index.js            # Entry point for backend
│   ├── models.js           # MongoDB Mongoose schemas (User, Subject, Question, Exam)
│   ├── middleware.js       # Custom middleware (Auth, Error handling, etc.)
│   ├── routes/             # Express API routes
│   └── utils/              # Utility functions
├── .env                    # Environment variables (Port, DB URI, API Keys, Secrets)
├── package.json            # NPM dependencies and scripts
└── seed.js                 # Database seeding script
```

---

## 🏁 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [MongoDB](https://www.mongodb.com/try/download/community) (Local instance or MongoDB Atlas)

### 1. Installation
Clone the repository (or extract the project) and install dependencies:

```bash
cd examflow
npm install
```

### 2. `.env` Configuration
Create a `.env` file in the root directory (if not present) and configure the following variables:

```env
# ─── MongoDB Connection ───────────────────────────────────────
# Local MongoDB (default)
MONGO_URI=mongodb://localhost:27017/examflow_db

# ─── Server Config ────────────────────────────────────────────
PORT=3000
NODE_ENV=development

# ─── AI API Keys ──────────────────────────────────────────────
GEMINI_API_KEY=your_gemini_api_key_here

# ─── Admin Secret Key ─────────────────────────────────────────
ADMIN_SECRET=EXAMFLOW_ADMIN_2025

# ─── Session Secret ───────────────────────────────────────────
SESSION_SECRET=your_super_secret_session_key
```

### 3. Database Seeding (Optional but Recommended)
To quickly set up the application with an Admin user, Students, Subjects, Questions, and Sample Exams, run the seed script:

```bash
npm run seed
```

**Seed Credentials:**
- **Admin Login:** `shaileshverma@gmail.com` / `shailesh@123`
- **Student Login:** `rahul@student.com` / `student123` (or any seeded student)

### 4. Running the Application
Start the application in development mode:

```bash
npm run dev
```

Or run in production mode:
```bash
npm start
```

The application will be running at: `http://localhost:3000`

---
*Developed by Shailesh Verma*
