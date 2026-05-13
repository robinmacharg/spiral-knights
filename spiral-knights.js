// --- Utility Functions ---
function getSpiralCoords(n) {
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
// --- UI Functions ---
function renderPieceTypes() {
    pieceTypesDiv.innerHTML = "";
    pieceTypes.forEach((p, idx) => {
        const row = document.createElement("div");
        row.className = "piece-row";

        // Preset dropdown
        const presetSelect = document.createElement("select");
        PIECE_PRESETS.forEach(opt => {
            const option = document.createElement("option");
            option.value = opt.label;
            option.textContent = opt.label;
            if ((p.preset || p.name) === opt.label) option.selected = true;
            presetSelect.appendChild(option);
        });
        presetSelect.title = "Choose a mythical piece or Other";
        presetSelect.onchange = (e) => {
            const sel = PIECE_PRESETS.find(x => x.label === e.target.value);
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
        nameInput.disabled = (p.preset && p.preset !== "Other");
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
        hInput.disabled = (p.preset && p.preset !== "Other");
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
        vInput.disabled = (p.preset && p.preset !== "Other");
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
    // Compute max attack distance for bounding box
    let maxRange = 1;
    for (const p of pieceTypes) {
        maxRange = Math.max(maxRange, Math.abs(p.h), Math.abs(p.v));
    }
    let typeIdx = 0;
    let piecesPlaced = 0;
    // Prepare attacked sets for each type
    const attackedSets = pieceTypes.map(() => new Set());
    while (piecesPlaced < numPositions) {
        // Always search from the smallest unused position
        let found = false;
        for (let pos = 1; pos <= numPositions; ++pos) {
            if (used[pos - 1]) continue;
            const { x, y } = coords[pos - 1];
            // Check if attacked by any other type
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
            // Place piece
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
    }
    return placed;
}
// --- Drawing ---
function draw() {
    const coords = getSpiralCoords(numPositions);
    const { width, height } = estimateImageSize(coords, CELL_SIZE, MARGIN);
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2, height / 2);
    const showDetails = numPositions < 500;
    if (showDetails) {
        ctx.globalAlpha = 0.1;
        for (const { x, y } of coords) {
            ctx.beginPath();
            ctx.rect(
                x * CELL_SIZE - CELL_SIZE / 2,
                y * CELL_SIZE - CELL_SIZE / 2,
                CELL_SIZE,
                CELL_SIZE,
            );
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }
    for (const piece of placed) {
        const type = pieceTypes[piece.typeIdx];
        if (showDetails) {
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
            // Draw filled square, no gap
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
    ctx.restore();
}
// --- Event Handlers ---
numPositionsInput.oninput = (e) => {
    numPositions = Number(e.target.value);
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
    draw();
    saveBtn.disabled = true;
    // Async calculation with yield for UI responsiveness
    const coords = getSpiralCoords(numPositions);
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
            if (piecesPlaced % 100 === 0) {
                draw();
                await new Promise((r) => setTimeout(r, 0));
            }
            break;
        }
        if (!found) break;
    }
    setCalculating(false);
    running = true;
    draw();
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
// --- Initial Render ---
renderPieceTypes();
updateImageEstimate();
draw();
saveBtn.disabled = true;
resetBtn.disabled = true;
