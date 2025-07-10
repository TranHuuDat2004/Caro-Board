// --- Game Constants ---
const BOARD_SIZE = 20;
const WIN_LENGTH = 5;

// --- DOM Elements ---
const board = document.getElementById("board");
const results = document.querySelector("#results");
const playAgainBtn = document.querySelector("#play-again");
const turnBg = document.querySelector(".bg");
const menu = document.querySelector(".menu");
const gameContainer = document.querySelector(".game-container");
const pvpBtn = document.getElementById("pvp-btn");
const pvcXBtn = document.getElementById("pvc-x-btn");
const pvcOBtn = document.getElementById("pvc-o-btn");

// --- Game State Variables ---
let turn = "X";
let isGameOver = false;
let gameMode = "pvp";
let playerSymbol = "X";
let cpuSymbol = "O";
let boardState = [];

// --- Game Initialization ---
function createBoard() {
    board.innerHTML = "";
    board.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${BOARD_SIZE}, 1fr)`;
    document.documentElement.style.setProperty('--board-size', BOARD_SIZE);

    const totalCells = BOARD_SIZE * BOARD_SIZE;
    boardState = Array(totalCells).fill(null);

    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement("div");
        cell.classList.add("box");
        cell.dataset.index = i;
        cell.addEventListener("click", handleBoxClick);
        board.appendChild(cell);
    }
}

function startGame() {
    menu.classList.add("hide");
    gameContainer.classList.remove("hide");
    createBoard();
    resetGame();
}

pvpBtn.addEventListener("click", () => { gameMode = "pvp"; startGame(); });
pvcXBtn.addEventListener("click", () => { gameMode = "pvc"; playerSymbol = "X"; cpuSymbol = "O"; startGame(); });
pvcOBtn.addEventListener("click", () => { gameMode = "pvc"; playerSymbol = "O"; cpuSymbol = "X"; startGame(); });


// --- Main Game Logic ---
function handleBoxClick(e) {
    const index = parseInt(e.target.dataset.index);
    if (isGameOver || boardState[index] !== null) return;

    makeMove(index, turn);

    if (!isGameOver) {
        changeTurn();
        if (gameMode === "pvc" && turn === cpuSymbol) {
            board.classList.add("board-locked");
            setTimeout(cpuMove, 200);
        }
    }
}

function makeMove(index, symbol) {
    if (isGameOver || boardState[index] !== null) return;
    
    boardState[index] = symbol;
    board.children[index].innerHTML = symbol;

    if (checkWin(index, symbol)) {
        isGameOver = true;
        results.innerHTML = `${symbol} wins!`;
        playAgainBtn.style.display = "inline";
    } else if (boardState.every(cell => cell !== null)) {
        isGameOver = true;
        results.innerHTML = "It's a Draw!";
        playAgainBtn.style.display = "inline";
    }
}

function changeTurn() {
    turn = (turn === "X") ? "O" : "X";
    turnBg.style.left = (turn === "X") ? "0" : "85px";
}

// --- Winning Condition Logic ---
function checkWin(index, symbol, requiredLength = WIN_LENGTH) {
    const col = index % BOARD_SIZE;
    const row = Math.floor(index / BOARD_SIZE);
    const directions = [ {x:1, y:0}, {x:0, y:1}, {x:1, y:1}, {x:1, y:-1} ];

    for (const dir of directions) {
        let count = 1;
        for (let i = 1; i < requiredLength; i++) {
            const r = row + i * dir.y; const c = col + i * dir.x;
            if (isOutOfBounds(r, c) || boardState[r * BOARD_SIZE + c] !== symbol) break;
            count++;
        }
        for (let i = 1; i < requiredLength; i++) {
            const r = row - i * dir.y; const c = col - i * dir.x;
            if (isOutOfBounds(r, c) || boardState[r * BOARD_SIZE + c] !== symbol) break;
            count++;
        }

        if (count >= requiredLength) {
            if (requiredLength === WIN_LENGTH && !board.classList.contains("board-locked")) {
                highlightWinningCells(row, col, dir, symbol, requiredLength);
            }
            return true;
        }
    }
    return false;
}

function isOutOfBounds(row, col) {
    return row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE;
}

function highlightWinningCells(row, col, dir, symbol, length) {
    board.children[row * BOARD_SIZE + col].classList.add("winning-cell");
    for (let i = 1; i < length; i++) {
        const r = row + i * dir.y; const c = col + i * dir.x;
        if (isOutOfBounds(r, c) || boardState[r * BOARD_SIZE + c] !== symbol) break;
        board.children[r * BOARD_SIZE + c].classList.add("winning-cell");
    }
    for (let i = 1; i < length; i++) {
        const r = row - i * dir.y; const c = col - i * dir.x;
        if (isOutOfBounds(r, c) || boardState[r * BOARD_SIZE + c] !== symbol) break;
        board.children[r * BOARD_SIZE + c].classList.add("winning-cell");
    }
}

// --- AI LOGIC (ƯU TIÊN PHÒNG THỦ) ---
function cpuMove() {
    if (isGameOver) {
        board.classList.remove("board-locked");
        return;
    }
    const move = findBestMove();
    if (move !== -1) {
        makeMove(move, cpuSymbol);
    }
    if (!isGameOver) {
        changeTurn();
    }
    board.classList.remove("board-locked");
}

function findBestMove() {
    // <<< FIX: Thay đổi toàn bộ thứ tự ưu tiên của AI
    
    // Ưu tiên 1: PHÒNG THỦ TUYỆT ĐỐI - Chặn người chơi thắng ngay lập tức. Đây là điều bắt buộc.
    for (let i = 0; i < boardState.length; i++) {
        if (boardState[i] === null) {
            boardState[i] = playerSymbol;
            if (checkWin(i, playerSymbol, WIN_LENGTH)) { // Chặn đường 5
                boardState[i] = null;
                return i;
            }
            boardState[i] = null;
        }
    }

    // Ưu tiên 2: TẤN CÔNG - Nếu không phải phòng thủ, hãy tìm cách thắng ngay.
    for (let i = 0; i < boardState.length; i++) {
        if (boardState[i] === null) {
            boardState[i] = cpuSymbol;
            if (checkWin(i, cpuSymbol, WIN_LENGTH)) {
                boardState[i] = null;
                return i;
            }
            boardState[i] = null;
        }
    }

    // Ưu tiên 3: PHÒNG THỦ SỚM - Chặn các mối đe dọa nguy hiểm (đường 3, 4) của người chơi.
    const DANGEROUS_THREAT_LENGTH = 3;
    for (let i = 0; i < boardState.length; i++) {
        if (boardState[i] === null) {
            boardState[i] = playerSymbol;
            if (checkWin(i, playerSymbol, DANGEROUS_THREAT_LENGTH)) {
                boardState[i] = null;
                return i;
            }
            boardState[i] = null;
        }
    }
    
    // Ưu tiên 4: CHIẾN THUẬT - Đi vào vị trí gần các quân cờ đã có.
    const candidateMoves = findCandidateMoves();
    if (candidateMoves.length > 0) {
        return candidateMoves[Math.floor(Math.random() * candidateMoves.length)];
    }

    // Ưu tiên 5: DỰ PHÒNG - Đi ngẫu nhiên nếu không còn lựa chọn nào tốt hơn.
    const emptyCells = [];
    boardState.forEach((cell, index) => { if (cell === null) emptyCells.push(index); });
    if(emptyCells.length > 0) {
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    return -1;
}

// Helper cho AI: tìm các ô trống cạnh các ô đã được đánh
function findCandidateMoves() {
    const candidates = new Set();
    const directions = [
        {x: 0, y: 1}, {x: 0, y: -1}, {x: 1, y: 0}, {x: -1, y: 0},
        {x: 1, y: 1}, {x: 1, y: -1}, {x: -1, y: 1}, {x: -1, y: -1}
    ];

    for (let i = 0; i < boardState.length; i++) {
        if (boardState[i] !== null) {
            const row = Math.floor(i / BOARD_SIZE);
            const col = i % BOARD_SIZE;
            for (const dir of directions) {
                const nRow = row + dir.y;
                const nCol = col + dir.x;
                if (!isOutOfBounds(nRow, nCol)) {
                    const neighborIndex = nRow * BOARD_SIZE + nCol;
                    if (boardState[neighborIndex] === null) {
                        candidates.add(neighborIndex);
                    }
                }
            }
        }
    }
    return Array.from(candidates);
}

// --- Reset Logic ---
function resetGame() {
    isGameOver = false;
    turn = "X";
    turnBg.style.left = "0";
    results.innerHTML = "";
    playAgainBtn.style.display = "none";
    board.classList.remove("board-locked");

    boardState.fill(null);
    for (let i = 0; i < board.children.length; i++) {
        board.children[i].innerHTML = "";
        board.children[i].classList.remove("winning-cell");
    }

    if (gameMode === "pvc" && cpuSymbol === "X") {
        board.classList.add("board-locked");
        setTimeout(cpuMove, 200);
    }
}

playAgainBtn.addEventListener("click", resetGame);