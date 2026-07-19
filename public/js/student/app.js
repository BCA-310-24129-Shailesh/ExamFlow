/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║        EXAMFLOW — Student Portal JavaScript              ║
 * ║  Includes validation on: Profile form, Exam checks       ║
 * ╚══════════════════════════════════════════════════════════╝
 * Depends on: utils.js, validation.js
 */

let currentUser   = null;
let myResults     = [];
let currentExam   = null;
let currentResult = null;
let examAnswers   = {};
let examStartedAt = null;
let timerInterval = null;
let timeLeft      = 0;
let currentQuestionIndex = 0;
let markedQuestions = new Set();
let examAutoSubmitted = false;
let examInstructionsCache = {};

/* ══════════════════════════════════════════
   INIT
   ══════════════════════════════════════════ */
async function studentInit() {
  currentUser = await requireLogin('student');
  if (!currentUser) return;
  document.getElementById('sidebarName').textContent   = currentUser.name;
  document.getElementById('sidebarAvatar').textContent = currentUser.name[0].toUpperCase();
  document.getElementById('sidebarRoll').textContent   = currentUser.rollNumber || currentUser.email;
  showPage(getInitialPage('student', PAGE_TITLES));
}

/* ══════════════════════════════════════════
   NAVIGATION
   ══════════════════════════════════════════ */
const PAGE_TITLES = { dashboard:'Dashboard', exams:'My Exams', results:'My Results', profile:'My Profile' };

function getInitialPage(section, pages) {
  const hashPage = window.location.hash.replace('#', '');
  if (pages[hashPage]) return hashPage;
  const pathPage = window.location.pathname.replace(`/${section}/`, '');
  return pages[pathPage] ? pathPage : 'dashboard';
}

function showPage(page) {
  if (!page) return;
  window.history.replaceState(null, '', page === 'dashboard' ? '/student' : `/student/${page}`);
  document.querySelectorAll('.page-view').forEach(el => el.classList.remove('active'));
  document.getElementById('page-' + page)?.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === page));
  document.getElementById('topbarTitle').textContent = PAGE_TITLES[page] || '';
  ({ dashboard:loadDashboard, exams:loadExams, results:loadResults, profile:loadProfile })[page]?.();
}

window.addEventListener('hashchange', () => {
  const page = window.location.hash.replace('#', '');
  if (page) showPage(page);
});

/* ══════════════════════════════════════════
   DASHBOARD
   ══════════════════════════════════════════ */
async function loadDashboard() {
  const [examData, resultData] = await Promise.all([API.get('/api/exams'), API.get('/api/results/my')]);
  myResults = resultData.results || [];
  const allExams  = examData.exams || [];
  examInstructionsCache = {};
  allExams.forEach(e => { if (e?._id) examInstructionsCache[e._id] = e.instructions || ''; });
  const liveExams = allExams.filter(e => getExamStatus(e) === 'live');
  const upcoming  = allExams.filter(e => getExamStatus(e) === 'upcoming');
  const passed    = myResults.filter(r => r.isPassed).length;

  document.getElementById('dashStats').innerHTML = `
    <div class="stat-card"><span class="stat-icon">🔴</span><div class="stat-num">${liveExams.length}</div><div class="stat-label">Live Now</div></div>
    <div class="stat-card"><span class="stat-icon">📅</span><div class="stat-num">${upcoming.length}</div><div class="stat-label">Upcoming</div></div>
    <div class="stat-card"><span class="stat-icon">📝</span><div class="stat-num">${myResults.length}</div><div class="stat-label">Exams Taken</div></div>
    <div class="stat-card"><span class="stat-icon">✅</span><div class="stat-num">${passed}</div><div class="stat-label">Passed</div></div>`;

  if (liveExams.length) {
    document.getElementById('dashLiveSection').style.display = 'block';
    document.getElementById('dashLiveExams').innerHTML = `<div class="exam-cards-grid">${liveExams.map(renderExamCard).join('')}</div>`;
  } else {
    document.getElementById('dashLiveSection').style.display = 'none';
  }

  document.getElementById('dashRecentResults').innerHTML = myResults.slice(0,4).length
    ? myResults.slice(0,4).map(r => `
        <div class="activity-row">
          <div><div class="activity-name">${r.exam?.title||'—'}</div><div class="activity-sub">${r.exam?.subject?.name||''} · ${fmtDate(r.submittedAt)}</div></div>
          <span class="badge ${r.isPassed?'badge-green':'badge-red'}">${r.percentage}%</span>
        </div>`).join('')
    : '<div class="empty-state" style="padding:1.5rem"><span class="empty-icon">📋</span><p>No results yet</p></div>';
}

/* ══════════════════════════════════════════
   EXAMS LIST
   ══════════════════════════════════════════ */
async function loadExams() {
  document.getElementById('examsContainer').innerHTML = '<div class="loading-center"><div class="spinner spinner-lg"></div></div>';
  const [examData, resultData] = await Promise.all([API.get('/api/exams'), API.get('/api/results/my')]);
  myResults = resultData.results || [];
  const allExams = examData.exams || [];
  examInstructionsCache = {};
  allExams.forEach(e => { if (e?._id) examInstructionsCache[e._id] = e.instructions || ''; });
  const live     = allExams.filter(e => getExamStatus(e) === 'live');
  const upcoming = allExams.filter(e => getExamStatus(e) === 'upcoming');
  const ended    = allExams.filter(e => getExamStatus(e) === 'ended');

  let html = '';
  if (live.length)     html += `<div class="group-block"><div class="group-heading" style="color:var(--success)">🔴 Live Now</div><div class="exam-cards-grid">${live.map(renderExamCard).join('')}</div></div>`;
  if (upcoming.length) html += `<div class="group-block"><div class="group-heading" style="color:var(--gold)">📅 Upcoming</div><div class="exam-cards-grid">${upcoming.map(renderExamCard).join('')}</div></div>`;
  if (ended.length)    html += `<div class="group-block"><div class="group-heading" style="color:var(--muted)">✔ Completed</div><div class="exam-cards-grid">${ended.map(renderExamCard).join('')}</div></div>`;
  if (!html) html = '<div class="empty-state"><span class="empty-icon">📝</span><h3>No Exams Available</h3><p>Your instructor hasn\'t created any exams yet.</p></div>';
  document.getElementById('examsContainer').innerHTML = html;
}

function renderExamCard(e) {
  const status    = getExamStatus(e);
  const examStart = new Date(e.startTime);
  const submitted = myResults.find(r =>
    (r.exam?._id||r.exam) === e._id &&
    new Date(r.submittedAt) >= examStart
  );
  const canTake   = status === 'live' && !submitted;
  const showInstructionsButton = !submitted && status !== 'ended';
  const instructionBtn = showInstructionsButton ? `<button class="btn btn-sm btn-outline" onclick="promptStartExam('${e._id}')">Instructions</button>` : '';
  let actionHtml  = '';
  if (submitted)          actionHtml = `<div style="display:flex;align-items:center;gap:.5rem"><button class="btn btn-sm btn-outline" onclick="viewResultDetail('${submitted._id}')">View Result</button><span class="badge ${submitted.isPassed?'badge-green':'badge-red'}" style="margin-left:.25rem">${submitted.percentage}%</span></div>`;
  else if (canTake)       actionHtml = `<div style="display:flex;align-items:center;gap:1rem">${instructionBtn}<span style="font-size:.85rem;color:var(--danger);font-weight:600">Ends in ${timeUntil(e.endTime)}</span><button class="btn btn-primary" onclick="promptStartExam('${e._id}')">Start Exam →</button></div>`;
  else if (status==='upcoming') actionHtml = `<div style="display:flex;align-items:center;gap:.5rem">${instructionBtn}<span style="font-size:.82rem;color:var(--muted)">Starts in ${timeUntil(e.startTime)}</span></div>`;
  else                    actionHtml = `<div style="display:flex;align-items:center;gap:.5rem"><span style="font-size:.82rem;color:var(--muted)">Exam ended</span></div>`;

  return `<div class="exam-card">
    <div class="exam-card-head"><div class="exam-card-title">${e.title}</div>${statusBadge(status)}</div>
    <div class="exam-card-sub">${e.subject?.name||''} ${e.subject?.code?'· '+e.subject.code:''}</div>
    <div class="exam-meta-row">
      <span class="exam-meta-chip">⏱ ${e.duration} min</span>
      <span class="exam-meta-chip">📊 ${e.totalMarks} marks</span>
      <span class="exam-meta-chip">✅ Pass: ${e.passingMarks}</span>
      <span class="exam-meta-chip">❓ ${e.questions?.length||0} Qs</span>
    </div>
    <div class="exam-schedule">🗓 ${fmtDate(e.startTime)} &nbsp;${fmtTime(e.startTime)} → ${fmtTime(e.endTime)}</div>
    ${(status === 'live' || status === 'upcoming') ? `<div class="exam-deadline" style="color:var(--danger); font-size:0.85rem; font-weight:600; margin-top:0.3rem">⚠️ Deadline: ${fmtDate(e.endTime)} at ${fmtTime(e.endTime)}</div>` : ''}
    ${e.instructions?`<div class="exam-instr">${e.instructions}</div>`:''}
    <div class="exam-actions">${actionHtml}</div>
  </div>`;
}

/* ══════════════════════════════════════════
   EXAM TAKING
   ══════════════════════════════════════════ */
async function promptStartExam(examId) {
  const instructions = examInstructionsCache[examId]?.trim() || 'No instructions have been provided for this exam.';
  document.getElementById('instructionContent').textContent = instructions;
  document.getElementById('instructionFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal('instructionOverlay')">Cancel</button>
    <button class="btn btn-primary" onclick="confirmStartExam('${examId}')">Begin Exam</button>
  `;
  openModal('instructionOverlay');
}

function confirmStartExam(examId) {
  closeModal('instructionOverlay');
  if (!confirm('Once you start, the timer begins immediately. Are you ready?')) return;
  startExam(examId);
}

async function startExam(examId) {
  const data = await API.get(`/api/exams/${examId}`);
  if (!data.success) return showToast('Failed to load exam. Try again.', 'error');
  currentExam   = data.exam;
  examAnswers   = {};
  examStartedAt = data.serverStartTime ? new Date(data.serverStartTime).toISOString() : new Date().toISOString();
  currentQuestionIndex = 0;
  markedQuestions.clear();
  
  let timeRemaining = currentExam.duration * 60;
  if (data.serverStartTime) {
    const elapsedSeconds = Math.floor((Date.now() - data.serverStartTime) / 1000);
    timeRemaining = Math.max(0, timeRemaining - elapsedSeconds);
  }

  const titleEl = document.querySelector('.exam-section-title');
  if (titleEl) titleEl.textContent = currentExam.title.toUpperCase();
  
  document.getElementById('envDateTime').textContent = new Date().toLocaleString();

  renderAllQuestions();
  renderNavGrid();
  updateSummary();
  startTimer(timeRemaining);
  showQuestion(0);
  document.getElementById('examScreen').classList.add('active');
  document.body.style.overflow = 'hidden';
  examAutoSubmitted = false;
  attachExamMonitoring();
}

function showInstructions() {
  if (!currentExam) return showToast('No active exam instructions available.', 'error');
  const instructions = currentExam.instructions?.trim() || 'No instructions have been provided for this exam.';
  document.getElementById('instructionContent').textContent = instructions;
  openModal('instructionOverlay');
}

function showExamInstructions(examId) {
  const instructions = examInstructionsCache[examId]?.trim();
  if (!instructions) return showToast('No instructions have been provided for this exam.', 'error');
  document.getElementById('instructionContent').textContent = instructions;
  openModal('instructionOverlay');
}

function renderAllQuestions() {
  const qs = currentExam.questions;
  document.getElementById('examQsPanel').innerHTML = qs.map((q,i) => `
    <div class="q-card" id="qcard-${i}" style="display:none; border:none; box-shadow:none; padding:0;">
      <div class="q-label" style="font-size:1rem; margin-bottom:1rem;">Question ${i+1} of ${qs.length} &nbsp;·&nbsp; ${q.marks} mark${q.marks>1?'s':''} &nbsp;·&nbsp;
        <span class="${q.difficulty==='easy'?'diff-easy':q.difficulty==='hard'?'diff-hard':'diff-medium'}">${q.difficulty}</span>
      </div>
      <div class="q-text" style="font-size:1.15rem; margin-bottom:1.5rem;">${q.text}</div>
      <div class="q-options" style="display:flex; flex-direction:column; gap:0.75rem;">${q.options.map((opt,idx)=>`
        <div class="q-option" id="opt-${i}-${idx}" onclick="selectAnswer('${q._id}',${idx},${i})" style="padding:1rem; border-radius:8px;">
          <div class="opt-marker">${'ABCD'[idx]}</div><span>${opt}</span>
        </div>`).join('')}
      </div>
    </div>`).join('');
}

function showQuestion(idx) {
  currentQuestionIndex = idx;
  document.querySelectorAll('.q-card').forEach((el, i) => {
    el.style.display = i === idx ? 'block' : 'none';
  });
  
  document.querySelectorAll('.q-nav-btn').forEach((btn, i) => {
    btn.classList.toggle('current', i === idx);
  });
  
  const btnPrev = document.getElementById('btnPrevQ');
  const btnNext = document.getElementById('btnNextQ');
  if (btnPrev) btnPrev.disabled = idx === 0;
  if (btnNext) btnNext.disabled = idx === currentExam.questions.length - 1;
  
  const qId = currentExam.questions[idx]._id;
  const isMarked = markedQuestions.has(qId);
  const btnMark = document.getElementById('btnMarkReview');
  if (btnMark) btnMark.textContent = isMarked ? 'Unmark review' : 'Mark for review';
}

function nextQuestion() {
  if (currentQuestionIndex < currentExam.questions.length - 1) showQuestion(currentQuestionIndex + 1);
}

function previousQuestion() {
  if (currentQuestionIndex > 0) showQuestion(currentQuestionIndex - 1);
}

function toggleMarkForReview() {
  const qId = currentExam.questions[currentQuestionIndex]._id;
  if (markedQuestions.has(qId)) markedQuestions.delete(qId);
  else markedQuestions.add(qId);
  
  const btnMark = document.getElementById('btnMarkReview');
  if (btnMark) btnMark.textContent = markedQuestions.has(qId) ? 'Unmark review' : 'Mark for review';
  
  updateNavButtonClass(currentQuestionIndex);
  updateSummary();
}

function clearResponse() {
  const qId = currentExam.questions[currentQuestionIndex]._id;
  delete examAnswers[qId];
  currentExam.questions[currentQuestionIndex].options.forEach((_, idx) => {
    const el = document.getElementById(`opt-${currentQuestionIndex}-${idx}`);
    if (el) el.classList.remove('selected');
  });
  updateNavButtonClass(currentQuestionIndex);
  updateSummary();
}

function selectAnswer(qId, optIdx, qNum) {
  if (examAnswers[qId] === optIdx) {
    delete examAnswers[qId];
    currentExam.questions[qNum].options.forEach((_,idx) => {
      const el = document.getElementById(`opt-${qNum}-${idx}`);
      if (el) el.className = 'q-option';
    });
  } else {
    examAnswers[qId] = optIdx;
    currentExam.questions[qNum].options.forEach((_,idx) => {
      const el = document.getElementById(`opt-${qNum}-${idx}`);
      if (el) el.className = 'q-option' + (idx===optIdx?' selected':'');
    });
  }
  updateNavButtonClass(qNum);
  updateSummary();
}

function updateNavButtonClass(qNum) {
  const navBtn = document.querySelector(`.q-nav-btn[data-qnum="${qNum}"]`);
  if (!navBtn) return;
  const qId = currentExam.questions[qNum]._id;
  navBtn.classList.toggle('answered', examAnswers[qId] !== undefined);
  navBtn.classList.toggle('marked', markedQuestions.has(qId));
}

function renderNavGrid() {
  document.getElementById('qNavGrid').innerHTML = currentExam.questions.map((_,i)=>
    `<button class="q-nav-btn" data-qnum="${i}" onclick="showQuestion(${i})">${i+1}</button>`
  ).join('');
}

function scrollToQuestion(idx) {
  showQuestion(idx);
}

function updateSummary() {
  const total    = currentExam.questions.length;
  const answered = Object.keys(examAnswers).length;
  const marked   = markedQuestions.size;
  document.getElementById('sumAnswered').textContent  = answered;
  if(document.getElementById('sumMarked')) document.getElementById('sumMarked').textContent = marked;
  if(document.getElementById('sumTotal')) document.getElementById('sumTotal').textContent = total;
  document.getElementById('sumRemaining').textContent = total - answered;
}

function startTimer(totalSeconds) {
  timeLeft = totalSeconds;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    const mins = String(Math.floor(timeLeft/60)).padStart(2,'0');
    const secs = String(timeLeft%60).padStart(2,'0');
    const chip = document.getElementById('timerChip');
    chip.textContent = `⏱ ${mins}:${secs}`;
    if (timeLeft <= 300) chip.classList.add('warning');
    if (timeLeft <= 0)  { clearInterval(timerInterval); submitExam(true, 'time expired'); }
  }, 1000);
}

function attachExamMonitoring() {
  document.addEventListener('visibilitychange', examVisibilityHandler);
  window.addEventListener('blur', examBlurHandler);
  window.addEventListener('pagehide', examPageHideHandler);
}

function detachExamMonitoring() {
  document.removeEventListener('visibilitychange', examVisibilityHandler);
  window.removeEventListener('blur', examBlurHandler);
  window.removeEventListener('pagehide', examPageHideHandler);
}

function examVisibilityHandler() {
  if (!currentExam || examAutoSubmitted) return;
  if (document.visibilityState === 'hidden') {
    submitExam(true, 'switched tab or opened another webpage');
  }
}

function examBlurHandler() {
  if (!currentExam || examAutoSubmitted) return;
  submitExam(true, 'switched window or opened another webpage');
}

function examPageHideHandler() {
  if (!currentExam || examAutoSubmitted) return;
  submitExam(true, 'left the exam page');
}

function confirmSubmit() {
  const remaining = currentExam.questions.length - Object.keys(examAnswers).length;
  const msg = remaining > 0
    ? `You have ${remaining} unanswered question(s).\n\nSubmit anyway?`
    : 'Submit your exam now?';
  if (confirm(msg)) submitExam(false);
}

async function submitExam(autoSubmit = false, autoSubmitReason = '') {
  if (!currentExam || examAutoSubmitted) return;
  examAutoSubmitted = true;
  clearInterval(timerInterval);
  detachExamMonitoring();

  const timeTaken = (currentExam.duration * 60) - timeLeft;
  const data = await API.post('/api/results/submit', {
    examId: currentExam._id,
    answers: examAnswers,
    startedAt: examStartedAt,
    timeTaken,
    autoSubmitted: autoSubmit,
    autoSubmitReason: autoSubmitReason || (autoSubmit ? 'auto-submit triggered' : '')
  });

  document.getElementById('examScreen').classList.remove('active');
  document.body.style.overflow = '';
  const submittedExam = currentExam;
  currentExam = null;

  if (data.success) {
    const r = data.result;
    const message = autoSubmit
      ? `⚠️ Exam auto-submitted because you left the exam or switched away.\n\nScore: ${r.obtainedMarks}/${r.totalMarks}\nPercent: ${r.percentage}%\nResult: ${r.isPassed?'✅ PASSED':'❌ FAILED'}`
      : `Exam Submitted!\n\nScore: ${r.obtainedMarks}/${r.totalMarks}\nPercent: ${r.percentage}%\nResult: ${r.isPassed?'✅ PASSED':'❌ FAILED'}`;
    alert(message);
    showPage('results');
  } else {
    showToast(data.message || 'Submission failed.', 'error');
  }
}

/* ══════════════════════════════════════════
   RESULTS
   ══════════════════════════════════════════ */
async function loadResults() {
  document.getElementById('resultsContainer').innerHTML = '<div class="loading-center"><div class="spinner spinner-lg"></div></div>';
  const data = await API.get('/api/results/my');
  myResults = data.results || [];
  document.getElementById('resultsContainer').innerHTML = myResults.length
    ? `<div class="result-cards-grid">${myResults.map(r=>`
        <div class="result-card">
          <div class="result-card-head">
            <div><div class="result-card-title">${r.exam?.title||'Exam'}</div><div class="result-card-sub">${r.exam?.subject?.name||''}</div></div>
            <span class="badge ${r.isPassed?'badge-green':'badge-red'}">${r.isPassed?'✓ Pass':'✗ Fail'}</span>
          </div>
          <div class="result-score-big" style="color:${r.isPassed?'var(--success)':'var(--danger)'}">${r.percentage}%</div>
          <div class="result-marks-sub">${r.obtainedMarks} / ${r.totalMarks} marks</div>
          ${r.autoSubmitted ? `<div style="font-size:.82rem;color:var(--danger);margin-top:.6rem">Auto-submitted: ${r.autoSubmitReason || 'Switched away from the exam'}</div>` : ''}
          <div class="progress-bar" style="margin:.75rem 0">
            <div class="progress-fill" style="width:${r.percentage}%;background:${r.isPassed?'var(--success)':'var(--danger)'}"></div>
          </div>
          <div class="result-footer">
            <div class="result-date">${fmtDateTime(r.submittedAt)}</div>
            <div style="display:flex;gap:.4rem">
              <button class="btn btn-sm btn-outline" onclick="viewResultDetail('${r._id}')">Details</button>
              <button class="btn btn-sm btn-outline" onclick="viewAndDownload('${r._id}')" style="font-size:.78rem">⬇ PDF</button>
            </div>
          </div>
        </div>`).join('')}</div>`
    : '<div class="empty-state"><span class="empty-icon">🏆</span><h3>No Results Yet</h3><p>Take an exam to see your results here.</p></div>';
}

async function viewResultDetail(id) {
  document.getElementById('resultDetailContent').innerHTML = '<div class="loading-center"><div class="spinner spinner-lg"></div></div>';
  openModal('resultDetailOverlay');
  const data = await API.get(`/api/results/${id}`);
  if (!data.success) return;
  const r = data.result;
  currentResult = r;
  const correct = r.answers.filter(a=>a.isCorrect).length;
  const wrong   = r.answers.filter(a=>!a.isCorrect&&a.selectedOption!==null).length;
  const skipped = r.answers.filter(a=>a.selectedOption===null).length;
  document.getElementById('resultDetailContent').innerHTML = `
    <div style="font-family:var(--font-head);font-weight:700;font-size:1.2rem;margin-bottom:1.25rem">
      ${r.exam?.title} <span style="font-size:.85rem;color:var(--muted);font-family:var(--font-body)">${r.exam?.subject?.name||''}</span>
    </div>
    ${r.autoSubmitted ? `<div style="margin-bottom:1rem;font-size:.92rem;color:var(--danger);font-weight:600">Auto-submitted: ${r.autoSubmitReason || 'Switched away from the exam page'}</div>` : ''}
    <div style="text-align:center;margin-bottom:1.5rem">
      <div class="result-circle ${r.isPassed?'pass':'fail'}">
        <div class="result-pct" style="color:${r.isPassed?'var(--success)':'var(--danger)'}">${r.percentage}%</div>
        <div class="result-label">${r.isPassed?'PASSED':'FAILED'}</div>
      </div>
      <div style="display:flex;justify-content:center;gap:2rem;flex-wrap:wrap;margin-top:1rem">
        <div style="text-align:center"><div style="font-size:1.5rem;font-weight:800;color:var(--success)">${correct}</div><div style="font-size:.75rem;color:var(--muted)">Correct</div></div>
        <div style="text-align:center"><div style="font-size:1.5rem;font-weight:800;color:var(--danger)">${wrong}</div><div style="font-size:.75rem;color:var(--muted)">Wrong</div></div>
        <div style="text-align:center"><div style="font-size:1.5rem;font-weight:800;color:var(--muted)">${skipped}</div><div style="font-size:.75rem;color:var(--muted)">Skipped</div></div>
        <div style="text-align:center"><div style="font-size:1.5rem;font-weight:800">${r.obtainedMarks}/${r.totalMarks}</div><div style="font-size:.75rem;color:var(--muted)">Score</div></div>
      </div>
      ${r.timeTaken?`<div style="margin-top:.75rem;font-size:.82rem;color:var(--muted)">Time taken: ${fmtDuration(r.timeTaken)}</div>`:''}
    </div>
    <div style="font-family:var(--font-head);font-weight:700;margin-bottom:1rem">Answer Review</div>
    ${r.answers.map((a,i)=>{
      const q = r.exam?.questions?.find(q=>(q._id||q)===(a.question?._id||a.question));
      if(!q?.text) return '';
      const statusLabel = a.isCorrect
        ? `<span style="color:var(--success)">✓ Correct (+${a.marksObtained})</span>`
        : a.selectedOption===null ? `<span style="color:var(--muted)">— Skipped</span>`
        : `<span style="color:var(--danger)">✗ Wrong</span>`;
      return `<div class="q-card">
        <div class="q-label">Q${i+1} &nbsp;·&nbsp; ${statusLabel}</div>
        <div class="q-text">${q.text}</div>
        <div class="q-options">${q.options.map((opt,idx)=>{
          let cls='';
          if(idx===q.correctAnswer) cls='correct';
          else if(idx===a.selectedOption&&!a.isCorrect) cls='wrong';
          return `<div class="q-option ${cls}"><div class="opt-marker">${'ABCD'[idx]}</div><span>${opt}</span></div>`;
        }).join('')}</div>
      </div>`;
    }).join('')}`;
}

/* ══════════════════════════════════════════
   PROFILE — with real-time validation
   ══════════════════════════════════════════ */
async function loadProfile() {
  const data = await API.get('/api/student/profile');
  if (!data.success) return;
  const u = data.user;
  document.getElementById('profName').value  = u.name || '';
  document.getElementById('profEmail').value = u.email || '';
  document.getElementById('profRoll').value  = u.rollNumber || '';
  document.getElementById('profPhone').value = u.phoneNumber || '';
  document.getElementById('profDept').value  = u.department || '';

  // Make profile read-only until the student clicks edit
  document.getElementById('profName').disabled = true;
  document.getElementById('profPhone').disabled = true;
  document.getElementById('saveProfileBtn').disabled = true;
  document.getElementById('editProfileBtn').textContent = 'Edit';

  // Attach real-time validation for editable profile fields
  attachValidation('profName', Rules.name);
  attachValidation('profPhone', Rules.phone);
}

function enableProfileEdit() {
  document.getElementById('profName').disabled = false;
  document.getElementById('profName').focus();
  document.getElementById('profPhone').disabled = false;
  document.getElementById('profDept').disabled = false;
  // Remove opacity and cursor styles
  document.getElementById('profName').style.opacity = '1';
  document.getElementById('profName').style.cursor = 'auto';
  document.getElementById('profPhone').style.opacity = '1';
  document.getElementById('profPhone').style.cursor = 'auto';
  document.getElementById('profDept').style.opacity = '1';
  document.getElementById('profDept').style.cursor = 'auto';
  document.getElementById('saveProfileBtn').disabled = false;
  document.getElementById('editProfileBtn').textContent = 'Editing';
}

async function saveProfile() {
  // Trigger validation for editable fields
  document.getElementById('profName')?.dispatchEvent(new Event('input'));
  document.getElementById('profPhone')?.dispatchEvent(new Event('input'));

  const name = document.getElementById('profName').value.trim();
  const phoneNumber = document.getElementById('profPhone').value.trim();
  const department = document.getElementById('profDept').value.trim();

  const errors = [];
  const nameR = Rules.name(name); if (!nameR.ok) errors.push(nameR.msg);
  const phoneR = Rules.phone(phoneNumber); if (!phoneR.ok) errors.push(phoneR.msg);

  if (errors.length) {
    document.getElementById('profileServerMsg').innerHTML =
      `<div class="server-error">⚠ ${errors.join(' &nbsp;|&nbsp; ')}</div>`;
    return;
  }

  setBtnLoading('saveProfileBtn', true);
  const data = await API.put('/api/student/profile', { name, phoneNumber, department });
  setBtnLoading('saveProfileBtn', false, 'Save Changes');

  if (!data.success) {
    document.getElementById('profileServerMsg').innerHTML = `<div class="server-error">⚠ ${data.message}</div>`;
    return;
  }

  document.getElementById('profileServerMsg').innerHTML = `<div class="server-success">✅ Profile updated successfully!</div>`;
  document.getElementById('sidebarName').textContent   = data.user.name;
  document.getElementById('sidebarAvatar').textContent = data.user.name[0].toUpperCase();
  document.getElementById('sidebarRoll').textContent   = data.user.rollNumber || data.user.email;
  document.getElementById('profPhone').value           = data.user.phoneNumber || '';
  document.getElementById('profName').disabled         = true;
  document.getElementById('profPhone').disabled        = true;
  document.getElementById('profDept').disabled         = true;
  document.getElementById('profName').style.opacity    = '0.5';
  document.getElementById('profName').style.cursor     = 'not-allowed';
  document.getElementById('profPhone').style.opacity   = '0.5';
  document.getElementById('profPhone').style.cursor    = 'not-allowed';
  document.getElementById('profDept').style.opacity    = '0.5';
  document.getElementById('profDept').style.cursor     = 'not-allowed';
  document.getElementById('saveProfileBtn').disabled   = true;
  document.getElementById('editProfileBtn').textContent = 'Edit';
  setTimeout(() => { document.getElementById('profileServerMsg').innerHTML = ''; }, 3000);
}

/* ══════════════════════════════════════════
   DOWNLOAD RESULT AS PDF
   ══════════════════════════════════════════ */
async function viewAndDownload(id) {
  await viewResultDetail(id);
  downloadResultPDF();
}

function downloadResultPDF() {
  const r = currentResult;
  if (!r) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W = 210;
  const margin = 16;
  const contentW = W - margin * 2;
  let y = 0;

  // ── Helpers ──
  const hex = (h, a = 1) => {
    const [r, g, b] = h.match(/\w\w/g).map(x => parseInt(x, 16));
    return [r, g, b];
  };
  const setFont = (size, style = 'normal', color = [30, 30, 30]) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    doc.setTextColor(...color);
  };
  const addPageIfNeeded = (needed = 10) => {
    if (y + needed > 275) { doc.addPage(); y = 20; }
  };

  // ── Header bar ──
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, W, 22, 'F');
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('ExamFlow', margin, 14);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Result Report', W - margin, 14, { align: 'right' });
  y = 30;

  // ── Exam title ──
  setFont(16, 'bold', [20, 20, 60]);
  doc.text(r.exam?.title || 'Exam Result', margin, y);
  y += 6;
  setFont(9, 'normal', [100, 100, 120]);
  const subjectLine = [r.exam?.subject?.name, r.exam?.subject?.code].filter(Boolean).join(' · ');
  if (subjectLine) { doc.text(subjectLine, margin, y); y += 5; }
  doc.text(`Submitted: ${new Date(r.submittedAt).toLocaleString()}`, margin, y);
  if (currentUser?.name) doc.text(`Student: ${currentUser.name}${currentUser.rollNumber ? '  |  Roll: ' + currentUser.rollNumber : ''}`, W - margin, y, { align: 'right' });
  y += 8;

  // ── Divider ──
  doc.setDrawColor(200, 200, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, y, W - margin, y);
  y += 8;

  // ── Score summary box ──
  const passColor = r.isPassed ? [16, 140, 90] : [180, 40, 40];
  const passBg    = r.isPassed ? [220, 252, 231] : [254, 226, 226];
  doc.setFillColor(...passBg);
  doc.roundedRect(margin, y, contentW, 28, 3, 3, 'F');

  setFont(22, 'bold', passColor);
  doc.text(`${r.percentage}%`, margin + 14, y + 16, { align: 'center' });

  setFont(11, 'bold', passColor);
  doc.text(r.isPassed ? 'PASSED' : 'FAILED', margin + 28, y + 10);
  setFont(9, 'normal', [60, 60, 60]);
  doc.text(`Score: ${r.obtainedMarks} / ${r.totalMarks} marks`, margin + 28, y + 17);
  if (r.timeTaken) doc.text(`Time taken: ${Math.floor(r.timeTaken / 60)}m ${r.timeTaken % 60}s`, margin + 28, y + 23);

  // Stats on right side
  const correct = r.answers.filter(a => a.isCorrect).length;
  const wrong   = r.answers.filter(a => !a.isCorrect && a.selectedOption !== null).length;
  const skipped = r.answers.filter(a => a.selectedOption === null).length;
  const statsX  = W - margin - 60;
  setFont(8, 'normal', [80, 80, 80]);
  doc.text(`Correct: ${correct}`, statsX, y + 10);
  doc.text(`Wrong:   ${wrong}`, statsX, y + 16);
  doc.text(`Skipped: ${skipped}`, statsX, y + 22);
  y += 36;

  // ── Answer Review heading ──
  setFont(11, 'bold', [30, 30, 80]);
  doc.text('Answer Review', margin, y);
  y += 2;
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 38, y);
  y += 7;

  // ── Questions ──
  r.answers.forEach((a, i) => {
    const q = r.exam?.questions?.find(q => (q._id || q) === (a.question?._id || a.question));
    if (!q?.text) return;

    addPageIfNeeded(28);

    // Question number pill
    const pillColor = a.isCorrect ? [16, 140, 90] : a.selectedOption === null ? [130, 130, 130] : [180, 40, 40];
    doc.setFillColor(...pillColor);
    doc.roundedRect(margin, y, 7, 5, 1, 1, 'F');
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`${i + 1}`, margin + 3.5, y + 3.5, { align: 'center' });

    // Status label
    setFont(7.5, 'normal', pillColor);
    const statusTxt = a.isCorrect ? `Correct (+${a.marksObtained}m)` : a.selectedOption === null ? 'Skipped' : 'Wrong';
    doc.text(statusTxt, margin + 9, y + 3.5);

    // Difficulty
    const diffColor = q.difficulty === 'easy' ? [20, 130, 80] : q.difficulty === 'hard' ? [160, 30, 30] : [160, 110, 0];
    setFont(7, 'normal', diffColor);
    doc.text(q.difficulty.toUpperCase(), W - margin, y + 3.5, { align: 'right' });
    y += 7;

    // Question text (wrapped)
    setFont(9, 'bold', [20, 20, 40]);
    const qLines = doc.splitTextToSize(q.text, contentW);
    addPageIfNeeded(qLines.length * 4.5 + 20);
    doc.text(qLines, margin, y);
    y += qLines.length * 4.5 + 2;

    // Options
    q.options.forEach((opt, idx) => {
      addPageIfNeeded(7);
      const isCorrectOpt  = idx === q.correctAnswer;
      const isSelectedWrong = idx === a.selectedOption && !a.isCorrect;
      let bgColor = null;
      let textColor = [60, 60, 60];
      if (isCorrectOpt)    { bgColor = [220, 252, 231]; textColor = [10, 100, 60]; }
      if (isSelectedWrong) { bgColor = [254, 226, 226]; textColor = [140, 20, 20]; }

      if (bgColor) {
        doc.setFillColor(...bgColor);
        doc.roundedRect(margin, y - 3.5, contentW, 6, 1, 1, 'F');
      }
      setFont(8.5, isCorrectOpt ? 'bold' : 'normal', textColor);
      const label = `${'ABCD'[idx]}.  ${opt}`;
      const optLines = doc.splitTextToSize(label, contentW - 4);
      doc.text(optLines, margin + 2, y);
      y += optLines.length * 4.5 + 1;
    });

    y += 5;

    // Light separator between questions
    doc.setDrawColor(220, 220, 230);
    doc.setLineWidth(0.2);
    doc.line(margin, y - 2, W - margin, y - 2);
  });

  // ── Footer on every page ──
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFillColor(245, 245, 250);
    doc.rect(0, 287, W, 10, 'F');
    setFont(7, 'normal', [140, 140, 160]);
    doc.text('Generated by ExamFlow', margin, 293);
    doc.text(`Page ${p} of ${pageCount}`, W - margin, 293, { align: 'right' });
  }

  const safeStudentName = (currentUser?.name || 'student').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const safeExamName = (r.exam?.title || 'result').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`${safeStudentName}_${safeExamName}_result.pdf`);
}

document.addEventListener('DOMContentLoaded', studentInit);
