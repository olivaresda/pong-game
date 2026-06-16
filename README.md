# Retro Neon Pong - Edición Premium

Un juego clásico de Pong adaptado con una estética moderna Cyberpunk/Neón, físicas fluidas, efectos de partículas al impacto, efectos de sonido sintetizados mediante la API Web Audio y diferentes niveles de dificultad contra la CPU o modo multijugador local.

## 🚀 Características
- **Física de Rebote Realista**: El ángulo del rebote se calcula en base a qué parte de la paleta impacta la pelota.
- **Efectos de Partículas**: Efectos visuales de chispas en colisiones con paredes y paletas, aumentando la inmersión del juego.
- **Sonido Integrado**: Sonidos sintéticos generados en tiempo real mediante la API Web Audio (sin necesidad de cargar archivos de audio externos).
- **IA de CPU Adaptativa**: Cuatro niveles de dificultad (Fácil, Medio, Difícil, Imposible) con comportamientos de seguimiento inteligentes y orgánicos.
- **Modo PVP**: Soporte para dos jugadores en el mismo teclado.
- **Temas de Color Dinámicos**: Cambia la estética entre **Neón**, **Matrix** y **Ámbar** en caliente.

## 📁 Estructura del Proyecto
- [index.html](file:///C:/agy-cli-projects/pong-game/index.html) - Estructura semántica, controles laterales y overlays HUD.
- [styles.css](file:///C:/agy-cli-projects/pong-game/styles.css) - Estilos responsivos, tokens de diseño neón y transiciones suaves.
- [game.js](file:///C:/agy-cli-projects/pong-game/game.js) - Bucle de juego principal, físicas de colisión, IA de CPU, sonido dinámico y partículas.

## 🎮 Instrucciones de Juego

### Controles
- **Pausar / Reanudar**: <kbd>Espacio</kbd>
- **Jugador 1 (Izquierda)**: <kbd>W</kbd> para subir, <kbd>S</kbd> para bajar.
- **Jugador 2 (Derecha)**: Flecha <kbd>▲</kbd> para subir, Flecha <kbd>▼</kbd> para bajar. (Sólo activo en modo PVP de 2 Jugadores).

### Objetivo
El primer jugador en alcanzar **10 puntos** gana el juego.

---

## 🛠️ Cómo emparejar con tu repositorio remoto de GitHub

Para subir este juego a tu propia cuenta de GitHub, sigue estos sencillos pasos:

1. **Autentícate en GitHub CLI**:
   Si aún no te has autenticado, ejecuta:
   ```bash
   & "C:\Program Files\GitHub CLI\gh.exe" auth login
   ```
   Sigue los pasos en la pantalla para iniciar sesión mediante tu navegador.

2. **Crea el repositorio remoto**:
   Usa el comando `gh repo create` para crear un nuevo repositorio en tu cuenta y vincularlo automáticamente como `origin`:
   ```bash
   & "C:\Program Files\GitHub CLI\gh.exe" repo create pong-game --public --source=. --remote=origin --push
   ```

3. **Confirmar cambios manualmente (si no usaste la opción anterior)**:
   ```bash
   git add .
   git commit -m "Initial commit: Neon Pong Game"
   git branch -M main
   git push -u origin main
   ```
