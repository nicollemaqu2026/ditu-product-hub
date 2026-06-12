// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_LABELS = {
  'backlog':          'Backlog',
  'en-definicion':    'En definición',
  'listo-para-dev':   'Listo para dev',
  'en-construccion':  'En construcción',
  'en-qa':            'En QA',
  'uat':              'UAT',
  'cerrado':          'Cerrado',
};

const PRIORITY_LABELS = { alta: 'Alta', media: 'Media', baja: 'Baja' };
const PLATFORMS = ['ios', 'android'];
const PLATFORM_LABELS = { ios: 'iOS', android: 'Android' };

// ── State ──────────────────────────────────────────────────────────────────

let allItems = [];
let filteredItems = [];
let editingId = null;
let activeDropdown = null;
let allEpics = [];
let visiblePlatforms = { ios: true, android: true };

// ── Filters ────────────────────────────────────────────────────────────────

const filterEpic     = document.getElementById('filter-epic');
const filterPlatform = document.getElementById('filter-platform');
const filterStatus   = document.getElementById('filter-status');
const filterBlocker  = document.getElementById('filter-blocker');
const filterSearch   = document.getElementById('filter-search');
const filterBeta     = document.getElementById('filter-beta');

function applyFilters() {
  const epic     = filterEpic.value;
  const platform = filterPlatform.value;
  const status   = filterStatus.value;
  const blocker  = filterBlocker.value;
  const search   = filterSearch.value.trim().toLowerCase();
  const beta     = filterBeta ? filterBeta.value : '';

  filteredItems = allItems.filter(item => {
    if (epic && item.epic !== epic) return false;
    if (beta === 'beta'      && item.enBeta2026 === false) return false;
    if (beta === 'evolutivo' && item.enBeta2026 !== false) return false;
    if (status && platform) {
      if (item.platforms[platform] !== status) return false;
    } else if (status) {
      if (!PLATFORMS.some(p => item.platforms[p] === status)) return false;
    } else if (platform) {
      if (item.platforms[platform] === 'backlog') return false;
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
if (filterBeta) filterBeta.addEventListener('change', applyFilters);
filterSearch.addEventListener('input', applyFilters);

document.getElementById('btn-clear-filters').addEventListener('click', clearFilters);

function clearFilters() {
  filterEpic.value = '';
  filterPlatform.value = '';
  filterStatus.value = '';
  filterBlocker.value = '';
  filterSearch.value = '';
  if (filterBeta) filterBeta.value = '';
  applyFilters();
}

// ── Render helpers ─────────────────────────────────────────────────────────

function statusPill(itemId, platform, status) {
  const label = STATUS_LABELS[status] || status;
  return `<div class="status-pill status-${status}" data-id="${itemId}" data-platform="${platform}" tabindex="0">
    <span class="status-dot"></span>
    <span>${label}</span>
  </div>`;
}

function statusDotColor(status) {
  const map = {
    'backlog':         '#55556A',
    'en-definicion':   '#3B82F6',
    'listo-para-dev':  '#F59E0B',
    'en-construccion': '#7C3AED',
    'en-qa':           '#F97316',
    'uat':             '#06B6D4',
    'cerrado':         '#10B981',
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

const COLGROUP = `<colgroup>
  <col class="col-id" /><col class="col-feature" /><col class="col-prd-icon" />
  <col class="col-plat col-ios-col" /><col class="col-plat col-android-col" />
  <col class="col-prio" /><col class="col-bloqueo" /><col class="col-actions" />
</colgroup>`;

function featureRowHtml(item) {
  const evolutivoBadge = item.enBeta2026 === false
    ? '<span class="badge-evolutivo">Evolutivo</span>' : '';
  const rowClass = item.enBeta2026 === false ? ' class="feature-row feature-row-evo"' : ' class="feature-row"';
  return `<tr${rowClass} data-id="${item.id}">
    <td class="cell-id"><button class="drag-handle-row" title="Arrastrar">⠿</button><span>${item.id}</span></td>
    <td class="cell-feature-name" data-id="${item.id}"><span class="feature-name-text">${item.feature}</span>${evolutivoBadge}<button class="btn-edit-feature-name" title="Renombrar">✏</button></td>
    ${prdIconCell(item)}
    <td class="col-ios-col">${statusPill(item.id, 'ios', item.platforms.ios)}</td>
    <td class="col-android-col">${statusPill(item.id, 'android', item.platforms.android)}</td>
    <td style="text-align:center">${priorityBadge(item.priority)}</td>
    <td style="text-align:center">${blockerPill(item.blocker)}</td>
    <td>
      <div class="actions-cell">
        <button class="btn-icon edit-btn" data-id="${item.id}" title="Editar">✏</button>
        <button class="btn-icon notes-btn" data-id="${item.id}" title="${item.notes ? 'Ver notas' : 'Sin notas'}" style="${item.notes ? 'color:var(--warning)' : ''}">📝</button>
      </div>
    </td>
  </tr>`;
}

const EMPTY_STATE_HTML = `<tr><td colspan="8"><div class="empty-state">
  <div class="empty-state-icon">🔍</div>
  <p>No se encontraron funcionalidades con estos filtros</p>
  <button class="btn btn-ghost" onclick="clearFilters()">Limpiar filtros</button>
</div></td></tr>`;

function renderTable() {
  const container = document.getElementById('backlog-table');
  // Remove previous epic groups and empty states (keep .bt-head)
  container.querySelectorAll('.epic-group, .empty-state-wrapper').forEach(el => el.remove());

  const epicFromItems = [...new Set(allItems.map(i => i.epic))];
  const rawOrder      = [...new Set([...epicFromItems, ...allEpics])];
  const epicOrder     = loadEpicOrder(rawOrder);

  const hasFilteredItems = filteredItems.length > 0;
  const hasAnyEpics      = epicOrder.length > 0;

  if (!hasFilteredItems && !hasAnyEpics) {
    const empty = document.createElement('div');
    empty.className = 'empty-state-wrapper';
    empty.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">🔍</div>
      <p>No se encontraron funcionalidades con estos filtros</p>
      <button class="btn btn-ghost" onclick="clearFilters()">Limpiar filtros</button>
    </div>`;
    container.appendChild(empty);
    attachTableEvents();
    return;
  }

  const groups = {};
  filteredItems.forEach(item => {
    if (!groups[item.epic]) groups[item.epic] = [];
    groups[item.epic].push(item);
  });

  let anyRendered = false;

  epicOrder.forEach(epic => {
    const filteredForEpic  = groups[epic];
    const allForEpic       = allItems.filter(i => i.epic === epic);
    const isGenuinelyEmpty = allForEpic.length === 0;

    if (!filteredForEpic && !isGenuinelyEmpty) return;
    anyRendered = true;

    const betaItems  = allForEpic.filter(i => i.enBeta2026 !== false);
    const evolutivos = allForEpic.length - betaItems.length;
    const delivered  = betaItems.filter(i =>
      ['ios', 'android'].every(p => i.platforms[p] === 'cerrado')
    ).length;
    const pct        = betaItems.length > 0 ? Math.round((delivered / betaItems.length) * 100) : 0;
    const visible    = filteredForEpic ? filteredForEpic.length : 0;
    const isFiltered = visible < allForEpic.length;
    const betaCountLabel = `${delivered}/${betaItems.length} · Beta 2026`;
    const evLabel    = evolutivos > 0 ? ` · <span class="epic-evolutivos">+${evolutivos} futuro</span>` : '';
    const countLabel = isFiltered
      ? `${visible} de ${allForEpic.length} visibles`
      : betaCountLabel + evLabel;

    const group = document.createElement('div');
    group.className   = 'epic-group';
    group.dataset.epic = epic;

    // Epic header row
    let html = `<div class="epic-row">
      <div class="epic-header">
        <button class="drag-handle-epic" title="Arrastrar épica">⠿</button>
        <span class="epic-name">${epic}</span>
        <button class="btn-edit-epic-name" title="Renombrar épica">✏</button>
        <div class="epic-progress-wrap">
          <div class="epic-progress-bar-bg">
            <div class="epic-progress-bar-fill" style="width:${pct}%"></div>
          </div>
        </div>
        <span class="epic-count">${countLabel}</span>
        <button class="btn-delete-epic" data-epic="${epic}" title="Eliminar épica">🗑</button>
      </div>
    </div>`;

    const rows = isGenuinelyEmpty
      ? ''
      : loadFeatureOrder(epic, filteredForEpic).map(item => featureRowHtml(item)).join('');

    if (isGenuinelyEmpty) {
      html += `<div class="empty-epic-cell">Sin funcionalidades aún — agrega una</div>`;
    }

    // Always render the features-table so empty epics can receive drops
    html += `<table class="features-table">
      ${COLGROUP}
      <tbody data-epic="${epic}">${rows}</tbody>
    </table>`;

    group.innerHTML = html;
    container.appendChild(group);
  });

  if (!anyRendered) {
    const empty = document.createElement('div');
    empty.className = 'empty-state-wrapper';
    empty.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">🔍</div>
      <p>No se encontraron funcionalidades con estos filtros</p>
      <button class="btn btn-ghost" onclick="clearFilters()">Limpiar filtros</button>
    </div>`;
    container.appendChild(empty);
  }

  attachTableEvents();
  initSortable();
}

// ── Table event delegation ─────────────────────────────────────────────────

let _tableEventsAttached = false;

function attachTableEvents() {
  if (_tableEventsAttached) return;
  _tableEventsAttached = true;
  const table = document.getElementById('backlog-table');

  // Status pill click — open portal dropdown
  table.addEventListener('click', e => {
    const pill = e.target.closest('.status-pill');

    if (pill) {
      e.stopPropagation();
      const pillKey = `${pill.dataset.id}-${pill.dataset.platform}`;
      const portal  = document.getElementById('dd-portal');
      if (!portal) return;

      if (portal.classList.contains('open') && portal.dataset.pill === pillKey) {
        closeAllDropdowns(); return;
      }

      portal.innerHTML = Object.entries(STATUS_LABELS).map(([val, lbl]) =>
        `<div class="status-dropdown-item" data-value="${val}" data-id="${pill.dataset.id}" data-platform="${pill.dataset.platform}">
          <span class="status-dot" style="background:${statusDotColor(val)}"></span>${lbl}
        </div>`).join('');

      const rect = pill.getBoundingClientRect();
      portal.style.top  = `${rect.bottom + 6}px`;
      portal.style.left = `${rect.left}px`;
      portal.dataset.pill = pillKey;
      portal.classList.add('open');
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

    // Inline edit epic name
    const editEpicBtn = e.target.closest('.btn-edit-epic-name');
    if (editEpicBtn) {
      e.stopPropagation();
      startInlineEpicEdit(editEpicBtn);
      return;
    }

    // Inline edit feature name
    const editFeatBtn = e.target.closest('.btn-edit-feature-name');
    if (editFeatBtn) {
      e.stopPropagation();
      startInlineFeatureEdit(editFeatBtn);
      return;
    }

    // Delete epic button
    const deleteEpicBtn = e.target.closest('.btn-delete-epic');
    if (deleteEpicBtn) {
      e.stopPropagation();
      const epicName = deleteEpicBtn.dataset.epic;
      const count = allItems.filter(i => i.epic === epicName).length;
      const msg = count > 0
        ? `¿Eliminar la épica "${epicName}"?\nSe eliminarán también sus ${count} funcionalidad${count !== 1 ? 'es' : ''}.`
        : `¿Eliminar la épica "${epicName}"?`;
      showConfirmDelete(msg, `Sí, eliminar todo`, async () => {
        await App.apiDelete(`/api/backlog/epic/${encodeURIComponent(epicName)}`);
        allItems     = allItems.filter(i => i.epic !== epicName);
        filteredItems = filteredItems.filter(i => i.epic !== epicName);
        allEpics      = allEpics.filter(e => e !== epicName);
        renderTable();
        updateStats();
        App.showToast('✓ Épica eliminada');
      });
      return;
    }

    closeAllDropdowns();
  });
}

function closeAllDropdowns() {
  const portal = document.getElementById('dd-portal');
  if (portal) portal.classList.remove('open');
  activeDropdown = null;
}

// Portal dropdown item click
document.getElementById('dd-portal')?.addEventListener('click', e => {
  const ddItem = e.target.closest('.status-dropdown-item');
  if (!ddItem) return;
  e.stopPropagation();
  updatePlatformStatus(ddItem.dataset.id, ddItem.dataset.platform, ddItem.dataset.value);
  closeAllDropdowns();
});

document.addEventListener('click', e => {
  if (!e.target.closest('.status-pill') && !e.target.closest('#dd-portal')) {
    closeAllDropdowns();
  }
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

  document.getElementById('panel-feature-name').value = item.feature;
  document.getElementById('panel-id').textContent     = item.id;

  populateEpicSelect(document.getElementById('edit-epic'), item.epic);

  document.getElementById('edit-ios').value     = item.platforms.ios;
  document.getElementById('edit-android').value = item.platforms.android;

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

  document.getElementById('edit-fecha-compromiso').value = item.fechaCompromiso || '';
  document.getElementById('edit-fecha-entrega').value    = item.fechaEntrega    || '';
  const fechaRealEl = document.getElementById('edit-fecha-real');
  fechaRealEl.value = item.fechaEntregaReal || '';
  fechaRealEl.classList.toggle('date-real-set', !!(item.fechaEntregaReal));

  const betaCheck = document.getElementById('edit-beta');
  betaCheck.checked = item.enBeta2026 !== false;
  document.getElementById('beta-label').textContent = betaCheck.checked ? 'Sí' : 'No';

  renderUatSection(item);
  toggleBlockerReason(item.blocker);
  App.openPanel();
}

document.getElementById('edit-prd').addEventListener('change', function () {
  document.getElementById('prd-label').textContent = this.checked ? 'Sí' : 'No';
});

document.getElementById('edit-beta').addEventListener('change', function () {
  document.getElementById('beta-label').textContent = this.checked ? 'Sí' : 'No';
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

  const newFeatureName = document.getElementById('panel-feature-name').value.trim();
  const payload = {
    feature:       newFeatureName || prevItem.feature,
    epic:          newEpic,
    platforms: {
      ios:     document.getElementById('edit-ios').value,
      android: document.getElementById('edit-android').value,
    },
    priority:      document.getElementById('edit-priority').value,
    sprint:        document.getElementById('edit-sprint').value.trim(),
    figmaStatus:   document.getElementById('edit-figma').value,
    prdReady:      document.getElementById('edit-prd').checked,
    blocker:       document.getElementById('edit-blocker').value,
    blockerReason: document.getElementById('edit-blocker-reason').value.trim(),
    notes:         document.getElementById('edit-notes').value.trim(),
    linkPRD:           document.getElementById('edit-link-prd').value.trim(),
    linkFigma:         document.getElementById('edit-link-figma').value.trim(),
    fechaCompromiso:   document.getElementById('edit-fecha-compromiso').value,
    fechaEntrega:      document.getElementById('edit-fecha-entrega').value,
    fechaEntregaReal:  document.getElementById('edit-fecha-real').value,
    enBeta2026:        document.getElementById('edit-beta').checked,
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
  const headers = ['ID', 'Épica', 'Funcionalidad', 'iOS', 'Android',
                   'Prioridad', 'Sprint', 'PRD Listo', 'Bloqueado por', 'Notas'];
  const rows = filteredItems.map(i => [
    i.id, i.epic, `"${i.feature}"`,
    i.platforms.ios, i.platforms.android,
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
    // Remove stale web/atv keys from storage
    const cleaned = {};
    PLATFORMS.forEach(p => { cleaned[p] = visiblePlatforms[p]; });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
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

// ── Epic / Feature order persistence ──────────────────────────────────────

const EPIC_ORDER_KEY    = 'ditu-epic-order';
const FEAT_ORDER_PREFIX = 'ditu-feature-order-';

function loadEpicOrder(epics) {
  try {
    const saved = JSON.parse(localStorage.getItem(EPIC_ORDER_KEY) || '[]');
    if (!saved.length) return epics;
    const known    = saved.filter(e => epics.includes(e));
    const newEpics = epics.filter(e => !saved.includes(e));
    return [...known, ...newEpics];
  } catch { return epics; }
}

function saveEpicOrder() {
  const order = [...document.querySelectorAll('#backlog-table .epic-group')]
    .map(g => g.dataset.epic);
  localStorage.setItem(EPIC_ORDER_KEY, JSON.stringify(order));
}

function loadFeatureOrder(epicName, items) {
  try {
    const saved = JSON.parse(localStorage.getItem(FEAT_ORDER_PREFIX + epicName) || '[]');
    if (!saved.length) return items;
    const ordered  = saved.map(id => items.find(i => i.id === id)).filter(Boolean);
    const newItems = items.filter(i => !saved.includes(i.id));
    return [...ordered, ...newItems];
  } catch { return items; }
}

function saveFeatureOrder(epicName) {
  const group = document.querySelector(`#backlog-table .epic-group[data-epic="${CSS.escape(epicName)}"]`);
  if (!group) return;
  const ids = [...group.querySelectorAll('tr.feature-row')].map(tr => tr.dataset.id);
  localStorage.setItem(FEAT_ORDER_PREFIX + epicName, JSON.stringify(ids));
}

// ── Sortable ───────────────────────────────────────────────────────────────

let _epicSortable     = null;
let _featureSortables = [];

function updateEpicHeadersOnly() {
  document.querySelectorAll('#backlog-table .epic-group').forEach(group => {
    const epicName   = group.dataset.epic;
    const allForEpic = allItems.filter(i => i.epic === epicName);
    const visible    = group.querySelectorAll('.feature-row').length;
    const delivered  = allForEpic.filter(i =>
      ['ios', 'android'].every(p => i.platforms[p] === 'cerrado')
    ).length;
    const pct        = allForEpic.length ? Math.round(delivered / allForEpic.length * 100) : 0;
    const isFiltered = visible < allForEpic.length;
    const label      = isFiltered
      ? `${visible} de ${allForEpic.length} visibles`
      : `${delivered}/${allForEpic.filter(i=>i.enBeta2026!==false).length} · Beta 2026`;
    const fill  = group.querySelector('.epic-progress-bar-fill');
    const count = group.querySelector('.epic-count');
    if (fill)  fill.style.width  = `${pct}%`;
    if (count) count.textContent = label;
  });
}

function initSortable() {
  if (!window.Sortable) return;

  // Destroy old instances
  if (_epicSortable) { _epicSortable.destroy(); _epicSortable = null; }
  _featureSortables.forEach(s => s.destroy());
  _featureSortables = [];

  const container = document.getElementById('backlog-table');

  // Level 1 — reorder epic groups (div.epic-group — no table layout issues)
  _epicSortable = Sortable.create(container, {
    handle:      '.drag-handle-epic',
    draggable:   '.epic-group',
    animation:   150,
    ghostClass:  'drag-ghost-epic',
    onEnd() { saveEpicOrder(); },
  });

  // Level 2 & 3 — reorder features within/across epic feature tables
  container.querySelectorAll('.features-table tbody').forEach(tbody => {
    const s = Sortable.create(tbody, {
      handle:     '.drag-handle-row',
      draggable:  '.feature-row',
      filter:     '.epic-row,.empty-epic-cell',
      group:                { name: 'features', pull: true, put: true },
      animation:            150,
      ghostClass:           'drag-ghost-row',
      emptyInsertThreshold: 40,
      async onEnd(evt) {
        const fromEpic = evt.from.dataset.epic;
        const toEpic   = evt.to.dataset.epic;
        const id       = evt.item.dataset.id;

        // Same epic — just save new order
        if (fromEpic === toEpic) {
          saveFeatureOrder(toEpic);
          return;
        }

        // Dropped outside any epic group — revert
        if (!toEpic) {
          applyFilters();
          return;
        }

        // Cross-epic: save DOM order BEFORE re-render while SortableJS DOM is correct
        saveFeatureOrder(fromEpic);
        saveFeatureOrder(toEpic);

        try {
          await App.apiPut(`/api/backlog/${id}`, { epic: toEpic });
          const item = allItems.find(i => i.id === id);
          if (item) item.epic = toEpic;
          App.showToast(`✓ Movida a ${toEpic}`);
        } catch {
          App.showToast('Error al mover funcionalidad', 'error');
        }

        // Full re-render: fixes empty-state rows, progress bars and cross-epic misplacement
        applyFilters();
      },
    });
    _featureSortables.push(s);
  });
}

// ── UAT Sign-off ──────────────────────────────────────────────────────────

function renderUatSection(item) {
  const section   = document.getElementById('uat-signoff-section');
  const container = document.getElementById('uat-platforms-container');
  const histSec   = document.getElementById('uat-history-section');
  const histEl    = document.getElementById('uat-history-entries');
  if (!section || !container) return;

  const uatPlats = ['ios', 'android'].filter(p => item.platforms?.[p] === 'uat');
  section.style.display = uatPlats.length ? '' : 'none';

  if (uatPlats.length) {
    container.innerHTML = uatPlats.map(p =>
      `<div class="uat-plat-row" data-platform="${p}">
        <span class="uat-plat-label">${p === 'ios' ? 'iOS' : 'Android'}</span>
        <div class="uat-btn-row">
          <button class="btn-uat-approve" data-platform="${p}">✓ Aprobar</button>
          <button class="btn-uat-feedback" data-platform="${p}">↩ UAT con Feedback</button>
        </div>
        <div class="uat-fb-form" data-platform="${p}" style="display:none">
          <textarea class="uat-fb-textarea form-control" placeholder="Describe qué debe corregir el equipo..." style="min-height:80px;border-color:var(--error)"></textarea>
          <button class="btn-uat-submit" data-platform="${p}">Enviar feedback</button>
        </div>
      </div>`
    ).join('');

    // Approve
    container.querySelectorAll('.btn-uat-approve').forEach(btn => {
      btn.addEventListener('click', async () => {
        const plat = btn.dataset.platform;
        const today = new Date().toISOString().split('T')[0];
        const item2 = allItems.find(i => i.id === editingId);
        const platforms = { ...item2.platforms, [plat]: 'cerrado' };
        const fechaEntregaReal = item2.fechaEntregaReal || today;
        try {
          const saved = await App.apiPut(`/api/backlog/${editingId}`, { platforms, fechaEntregaReal });
          const idx = allItems.findIndex(i => i.id === editingId);
          allItems[idx] = saved;
          applyFilters(); updateStats();
          document.getElementById('edit-' + plat).value = 'cerrado';
          document.getElementById('edit-fecha-real').value = fechaEntregaReal;
          renderUatSection(saved);
          App.showToast(`✓ ${saved.feature} aprobada en ${plat === 'ios' ? 'iOS' : 'Android'}`);
        } catch { App.showToast('Error al aprobar', 'error'); }
      });
    });

    // UAT con feedback — show textarea
    container.querySelectorAll('.btn-uat-feedback').forEach(btn => {
      btn.addEventListener('click', () => {
        const form = container.querySelector(`.uat-fb-form[data-platform="${btn.dataset.platform}"]`);
        if (form) form.style.display = form.style.display === 'none' ? '' : 'none';
      });
    });

    // Submit feedback
    container.querySelectorAll('.btn-uat-submit').forEach(btn => {
      btn.addEventListener('click', async () => {
        const plat   = btn.dataset.platform;
        const form   = container.querySelector(`.uat-fb-form[data-platform="${plat}"]`);
        const nota   = form?.querySelector('.uat-fb-textarea')?.value.trim();
        if (!nota) { App.showToast('El feedback no puede estar vacío', 'error'); return; }
        const item2 = allItems.find(i => i.id === editingId);
        const platforms = { ...item2.platforms, [plat]: 'en-construccion' };
        const uatFeedback = [...(item2.uatFeedback || []), {
          plataforma: plat,
          fecha: new Date().toISOString().split('T')[0],
          nota,
        }];
        try {
          const saved = await App.apiPut(`/api/backlog/${editingId}`, { platforms, uatFeedback });
          const idx = allItems.findIndex(i => i.id === editingId);
          allItems[idx] = saved;
          applyFilters(); updateStats();
          document.getElementById('edit-' + plat).value = 'en-construccion';
          renderUatSection(saved);
          App.showToast('↩ Regresado a construcción con feedback');
        } catch { App.showToast('Error al enviar feedback', 'error'); }
      });
    });
  }

  // UAT feedback history
  const feedback = item.uatFeedback || [];
  if (histSec && histEl) {
    histSec.style.display = feedback.length ? '' : 'none';
    if (feedback.length) {
      const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
      histEl.innerHTML = feedback.slice().reverse().map(f => {
        const d = new Date(f.fecha + 'T00:00:00');
        const fmtDate = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
        return `<div class="uat-hist-entry">
          <div class="uat-hist-meta">
            <span class="uat-hist-date">${fmtDate}</span>
            <span class="uat-plat-label" style="font-size:10px">${f.plataforma === 'ios' ? 'iOS' : 'Android'}</span>
          </div>
          <div class="uat-hist-nota">${f.nota}</div>
        </div>`;
      }).join('<div class="uat-hist-sep"></div>');
    }
  }

  // Toggle history
  const togBtn = document.getElementById('uat-history-toggle');
  if (togBtn) {
    togBtn.onclick = () => {
      const el = document.getElementById('uat-history-entries');
      const open = el.style.display !== 'none';
      el.style.display = open ? 'none' : '';
      togBtn.textContent = (open ? '▸' : '▾') + ` Historial de feedback UAT (${feedback.length})`;
    };
    togBtn.textContent = `▸ Historial de feedback UAT (${feedback.length})`;
  }
}

// ── Inline edit — epic name ────────────────────────────────────────────────

function startInlineEpicEdit(pencilBtn) {
  const header  = pencilBtn.closest('.epic-header');
  const group   = pencilBtn.closest('.epic-group');
  const nameSpan = header.querySelector('.epic-name');
  const oldName  = nameSpan.textContent;

  const input = document.createElement('input');
  input.className = 'inline-edit-input';
  input.value = oldName;
  nameSpan.replaceWith(input);
  pencilBtn.style.opacity = '0';
  pencilBtn.style.pointerEvents = 'none';
  input.focus(); input.select();

  let errorSpan = null;
  let committed = false;

  function showError(msg) {
    input.classList.add('error');
    if (!errorSpan) {
      errorSpan = document.createElement('span');
      errorSpan.className = 'inline-edit-error';
      input.after(errorSpan);
    }
    errorSpan.textContent = msg;
  }

  function restore(name) {
    const span = document.createElement('span');
    span.className = 'epic-name';
    span.textContent = name;
    if (input.parentNode) input.replaceWith(span);
    if (errorSpan) errorSpan.remove();
    pencilBtn.style.opacity = '';
    pencilBtn.style.pointerEvents = '';
  }

  async function save() {
    if (committed) return;
    committed = true;
    const newName = input.value.trim();

    if (!newName) {
      committed = false;
      showError('El nombre no puede estar vacío');
      return;
    }
    if (newName === oldName) { restore(oldName); return; }

    // Check duplicate
    const existingEpics = [...document.querySelectorAll('#backlog-table .epic-group')]
      .map(g => g.dataset.epic).filter(n => n !== oldName);
    if (existingEpics.includes(newName)) {
      committed = false;
      showError('Ya existe una épica con este nombre');
      return;
    }

    try {
      await App.apiPut('/api/backlog/epic/rename', { oldName, newName });

      // Update local state
      allItems.forEach(i => { if (i.epic === oldName) i.epic = newName; });
      filteredItems.forEach(i => { if (i.epic === oldName) i.epic = newName; });
      allEpics = allEpics.map(e => e === oldName ? newName : e);

      // Update DOM
      if (group) {
        group.dataset.epic = newName;
        const tbody = group.querySelector('.features-table tbody');
        if (tbody) tbody.dataset.epic = newName;
        const delBtn = group.querySelector('.btn-delete-epic');
        if (delBtn) delBtn.dataset.epic = newName;
      }

      restore(newName);
      saveEpicOrder();
      populateEpicFilter();
      App.showToast('✓ Épica renombrada');
    } catch {
      committed = false;
      showError('Error al guardar');
    }
  }

  function cancel() {
    if (committed) return;
    committed = true;
    restore(oldName);
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); save(); }
    if (e.key === 'Escape') { e.preventDefault(); cancel(); }
  });
  input.addEventListener('blur', () => { if (!committed) save(); });
}

// ── Inline edit — feature name ─────────────────────────────────────────────

function startInlineFeatureEdit(pencilBtn) {
  const cell     = pencilBtn.closest('.cell-feature-name');
  const nameSpan = cell.querySelector('.feature-name-text');
  const id       = cell.dataset.id;
  const oldName  = nameSpan.textContent;

  const input = document.createElement('input');
  input.className = 'inline-edit-input feat';
  input.value = oldName;
  nameSpan.replaceWith(input);
  pencilBtn.style.display = 'none';
  input.focus(); input.select();

  let committed = false;

  function restore(name) {
    const span = document.createElement('span');
    span.className = 'feature-name-text';
    span.textContent = name;
    if (input.parentNode) input.replaceWith(span);
    pencilBtn.style.display = '';
  }

  async function save() {
    if (committed) return;
    committed = true;
    const newName = input.value.trim();
    if (!newName) { committed = false; input.classList.add('error'); return; }
    if (newName === oldName) { restore(oldName); return; }

    try {
      await App.apiPut(`/api/backlog/${id}`, { feature: newName });
      const item = allItems.find(i => i.id === id);
      if (item) item.feature = newName;
      restore(newName);
      // Sync panel if this item is open
      if (editingId === id) {
        document.getElementById('panel-feature-name').value = newName;
      }
      App.showToast('✓ Nombre actualizado');
    } catch {
      committed = false;
      input.classList.add('error');
    }
  }

  function cancel() {
    if (committed) return;
    committed = true;
    restore(oldName);
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); save(); }
    if (e.key === 'Escape') { e.preventDefault(); cancel(); }
  });
  input.addEventListener('blur', () => { if (!committed) save(); });
}

// ── Confirm delete modal ──────────────────────────────────────────────────

let _confirmDeleteCallback = null;

function showConfirmDelete(message, confirmLabel, onConfirm) {
  _confirmDeleteCallback = onConfirm;
  const overlay = document.getElementById('confirm-delete-overlay');
  const msgEl   = document.getElementById('confirm-delete-msg');
  const okBtn   = document.getElementById('confirm-delete-ok');
  // Split on \n for multi-line messages
  msgEl.innerHTML = message.replace(/\n/g, '<br>');
  okBtn.textContent = confirmLabel || 'Sí, eliminar';
  overlay.style.display = 'flex';
}

function closeConfirmDelete() {
  document.getElementById('confirm-delete-overlay').style.display = 'none';
  _confirmDeleteCallback = null;
}

document.getElementById('confirm-delete-cancel').addEventListener('click', closeConfirmDelete);
document.getElementById('confirm-delete-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeConfirmDelete();
});
document.getElementById('confirm-delete-ok').addEventListener('click', async () => {
  if (!_confirmDeleteCallback) return;
  const cb = _confirmDeleteCallback;
  closeConfirmDelete();
  try {
    await cb();
  } catch (err) {
    App.showToast('Error al eliminar', 'error');
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.getElementById('confirm-delete-overlay').style.display === 'flex') {
    closeConfirmDelete();
  }
});

// ── Delete feature ─────────────────────────────────────────────────────────

document.getElementById('btn-delete-feature').addEventListener('click', () => {
  if (!editingId) return;
  const item = allItems.find(i => i.id === editingId);
  if (!item) return;
  showConfirmDelete(
    `¿Eliminar "${item.feature}"?`,
    'Sí, eliminar',
    async () => {
      await App.apiDelete(`/api/backlog/${editingId}`);
      allItems = allItems.filter(i => i.id !== editingId);
      filteredItems = filteredItems.filter(i => i.id !== editingId);
      App.closePanel();
      renderTable();
      updateStats();
      App.showToast('✓ Funcionalidad eliminada');
    }
  );
});

init();
