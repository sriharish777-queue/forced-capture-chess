const boardElement = document.getElementById("board");

// Board representation
// Uppercase = White, Lowercase = Black, "" = empty
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

// GAME STATE
let currentPlayer = "white"; // white starts
let selectedSquare = null;   // { row, col }

// Draw the board
function drawBoard() {
    boardElement.innerHTML = "";

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement("div");
            square.classList.add("square");

            const isWhiteSquare = (row + col) % 2 === 0;
            square.classList.add(isWhiteSquare ? "white-square" : "black-square");

            square.textContent = boardState[row][col];

            // Highlight selected square
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

// Handle click logic
function handleSquareClick(row, col) {
    const piece = boardState[row][col];

    // If no piece selected yet
    if (!selectedSquare) {
        if (piece === "") return;

        // Check piece ownership
        if (currentPlayer === "white" && piece === piece.toUpperCase()) {
            selectedSquare = { row, col };
        } else if (currentPlayer === "black" && piece === piece.toLowerCase()) {
            selectedSquare = { row, col };
        } else {
            return;
        }
    }
    // If a piece is already selected
    else {
        movePiece(selectedSquare.row, selectedSquare.col, row, col);
        selectedSquare = null;
        switchTurn();
    }

    drawBoard();
}

// Move piece (no validation yet)
function movePiece(fromRow, fromCol, toRow, toCol) {
    boardState[toRow][toCol] = boardState[fromRow][fromCol];
    boardState[fromRow][fromCol] = "";
}

// Switch player turn
function switchTurn() {
    currentPlayer = currentPlayer === "white" ? "black" : "white";
    console.log("Turn:", currentPlayer);
}

// Initial render
drawBoard();
