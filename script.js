const boardElement = document.getElementById("board");

/* ================= GAME STATE ================= */
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

/* ================= TIMER ================= */
let timeLeft = 10;
let timerInterval = null;

/* ================= CASTLING RIGHTS ================= */
let castlingRights = {
  whiteKingMoved:false, whiteRookAMoved:false, whiteRookHMoved:false,
  blackKingMoved:false, blackRookAMoved:false, blackRookHMoved:false
};

/* ================= DRAW BOARD ================= */
function drawBoard() {
  boardElement.innerHTML = "";
  for (let r=0;r<8;r++) {
    for (let c=0;c<8;c++) {
      const sq = document.createElement("div");
      sq.className = "square " + ((r+c)%2===0 ? "white-square":"black-square");
      sq.textContent = boardState[r][c];
      if (selectedSquare && selectedSquare.row===r && selectedSquare.col===c)
        sq.style.outline="3px solid red";
      sq.onclick = () => handleClick(r,c);
      boardElement.appendChild(sq);
    }
  }
}

/* ================= CLICK HANDLER ================= */
function handleClick(row,col){
  const piece = boardState[row][col];

  if(!selectedSquare){
    if(piece==="" || !isCurrentPlayerPiece(piece)) return;

    const forced = getAllCaptureMoves();
    if(forced.length && !forced.some(f=>f.row===row && f.col===col)) return;

    selectedSquare={row,col};
  } else {
    let moves = getLegalMoves(selectedSquare.row, selectedSquare.col);
    if(getAllCaptureMoves().length) moves = moves.filter(m=>m.isCapture);

    if(moves.some(m=>m.row===row && m.col===col)){
      movePiece(selectedSquare.row, selectedSquare.col, row, col);
      selectedSquare=null;
      currentPlayer = currentPlayer==="white" ? "black":"white";
      startTimer();
    } else selectedSquare=null;
  }
  drawBoard();
}

/* ================= TIMER LOGIC ================= */
function startTimer(){
  clearInterval(timerInterval);
  timeLeft=10;
  updateTimerUI();

  timerInterval=setInterval(()=>{
    timeLeft--;
    updateTimerUI();
    if(timeLeft<=0){
      clearInterval(timerInterval);
      alert(`${currentPlayer.toUpperCase()} LOSES ON TIME`);
      disableBoard();
    }
  },1000);
}

function updateTimerUI(){
  document.getElementById("timeLeft").textContent=timeLeft;
  document.getElementById("turnLabel").textContent=
    currentPlayer.charAt(0).toUpperCase()+currentPlayer.slice(1);
}

function disableBoard(){
  document.querySelectorAll(".square").forEach(s=>s.style.pointerEvents="none");
}

/* ================= UTILITIES ================= */
function isCurrentPlayerPiece(p){
  return (currentPlayer==="white" && p===p.toUpperCase()) ||
         (currentPlayer==="black" && p===p.toLowerCase());
}
function isOpponent(a,b){
  return (a===a.toUpperCase() && b===b.toLowerCase()) ||
         (a===a.toLowerCase() && b===b.toUpperCase());
}

/* ================= MOVE EXECUTION ================= */
function movePiece(fr,fc,tr,tc){
  const p=boardState[fr][fc];

  // Castling
  if(p.toLowerCase()==="k" && Math.abs(fc-tc)===2){
    if(tc===6){ boardState[tr][5]=boardState[tr][7]; boardState[tr][7]=""; }
    if(tc===2){ boardState[tr][3]=boardState[tr][0]; boardState[tr][0]=""; }
  }

  // En passant
  if(p.toLowerCase()==="p" && fc!==tc && boardState[tr][tc]===""){
    const dir=p===p.toUpperCase()?1:-1;
    boardState[tr+dir][tc]="";
  }

  boardState[tr][tc]=p;
  boardState[fr][fc]="";

  if(p==="K") castlingRights.whiteKingMoved=true;
  if(p==="k") castlingRights.blackKingMoved=true;
  if(p==="R"&&fr===7&&fc===0) castlingRights.whiteRookAMoved=true;
  if(p==="R"&&fr===7&&fc===7) castlingRights.whiteRookHMoved=true;
  if(p==="r"&&fr===0&&fc===0) castlingRights.blackRookAMoved=true;
  if(p==="r"&&fr===0&&fc===7) castlingRights.blackRookHMoved=true;

  lastMove={piece:p,from:{row:fr,col:fc},to:{row:tr,col:tc}};
}

/* ================= MOVE GENERATION ================= */
function getLegalMoves(r,c){
  const p=boardState[r][c], m=[];
  switch(p.toLowerCase()){
    case "p": pawnMoves(r,c,m); break;
    case "r": lineMoves(r,c,m,[[1,0],[-1,0],[0,1],[0,-1]]); break;
    case "b": lineMoves(r,c,m,[[1,1],[1,-1],[-1,1],[-1,-1]]); break;
    case "q": lineMoves(r,c,m,[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]); break;
    case "n": knightMoves(r,c,m); break;
    case "k": kingMoves(r,c,m); break;
  }
  return m;
}

function getAllCaptureMoves(){
  const res=[];
  for(let r=0;r<8;r++)for(let c=0;c<8;c++)
    if(boardState[r][c] && isCurrentPlayerPiece(boardState[r][c]))
      if(getLegalMoves(r,c).some(m=>m.isCapture)) res.push({row:r,col:c});
  return res;
}

/* ================= PIECE RULES ================= */
function pawnMoves(r,c,m){
  const p=boardState[r][c], w=p===p.toUpperCase(), d=w?-1:1, s=w?6:1;
  if(boardState[r+d]?.[c]===""){
    m.push({row:r+d,col:c,isCapture:false});
    if(r===s && boardState[r+2*d][c]==="") m.push({row:r+2*d,col:c,isCapture:false});
  }
  for(let dc of[-1,1]){
    const t=boardState[r+d]?.[c+dc];
    if(t && isOpponent(p,t)) m.push({row:r+d,col:c+dc,isCapture:true});
  }
  if(lastMove && lastMove.piece.toLowerCase()==="p" &&
     Math.abs(lastMove.from.row-lastMove.to.row)===2 &&
     lastMove.to.row===r && Math.abs(lastMove.to.col-c)===1)
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

function kingMoves(r,c,m){
  const p=boardState[r][c], w=p===p.toUpperCase();
  for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
    if(!dr&&!dc) continue;
    const nr=r+dr,nc=c+dc;
    if(boardState[nr]?.[nc]!==undefined){
      const t=boardState[nr][nc];
      m.push({row:nr,col:nc,isCapture:t!==""&&isOpponent(p,t)});
    }
  }
  if(w&&!castlingRights.whiteKingMoved){
    if(!castlingRights.whiteRookHMoved && boardState[7][5]==="" && boardState[7][6]==="")
      m.push({row:7,col:6,isCapture:false});
    if(!castlingRights.whiteRookAMoved && boardState[7][1]==="" && boardState[7][2]==="" && boardState[7][3]==="")
      m.push({row:7,col:2,isCapture:false});
  }
  if(!w&&!castlingRights.blackKingMoved){
    if(!castlingRights.blackRookHMoved && boardState[0][5]==="" && boardState[0][6]==="")
      m.push({row:0,col:6,isCapture:false});
    if(!castlingRights.blackRookAMoved && boardState[0][1]==="" && boardState[0][2]==="" && boardState[0][3]==="")
      m.push({row:0,col:2,isCapture:false});
  }
}

function lineMoves(r,c,m,dirs){
  const p=boardState[r][c];
  for(let[dr,dc]of dirs){
    let nr=r+dr,nc=c+dc;
    while(boardState[nr]?.[nc]!==undefined){
      const t=boardState[nr][nc];
      if(t==="") m.push({row:nr,col:nc,isCapture:false});
      else{ if(isOpponent(p,t)) m.push({row:nr,col:nc,isCapture:true}); break; }
      nr+=dr; nc+=dc;
    }
  }
}

/* ================= START GAME ================= */
drawBoard();
startTimer();
