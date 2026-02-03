const boardElement = document.getElementById("board");

// ================= BOARD STATE =================
// Uppercase = White, Lowercase = Black, "" = Empty
const boardState = [
    ["r", "n", "b", "q", "k", "b", "n", "r"],
    ["p", "p", "p", "p", "p", "p", "p", "p"],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["P", "P", "P", "P", "P", "P", "P", "P"],
    ["R", "N", "B", "Q", "K", "B", "N", "R"]
];

let currentPlayer = "white";
let selectedSquare = null;
let lastMove = null;

// ================= CASTLING RIGHTS =================
let castlingRights = {
    whiteKingMoved: false,
    whiteRookAMoved: false,
    whiteRookHMoved: false,
    blackKingMoved: false,
    blackRookAMoved: false,
    blackRookHMoved: false
};

// ================= DRAW BOARD =================
function drawBoard() {
    boardElement.innerHTML = "";

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement("div");
            square.classList.add("square");

            const isWhiteSquare = (row + col) % 2 === 0;
            square.classList.add(isWhiteSquare ? "white-square" : "black-square");

            square.textContent = boardState[row][col];

            if (
                selectedSquare &&
                selectedSquare.row === row &&
                selectedSquare.col === col
            ) {
                square.style.outline = "3px solid red";
            }

            square.addEventListener("click", () => {
                handleSquareClick(row, col);
            });

            boardElement.appendChild(square);
        }
    }
}

// ================= CLICK HANDLING =================
function handleSquareClick(row, col) {
    const piece = boardState[row][col];

    if (!selectedSquare) {
        if (piece === "") return;
        if (isCurrentPlayerPiece(piece)) {
            selectedSquare = { row, col };
        }
    } else {
        // Clicking same square → deselect
        if (selectedSquare.row === row && selectedSquare.col === col) {
            selectedSquare = null;
            drawBoard();
            return;
        }

        // Clicking own piece → reselect
        if (piece !== "" && isCurrentPlayerPiece(piece)) {
            selectedSquare = { row, col };
        } else {
            const moves = getLegalMoves(
                selectedSquare.row,
                selectedSquare.col
            );

            const isLegal = moves.some(
                m => m.row === row && m.col === col
            );

            if (isLegal) {
                movePiece(
                    selectedSquare.row,
                    selectedSquare.col,
                    row,
                    col
                );
                selectedSquare = null;
                switchTurn();
            } else {
                selectedSquare = null;
            }
        }
    }

    drawBoard();
}

// ================= UTILITIES =================
function isCurrentPlayerPiece(piece) {
    return (
        (currentPlayer === "white" && piece === piece.toUpperCase()) ||
        (currentPlayer === "black" && piece === piece.toLowerCase())
    );
}

function isOpponentPiece(p1, p2) {
    return (
        (p1 === p1.toUpperCase() && p2 === p2.toLowerCase()) ||
        (p1 === p1.toLowerCase() && p2 === p2.toUpperCase())
    );
}

function switchTurn() {
    currentPlayer = currentPlayer === "white" ? "black" : "white";
    console.log("Turn:", currentPlayer);
}

// ================= MOVE EXECUTION =================
function movePiece(fr, fc, tr, tc) {
    const piece = boardState[fr][fc];

    // ----- CASTLING -----
    if (piece.toLowerCase() === "k" && Math.abs(fc - tc) === 2) {
        // King-side
        if (tc === 6) {
            boardState[tr][5] = boardState[tr][7];
            boardState[tr][7] = "";
        }
        // Queen-side
        if (tc === 2) {
            boardState[tr][3] = boardState[tr][0];
            boardState[tr][0] = "";
        }
    }

    // ----- EN PASSANT -----
    if (
        piece.toLowerCase() === "p" &&
        fc !== tc &&
        boardState[tr][tc] === ""
    ) {
        const direction = piece === piece.toUpperCase() ? 1 : -1;
        boardState[tr + direction][tc] = "";
    }

    // Move piece
    boardState[tr][tc] = piece;
    boardState[fr][fc] = "";

    // ----- UPDATE CASTLING RIGHTS -----
    if (piece === "K") castlingRights.whiteKingMoved = true;
    if (piece === "k") castlingRights.blackKingMoved = true;

    if (piece === "R" && fr === 7 && fc === 0) castlingRights.whiteRookAMoved = true;
    if (piece === "R" && fr === 7 && fc === 7) castlingRights.whiteRookHMoved = true;
    if (piece === "r" && fr === 0 && fc === 0) castlingRights.blackRookAMoved = true;
    if (piece === "r" && fr === 0 && fc === 7) castlingRights.blackRookHMoved = true;

    // Save last move (for en passant)
    lastMove = {
        piece,
        from: { row: fr, col: fc },
        to: { row: tr, col: tc }
    };
}

// ================= MOVE GENERATION =================
function getLegalMoves(row, col) {
    const piece = boardState[row][col];
    const moves = [];

    switch (piece.toLowerCase()) {
        case "p": pawnMoves(row, col, moves); break;
        case "r": rookMoves(row, col, moves); break;
        case "b": bishopMoves(row, col, moves); break;
        case "n": knightMoves(row, col, moves); break;
        case "q": queenMoves(row, col, moves); break;
        case "k": kingMoves(row, col, moves); break;
    }

    return moves;
}

// ================= PIECE LOGIC =================
function pawnMoves(row, col, moves) {
    const piece = boardState[row][col];
    const isWhite = piece === piece.toUpperCase();
    const direction = isWhite ? -1 : 1;
    const startRow = isWhite ? 6 : 1;

    // Single step
    if (boardState[row + direction]?.[col] === "") {
        moves.push({ row: row + direction, col });

        // Double step
        if (
            row === startRow &&
            boardState[row + 2 * direction]?.[col] === ""
        ) {
            moves.push({ row: row + 2 * direction, col });
        }
    }

    // Diagonal capture
    for (let dc of [-1, 1]) {
        const target = boardState[row + direction]?.[col + dc];
        if (target && target !== "" && isOpponentPiece(piece, target)) {
            moves.push({ row: row + direction, col: col + dc });
        }
    }

    // En passant
    if (lastMove && lastMove.piece.toLowerCase() === "p") {
        const { from, to } = lastMove;
        if (
            Math.abs(from.row - to.row) === 2 &&
            to.row === row &&
            Math.abs(to.col - col) === 1
        ) {
            moves.push({ row: row + direction, col: to.col });
        }
    }
}

function rookMoves(row, col, moves) {
    linearMoves(row, col, moves, [
        [-1, 0], [1, 0], [0, -1], [0, 1]
    ]);
}

function bishopMoves(row, col, moves) {
    linearMoves(row, col, moves, [
        [-1, -1], [-1, 1], [1, -1], [1, 1]
    ]);
}

function queenMoves(row, col, moves) {
    rookMoves(row, col, moves);
    bishopMoves(row, col, moves);
}

function knightMoves(row, col, moves) {
    const deltas = [
        [-2, -1], [-2, 1],
        [-1, -2], [-1, 2],
        [1, -2], [1, 2],
        [2, -1], [2, 1]
    ];

    for (let [dr, dc] of deltas) {
        const r = row + dr;
        const c = col + dc;
        if (
            boardState[r]?.[c] !== undefined &&
            (boardState[r][c] === "" ||
                isOpponentPiece(boardState[row][col], boardState[r][c]))
        ) {
            moves.push({ row: r, col: c });
        }
    }
}

function kingMoves(row, col, moves) {
    const piece = boardState[row][col];
    const isWhite = piece === piece.toUpperCase();

    // Normal moves
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const r = row + dr;
            const c = col + dc;
            if (
                boardState[r]?.[c] !== undefined &&
                (boardState[r][c] === "" ||
                    isOpponentPiece(piece, boardState[r][c]))
            ) {
                moves.push({ row: r, col: c });
            }
        }
    }

    // Castling
    if (isWhite && !castlingRights.whiteKingMoved) {
        // King-side
        if (
            !castlingRights.whiteRookHMoved &&
            boardState[7][5] === "" &&
            boardState[7][6] === ""
        ) {
            moves.push({ row: 7, col: 6 });
        }
        // Queen-side
        if (
            !castlingRights.whiteRookAMoved &&
            boardState[7][1] === "" &&
            boardState[7][2] === "" &&
            boardState[7][3] === ""
        ) {
            moves.push({ row: 7, col: 2 });
        }
    }

    if (!isWhite && !castlingRights.blackKingMoved) {
        // King-side
        if (
            !castlingRights.blackRookHMoved &&
            boardState[0][5] === "" &&
            boardState[0][6] === ""
        ) {
            moves.push({ row: 0, col: 6 });
        }
        // Queen-side
        if (
            !castlingRights.blackRookAMoved &&
            boardState[0][1] === "" &&
            boardState[0][2] === "" &&
            boardState[0][3] === ""
        ) {
            moves.push({ row: 0, col: 2 });
        }
    }
}

function linearMoves(row, col, moves, directions) {
    const piece = boardState[row][col];

    for (let [dr, dc] of directions) {
        let r = row + dr;
        let c = col + dc;

        while (boardState[r]?.[c] !== undefined) {
            if (boardState[r][c] === "") {
                moves.push({ row: r, col: c });
            } else {
                if (isOpponentPiece(piece, boardState[r][c])) {
                    moves.push({ row: r, col: c });
                }
                break;
            }
            r += dr;
            c += dc;
        }
    }
}

// Initial render
drawBoard();
