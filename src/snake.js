class SnakeGame {
  constructor() {
    this.canvas = document.getElementById("game");
    this.context = this.canvas.getContext("2d");

    this.currentScoreElement = document.getElementById("currentScore");
    this.maxScoreElement = document.getElementById("maxScore");

    this.currentScore = 0;
    this.loopInterval = 50;
    this.loopId = null;

    this.keyDownAllowed = true;
    this.keysPressedQueue = [];

    this.grid = 32;
    this.numCellsW = this.canvas.width / this.grid;
    this.numCellsH = this.canvas.height / this.grid;

    this.snake = {
      x: 160,
      y: 160,
      dx: this.grid,
      dy: 0,
      cells: [],
      maxCells: 4,
    };

    this.apple = {
      x: 320,
      y: 320,
    };

    // Make scoreboard and canvas visible
    this.currentScoreElement.style.display = "block";
    this.maxScoreElement.style.display = "block";
    this.canvas.style.display = "block";

    this.updateScore();
  }

  // Get random whole numbers in a specific range
  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  // Main game loop
  loop = () => {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Move snake
    this.snake.x += this.snake.dx;
    this.snake.y += this.snake.dy;

    // Wrap around edges
    if (this.snake.x < 0) {
      this.snake.x = this.canvas.width - this.grid;
    } else if (this.snake.x >= this.canvas.width) {
      this.snake.x = 0;
    }

    if (this.snake.y < 0) {
      this.snake.y = this.canvas.height - this.grid;
    } else if (this.snake.y >= this.canvas.height) {
      this.snake.y = 0;
    }

    // Add new head
    this.snake.cells.unshift({ x: this.snake.x, y: this.snake.y });

    // Trim tail
    if (this.snake.cells.length > this.snake.maxCells) {
      this.snake.cells.pop();
    }

    // Draw apple
    this.context.fillStyle = "#EE4266";
    this.context.beginPath();
    this.context.arc(
      this.apple.x + this.grid / 2,
      this.apple.y + this.grid / 2,
      12,
      0,
      2 * Math.PI
    );
    this.context.fill();

    // Draw snake
    this.context.fillStyle = "#2A1E5C";
    this.snake.cells.forEach((cell, index) => {
      this.context.fillRect(cell.x, cell.y, this.grid - 1, this.grid - 1);

      // Check collision with apple
      if (cell.x === this.apple.x && cell.y === this.apple.y) {
        window.parent.postMessage("hit", "*");
        this.snake.maxCells++;
        this.apple.x = this.getRandomInt(0, this.numCellsW) * this.grid;
        this.apple.y = this.getRandomInt(0, this.numCellsH) * this.grid;
        this.currentScore += 10;
        this.updateScore();
      }

      // Check collision with self
      for (let i = index + 1; i < this.snake.cells.length; i++) {
        if (cell.x === this.snake.cells[i].x && cell.y === this.snake.cells[i].y) {
          window.parent.postMessage("die", "*");
          this.resetSnake();
        }
      }
    });
  };

  // Reset snake on death
  resetSnake() {
    this.currentScore = 0;
    this.updateScore();

    this.snake.x = 160;
    this.snake.y = 160;
    this.snake.cells = [];
    this.snake.maxCells = 4;
    this.snake.dx = this.grid;
    this.snake.dy = 0;

    this.apple.x = this.getRandomInt(0, this.numCellsW) * this.grid;
    this.apple.y = this.getRandomInt(0, this.numCellsH) * this.grid;
  }

  // Keyboard listeners
  listenKeyboard() {
    window.addEventListener("message", this.handleParentMessage);
    window.addEventListener("keydown", this.keyListener);
  }

  handleParentMessage = (event) => {
    if (event.data.type === "keyDownParent") {
      this.keyListener(event.data);
    }
  };

  keyListener = (e) => {
    if (!this.keyDownAllowed) {
      this.keysPressedQueue.push(e);
      return;
    }

    this.processKeyEvent(e);
    this.keyDownAllowed = false;

    setTimeout(() => {
      this.keyDownAllowed = true;
      while (this.keysPressedQueue.length > 0) {
        const keyEvent = this.keysPressedQueue.shift();
        this.processKeyEvent(keyEvent);
      }
    }, this.loopInterval);
  };

  // Handle direction change
  processKeyEvent(e) {
    if (e.key === "ArrowLeft" && this.snake.dx === 0) {
      this.snake.dx = -this.grid;
      this.snake.dy = 0;
    } else if (e.key === "ArrowUp" && this.snake.dy === 0) {
      this.snake.dy = -this.grid;
      this.snake.dx = 0;
    } else if (e.key === "ArrowRight" && this.snake.dx === 0) {
      this.snake.dx = this.grid;
      this.snake.dy = 0;
    } else if (e.key === "ArrowDown" && this.snake.dy === 0) {
      this.snake.dy = this.grid;
      this.snake.dx = 0;
    }
  }

  // Scoreboard updates
  updateScore() {
    let maxScore = localStorage.getItem("maxSnakeScore") || 0;

    if (this.currentScore > maxScore) {
      maxScore = this.currentScore;
      localStorage.setItem("maxSnakeScore", this.currentScore);
    }

    this.currentScoreElement.textContent = "CURRENT SCORE: " + this.currentScore;
    this.maxScoreElement.textContent = "MAX SCORE: " + maxScore;
  }

  // Game lifecycle
  start() {
    this.listenKeyboard();
    this.loopId = setInterval(this.loop, this.loopInterval);
  }

  destroy() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    clearInterval(this.loopId);
    window.removeEventListener("message", this.handleParentMessage);
    this.canvas.style.display = "none";
  }
}

export default SnakeGame;