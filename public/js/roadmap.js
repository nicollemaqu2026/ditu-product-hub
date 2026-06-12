// ── Roadmap Module ────────────────────────────────────────────────────────

let rmData          = null;
let rmView          = 'ejecutiva';
let rmFilters       = { epic: '', platform: '', compliance: '' };
let rmRiskFilter    = null;
let rmExpandedEpics = new Set();

// ── Date helpers ──────────────────────────────────────────────────────────

const DAYS_ES   = ['dom','lun','mar','mié','jue','vie','sáb'];
const MONTHS_S  = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const MONTHS_L  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function parseLocal(str) {
  if (!str) return null;
  const [y,m,d] = str.split('-').map(Number);
  return new Date(y, m-1, d);
}

function fmtShort(str) {
  if (!str) return '—';
  const d = parseLocal(str);
  return `${DAYS_ES[d.getDay()]} ${d.getDate()} ${MONTHS_S[d.getMonth()]}`;
}

function fmtMonthYear(str) {
  const d = parseLocal(str);
  return `${MONTHS_L[d.getMonth()].toUpperCase()} ${d.getFullYear()}`;
}

function today() { return new Date().toISOString().split('T')[0]; }

function daysDiff(a, b) {
  return Math.round((parseLocal(a) - parseLocal(b)) / 86400000);
}

// ── Init ──────────────────────────────────────────────────────────────────

async function initRoadmap() {
  try {
    rmData = await App.apiGet('/api/roadmap');
    populateRmFilters(rmData);
    renderRmMetrics(rmData.metrics);
    renderRmRiskBanner(rmData.riskGroups, rmData.items);
    renderRmView();
  } catch (e) {
    document.getElementById('rm-content').innerHTML =
      `<div class="rm-empty"><span class="rm-empty-icon">⚠️</span><p>Error cargando roadmap</p></div>`;
    console.error(e);
  }
}

// ── Filters ───────────────────────────────────────────────────────────────

function populateRmFilters(data) {
  const sel = document.getElementById('rm-filter-epic');
  const epics = [...new Set(data.items.map(i => i.epic))].sort();
  sel.innerHTML = '<option value="">Todas las épicas</option>' +
    epics.map(e => `<option value="${e}">${e}</option>`).join('');
}

function applyRmFilters(porEpica) {
  return porEpica.filter(e => {
    if (rmFilters.epic && e.epic !== rmFilters.epic) return false;
    if (rmFilters.compliance && !e.features.some(f => matchCompliance(f, rmFilters.compliance))) return false;
    if (rmRiskFilter) {
      if (rmRiskFilter === 'vencidas' && e.estado !== 'retrasado-activo') return false;
      if (rmRiskFilter === 'sinFecha' && e.estado !== 'sin-fecha') return false;
      if (rmRiskFilter === 'enRiesgo') {
        const t = today();
        const hasRisk = e.features.some(f => {
          if (!f.fechaCompromiso || f._delivered) return false;
          const d = daysDiff(f.fechaCompromiso, t);
          return d >= 0 && d <= 7 && (!f.prdReady || !!f.blocker);
        });
        if (!hasRisk) return false;
      }
    }
    return true;
  });
}

function applyRmItemFilters(items) {
  return items.filter(i => {
    if (rmFilters.epic && i.epic !== rmFilters.epic) return false;
    if (rmFilters.compliance && !matchCompliance(i, rmFilters.compliance)) return false;
    if (rmFilters.platform) {
      const s = i.platforms?.[rmFilters.platform];
      if (!s || s === 'sin-especificar') return false;
    }
    return true;
  });
}

function matchCompliance(item, filter) {
  const s = item._compliance?.status;
  if (!s) return filter === 'sin-fecha';
  if (filter === 'en-tiempo') return s === 'en-tiempo' || s === 'cumplido';
  if (filter === 'retrasado-activo') return s === 'retrasado-activo' || s === 'retrasado-entregado';
  if (filter === 'adelantado') return s === 'adelantado';
  if (filter === 'sin-fecha') return s === 'sin-fecha';
  return true;
}

// ── Metrics cards ─────────────────────────────────────────────────────────

function renderRmMetrics(m) {
  const grid = document.getElementById('rm-metrics-grid');
  if (!grid) return;

  const pct = m.porcentajeCumplimiento;
  const pctColor = pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--error)';
  const retrasoColor = m.retrasoPromedioDias > 2 ? 'var(--warning)' : 'var(--success)';
  const delayPulse = m.epicasEnRetraso > 0 ? 'rm-card-pulse' : '';

  grid.innerHTML = `
    <div class="stat-card rm-metric-card" id="rm-card-pct">
      <div class="stat-card-label">Cumplimiento</div>
      <div class="stat-card-value rm-countup" data-target="${pct}" style="color:${pctColor}">0%</div>
      <div class="stat-card-sub">del equipo técnico</div>
      <div class="rm-metric-micro">${m.cumplidas} de ${m.totalConCompromiso} entregas cumplidas</div>
    </div>
    <div class="stat-card rm-metric-card ${delayPulse}">
      <div class="stat-card-label">Épicas en retraso</div>
      <div class="stat-card-value" style="color:${m.epicasEnRetraso > 0 ? 'var(--error)' : 'var(--success)'}">${m.epicasEnRetraso}</div>
      <div class="stat-card-sub">con retraso activo</div>
    </div>
    <div class="stat-card rm-metric-card">
      <div class="stat-card-label">Retraso promedio</div>
      <div class="stat-card-value" style="color:${retrasoColor}">${m.retrasoPromedioDias} días</div>
      <div class="stat-card-sub">por entrega retrasada</div>
    </div>
    <div class="stat-card rm-metric-card">
      <div class="stat-card-label">Entregas adelantadas</div>
      <div class="stat-card-value" style="color:var(--success)">⭐ ${m.entregadasAntesDefecha}</div>
      <div class="stat-card-sub">antes de lo comprometido</div>
    </div>`;

  animateCountUp();
}

function animateCountUp() {
  document.querySelectorAll('.rm-countup').forEach(el => {
    const target = +el.dataset.target;
    let current = 0;
    const step = target / 50;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = Math.round(current) + '%';
      if (current >= target) clearInterval(timer);
    }, 20);
  });
}

// ── Risk banner ───────────────────────────────────────────────────────────

function renderRmRiskBanner(rg, items) {
  const banner = document.getElementById('rm-risk-banner');
  if (!banner) return;
  if (!rg.vencidas && !rg.enRiesgo && !rg.sinFecha) { banner.style.display = 'none'; return; }

  const pills = [];
  if (rg.vencidas)  pills.push({ key:'vencidas',  icon:'🔴', label:`${rg.vencidas} vencidas sin entregar` });
  if (rg.enRiesgo)  pills.push({ key:'enRiesgo',  icon:'🟡', label:`${rg.enRiesgo} entregas próximas en riesgo` });
  if (rg.sinFecha)  pills.push({ key:'sinFecha',  icon:'⚪', label:`${rg.sinFecha} features sin fecha de compromiso` });

  banner.style.display = 'flex';
  banner.innerHTML = pills.map(p =>
    `<button class="rm-risk-pill${rmRiskFilter===p.key?' active':''}" data-risk="${p.key}">${p.icon} ${p.label}</button>`
  ).join('');

  banner.querySelectorAll('.rm-risk-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.risk;
      rmRiskFilter = rmRiskFilter === k ? null : k;
      banner.querySelectorAll('.rm-risk-pill').forEach(b => b.classList.toggle('active', b.dataset.risk === rmRiskFilter));
      renderRmView();
    });
  });
}

// ── View rendering ────────────────────────────────────────────────────────

function renderRmView() {
  if (!rmData) return;
  const filtered = applyRmFilters(rmData.porEpica);
  const content  = document.getElementById('rm-content');

  if (rmView === 'ejecutiva') renderEjecutiva(filtered, content);
  else renderOperativa(applyRmItemFilters(rmData.items), content);
}

// ── Vista Ejecutiva ───────────────────────────────────────────────────────

function epicBorderClass(estado) {
  const map = { 'retrasado-activo':'rm-border-error', 'retrasado-entregado':'rm-border-warning', 'cumplido':'rm-border-success', 'adelantado':'rm-border-success', 'en-tiempo':'rm-border-default', 'sin-fecha':'rm-border-muted' };
  return map[estado] || 'rm-border-default';
}

function statusBadge(estado) {
  const map = {
    'retrasado-activo':    ['En retraso',    'badge-error'],
    'retrasado-entregado': ['Entregada tarde','badge-warning'],
    'cumplido':            ['Completada',    'badge-success'],
    'adelantado':          ['Adelantada',    'badge-success'],
    'en-tiempo':           ['En tiempo',     'badge-purple'],
    'sin-fecha':           ['Sin planificar','badge-muted'],
  };
  const [label, cls] = map[estado] || ['—','badge-muted'];
  return `<span class="rm-badge ${cls}">${label}</span>`;
}

function delayBar(fcEpic, feEpic, estado) {
  if (!fcEpic && !feEpic) return '';
  if (estado === 'sin-fecha') return '';

  const t = today();
  const compareDate = feEpic || t;
  const delta = fcEpic ? daysDiff(compareDate, fcEpic) : 0;

  if (estado === 'cumplido' || estado === 'adelantado') {
    const days = fcEpic && feEpic ? Math.abs(daysDiff(feEpic, fcEpic)) : 0;
    return `<div class="rm-delay-wrap">
      <div class="rm-bar"><div class="rm-bar-fill rm-bar-green" style="width:100%"></div></div>
      ${delta < 0 ? `<span class="rm-delay-label" style="color:var(--success)">⭐ Entregada ${Math.abs(delta)} días antes</span>` : ''}
    </div>`;
  }

  if (delta <= 0) {
    return `<div class="rm-delay-wrap">
      <div class="rm-bar"><div class="rm-bar-fill rm-bar-green" style="width:100%"></div></div>
    </div>`;
  }

  const totalDays = Math.max(delta + 14, 28);
  const greenPct  = Math.round((14 / totalDays) * 100);
  const redPct    = Math.round((delta / totalDays) * 100);

  return `<div class="rm-delay-wrap">
    <div class="rm-bar">
      <div class="rm-bar-fill rm-bar-green" style="width:${greenPct}%"></div>
      <div class="rm-bar-fill rm-bar-red"   style="width:${redPct}%"></div>
    </div>
    <span class="rm-delay-label" style="color:var(--error)">⚠️ ${delta} DÍAS DE RETRASO</span>
  </div>`;
}

function featureCountRow(features) {
  const counts = { cerrado:0, 'en-construccion':0, bloqueadas:0, otro:0 };
  features.forEach(f => {
    const vals = Object.values(f.platforms||{});
    const allDel = vals.length && vals.every(s=>s==='cerrado');
    if (allDel) counts.cerrado++;
    else if (f.blocker) counts.bloqueadas++;
    else if (vals.some(s=>s==='en-construccion')) counts['en-construccion']++;
    else counts.otro++;
  });
  const parts = [];
  if (counts.cerrado)            parts.push(`<span class="rm-fdot" style="background:var(--success)"></span>${counts.cerrado} cerradas`);
  if (counts['en-construccion']) parts.push(`<span class="rm-fdot" style="background:var(--purple-light)"></span>${counts['en-construccion']} en dev`);
  if (counts.bloqueadas)       parts.push(`<span class="rm-fdot" style="background:var(--error)"></span>${counts.bloqueadas} bloq.`);
  if (counts.otro)             parts.push(`<span class="rm-fdot" style="background:var(--text-muted)"></span>${counts.otro} sin esp.`);
  return `<div class="rm-fcount">${parts.join('')}</div>`;
}

function renderEjecutiva(epicList, container) {
  if (!epicList.length) {
    container.innerHTML = emptyState();
    return;
  }

  const deliveredCount = epicList.reduce((a,e) => a + e.features.filter(f=>f._delivered).length, 0);
  const totalFeatures  = epicList.reduce((a,e) => a + e.features.length, 0);
  const progressPct    = totalFeatures ? Math.round((deliveredCount / totalFeatures) * 100) : 0;

  container.innerHTML = `<div class="rm-exec-grid">${epicList.map((e, idx) => epicCard(e, idx)).join('')}</div>`;

  // Animate entrance
  container.querySelectorAll('.rm-epic-card').forEach((card, i) => {
    card.style.animationDelay = `${i * 50}ms`;
    card.classList.add('rm-card-enter');
  });

  // Expand/collapse
  container.querySelectorAll('.rm-epic-card').forEach(card => {
    card.querySelector('.rm-card-header')?.addEventListener('click', (e) => {
      if (e.target.closest('.rm-badge') || e.target.closest('.btn-icon')) return;
      const epicName = card.dataset.epic;
      if (rmExpandedEpics.has(epicName)) rmExpandedEpics.delete(epicName);
      else rmExpandedEpics.add(epicName);
      card.classList.toggle('rm-expanded', rmExpandedEpics.has(epicName));
    });
  });

  // Click feature row → open backlog panel
  container.querySelectorAll('.rm-feat-row').forEach(row => {
    row.addEventListener('click', () => {
      const id = row.dataset.id;
      document.querySelector('.nav-item[data-page="backlog"]')?.click();
      setTimeout(() => { if (typeof openEditPanel === 'function') openEditPanel(id); }, 150);
    });
  });
}

function epicCard(e, idx) {
  const borderCls = epicBorderClass(e.estado) + (e.estado==='retrasado-activo'?' rm-pulse':'');
  const delivered = e.features.filter(f=>f._delivered).length;
  const pct       = e.features.length ? Math.round((delivered/e.features.length)*100) : 0;
  const expanded  = rmExpandedEpics.has(e.epic);

  const fcCard = e.fechaCompromisoEpica ? `
    <div class="rm-date-mini${e.estado==='retrasado-activo'?' rm-date-over':''}">
      <div class="rm-date-label">COMPROMISO</div>
      <div class="rm-date-val">${fmtShort(e.fechaCompromisoEpica)}</div>
    </div>` : '';

  const feCard = e.fechaEstimadaEpica ? `
    <div class="rm-date-mini">
      <div class="rm-date-label">ESTIMADO ACTUAL</div>
      <div class="rm-date-val">${fmtShort(e.fechaEstimadaEpica)}</div>
    </div>` : '';

  const featRows = e.features.map(f => {
    const cs = f._compliance?.status || 'sin-fecha';
    const icon = { 'cumplido':'✅','adelantado':'✅','retrasado-entregado':'⚠️','retrasado-activo':'🔴','en-tiempo':'🕐','sin-fecha':'─' }[cs] || '─';
    const strike = f._delivered ? 'style="text-decoration:line-through;opacity:.5"' : '';
    return `<div class="rm-feat-row" data-id="${f.id}">
      <span class="rm-feat-icon">${icon}</span>
      <span class="rm-feat-name" ${strike}>${f.feature}</span>
      <span class="rm-feat-delta">${deltaLabel(f._compliance)}</span>
    </div>`;
  }).join('');

  return `<div class="rm-epic-card ${borderCls}${expanded?' rm-expanded':''}" data-epic="${e.epic}">
    <div class="rm-card-header">
      <div class="rm-card-title">
        <span class="rm-epic-icon">${epicIcon(e.estado)}</span>
        <span class="rm-epic-name">${e.epic.toUpperCase()}</span>
      </div>
      ${statusBadge(e.estado)}
    </div>
    <div class="rm-progress-row">
      <div class="rm-progress-bar-bg"><div class="rm-progress-bar-fill" style="width:${pct}%"></div></div>
      <span class="rm-progress-pct">${pct}%</span>
    </div>
    <div class="rm-progress-sub">${delivered} de ${e.features.length} features entregadas</div>
    ${(fcCard||feCard) ? `<div class="rm-date-row">${fcCard}${feCard}</div>` : ''}
    ${delayBar(e.fechaCompromisoEpica, e.fechaEstimadaEpica, e.estado)}
    ${featureCountRow(e.features)}
    <div class="rm-features-collapse">
      <div class="rm-features-list">${featRows}</div>
    </div>
  </div>`;
}

function epicIcon(estado) {
  return { 'retrasado-activo':'⚡','retrasado-entregado':'⚠️','cumplido':'✅','adelantado':'⭐','en-tiempo':'🕐','sin-fecha':'📋' }[estado] || '📋';
}

function deltaLabel(c) {
  if (!c || c.deltaDias === null) return '—';
  if (c.deltaDias === 0) return '<span style="color:var(--success)">A tiempo</span>';
  if (c.deltaDias < 0)  return `<span style="color:var(--success)">-${Math.abs(c.deltaDias)}d</span>`;
  return `<span style="color:var(--error)">+${c.deltaDias}d</span>`;
}

// ── Vista Operativa ───────────────────────────────────────────────────────

function renderOperativa(items, container) {
  if (!items.length) { container.innerHTML = emptyState(); return; }

  // Group by month of fechaCompromiso
  const withDate    = items.filter(i => i.fechaCompromiso);
  const withoutDate = items.filter(i => !i.fechaCompromiso);

  const groups = {};
  withDate.forEach(i => {
    const key = fmtMonthYear(i.fechaCompromiso);
    if (!groups[key]) groups[key] = [];
    groups[key].push(i);
  });

  // Sort months chronologically
  const sortedMonths = Object.keys(groups).sort((a,b) => {
    const ia = groups[a][0].fechaCompromiso;
    const ib = groups[b][0].fechaCompromiso;
    return ia < ib ? -1 : 1;
  });

  let html = '<div class="rm-oper">';
  sortedMonths.forEach(month => {
    const rows = groups[month];
    html += `<div class="rm-month-group">
      <div class="rm-month-header">
        <span class="rm-month-title">${month}</span>
        <span class="rm-month-count">${rows.length} feature${rows.length!==1?'s':''} comprometida${rows.length!==1?'s':''}</span>
      </div>
      <div class="rm-oper-rows">${rows.map(operRow).join('')}</div>
    </div>`;
  });

  if (withoutDate.length) {
    html += `<div class="rm-month-group rm-no-date-group">
      <div class="rm-month-header rm-month-muted" id="rm-nodate-toggle" style="cursor:pointer">
        <span class="rm-month-title">Sin fecha de compromiso</span>
        <span class="rm-month-count">${withoutDate.length} features sin planificar ▾</span>
      </div>
      <div class="rm-oper-rows rm-nodate-rows" style="display:none">${withoutDate.map(operRow).join('')}</div>
    </div>`;
  }

  html += '</div>';
  container.innerHTML = html;

  // Toggle no-date group
  const tog = container.querySelector('#rm-nodate-toggle');
  if (tog) {
    tog.addEventListener('click', () => {
      const rows = tog.nextElementSibling;
      rows.style.display = rows.style.display === 'none' ? '' : 'none';
    });
  }

  // Click row → open edit panel
  container.querySelectorAll('.rm-oper-row').forEach(row => {
    row.addEventListener('click', () => {
      const id = row.dataset.id;
      document.querySelector('.nav-item[data-page="backlog"]')?.click();
      setTimeout(() => { if (typeof openEditPanel === 'function') openEditPanel(id); }, 150);
    });
  });
}

function operRow(item) {
  const cs = item._compliance?.status || 'sin-fecha';
  const icon = { 'cumplido':'✅','adelantado':'✅','retrasado-entregado':'⚠️','retrasado-activo':'🔴','en-tiempo':'🕐','sin-fecha':'─' }[cs];
  const pulse = cs === 'retrasado-activo' ? ' rm-row-pulse' : '';
  const strike = item._delivered ? 'style="text-decoration:line-through;opacity:.5"' : '';
  const ios = item.platforms?.ios || 'sin-especificar';
  const and = item.platforms?.android || 'sin-especificar';

  return `<div class="rm-oper-row${pulse}" data-id="${item.id}">
    <div class="rm-or-icon">${icon}</div>
    <div class="rm-or-epic"><span class="rm-epic-pill">${item.epic}</span></div>
    <div class="rm-or-name" ${strike}>${item.feature}</div>
    <div class="rm-or-plat">
      <span class="status-mini status-${ios}">iOS</span>
      <span class="status-mini status-${and}">And</span>
    </div>
    <div class="rm-or-prd">${item.prdReady ? '<span style="color:var(--purple-light)">📄</span>' : '<span style="opacity:.3">📄</span>'}</div>
    <div class="rm-or-timeline">${timelineDot(item)}</div>
    <div class="rm-or-delta">${deltaLabel(item._compliance)}</div>
  </div>`;
}

function timelineDot(item) {
  const { fechaCompromiso: fc, fechaEntrega: fe, _compliance: c, _delivered: del } = item;
  if (!fc) return '<span class="rm-tl-none">─</span>';

  const cs = c?.status;
  if (del) {
    return `<div class="rm-tl"><div class="rm-tl-dot rm-tl-green">${cs==='adelantado'?'⭐':'✓'}</div><div class="rm-tl-date">${fmtShort(fc)}</div></div>`;
  }
  if (fe && fe > fc) {
    return `<div class="rm-tl rm-tl-delay">
      <div class="rm-tl-dot rm-tl-green"></div>
      <div class="rm-tl-line-red"></div>
      <div class="rm-tl-dot rm-tl-red"></div>
      <div class="rm-tl-dates"><span>${fmtShort(fc)}</span><span>${fmtShort(fe)}</span></div>
    </div>`;
  }
  return `<div class="rm-tl"><div class="rm-tl-dot rm-tl-green"></div><div class="rm-tl-date">${fmtShort(fc)}</div></div>`;
}

// ── Empty state ───────────────────────────────────────────────────────────

function emptyState() {
  return `<div class="rm-empty">
    <div class="rm-empty-icon">🗓</div>
    <h3>Tu roadmap está vacío</h3>
    <p>Agrega fechas de compromiso desde el Backlog Master</p>
    <button class="btn btn-primary" onclick="document.querySelector('.nav-item[data-page=backlog]').click()">Ir al Backlog Master</button>
  </div>`;
}

// ── Wire up controls ──────────────────────────────────────────────────────

document.querySelectorAll('.vtog-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.vtog-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    rmView = btn.dataset.view;
    renderRmView();
  });
});

['rm-filter-epic','rm-filter-platform','rm-filter-compliance'].forEach(id => {
  document.getElementById(id)?.addEventListener('change', function() {
    const key = { 'rm-filter-epic':'epic','rm-filter-platform':'platform','rm-filter-compliance':'compliance' }[id];
    rmFilters[key] = this.value;
    renderRmView();
  });
});

document.getElementById('rm-btn-clear')?.addEventListener('click', () => {
  rmFilters = { epic:'', platform:'', compliance:'' };
  rmRiskFilter = null;
  document.getElementById('rm-filter-epic').value = '';
  document.getElementById('rm-filter-platform').value = '';
  document.getElementById('rm-filter-compliance').value = '';
  document.querySelectorAll('.rm-risk-pill').forEach(p => p.classList.remove('active'));
  renderRmView();
});

// ── Trigger init when page becomes active ─────────────────────────────────

const _origNavClick = document.querySelectorAll('.nav-item:not(.disabled)');
document.querySelector('.nav-item[data-page="roadmap"]')?.addEventListener('click', () => {
  setTimeout(() => {
    if (!rmData) initRoadmap();
    else renderRmView();
  }, 50);
});
