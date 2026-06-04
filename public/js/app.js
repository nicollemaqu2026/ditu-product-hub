// ── Toast ──────────────────────────────────────────────────────────────────

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${type === 'success' ? '✓' : '✗'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'all 0.2s ease';
    setTimeout(() => toast.remove(), 200);
  }, 3000);
}

// ── Slide panel ────────────────────────────────────────────────────────────

const panelOverlay = document.getElementById('panel-overlay');
const slidePanel   = document.getElementById('slide-panel');

function openPanel() {
  panelOverlay.classList.add('open');
  slidePanel.classList.add('open');
}

function closePanel() {
  panelOverlay.classList.remove('open');
  slidePanel.classList.remove('open');
}

document.getElementById('panel-close').addEventListener('click', closePanel);
document.getElementById('btn-cancel').addEventListener('click', closePanel);
panelOverlay.addEventListener('click', closePanel);

// ── Sidebar navigation ─────────────────────────────────────────────────────

document.querySelectorAll('.nav-item:not(.disabled)').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    const page = item.dataset.page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(`page-${page}`);
    if (target) target.classList.add('active');
  });
});

// ── API helpers ────────────────────────────────────────────────────────────

async function apiGet(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiPut(url, body) {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiPost(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiDelete(url) {
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

window.App = { showToast, openPanel, closePanel, apiGet, apiPut, apiPost, apiDelete };
