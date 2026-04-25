# CLAUDE.md — Chroma Dash (Platanus Hack 26)

## Reglas de oro (NO negociables)
- Solo editar: `game.js`, `metadata.json`, `cover.png`
- NO tocar: index.html, vite.config.ts, package.json, ni nada más
- NO correr el servidor dev — Dante lo corre él
- Después de cada fase: `npm run check-restrictions` y luego commit con el mensaje exacto del plan
- Tamaño máximo: 50KB minificado (actualmente ~20KB — verificar que no se dispare)

## El juego
**Chroma Dash** — infinite runner + combate. Resolución 800×600. Motor: Phaser 3 v3.87.0 (CDN).
Un archivo: `game.js`. Sin imports. Sin red. Sin imágenes externas.

## Stack
- JavaScript vanilla puro (sin imports/requires)
- Phaser 3 vía CDN (no cuenta en el límite de 50KB)
- Vite dev server en puerto 3001

## Documentos de referencia
- `PRD_v2_delta.md` — qué hace cada feature
- `PlanEjecutivo_v2.md` — fases de implementación (A–J), una por una
- `DOCUMENTACION_MECANICAS.md` — arquitectura base del juego (leer antes de tocar código)
- `docs/phaser-api.md` — API completa de Phaser 3

## Flujo de trabajo
1. Dante aprueba una fase
2. Claude implementa **solo esa fase**, nada más
3. Commit con el mensaje exacto del plan (ej: `iter2-fase-G: jefe seccion 2`)
4. Dante revisa y aprueba la siguiente

## Estado actual de fases

| Fase | Qué es | Estado |
|------|--------|--------|
| A | Daño numérico a enemigos | ✅ Hecho |
| B | Sistema de secciones | ✅ Hecho |
| C | Dash horizontal y descendente | ✅ Hecho |
| D | Tipos de disparo intercambiables | ✅ Hecho |
| E | Enemigo base Nivel 2 y 3 | ✅ Hecho |
| F | Triángulo aéreo (3 niveles) | ✅ Hecho |
| G | Jefe de Sección 2 | ⏳ Pendiente |
| H | Jefe de Sección 5 | ⏳ Pendiente |
| I | Power-up de salto permanente | ✅ Hecho (se hizo con F) |
| J | Loop infinito con dificultad escalada | ⏳ Pendiente |

## Variables y constantes clave en game.js

```
GAME_WIDTH, GAME_HEIGHT    — 800×600
COLORS                     — paleta de colores
SECTIONS[5]                — configuración por sección
currentSection             — 0–4 (sección actual)
sectionProgress            — 0.0–1.0
gameSpeed                  — velocidad de scroll (crece con el tiempo)
playTime                   — tiempo relativo del frame actual (ms)
immunityTimer              — hasta qué playTime el jugador es invulnerable
shootMode                  — 'homing' | 'triple' | 'auto'
jumps.current / jumps.max  — cargas de salto actuales / máximo
enemies, enemyBullets      — grupos Phaser
airTriangles               — grupo Phaser (triángulos aéreos)
playerBullets, powerups    — grupos Phaser
```

## Controles (CABINET_KEYS)
- `P1_U / P1_D / P1_L / P1_R` → movimiento (WASD + flechas)
- `P1_1 (E/U/Z/F)` → disparo
- `START1 (Enter/Space)` → salto / confirmar
- `START2 (ESC/2)` → pausa
- Doble-tap A/D → dash horizontal
- S + Space en el aire → dash descendente

## Restricciones que se deben cumplir siempre
- No `import` ni `require`
- No URLs externas (solo `data:` URIs)
- No `fetch` ni `XMLHttpRequest`
- ≤50KB minificado
