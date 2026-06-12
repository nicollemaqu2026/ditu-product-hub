const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// ── Load .env.local ────────────────────────────────────────────────────────
const ENV_LOCAL = path.join(__dirname, '.env.local');
if (fs.existsSync(ENV_LOCAL)) {
  fs.readFileSync(ENV_LOCAL, 'utf8').split('\n').forEach(line => {
    const eq = line.indexOf('=');
    if (eq > 0) {
      const key = line.slice(0, eq).trim();
      const val = line.slice(eq + 1).trim();
      if (key) process.env[key] = val;
    }
  });
}
const DATA_FILE  = path.join(__dirname, 'data', 'backlog.json');
const PRD_FILE   = path.join(__dirname, 'data', 'prds.json');
const EPICS_FILE = path.join(__dirname, 'data', 'epics.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Seed data ──────────────────────────────────────────────────────────────

const SEED = [
  // Epic 1: Home
  { id: 'BL-001', epic: 'Home', feature: 'Cluster Tabs' },
  { id: 'BL-002', epic: 'Home', feature: 'Hero Dinámico' },
  { id: 'BL-003', epic: 'Home', feature: 'Stories' },
  { id: 'BL-004', epic: 'Home', feature: 'Top 10' },
  { id: 'BL-005', epic: 'Home', feature: 'Hubs' },
  { id: 'BL-006', epic: 'Home', feature: 'Collection' },
  { id: 'BL-007', epic: 'Home', feature: 'Banners Publicitarios' },
  { id: 'BL-008', epic: 'Home', feature: 'Carrusel Categorías' },
  { id: 'BL-009', epic: 'Home', feature: 'Menú Navegación' },
  { id: 'BL-010', epic: 'Home', feature: 'Continuar Viendo' },
  { id: 'BL-011', epic: 'Home', feature: 'Mi Lista' },
  // Epic 2
  { id: 'BL-012', epic: 'PDP Sharing', feature: 'PDP Sharing' },
  // Epic 3
  { id: 'BL-013', epic: 'Player Live y VOD', feature: 'Timeline Preview' },
  { id: 'BL-014', epic: 'Player Live y VOD', feature: 'Live Timeline' },
  // Epic 4
  { id: 'BL-015', epic: 'EPG', feature: 'Electronic Program Guide' },
  // Epic 5
  { id: 'BL-016', epic: 'Ads Consent Management', feature: 'Modal de Cookies y Privacidad' },
  // Epic 6
  { id: 'BL-017', epic: 'Login y Perfiles', feature: 'Entry Points' },
  { id: 'BL-018', epic: 'Login y Perfiles', feature: 'Registro' },
  { id: 'BL-019', epic: 'Login y Perfiles', feature: 'Login' },
  { id: 'BL-020', epic: 'Login y Perfiles', feature: 'Social Login' },
  { id: 'BL-021', epic: 'Login y Perfiles', feature: 'Creación de Perfil' },
  { id: 'BL-022', epic: 'Login y Perfiles', feature: 'Edición de Perfil' },
  { id: 'BL-023', epic: 'Login y Perfiles', feature: 'Eliminar Perfil' },
  { id: 'BL-024', epic: 'Login y Perfiles', feature: 'Cambio de Contraseña' },
  { id: 'BL-025', epic: 'Login y Perfiles', feature: 'Eliminar Cuenta' },
  // Epic 7
  { id: 'BL-026', epic: 'Integraciones', feature: 'Deep Links - Appsflyer' },
  { id: 'BL-027', epic: 'Integraciones', feature: 'Estadísticas de Partidos' },
  { id: 'BL-028', epic: 'Integraciones', feature: 'NPAW' },
  { id: 'BL-029', epic: 'Integraciones', feature: 'Push Notifications - CleverTap' },
  { id: 'BL-030', epic: 'Integraciones', feature: 'Recomendados (Because You Watched / More Like This)' },
  { id: 'BL-031', epic: 'Integraciones', feature: 'Stories - Storyli' },
  { id: 'BL-032', epic: 'Integraciones', feature: 'Comscore' },
  // Epic 8
  { id: 'BL-033', epic: 'Splash', feature: 'Splash Screen' },
  // Epic 9
  { id: 'BL-034', epic: 'Casting', feature: 'Casting' },
  // Epic 10
  { id: 'BL-035', epic: 'Microdramas', feature: 'Microdramas' },
  // Epic 11
  { id: 'BL-036', epic: 'Pagos', feature: 'SVOD' },
  { id: 'BL-037', epic: 'Pagos', feature: 'Micropagos' },
  { id: 'BL-038', epic: 'Pagos', feature: 'Wallet' },
  // Epic 12
  { id: 'BL-039', epic: 'Seguridad', feature: 'Seguridad de Cuentas (Modelo Netflix)' },
  // Epic 13
  { id: 'BL-040', epic: 'Búsqueda', feature: 'Búsqueda de Contenido Inteligente' },
];

function buildSeedItem(base) {
  const now = new Date().toISOString();
  return {
    id: base.id,
    epic: base.epic,
    feature: base.feature,
    platforms: {
      ios: 'sin-especificar',
      android: 'sin-especificar',
    },
    priority: 'media',
    sprint: '',
    figmaStatus: 'pendiente',
    prdReady: false,
    blocker: '',
    blockerReason: '',
    notes: '',
    linkPRD: '',
    linkFigma: '',
    fechaCompromiso: '',
    fechaEntrega: '',
    fechaEntregaReal: '',
    createdAt: now,
    updatedAt: now,
  };
}

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    const data = SEED.map(buildSeedItem);
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log(`✓ backlog.json creado con ${data.length} features`);
  }
}

function readBacklog() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeBacklog(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ── Epics helpers ──────────────────────────────────────────────────────────

function ensureEpicsFile() {
  if (!fs.existsSync(EPICS_FILE)) {
    fs.writeFileSync(EPICS_FILE, JSON.stringify([], null, 2));
  }
}

function readEpics() {
  return JSON.parse(fs.readFileSync(EPICS_FILE, 'utf8'));
}

function writeEpics(data) {
  fs.writeFileSync(EPICS_FILE, JSON.stringify(data, null, 2));
}

// ── PRD helpers ────────────────────────────────────────────────────────────

function ensurePRDFile() {
  if (!fs.existsSync(PRD_FILE)) {
    fs.writeFileSync(PRD_FILE, JSON.stringify([], null, 2));
    console.log('✓ prds.json creado (vacío)');
  }
}

function readPRDs() {
  return JSON.parse(fs.readFileSync(PRD_FILE, 'utf8'));
}

function writePRDs(data) {
  fs.writeFileSync(PRD_FILE, JSON.stringify(data, null, 2));
}

function nextPrdId(prds) {
  if (prds.length === 0) return 'PRD-001';
  const nums = prds.map(p => parseInt(p.id.replace('PRD-', ''), 10));
  return `PRD-${String(Math.max(...nums) + 1).padStart(3, '0')}`;
}

function buildEmptyPRD(id, backlogItem, author) {
  const now = new Date().toISOString();
  return {
    id,
    backlogId: backlogItem.id,
    feature: backlogItem.feature,
    epic: backlogItem.epic,
    version: '1.0',
    status: 'borrador',
    author: author || 'Nicolle',
    objective: '',
    userStories: [{ id: 'US-1', as: '', want: '', soThat: '' }],
    requirements: [{ id: 'REQ-1', description: '', priority: 'must-have' }],
    outOfScope: '',
    acceptanceCriteria: { ios: '', android: '' },
    technicalNotes: '',
    designNotes: '',
    openQuestions: [{ id: 'Q-1', question: '', answer: '', resolved: false }],
    createdAt: now,
    updatedAt: now,
  };
}

// ── API — PRD ──────────────────────────────────────────────────────────────

app.get('/api/prds/stats', (req, res) => {
  const prds = readPRDs();
  res.json({
    total:      prds.length,
    borradores: prds.filter(p => p.status === 'borrador').length,
    enRevision: prds.filter(p => p.status === 'en-revision').length,
    aprobados:  prds.filter(p => p.status === 'aprobado').length,
  });
});

app.get('/api/prds', (req, res) => res.json(readPRDs()));

app.get('/api/prds/:id', (req, res) => {
  const prd = readPRDs().find(p => p.id === req.params.id);
  if (!prd) return res.status(404).json({ error: 'No encontrado' });
  res.json(prd);
});

app.post('/api/prds', (req, res) => {
  const { backlogId, author } = req.body;
  const backlog = readBacklog();
  const blItem  = backlog.find(i => i.id === backlogId);
  if (!blItem) return res.status(400).json({ error: 'Backlog item no encontrado' });
  const prds = readPRDs();
  const prd  = buildEmptyPRD(nextPrdId(prds), blItem, author);
  prds.push(prd);
  writePRDs(prds);
  res.status(201).json(prd);
});

app.put('/api/prds/:id', (req, res) => {
  const prds = readPRDs();
  const idx  = prds.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'No encontrado' });
  const previous = prds[idx];
  prds[idx] = { ...previous, ...req.body, id: previous.id, updatedAt: new Date().toISOString() };
  writePRDs(prds);
  if (req.body.status === 'aprobado' && previous.status !== 'aprobado') {
    const backlog = readBacklog();
    const blIdx   = backlog.findIndex(i => i.id === prds[idx].backlogId);
    if (blIdx !== -1) {
      backlog[blIdx] = { ...backlog[blIdx], prdReady: true, updatedAt: new Date().toISOString() };
      writeBacklog(backlog);
    }
  }
  res.json(prds[idx]);
});

app.delete('/api/prds/:id', (req, res) => {
  const prds = readPRDs();
  const idx  = prds.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'No encontrado' });
  prds.splice(idx, 1);
  writePRDs(prds);
  res.json({ ok: true });
});

// ── API — Epics ────────────────────────────────────────────────────────────

app.get('/api/epics', (req, res) => {
  const fromFile = readEpics();
  const fromBacklog = [...new Set(readBacklog().map(i => i.epic))];
  const merged = [...new Set([...fromBacklog, ...fromFile])];
  res.json(merged);
});

app.post('/api/epics', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Nombre requerido' });
  const trimmed = name.trim();
  const fromBacklog = [...new Set(readBacklog().map(i => i.epic))];
  const epics = readEpics();
  if ([...fromBacklog, ...epics].includes(trimmed)) {
    return res.status(400).json({ error: 'La épica ya existe' });
  }
  epics.push(trimmed);
  writeEpics(epics);
  res.status(201).json({ name: trimmed });
});

// ── API — Backlog ──────────────────────────────────────────────────────────

// Stats must be declared before /:id to avoid route collision
app.get('/api/backlog/stats', (req, res) => {
  const items = readBacklog();
  const total = items.length;
  const entregadas = items.filter(i =>
    Object.values(i.platforms).every(s => s === 'entregado')
  ).length;
  const enDesarrollo = items.filter(i =>
    Object.values(i.platforms).some(s => s === 'en-desarrollo')
  ).length;
  const bloqueadas = items.filter(i => i.blocker && i.blocker !== '').length;
  const porcentajeGlobal = total > 0 ? Math.round((entregadas / total) * 100) : 0;

  const epicMap = {};
  items.forEach(i => {
    if (!epicMap[i.epic]) epicMap[i.epic] = { epic: i.epic, total: 0, entregadas: 0 };
    epicMap[i.epic].total++;
    if (Object.values(i.platforms).every(s => s === 'entregado')) {
      epicMap[i.epic].entregadas++;
    }
  });

  res.json({
    total,
    entregadas,
    enDesarrollo,
    bloqueadas,
    porcentajeGlobal,
    porEpica: Object.values(epicMap),
  });
});

app.get('/api/backlog', (req, res) => {
  res.json(readBacklog());
});

app.post('/api/backlog', (req, res) => {
  const { feature, epic } = req.body;
  if (!feature || !feature.trim()) return res.status(400).json({ error: 'feature es requerido' });
  if (!epic || !epic.trim()) return res.status(400).json({ error: 'epic es requerido' });
  const items = readBacklog();
  const nums = items.map(i => parseInt(i.id.replace('BL-', ''), 10)).filter(n => !isNaN(n));
  const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  const newId = `BL-${String(nextNum).padStart(3, '0')}`;
  const newItem = buildSeedItem({ id: newId, epic: epic.trim(), feature: feature.trim() });
  items.push(newItem);
  writeBacklog(items);
  res.status(201).json(newItem);
});

// Must be before /:id to avoid route collision
app.delete('/api/backlog/epic/:epicName', (req, res) => {
  const epicName = decodeURIComponent(req.params.epicName);
  const items = readBacklog();
  const remaining = items.filter(i => i.epic !== epicName);
  writeBacklog(remaining);
  const epics = readEpics();
  const filtered = epics.filter(e => e !== epicName);
  if (filtered.length !== epics.length) writeEpics(filtered);
  res.json({ success: true, deleted: items.length - remaining.length });
});

app.delete('/api/backlog/:id', (req, res) => {
  const items = readBacklog();
  const idx = items.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'No encontrado' });
  items.splice(idx, 1);
  writeBacklog(items);
  res.json({ success: true });
});

app.get('/api/backlog/:id', (req, res) => {
  const items = readBacklog();
  const item = items.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'No encontrado' });
  res.json(item);
});

// Must be before /:id to avoid route collision
app.put('/api/backlog/epic/rename', (req, res) => {
  const { oldName, newName } = req.body;
  if (!newName || !newName.trim()) return res.status(400).json({ error: 'newName es requerido' });
  const trimmed = newName.trim();
  const items = readBacklog();
  let updated = 0;
  items.forEach(item => {
    if (item.epic === oldName) {
      item.epic = trimmed;
      item.updatedAt = new Date().toISOString();
      updated++;
    }
  });
  writeBacklog(items);
  const epics = readEpics();
  const epicIdx = epics.indexOf(oldName);
  if (epicIdx !== -1) { epics[epicIdx] = trimmed; writeEpics(epics); }
  res.json({ success: true, updated });
});

app.put('/api/backlog/:id', (req, res) => {
  const items = readBacklog();
  const idx = items.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'No encontrado' });
  const body = { ...req.body };
  if (body.platforms) {
    const { ios, android } = body.platforms;
    body.platforms = { ios, android };
  }
  const merged = { ...items[idx], ...body, id: items[idx].id, updatedAt: new Date().toISOString() };
  // Auto-set fechaEntregaReal when all platforms reach "entregado"
  const allDelivered = Object.values(merged.platforms || {}).every(s => s === 'entregado');
  if (allDelivered && !merged.fechaEntregaReal) {
    merged.fechaEntregaReal = new Date().toISOString().split('T')[0];
  }
  items[idx] = merged;
  writeBacklog(items);
  res.json(items[idx]);
});

// ── PatitaPM ───────────────────────────────────────────────────────────────

function buildPatitaContext(backlog, prds) {
  const today = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const backlogLines = backlog.map(item => {
    const plats = Object.entries(item.platforms)
      .map(([p, s]) => `${p}: ${s}`).join(' | ');
    const flags = [
      item.blocker ? `⛔ Bloqueada por ${item.blocker}` : null,
      item.prdReady ? '✅ PRD listo' : null,
    ].filter(Boolean).join(', ');
    return `${item.id} | ${item.epic} | ${item.feature} | ${plats} | Prioridad: ${item.priority}${flags ? ' | ' + flags : ''}`;
  }).join('\n');

  const prdLines = prds.length === 0 ? 'No hay PRDs creados aún.' : prds.map(prd => {
    const openQ = (prd.openQuestions || []).filter(q => !q.resolved).length;
    const obj = (prd.objective || '').slice(0, 200);
    return `${prd.id} | ${prd.feature} | Épica: ${prd.epic} | Estado: ${prd.status} | Autor: ${prd.author} | Preguntas abiertas: ${openQ}\n  Objetivo: ${obj || '(sin objetivo)'}`;
  }).join('\n\n');

  return `Eres PatitaPM, el asistente de producto inteligente de DITU 2.0 — una app de streaming mobile (iOS/Android) desarrollada por Caracol Televisión en Colombia. Eres el copiloto del Product Manager y tienes acceso completo y actualizado al backlog y los PRDs del proyecto.

Fecha de hoy: ${today}
Total features en backlog: ${backlog.length}
PRDs existentes: ${prds.length}

═══════════════════════════════════════════
BACKLOG COMPLETO — ${backlog.length} features
Formato: ID | Épica | Funcionalidad | web | ios | android | atv | Prioridad | Flags
═══════════════════════════════════════════
${backlogLines}

═══════════════════════════════════════════
PRDs EXISTENTES — ${prds.length} documentos
═══════════════════════════════════════════
${prdLines}

═══════════════════════════════════════════
INSTRUCCIONES
═══════════════════════════════════════════
- Responde siempre en español, de forma concisa y directa
- Al mencionar una feature incluye su ID (ej: BL-034 — Casting)
- Al mencionar un PRD incluye su ID (ej: PRD-002 — Live Timeline)
- Para preguntas sobre estados, bloqueos o progreso, cita los datos reales del backlog
- Si algo no está en los datos, dilo claramente — no inventes información
- Puedes analizar el backlog: contar por épica, estado, plataforma, etc.
- Eres directo y útil; no hagas preguntas innecesarias`;
}

app.post('/api/patita', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada en .env.local' });
  }

  const { message, history = [] } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Mensaje requerido' });
  }

  const backlog = readBacklog();
  const prds = readPRDs();
  const systemPrompt = buildPatitaContext(backlog, prds);

  const messages = [
    ...history.slice(-10), // keep last 10 turns for context
    { role: 'user', content: message.trim() }
  ];

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 1024,
        stream: true,
        system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
        messages,
      }),
    });

    if (!apiRes.ok) {
      const err = await apiRes.json().catch(() => ({}));
      res.write(`data: ${JSON.stringify({ error: err.error?.message || `HTTP ${apiRes.status}` })}\n\n`);
      return res.end();
    }

    const reader = apiRes.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') continue;
        try {
          const evt = JSON.parse(raw);
          if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
            res.write(`data: ${JSON.stringify({ text: evt.delta.text })}\n\n`);
          }
        } catch {}
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
  }

  res.end();
});

// ── Roadmap / Compliance API ───────────────────────────────────────────────

app.get('/api/roadmap', (req, res) => {
  const items = readBacklog();
  const today = new Date().toISOString().split('T')[0];

  function daysDiff(a, b) {
    return Math.round((new Date(a) - new Date(b)) / 86400000);
  }
  function isDelivered(item) {
    return Object.values(item.platforms || {}).length > 0 &&
           Object.values(item.platforms || {}).every(s => s === 'entregado');
  }
  function compliance(item) {
    const delivered = isDelivered(item);
    const fc = item.fechaCompromiso || '';
    const fer = item.fechaEntregaReal || '';
    if (!fc) return { status: 'sin-fecha', deltaDias: null };
    if (delivered && fer) {
      const d = daysDiff(fer, fc);
      if (d < 0)  return { status: 'adelantado', deltaDias: d };
      if (d === 0) return { status: 'cumplido',   deltaDias: 0 };
      return { status: 'retrasado-entregado', deltaDias: d };
    }
    const d = daysDiff(today, fc);
    if (d > 0) return { status: 'retrasado-activo', deltaDias: d };
    return { status: 'en-tiempo', deltaDias: d };
  }

  const annotated = items.map(i => ({ ...i, _compliance: compliance(i), _delivered: isDelivered(i) }));
  const withCommitment  = annotated.filter(i => i.fechaCompromiso);
  const deliveredDated  = annotated.filter(i => i._delivered && i.fechaCompromiso && i.fechaEntregaReal);
  const cumplidas       = deliveredDated.filter(i => ['cumplido','adelantado'].includes(i._compliance.status)).length;
  const adelantados     = deliveredDated.filter(i => i._compliance.status === 'adelantado').length;
  const retrasadasActivas = annotated.filter(i => i._compliance.status === 'retrasado-activo');
  const retrasadasEnt   = annotated.filter(i => i._compliance.status === 'retrasado-entregado');
  const allDelayDays    = [...retrasadasActivas, ...retrasadasEnt].map(i => i._compliance.deltaDias).filter(d => d > 0);
  const retrasoPromedio = allDelayDays.length ? +(allDelayDays.reduce((a,b)=>a+b,0)/allDelayDays.length).toFixed(1) : 0;
  const pctCumplimiento = withCommitment.length ? Math.round((cumplidas / withCommitment.length) * 100) : 0;

  // Per epic
  const epicNames = [...new Set(items.map(i => i.epic))];
  const porEpica = epicNames.map(epic => {
    const eItems = annotated.filter(i => i.epic === epic);
    const fcs = eItems.filter(i => i.fechaCompromiso).map(i => i.fechaCompromiso).sort();
    const fes = eItems.filter(i => i.fechaEntrega).map(i => i.fechaEntrega).sort();
    const fcEpic = fcs.length ? fcs[fcs.length - 1] : null;
    const feEpic = fes.length ? fes[fes.length - 1] : null;
    let estado = 'sin-fecha';
    if (fcEpic) {
      if (eItems.some(i => i._compliance.status === 'retrasado-activo')) estado = 'retrasado-activo';
      else if (eItems.every(i => i._delivered)) estado = 'cumplido';
      else if (eItems.some(i => i._compliance.status === 'retrasado-entregado')) estado = 'retrasado-entregado';
      else estado = 'en-tiempo';
    }
    const delta = fcEpic && feEpic ? daysDiff(feEpic, fcEpic) : null;
    return { epic, estado, fechaCompromisoEpica: fcEpic, fechaEstimadaEpica: feEpic, deltaDias: delta, features: eItems };
  });

  // Risk groups
  const vencidas = annotated.filter(i => i._compliance.status === 'retrasado-activo').length;
  const enRiesgo = annotated.filter(i => {
    if (!i.fechaCompromiso || i._delivered) return false;
    const d = daysDiff(i.fechaCompromiso, today);
    return d >= 0 && d <= 7 && (!i.prdReady || !!i.blocker);
  }).length;
  const sinFecha = annotated.filter(i => !i.fechaCompromiso).length;

  res.json({
    metrics: { porcentajeCumplimiento: pctCumplimiento, epicasEnRetraso: retrasadasActivas.length > 0 ? porEpica.filter(e=>e.estado==='retrasado-activo').length : 0, retrasoPromedioDias: retrasoPromedio, entregadasAntesDefecha: adelantados, totalConCompromiso: withCommitment.length, cumplidas },
    riskGroups: { vencidas, enRiesgo, sinFecha },
    porEpica,
    items: annotated,
  });
});

// ── Serve frontend ──────────────────────────────────────────────────────────

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// ── Start ───────────────────────────────────────────────────────────────────

ensureDataFile();
ensurePRDFile();
ensureEpicsFile();
app.listen(PORT, () => {
  console.log(`DITU Product Hub corriendo en http://localhost:${PORT}`);
});
