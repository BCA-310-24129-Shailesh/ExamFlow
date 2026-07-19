/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║           EXAMFLOW — Shared JS Utilities                 ║
 * ║  Loaded by all pages. Provides: API helpers, alerts,     ║
 * ║  modal controls, formatting helpers.                     ║
 * ╚══════════════════════════════════════════════════════════╝
 */

/* ══════════════════════════════════════════
   API HELPER
   All fetch() calls to the backend go through this.
   It automatically adds headers and parses JSON.
   ══════════════════════════════════════════ */
const API = {
  async get(url) {
    const res = await fetch(url);
    return res.json();
  },
  async post(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return res.json();
  },
  async put(url, body) {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return res.json();
  },
  async patch(url, body = {}) {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return res.json();
  },
  async delete(url) {
    const res = await fetch(url, { method: 'DELETE' });
    return res.json();
  }
};

/* ══════════════════════════════════════════
   MODAL CONTROLS
   ══════════════════════════════════════════ */
function openModal(id)  { document.getElementById(id)?.classList.add('active'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }

// Close modal when clicking the dark backdrop
function onOverlayClick(event, modalId) {
  if (event.target.id === event.currentTarget.id) closeModal(modalId);
}

/* ══════════════════════════════════════════
   ALERT / NOTIFICATION HELPERS
   ══════════════════════════════════════════ */
function showAlert(containerId, message, type = 'error') {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}
function clearAlert(containerId) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = '';
}

// Toast notification (top right with auto-dismiss)
function showToast(message, type = 'success', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warn: '⚠️' };
  toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-dismiss');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ══════════════════════════════════════════
   BUTTON LOADING STATE
   ══════════════════════════════════════════ */
function setBtnLoading(btnId, loading, label = '') {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading
    ? '<span class="spinner"></span> Loading...'
    : label || btn.dataset.label || 'Submit';
}

/* ══════════════════════════════════════════
   DATE / TIME FORMATTERS
   ══════════════════════════════════════════ */
function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}
function fmtTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
function fmtDuration(seconds) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
function timeUntil(dateStr) {
  const diff = new Date(dateStr) - new Date();
  if (diff <= 0) return 'Now';
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h`;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/* ══════════════════════════════════════════
   EXAM STATUS HELPER
   ══════════════════════════════════════════ */
function getExamStatus(exam) {
  const now = new Date();
  const start = new Date(exam.startTime);
  const end   = new Date(exam.endTime);
  if (now < start) return 'upcoming';
  if (now > end)   return 'ended';
  return 'live';
}

function statusBadge(status) {
  const map = {
    live:     '<span class="badge badge-green">🔴 Live</span>',
    upcoming: '<span class="badge badge-yellow">📅 Upcoming</span>',
    ended:    '<span class="badge badge-gray">Ended</span>'
  };
  return map[status] || '';
}

/* ══════════════════════════════════════════
   AUTH CHECK — redirect if not logged in
   ══════════════════════════════════════════ */
async function requireLogin(expectedRole) {
  const data = await API.get('/api/auth/me');
  if (!data.success) {
    window.location.href = '/';
    return null;
  }
  if (expectedRole && data.user.role !== expectedRole) {
    window.location.href = data.user.role === 'admin' ? '/admin' : '/student';
    return null;
  }
  return data.user;
}

async function logout() {
  await API.post('/api/auth/logout', {});
  window.location.href = '/';
}

/* ══════════════════════════════════════════
   THEME TOGGLE (Dark/Light Mode)
   ══════════════════════════════════════════ */
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => initTheme());

/* ══════════════════════════════════════════
   TABLE SEARCH / FILTER
   ══════════════════════════════════════════ */
function filterTable(tbodyId, searchInputId) {
  const input = document.getElementById(searchInputId);
  const tbody = document.getElementById(tbodyId);
  const filter = input.value.toLowerCase();
  const rows = tbody.getElementsByTagName('tr');
  let visibleCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const text = rows[i].textContent.toLowerCase();
    const match = text.includes(filter);
    rows[i].style.display = match ? '' : 'none';
    if (match) visibleCount++;
  }

  // Show "no results" message if no rows match
  if (visibleCount === 0 && filter.length > 0) {
    const noResults = document.createElement('tr');
    noResults.innerHTML = `<td colspan="10" style="text-align:center;padding:2rem;color:var(--muted)">No results found for "${filter}"</td>`;
    // Only add if not already present
    if (!tbody.querySelector('[data-no-results]')) {
      noResults.setAttribute('data-no-results', 'true');
      tbody.appendChild(noResults);
    }
  } else {
    // Remove "no results" message if results found
    const noResults = tbody.querySelector('[data-no-results]');
    if (noResults) noResults.remove();
  }
}

/* ══════════════════════════════════════════
   PAGINATION HELPER
   ══════════════════════════════════════════ */
function createPagination(tbodyId, itemsPerPage = 10) {
  const tbody = document.getElementById(tbodyId);
  const rows = Array.from(tbody.querySelectorAll('tr:not([data-no-results])')).filter(row => row.style.display !== 'none');
  if (rows.length <= itemsPerPage) return; // No pagination needed
  
  const totalPages = Math.ceil(rows.length / itemsPerPage);
  let currentPage = 1;
  
  // Hide all rows except first page
  rows.forEach((row, idx) => {
    row.style.display = (idx < itemsPerPage) ? '' : 'none';
  });
  
  // Create pagination controls
  const paginationDiv = document.createElement('div');
  paginationDiv.className = 'pagination';
  paginationDiv.id = `${tbodyId}-pagination`;
  
  // Previous button
  const prevBtn = document.createElement('button');
  prevBtn.textContent = '← Prev';
  prevBtn.disabled = true;
  prevBtn.onclick = () => goToPage(currentPage - 1);
  paginationDiv.appendChild(prevBtn);
  
  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.textContent = i;
    pageBtn.className = i === 1 ? 'active' : '';
    pageBtn.onclick = () => goToPage(i);
    paginationDiv.appendChild(pageBtn);
  }
  
  // Next button
  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next →';
  nextBtn.onclick = () => goToPage(currentPage + 1);
  paginationDiv.appendChild(nextBtn);
  
  function goToPage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    
    // Hide all, show current page
    rows.forEach((row, idx) => {
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      row.style.display = (idx >= start && idx < end) ? '' : 'none';
    });
    
    // Update buttons
    const btns = paginationDiv.querySelectorAll('button');
    btns[0].disabled = currentPage === 1;
    btns[btns.length - 1].disabled = currentPage === totalPages;
    paginationDiv.querySelectorAll('button').forEach((btn, idx) => {
      if (idx > 0 && idx < btns.length - 1) {
        btn.classList.toggle('active', (idx === currentPage));
      }
    });
  }
  
  // Insert after table
  const tableWrap = tbody.closest('.table-wrap');
  if (tableWrap) tableWrap.parentNode.insertBefore(paginationDiv, tableWrap.nextSibling);
}
