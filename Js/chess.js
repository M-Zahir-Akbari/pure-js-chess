/* ----------------- INITIAL BOARD ----------------- */
let board = [
    ["r", "n", "b", "q", "k", "b", "n", "r"],
    ["p", "p", "p", "p", "p", "p", "p", "p"],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["P", "P", "P", "P", "P", "P", "P", "P"],
    ["R", "N", "B", "Q", "K", "B", "N", "R"],
];

const pieces = {
    r: "♜",
    n: "♞",
    b: "♝",
    q: "♛",
    k: "♚",
    p: "♟",
    R: "♖",
    N: "♘",
    B: "♗",
    Q: "♕",
    K: "♔",
    P: "♙",
};

const boardEl = document.getElementById("board");
const turnEl = document.getElementById("turn");
const statusEl = document.getElementById("status");

let turn = "white";
let selected = null;
let halfMoveClock = 0;
let gameOver = false;

/* ----------------- HELPERS ----------------- */
const cloneBoard = (b) => b.map((r) => r.slice());
const isWhite = (p) => p && p === p.toUpperCase();
const other = (c) => (c === "white" ? "black" : "white");

function findKing(b, color) {
    const k = color === "white" ? "K" : "k";
    for (let r = 0; r < 8; r++)
        for (let c = 0; c < 8; c++)
            if (b[r][c] === k) return { r, c };
    return null;
}

function inBounds(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
}

/* ----------------- ATTACK / CHECK LOGIC ----------------- */
function clearPath(b, f, t) {
    const rs = Math.sign(t.r - f.r),
        cs = Math.sign(t.c - f.c);

    let r = f.r + rs,
        c = f.c + cs;

    while (r !== t.r || c !== t.c) {
        if (b[r][c]) return false;
        r += rs;
        c += cs;
    }
    return true;
}

function canAttack(b, f, t) {
    const p = b[f.r][f.c];
    if (!p) return false;

    const pw = p.toLowerCase(),
        w = isWhite(p),
        rd = Math.abs(f.r - t.r),
        cd = Math.abs(f.c - t.c);

    if (pw === "p") {
        const dir = w ? -1 : 1;
        return t.r === f.r + dir && Math.abs(cd) === 1;
    }

    if (pw === "n") return (rd === 2 && cd === 1) || (rd === 1 && cd === 2);
    if (pw === "b") return rd === cd && clearPath(b, f, t);
    if (pw === "r") return (rd === 0 || cd === 0) && clearPath(b, f, t);
    if (pw === "q")
        return (rd === cd || rd === 0 || cd === 0) && clearPath(b, f, t);
    if (pw === "k") return rd <= 1 && cd <= 1;

    return false;
}

function squareAttacked(b, r, c, byColor) {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const p = b[i][j];
            if (!p) continue;
            if ((byColor === "white") !== isWhite(p)) continue;
            if (canAttack(b, { r: i, c: j }, { r, c })) return true;
        }
    }
    return false;
}

function inCheck(b, color) {
    const kp = findKing(b, color);
    return squareAttacked(b, kp.r, kp.c, other(color));
}

/* ----------------- MOVE VALIDATION ----------------- */
function validBasic(b, f, t) {
    if (!inBounds(f.r, f.c) || !inBounds(t.r, t.c)) return false;

    const p = b[f.r][f.c];
    if (!p) return false;

    const target = b[t.r][t.c];
    if (target && isWhite(target) === isWhite(p)) return false;

    const rd = Math.abs(f.r - t.r),
        cd = Math.abs(f.c - t.c),
        pw = p.toLowerCase(),
        w = isWhite(p);

    if (pw === "p") {
        const dir = w ? -1 : 1,
            start = w ? 6 : 1;

        if (cd === 0 && !target) {
            if (t.r === f.r + dir) return true;
            if (f.r === start && t.r === f.r + 2 * dir && !b[f.r + dir][f.c])
                return true;
        }
        if (cd === 1 && t.r === f.r + dir && target) return true;

        return false;
    }

    if (pw === "n") return (rd === 2 && cd === 1) || (rd === 1 && cd === 2);
    if (pw === "b") return rd === cd && clearPath(b, f, t);
    if (pw === "r") return (rd === 0 || cd === 0) && clearPath(b, f, t);
    if (pw === "q")
        return (rd === cd || rd === 0 || cd === 0) && clearPath(b, f, t);
    if (pw === "k") return rd <= 1 && cd <= 1;

    return false;
}

/* ----------------- CHECKMATE ----------------- */
function hasLegalMove(color) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (!p || (color === "white") !== isWhite(p)) continue;

            for (let tr = 0; tr < 8; tr++) {
                for (let tc = 0; tc < 8; tc++) {
                    if (!validBasic(board, { r, c }, { r: tr, c: tc })) continue;

                    const b2 = cloneBoard(board);
                    b2[tr][tc] = b2[r][c];
                    b2[r][c] = "";

                    if (!inCheck(b2, color)) return true;
                }
            }
        }
    }
    return false;
}

/* ----------------- RENDER ----------------- */
function draw() {
    boardEl.innerHTML = "";
    const whiteCheck = inCheck(board, "white");
    const blackCheck = inCheck(board, "black");

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const sq = document.createElement("div");
            sq.dataset.r = r;
            sq.dataset.c = c;

            sq.className = `
        w-16 h-16 flex items-center justify-center text-3xl cursor-pointer
        ${(r + c) % 2 === 0 ? "bg-[#f0d9b5]" : "bg-[#b58863]"}
      `;

            const p = board[r][c];
            sq.textContent = pieces[p] || "";

            if (p) {
                if (isWhite(p)) sq.classList.add("white-piece");
                else sq.classList.add("black-piece");
            }

            if ((p === "K" && whiteCheck) || (p === "k" && blackCheck)) {
                sq.classList.add("ring-4", "ring-red-500");
            }
            if (selected && selected.r === r && selected.c === c) {
                sq.classList.add("ring-4", "ring-yellow-400");
            }

            sq.onclick = onClick;
            boardEl.appendChild(sq);
        }
    }

    if (gameOver) return;

    if (inCheck(board, turn) && !hasLegalMove(turn)) {
        statusEl.textContent = "Checkmate! " + other(turn) + " wins";
        gameOver = true;
    } else if (halfMoveClock >= 50) {
        statusEl.textContent = "Draw by 50-move rule";
        gameOver = true;
    } else if (inCheck(board, turn)) {
        statusEl.textContent = "Check!";
    } else {
        statusEl.textContent = "";
    }

    turnEl.textContent = "Turn: " + (turn === "white" ? "White" : "Black");
}

/* ----------------- PROMOTION ----------------- */
function promote(r, c) {
    const white = board[r][c] === "P";
    let ch = prompt("Promote to (Q,R,B,N)", "Q");

    if (!ch) ch = "Q";
    ch = ch.toUpperCase();
    if (!["Q", "R", "B", "N"].includes(ch)) ch = "Q";

    board[r][c] = white ? ch : ch.toLowerCase();
}

/* ----------------- CLICK HANDLER ----------------- */
function onClick(e) {
    if (gameOver) return;

    const r = +e.currentTarget.dataset.r;
    const c = +e.currentTarget.dataset.c;
    const piece = board[r][c];

    if (!selected) {
        if (!piece) return;
        if ((turn === "white") !== isWhite(piece)) return;
        selected = { r, c };
        draw();
        return;
    }

    const from = selected,
        to = { r, c };

    selected = null;

    if (!validBasic(board, from, to)) {
        draw();
        return;
    }

    const test = cloneBoard(board);
    test[to.r][to.c] = test[from.r][from.c];
    test[from.r][from.c] = "";

    if (inCheck(test, turn)) {
        alert("Illegal move – king in check");
        draw();
        return;
    }

    const wasCapture = !!board[to.r][to.c];

    board[to.r][to.c] = board[from.r][from.c];
    board[from.r][from.c] = "";

    if (wasCapture || board[to.r][to.c].toLowerCase() === "p") halfMoveClock = 0;
    else halfMoveClock++;

    if (board[to.r][to.c] === "P" && to.r === 0) promote(to.r, to.c);
    if (board[to.r][to.c] === "p" && to.r === 7) promote(to.r, to.c);

    turn = other(turn);
    draw();
}

/* ----------------- START ----------------- */
draw();
