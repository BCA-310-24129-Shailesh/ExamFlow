/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║         EXAMFLOW — Validation Library                    ║
 * ║                                                          ║
 * ║  Used by: landing.js, admin/app.js, student/app.js       ║
 * ║                                                          ║
 * ║  Provides:                                               ║
 * ║  • Field-level rules (name, email, password, etc.)       ║
 * ║  • Real-time inline feedback on each input               ║
 * ║  • Form-level validation that checks all fields at once  ║
 * ║  • Visual states: idle → typing → valid ✓ → error ✗     ║
 * ╚══════════════════════════════════════════════════════════╝
 */

/* ══════════════════════════════════════════
   VALIDATION RULES
   Each rule returns { ok: boolean, msg: string }
   ══════════════════════════════════════════ */
const Rules = {

  /* ── NAME ─────────────────────────────── */
  name(value) {
    const v = value.trim();
    if (!v)                              return { ok: false, msg: 'Name is required.' };
    if (/^\d/.test(v))                   return { ok: false, msg: 'Name cannot start with a number.' };
    if (/^[^a-zA-Z]/.test(v))           return { ok: false, msg: 'Name must start with a letter.' };
    if (v.length < 2)                   return { ok: false, msg: 'Name must be at least 2 characters.' };
    if (v.length > 60)                  return { ok: false, msg: 'Name must be under 60 characters.' };
    if (/[^a-zA-Z\s'\-.]/.test(v))     return { ok: false, msg: 'Name may only contain letters, spaces, hyphens, apostrophes, or dots.' };
    if (/\s{2,}/.test(v))              return { ok: false, msg: 'Name cannot have consecutive spaces.' };
    if (/^[\s'\-.]/.test(v))           return { ok: false, msg: 'Name cannot start with a space or special character.' };
    return { ok: true, msg: 'Looks good!' };
  },

  /* ── EMAIL ────────────────────────────── */
  email(value) {
    const v = value.trim().toLowerCase();
    if (!v)                              return { ok: false, msg: 'Email is required.' };
    if (/\s/.test(v))                   return { ok: false, msg: 'Email cannot contain spaces.' };
    const emailRe = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailRe.test(v))              return { ok: false, msg: 'Enter a valid email address (e.g. user@domain.com).' };
    if (v.length > 100)                return { ok: false, msg: 'Email is too long.' };
    // ── Typo domain detection ──────────────────────────────
    const domain = v.split('@')[1];
    const typoMap = {
      // Gmail typos
      'gmail.co'    : 'gmail.com',  'gmai.com'    : 'gmail.com',
      'gmai.co'     : 'gmail.com',  'gmial.com'   : 'gmail.com',
      'gamil.com'   : 'gmail.com',  'gmail.cm'    : 'gmail.com',
      'gmail.con'   : 'gmail.com',  'gmail.cpm'   : 'gmail.com',
      'gmaill.com'  : 'gmail.com',  'gnail.com'   : 'gmail.com',
      // Yahoo typos
      'yaho.com'    : 'yahoo.com',  'yahoo.co'    : 'yahoo.com',
      'yahooo.com'  : 'yahoo.com',  'yhaoo.com'   : 'yahoo.com',
      'yahoomail.com':'yahoo.com',
      // Hotmail typos
      'hotmial.com' : 'hotmail.com','hotmail.co'  : 'hotmail.com',
      'hotmai.com'  : 'hotmail.com','hotmil.com'  : 'hotmail.com',
      // Outlook typos
      'outloo.com'  : 'outlook.com','outlook.co'  : 'outlook.com',
      'outlok.com'  : 'outlook.com','outllook.com': 'outlook.com',
    };
    if (typoMap[domain]) {
      return { ok: false, msg: `Did you mean @${typoMap[domain]}? Please check your email.` };
    }
    return { ok: true, msg: 'Valid email ✓' };
  },

  /* ── PASSWORD ─────────────────────────── */
  password(value) {
    if (!value)                          return { ok: false, msg: 'Password is required.' };
    if (value.length < 6)              return { ok: false, msg: 'Password must be at least 6 characters.' };
    if (value.length > 64)             return { ok: false, msg: 'Password must be under 64 characters.' };
    if (/^\s/.test(value))             return { ok: false, msg: 'Password cannot start with a space.' };
    // Strength checks (soft — warnings not blockers)
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasDigit = /\d/.test(value);
    const score = [hasUpper, hasLower, hasDigit].filter(Boolean).length;
    if (score < 2) return { ok: true, msg: '⚠ Weak password — add uppercase letters and numbers for better security.', warn: true };
    return { ok: true, msg: 'Strong password ✓' };
  },

  /* ── CONFIRM PASSWORD ─────────────────── */
  confirmPassword(value, original) {
    if (!value)                          return { ok: false, msg: 'Please confirm your password.' };
    if (value !== original)             return { ok: false, msg: 'Passwords do not match.' };
    return { ok: true, msg: 'Passwords match!' };
  },

  /* ── ROLL NUMBER ──────────────────────── */
  rollNumber(value) {
    const v = value.trim().toUpperCase();
    if (!v) return { ok: true, msg: '' }; // Optional field
    if (v.length < 3)                   return { ok: false, msg: 'Roll number is too short (min 3 characters).' };
    if (v.length > 20)                  return { ok: false, msg: 'Roll number is too long (max 20 characters).' };
    if (/[^A-Z0-9\-_]/.test(v))       return { ok: false, msg: 'Roll number may only contain letters, digits, hyphens, or underscores.' };
    return { ok: true, msg: `Roll: ${v}` };
  },

  /* ── DEPARTMENT ───────────────────────── */
  department(value) {
    const v = value.trim();
    if (!v) return { ok: true, msg: '' }; // Optional
    if (v.length < 2)                   return { ok: false, msg: 'Department name is too short.' };
    if (v.length > 60)                  return { ok: false, msg: 'Department name is too long.' };
    if (/[^a-zA-Z0-9\s\-&().,#/]/.test(v)) return { ok: false, msg: 'Department name contains invalid characters.' };
    return { ok: true, msg: 'Valid!' };
  },

  /* ── PHONE NUMBER ────────────────────── */
  phone(value) {
    const v = value.trim();
    if (!v) return { ok: true, msg: '' }; // Optional
    if (/^\+91[6-9]\d{9}$/.test(v)) return { ok: true, msg: 'Valid phone number.' };
    if (/^\+91[0-5]\d{9}$/.test(v)) return { ok: false, msg: 'Indian mobile numbers must start with 6, 7, 8, or 9.' };
    if (/^\+/.test(v)) return { ok: false, msg: 'Use a valid Indian mobile number (e.g. +919876543210).' };
    if (/\D/.test(v)) return { ok: false, msg: 'Phone number may contain only digits, or +91 followed by 10 digits.' };
    if (v.length !== 10) return { ok: false, msg: 'Phone number must be exactly 10 digits.' };
    if (!/^[6-9]/.test(v)) return { ok: false, msg: 'Indian mobile numbers must start with 6, 7, 8, or 9.' };
    return { ok: true, msg: 'Valid phone number.' };
  },

  /* ── GENERIC TEXT ─────────────────────── */
  required(value, label = 'This field') {
    const v = typeof value === 'string' ? value.trim() : value;
    if (!v && v !== 0)                  return { ok: false, msg: `${label} is required.` };
    return { ok: true, msg: '' };
  },

  /* ── SUBJECT NAME ─────────────────────── */
  subjectName(value) {
    const v = value.trim();
    if (!v)                              return { ok: false, msg: 'Subject name is required.' };
    if (/^\d/.test(v))                   return { ok: false, msg: 'Subject name cannot start with a number.' };
    if (v.length < 2)                   return { ok: false, msg: 'Subject name must be at least 2 characters.' };
    if (v.length > 80)                  return { ok: false, msg: 'Subject name must be under 80 characters.' };
    return { ok: true, msg: 'Valid subject name!' };
  },

  /* ── SUBJECT CODE ─────────────────────── */
  subjectCode(value) {
    const v = value.trim().toUpperCase();
    if (!v)                              return { ok: false, msg: 'Subject code is required.' };
    if (/^\d/.test(v))                   return { ok: false, msg: 'Subject code cannot start with a number.' };
    if (v.length < 2)                   return { ok: false, msg: 'Subject code too short (e.g. CS301).' };
    if (v.length > 12)                  return { ok: false, msg: 'Subject code too long (max 12 characters).' };
    if (/[^A-Z0-9\-_]/.test(v))        return { ok: false, msg: 'Code may only contain letters, numbers, hyphens, or underscores.' };
    return { ok: true, msg: `Code: ${v}` };
  },

  /* ── EXAM TITLE ───────────────────────── */
  examTitle(value) {
    const v = value.trim();
    if (!v)                              return { ok: false, msg: 'Exam title is required.' };
    if (/^\d/.test(v))                   return { ok: false, msg: 'Exam title cannot start with a number.' };
    if (v.length < 4)                   return { ok: false, msg: 'Exam title must be at least 4 characters.' };
    if (v.length > 100)                 return { ok: false, msg: 'Exam title must be under 100 characters.' };
    return { ok: true, msg: 'Valid title!' };
  },

  /* ── DURATION ─────────────────────────── */
  duration(value) {
    const n = parseInt(value);
    if (!value && value !== 0)          return { ok: false, msg: 'Duration is required.' };
    if (isNaN(n) || n <= 0)            return { ok: false, msg: 'Duration must be a positive number.' };
    if (n < 5)                          return { ok: false, msg: 'Duration must be at least 5 minutes.' };
    if (n > 480)                        return { ok: false, msg: 'Duration cannot exceed 480 minutes (8 hours).' };
    return { ok: true, msg: `${n} minute${n !== 1 ? 's' : ''}` };
  },

  /* ── MARKS ────────────────────────────── */
  marks(value, label = 'Marks') {
    const n = parseInt(value);
    if (!value && value !== 0)          return { ok: false, msg: `${label} is required.` };
    if (isNaN(n) || n <= 0)            return { ok: false, msg: `${label} must be a positive number.` };
    if (n > 1000)                       return { ok: false, msg: `${label} seems too high (max 1000).` };
    return { ok: true, msg: `${n} marks` };
  },

  /* ── DATETIME ─────────────────────────── */
  datetime(value, label = 'Date/Time') {
    if (!value)                          return { ok: false, msg: `${label} is required.` };
    const d = new Date(value);
    if (isNaN(d.getTime()))            return { ok: false, msg: `${label} is not a valid date/time.` };
    return { ok: true, msg: d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) };
  },

  /* ── QUESTION TEXT ────────────────────── */
  questionText(value) {
    const v = value.trim();
    if (!v)                              return { ok: false, msg: 'Question text is required.' };
    if (v.length < 5)                   return { ok: false, msg: 'Question is too short (min 5 characters).' };
    if (v.length > 500)                 return { ok: false, msg: 'Question is too long (max 500 characters).' };
    return { ok: true, msg: `${v.length}/500 characters` };
  },

  /* ── OPTION TEXT ──────────────────────── */
  optionText(value, label = 'Option') {
    const v = value.trim();
    if (!v)                              return { ok: false, msg: `${label} cannot be empty.` };
    if (v.length > 200)                 return { ok: false, msg: `${label} is too long.` };
    return { ok: true, msg: '' };
  }
};

/* ══════════════════════════════════════════
   INLINE FIELD FEEDBACK ENGINE
   Attaches real-time validation to an input.
   Shows helper text + border color under the field.
   ══════════════════════════════════════════ */

/**
 * Attach real-time validation to a field.
 * @param {string} inputId   - ID of the <input> or <textarea>
 * @param {function} ruleFn  - A function from Rules, e.g. Rules.name
 * @param {object}  opts     - { extraArg, trigger: 'input'|'blur', hintId }
 */
function attachValidation(inputId, ruleFn, opts = {}) {
  const input = document.getElementById(inputId);
  if (!input) return;

  // Create or reuse hint element (shown below the input)
  let hint = document.getElementById(opts.hintId || inputId + '_hint');
  if (!hint) {
    hint = document.createElement('div');
    hint.id = opts.hintId || inputId + '_hint';
    hint.className = 'field-hint';
    input.parentNode.insertBefore(hint, input.nextSibling);
  }

  const validate = () => {
    const result = ruleFn(input.value, opts.extraArg ? document.getElementById(opts.extraArg)?.value : undefined);
    applyFieldState(input, hint, result);
    return result.ok;
  };

  // Validate on every keystroke
  input.addEventListener('input', validate);
  // Also validate on blur for a definitive check
  input.addEventListener('blur', validate);

  // Store validate fn on input for form-level check
  input._validate = validate;
}

/**
 * Apply visual state to the input field and hint text.
 */
function applyFieldState(input, hint, result) {
  // Reset classes
  input.classList.remove('field-ok', 'field-error', 'field-warn');
  hint.classList.remove('hint-ok', 'hint-error', 'hint-warn');
  hint.textContent = result.msg || '';

  if (!input.value && !result.msg) {
    // Empty and untouched — neutral
    return;
  }

  if (result.ok) {
    if (result.warn) {
      input.classList.add('field-warn');
      hint.classList.add('hint-warn');
    } else {
      input.classList.add('field-ok');
      hint.classList.add('hint-ok');
    }
  } else {
    input.classList.add('field-error');
    hint.classList.add('hint-error');
  }
}

/**
 * Validate all fields in a form at once.
 * Returns true only if ALL attached validations pass.
 * @param {string[]} inputIds - list of field IDs to validate
 */
function validateAll(inputIds) {
  let allOk = true;
  inputIds.forEach(id => {
    const input = document.getElementById(id);
    if (input && input._validate) {
      const ok = input._validate();
      if (!ok) allOk = false;
    }
  });
  return allOk;
}

/**
 * Mark a field as having a server-side error
 * (e.g. "email already taken").
 */
function setFieldError(inputId, message) {
  const input = document.getElementById(inputId);
  if (!input) return;
  let hint = document.getElementById(inputId + '_hint');
  if (!hint) {
    hint = document.createElement('div');
    hint.id = inputId + '_hint';
    hint.className = 'field-hint';
    input.parentNode.insertBefore(hint, input.nextSibling);
  }
  applyFieldState(input, hint, { ok: false, msg: message });
}

/**
 * Clear all validation state on listed fields.
 */
function clearValidation(...inputIds) {
  inputIds.forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;
    input.classList.remove('field-ok', 'field-error', 'field-warn');
    const hint = document.getElementById(id + '_hint');
    if (hint) { hint.textContent = ''; hint.className = 'field-hint'; }
  });
}

/* ══════════════════════════════════════════
   PASSWORD STRENGTH METER
   ══════════════════════════════════════════ */
function attachPasswordStrength(inputId, meterId) {
  const input = document.getElementById(inputId);
  const meter = document.getElementById(meterId);
  if (!input || !meter) return;

  input.addEventListener('input', () => {
    const v = input.value;
    const score = getPasswordScore(v);
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['', '#ff6b6b', '#ffd166', '#06b6d4', '#06d6a0'];
    meter.innerHTML = v ? `
      <div class="strength-bar">
        <div class="strength-fill" style="width:${score * 25}%;background:${colors[score]}"></div>
      </div>
      <span class="strength-label" style="color:${colors[score]}">${labels[score]}</span>
    ` : '';
  });
}

function getPasswordScore(v) {
  if (!v || v.length < 6) return 1;
  let score = 1;
  if (v.length >= 8)                     score++;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
  if (/\d/.test(v) && /[^a-zA-Z0-9]/.test(v)) score++;
  return Math.min(score, 4);
}
