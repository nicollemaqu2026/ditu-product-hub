// ── Constants ──────────────────────────────────────────────────────────────

const PRD_STATUS_LABELS = {
  'borrador':    'Borrador',
  'en-revision': 'En Revisión',
  'aprobado':    'Aprobado',
};

const REQ_PRIORITY_OPTIONS = [
  { value: 'must-have',    label: 'Must Have' },
  { value: 'should-have',  label: 'Should Have' },
  { value: 'nice-to-have', label: 'Nice to Have' },
];

// ── State ──────────────────────────────────────────────────────────────────

let prdAllItems     = [];
let prdFiltered     = [];
let prdBacklogItems = [];
let prdCurrent      = null;
let prdIsDirty      = false;

// ── DOM refs ───────────────────────────────────────────────────────────────

const prdListView   = document.getElementById('prd-list-view');
const prdEditorView = document.getElementById('prd-editor-view');
const prdGrid       = document.getElementById('prd-grid');

// ── Date formatter ─────────────────────────────────────────────────────────

function formatRelativeDate(iso) {
  if (!iso) return '—';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return 'hoy';
  if (diff === 1) return 'hace 1 día';
  if (diff < 30)  return `hace ${diff} días`;
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

// ── Progress calculator ────────────────────────────────────────────────────

function calcPRDProgress(prd) {
  let filled = 0;
  if (prd.objective && prd.objective.trim()) filled++;
  if (prd.userStories && prd.userStories.some(u => u.as || u.want || u.soThat)) filled++;
  if (prd.requirements && prd.requirements.some(r => r.description)) filled++;
  if (prd.outOfScope && prd.outOfScope.trim()) filled++;
  const ac = prd.acceptanceCriteria || {};
  if (ac.ios || ac.android) filled++;
  if (prd.technicalNotes && prd.technicalNotes.trim()) filled++;
  if (prd.designNotes && prd.designNotes.trim()) filled++;
  if (prd.openQuestions && prd.openQuestions.some(q => q.question)) filled++;
  return Math.round((filled / 8) * 100);
}

// ── Stats ──────────────────────────────────────────────────────────────────

async function loadPRDStats() {
  try {
    const s = await App.apiGet('/api/prds/stats');
    document.getElementById('prd-stat-total').textContent      = s.total;
    document.getElementById('prd-stat-borradores').textContent = s.borradores;
    document.getElementById('prd-stat-revision').textContent   = s.enRevision;
    document.getElementById('prd-stat-aprobados').textContent  = s.aprobados;
  } catch (e) {
    console.error('Error cargando stats PRD:', e);
  }
}

// ── Grid ───────────────────────────────────────────────────────────────────

function buildPRDCard(prd) {
  const pct = calcPRDProgress(prd);
  return `
    <div class="prd-card" data-prd-id="${prd.id}">
      <div class="prd-card-top">
        <div>
          <div class="prd-card-id">${prd.id}</div>
          <div class="prd-card-feature">${prd.feature}</div>
        </div>
        <span class="prd-status-badge ${prd.status}">${PRD_STATUS_LABELS[prd.status] || prd.status}</span>
      </div>
      <div>
        <span class="prd-epic-tag">${prd.epic}</span>
      </div>
      <div class="prd-card-meta">
        <span>✍ ${prd.author}</span>
        <span>v${prd.version}</span>
        <span>· ${formatRelativeDate(prd.updatedAt)}</span>
      </div>
      <div class="prd-card-progress">
        <div class="prd-card-progress-bar-bg">
          <div class="prd-card-progress-bar-fill" style="width:${pct}%"></div>
        </div>
        <span class="prd-card-progress-pct">${pct}%</span>
      </div>
    </div>`;
}

function renderPRDGrid() {
  if (prdFiltered.length === 0) {
    const isFiltered = document.getElementById('prd-filter-epic').value ||
                       document.getElementById('prd-filter-status').value ||
                       document.getElementById('prd-filter-search').value.trim();
    prdGrid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon">📄</div>
        <p>${isFiltered ? 'No se encontraron PRDs con estos filtros' : 'Aún no hay PRDs creados'}</p>
        ${isFiltered
          ? '<button class="btn btn-ghost" onclick="prdClearFilters()">Limpiar filtros</button>'
          : '<button class="btn btn-primary" onclick="document.getElementById(\'btn-new-prd\').click()">Crear primer PRD</button>'}
      </div>`;
    return;
  }
  prdGrid.innerHTML = prdFiltered.map(buildPRDCard).join('');
  prdGrid.querySelectorAll('.prd-card').forEach(card => {
    card.addEventListener('click', () => openEditor(card.dataset.prdId));
  });
}

// ── Filters ────────────────────────────────────────────────────────────────

function applyPRDFilters() {
  const epic   = document.getElementById('prd-filter-epic').value;
  const status = document.getElementById('prd-filter-status').value;
  const search = document.getElementById('prd-filter-search').value.trim().toLowerCase();
  prdFiltered = prdAllItems.filter(p => {
    if (epic   && p.epic !== epic)     return false;
    if (status && p.status !== status) return false;
    if (search) {
      const hay = `${p.id} ${p.feature} ${p.epic} ${p.author}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });
  renderPRDGrid();
}

function prdClearFilters() {
  document.getElementById('prd-filter-epic').value   = '';
  document.getElementById('prd-filter-status').value = '';
  document.getElementById('prd-filter-search').value = '';
  applyPRDFilters();
}

function populatePRDEpicFilter() {
  const epics = [...new Set(prdAllItems.map(p => p.epic))];
  const sel   = document.getElementById('prd-filter-epic');
  sel.innerHTML = '<option value="">Todas las épicas</option>';
  epics.forEach(e => {
    const opt = document.createElement('option');
    opt.value = e; opt.textContent = e;
    sel.appendChild(opt);
  });
}

// ── Dynamic list builders ──────────────────────────────────────────────────

function buildUSRow(us) {
  return `<div class="prd-us-row" data-us-id="${us.id}">
    <span class="prd-us-label">Como</span>
    <input class="form-control prd-row-input" placeholder="usuario / rol" data-field="as" value="${escHtml(us.as)}" />
    <span class="prd-us-label">, quiero</span>
    <input class="form-control prd-row-input" placeholder="acción o funcionalidad" data-field="want" value="${escHtml(us.want)}" />
    <span class="prd-us-label">, para</span>
    <input class="form-control prd-row-input" placeholder="beneficio o resultado" data-field="soThat" value="${escHtml(us.soThat)}" />
    <button class="btn-icon prd-remove-row" title="Eliminar">✕</button>
  </div>`;
}

function buildReqRow(req) {
  const opts = REQ_PRIORITY_OPTIONS.map(o =>
    `<option value="${o.value}"${req.priority === o.value ? ' selected' : ''}>${o.label}</option>`
  ).join('');
  return `<div class="prd-req-row" data-req-id="${req.id}">
    <input class="form-control prd-row-input prd-req-desc" placeholder="Descripción del requisito..." data-field="description" value="${escHtml(req.description)}" />
    <select class="form-control prd-req-prio" data-field="priority">${opts}</select>
    <button class="btn-icon prd-remove-row" title="Eliminar">✕</button>
  </div>`;
}

function buildQRow(q) {
  return `<div class="prd-q-row" data-q-id="${q.id}">
    <div class="prd-q-top">
      <input class="form-control prd-row-input" placeholder="Pregunta..." data-field="question" value="${escHtml(q.question)}" />
      <label class="toggle-switch prd-resolved-toggle" title="Marcar como resuelta">
        <input type="checkbox" data-field="resolved"${q.resolved ? ' checked' : ''} />
        <span class="toggle-track"></span>
        <span class="toggle-thumb"></span>
      </label>
      <span class="prd-resolved-label">Resuelta</span>
      <button class="btn-icon prd-remove-row" title="Eliminar">✕</button>
    </div>
    <textarea class="form-control prd-textarea prd-q-answer" placeholder="Respuesta..." data-field="answer">${escHtml(q.answer)}</textarea>
  </div>`;
}

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderDynamicLists(prd) {
  document.getElementById('prd-us-list').innerHTML  = (prd.userStories  || []).map(buildUSRow).join('');
  document.getElementById('prd-req-list').innerHTML = (prd.requirements || []).map(buildReqRow).join('');
  document.getElementById('prd-q-list').innerHTML   = (prd.openQuestions || []).map(buildQRow).join('');
}

function nextListId(list, prefix) {
  const nums = list.map(el => {
    const id = el.dataset[prefix === 'US' ? 'usId' : prefix === 'REQ' ? 'reqId' : 'qId'] || '';
    return parseInt(id.replace(`${prefix}-`, ''), 10) || 0;
  });
  return `${prefix}-${(Math.max(0, ...nums) + 1)}`;
}

function addUSRow() {
  const list = document.getElementById('prd-us-list');
  const id   = nextListId([...list.querySelectorAll('[data-us-id]')], 'US');
  const div  = document.createElement('div');
  div.innerHTML = buildUSRow({ id, as: '', want: '', soThat: '' });
  list.appendChild(div.firstElementChild);
  prdIsDirty = true;
}

function addReqRow() {
  const list = document.getElementById('prd-req-list');
  const id   = nextListId([...list.querySelectorAll('[data-req-id]')], 'REQ');
  const div  = document.createElement('div');
  div.innerHTML = buildReqRow({ id, description: '', priority: 'must-have' });
  list.appendChild(div.firstElementChild);
  prdIsDirty = true;
}

function addQRow() {
  const list = document.getElementById('prd-q-list');
  const id   = nextListId([...list.querySelectorAll('[data-q-id]')], 'Q');
  const div  = document.createElement('div');
  div.innerHTML = buildQRow({ id, question: '', answer: '', resolved: false });
  list.appendChild(div.firstElementChild);
  prdIsDirty = true;
}

// ── Collect payload ────────────────────────────────────────────────────────

function collectEditorPayload() {
  const userStories = [...document.querySelectorAll('#prd-us-list [data-us-id]')].map(row => ({
    id:     row.dataset.usId,
    as:     row.querySelector('[data-field="as"]').value.trim(),
    want:   row.querySelector('[data-field="want"]').value.trim(),
    soThat: row.querySelector('[data-field="soThat"]').value.trim(),
  }));

  const requirements = [...document.querySelectorAll('#prd-req-list [data-req-id]')].map(row => ({
    id:          row.dataset.reqId,
    description: row.querySelector('[data-field="description"]').value.trim(),
    priority:    row.querySelector('[data-field="priority"]').value,
  }));

  const openQuestions = [...document.querySelectorAll('#prd-q-list [data-q-id]')].map(row => ({
    id:       row.dataset.qId,
    question: row.querySelector('[data-field="question"]').value.trim(),
    answer:   row.querySelector('[data-field="answer"]').value.trim(),
    resolved: row.querySelector('[data-field="resolved"]').checked,
  }));

  return {
    objective:    document.getElementById('prd-objective').value.trim(),
    userStories,
    requirements,
    outOfScope:   document.getElementById('prd-out-of-scope').value.trim(),
    acceptanceCriteria: {
      ios:     document.getElementById('prd-ac-ios').value.trim(),
      android: document.getElementById('prd-ac-android').value.trim(),
    },
    technicalNotes: document.getElementById('prd-tech-notes').value.trim(),
    designNotes:    document.getElementById('prd-design-notes').value.trim(),
    openQuestions,
  };
}

// ── Editor open/close ──────────────────────────────────────────────────────

function openEditor(prdId) {
  prdCurrent = prdAllItems.find(p => p.id === prdId);
  if (!prdCurrent) return;

  document.getElementById('prd-editor-feature-name').textContent = prdCurrent.feature;
  document.getElementById('prd-editor-id').textContent           = `${prdCurrent.id} · v${prdCurrent.version} · ${prdCurrent.author}`;

  document.getElementById('prd-objective').value      = prdCurrent.objective    || '';
  document.getElementById('prd-out-of-scope').value   = prdCurrent.outOfScope   || '';
  document.getElementById('prd-tech-notes').value     = prdCurrent.technicalNotes || '';
  document.getElementById('prd-design-notes').value   = prdCurrent.designNotes  || '';

  const ac = prdCurrent.acceptanceCriteria || {};
  document.getElementById('prd-ac-ios').value     = ac.ios     || '';
  document.getElementById('prd-ac-android').value = ac.android || '';

  renderDynamicLists(prdCurrent);
  updateStatusButton(prdCurrent.status);
  document.getElementById('prd-last-saved').textContent = `Último guardado: ${formatRelativeDate(prdCurrent.updatedAt)}`;

  prdListView.style.display   = 'none';
  prdEditorView.style.display = 'block';
  prdIsDirty = false;
}

function closeEditor() {
  if (prdIsDirty && !window.confirm('¿Salir sin guardar los cambios?')) return;
  prdCurrent = null;
  prdIsDirty = false;
  prdEditorView.style.display = 'none';
  prdListView.style.display   = 'block';
  loadPRDStats();
  applyPRDFilters();
}

// ── Save ───────────────────────────────────────────────────────────────────

async function savePRD() {
  if (!prdCurrent) return;
  const payload = collectEditorPayload();
  try {
    const saved = await App.apiPut(`/api/prds/${prdCurrent.id}`, payload);
    const idx = prdAllItems.findIndex(p => p.id === prdCurrent.id);
    prdAllItems[idx] = saved;
    prdCurrent = saved;
    prdIsDirty = false;
    document.getElementById('prd-last-saved').textContent = `Último guardado: ${formatRelativeDate(saved.updatedAt)}`;
    App.showToast('Guardado correctamente');
  } catch (e) {
    App.showToast('Error al guardar', 'error');
  }
}

// ── Status ─────────────────────────────────────────────────────────────────

function updateStatusButton(status) {
  const btn = document.getElementById('prd-status-btn');
  btn.className = `prd-status-badge clickable ${status}`;
  btn.textContent = `${PRD_STATUS_LABELS[status] || status} ▾`;
}

function toggleStatusDropdown() {
  const dd = document.getElementById('prd-status-dropdown');
  dd.style.display = dd.style.display === 'block' ? 'none' : 'block';
}

async function changeStatus(newStatus) {
  if (!prdCurrent) return;
  document.getElementById('prd-status-dropdown').style.display = 'none';
  try {
    const saved = await App.apiPut(`/api/prds/${prdCurrent.id}`, { status: newStatus });
    const idx = prdAllItems.findIndex(p => p.id === prdCurrent.id);
    prdAllItems[idx] = saved;
    prdCurrent = saved;
    updateStatusButton(newStatus);
    if (newStatus === 'aprobado') {
      App.showToast('PRD aprobado. El backlog ha sido actualizado.');
    } else {
      App.showToast(`Estado cambiado a ${PRD_STATUS_LABELS[newStatus]}`);
    }
    loadPRDStats();
  } catch (e) {
    App.showToast('Error al cambiar estado', 'error');
  }
}

// ── Modal ──────────────────────────────────────────────────────────────────

function openNewPRDModal() {
  const sel = document.getElementById('prd-modal-backlog-select');
  const usedIds = new Set(prdAllItems.map(p => p.backlogId));
  sel.innerHTML = '<option value="">Selecciona una funcionalidad...</option>';
  prdBacklogItems.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.textContent = `${item.id} — ${item.feature} [${item.epic}]`;
    if (usedIds.has(item.id)) {
      opt.disabled = true;
      opt.textContent += ' (ya tiene PRD)';
    }
    sel.appendChild(opt);
  });
  document.getElementById('prd-modal-author').value = 'Nicolle';
  document.getElementById('prd-modal-error').textContent = '';
  document.getElementById('prd-modal-overlay').style.display = 'flex';
}

function closeNewPRDModal() {
  document.getElementById('prd-modal-overlay').style.display = 'none';
}

async function createPRD() {
  const backlogId = document.getElementById('prd-modal-backlog-select').value;
  const author    = document.getElementById('prd-modal-author').value.trim() || 'Nicolle';
  const errEl     = document.getElementById('prd-modal-error');

  if (!backlogId) {
    errEl.textContent = 'Selecciona una funcionalidad';
    return;
  }
  errEl.textContent = '';

  try {
    const created = await App.apiPost('/api/prds', { backlogId, author });
    prdAllItems.push(created);
    prdFiltered = [...prdAllItems];
    closeNewPRDModal();
    populatePRDEpicFilter();
    loadPRDStats();
    App.showToast('PRD creado');
    openEditor(created.id);
  } catch (e) {
    App.showToast('Error al crear el PRD', 'error');
  }
}

// ── Event wiring ───────────────────────────────────────────────────────────

document.getElementById('btn-new-prd').addEventListener('click', openNewPRDModal);
document.getElementById('prd-modal-close').addEventListener('click', closeNewPRDModal);
document.getElementById('prd-modal-cancel').addEventListener('click', closeNewPRDModal);
document.getElementById('prd-modal-create').addEventListener('click', createPRD);
document.getElementById('prd-modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('prd-modal-overlay')) closeNewPRDModal();
});

document.getElementById('prd-btn-back').addEventListener('click', closeEditor);
document.getElementById('prd-btn-save-top').addEventListener('click', savePRD);
document.getElementById('prd-btn-save-bar').addEventListener('click', savePRD);
document.getElementById('prd-status-btn').addEventListener('click', e => {
  e.stopPropagation();
  toggleStatusDropdown();
});
document.getElementById('prd-status-dropdown').addEventListener('click', e => {
  const opt = e.target.closest('.prd-status-option');
  if (opt) changeStatus(opt.dataset.value);
});

document.getElementById('prd-add-us').addEventListener('click',  addUSRow);
document.getElementById('prd-add-req').addEventListener('click', addReqRow);
document.getElementById('prd-add-q').addEventListener('click',   addQRow);

// Dynamic list remove + dirty tracking
document.getElementById('prd-editor-view').addEventListener('click', e => {
  const removeBtn = e.target.closest('.prd-remove-row');
  if (removeBtn) {
    removeBtn.closest('[data-us-id],[data-req-id],[data-q-id]').remove();
    prdIsDirty = true;
  }
});
document.getElementById('prd-editor-view').addEventListener('input',  () => { prdIsDirty = true; });
document.getElementById('prd-editor-view').addEventListener('change', () => { prdIsDirty = true; });

// Close status dropdown on outside click
document.addEventListener('click', e => {
  if (!e.target.closest('#prd-status-btn') && !e.target.closest('#prd-status-dropdown')) {
    const dd = document.getElementById('prd-status-dropdown');
    if (dd) dd.style.display = 'none';
  }
});

// Filters
document.getElementById('prd-filter-epic').addEventListener('change',   applyPRDFilters);
document.getElementById('prd-filter-status').addEventListener('change', applyPRDFilters);
document.getElementById('prd-filter-search').addEventListener('input',  applyPRDFilters);
document.getElementById('prd-btn-clear-filters').addEventListener('click', prdClearFilters);

// ── Init ───────────────────────────────────────────────────────────────────

async function prdInit() {
  try {
    [prdBacklogItems, prdAllItems] = await Promise.all([
      App.apiGet('/api/backlog'),
      App.apiGet('/api/prds'),
    ]);
    prdFiltered = [...prdAllItems];
    populatePRDEpicFilter();
    renderPRDGrid();
    loadPRDStats();
  } catch (e) {
    console.error('Error iniciando PRD Generator:', e);
    App.showToast('Error al cargar PRDs', 'error');
  }
}

prdInit();
