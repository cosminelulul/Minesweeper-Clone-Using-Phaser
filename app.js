// Constants

const ROWS = 9;
const COLS = 9;
const TOTAL_MINES = 10; 

const CELL_SIZE = 80; 
const UI_HEIGHT = 120;
const TOP_UI_HEIGHT = 120;

const BTN_WIDTH = 280;
const BTN_HEIGHT = 80;

const config = {
    type: Phaser.AUTO,
    width: COLS * CELL_SIZE,
    height: TOP_UI_HEIGHT + (ROWS * CELL_SIZE) + UI_HEIGHT,
    backgroundColor: '#1B1B1B',
    scene: {
        create: createScene
    }
};

const NUMBER_COLORS = [
    '',        
    '#8be9fd', // 1: Pastel Blue
    '#ffb86c', // 2: Pastel Orange/Peach
    '#50fa7b', // 3: Pastel Green
    '#ff79c6', // 4: Pastel Pink
    '#bd93f9', // 5: Pastel Purple
    '#f1fa8c', // 6: Pastel Yellow
    '#ff5555', // 7: Pastel Red
    '#f8f8f2'  // 8: White
];

// ------------------------------------- //

// Global Variables

const game = new Phaser.Game(config);

let isGameOver = false;
let board = [];

let flagsPlaced = 0;
let counterText;
let isFirstClick = true;
let statusText;

let timerSeconds = 0;
let timerText;
let timerEvent;
let mainScene;

// ------------------------------------- //

// Functions

function createCell(row, col) {
    return {
        row: row,
        col: col,
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0
    };
}

function initializeBoard() {
    
    board = [];

    for ( let m = 0; m < ROWS; m++) {
        let newRow = [];

        for ( let n = 0; n < COLS; n++)  newRow.push(createCell(m, n));
        
        board.push(newRow);
    }

    console.log("Test: Board initialized:");

}

function plantMines(firstClickRow, firstClickCol) {
    let minesPlanted = 0;

    while (minesPlanted < TOTAL_MINES) {
        let randomRow = Math.floor(Math.random() * ROWS);
        let randomCol = Math.floor(Math.random() * COLS);

        if (board[randomRow][randomCol].isMine === false && 
           !(randomRow === firstClickRow && randomCol === firstClickCol)) {
            
            board[randomRow][randomCol].isMine = true;
            minesPlanted++;
        }
    }
}

function calculateNeighbors() {

    // Coordinates for the 8 neighboring cells

    const directions = [
        [-1, -1], [-1, 0], [-1, 1], // Top Left, Top, Top Right
        [0, -1],           [0, 1], // Left, Right
        [1, -1], [1, 0], [1, 1] // Bottom Left, Bottom, Bottom Right
    ];

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {

            // Cel is mine - skip
            if (board[row][col].isMine) continue;

            let mineCount = 0;

            // Check 

            for (let i = 0; i < directions.length; i++) {
                let neighborRow = row + directions[i][0];
                let neighborCol = col + directions[i][1];

                // Boundary check:

                if (neighborRow >= 0 && neighborRow < ROWS && neighborCol >= 0 && neighborCol < COLS) {
                    // Check if mine
                    if (board[neighborRow][neighborCol].isMine) mineCount++;
                    
                    }
                
            }

            board[row][col].neighborMines = mineCount;
        }

    }

}


function revealCell(row, col) {
    if (isGameOver) return;
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
    
    let cell = board[row][col];
    if (cell.isRevealed || cell.isFlagged) return;

    // --- FIRST CLICK SAFETY LOGIC ---
    if (isFirstClick) {
        plantMines(row, col); 
        calculateNeighbors(); 
        

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                let currentCell = board[r][c];
                
                if (currentCell.isMine) {
                    currentCell.textSprite.setText("M");
                    currentCell.textSprite.setColor("#ff0000");
                } else if (currentCell.neighborMines > 0) {
                    currentCell.textSprite.setText(currentCell.neighborMines.toString());
                    currentCell.textSprite.setColor(NUMBER_COLORS[currentCell.neighborMines]);
                }
            }
        }

        timerEvent = mainScene.time.addEvent({
            delay: 1000,
            callback: updateTimer,
            loop: true
        });

        statusText.setText("Playing!");
        statusText.setColor("#bd93f9"); 

        // debugBoardToConsole(); // DEBUGGING PURPOSES ONLY - REMOVE IN PRODUCTION
        
        isFirstClick = false; 
    }

    cell.isRevealed = true;
    cell.sprite.fillColor = 0x2b2b2b; 
    if (cell.textSprite) cell.textSprite.setVisible(true);

    if (cell.isMine) {
        handleGameOver();
        return; 
    }
    
    if (cell.neighborMines === 0) {
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [ 0, -1],          [ 0, 1],
            [ 1, -1], [ 1, 0], [ 1, 1]
        ];

        for (let i = 0; i < directions.length; i++) {
            let nextRow = row + directions[i][0];
            let nextCol = col + directions[i][1];
            revealCell(nextRow, nextCol);
        }
    }
    
    if (!isGameOver) checkWinCondition();
}
function toggleFlag(row, col) {
    if (isGameOver) return;

    let cell = board[row][col];

    if (cell.isRevealed) return;

    if (!cell.isFlagged && flagsPlaced >= TOTAL_MINES) {
        return; 
    }

    cell.isFlagged = !cell.isFlagged;

    if (cell.isFlagged) {
        cell.sprite.fillColor = 0xffaa00; 
        flagsPlaced++; 
    } else {
        cell.sprite.fillColor = 0x555555; 
        flagsPlaced--; 
    }

    if (counterText) {
        counterText.setText(`Mines: ${TOTAL_MINES - flagsPlaced}`);
    }
}

function handleGameOver() {
    isGameOver = true;
    console.log("Game Over.");

    if (statusText) {
        statusText.setText("You LOST!");
        statusText.setColor("#ff5555"); 
    }

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            let cell = board[row][col];
            
            if (cell.isMine) {

                cell.sprite.fillColor = 0xffcccc; 
                if (cell.textSprite) cell.textSprite.setVisible(true);
            }
        }
    }
}

function checkWinCondition() {
    let safeCellsRevealed = 0;
    const totalSafeCells = (ROWS * COLS) - TOTAL_MINES;

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col].isRevealed && !board[row][col].isMine) {
                safeCellsRevealed++;
            }
        }
    }

    if (safeCellsRevealed === totalSafeCells) {
        isGameOver = true;
        console.log("GG!");

        if (statusText) {
            statusText.setText("YOU WON!");
            statusText.setColor("#f1fa8c");
        }
        

        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                if (board[row][col].isMine) {
                    board[row][col].sprite.fillColor = 0x00ff00;
                }
            }
        }
    }
}

function debugBoardToConsole() {
    console.log("Current Minesweeper Board:");
    for (let row = 0; row < ROWS; row++) {
        let rowString = "";
        for (let col = 0; col < COLS; col++) {

            if (board[row][col].isMine) 
                rowString += " * ";

            else 
                rowString += ` ${board[row][col].neighborMines} `;
        }
        console.log(rowString);
    }
}

function updateTimer() {
    if (!isGameOver) {
        timerSeconds++;
        timerText.setText(`Timer: ${timerSeconds} secs`);
    } else {
        if (timerEvent) timerEvent.remove();
    }
}


// ------------------------------ //

function createScene() {
    mainScene = this;
    this.input.mouse.disableContextMenu();
    isGameOver = false; 
    isFirstClick = true; 
    flagsPlaced = 0;


    initializeBoard();

    statusText = this.add.text((COLS * CELL_SIZE) / 2, TOP_UI_HEIGHT / 2, "Click to Play", {
        fontSize: '48px',
        color: '#ffffff',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            let xPos = (col * CELL_SIZE) + CELL_SIZE / 2;
            let yPos = (row * CELL_SIZE) + TOP_UI_HEIGHT + CELL_SIZE / 2;

            
            let visualRect = this.add.rectangle(xPos, yPos, CELL_SIZE - 4, CELL_SIZE - 4, 0x555555);
            visualRect.setInteractive();

            visualRect.on('pointerdown', function (pointer) {
                if (pointer.rightButtonDown()) {
                    toggleFlag(row, col);
                } else {
                    revealCell(row, col);
                }
            });

            board[row][col].sprite = visualRect;


            let visualText = this.add.text(xPos, yPos, "", {
                fontSize: '22px',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            visualText.setVisible(false);
            board[row][col].textSprite = visualText;
        }
    }

    timerSeconds = 0;
    if (timerEvent) timerEvent.remove();

    let btnX = (COLS * CELL_SIZE) / 2;
    let btnY = TOP_UI_HEIGHT + (ROWS * CELL_SIZE) + (UI_HEIGHT / 2);

    let restartBtn = this.add.rectangle(btnX, btnY, BTN_WIDTH, BTN_HEIGHT, 0x444444);
    restartBtn.setInteractive();

    this.add.text(btnX, btnY, "RESTART", {
        fontSize: '36px',
        color: '#b06161',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    restartBtn.on('pointerover', () => restartBtn.fillColor = 0x666666);
    restartBtn.on('pointerout', () => restartBtn.fillColor = 0x444444);

    restartBtn.on('pointerdown', () => {
        console.log("Restarting Game...");
        this.scene.restart();
    });

    
    counterText = this.add.text(20, btnY, `Mines: ${TOTAL_MINES - flagsPlaced}`, {
        fontSize: '32px',
        color: '#81eb57', 
        fontStyle: 'bold'
    }).setOrigin(0, 0.5); 

    timerText = this.add.text(config.width - 20, btnY, `Timer: 0 secs`, {
        fontSize: '26px',
        color: '#8be9fd', 
        fontStyle: 'bold'
    }).setOrigin(0.9, 0.5); 

}
