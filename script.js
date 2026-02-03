const boardElement = document.getElementById("board");

/*
 Board representation:
 - Uppercase = White
 - Lowercase = Black
 - "" = Empty square
*/
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

// Function to draw the chessboard
function drawBoard() {
    boardElement.innerHTML = ""; // Clear old board

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {

            const square = document.createElement("div");
            square.classList.add("square");

            // Color logic
            const isWhiteSquare = (row + col) % 2 === 0;
            square.classList.add(isWhiteSquare ? "white-square" : "black-square");

            // Place piece (for now just letters)
            square.textContent = boardState[row][col];

            // Click detection
            square.addEventListener("click", () => {
                console.log(`Clicked square → Row: ${row}, Col: ${col}`);
            });

            boardElement.appendChild(square);
        }
    }
}

// Initial render
drawBoard();
