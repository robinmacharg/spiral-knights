// --- Utility Functions ---
const spiralCoordsCache = {};
function getSpiralCoords(n) {
    if (spiralCoordsCache[n]) return spiralCoordsCache[n];
    const coords = [];
    let x = 0,
        y = 0,
        dx = 1,
        dy = 0,
        segmentLength = 1,
        segmentPassed = 0,
        segmentCount = 0;
    coords.push({ x, y });
    for (let i = 1; i < n; ++i) {
        x += dx;
        y += dy;
        coords.push({ x, y });
        segmentPassed++;
        if (segmentPassed === segmentLength) {
            segmentPassed = 0;
            // Turn right (anti-clockwise spiral)
            [dx, dy] = [dy, -dx];
            segmentCount++;
            if (segmentCount % 2 === 0) segmentLength++;
        }
    }
    spiralCoordsCache[n] = coords;
    return coords;
}
function getKnightMoves(h, v) {
    const moves = [];
    for (const [dx, dy] of [
        [h, v],
        [h, -v],
        [-h, v],
        [-h, -v],
        [v, h],
        [v, -h],
        [-v, h],
        [-v, -h],
    ]) {
        if (!(dx === 0 && dy === 0)) moves.push([dx, dy]);
    }
    return moves;
}
function estimateImageSize(coords, cellSize, margin) {
    let minX = 0,
        maxX = 0,
        minY = 0,
        maxY = 0;
    for (const { x, y } of coords) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    }
    const width = (maxX - minX + 1) * cellSize + 2 * margin;
    const height = (maxY - minY + 1) * cellSize + 2 * margin;
    return { width, height };
}
function getContrastYIQ(hexcolor) {
    hexcolor = hexcolor.replace("#", "");
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "#111" : "#fff";
}
function randomColor() {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
// --- Piece Presets ---
const PIECE_PRESETS = [
    { label: "Knight", name: "Knight", h: 1, v: 2 },
    { label: "Alfil (Elephant)", name: "Alfil", h: 2, v: 2 },
    { label: "Leaper (3-leaper)", name: "Leaper", h: 3, v: 0 },
    { label: "Antelope", name: "Antelope", h: 4, v: 3 },
    { label: "Dabbaba", name: "Dabbaba", h: 2, v: 0 },
    { label: "Wazir", name: "Wazir", h: 1, v: 0 },
    { label: "Zebra", name: "Zebra", h: 2, v: 3 },
    { label: "Fers", name: "Fers", h: 1, v: 1 },
    { label: "Other", name: "Other", h: 1, v: 2 },
];

const CELL_SIZE = 48;
const MARGIN = 32;
const MAX_WARN_SIZE = 2000;
let numPositions = 500;
let pieceTypes = [
    { name: "Knight", color: "#d32f2f", h: 1, v: 2, preset: "Knight" },
    { name: "Knight", color: "#222", h: 1, v: 2, preset: "Knight" },
];
let running = false;
let calculating = false;
let placed = [];
let drawBatchSize = 100;
// --- DOM Elements ---
const numPositionsInput = document.getElementById("numPositions");
numPositionsInput.value = numPositions;
const pieceTypesDiv = document.getElementById("pieceTypes");
const addPieceBtn = document.getElementById("addPiece");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const saveBtn = document.getElementById("saveBtn");
const warnDiv = document.getElementById("warn");
const imgSizeDiv = document.getElementById("imgSize");
const canvas = document.getElementById("canvas");
const batchSizeInput = document.getElementById("batchSize");
if (batchSizeInput) {
    batchSizeInput.value = drawBatchSize;
    batchSizeInput.oninput = (e) => {
        drawBatchSize = Math.max(1, Number(e.target.value));
        draw();
    };
}
// --- UI Functions ---
function renderPieceTypes() {
    pieceTypesDiv.innerHTML = "";
    pieceTypes.forEach((p, idx) => {
        const row = document.createElement("div");
        row.className = "piece-row";

        // Preset dropdown
        const presetSelect = document.createElement("select");
        PIECE_PRESETS.forEach((opt) => {
            const option = document.createElement("option");
            option.value = opt.label;
            option.textContent = opt.label;
            if ((p.preset || p.name) === opt.label) option.selected = true;
            presetSelect.appendChild(option);
        });
        presetSelect.title = "Choose a mythical piece or Other";
        presetSelect.onchange = (e) => {
            const sel = PIECE_PRESETS.find((x) => x.label === e.target.value);
            pieceTypes[idx].preset = sel.label;
            pieceTypes[idx].name = sel.name;
            pieceTypes[idx].h = sel.h;
            pieceTypes[idx].v = sel.v;
            renderPieceTypes();
            draw();
        };
        row.appendChild(presetSelect);

        // Color
        const colorLabel = document.createElement("label");
        colorLabel.style.display = "flex";
        colorLabel.style.alignItems = "center";
        colorLabel.style.gap = "4px";
        colorLabel.title = "Piece color";
        colorLabel.innerHTML = '<span style="font-size:13px;color:#444;">Color:</span>';
        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.value = p.color;
        colorInput.disabled = false;
        colorInput.title = "Piece color";
        colorInput.oninput = (e) => {
            pieceTypes[idx].color = e.target.value;
            draw(); // Update board immediately
        };
        colorLabel.appendChild(colorInput);
        row.appendChild(colorLabel);

        // Name
        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.value = p.name;
        nameInput.disabled = p.preset && p.preset !== "Other";
        nameInput.title = "Piece name";
        nameInput.oninput = (e) => {
            pieceTypes[idx].name = e.target.value;
        };
        row.appendChild(nameInput);

        // H and V controls in a sub-container for better wrapping
        const hvContainer = document.createElement("span");
        hvContainer.style.display = "flex";
        hvContainer.style.alignItems = "center";
        hvContainer.style.gap = "4px";
        hvContainer.style.flexWrap = "wrap";

        const hLabel = document.createElement("span");
        hLabel.textContent = "H:";
        hvContainer.appendChild(hLabel);
        const hInput = document.createElement("input");
        hInput.type = "number";
        hInput.value = p.h;
        hInput.min = 0;
        hInput.max = 10;
        hInput.disabled = p.preset && p.preset !== "Other";
        hInput.title = "Horizontal component";
        hInput.oninput = (e) => {
            pieceTypes[idx].h = Number(e.target.value);
        };
        hvContainer.appendChild(hInput);

        const vLabel = document.createElement("span");
        vLabel.textContent = "V:";
        hvContainer.appendChild(vLabel);
        const vInput = document.createElement("input");
        vInput.type = "number";
        vInput.value = p.v;
        vInput.min = 0;
        vInput.max = 10;
        vInput.disabled = p.preset && p.preset !== "Other";
        vInput.title = "Vertical component";
        vInput.oninput = (e) => {
            pieceTypes[idx].v = Number(e.target.value);
        };
        hvContainer.appendChild(vInput);

        row.appendChild(hvContainer);

        // Remove
        const removeBtn = document.createElement("button");
        removeBtn.textContent = "×";
        removeBtn.title = "Remove piece";
        removeBtn.disabled = pieceTypes.length <= 1;
        removeBtn.onclick = () => {
            if (pieceTypes.length > 1) {
                pieceTypes.splice(idx, 1);
                renderPieceTypes();
            }
        };
        row.appendChild(removeBtn);
        pieceTypesDiv.appendChild(row);
    });

    // Re-attach addPieceBtn handler after render
    const addPieceBtn = document.getElementById("addPiece");
    if (addPieceBtn) {
        addPieceBtn.onclick = function () {
            pieceTypes.push({
                name: "Other",
                color: randomColor(),
                h: 1,
                v: 2,
                preset: "Other",
            });
            renderPieceTypes();
        };
    }
    warnDiv.textContent = "";
}
// --- Placement Logic ---
function placePieces(numPositions, pieceTypes) {
    const coords = getSpiralCoords(numPositions);
    const placed = [];
    const typePlaced = pieceTypes.map(() => []);
    const used = new Array(numPositions).fill(false);
    // Precompute attack deltas for each piece type
    const attackDeltas = pieceTypes.map((pt) => getKnightMoves(pt.h, pt.v));
    // Check if piece types overlap (i.e., any two types have the same h/v)
    let typesOverlap = false;
    for (let i = 0; i < pieceTypes.length; ++i) {
        for (let j = i + 1; j < pieceTypes.length; ++j) {
            if (
                (pieceTypes[i].h === pieceTypes[j].h && pieceTypes[i].v === pieceTypes[j].v) ||
                (pieceTypes[i].h === pieceTypes[j].v && pieceTypes[i].v === pieceTypes[j].h)
            ) {
                typesOverlap = true;
                break;
            }
        }
        if (typesOverlap) break;
    }
    // Use a single attacked set if types don't overlap, else per-type
    const attackedSet = new Set();
    const attackedSets = typesOverlap ? pieceTypes.map(() => new Set()) : null;
    let typeIdx = 0;
    let piecesPlaced = 0;
    while (piecesPlaced < numPositions) {
        let found = false;
        for (let pos = 1; pos <= numPositions; ++pos) {
            if (used[pos - 1]) continue;
            const { x, y } = coords[pos - 1];
            let attacked = false;
            if (!typesOverlap) {
                // Single attacked set
                if (attackedSet.has(`${x},${y}`)) attacked = true;
            } else {
                // Per-type attacked sets
                for (let otherType = 0; otherType < pieceTypes.length; ++otherType) {
                    if (otherType === typeIdx) continue;
                    const key = `${x},${y}`;
                    if (attackedSets[otherType].has(key)) {
                        attacked = true;
                        break;
                    }
                }
            }
            if (attacked) continue;
            // Place piece
            placed.push({ pos, x, y, typeIdx });
            typePlaced[typeIdx].push({ x, y });
            used[pos - 1] = true;
            piecesPlaced++;
            // Update attacked set(s)
            const moves = attackDeltas[typeIdx];
            if (!typesOverlap) {
                for (const [dx, dy] of moves) {
                    const ax = x + dx;
                    const ay = y + dy;
                    attackedSet.add(`${ax},${ay}`);
                }
            } else {
                for (const [dx, dy] of moves) {
                    const ax = x + dx;
                    const ay = y + dy;
                    attackedSets[typeIdx].add(`${ax},${ay}`);
                }
            }
            typeIdx = (typeIdx + 1) % pieceTypes.length;
            found = true;
            break;
        }
        if (!found) break;
    }
    return placed;
}
// --- Drawing ---
// --- Canvas Drawing Helpers ---
let drawState = {
    width: 0,
    height: 0,
    showDetails: false,
    coords: [],
    ctx: null,
};

function initCanvas() {
    drawState.coords = getSpiralCoords(numPositions);
    const { width, height } = estimateImageSize(drawState.coords, CELL_SIZE, MARGIN);
    drawState.width = width;
    drawState.height = height;
    canvas.width = width;
    canvas.height = height;
    drawState.ctx = canvas.getContext("2d");
    drawState.ctx.clearRect(0, 0, width, height);
    drawState.ctx.save();
    drawState.ctx.translate(width / 2, height / 2);
    drawState.showDetails = numPositions < 500;
    // Draw grid once if needed
    if (drawState.showDetails) {
        drawState.ctx.globalAlpha = 0.1;
        for (const { x, y } of drawState.coords) {
            drawState.ctx.beginPath();
            drawState.ctx.rect(
                x * CELL_SIZE - CELL_SIZE / 2,
                y * CELL_SIZE - CELL_SIZE / 2,
                CELL_SIZE,
                CELL_SIZE,
            );
            drawState.ctx.stroke();
        }
        drawState.ctx.globalAlpha = 1;
    }
}

// Draw only new pieces from [from, to)
function drawIncremental(from, to) {
    const ctx = drawState.ctx;
    if (!ctx) return;
    for (let i = from; i < to && i < placed.length; ++i) {
        const piece = placed[i];
        const type = pieceTypes[piece.typeIdx];
        if (drawState.showDetails) {
            ctx.beginPath();
            ctx.arc(piece.x * CELL_SIZE, piece.y * CELL_SIZE, CELL_SIZE * 0.4, 0, 2 * Math.PI);
            ctx.fillStyle = type.color;
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#333";
            ctx.stroke();
            ctx.fillStyle = getContrastYIQ(type.color);
            ctx.font = `bold ${CELL_SIZE * 0.4}px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(String(piece.pos), piece.x * CELL_SIZE, piece.y * CELL_SIZE);
        } else {
            ctx.beginPath();
            ctx.rect(
                piece.x * CELL_SIZE - CELL_SIZE / 2,
                piece.y * CELL_SIZE - CELL_SIZE / 2,
                CELL_SIZE,
                CELL_SIZE,
            );
            ctx.fillStyle = type.color;
            ctx.fill();
        }
    }
}

// Redraw everything (for UI changes)
function drawAll() {
    initCanvas();
    drawIncremental(0, placed.length);
    drawState.ctx.restore();
}
// --- Event Handlers ---
numPositionsInput.oninput = (e) => {
    numPositions = Number(e.target.value);
    updateUrlFromState();
    updateImageEstimate();
};
addPieceBtn.onclick = function () {
    pieceTypes.push({
        name: "Other",
        color: randomColor(),
        h: 1,
        v: 2,
        preset: "Other",
    });
    updateUrlFromState();
    renderPieceTypes();
};
let stopRequested = false;
function setCalculating(state) {
    calculating = state;
    renderStartStop();
}
function renderStartStop() {
    if (calculating) {
        startBtn.innerHTML = '<span class="spinner"></span> Stop';
    } else {
        startBtn.textContent = "Start";
    }
}
// Spinner CSS
if (!document.getElementById("spinner-style")) {
    const style = document.createElement("style");
    style.id = "spinner-style";
    style.textContent = `.spinner { display:inline-block; width:16px; height:16px; border:2px solid #bbb; border-top:2px solid #333; border-radius:50%; animation:spin 1s linear infinite; vertical-align:middle; margin-right:6px; } @keyframes spin { 100% { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
}
startBtn.onclick = async () => {
    if (calculating) {
        stopRequested = true;
        return;
    }
    stopRequested = false;
    setCalculating(true);
    placed = [];
    running = true;
    renderPieceTypes();
    saveBtn.disabled = true;
    // Initialize canvas ONCE for this run
    initCanvas();
    // Async calculation with yield for UI responsiveness
    const coords = drawState.coords;
    const typePlaced = pieceTypes.map(() => []);
    const used = new Array(numPositions).fill(false);
    let maxRange = 1;
    for (const p of pieceTypes) {
        maxRange = Math.max(maxRange, Math.abs(p.h), Math.abs(p.v));
    }
    let typeIdx = 0;
    let piecesPlaced = 0;
    const attackedSets = pieceTypes.map(() => new Set());
    while (piecesPlaced < numPositions && !stopRequested) {
        let found = false;
        for (let pos = 1; pos <= numPositions; ++pos) {
            if (used[pos - 1]) continue;
            const { x, y } = coords[pos - 1];
            let attacked = false;
            for (let otherType = 0; otherType < pieceTypes.length; ++otherType) {
                if (otherType === typeIdx) continue;
                const key = `${x},${y}`;
                if (attackedSets[otherType].has(key)) {
                    attacked = true;
                    break;
                }
            }
            if (attacked) continue;
            placed.push({ pos, x, y, typeIdx });
            typePlaced[typeIdx].push({ x, y });
            used[pos - 1] = true;
            piecesPlaced++;
            // Update attacked set for this type
            const moves = getKnightMoves(pieceTypes[typeIdx].h, pieceTypes[typeIdx].v);
            for (const [dx, dy] of moves) {
                const ax = x + dx;
                const ay = y + dy;
                attackedSets[typeIdx].add(`${ax},${ay}`);
            }
            typeIdx = (typeIdx + 1) % pieceTypes.length;
            found = true;
            break;
        }
        if (!found) break;
        // Draw incrementally every drawBatchSize placements
        if (piecesPlaced % drawBatchSize === 0 || piecesPlaced === numPositions) {
            drawIncremental(piecesPlaced - drawBatchSize, piecesPlaced);
            await new Promise((r) => setTimeout(r, 0));
        }
    }
    setCalculating(false);
    running = true;
    drawAll();
    saveBtn.disabled = placed.length === 0;
};
resetBtn.onclick = () => {
    placed = [];
    running = false;
    setCalculating(false);
    renderPieceTypes();
    draw();
    saveBtn.disabled = true;
};
saveBtn.onclick = () => {
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `spiral-knights.png`;
    a.click();
};
// --- URL Config Serialization ---
function getConfigFromState() {
    return {
        numPositions,
        drawBatchSize,
        pieceTypes: pieceTypes.map(p => ({
            name: p.name,
            color: p.color,
            h: p.h,
            v: p.v,
            preset: p.preset || null,
        })),
    };
}

function setStateFromConfig(config) {
    if (typeof config.numPositions === 'number') {
        numPositions = config.numPositions;
        numPositionsInput.value = numPositions;
    }
    if (typeof config.drawBatchSize === 'number') {
        drawBatchSize = config.drawBatchSize;
        if (batchSizeInput) batchSizeInput.value = drawBatchSize;
    }
    if (Array.isArray(config.pieceTypes) && config.pieceTypes.length > 0) {
        pieceTypes = config.pieceTypes.map(pt => ({
            name: pt.name,
            color: pt.color,
            h: pt.h,
            v: pt.v,
            preset: pt.preset || null,
        }));
    }
    renderPieceTypes();
    updateImageEstimate && updateImageEstimate();
    drawAll && drawAll();
}

function encodeConfig(config) {
    return encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(config)))));
}
function decodeConfig(str) {
    try {
        return JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(str)))));
    } catch (e) {
        return null;
    }
}

function updateUrlFromState() {
    const config = getConfigFromState();
    const encoded = encodeConfig(config);
    const url = new URL(window.location);
    url.searchParams.set('config', encoded);
    window.history.replaceState({}, '', url);
}

function loadConfigFromUrl() {
    const url = new URL(window.location);
    const encoded = url.searchParams.get('config');
    if (encoded) {
        const config = decodeConfig(encoded);
        if (config) setStateFromConfig(config);
    }
}

// --- Patch event handlers to update URL ---
const origRenderPieceTypes = renderPieceTypes;
renderPieceTypes = function() {
    origRenderPieceTypes();
    // Patch all piece type controls to update URL
    document.querySelectorAll('.piece-row').forEach((row, idx) => {
        const selects = row.querySelectorAll('select');
        selects.forEach(sel => {
            sel.onchange = (e) => {
                const preset = PIECE_PRESETS.find(x => x.label === e.target.value);
                pieceTypes[idx].preset = preset.label;
                pieceTypes[idx].name = preset.name;
                pieceTypes[idx].h = preset.h;
                pieceTypes[idx].v = preset.v;
                updateUrlFromState();
                renderPieceTypes();
                drawAll();
            };
        });
        const colorInput = row.querySelector('input[type="color"]');
        if (colorInput) colorInput.oninput = (e) => {
            pieceTypes[idx].color = e.target.value;
            updateUrlFromState();
            drawAll();
        };
        const nameInput = row.querySelector('input[type="text"]');
        if (nameInput) nameInput.oninput = (e) => {
            pieceTypes[idx].name = e.target.value;
            updateUrlFromState();
        };
        const hInput = row.querySelectorAll('input[type="number"]')[0];
        if (hInput) hInput.oninput = (e) => {
            pieceTypes[idx].h = Number(e.target.value);
            updateUrlFromState();
        };
        const vInput = row.querySelectorAll('input[type="number"]')[1];
        if (vInput) vInput.oninput = (e) => {
            pieceTypes[idx].v = Number(e.target.value);
            updateUrlFromState();
        };
        const removeBtn = row.querySelector('button');
        if (removeBtn) removeBtn.onclick = () => {
            if (pieceTypes.length > 1) {
                pieceTypes.splice(idx, 1);
                updateUrlFromState();
                renderPieceTypes();
            }
        };
    });
    // Update URL after every render (for add/remove)
    updateUrlFromState();
};
numPositionsInput.oninput = (e) => {
    numPositions = Number(e.target.value);
    updateUrlFromState();
    updateImageEstimate();
};
if (batchSizeInput) {
    batchSizeInput.value = drawBatchSize;
    batchSizeInput.oninput = (e) => {
        drawBatchSize = Math.max(1, Number(e.target.value));
        updateUrlFromState();
        drawAll();
    };
}
addPieceBtn.onclick = function () {
    pieceTypes.push({
        name: "Other",
        color: randomColor(),
        h: 1,
        v: 2,
        preset: "Other",
    });
    updateUrlFromState();
    renderPieceTypes();
};

// --- Initial Render ---
loadConfigFromUrl();
renderPieceTypes();
updateImageEstimate();
drawAll();
saveBtn.disabled = true;
resetBtn.disabled = true;
