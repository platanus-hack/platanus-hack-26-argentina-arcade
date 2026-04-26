# BRIEF DE IMPLEMENTACIÓN — Drive-Thru Rush

> **Instrucción para el agente de código (Claude Code):**
> Lee este documento COMPLETO antes de escribir cualquier línea de código.
> Este brief **NO reemplaza** las instrucciones de `AGENTS.md` — ese archivo es la fuente de verdad para las restricciones técnicas. Este documento define QUÉ construir; `AGENTS.md` define el CÓMO técnico. Si existe algún conflicto entre ambos, tiene prioridad `AGENTS.md`.

---

## 🚨 LIMITACIONES CRÍTICAS DEL DESAFÍO

Lee estas reglas antes de planificar cualquier implementación. Son las reglas del desafío Platanus Hack 26 Arcade y **no tienen excepciones**.

1. **Tamaño máximo: 50KB** después de minificación (antes de gzip). Verificar con `npm run check-restrictions` con frecuencia.
2. **Archivos editables: SOLO `game.js`, `metadata.json`, `cover.png`**. No modificar ningún otro archivo.
3. **JavaScript vanilla puro**: no usar `import`, `require`, módulos ES6 ni bundlers.
4. **Sin llamadas de red**: no usar `fetch`, `XMLHttpRequest`, ni URLs con `http://`, `https://` o `//`. Solo se permiten `data:` URIs.
5. **Sin assets externos**: no usar archivos de imagen, audio ni fuentes externas. Todo debe ser:
   - Gráficos generados proceduralmente con la Graphics API de Phaser
   - Audio generado con Web Audio API (osciladores)
   - Base64 embebido solo si es estrictamente necesario (evitar cuando sea posible)
6. **Phaser 3 v3.87.0** está disponible como variable global (cargado por CDN externo, no cuenta en el límite de 50KB).
7. **Mapeo de teclas `CABINET_KEYS`**: NO modificar las teclas existentes. Corresponden al cableado físico del gabinete. Solo se permite AGREGAR teclas adicionales a los arrays para pruebas locales.
8. **Usar los códigos arcade** (`P1_U`, `P1_1`, `START1`, etc.) en la lógica del juego. Nunca usar teclas del teclado directamente.
9. **Persistencia con `window.platanusArcadeStorage`** (ver `AGENTS.md`). Validar los datos al leerlos, porque pueden tener una estructura diferente entre versiones.
10. **No iniciar servidores de desarrollo**. El usuario ejecuta `npm run dev` cuando necesita probar.

**Verificar estas reglas después de completar cada etapa de implementación.**

---

## 🎮 CONCEPTO DEL JUEGO

**Drive-Thru Rush** es un juego arcade inspirado en Tapper, reimaginado como un drive-thru de comida rápida. Dos jugadores manejan restaurantes rivales: **BURGERTRONIC** (amarillo) vs **TACOSAURUS** (rojo). Los autos llegan por carriles horizontales mostrando su pedido; el jugador debe servir el producto correcto antes de que el auto llegue al final del carril.

**Modos de juego:**
- **1 jugador**: usa toda la pantalla, el jugador compite contra su propio puntaje y el tiempo
- **2 jugadores competitivo**: pantalla dividida, cada uno maneja su restaurante, gana quien acumule más puntos o quien sobreviva más tiempo

**Metadata sugerida:**
```json
{
  "game_name": "Drive-Thru Rush",
  "description": "Burgertronic vs Tacosaurus. Sirve el pedido correcto antes de que el auto se vaya. Arcade drive-thru para 1 o 2 jugadores.",
  "player_mode": "two_player"
}
```

---

## 🕹️ CONTROLES

Usar siempre los códigos arcade. Nunca usar teclas del teclado directamente en la lógica del juego. El starter ya tiene `CABINET_KEYS` y `KEY_TO_ARCADE` configurados; usar esos mismos.

### Jugador 1 (BURGERTRONIC)
| Acción | Código arcade | Tecla física |
|---|---|---|
| Mover chef hacia arriba | `P1_U` | W |
| Mover chef hacia abajo | `P1_D` | S |
| Servir ítem 1 (Burger) | `P1_1` | U |
| Servir ítem 2 (Papas) | `P1_2` | I |
| Servir ítem 3 (Bebida) | `P1_3` | O |
| Servir ítem 4 (Helado) | `P1_4` | J |
| Start / Pausa | `START1` | Enter |

### Jugador 2 (TACOSAURUS)
| Acción | Código arcade | Tecla física |
|---|---|---|
| Mover chef hacia arriba | `P2_U` | Arriba |
| Mover chef hacia abajo | `P2_D` | Abajo |
| Servir ítem 1 (Taco) | `P2_1` | R |
| Servir ítem 2 (Burrito) | `P2_2` | T |
| Servir ítem 3 (Bebida) | `P2_3` | Y |
| Servir ítem 4 (Salsa) | `P2_4` | F |
| Start | `START2` | 2 |

**Nota importante sobre los íconos**: no usar emojis como gráficos en el canvas (puede generar problemas de renderizado). Cada ítem debe representarse con una **forma geométrica única + color único** dibujada con Phaser. Los emojis en este brief son solo referencias visuales para comunicar la idea.

### Íconos visuales propuestos (dibujados con shapes de Phaser)
| Ítem | Representación visual |
|---|---|
| Burger | Dos rectángulos marrones con círculo amarillo al medio (pan + queso + pan) |
| Papas | Tres rectángulos verticales amarillos agrupados |
| Bebida | Rectángulo vertical azul con tapa blanca y pajita |
| Helado | Triángulo beige con círculo rosado encima |
| Taco | Semicírculo amarillo con relleno marrón y verde |
| Burrito | Rectángulo marrón con líneas diagonales |
| Salsa | Triángulo rojo con tallo verde encima |

---

## 🎨 LAYOUT DE PANTALLA (800x600)

### Modo 2 jugadores (pantalla dividida horizontalmente)

```
y=0   +----------------------------------------------+
      | BURGERTRONIC   P1: 0000   [vida][vida][vida] |  HUD P1 (y=0-55)
y=55  +----------------------------------------------+
      |                                              |
y=130 | [CHEF amarillo]=========== [auto][pedido] => |  Carril 1 P1
      |                                              |
y=220 | [CHEF amarillo]======= [auto][pedido] =====> |  Carril 2 P1
      |                                              |
y=300 +══════════════════════════════════════════════+  Divisor (linea gruesa)
      |                                              |
y=380 | [CHEF rojo]=============== [auto][pedido] => |  Carril 1 P2
      |                                              |
y=470 | [CHEF rojo]=========== [auto][pedido] =====> |  Carril 2 P2
      |                                              |
y=545 +----------------------------------------------+
      | TACOSAURUS     P2: 0000   [vida][vida][vida] |  HUD P2 (y=545-600)
y=600 +----------------------------------------------+
```

### Modo 1 jugador
Usa toda la pantalla. El jugador (BURGERTRONIC por defecto) tiene **4 carriles** en lugar de 2.

```
y=0   +----------------------------------------------+
      | BURGERTRONIC   SCORE: 0000   [vida][vida][vida] |
y=60  +----------------------------------------------+
y=130 | [CHEF]============= [auto][pedido] ========> |  Carril 1
y=230 | [CHEF]========= [auto][pedido] ============> |  Carril 2
y=330 | [CHEF]============= [auto][pedido] ========> |  Carril 3
y=430 | [CHEF]========= [auto][pedido] ============> |  Carril 4
y=540 +----------------------------------------------+
      | TIME 00:00   COMBO x1                        |
y=600 +----------------------------------------------+
```

---

## 📏 MEDIDAS Y POSICIONES CLAVE

- **Canvas:** 800x600
- **Chef:** rectángulo 30x45 px, posición x=60 (fija), y dinámico según el carril activo
- **Carril (área visual):** ancho de x=100 a x=770, alto aproximado de 60 px centrado en la línea del carril
- **Auto:** rectángulo de ~50x40 px con detalles (ventanas, ruedas). Aparece en x=770 y se desplaza hacia la izquierda a velocidad variable
- **Zona de servicio:** x=100 a x=180. Es el área donde el chef puede atender a un auto
- **Zona de escape del auto:** si el auto llega a x menor a 90 sin haber sido servido, el jugador pierde una vida
- **Ícono del pedido encima del auto:** ~20x20 px, flotando 30 px sobre el techo del auto

---

## ⚙️ MECÁNICA DETALLADA

### Flujo de un auto

1. **Spawn**: aparece en x=770 en un carril aleatorio. Encima tiene un ícono que indica su pedido (uno de los 4 ítems del restaurante).
2. **Movimiento**: se desplaza hacia la izquierda a velocidad `carSpeed` (ver sección Dificultad).
3. **Zona de servicio**: cuando el auto entra entre x=100 y x=180, el chef puede atenderlo si está posicionado en el mismo carril.
4. **Servir**: el jugador presiona el botón del ítem que corresponde al pedido del auto:
   - Correcto: el auto se detiene un instante, muestra una animación de satisfacción (flash verde), otorga puntos y desaparece.
   - Incorrecto: el auto sigue avanzando, pero ese botón queda bloqueado 500ms para ese auto (evita presionar repetidamente el mismo botón incorrecto).
5. **Auto escapa por la izquierda**: si llega a x menor a 90 sin ser atendido, el jugador pierde 1 vida.

### Cuándo un botón atiende a un auto

Un botón actúa sobre el auto **más cercano al chef** que esté dentro de la zona de servicio del carril activo. Por ejemplo: si el chef está en el carril 2 y el jugador presiona `P1_1`, el juego busca el auto más cercano a x=100 en el carril 2 e intenta servirle "Burger".

Si no hay ningún auto en la zona de servicio del carril activo, el botón no tiene efecto. Se puede mostrar un pequeño feedback visual de "miss", sin penalización.

### Puntaje

- Servir correctamente: +100 puntos base
- Multiplicador por combo: cada auto servido correctamente de forma consecutiva aumenta el multiplicador:
  - Racha de 3 consecutivos: x1.5
  - Racha de 5 consecutivos: x2
  - Racha de 10 consecutivos: x3
- Al cometer un error o perder una vida: el combo se reinicia a x1
- Mostrar el multiplicador activo en el HUD en todo momento

### Vidas

- Cada jugador comienza con 3 vidas
- Se pierde una vida cuando un auto escapa sin ser atendido
- NO se pierde vida por presionar un botón incorrecto (solo se reinicia el combo y ese botón queda bloqueado 500ms)
- 0 vidas: game over para ese jugador

### Fin de partida

- **Modo 1P**: game over cuando el jugador queda sin vidas. Mostrar puntaje final y permitir guardar el high score.
- **Modo 2P**: dos condiciones de fin:
  - Un jugador pierde todas sus vidas: gana el otro (aunque tenga menos puntos; sobrevivir tiene prioridad)
  - Pasan 2 minutos: gana el jugador con más puntos (si hay empate exacto: sudden death de 15 segundos)

---

## 📈 DIFICULTAD PROCEDURAL

La dificultad escala automáticamente en función del tiempo transcurrido. No hay niveles predefinidos.

Variables que escalan:

| Variable | Valor inicial | Valor a los 2 min |
|---|---|---|
| Velocidad de los autos (px/s) | 80 | 180 |
| Frecuencia de spawn (ms entre autos) | 2500 | 900 |
| Probabilidad de spawn simultáneo en múltiples carriles | 0% | 30% |

Implementación sugerida: función `getDifficulty(timeElapsedMs)` que devuelva un objeto con los parámetros actuales, interpolando linealmente entre el valor inicial y el final según `timeElapsed / 120000`.

Los valores no deben superar los indicados en "Valor a los 2 min", aunque la partida se extienda (sudden death, etc.).

---

## 🎨 PALETA Y ESTILO VISUAL

Mantener el estilo del starter (fondo oscuro #0b0f03, bordes amarillo-oliva). Agregar los siguientes colores:

```js
const COLORS = {
  // Base (del starter)
  background: 0x0b0f03,
  frame: 0x3a3a0a,
  white: 0xf7ffd8,

  // Restaurantes
  burgertronic: 0xffcc00,
  burgertronicDark: 0x8a6d00,
  tacosaurus: 0xff3b3b,
  tacosaurusDark: 0x8a1f1f,

  // Ítems BURGERTRONIC
  itemBurger: 0x8b4513,
  itemFries: 0xffd84d,
  itemDrink: 0x3ba3ff,
  itemIceCream: 0xff9ec7,

  // Ítems TACOSAURUS
  itemTaco: 0xf7c948,
  itemBurrito: 0x7a4a1e,
  itemDrinkP2: 0x3ba3ff,
  itemSalsa: 0xff3b3b,

  // UI
  lifeActive: 0xff6ec7,
  scoreText: 0xe1ff00,
  carBody: 0x5a6c8c,
  carWindow: 0xaaeeff,
  road: 0x1a1e05,
};
```

### Carriles / fondo

Cada carril es una "calle" visible: un rectángulo oscuro (road) con líneas discontinuas blancas en el centro. Las líneas se pueden animar moviéndose de derecha a izquierda para dar sensación de movimiento.

### Auto

Rectángulo principal (cuerpo) + rectángulos más claros (ventanas) + dos círculos oscuros en la parte inferior (ruedas). Simple pero legible. El color del cuerpo puede variar aleatoriamente entre 3 o 4 colores para dar variedad visual.

### Pedido encima del auto

Cuadrado blanco de 22x22 px flotando 30 px sobre el techo del auto. Dentro se dibuja el ícono del ítem correspondiente, escalado para que quepa.

### Chef

Rectángulo vertical con el color del restaurante. Encima, un círculo pequeño (cabeza) del mismo color pero más claro. Un rectángulo blanco pequeño al frente representa el delantal.

Cuando el jugador presiona un botón válido: el chef se "inclina" hacia la derecha por 100ms (escala X a 1.1, luego vuelve al tamaño original).

---

## 🔊 AUDIO

Todo debe generarse con Web Audio API. Ver las funciones `playSound` y `startAmbientMusic` del starter como referencia.

Sonidos requeridos:
- **serveCorrect**: blip agudo corto y alegre (frecuencia 600 a 1200, decay rápido)
- **serveWrong**: buzz grave corto (frecuencia 200 a 80, decay medio)
- **carEscape**: descenso largo y dramático (frecuencia 400 a 60, 400ms)
- **combo**: campanita ascendente cuando sube el multiplicador
- **click**: tick neutro para navegación de menú
- **select**: confirmación al iniciar partida

Música ambiente: opcional. Si se implementa, debe ser simple y a volumen bajo (0.15 a 0.2 máx).

---

## 🗂️ ESTRUCTURA DE ESTADOS

El juego usa un estado principal (`scene.state.phase`) con los siguientes valores posibles:

- `'boot'`: carga inicial, lee los high scores guardados
- `'start'`: menú principal con selector 1P/2P, leaderboard y controles
- `'leaderboard'`: pantalla de mejores puntajes
- `'controls'`: pantalla explicativa de controles
- `'playing'`: partida en curso
- `'paused'`: juego en pausa
- `'gameover'`: resultado final, ingreso de iniciales
- `'saved'`: puntaje guardado, regreso al menú

Este patrón ya está implementado en el starter. Seguir el mismo estilo y estructura.

---

## 🎯 MENÚ PRINCIPAL

Pantalla de inicio con:
- Título grande: "DRIVE-THRU RUSH"
- Subtítulo: "BURGERTRONIC vs TACOSAURUS"
- Opciones seleccionables con joystick arriba/abajo:
  1. 1 PLAYER
  2. 2 PLAYERS
  3. LEADERBOARD
  4. CONTROLS
- Confirmar con `START1`, `START2`, `P1_1` o `P2_1`

---

## 💾 PERSISTENCIA

Guardar los high scores con `window.platanusArcadeStorage` (ver `AGENTS.md`).

Estructura propuesta:

```js
// Key: 'drive-thru-rush-highscores'
// Value: array de objetos ordenados por score descendente
[
  { name: 'ABC', score: 4500, mode: '1P', combo: 12, date: '2026-04-20' },
]
```

Guardar como máximo los 10 mejores puntajes.

Validar al leer: verificar que el valor es un array y que cada entrada tiene los campos esperados. Los datos pueden tener una estructura diferente si provienen de versiones anteriores del juego.

Ingreso de iniciales (3 letras) al final de cada partida. Adaptar el sistema de grilla de letras con joystick que ya existe en el starter.

---

## 🚧 PLAN DE IMPLEMENTACIÓN POR ETAPAS

Implementar en este orden. Ejecutar `npm run check-restrictions` después de cada etapa.

### Etapa 1: Esqueleto + modo 1P básico
- [ ] Definir constantes (COLORS, ítems de menú, curva de dificultad)
- [ ] Crear la state machine con boot, start, playing, gameover
- [ ] Implementar menú mínimo (solo "1 PLAYER" y "START")
- [ ] Implementar partida 1P con UN solo carril
- [ ] Auto aparece, se desplaza, el chef sirve, el puntaje sube
- [ ] Sin sonidos ni efectos visuales todavía
- [ ] Verificar tamaño

### Etapa 2: Múltiples carriles + vidas
- [ ] Agregar los 4 carriles (modo 1P) / 2 carriles (modo 2P)
- [ ] Chef se mueve entre carriles con el joystick
- [ ] Sistema de vidas (se pierde una cuando un auto escapa)
- [ ] Game over + ingreso de iniciales + guardado del puntaje
- [ ] Dificultad procedural (velocidad y frecuencia de spawn escalan con el tiempo)
- [ ] Verificar tamaño

### Etapa 3: Modo 2P competitivo
- [ ] Pantalla dividida arriba/abajo
- [ ] Dos chefs independientes con sus propios controles
- [ ] Dos puntajes, dos conjuntos de vidas
- [ ] Lógica de fin de partida en modo 2P (muerte de un jugador o timeout de 2 min)
- [ ] Verificar tamaño

### Etapa 4: Polish visual
- [ ] Mejorar los sprites procedurales (autos con ventanas y ruedas; chef con detalles)
- [ ] Animaciones: chef se inclina al servir, auto hace flash verde al acertar
- [ ] Partículas simples al servir correctamente
- [ ] Líneas animadas en el asfalto
- [ ] Efecto visual en el HUD cuando sube el combo
- [ ] Verificar tamaño

### Etapa 5: Audio + pulido final
- [ ] Implementar todos los sonidos (Web Audio API)
- [ ] Música ambiente simple (opcional)
- [ ] Pantalla de leaderboard completa
- [ ] Pantalla de controles
- [ ] Pantalla de pausa
- [ ] Imagen de portada cover.png (800x600, menos de 500KB)
- [ ] Verificar tamaño y pasar check-restrictions sin errores

---

## ✅ CHECKLIST FINAL ANTES DE ENTREGAR

- [ ] `npm run check-restrictions` pasa sin errores
- [ ] El juego funciona en modo 1P y en modo 2P
- [ ] Solo se modificaron game.js, metadata.json y cover.png
- [ ] CABINET_KEYS no fue alterado (solo se agregaron teclas adicionales a los arrays)
- [ ] No hay import, require, fetch, XMLHttpRequest ni URLs externas en el código
- [ ] metadata.json tiene nombre, descripción y player_mode "two_player"
- [ ] cover.png existe, mide exactamente 800x600 px y pesa menos de 500KB
- [ ] El juego es estable: no colapsa, no deja autos bloqueados, no se rompe al pausar o reanudar

---

## 📝 NOTAS FINALES PARA EL AGENTE

- **Reutilizar lo que está en el starter** (game.js actual): el sistema de entrada de teclas, la state machine, la persistencia y la grilla de iniciales. Adaptar lo que ya existe; no reimplementar desde cero.
- **Minificación**: Vite minifica automáticamente. Escribir código legible; no intentar optimizar manualmente con nombres cortos.
- **Rendimiento**: evitar crear objetos en el loop de update() cuando sea posible; reutilizar arrays; destruir los sprites que salen de pantalla.
- **Testing**: el usuario ejecuta `npm run dev`. El agente NO debe iniciar el servidor de desarrollo.
- **Si el código supera los 50KB**: priorizar funcionalidad sobre efectos visuales. Un juego funcional sin polish es mejor que un juego pulido que no cabe en el límite.
- **Partículas con moderación**: crear efectos de partículas con cuidado para no afectar el rendimiento ni el tamaño del archivo.

Si algo en este brief es ambiguo, consultar al usuario antes de tomar una decisión por cuenta propia.
