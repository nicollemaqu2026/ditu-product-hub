# DITU Product Hub

Herramienta de gestión de producto para DITU 2.0 — Caracol Televisión.

## Requisitos

- Node.js 16+

## Instalación y uso

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor
npm start

# 3. Abrir en el navegador
# http://localhost:3000
```

El archivo `data/backlog.json` se crea automáticamente con las 40 funcionalidades pre-cargadas en el primer arranque. Si el archivo ya existe, los datos existentes se preservan.

## Módulos disponibles

| Módulo | Estado |
|--------|--------|
| Backlog Master | ✅ Disponible |
| PRD Generator | 🔜 Próximamente |
| Figma Tracker | 🔜 Próximamente |
| Roadmap | 🔜 Próximamente |
| Status Report | 🔜 Próximamente |
| Decision Log | 🔜 Próximamente |

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/backlog` | Lista completa del backlog |
| GET | `/api/backlog/stats` | Estadísticas globales y por épica |
| GET | `/api/backlog/:id` | Un ítem por ID |
| PUT | `/api/backlog/:id` | Actualizar un ítem |
