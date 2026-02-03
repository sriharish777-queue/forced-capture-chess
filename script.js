const boardElement = document.getElementById("board");

// ================= BOARD STATE =================
const boardState = [
    ["r","n","b","q","k","b","n","r"],
    ["p","p","p","p","p","p","p","p"],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["P","P","P","P","P","P","P","P"],
    ["R","N","B","Q","K","B","N","R"]
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

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const sq = document.createElement("div");
            sq.classList.add("square");

            const isWhite = (r + c) % 2 === 0;
            sq.classList.add(isWhite ? "white-square" : "black-square");

            sq.textContent = boardState[r][c];

            if (selectedSquare &&
                selectedSquare.row === r &&
                selectedSquare.col === c) {
                sq.style.outline = "3px solid red";
            }

            sq.onclick = () => handleClick(r, c);
            boardElement.appendChild(sq);
        }
    }
}

// ================= CLICK HANDLER =================
function handleClick(row, col) {
    const piece = boardState[row][col];

    if (!selectedSquare) {
        if (piece === "" || !isCurrentPlayerPiece(piece)) return;

        const forced = getAllCaptureMoves();
        if (forced.length &&
            !forced.some(f => f.row === row && f.col === col)) return;

        selectedSquare = { row, col };
    } else {
        let moves = getLegalMoves(selectedSquare.row, selectedSquare.col);
        const forced = getAllCaptureMoves();

        if (forced.length) moves = moves.filter(m => m.isCapture);

        if (moves.some(m => m.row === row && m.col === col)) {
            movePiece(selectedSquare.row, selectedSquare.col, row, col);
            selectedSquare = null;
            currentPlayer = currentPlayer === "white" ? "black" : "white";
        } else {
            selectedSquare = null;
        }
    }
    drawBoard();
}

// ================= UTILITIES =================
function isCurrentPlayerPiece(p) {
    return (currentPlayer === "white" && p === p.toUpperCase()) ||
           (currentPlayer === "black" && p === p.toLowerCase());
}

function isOpponent(p1, p2) {
    return (p1 === p1.toUpperCase() && p2 === p2.toLowerCase()) ||
           (p1 === p1.toLowerCase() && p2 === p2.toUpperCase());
}

// ================= MOVE EXECUTION =================
function movePiece(fr, fc, tr, tc) {
    const piece = boardState[fr][fc];

    // CASTLING
    if (piece.toLowerCase() === "k" && Math.abs(fc - tc) === 2) {
        if (tc === 6) { boardState[tr][5] = boardState[tr][7]; boardState[tr][7] = ""; }
        if (tc === 2) { boardState[tr][3] = boardState[tr][0]; boardState[tr][0] = ""; }
    }

    // EN PASSANT
    if (piece.toLowerCase() === "p" && fc !== tc && boardState[tr][tc] === "") {
        const dir = piece === piece.toUpperCase() ? 1 : -1;
        boardState[tr + dir][tc] = "";
    }

    boardState[tr][tc] = piece;
    boardState[fr][fc] = "";

    // Update castling rights
    if (piece === "K") castlingRights.whiteKingMoved = true;
    if (piece === "k") castlingRights.blackKingMoved = true;
    if (piece === "R" && fr === 7 && fc === 0) castlingRights.whiteRookAMoved = true;
    if (piece === "R" && fr === 7 && fc === 7) castlingRights.whiteRookHMoved = true;
    if (piece === "r" && fr === 0 && fc === 0) castlingRights.blackRookAMoved = true;
    if (piece === "r" && fr === 0 && fc === 7) castlingRights.blackRookHMoved = true;

    lastMove = { piece, from: { row: fr, col: fc }, to: { row: tr, col: tc } };
}

// ================= MOVE GENERATION =================
function getLegalMoves(r, c) {
    const p = boardState[r][c];
    const m = [];
    switch (p.toLowerCase()) {
        case "p": pawnMoves(r, c, m); break;
        case "r": lineMoves(r, c, m, [[1,0],[-1,0],[0,1],[0,-1]]); break;
        case "b": lineMoves(r, c, m, [[1,1],[1,-1],[-1,1],[-1,-1]]); break;
        case "q": lineMoves(r, c, m, [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]); break;
        case "n": knightMoves(r, c, m); break;
        case "k": kingMoves(r, c, m); break;
    }
    return m;
}

// ================= FORCED CAPTURE =================
function getAllCaptureMoves() {
    const caps = [];
    for (let r=0;r<8;r++)
        for (let c=0;c<8;c++)
            if (boardState[r][c] && isCurrentPlayerPiece(boardState[r][c]))
                if (getLegalMoves(r,c).some(m=>m.isCapture))
                    caps.push({row:r,col:c});
    return caps;
}

// ================= PIECE RULES =================
function pawnMoves(r,c,m){
    const p=boardState[r][c],w=p===p.toUpperCase(),d=w?-1:1,s=w?6:1;
    if(boardState[r+d]?.[c]===""){
        m.push({row:r+d,col:c,isCapture:false});
        if(r===s&&boardState[r+2*d][c]==="")m.push({row:r+2*d,col:c,isCapture:false});
    }
    for(let dc of[-1,1]){
        const t=boardState[r+d]?.[c+dc];
        if(t&&isOpponent(p,t))m.push({row:r+d,col:c+dc,isCapture:true});
    }
    if(lastMove&&lastMove.piece.toLowerCase()==="p"&&
       Math.abs(lastMove.from.row-lastMove.to.row)===2&&
       lastMove.to.row===r&&Math.abs(lastMove.to.col-c)===1)
        m.push({row:r+d,col:lastMove.to.col,isCapture:true});
}

function knightMoves(r,c,m){
    for(let [dr,dc] of [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]]){
        const nr=r+dr,nc=c+dc;
        if(boardState[nr]?.[nc]!==undefined){
            const t=boardState[nr][nc];
            m.push({row:nr,col:nc,isCapture:t!==""&&isOpponent(boardState[r][c],t)});
        }
    }
}

function kingMoves(r, c, m) {
    const p = boardState[r][c];
    const isWhite = p === p.toUpperCase();

    // Normal king moves
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr, nc = c + dc;
            if (boardState[nr]?.[nc] !== undefined) {
                const t = boardState[nr][nc];
                m.push({
                    row: nr,
                    col: nc,
                    isCapture: t !== "" && isOpponent(p, t)
                });
            }
        }
    }

    // Castling (NO forced-capture check here)
    if (isWhite && !castlingRights.whiteKingMoved) {
        if (!castlingRights.whiteRookHMoved &&
            boardState[7][5] === "" && boardState[7][6] === "") {
            m.push({ row: 7, col: 6, isCapture: false });
        }
        if (!castlingRights.whiteRookAMoved &&
            boardState[7][1] === "" &&
            boardState[7][2] === "" &&
            boardState[7][3] === "") {
            m.push({ row: 7, col: 2, isCapture: false });
        }
    }

    if (!isWhite && !castlingRights.blackKingMoved) {
        if (!castlingRights.blackRookHMoved &&
            boardState[0][5] === "" && boardState[0][6] === "") {
            m.push({ row: 0, col: 6, isCapture: false });
        }
        if (!castlingRights.blackRookAMoved &&
            boardState[0][1] === "" &&
            boardState[0][2] === "" &&
            boardState[0][3] === "") {
            m.push({ row: 0, col: 2, isCapture: false });
        }
    }
}


function lineMoves(r,c,m,dirs){
    const p=boardState[r][c];
    for(let[dr,dc]of dirs){
        let nr=r+dr,nc=c+dc;
        while(boardState[nr]?.[nc]!==undefined){
            const t=boardState[nr][nc];
            if(t==="")m.push({row:nr,col:nc,isCapture:false});
            else{ if(isOpponent(p,t))m.push({row:nr,col:nc,isCapture:true}); break; }
            nr+=dr; nc+=dc;
        }
    }
}

// ================= START =================
drawBoard();
