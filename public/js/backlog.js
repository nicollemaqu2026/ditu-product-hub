// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_LABELS = {
  'sin-especificar':   'Sin especificar',
  'en-especificacion': 'En especificación',
  'listo-para-dev':    'Listo para dev',
  'en-desarrollo':     'En desarrollo',
  'en-qa':             'En QA',
  'entregado':         'Entregado',
};

const PRIORITY_LABELS = { alta: 'Alta', media: 'Media', baja: 'Baja' };
const PLATFORMS = ['web', 'ios', 'android', 'atv'];
const PLATFORM_LABELS = { web: 'Web', ios: 'iOS', android: 'Android', atv: 'ATV' };

// ── State ──────────────────────────────────────────────────────────────────

let allItems = [];
let filteredItems = [];
let editingId = null;
let activeDropdown = null;
let allEpics = [];
let visiblePlatforms = { web: true, ios: true, android: true, atv: true };

// ── Filters ────────────────────────────────────────────────────────────────

const filterEpic     = document.getElementById('filter-epic');
const filterPlatform = document.getElementById('filter-platform');
const filterStatus   = document.getElementById('filter-status');
const filterBlocker  = document.getElementById('filter-blocker');
const filterSearch   = document.getElementById('filter-search');

function applyFilters() {
  const epic     = filterEpic.value;
  const platform = filterPlatform.value;
  const status   = filterStatus.value;
  const blocker  = filterBlocker.value;
  const search   = filterSearch.value.trim().toLowerCase();

  filteredItems = allItems.filter(item => {
    if (epic && item.epic !== epic) return false;
    if (status && platform) {
      if (item.platforms[platform] !== status) return false;
    } else if (status) {
      if (!PLATFORMS.some(p => item.platforms[p] === status)) return false;
    } else if (platform) {
      // platform selected but no status filter — still pass
    }
    if (blocker === '__sin-bloqueo') {
      if (item.blocker && item.blocker !== '') return false;
    } else if (blocker) {
      if (item.blocker !== blocker) return false;
    }
    if (search) {
      const haystack = `${item.id} ${item.feature} ${item.epic}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
  renderTable();
}

[filterEpic, filterPlatform, filterStatus, filterBlocker].forEach(el =>
  el.addEventListener('change', applyFilters)
);
filterSearch.addEventListener('input', applyFilters);

document.getElementById('btn-clear-filters').addEventListener('click', clearFilters);

function clearFilters() {
  filterEpic.value = '';
  filterPlatform.value = '';
  filterStatus.value = '';
  filterBlocker.value = '';
  filterSearch.value = '';
  applyFilters();
}

// ── Render helpers ─────────────────────────────────────────────────────────

function statusPill(itemId, platform, status) {
  const label = STATUS_LABELS[status] || status;
  return `<div class="status-pill status-${status}" data-id="${itemId}" data-platform="${platform}" tabindex="0">
    <span class="status-dot"></span>
    <span>${label}</span>
    <div class="status-dropdown" id="dd-${itemId}-${platform}">
      ${Object.entries(STATUS_LABELS).map(([val, lbl]) => `
        <div class="status-dropdown-item" data-value="${val}">
          <span class="status-dot" style="background:${statusDotColor(val)}"></span>
          ${lbl}
        </div>`).join('')}
    </div>
  </div>`;
}

function statusDotColor(status) {
  const map = {
    'sin-especificar': '#55556A',
    'en-especificacion': '#3B82F6',
    'listo-para-dev': '#F59E0B',
    'en-desarrollo': '#7C3AED',
    'en-qa': '#F97316',
    'entregado': '#10B981',
  };
  return map[status] || '#55556A';
}

function priorityBadge(priority) {
  const labels = { alta: 'Alta', media: 'Media', baja: 'Baja' };
  return `<span class="prio-badge prio-${priority}">${labels[priority] || priority}</span>`;
}

function blockerPill(blocker) {
  if (!blocker) return '';
  return `<span class="blocker-pill">⚠ ${blocker}</span>`;
}

// ── Render table ───────────────────────────────────────────────────────────

function prdIconCell(item) {
  const url = item.linkPRD || '';
  if (url) {
    return `<td class="td-prd-icon"><a class="prd-icon-link" href="${url}" target="_blank" rel="noopener" title="Ver PRD">📄</a></td>`;
  }
  return `<td class="td-prd-icon"><span class="prd-icon-empty" title="Sin PRD">📄</span></td>`;
}

function renderTable() {
  const tbody = document.getElementById('backlog-tbody');

  // Epic order: items-derived (insertion order) + extra epics with no items
  const epicFromItems = [...new Set(allItems.map(i => i.epic))];
  const epicOrder = [...new Set([...epicFromItems, ...allEpics])];

  const hasFilteredItems = filteredItems.length > 0;
  const hasAnyEpics = epicOrder.length > 0;

  if (!hasFilteredItems && !hasAnyEpics) {
    tbody.innerHTML = `
      <tr><td colspan="10">
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <p>No se encontraron funcionalidades con estos filtros</p>
          <button class="btn btn-ghost" onclick="clearFilters()">Limpiar filtros</button>
        </div>
      </td></tr>`;
    return;
  }

  const groups = {};
  filteredItems.forEach(item => {
    if (!groups[item.epic]) groups[item.epic] = [];
    groups[item.epic].push(item);
  });

  let html = '';

  epicOrder.forEach(epic => {
    const filteredForEpic = groups[epic];
    const allForEpic = allItems.filter(i => i.epic === epic);
    const isGenuinelyEmpty = allForEpic.length === 0;

    // Skip epics with items that are all filtered out
    if (!filteredForEpic && !isGenuinelyEmpty) return;

    const epicDelivered = allForEpic.filter(i =>
      PLATFORMS.every(p => i.platforms[p] === 'entregado')
    ).length;
    const pct = allForEpic.length > 0 ? Math.round((epicDelivered / allForEpic.length) * 100) : 0;

    html += `<tr class="epic-row">
      <td colspan="10">
        <div class="epic-header">
          <span class="epic-name">${epic}</span>
          <div class="epic-progress-wrap">
            <div class="epic-progress-bar-bg">
              <div class="epic-progress-bar-fill" style="width:${pct}%"></div>
            </div>
          </div>
          <span class="epic-count">${epicDelivered}/${allForEpic.length} entregadas</span>
        </div>
      </td>
    </tr>`;

    if (isGenuinelyEmpty) {
      html += `<tr><td colspan="10" class="empty-epic-cell">Sin funcionalidades aún — agrega una</td></tr>`;
    } else {
      filteredForEpic.forEach(item => {
        html += `<tr data-id="${item.id}">
          <td class="cell-id">${item.id}</td>
          <td style="color:var(--text-primary)">${item.feature}</td>
          ${prdIconCell(item)}
          <td class="col-web-col">${statusPill(item.id, 'web', item.platforms.web)}</td>
          <td class="col-ios-col">${statusPill(item.id, 'ios', item.platforms.ios)}</td>
          <td class="col-android-col">${statusPill(item.id, 'android', item.platforms.android)}</td>
          <td class="col-atv-col">${statusPill(item.id, 'atv', item.platforms.atv)}</td>
          <td>${priorityBadge(item.priority)}</td>
          <td>${blockerPill(item.blocker)}</td>
          <td>
            <div class="actions-cell">
              <button class="btn-icon edit-btn" data-id="${item.id}" title="Editar">✏</button>
              <button class="btn-icon notes-btn" data-id="${item.id}" title="${item.notes ? 'Ver notas' : 'Sin notas'}" style="${item.notes ? 'color:var(--warning)' : ''}">📝</button>
            </div>
          </td>
        </tr>`;
      });
    }
  });

  if (!html) {
    html = `<tr><td colspan="10">
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <p>No se encontraron funcionalidades con estos filtros</p>
        <button class="btn btn-ghost" onclick="clearFilters()">Limpiar filtros</button>
      </div>
    </td></tr>`;
  }

  tbody.innerHTML = html;
  attachTableEvents();
}

// ── Table event delegation ─────────────────────────────────────────────────

function attachTableEvents() {
  const tbody = document.getElementById('backlog-tbody');

  // Status pill click — open/close dropdown
  tbody.addEventListener('click', e => {
    const pill = e.target.closest('.status-pill');
    const ddItem = e.target.closest('.status-dropdown-item');

    if (ddItem && !pill) return; // handled below

    if (ddItem) {
      e.stopPropagation();
      const newStatus = ddItem.dataset.value;
      const outerPill = ddItem.closest('.status-pill');
      const itemId    = outerPill.dataset.id;
      const platform  = outerPill.dataset.platform;
      updatePlatformStatus(itemId, platform, newStatus);
      closeAllDropdowns();
      return;
    }

    if (pill) {
      e.stopPropagation();
      const ddId = `dd-${pill.dataset.id}-${pill.dataset.platform}`;
      const dd   = document.getElementById(ddId);
      if (!dd) return;
      const isOpen = dd.classList.contains('open');
      closeAllDropdowns();
      if (!isOpen) dd.classList.add('open');
      return;
    }

    // Edit button
    const editBtn = e.target.closest('.edit-btn');
    if (editBtn) {
      openEditPanel(editBtn.dataset.id);
      return;
    }

    // Notes button — open panel focused on notes
    const notesBtn = e.target.closest('.notes-btn');
    if (notesBtn) {
      openEditPanel(notesBtn.dataset.id);
      setTimeout(() => document.getElementById('edit-notes').focus(), 350);
      return;
    }

    closeAllDropdowns();
  });
}

function closeAllDropdowns() {
  document.querySelectorAll('.status-dropdown.open').forEach(d => d.classList.remove('open'));
  activeDropdown = null;
}

document.addEventListener('click', e => {
  if (!e.target.closest('.status-pill')) closeAllDropdowns();
});

// ── Status quick-update ────────────────────────────────────────────────────

async function updatePlatformStatus(id, platform, newStatus) {
  const item = allItems.find(i => i.id === id);
  if (!item) return;

  const updated = { ...item, platforms: { ...item.platforms, [platform]: newStatus } };

  try {
    const saved = await App.apiPut(`/api/backlog/${id}`, { platforms: updated.platforms });
    // Update local state
    const idx = allItems.findIndex(i => i.id === id);
    allItems[idx] = saved;
    applyFilters();
    updateStats();
    App.showToast('Estado actualizado');
  } catch (err) {
    App.showToast('Error al guardar', 'error');
  }
}

// ── Stats ──────────────────────────────────────────────────────────────────

async function updateStats() {
  try {
    const stats = await App.apiGet('/api/backlog/stats');
    document.getElementById('stat-total').textContent      = stats.total;
    document.getElementById('stat-entregadas').textContent = stats.entregadas;
    document.getElementById('stat-desarrollo').textContent = stats.enDesarrollo;
    document.getElementById('stat-bloqueadas').textContent = stats.bloqueadas;

    document.getElementById('sidebar-total').textContent     = stats.total;
    document.getElementById('sidebar-delivered').textContent = stats.entregadas;
    document.getElementById('sidebar-progress-bar').style.width = `${stats.porcentajeGlobal}%`;
  } catch (err) {
    console.error('Error cargando stats:', err);
  }
}

// ── Edit panel ─────────────────────────────────────────────────────────────

function populateEpicSelect(selectEl, currentEpic) {
  const epicFromItems = [...new Set(allItems.map(i => i.epic))];
  const all = [...new Set([...epicFromItems, ...allEpics])];
  selectEl.innerHTML = all.map(e =>
    `<option value="${e}"${e === currentEpic ? ' selected' : ''}>${e}</option>`
  ).join('');
}

function openEditPanel(id) {
  const item = allItems.find(i => i.id === id);
  if (!item) return;
  editingId = id;

  document.getElementById('panel-title').textContent = `Editar — ${item.feature}`;
  document.getElementById('panel-id').textContent    = item.id;

  populateEpicSelect(document.getElementById('edit-epic'), item.epic);

  document.getElementById('edit-web').value     = item.platforms.web;
  document.getElementById('edit-ios').value     = item.platforms.ios;
  document.getElementById('edit-android').value = item.platforms.android;
  document.getElementById('edit-atv').value     = item.platforms.atv;

  document.getElementById('edit-priority').value = item.priority;
  document.getElementById('edit-sprint').value   = item.sprint || '';
  document.getElementById('edit-figma').value    = item.figmaStatus || 'pendiente';

  const prdCheck = document.getElementById('edit-prd');
  prdCheck.checked = !!item.prdReady;
  document.getElementById('prd-label').textContent = item.prdReady ? 'Sí' : 'No';

  document.getElementById('edit-blocker').value        = item.blocker || '';
  document.getElementById('edit-blocker-reason').value = item.blockerReason || '';
  document.getElementById('edit-notes').value          = item.notes || '';

  const linkPRD   = item.linkPRD   || '';
  const linkFigma = item.linkFigma || '';
  document.getElementById('edit-link-prd').value   = linkPRD;
  document.getElementById('edit-link-figma').value = linkFigma;
  const openPrd   = document.getElementById('btn-open-prd');
  const openFigma = document.getElementById('btn-open-figma');
  openPrd.href   = linkPRD;
  openFigma.href = linkFigma;
  openPrd.style.display   = linkPRD   ? 'inline-flex' : 'none';
  openFigma.style.display = linkFigma ? 'inline-flex' : 'none';

  document.getElementById('edit-link-prd').addEventListener('input', function () {
    openPrd.href = this.value;
    openPrd.style.display = this.value ? 'inline-flex' : 'none';
  }, { once: true });
  document.getElementById('edit-link-figma').addEventListener('input', function () {
    openFigma.href = this.value;
    openFigma.style.display = this.value ? 'inline-flex' : 'none';
  }, { once: true });

  toggleBlockerReason(item.blocker);
  App.openPanel();
}

document.getElementById('edit-prd').addEventListener('change', function () {
  document.getElementById('prd-label').textContent = this.checked ? 'Sí' : 'No';
});

document.getElementById('edit-blocker').addEventListener('change', function () {
  toggleBlockerReason(this.value);
});

function toggleBlockerReason(blocker) {
  const wrap = document.getElementById('blocker-reason-wrap');
  wrap.style.display = blocker ? 'flex' : 'none';
}

document.getElementById('btn-save').addEventListener('click', async () => {
  if (!editingId) return;

  const prevItem  = allItems.find(i => i.id === editingId);
  const prevEpic  = prevItem ? prevItem.epic : '';
  const newEpic   = document.getElementById('edit-epic').value;

  const payload = {
    epic:          newEpic,
    platforms: {
      web:     document.getElementById('edit-web').value,
      ios:     document.getElementById('edit-ios').value,
      android: document.getElementById('edit-android').value,
      atv:     document.getElementById('edit-atv').value,
    },
    priority:      document.getElementById('edit-priority').value,
    sprint:        document.getElementById('edit-sprint').value.trim(),
    figmaStatus:   document.getElementById('edit-figma').value,
    prdReady:      document.getElementById('edit-prd').checked,
    blocker:       document.getElementById('edit-blocker').value,
    blockerReason: document.getElementById('edit-blocker-reason').value.trim(),
    notes:         document.getElementById('edit-notes').value.trim(),
    linkPRD:       document.getElementById('edit-link-prd').value.trim(),
    linkFigma:     document.getElementById('edit-link-figma').value.trim(),
  };

  try {
    const saved = await App.apiPut(`/api/backlog/${editingId}`, payload);
    const idx = allItems.findIndex(i => i.id === editingId);
    allItems[idx] = saved;
    applyFilters();
    updateStats();
    App.closePanel();
    if (newEpic !== prevEpic) {
      App.showToast(`Funcionalidad movida a ${newEpic}`);
    } else {
      App.showToast('Guardado correctamente');
    }
  } catch (err) {
    App.showToast('Error al guardar', 'error');
  }
});

// ── Export CSV ─────────────────────────────────────────────────────────────

document.getElementById('btn-export').addEventListener('click', () => {
  const headers = ['ID', 'Épica', 'Funcionalidad', 'Web', 'iOS', 'Android', 'ATV',
                   'Prioridad', 'Sprint', 'PRD Listo', 'Bloqueado por', 'Notas'];
  const rows = filteredItems.map(i => [
    i.id, i.epic, `"${i.feature}"`,
    i.platforms.web, i.platforms.ios, i.platforms.android, i.platforms.atv,
    i.priority, i.sprint || '',
    i.prdReady ? 'Sí' : 'No',
    i.blocker || '',
    `"${(i.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `backlog-ditu-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  App.showToast('CSV exportado');
});

// ── Populate epic filter ────────────────────────────────────────────────────

function populateEpicFilter() {
  const epicsFromItems = [...new Set(allItems.map(i => i.epic))];
  const epics = [...new Set([...epicsFromItems, ...allEpics])];
  const sel = document.getElementById('filter-epic');
  sel.innerHTML = '<option value="">Todas las épicas</option>';
  epics.forEach(epic => {
    const opt = document.createElement('option');
    opt.value = epic;
    opt.textContent = epic;
    sel.appendChild(opt);
  });
}

// ── Load epics ──────────────────────────────────────────────────────────────

async function loadEpics() {
  try {
    allEpics = await App.apiGet('/api/epics');
  } catch (err) {
    allEpics = [];
  }
}

// ── Column visibility ────────────────────────────────────────────────────────

const STORAGE_KEY = 'ditu-hub-columns';

function loadColumnVisibility() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    PLATFORMS.forEach(p => {
      if (typeof saved[p] === 'boolean') visiblePlatforms[p] = saved[p];
    });
  } catch (_) {}
}

function saveColumnVisibility() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(visiblePlatforms));
}

function applyColumnVisibility() {
  const table = document.getElementById('backlog-table');
  PLATFORMS.forEach(p => {
    table.classList.toggle(`hide-${p}`, !visiblePlatforms[p]);
  });
  // Sync checkboxes
  document.querySelectorAll('.col-toggle').forEach(cb => {
    cb.checked = visiblePlatforms[cb.dataset.col];
  });
}

function initColumnVisibility() {
  loadColumnVisibility();
  applyColumnVisibility();

  const popover = document.getElementById('columns-popover');
  const btn     = document.getElementById('btn-columns');

  btn.addEventListener('click', e => {
    e.stopPropagation();
    popover.classList.toggle('open');
  });

  document.querySelectorAll('.col-toggle').forEach(cb => {
    cb.addEventListener('change', () => {
      const col = cb.dataset.col;
      const newState = cb.checked;
      const visibleCount = PLATFORMS.filter(p => visiblePlatforms[p]).length;

      if (!newState && visibleCount <= 1) {
        cb.checked = true;
        cb.title = 'Debe quedar al menos una plataforma visible';
        setTimeout(() => { cb.title = ''; }, 2000);
        return;
      }

      visiblePlatforms[col] = newState;
      saveColumnVisibility();
      applyColumnVisibility();
    });
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.columns-control')) {
      popover.classList.remove('open');
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') popover.classList.remove('open');
  });
}

// ── Init ───────────────────────────────────────────────────────────────────

async function init() {
  try {
    [allItems, allEpics] = await Promise.all([
      App.apiGet('/api/backlog'),
      App.apiGet('/api/epics'),
    ]);
    filteredItems = [...allItems];
    populateEpicFilter();
    initColumnVisibility();
    renderTable();
    updateStats();
  } catch (err) {
    console.error('Error iniciando backlog:', err);
    App.showToast('Error al cargar el backlog', 'error');
  }
}

// ── Nuevo modal ─────────────────────────────────────────────────────────────

function openNuevoModal() {
  const overlay = document.getElementById('nuevo-modal-overlay');
  overlay.style.display = 'flex';
  // Reset to first tab
  switchNuevoTab('epic');
  document.getElementById('nuevo-epic-name').value    = '';
  document.getElementById('nuevo-feature-name').value = '';
  document.getElementById('nuevo-epic-error').textContent    = '';
  document.getElementById('nuevo-feature-error').textContent = '';
  // Populate feature epic dropdown
  populateNuevoFeatureEpicSelect();
  setTimeout(() => document.getElementById('nuevo-epic-name').focus(), 50);
}

function closeNuevoModal() {
  document.getElementById('nuevo-modal-overlay').style.display = 'none';
}

function switchNuevoTab(tab) {
  document.querySelectorAll('.nuevo-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.getElementById('nuevo-panel-epic').style.display    = tab === 'epic'    ? 'block' : 'none';
  document.getElementById('nuevo-panel-feature').style.display = tab === 'feature' ? 'block' : 'none';
}

function populateNuevoFeatureEpicSelect() {
  const epicFromItems = [...new Set(allItems.map(i => i.epic))];
  const epics = [...new Set([...epicFromItems, ...allEpics])];
  const sel = document.getElementById('nuevo-feature-epic');
  sel.innerHTML = '<option value="">Selecciona una épica...</option>' +
    epics.map(e => `<option value="${e}">${e}</option>`).join('');
}

document.getElementById('btn-nuevo').addEventListener('click', openNuevoModal);
document.getElementById('nuevo-modal-close').addEventListener('click', closeNuevoModal);
document.getElementById('nuevo-modal-cancel').addEventListener('click', closeNuevoModal);
document.getElementById('nuevo-modal-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeNuevoModal();
});

document.querySelectorAll('.nuevo-tab').forEach(tab => {
  tab.addEventListener('click', () => switchNuevoTab(tab.dataset.tab));
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.getElementById('nuevo-modal-overlay').style.display === 'flex') {
    closeNuevoModal();
  }
});

document.getElementById('nuevo-modal-save').addEventListener('click', async () => {
  const activeTab = document.querySelector('.nuevo-tab.active').dataset.tab;

  if (activeTab === 'epic') {
    const name = document.getElementById('nuevo-epic-name').value.trim();
    const errEl = document.getElementById('nuevo-epic-error');
    if (!name) { errEl.textContent = 'El nombre es requerido'; return; }
    errEl.textContent = '';
    try {
      await App.apiPost('/api/epics', { name });
      allEpics = await App.apiGet('/api/epics');
      populateEpicFilter();
      renderTable();
      closeNuevoModal();
      App.showToast('✓ Épica creada correctamente');
    } catch (err) {
      errEl.textContent = 'Error: ' + (JSON.parse(err.message || '{}').error || err.message);
    }
  } else {
    const feature  = document.getElementById('nuevo-feature-name').value.trim();
    const epic     = document.getElementById('nuevo-feature-epic').value;
    const errEl    = document.getElementById('nuevo-feature-error');
    if (!feature) { errEl.textContent = 'El nombre es requerido'; return; }
    if (!epic)    { errEl.textContent = 'Selecciona una épica';   return; }
    errEl.textContent = '';
    try {
      const newItem = await App.apiPost('/api/backlog', { feature, epic });
      allItems.push(newItem);
      filteredItems = [...allItems];
      populateEpicFilter();
      renderTable();
      updateStats();
      closeNuevoModal();
      App.showToast('✓ Funcionalidad creada correctamente');
    } catch (err) {
      errEl.textContent = 'Error al guardar';
    }
  }
});

init();
