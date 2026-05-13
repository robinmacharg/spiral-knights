# Spiral Knights Visualizer

A single-page web app for visualizing spiral arrangements of chess knight-like pieces, inspired by [this Numberphile video](https://www.youtube.com/watch?v=UiX4CFIiegM) ([Follow-up](https://www.youtube.com/watch?v=VgmDuBCayPw)). The app allows experimentation with piece placement, alternation, attack logic, and spiral geometry, with a focus on performance and configurability.

Vibe-coded with GPT-4.1.

Clone the repo and open the HTML file locally, or [Preview it here](https://refined-github-html-preview.kidonng.workers.dev/robinmacharg/spiral-knights/raw/refs/heads/main/spiral-knights.html)

## Features

- **Spiral Generation**
  - Generates a square spiral of configurable length (number of positions).
  - Spiral coordinates are cached for performance.

- **Piece Types**
  - Supports any number of piece types, each with:
    - Name (preset or custom)
    - Color (via color well)
    - Horizontal (H) and vertical (V) move components
  - Includes mythical chess piece presets (Knight, Alfil, Zebra, etc.) and custom entry.

- **Placement Logic**
  - Alternates piece types in a round-robin fashion.
  - Places each piece at the smallest available spiral position not attacked by any previously placed piece.
  - Attack logic uses knight-like moves (H, V) and is optimized with Sets for fast lookup.
  - Handles overlapping attack types efficiently.

- **Drawing and Visualization**
  - Uses HTML5 Canvas for rendering.
  - Draws the spiral and pieces in batches of N cells per animation frame (configurable batch size).
  - Batch size is adjustable via a sidebar control for performance tuning.
  - Responsive UI: drawing and calculation are asynchronous to avoid UI freezing.
  - Grid and piece details are shown for small spirals; for large spirals, a fast, filled rendering is used.

- **Controls and UI**
  - Sidebar for all controls:
    - Number of spiral positions
    - Piece type management (add, remove, edit, color, preset)
    - Start/Stop button with spinner for calculation
    - Reset and Save as PNG
    - Draw batch size input
    - Estimated image size and warnings for large spirals
  - Always-editable controls, even during calculation.
  - Color wells are prominent and accessible.

- **Export**
  - Save the current visualization as a PNG image.

- **Performance**
  - Placement and drawing are batched for responsiveness.
  - Spiral coordinates and attack deltas are cached.
  - Level-of-detail rendering for large spirals.

## Usage

1. Open `spiral-knights.html` in a modern browser.
2. Configure the number of spiral positions and piece types in the sidebar.
3. Click **Start** to begin visualization. The spiral will fill in real time.
4. Adjust the draw batch size for optimal performance on your device.
5. Save the result as a PNG if desired.

## File Structure

- `spiral-knights.html` — Main UI, sidebar, and canvas.
- `spiral-knights.js` — All logic for spiral generation, piece placement, attack checking, drawing, and UI event handling.
- `spiral-knights.css` — Styling for sidebar, controls, and canvas.

## Technical Notes

- No frameworks or build tools required; all logic is in plain HTML, JS, and CSS.
- All computation and rendering is client-side.
- Designed for experimentation with spiral chess arrangements and mythical piece types.

## Example

![Example Screenshot](screenshot.png)