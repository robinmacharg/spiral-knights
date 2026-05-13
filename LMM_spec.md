# Spiral Knights Visualizer — Full Specification

## Purpose

A single-page web app for visualizing spiral arrangements of chess knight-like pieces, inspired by [OEIS A392177](https://oeis.org/A392177) and Numberphile. The app allows experimentation with piece placement, alternation, attack logic, and spiral geometry, with a focus on performance, configurability, and responsive UI.

---

## Functional Requirements

### 1. Spiral Generation

- Generate a square spiral of N positions, starting at the origin (0,0), expanding outward in an anti-clockwise fashion.
- Spiral coordinates are cached for performance.

### 2. Piece Types

- Support any number of piece types.
- Each piece type has:
  - Name (preset or custom)
  - Color (via color well)
  - Horizontal (H) and vertical (V) move components (integers, e.g., Knight is H=1, V=2)
- Provide mythical chess piece presets (Knight, Alfil, Zebra, etc.) and a custom entry.
- Allow adding/removing/editing piece types at any time.

### 3. Placement Logic

- Alternate piece types in round-robin order.
- Place each piece at the smallest available spiral position not attacked by any previously placed piece.
- Attack logic:
  - Each piece attacks all squares reachable by its (H, V) and (V, H) moves (all 8 possible knight-like deltas).
  - Attack checking is optimized with Sets for fast lookup.
  - If piece types overlap in attack pattern, use per-type attacked sets; otherwise, use a single attacked set.
- Placement stops when all positions are filled or no further placements are possible.

### 4. Drawing and Visualization

- Use HTML5 Canvas for rendering.
- Draw the spiral and pieces in batches of N cells per animation frame (batch size configurable via UI).
- Only clear and resize the canvas once per placement run; incremental drawing only draws new pieces.
- For small spirals (<500 positions), show grid and piece numbers; for large spirals, use fast filled rendering.
- Drawing and calculation are asynchronous to avoid UI freezing.

### 5. Controls and UI

- Sidebar (control column) contains all controls:
  - Number of spiral positions (numeric input)
  - Piece type management (add, remove, edit, color, preset, H/V)
  - Start/Stop button with spinner for calculation
  - Reset button
  - Save as PNG button (disabled until a visualization is present)
  - Draw batch size input (numeric, min 1, max 10000)
  - Estimated image size and warnings for large spirals
- Controls are always editable, even during calculation.
- Color wells are prominent and accessible.
- Instructions are shown in the sidebar.

### 6. Export

- Save the current visualization as a PNG image.

### 7. Performance

- Placement and drawing are batched for responsiveness.
- Spiral coordinates and attack deltas are cached.
- Level-of-detail rendering for large spirals.

---

## Technical Requirements

- **No frameworks or build tools**; all logic is in plain HTML, JS, and CSS.
- All computation and rendering is client-side.
- Designed for experimentation with spiral chess arrangements and mythical piece types.
- File structure:
  - `spiral-knights.html` — Main UI, sidebar, and canvas.
  - `spiral-knights.js` — All logic for spiral generation, piece placement, attack checking, drawing, and UI event handling.
  - `spiral-knights.css` — Styling for sidebar, controls, and canvas.

---

## UI Layout

- Two-column layout:
  - Left: Sidebar with all controls (see above).
  - Right: Main area with centered canvas for visualization.

---

## Example UI Controls (HTML)

```
<div id="sidebar">
  <label>
    Number of spiral positions:
    <input id="numPositions" type="number" min="1" max="9999" value="50" />
  </label>
  <div>
    <b>Piece Types</b>
    <div id="pieceTypes"></div>
    <button id="addPiece">Add Piece Type</button>
  </div>
  <button id="startBtn">Start</button>
  <button id="resetBtn">Reset</button>
  <div>
    <button id="saveBtn" disabled>Save as PNG</button>
  </div>
  <div>
    <label for="batchSize">Draw batch size:</label>
    <input id="batchSize" type="number" min="1" max="10000" value="100" />
  </div>
  <!-- ...instructions and warnings... -->
</div>
<div id="main">
  <canvas id="canvas"></canvas>
</div>
```

---

## Example Piece Presets

- Knight: H=1, V=2
- Alfil: H=2, V=2
- Zebra: H=2, V=3
- Dabbaba: H=2, V=0
- Wazir: H=1, V=0
- Fers: H=1, V=1
- Antelope: H=4, V=3
- Leaper: H=3, V=0
- Other: Custom

---

## Example Usage

1. Open `spiral-knights.html` in a modern browser.
2. Configure the number of spiral positions and piece types in the sidebar.
3. Click **Start** to begin visualization. The spiral will fill in real time.
4. Adjust the draw batch size for optimal performance.
5. Save the result as a PNG if desired.

---

## Implementation Notes

- Spiral coordinates are generated and cached for each N.
- Piece placement is performed asynchronously, yielding to the event loop every batch for UI responsiveness.
- Drawing is performed in batches, only drawing new pieces each time.
- The canvas is only cleared and resized once per placement run.
- All controls remain editable during calculation.
- The UI is styled for clarity and accessibility, with prominent color wells and responsive layout.

---

This specification is sufficient for an LLM to reproduce the app's functionality, UI, and performance characteristics.
