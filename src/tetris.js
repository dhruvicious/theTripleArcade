class Tetris {
  constructor() {
    this.canvas = document.getElementById("tetris");
    this.currentScoreElement = document.getElementById("currentScore");
    this.maxScoreElement = document.getElementById("maxScore");
    this.currentScoreElement.style.display = "block";
    this.maxScoreElement.style.display = "block";
    this.canvas.style.display = "block";
    this.context = this.canvas.getContext("2d");
    this.loopInterval = 5;
    this.loopId = null;
    this.grid = 32;
    this.currentScore = 0;
    this.updateScore();
    this.tetrominoSequence = [];
    this.playfield = [];
    this.clearPlayfield();
    this.tetrominos = {
      I: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      J: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      L: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0],
      ],
      O: [
        [1, 1],
        [1, 1],
      ],
      S: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0],
      ],
      Z: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
      ],
      T: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
    };
    this.colors = {
      I: "#00ffff",
      O: "#ffff00",
      T: "#800080",
      S: "#00ff00",
      Z: "#ff0000",
      J: "#0000ff",
      L: "#ff7f00",
    };
    this.count = 0;
    this.gameOver = false;
    this.clearPlayfield();
    this.tetromino = this.getNextTetromino();
  }

  updateScore() {
    let maxScore = localStorage.getItem("maxTetrisScore") || 0;
    if (this.currentScore > maxScore) {
      maxScore = this.currentScore;
      localStorage.setItem("maxTetrisScore", this.currentScore);
    }
    this.currentScoreElement.textContent =
      "CURRENT SCORE: " + this.currentScore;

    this.maxScoreElement.textContent = "MAX SCORE: " + maxScore;
  }

  start() {
    window.addEventListener("message", this.handleParentMessage);
    window.addEventListener("keydown", this.keyDownHandler);
    this.loopId = setInterval(this.loop, this.loopInterval);
  }

  loop = () => {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let row = 0; row < 20; row++) {
      for (let col = 0; col < 10; col++) {
        if (this.playfield[row][col]) {
          const name = this.playfield[row][col];
          this.context.fillStyle = this.colors[name];

          this.context.fillRect(
            col * this.grid,
            row * this.grid,
            this.grid - 1,
            this.grid - 1
          );
        }
      }
    }

    if (this.tetromino) {
      if (++this.count > 35) {
        this.tetromino.row++;
        this.count = 0;

        if (
          !this.isValidMove(
            this.tetromino.matrix,
            this.tetromino.row,
            this.tetromino.col
          )
        ) {
          this.tetromino.row--;
          this.placeTetromino();
        }
      }

      this.context.fillStyle = this.colors[this.tetromino.name];

      for (let row = 0; row < this.tetromino.matrix.length; row++) {
        for (let col = 0; col < this.tetromino.matrix[row].length; col++) {
          if (this.tetromino.matrix[row][col]) {
            this.context.fillRect(
              (this.tetromino.col + col) * this.grid,
              (this.tetromino.row + row) * this.grid,
              this.grid - 1,
              this.grid - 1
            );
          }
        }
      }
    }
  };

  generateSequence() {
    const sequence = ["I", "J", "L", "O", "S", "T", "Z"];

    while (sequence.length) {
      const rand = this.getRandomInt(0, sequence.length - 1);
      const name = sequence.splice(rand, 1)[0];
      this.tetrominoSequence.push(name);
    }
  }

  getNextTetromino() {
    if (this.tetrominoSequence.length === 0) {
      this.generateSequence();
    }

    const name = this.tetrominoSequence.pop();
    const matrix = this.tetrominos[name];
    const col = this.playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);
    const row = name === "I" ? -1 : -2;

    return {
      name: name,
      matrix: matrix,
      row: row,
      col: col,
    };
  }

  // rotate an NxN matrix 90deg
  // @see https://codereview.stackexchange.com/a/186834
  rotate(matrix) {
    const N = matrix.length - 1;
    const result = matrix.map((row, i) =>
      row.map((val, j) => matrix[N - j][i])
    );

    return result;
  }

  isValidMove(matrix, cellRow, cellCol) {
    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (
          matrix[row][col] &&
          (cellCol + col < 0 ||
            cellCol + col >= this.playfield[0].length ||
            cellRow + row >= this.playfield.length ||
            this.playfield[cellRow + row][cellCol + col])
        ) {
          return false;
        }
      }
    }

    return true;
  }

  placeTetromino() {
    for (let row = 0; row < this.tetromino.matrix.length; row++) {
      for (let col = 0; col < this.tetromino.matrix[row].length; col++) {
        if (this.tetromino.matrix[row][col]) {
          if (this.tetromino.row + row < 0) {
            window.parent.postMessage("die", "*");
            this.showGameOver();
            return;
          }

          this.playfield[this.tetromino.row + row][this.tetromino.col + col] =
            this.tetromino.name;
        }
      }
    }
    let numClears = 0;

    for (let row = this.playfield.length - 1; row >= 0; ) {
      if (this.playfield[row].every((cell) => !!cell)) {
        ++numClears;
        for (let r = row; r >= 0; r--) {
          for (let c = 0; c < this.playfield[r].length; c++) {
            this.playfield[r][c] = this.playfield[r - 1][c];
          }
        }
      } else {
        row--;
      }
    }
    if (numClears > 0) {
      window.parent.postMessage("tetris", "*");
    } else {
      window.parent.postMessage("select1", "*");
    }
    if (numClears == 0) {
      this.currentScore += 10;
    } else if (numClears == 1) {
      this.currentScore += 100;
    } else if (numClears == 2) {
      this.currentScore += 300;
    } else if (numClears == 3) {
      this.currentScore += 500;
    } else if (numClears == 4) {
      this.currentScore += 800;
    }
    this.updateScore();
    this.tetromino = this.getNextTetromino();
  }

  showGameOver() {
    this.gameOver = true;
    this.currentScore = 0;
    this.updateScore();
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.clearPlayfield();
  }

  clearPlayfield() {
    for (let row = -2; row < 20; row++) {
      this.playfield[row] = [];

      for (let col = 0; col < 10; col++) {
        this.playfield[row][col] = 0;
      }
    }
  }

  destroy() {
    this.showGameOver();
    clearInterval(this.loopId);
    window.removeEventListener("message", this.handleParentMessage);
    window.removeEventListener("keydown", this.keyDownHandler);
    this.canvas.style.display = "none";
  }

  getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  handleParentMessage = (event) => {
    if (event.data.type === "keyDownParent") {
      this.keyDownHandler(event.data);
    }
  };

  keyDownHandler = (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      const col =
        e.key === "ArrowLeft" ? this.tetromino.col - 1 : this.tetromino.col + 1;

      if (this.isValidMove(this.tetromino.matrix, this.tetromino.row, col)) {
        this.tetromino.col = col;
      }
    }

    // up arrow key (rotate)
    if (e.key === "ArrowUp") {
      const matrix = this.rotate(this.tetromino.matrix);
      if (this.isValidMove(matrix, this.tetromino.row, this.tetromino.col)) {
        this.tetromino.matrix = matrix;
      }
    }

    // down arrow key (drop)
    if (e.key === "ArrowDown") {
      const row = this.tetromino.row + 1;
      if (!this.isValidMove(this.tetromino.matrix, row, this.tetromino.col)) {
        this.tetromino.row = row - 1;
        this.placeTetromino();
        return;
      }
      this.tetromino.row = row;
    }
  };
}

export default Tetris;
