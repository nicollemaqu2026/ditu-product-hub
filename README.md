# DITU Product Hub

Herramienta interna de gestión de producto para **DITU 2.0 — Caracol Televisión**.  
Centraliza el backlog, los PRDs, el roadmap de entregas y el asistente de producto en una sola interfaz.

---

## Stack

- **Backend:** Node.js + Express
- **Frontend:** Vanilla JS SPA (sin framework, sin bundler)
- **Persistencia:** JSON files (`data/backlog.json`, `data/prds.json`, `data/epics.json`)
- **AI:** Claude API (Anthropic) — usado por PatitaPM

---

## Instalación y uso

```bash
# 1. Instalar dependencias
npm install

# 2. Variables de entorno
cp .env.local.example .env.local   # añadir ANTHROPIC_API_KEY

# 3. Iniciar servidor
npm start
# → http://localhost:3000
```

`data/backlog.json` se crea automáticamente con 41 funcionalidades pre-cargadas en el primer arranque.

---

## Módulos

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| **Backlog Master** | ✅ Disponible | Gestión completa del backlog con drag & drop, filtros, inline edit y métricas |
| **PRD Generator** | ✅ Disponible | Creación y edición de documentos de requisitos por funcionalidad |
| **PatitaPM** | ✅ Disponible | Asistente AI con acceso completo al backlog y PRDs |
| **Roadmap** | ✅ Disponible | Vista ejecutiva y operativa de entregas con compliance tracking |

---

## Backlog Master

- **Drag & drop** de épicas completas y features (reordenar + mover entre épicas)
- **Edición inline** de nombres de épicas y features directamente en la tabla
- **Eliminación** de épicas y features con confirmación
- **Filtros** por épica, plataforma, estado y bloqueador + búsqueda de texto
- **Status pills** con dropdown inline para cambiar estado sin abrir panel
- **Panel de edición** con fechas, figma status, PRD, bloqueadores, notas y links
- **Exportar CSV**

### Estados de plataforma

| Valor | Descripción |
|-------|-------------|
| `sin-especificar` | Sin estado definido |
| `en-especificacion` | En proceso de especificación |
| `listo-para-dev` | Listo para desarrollo |
| `en-desarrollo` | En desarrollo activo |
| `en-qa` | En fase de QA |
| `entregado` | Entregado en producción |

---

## Roadmap

Sistema de compliance tracking del equipo técnico.

### Campos de fecha

| Campo | Descripción |
|-------|-------------|
| `fechaCompromiso` | Fecha comprometida por el equipo técnico |
| `fechaEntrega` | Estimado actual de entrega |
| `fechaEntregaReal` | Entrega real — se auto-asigna cuando todas las plataformas llegan a `entregado` |

### Estados de compliance

| Estado | Condición |
|--------|-----------|
| `cumplido` | Entregado en la fecha comprometida |
| `adelantado` | Entregado antes de la fecha comprometida |
| `retrasado-entregado` | Entregado después de la fecha comprometida |
| `retrasado-activo` | Hoy superó la fecha comprometida y no ha sido entregado |
| `en-tiempo` | Dentro del plazo, aún no entregado |
| `sin-fecha` | Sin fecha de compromiso definida |

---

## API

### Backlog

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/backlog` | Lista completa |
| `GET` | `/api/backlog/stats` | Estadísticas globales y por épica |
| `GET` | `/api/backlog/:id` | Un ítem por ID |
| `POST` | `/api/backlog` | Crear feature |
| `PUT` | `/api/backlog/:id` | Actualizar ítem |
| `DELETE` | `/api/backlog/:id` | Eliminar feature |
| `PUT` | `/api/backlog/epic/rename` | Renombrar épica |
| `DELETE` | `/api/backlog/epic/:epicName` | Eliminar épica y sus features |

### PRDs

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/prds` | Lista de PRDs |
| `GET` | `/api/prds/stats` | Estadísticas por estado |
| `POST` | `/api/prds` | Crear PRD desde backlog item |
| `PUT` | `/api/prds/:id` | Actualizar PRD |
| `DELETE` | `/api/prds/:id` | Eliminar PRD |

### Roadmap y épicas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/roadmap` | Compliance engine: métricas, por épica, risk groups |
| `GET` | `/api/epics` | Lista de épicas |
| `POST` | `/api/epics` | Crear épica vacía |

### PatitaPM

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/patita` | Chat con contexto del backlog y PRDs (streaming SSE) |

---

## Estructura del proyecto

```
ditu-product-hub/
├── server.js              # Express server + API routes
├── data/
│   ├── backlog.json       # Estado del backlog
│   ├── prds.json          # PRDs
│   └── epics.json         # Épicas adicionales
├── public/
│   ├── css/main.css       # Design system
│   └── js/
│       ├── app.js         # Globals: toast, panel, nav, fetch helpers
│       ├── backlog.js     # Backlog Master
│       ├── prd.js         # PRD Generator
│       ├── patita.js      # PatitaPM
│       └── roadmap.js     # Roadmap
└── views/
    └── index.html         # SPA shell
```

---

## Variables de entorno

```env
# .env.local
ANTHROPIC_API_KEY=sk-ant-...   # Requerida para PatitaPM
```
