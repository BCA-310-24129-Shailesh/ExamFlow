/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║         EXAMFLOW — Admin Dashboard JavaScript            ║
 * ║  Full validation on every form: Subject, Exam,           ║
 * ║  Question, Add-Question-to-Exam                          ║
 * ╚══════════════════════════════════════════════════════════╝
 * Depends on: utils.js, validation.js
 */

let currentUser   = null;
let subjectsCache = [];
let examsCache    = [];

/* ══════════════════════════════════════════
   INIT
   ══════════════════════════════════════════ */
async function adminInit() {
  currentUser = await requireLogin('admin');
  if (!currentUser) return;
  document.getElementById('sidebarName').textContent   = currentUser.name;
  document.getElementById('sidebarAvatar').textContent = currentUser.name[0].toUpperCase();
  showPage(getInitialPage('admin', PAGE_TITLES));
}

/* ══════════════════════════════════════════
   NAVIGATION
   ══════════════════════════════════════════ */
const PAGE_TITLES = { dashboard:'Dashboard', students:'Students', subjects:'Subjects', exams:'Exams', questions:'Questions', results:'Results' };

function getInitialPage(section, pages) {
  const hashPage = window.location.hash.replace('#', '');
  if (pages[hashPage]) return hashPage;
  const pathPage = window.location.pathname.replace(`/${section}/`, '');
  return pages[pathPage] ? pathPage : 'dashboard';
}

function showPage(page) {
  if (!page) return;
  window.history.replaceState(null, '', page === 'dashboard' ? '/admin' : `/admin/${page}`);
  document.querySelectorAll('.page-view').forEach(el => el.classList.remove('active'));
  document.getElementById('page-' + page)?.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === page));
  document.getElementById('topbarTitle').textContent = PAGE_TITLES[page] || '';
  ({ dashboard:loadDashboard, students:loadStudents, subjects:loadSubjects, exams:loadExams, questions:loadQuestions, results:loadResults })[page]?.();
}

window.addEventListener('hashchange', () => {
  const page = window.location.hash.replace('#', '');
  if (page) showPage(page);
});

/* ══════════════════════════════════════════
   DASHBOARD
   ══════════════════════════════════════════ */
async function loadDashboard() {
  try {
    const data = await API.get('/api/admin/dashboard');
    if (!data.success) {
      console.error('Dashboard API error:', data);
      showToast(data.message || 'Failed to load dashboard', 'error');
      return;
    }
    const { stats, recentResults, performanceResults = recentResults, performanceExams = [], upcomingExams } = data;
    document.getElementById('dashStats').innerHTML = `
      <div class="stat-card" onclick="showPage('students')" style="cursor:pointer"><span class="stat-icon">👥</span><div class="stat-num">${stats.students}</div><div class="stat-label">Students</div></div>
      <div class="stat-card" onclick="showPage('exams')" style="cursor:pointer"><span class="stat-icon">📝</span><div class="stat-num">${stats.exams}</div><div class="stat-label">Exams</div></div>
      <div class="stat-card" onclick="showPage('subjects')" style="cursor:pointer"><span class="stat-icon">📚</span><div class="stat-num">${stats.subjects}</div><div class="stat-label">Subjects</div></div>
      <div class="stat-card" onclick="showPage('results')" style="cursor:pointer"><span class="stat-icon">🏆</span><div class="stat-num">${stats.results}</div><div class="stat-label">Submissions</div></div>`;
    document.getElementById('recentResultsList').innerHTML = recentResults.length
      ? recentResults.map(r => `<div class="activity-row"><div><div class="activity-name">${r.student?.name||'—'}</div><div class="activity-sub">${r.exam?.title||'—'}</div></div><span class="badge ${r.isPassed?'badge-green':'badge-red'}">${r.percentage}%</span></div>`).join('')
      : '<div class="empty-state"><span class="empty-icon">📋</span><p>No results yet</p></div>';
    document.getElementById('upcomingExamsList').innerHTML = upcomingExams.length
      ? upcomingExams.map(e => `<div class="activity-row"><div><div class="activity-name">${e.title}</div><div class="activity-sub">${e.subject?.name||''}</div></div><div style="font-size:.78rem;color:var(--gold);text-align:right">${fmtDate(e.startTime)}<br>${fmtTime(e.startTime)}</div></div>`).join('')
      : '<div class="empty-state"><span class="empty-icon">📅</span><p>No upcoming exams</p></div>';
    
    // Initialize charts
    setTimeout(() => {
      initExamPerformanceChart(performanceResults, performanceExams);
      initScoreDistributionChart(recentResults);
    }, 100);
  } catch (err) {
    console.error('Dashboard error:', err);
    showToast('Dashboard error: ' + err.message, 'error');
  }
}

/* ══════════════════════════════════════════
   STUDENTS
   ══════════════════════════════════════════ */
async function loadStudents() {
  const data = await API.get('/api/admin/students');
  if (!data.success) return;
  document.getElementById('studentsBody').innerHTML = data.students.length
    ? data.students.map(s => `<tr>
        <td><div class="stu-cell"><div class="stu-avatar">${s.name[0].toUpperCase()}</div><div><div style="font-weight:500">${s.name}</div><div style="font-size:.77rem;color:var(--muted)">${s.email}</div></div></div></td>
        <td>${s.rollNumber||'—'}</td><td>${s.department||'—'}</td>
        <td style="color:var(--muted);font-size:.82rem">${fmtDate(s.createdAt)}</td>
        <td><span class="badge ${s.isActive?'badge-green':'badge-red'}">${s.isActive?'Active':'Inactive'}</span></td>
        <td class="td-actions">
          <button class="btn btn-sm ${s.isActive?'btn-danger':'btn-success'}" onclick="toggleStudent('${s._id}')">
            ${s.isActive?'Deactivate':'Activate'}
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteStudent('${s._id}','${s.name.replace(/'/g,"\\'")}')">Delete</button>
        </td></tr>`).join('')
    : '<tr><td colspan="6"><div class="empty-state"><span class="empty-icon">👥</span><p>No students yet</p></div></td></tr>';
}

async function toggleStudent(id) {
  const data = await API.patch(`/api/admin/students/${id}/toggle`);
  if (data.success) { loadStudents(); showToast(`Student ${data.isActive?'activated':'deactivated'}`); }
}
async function deleteStudent(id, name) {
  if (!confirm(`Delete student "${name}"? This cannot be undone.`)) return;
  const data = await API.delete(`/api/admin/students/${id}`);
  if (data.success) { loadStudents(); showToast('Student deleted', 'info'); }
}

/* ══════════════════════════════════════════
   SUBJECTS — with validation
   ══════════════════════════════════════════ */
async function loadSubjects() {
  const data = await API.get('/api/subjects');
  if (!data.success) return;
  subjectsCache = data.subjects;
  refreshSubjectSelects();
  document.getElementById('subjectsBody').innerHTML = subjectsCache.length
    ? subjectsCache.map(s => `<tr>
        <td style="font-weight:500">${s.name}</td>
        <td><span class="badge badge-purple">${s.code}</span></td>
        <td style="color:var(--muted);font-size:.85rem">${s.description||'—'}</td>
        <td style="color:var(--muted);font-size:.82rem">${fmtDate(s.createdAt)}</td>
        <td class="td-actions">
          <button class="btn btn-sm btn-outline" onclick='editSubject(${JSON.stringify(s)})'>Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteSubject('${s._id}','${s.name.replace(/'/g,"\\'")}')">Delete</button>
        </td></tr>`).join('')
    : '<tr><td colspan="5"><div class="empty-state"><span class="empty-icon">📚</span><h3>No Subjects</h3><p>Add your first subject</p></div></td></tr>';
}

function refreshSubjectSelects() {
  const opts = subjectsCache.map(s => `<option value="${s._id}">${s.name} (${s.code})</option>`).join('');
  ['examSubjectSel','qSubjectField','qSubjectSel','qSubjectFilter','aiSubjectSel'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const prefix = id === 'qSubjectFilter' ? '<option value="">All Subjects</option>' : '<option value="">Select Subject</option>';
    el.innerHTML = prefix + opts;
  });
}

function openSubjectModal(editing = false) {
  if (!editing) {
    document.getElementById('subjectIdField').value   = '';
    document.getElementById('subjectNameField').value = '';
    document.getElementById('subjectCodeField').value = '';
    document.getElementById('subjectDescField').value = '';
    document.getElementById('subjectModalTitle').textContent = 'Add Subject';
  }
  document.getElementById('subjectServerMsg').innerHTML = '';
  clearValidation('subjectNameField', 'subjectCodeField');
  // Attach real-time validation
  attachValidation('subjectNameField', Rules.subjectName);
  attachValidation('subjectCodeField', Rules.subjectCode);
  openModal('subjectOverlay');
}

function editSubject(s) {
  document.getElementById('subjectIdField').value   = s._id;
  document.getElementById('subjectNameField').value = s.name;
  document.getElementById('subjectCodeField').value = s.code;
  document.getElementById('subjectDescField').value = s.description || '';
  document.getElementById('subjectModalTitle').textContent = 'Edit Subject';
  openSubjectModal(true);
}

async function saveSubject() {
  // Trigger all field validation
  ['subjectNameField','subjectCodeField'].forEach(id =>
    document.getElementById(id)?.dispatchEvent(new Event('input'))
  );

  const name = document.getElementById('subjectNameField').value.trim();
  const code = document.getElementById('subjectCodeField').value.trim();

  const errors = [];
  const nameR = Rules.subjectName(name);
  const codeR = Rules.subjectCode(code);
  if (!nameR.ok) errors.push(nameR.msg);
  if (!codeR.ok) errors.push(codeR.msg);

  if (errors.length) {
    document.getElementById('subjectServerMsg').innerHTML =
      `<div class="server-error">⚠ ${errors.join(' &nbsp;|&nbsp; ')}</div>`;
    return;
  }

  setBtnLoading('saveSubjectBtn', true);
  const id   = document.getElementById('subjectIdField').value;
  const body = { name, code: code.toUpperCase(), description: document.getElementById('subjectDescField').value.trim() };
  const data = id ? await API.put(`/api/subjects/${id}`, body) : await API.post('/api/subjects', body);
  setBtnLoading('saveSubjectBtn', false, id ? 'Update Subject' : 'Save Subject');

  if (!data.success) {
    document.getElementById('subjectServerMsg').innerHTML = `<div class="server-error">⚠ ${data.message}</div>`;
    if (data.message?.toLowerCase().includes('code')) setFieldError('subjectCodeField', 'This code is already in use.');
    return;
  }
  closeModal('subjectOverlay');
  loadSubjects();
  showToast(`Subject ${id ? 'updated' : 'created'}!`, 'success');
}

async function deleteSubject(id, name) {
  if (!confirm(`Delete subject "${name}"?`)) return;
  const data = await API.delete(`/api/subjects/${id}`);
  if (data.success) { loadSubjects(); showToast('Subject deleted', 'info'); }
}

/* ══════════════════════════════════════════
   EXAMS — with validation
   ══════════════════════════════════════════ */
async function loadExams() {
  if (!subjectsCache.length) { const sd = await API.get('/api/subjects'); subjectsCache = sd.subjects||[]; refreshSubjectSelects(); }
  const data = await API.get('/api/exams');
  if (!data.success) return;
  examsCache = data.exams;
  document.getElementById('examsBody').innerHTML = examsCache.length
    ? examsCache.map(e => {
        const status = getExamStatus(e);
        const cls = { live:'badge-green', upcoming:'badge-yellow', ended:'badge-gray' }[status];
        return `<tr>
          <td style="font-weight:500">${e.title}</td>
          <td style="color:var(--muted)">${e.subject?.name||'—'}</td>
          <td>${e.duration} min</td>
          <td>${e.totalMarks} / Pass: ${e.passingMarks}</td>
          <td style="font-size:.8rem;color:var(--muted)">${fmtDateTime(e.startTime)}</td>
          <td><span class="badge ${cls}">${status}</span></td>
          <td class="td-actions">
            ${status === 'ended' ? `<button class="btn btn-sm btn-success" onclick="openExtendExamModal('${e._id}')">Extend</button>` : ''}
            <button class="btn btn-sm btn-gold" onclick="openAddQModal('${e._id}','${e.title.replace(/'/g,"\\'")}')">+ Questions</button>
            <button class="btn btn-sm btn-danger" onclick="deleteExam('${e._id}','${e.title.replace(/'/g,"\\'")}')">Delete</button>
          </td></tr>`;
      }).join('')
    : '<tr><td colspan="7"><div class="empty-state"><span class="empty-icon">📝</span><h3>No Exams</h3><p>Create your first exam</p></div></td></tr>';
}

function openExamModal() {
  ['examIdField','examTitleField','examDurationField','examTotalField','examPassingField','examStartField','examEndField','examInstrField']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('examShuffleField').checked = false;
  document.getElementById('examModalTitle').textContent = 'Create Exam';
  document.getElementById('saveExamBtn').textContent = 'Save Exam';
  document.getElementById('examServerMsg').innerHTML = '';
  clearValidation('examTitleField','examDurationField','examPassingField','examStartField','examEndField');

  // Attach real-time validation
  attachValidation('examTitleField',    Rules.examTitle);
  attachValidation('examDurationField', (v) => Rules.duration(v));
  attachValidation('examPassingField',  (v) => Rules.marks(v, 'Passing marks'));
  attachValidation('examStartField',    (v) => Rules.datetime(v, 'Start time'));
  attachValidation('examEndField',      (v) => {
    const r = Rules.datetime(v, 'End time');
    if (!r.ok) return r;
    const start = document.getElementById('examStartField').value;
    if (start && new Date(v) <= new Date(start)) return { ok: false, msg: 'End time must be after start time.' };
    return r;
  });
  // Subject select validation
  document.getElementById('examSubjectSel').addEventListener('change', () => {
    const sel = document.getElementById('examSubjectSel');
    sel.classList.toggle('field-error', !sel.value);
    sel.classList.toggle('field-ok', !!sel.value);
  });
  openModal('examOverlay');
}

function toDateTimeLocalValue(value) {
  if (!value) return '';
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function openExtendExamModal(id) {
  const exam = examsCache.find(e => e._id === id);
  if (!exam) return showToast('Exam not found. Please refresh and try again.', 'error');

  openExamModal();
  const now = new Date();
  const defaultEnd = new Date(now.getTime() + Math.max(Number(exam.duration) || 60, 10) * 60000);

  document.getElementById('examIdField').value = exam._id;
  document.getElementById('examTitleField').value = exam.title || '';
  document.getElementById('examSubjectSel').value = exam.subject?._id || exam.subject || '';
  document.getElementById('examDurationField').value = exam.duration || '';
  document.getElementById('examTotalField').value = exam.totalMarks || '';
  document.getElementById('examPassingField').value = exam.passingMarks || '';
  document.getElementById('examStartField').value = toDateTimeLocalValue(now);
  document.getElementById('examEndField').value = toDateTimeLocalValue(defaultEnd);
  document.getElementById('examInstrField').value = exam.instructions || '';
  document.getElementById('examShuffleField').checked = !!exam.shuffleQuestions;
  document.getElementById('examModalTitle').textContent = 'Extend Exam';
  document.getElementById('saveExamBtn').textContent = 'Update Exam';
}

async function saveExam() {
  // Trigger all validations
  ['examTitleField','examDurationField','examPassingField','examStartField','examEndField']
    .forEach(id => document.getElementById(id)?.dispatchEvent(new Event('input')));

  const title       = document.getElementById('examTitleField').value.trim();
  const subject     = document.getElementById('examSubjectSel').value;
  const duration    = +document.getElementById('examDurationField').value;
  const passingMarks= +document.getElementById('examPassingField').value;
  const startTime   = document.getElementById('examStartField').value;
  const endTime     = document.getElementById('examEndField').value;
  const totalMarks  = +document.getElementById('examTotalField').value || 0;

  const errors = [];
  const titleR = Rules.examTitle(title);         if (!titleR.ok)  errors.push(titleR.msg);
  if (!subject)                                                    errors.push('Please select a subject.');
  const durR = Rules.duration(duration);         if (!durR.ok)    errors.push(durR.msg);
  const passR = Rules.marks(passingMarks,'Passing marks'); if (!passR.ok) errors.push(passR.msg);
  const startR = Rules.datetime(startTime,'Start time');   if (!startR.ok) errors.push(startR.msg);
  const endR   = Rules.datetime(endTime,'End time');       if (!endR.ok)   errors.push(endR.msg);
  if (startTime && endTime && new Date(endTime) <= new Date(startTime))
    errors.push('End time must be after start time.');
  if (!subject) {
    document.getElementById('examSubjectSel').classList.add('field-error');
  }

  if (errors.length) {
    document.getElementById('examServerMsg').innerHTML =
      `<div class="server-error">⚠ <div><ul>${errors.map(e=>`<li>${e}</li>`).join('')}</ul></div></div>`;
    return;
  }

  setBtnLoading('saveExamBtn', true);
  const id   = document.getElementById('examIdField').value;
  const body = { title, subject, duration, totalMarks, passingMarks, startTime, endTime,
    instructions: document.getElementById('examInstrField').value.trim(),
    shuffleQuestions: document.getElementById('examShuffleField').checked };
  const data = id ? await API.put(`/api/exams/${id}`, body) : await API.post('/api/exams', body);
  setBtnLoading('saveExamBtn', false, id ? 'Update Exam' : 'Save Exam');

  if (!data.success) {
    document.getElementById('examServerMsg').innerHTML = `<div class="server-error">⚠ ${data.message}</div>`;
    return;
  }
  closeModal('examOverlay');
  loadExams();
  showToast('Exam saved!', 'success');
}

async function deleteExam(id, title) {
  if (!confirm(`Delete exam "${title}"?`)) return;
  const data = await API.delete(`/api/exams/${id}`);
  if (data.success) { loadExams(); showToast('Exam deleted', 'info'); }
}

/* ══════════════════════════════════════════
   QUESTIONS — with validation
   ══════════════════════════════════════════ */
async function loadQuestions() {
  if (!subjectsCache.length) { const sd = await API.get('/api/subjects'); subjectsCache = sd.subjects||[]; refreshSubjectSelects(); }
  const subjectId = document.getElementById('qSubjectFilter')?.value || '';
  const data = await API.get('/api/questions' + (subjectId ? `?subject=${subjectId}` : ''));
  if (!data.success) return;
  const diffClass = { easy:'badge-green', medium:'badge-yellow', hard:'badge-red' };
  document.getElementById('questionsBody').innerHTML = data.questions.length
    ? data.questions.map(q => `<tr>
        <td style="max-width:260px;font-size:.87rem">${q.text.substring(0,90)}${q.text.length>90?'…':''}</td>
        <td style="color:var(--muted);font-size:.82rem">${q.subject?.name||'—'}</td>
        <td style="font-size:.8rem;color:var(--muted)">${q.options.slice(0,3).join(' / ')}…</td>
        <td><span class="badge badge-green">${q.options[q.correctAnswer]?.substring(0,20)}</span></td>
        <td style="font-weight:600">${q.marks}</td>
        <td><span class="badge ${diffClass[q.difficulty]||'badge-gray'}">${q.difficulty}</span></td>
        <td style="white-space:nowrap">
          <button class="btn btn-sm btn-outline" onclick='editQuestion(${JSON.stringify(q).replace(/'/g,"&#39;")})'>Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteQuestion('${q._id}')">Delete</button>
        </td>
      </tr>`).join('')
    : '<tr><td colspan="7"><div class="empty-state"><span class="empty-icon">❓</span><h3>No Questions</h3><p>Add questions using the button above</p></div></td></tr>';
}

function openQuestionModal() {
  ['qIdField','qTextField','qOpt0','qOpt1','qOpt2','qOpt3'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.querySelectorAll('input[name="qCorrect"]').forEach(r => r.checked = false);
  document.getElementById('qMarksField').value = '1';
  document.getElementById('qDiffField').value  = 'medium';
  const attachChk = document.getElementById('qAttachToExamChk');
  if (attachChk) attachChk.checked = false;
  const titleEl = document.getElementById('questionModalTitle');
  if (titleEl) titleEl.textContent = 'Add Question';
  document.getElementById('questionServerMsg').innerHTML = '';
  clearValidation('qTextField','qOpt0','qOpt1','qOpt2','qOpt3');
  setupQuestionValidation('q');
  openModal('questionOverlay');
}

function editQuestion(q) {
  document.getElementById('qIdField').value = q._id;
  const subjEl = document.getElementById('qSubjectField');
  if (subjEl) subjEl.value = q.subject._id || q.subject;
  document.getElementById('qTextField').value = q.text;
  document.getElementById('qOpt0').value = q.options[0] || '';
  document.getElementById('qOpt1').value = q.options[1] || '';
  document.getElementById('qOpt2').value = q.options[2] || '';
  document.getElementById('qOpt3').value = q.options[3] || '';
  document.querySelectorAll('input[name="qCorrect"]').forEach((r, idx) => { r.checked = (idx === q.correctAnswer); });
  document.getElementById('qMarksField').value = q.marks || '1';
  document.getElementById('qDiffField').value = q.difficulty || 'medium';
  const attachChk = document.getElementById('qAttachToExamChk');
  if (attachChk) attachChk.checked = false;
  const titleEl = document.getElementById('questionModalTitle');
  if (titleEl) titleEl.textContent = 'Edit Question';
  document.getElementById('questionServerMsg').innerHTML = '';
  clearValidation('qTextField','qOpt0','qOpt1','qOpt2','qOpt3');
  setupQuestionValidation('q');
  openModal('questionOverlay');
}

/** Wire up real-time validation for question fields. prefix = 'q' or 'addQ' */
function setupQuestionValidation(prefix) {
  attachValidation(prefix + 'TextField', Rules.questionText);
  ['Opt0','Opt1','Opt2','Opt3'].forEach((suf, i) => {
    attachValidation(prefix + suf, (v) => Rules.optionText(v, `Option ${'ABCD'[i]}`));
  });
  attachValidation(prefix + 'MarksField', (v) => Rules.marks(v, 'Marks'));
}

async function saveQuestion(fromExam = false, attachToExams = false) {
  const prefix = fromExam ? 'addQ' : 'q';
  if (!fromExam && attachToExams) {
    const attachChk = document.getElementById('qAttachToExamChk');
    attachToExams = attachChk?.checked ?? false;
  }
  const subjEl = fromExam ? document.getElementById('qSubjectSel') : document.getElementById('qSubjectField');
  const subject = subjEl?.value;
  const text    = document.getElementById(prefix + 'TextField')?.value.trim();
  const options = ['Opt0','Opt1','Opt2','Opt3'].map(s => document.getElementById(prefix + s)?.value.trim());
  const correctEl = document.querySelector(`input[name="${prefix === 'q' ? 'qCorrect' : 'addQCorrect'}"]:checked`);
  const marks   = +document.getElementById(prefix + 'MarksField')?.value;
  const diff    = document.getElementById(prefix + (fromExam ? 'Difficulty' : 'DiffField'))?.value;
  const msgId   = fromExam ? 'addQServerMsg' : 'questionServerMsg';

  // Trigger visual validation
  [prefix+'TextField', prefix+'Opt0', prefix+'Opt1', prefix+'Opt2', prefix+'Opt3', prefix+'MarksField']
    .forEach(id => document.getElementById(id)?.dispatchEvent(new Event('input')));

  const errors = [];
  if (!subject)                         errors.push('Please select a subject.');
  const textR = Rules.questionText(text||''); if (!textR.ok) errors.push(textR.msg);
  options.forEach((opt, i) => {
    const r = Rules.optionText(opt, `Option ${'ABCD'[i]}`);
    if (!r.ok) errors.push(r.msg);
  });
  if (!correctEl)                       errors.push('Please select the correct answer (radio button).');
  const optTexts = options.filter(Boolean);
  if (new Set(optTexts).size !== optTexts.length && optTexts.length === 4)
    errors.push('All four options must be unique.');
  const marksR = Rules.marks(marks,'Marks'); if (!marksR.ok) errors.push(marksR.msg);

  if (!subject) { subjEl?.classList.add('field-error'); }

  if (errors.length) {
    document.getElementById(msgId).innerHTML =
      `<div class="server-error">⚠ <div><ul>${errors.map(e=>`<li>${e}</li>`).join('')}</ul></div></div>`;
    return;
  }

  setBtnLoading(fromExam ? 'saveAddQBtn' : 'saveQuestionBtn', true);
  const body = { subject, text, options, correctAnswer: +correctEl.value, marks, difficulty: diff };
  
  let data;
  const qId = !fromExam ? document.getElementById('qIdField')?.value : null;
  if (!fromExam && !examsCache.length) {
    const examData = await API.get('/api/exams');
    if (examData.success) examsCache = examData.exams || [];
  }
  if (qId) {
    data = await API.put(`/api/questions/${qId}`, {
      ...body,
      attachToSubjectExams: attachToExams
    });
  } else {
    data = await API.post('/api/questions', {
      ...body,
      attachToSubjectExams: attachToExams
    });
  }
  
  setBtnLoading(fromExam ? 'saveAddQBtn' : 'saveQuestionBtn', false, 'Save Question');

  if (!data.success) {
    document.getElementById(msgId).innerHTML = `<div class="server-error">⚠ ${data.message}</div>`;
    return;
  }

  // Attach to exam if from exam modal
  if (fromExam && addQExamId) {
    const exam = examsCache.find(e => e._id === addQExamId);
    if (exam) {
      const updatedQs = [...(exam.questions?.map(q => q._id||q)||[]), data.question._id];
      await API.put(`/api/exams/${addQExamId}`, {
        ...exam, questions: updatedQs,
        subject: exam.subject?._id||exam.subject,
        totalMarks: (exam.totalMarks||0) + (data.question.marks||1)
      });
    }
  }

  closeModal(fromExam ? 'addQOverlay' : 'questionOverlay');
  loadQuestions();
  if (fromExam) loadExams();
  showToast('Question saved!', 'success');
}

let addQExamId = null;
function openAddQModal(examId, examTitle) {
  addQExamId = examId;
  document.getElementById('addQExamTitle').textContent = `Add Question — ${examTitle}`;
  ['addQTextField','addQOpt0','addQOpt1','addQOpt2','addQOpt3'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.querySelectorAll('input[name="addQCorrect"]').forEach(r => r.checked = false);
  document.getElementById('addQMarksField').value = '1';
  document.getElementById('addQDifficulty').value = 'medium';
  document.getElementById('addQServerMsg').innerHTML = '';
  clearValidation('addQTextField','addQOpt0','addQOpt1','addQOpt2','addQOpt3');
  // Pre-select exam subject
  const exam = examsCache.find(e => e._id === examId);
  if (exam?.subject) {
    const sel = document.getElementById('qSubjectSel');
    if (sel) sel.value = exam.subject._id || exam.subject;
  }
  setupQuestionValidation('addQ');
  openModal('addQOverlay');
}

async function deleteQuestion(id) {
  if (!confirm('Delete this question permanently?')) return;
  const data = await API.delete(`/api/questions/${id}`);
  if (data.success) { loadQuestions(); showToast('Question deleted', 'info'); }
}

/* ══════════════════════════════════════════
   RESULTS
   ══════════════════════════════════════════ */
async function loadResults() {
  const data = await API.get('/api/admin/results');
  if (!data.success) return;
  document.getElementById('resultsBody').innerHTML = data.results.length
    ? data.results.map(r => `<tr>
        <td><div style="font-weight:500">${r.student?.name||'—'}</div><div style="font-size:.77rem;color:var(--muted)">${r.student?.rollNumber||r.student?.email||''}</div></td>
        <td style="font-size:.87rem">${r.exam?.title||'—'}</td>
        <td style="color:var(--muted);font-size:.82rem">${r.exam?.subject?.name||'—'}</td>
        <td><strong>${r.obtainedMarks}/${r.totalMarks}</strong> <span style="color:var(--muted);font-size:.8rem">(${r.percentage}%)</span></td>
        <td><span class="badge ${r.isPassed?'badge-green':'badge-red'}">${r.isPassed?'✓ Pass':'✗ Fail'}</span></td>
        <td style="font-size:.78rem;color:${r.autoSubmitted?'var(--danger)':'var(--muted)'}" title="${r.autoSubmitReason||'No auto submit'}">${r.autoSubmitted ? 'Yes' : 'No'}</td>
        <td style="color:var(--muted);font-size:.82rem">${fmtDuration(r.timeTaken)}</td>
        <td style="color:var(--muted);font-size:.82rem">${fmtDate(r.submittedAt)}</td>
        <td><button class="btn btn-sm btn-outline" onclick="viewResultDetail('${r._id}')">View</button></td>
      </tr>`).join('')
    : '<tr><td colspan="9"><div class="empty-state"><span class="empty-icon">🏆</span><p>No results yet</p></div></td></tr>';
}

async function viewResultDetail(id) {
  document.getElementById('resultDetailContent').innerHTML = '<div class="loading-center"><div class="spinner spinner-lg"></div></div>';
  openModal('resultDetailOverlay');
  const data = await API.get(`/api/results/${id}`);
  if (!data.success) return;
  const r = data.result;
  const correct = r.answers.filter(a => a.isCorrect).length;
  const wrong   = r.answers.filter(a => !a.isCorrect && a.selectedOption !== null).length;
  const skipped = r.answers.filter(a => a.selectedOption === null).length;
  document.getElementById('resultDetailContent').innerHTML = `
    <div style="font-family:var(--font-head);font-weight:700;font-size:1.2rem;margin-bottom:1.25rem">${r.exam?.title} — Result</div>
    ${r.autoSubmitted ? `<div style="margin-bottom:1rem;font-size:.92rem;color:var(--danger);font-weight:600">Auto-submitted: ${r.autoSubmitReason || 'Switched away from the exam page'}</div>` : ''}
    <div style="text-align:center;margin-bottom:1.5rem">
      <div class="result-circle ${r.isPassed?'pass':'fail'}">
        <div class="result-pct" style="color:${r.isPassed?'var(--success)':'var(--danger)'}">${r.percentage}%</div>
        <div class="result-label">${r.isPassed?'PASSED':'FAILED'}</div>
      </div>
      <div style="display:flex;justify-content:center;gap:2rem;margin-top:1rem;flex-wrap:wrap">
        <div style="text-align:center"><div style="font-size:1.4rem;font-weight:800;color:var(--success)">${correct}</div><div style="font-size:.75rem;color:var(--muted)">Correct</div></div>
        <div style="text-align:center"><div style="font-size:1.4rem;font-weight:800;color:var(--danger)">${wrong}</div><div style="font-size:.75rem;color:var(--muted)">Wrong</div></div>
        <div style="text-align:center"><div style="font-size:1.4rem;font-weight:800;color:var(--muted)">${skipped}</div><div style="font-size:.75rem;color:var(--muted)">Skipped</div></div>
        <div style="text-align:center"><div style="font-size:1.4rem;font-weight:800">${r.obtainedMarks}/${r.totalMarks}</div><div style="font-size:.75rem;color:var(--muted)">Score</div></div>
      </div>
    </div>
    <div style="font-family:var(--font-head);font-weight:700;margin-bottom:1rem">Answer Review</div>
    ${r.answers.map((a,i) => {
      const q = r.exam?.questions?.find(q => (q._id||q)===(a.question?._id||a.question));
      if (!q?.text) return '';
      return `<div class="q-card">
        <div class="q-label">Q${i+1} · ${q.marks} mark${q.marks>1?'s':''}</div>
        <div class="q-text">${q.text}</div>
        <div class="q-options">${q.options.map((opt,idx)=>{
          let cls='';
          if(idx===q.correctAnswer) cls='correct';
          else if(idx===a.selectedOption&&!a.isCorrect) cls='wrong';
          return `<div class="q-option ${cls}"><div class="opt-marker">${'ABCD'[idx]}</div>${opt}</div>`;
        }).join('')}</div>
      </div>`;
    }).join('')}`;
}

// ==========================
// RESULT COMPARISON
// ==========================
let resultsCache = [];

async function openCompareModal() {
  document.getElementById('compareServerMsg').innerHTML = '';
  const data = await API.get('/api/admin/results');
  if (!data.success) return;
  resultsCache = data.results;
  
  const populateSelect = (selectId) => {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">Choose a result...</option>';
    resultsCache.forEach(r => {
      const option = document.createElement('option');
      option.value = r._id;
      option.textContent = `${r.student?.name} - ${r.exam?.title} (${r.percentage}%)`;
      select.appendChild(option);
    });
  };
  
  populateSelect('compareResult1');
  populateSelect('compareResult2');
  openModal('compareResultsOverlay');
}

async function compareResults() {
  const result1Id = document.getElementById('compareResult1').value;
  const result2Id = document.getElementById('compareResult2').value;
  
  if (!result1Id || !result2Id) {
    document.getElementById('compareServerMsg').innerHTML = '<div class="alert alert-danger">Please select both results to compare.</div>';
    return;
  }
  
  if (result1Id === result2Id) {
    document.getElementById('compareServerMsg').innerHTML = '<div class="alert alert-danger">Please select two different results.</div>';
    return;
  }
  
  closeModal('compareResultsOverlay');
  document.getElementById('comparisonViewContent').innerHTML = '<div class="loading-center"><div class="spinner spinner-lg"></div></div>';
  openModal('comparisonViewOverlay');
  
  const [data1, data2] = await Promise.all([
    API.get(`/api/results/${result1Id}`),
    API.get(`/api/results/${result2Id}`)
  ]);
  
  if (!data1.success || !data2.success) {
    document.getElementById('comparisonViewContent').innerHTML = '<div class="alert alert-danger">Failed to load results for comparison.</div>';
    return;
  }
  
  const r1 = data1.result;
  const r2 = data2.result;
  
  const renderResultSummary = (result, title) => {
    const correct = result.answers.filter(a => a.isCorrect).length;
    const wrong = result.answers.filter(a => !a.isCorrect && a.selectedOption !== null).length;
    const skipped = result.answers.filter(a => a.selectedOption === null).length;
    
    return `
      <div class="comparison-student">
        <div class="comparison-header">
          <div class="comparison-title">${title}</div>
          <div class="result-circle ${result.isPassed ? 'pass' : 'fail'}">
            <div class="result-pct" style="color:${result.isPassed ? 'var(--success)' : 'var(--danger)'}">${result.percentage}%</div>
            <div class="result-label">${result.isPassed ? 'PASSED' : 'FAILED'}</div>
          </div>
        </div>
        <div class="comparison-stats">
          <div class="stat-item"><div class="stat-value">${correct}</div><div class="stat-label">Correct</div></div>
          <div class="stat-item"><div class="stat-value">${wrong}</div><div class="stat-label">Wrong</div></div>
          <div class="stat-item"><div class="stat-value">${skipped}</div><div class="stat-label">Skipped</div></div>
          <div class="stat-item"><div class="stat-value">${result.obtainedMarks}/${result.totalMarks}</div><div class="stat-label">Score</div></div>
          <div class="stat-item"><div class="stat-value">${fmtDuration(result.timeTaken)}</div><div class="stat-label">Time</div></div>
        </div>
      </div>
    `;
  };
  
  const renderQuestionComparison = () => {
    const questions = r1.exam?.questions || [];
    return questions.map((q, i) => {
      const a1 = r1.answers.find(a => (a.question?._id || a.question) === (q._id || q));
      const a2 = r2.answers.find(a => (a.question?._id || a.question) === (q._id || q));
      
      const getAnswerClass = (answer, question) => {
        if (!answer || answer.selectedOption === null) return 'skipped';
        if (answer.selectedOption === question.correctAnswer) return 'correct';
        return 'wrong';
      };
      
      const getAnswerText = (answer, question) => {
        if (!answer || answer.selectedOption === null) return 'Not answered';
        return question.options[answer.selectedOption] || 'Invalid';
      };
      
      return `
        <div class="comparison-question">
          <div class="question-header">Q${i+1} · ${q.marks} mark${q.marks > 1 ? 's' : ''}</div>
          <div class="question-text">${q.text}</div>
          <div class="comparison-answers">
            <div class="answer-col">
              <div class="answer-label">${r1.student?.name}</div>
              <div class="answer-option ${getAnswerClass(a1, q)}">${getAnswerText(a1, q)}</div>
            </div>
            <div class="answer-col">
              <div class="answer-label">${r2.student?.name}</div>
              <div class="answer-option ${getAnswerClass(a2, q)}">${getAnswerText(a2, q)}</div>
            </div>
          </div>
          <div class="correct-answer">Correct: ${q.options[q.correctAnswer]}</div>
        </div>
      `;
    }).join('');
  };
  
  document.getElementById('comparisonViewContent').innerHTML = `
    <div class="comparison-container">
      <div class="comparison-title">📊 Result Comparison</div>
      <div class="comparison-exam-info">
        <strong>Exam:</strong> ${r1.exam?.title} | <strong>Subject:</strong> ${r1.exam?.subject?.name}
      </div>
      <div class="comparison-summaries">
        ${renderResultSummary(r1, r1.student?.name)}
        ${renderResultSummary(r2, r2.student?.name)}
      </div>
      <div class="comparison-questions">
        <div class="section-title">Question-by-Question Comparison</div>
        ${renderQuestionComparison()}
      </div>
    </div>
  `;
}

// ==========================
// AI QUESTION GENERATION
// ==========================
async function openAIGenerateModal() {
  document.getElementById('aiServerMsg').innerHTML = '';
  document.getElementById('aiCountField').value = '5';

  if (!subjectsCache.length) {
    const data = await API.get('/api/subjects');
    if (data.success) {
      subjectsCache = data.subjects || [];
      refreshSubjectSelects();
    }
  }

  const aiSelect = document.getElementById('aiSubjectSel');
  if (aiSelect) {
    aiSelect.innerHTML = '<option value="">Select Subject</option>' + subjectsCache.map(s => `<option value="${s._id}">${s.name} (${s.code})</option>`).join('');
  }

  openModal('aiGenerateOverlay');
}

async function generateAIQuestions() {
  const subjectId = document.getElementById('aiSubjectSel').value;
  const count = parseInt(document.getElementById('aiCountField').value, 10);
  
  if (!subjectId) {
    document.getElementById('aiServerMsg').innerHTML = '<div class="alert alert-danger">Please select a subject.</div>';
    return;
  }
  if (isNaN(count) || count < 1 || count > 20) {
    document.getElementById('aiServerMsg').innerHTML = '<div class="alert alert-danger">Please enter a valid number of questions (1-20).</div>';
    return;
  }
  
  setBtnLoading('aiGenerateBtn', true);
  document.getElementById('aiServerMsg').innerHTML = '<div class="alert alert-info">Generating questions via Google Gemini API... This may take up to 20 seconds.</div>';
  
  const data = await API.post('/api/questions/generate-ai', { subject: subjectId, count });
  setBtnLoading('aiGenerateBtn', false, 'Generate Questions');
  
  if (data.success) {
    closeModal('aiGenerateOverlay');
    showNotification(`Successfully generated ${data.insertedCount} questions!`);
    loadQuestions();
  } else {
    document.getElementById('aiServerMsg').innerHTML = `<div class="alert alert-danger">${data.message || 'Generation failed'}</div>`;
  }
}

/* ══════════════════════════════════════════
   CHARTS — Using Chart.js
   ══════════════════════════════════════════ */
let examPerformanceChartInstance = null;
let scoreDistributionChartInstance = null;

function initExamPerformanceChart(results, exams = []) {
  if ((!results || results.length === 0) && (!exams || exams.length === 0)) return;
  results = results || [];
  
  // Group live and ended exam results by subject so every active subject appears.
  const subjectScores = {};
  exams.forEach(exam => {
    const subjectName = exam.subject?.name || exam.title || 'Unknown';
    if (!subjectScores[subjectName]) {
      subjectScores[subjectName] = { passed: 0, failed: 0 };
    }
  });
  results.forEach(r => {
    const subjectName = r.exam?.subject?.name || r.exam?.title || 'Unknown';
    if (!subjectScores[subjectName]) {
      subjectScores[subjectName] = { passed: 0, failed: 0 };
    }
    if (r.isPassed) subjectScores[subjectName].passed++;
    else subjectScores[subjectName].failed++;
  });
  
  const ctx = document.getElementById('examPerformanceChart');
  if (!ctx) return;
  
  if (examPerformanceChartInstance) examPerformanceChartInstance.destroy();
  
  examPerformanceChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(subjectScores),
      datasets: [
        {
          label: 'Passed',
          data: Object.values(subjectScores).map(x => x.passed),
          backgroundColor: 'rgba(6, 214, 160, 0.6)',
          borderColor: 'var(--success)',
          borderWidth: 1
        },
        {
          label: 'Failed',
          data: Object.values(subjectScores).map(x => x.failed),
          backgroundColor: 'rgba(255, 107, 107, 0.6)',
          borderColor: 'var(--danger)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true, labels: { color: 'var(--text)' } } },
      scales: {
        y: { beginAtZero: true, ticks: { color: 'var(--muted)' }, grid: { color: 'var(--border)' } },
        x: { ticks: { color: 'var(--muted)' }, grid: { color: 'var(--border)' } }
      }
    }
  });
}

function initScoreDistributionChart(results) {
  if (!results || results.length === 0) return;
  
  // Calculate score ranges
  const ranges = { '0-20': 0, '20-40': 0, '40-60': 0, '60-80': 0, '80-100': 0 };
  results.forEach(r => {
    const pct = r.percentage || 0;
    if (pct < 20) ranges['0-20']++;
    else if (pct < 40) ranges['20-40']++;
    else if (pct < 60) ranges['40-60']++;
    else if (pct < 80) ranges['60-80']++;
    else ranges['80-100']++;
  });
  
  const ctx = document.getElementById('scoreDistributionChart');
  if (!ctx) return;
  
  if (scoreDistributionChartInstance) scoreDistributionChartInstance.destroy();
  
  scoreDistributionChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(ranges),
      datasets: [{
        data: Object.values(ranges),
        backgroundColor: [
          'rgba(255, 107, 107, 0.6)',
          'rgba(255, 209, 102, 0.6)',
          'rgba(108, 99, 255, 0.6)',
          'rgba(6, 214, 160, 0.4)',
          'rgba(6, 214, 160, 0.8)'
        ],
        borderColor: 'var(--card)',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true, position: 'bottom', labels: { color: 'var(--text)' } } }
    }
  });
}

document.addEventListener('DOMContentLoaded', adminInit);
