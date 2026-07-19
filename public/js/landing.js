/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║       EXAMFLOW — Landing Page JavaScript                 ║
 * ║  Handles: Login, Register (Student + Admin),             ║
 * ║  Role selection, Real-time validation on every field     ║
 * ╚══════════════════════════════════════════════════════════╝
 * Depends on: utils.js, validation.js
 */

/* ── State ── */
let loginRole = 'student';
let regRole   = 'student';

// Admin secret key (in production, store this in .env and validate server-side)
const ADMIN_SECRET = 'EXAMFLOW_ADMIN_2025';

function normalizeIndianPhoneNumber(phoneNumber) {
  if (!phoneNumber) return '';
  const value = phoneNumber.trim();
  if (/^\+91[6-9]\d{9}$/.test(value)) return value;
  if (/^[6-9]\d{9}$/.test(value)) return `+91${value}`;
  return value;
}

/* ══════════════════════════════════════════
   AUTO-REDIRECT IF ALREADY LOGGED IN
   ══════════════════════════════════════════ */
(async () => {
  const data = await API.get('/api/auth/me');
  if (data.success && data.user) {
    window.location.href = data.user.role === 'admin' ? '/admin' : '/student';
  }
})();

/* ══════════════════════════════════════════
   MODAL OPEN / TAB SWITCH
   ══════════════════════════════════════════ */
function openAuthModal(tab) {
  openModal('authOverlay');
  switchAuthTab(tab || 'login');
}

function switchAuthTab(tab) {
  document.getElementById('loginSection').style.display    = tab === 'login'    ? 'block' : 'none';
  document.getElementById('registerSection').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('tabLogin').classList.toggle('active',    tab === 'login');
  document.getElementById('tabRegister').classList.toggle('active', tab === 'register');
  document.getElementById('authModalTitle').textContent =
    tab === 'login' ? 'Welcome back' : 'Create your account';
  document.getElementById('authServerMsg').innerHTML = '';

  if (tab === 'register') {
    // Wire up real-time validation when register section appears
    setupRegisterValidation();
  } else {
    setupLoginValidation();
  }
}

/* ══════════════════════════════════════════
   ROLE SELECTORS
   ══════════════════════════════════════════ */
function setLoginRole(role) {
  loginRole = role;
  document.getElementById('loginRoleStudent').classList.toggle('active', role === 'student');
  document.getElementById('loginRoleAdmin').classList.toggle('active',   role === 'admin');
}

function setRegRole(role) {
  regRole = role;
  document.getElementById('regRoleStudent').classList.toggle('active', role === 'student');
  document.getElementById('regRoleAdmin').classList.toggle('active',   role === 'admin');

  // Show admin key field only for admin
  const adminKeyGroup = document.getElementById('adminKeyGroup');
  const rollGroup     = document.getElementById('rollGroup');
  const deptGroup     = document.getElementById('deptGroup');

  adminKeyGroup.style.display = role === 'admin' ? 'block' : 'none';
  rollGroup.style.display     = role === 'student' ? 'block' : 'none';
  deptGroup.style.display     = role === 'student' ? 'block' : 'none';

  // Re-wire validation since fields changed
  setupRegisterValidation();
}

/* ══════════════════════════════════════════
   SETUP REAL-TIME VALIDATION — LOGIN
   ══════════════════════════════════════════ */
function setupLoginValidation() {
  attachValidation('loginEmail',    Rules.email);
  attachValidation('loginPassword', (v) => {
    if (!v) return { ok: false, msg: 'Password is required.' };
    return { ok: true, msg: '' };
  });
}

function setupResetValidation() {
  attachValidation('resetEmail', Rules.email);
  attachValidation('resetPassword', Rules.password);
  attachValidation('resetConfirmPassword', Rules.confirmPassword, { extraArg: 'resetPassword' });
  attachPasswordStrength('resetPassword', 'resetStrengthMeter');
  document.getElementById('resetPassword')?.addEventListener('input', () => {
    const confirmEl = document.getElementById('resetConfirmPassword');
    if (confirmEl?.value) confirmEl.dispatchEvent(new Event('input'));
  });
}

function openResetModal() {
  const email = document.getElementById('loginEmail')?.value.trim();
  if (email) document.getElementById('resetEmail').value = email;
  document.getElementById('resetPassword').value = '';
  document.getElementById('resetConfirmPassword').value = '';
  clearValidation('resetEmail', 'resetPassword', 'resetConfirmPassword');
  clearResetServerMsg();
  closeModal('authOverlay');
  openModal('resetOverlay');
}

function showResetServerMsg(msg, type = 'error') {
  document.getElementById('resetServerMsg').innerHTML =
    `<div class="${type === 'error' ? 'server-error' : 'server-success'}">
      <span>${type === 'error' ? '⚠' : '✅'}</span> ${msg}
    </div>`;
}

function clearResetServerMsg() {
  document.getElementById('resetServerMsg').innerHTML = '';
}

async function handleResetPassword() {
  clearResetServerMsg();

  const email = document.getElementById('resetEmail').value.trim();
  const password = document.getElementById('resetPassword').value;
  const confirmPassword = document.getElementById('resetConfirmPassword').value;

  // Trigger validation UI
  ['resetEmail', 'resetPassword', 'resetConfirmPassword'].forEach(id => {
    document.getElementById(id)?.dispatchEvent(new Event('input'));
  });

  const emailR = Rules.email(email);
  if (!emailR.ok) return showResetServerMsg(emailR.msg || 'Please enter a valid email address.');

  const passR = Rules.password(password);
  if (!passR.ok) return showResetServerMsg(passR.msg || 'Please enter a valid password.');

  const confirmR = Rules.confirmPassword(confirmPassword, password);
  if (!confirmR.ok) return showResetServerMsg(confirmR.msg || 'Passwords must match.');

  setBtnLoading('resetPasswordBtn', true);
  const data = await API.post('/api/auth/reset-password', { email, password });
  setBtnLoading('resetPasswordBtn', false, 'Reset Password');

  if (!data.success) {
    return showResetServerMsg(data.message || 'Password reset failed.');
  }

  showResetServerMsg(data.message || 'Password has been reset.', 'success');
  setTimeout(() => {
    closeModal('resetOverlay');
    openAuthModal('login');
    showServerMsg('Password reset successfully. Please sign in with your new password.', 'success');
  }, 900);
}

/* ══════════════════════════════════════════
   SETUP REAL-TIME VALIDATION — REGISTER
   ══════════════════════════════════════════ */
function setupRegisterValidation() {
  attachValidation('regName',  Rules.name);
  attachValidation('regEmail', Rules.email);
  attachValidation('regPhone', Rules.phone);
  attachValidation('regPassword', Rules.password);
  attachValidation('regConfirmPassword', Rules.confirmPassword, { extraArg: 'regPassword' });

  // Password strength meter
  attachPasswordStrength('regPassword', 'strengthMeter');

  // Optional fields
  if (regRole === 'student') {
    attachValidation('regRoll', Rules.rollNumber);
    attachValidation('regDept', Rules.department);
  }

  // Admin key validation
  if (regRole === 'admin') {
    attachValidation('regAdminKey', (v) => {
      const val = (v || '').trim();
      if (!val) return { ok: false, msg: 'Admin key is required.' };
      if (val !== ADMIN_SECRET) return { ok: false, msg: 'Invalid admin key.' };
      return { ok: true, msg: 'Admin key verified ✓' };
    });
  }

  // Re-validate confirm when password changes
  document.getElementById('regPassword')?.addEventListener('input', () => {
    const confirmEl = document.getElementById('regConfirmPassword');
    if (confirmEl?.value) confirmEl.dispatchEvent(new Event('input'));
  });
}

/* ══════════════════════════════════════════
   SHOW / CLEAR SERVER MESSAGE
   ══════════════════════════════════════════ */
function showServerMsg(msg, type = 'error') {
  document.getElementById('authServerMsg').innerHTML =
    `<div class="${type === 'error' ? 'server-error' : 'server-success'}">
      <span>${type === 'error' ? '⚠' : '✅'}</span> ${msg}
    </div>`;
}
function clearServerMsg() {
  document.getElementById('authServerMsg').innerHTML = '';
}

/* ══════════════════════════════════════════
   LOGIN HANDLER
   ══════════════════════════════════════════ */
async function handleLogin() {
  clearServerMsg();

  // Validate fields
  const emailOk = Rules.email(document.getElementById('loginEmail').value);
  const passVal = document.getElementById('loginPassword').value;

  // Force show validation state
  document.getElementById('loginEmail').dispatchEvent(new Event('input'));
  document.getElementById('loginPassword').dispatchEvent(new Event('input'));

  if (!emailOk.ok) return showServerMsg('Please enter a valid email address.');
  if (!passVal)    return showServerMsg('Please enter your password.');

  setBtnLoading('loginBtn', true);

  const data = await API.post('/api/auth/login', {
    email: document.getElementById('loginEmail').value.trim(),
    password: passVal
  });

  setBtnLoading('loginBtn', false, 'Sign In');

  if (!data.success) {
    showServerMsg(data.message || 'Login failed. Check your credentials.');
    setFieldError('loginEmail', ' ');
    setFieldError('loginPassword', 'Incorrect email or password.');
    return;
  }

  // Role mismatch check
  if (loginRole !== data.user.role) {
    showServerMsg(`This account is registered as a ${data.user.role}, not a ${loginRole}. Please select the correct role.`);
    await API.post('/api/auth/logout', {});
    return;
  }

  showServerMsg('Login successful! Redirecting...', 'success');
  setTimeout(() => {
    window.location.href = data.user.role === 'admin' ? '/admin' : '/student';
  }, 600);
}

/* ══════════════════════════════════════════
   REGISTER HANDLER
   ══════════════════════════════════════════ */
async function handleRegister() {
  clearServerMsg();

  // Collect values
  const name            = document.getElementById('regName').value.trim();
  const email           = document.getElementById('regEmail').value.trim();
  const phoneNumber     = document.getElementById('regPhone')?.value.trim() || '';
  const normalizedPhone = normalizeIndianPhoneNumber(phoneNumber);
  const password        = document.getElementById('regPassword').value;
  const confirmPassword = document.getElementById('regConfirmPassword').value;
  const rollNumber      = document.getElementById('regRoll')?.value.trim() || '';
  let department        = document.getElementById('regDeptSelect')?.value || '';
  if (department === 'Other') department = document.getElementById('regDept')?.value.trim() || '';
  const adminKey        = document.getElementById('regAdminKey')?.value.trim() || '';

  // Trigger all validation displays
  ['regName','regEmail','regPhone','regPassword','regConfirmPassword'].forEach(id => {
    document.getElementById(id)?.dispatchEvent(new Event('input'));
  });
  if (regRole === 'student') {
    document.getElementById('regRoll')?.dispatchEvent(new Event('input'));
    document.getElementById('regDept')?.dispatchEvent(new Event('input'));
  }
  if (regRole === 'admin') {
    document.getElementById('regAdminKey')?.dispatchEvent(new Event('input'));
  }

  // Validate each field
  const errors = [];

  const nameR = Rules.name(name);
  if (!nameR.ok) errors.push(nameR.msg);

  const emailR = Rules.email(email);
  if (!emailR.ok) errors.push(emailR.msg);

  const passR = Rules.password(password);
  if (!passR.ok) errors.push(passR.msg);

  const confirmR = Rules.confirmPassword(confirmPassword, password);
  if (!confirmR.ok) errors.push(confirmR.msg);

  if (phoneNumber) {
    const phoneR = Rules.phone(phoneNumber);
    if (!phoneR.ok) errors.push(phoneR.msg);
  }

  if (regRole === 'student') {
    if (rollNumber) {
      const rollR = Rules.rollNumber(rollNumber);
      if (!rollR.ok) errors.push(rollR.msg);
    }
    if (department) {
      const deptR = Rules.department(department);
      if (!deptR.ok) errors.push(deptR.msg);
    }
  }

  if (regRole === 'admin') {
    if (!adminKey) {
      errors.push('Admin secret key is required.');
    } else if (adminKey !== ADMIN_SECRET) {
      errors.push('Invalid admin secret key.');
      setFieldError('regAdminKey', 'Invalid admin secret key.');
    }
  }

  if (errors.length > 0) {
    showServerMsg(`Please fix the following:<br><ul>${errors.map(e => `<li>${e}</li>`).join('')}</ul>`);
    return;
  }

  setBtnLoading('registerBtn', true);

  const payload = {
    name, email, password,
    role: regRole,
    ...(normalizedPhone && { phoneNumber: normalizedPhone }),
    ...(regRole === 'admin' && { adminSecret: adminKey }),
    ...(regRole === 'student' && { rollNumber, department })
  };

  const data = await API.post('/api/auth/register', payload);

  setBtnLoading('registerBtn', false, 'Create Account');

  if (!data.success) {
    showServerMsg(data.message || 'Registration failed.');
    if (data.message?.toLowerCase().includes('email')) {
      setFieldError('regEmail', 'This email is already registered.');
    }
    return;
  }

  showServerMsg('Account created! Redirecting...', 'success');
  setTimeout(() => {
    window.location.href = regRole === 'admin' ? '/admin' : '/student';
  }, 700);
}

/* ══════════════════════════════════════════
   KEYBOARD ENTER SUPPORT
   ══════════════════════════════════════════ */
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  if (!document.getElementById('authOverlay')?.classList.contains('active')) return;
  const isLogin = document.getElementById('loginSection')?.style.display !== 'none';
  isLogin ? handleLogin() : handleRegister();
});

/* ══════════════════════════════════════════
   DEPARTMENT DROPDOWN HELPERS
   ══════════════════════════════════════════ */
function toggleDeptOther(sel) {
  const el = document.getElementById('regDept');
  if (sel.value === 'Other') {
    el.style.display = 'block';
    el.value = '';
    el.focus();
  } else {
    el.style.display = 'none';
    el.value = sel.value;
    el.dispatchEvent(new Event('input')); // Trigger validation update
  }
}

/* ══════════════════════════════════════════
   INIT — attach validation on first open
   ══════════════════════════════════════════ */
// Defaults
setLoginRole('student');
setRegRole('student');

// Wire up validation once DOM ready
document.addEventListener('DOMContentLoaded', () => {
  setupLoginValidation();
  setupResetValidation();
});
