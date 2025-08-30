class BreakOut {
  constructor() {
    this.canvas = document.getElementById("break-out");
    this.context = this.canvas.getContext("2d");
    this.currentScoreElement = document.getElementById("currentScore");
    this.maxScoreElement = document.getElementById("maxScore");
    this.currentScoreElement.style.display = "block";
    this.maxScoreElement.style.display = "block";
    this.canvas.style.display = "block";
    this.currentScore = 0;
    this.loopInterval = 1;
    this.loopId = null;
    this.brickGap = 2;
    this.brickWidth = 48;
    this.brickHeight = 24;
    this.limitScore = 448;
    this.bricks = [];
    this.paddle = {
      x: this.canvas.width / 2 - this.brickWidth / 2,
      y: 600,
      width: this.brickWidth,
      height: this.brickHeight,
      dx: 0,
    };
    this.ball = {
      x: 50,
      y: 300,
      width: 16,
      height: 16,
      speed: 2,
      dx: 0,
      dy: 0,
    };

    this.colorMap = {
      R: "#a40600",
      O: "#c88000",
      G: "#007f23",
      Y: "#c7c519",
    };
    this.isKeyLeftPressing = false;
    this.isKeyRightPressing = false;
    this.level = [
      [],
      [],
      [],
      ["R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R"],
      ["R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R"],
      ["O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O"],
      ["O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O", "O"],
      ["G", "G", "G", "G", "G", "G", "G", "G", "G", "G", "G", "G", "G", "G"],
      ["G", "G", "G", "G", "G", "G", "G", "G", "G", "G", "G", "G", "G", "G"],
      ["Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y"],
      ["Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y", "Y"],
    ];
    this.updateScore();
  }

  createLevel(levelData) {
    for (let row = 0; row < levelData.length; row++) {
      for (let col = 0; col < levelData[row].length; col++) {
        const colorCode = levelData[row][col];
        this.bricks.push({
          x: (this.brickWidth + this.brickGap) * col,
          y: (this.brickHeight + this.brickGap) * row,
          color: this.colorMap[colorCode],
          colorCode: colorCode,
          width: this.brickWidth,
          height: this.brickHeight,
        });
      }
    }
  }
  collides(obj1, obj2) {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y
    );
  }

  loop = () => {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.paddle.x += this.paddle.dx;

    if (this.paddle.x < 0) {
      this.paddle.x = 0;
    } else if (this.paddle.x + this.brickWidth > this.canvas.width) {
      this.paddle.x = this.canvas.width - this.brickWidth;
    }

    this.ball.x += this.ball.dx;
    this.ball.y += this.ball.dy;

    if (this.ball.x < 0) {
      window.parent.postMessage("hit", "*");
      this.ball.x = 0;
      this.ball.dx *= -1;
    } else if (this.ball.x + this.ball.width > this.canvas.width) {
      window.parent.postMessage("hit", "*");
      this.ball.x = this.canvas.width - this.ball.width;
      this.ball.dx *= -1;
    }

    if (this.ball.y < 0) {
      this.ball.y = 0;
      this.ball.dy *= -1;
    }

    if (this.ball.y > this.canvas.height) {
      this.ball.x = 50;
      this.ball.y = 300;
      this.ball.dx = 0;
      this.ball.dy = 0;
      window.parent.postMessage("die", "*");
      this.resetLevel();
    }
    this.checkBallPaddleCollision();

    for (let i = 0; i < this.bricks.length; i++) {
      const brick = this.bricks[i];
      if (this.collides(this.ball, brick)) {
        window.parent.postMessage("hit", "*");
        switch (brick.colorCode) {
          case "Y":
            this.currentScore += 1;
            break;
          case "G":
            this.currentScore += 3;
            break;
          case "O":
            this.currentScore += 5;
            break;
          case "R":
            this.currentScore += 7;
            break;
        }
        this.updateScore();
        this.bricks.splice(i, 1);
        if (
          this.ball.y + this.ball.height - this.ball.speed <= brick.y ||
          this.ball.y >= brick.y + brick.height - this.ball.speed
        ) {
          this.ball.dy *= -1;
        } else {
          this.ball.dx *= -1;
        }

        break;
      }
    }

    if (this.ball.dx || this.ball.dy) {
      this.context.fillStyle = "#a9a8a9";

      this.context.fillRect(
        this.ball.x,
        this.ball.y,
        this.ball.width,
        this.ball.height
      );
    }

    this.bricks.forEach((brick) => {
      this.context.fillStyle = brick.color;
      this.context.fillRect(brick.x, brick.y, brick.width, brick.height);
    });

    this.context.fillStyle = "#005b91";
    this.context.fillRect(
      this.paddle.x,
      this.paddle.y,
      this.paddle.width,
      this.paddle.height
    );
  };

  keyDownHandler = (e) => {
    if (e.key === "ArrowLeft") {
      this.isKeyLeftPressing = true;
      this.paddle.dx = -3;
    } else if (e.key === "ArrowRight") {
      this.isKeyRightPressing = true;
      this.paddle.dx = 3;
    }
  };

  keyUpHandler = (e) => {
    if (e.key === "ArrowLeft") {
      this.isKeyLeftPressing = false;
      if (!this.isKeyRightPressing) {
        this.paddle.dx = 0;
      }
    } else if (e.key === "ArrowRight") {
      this.isKeyRightPressing = false;
      if (!this.isKeyLeftPressing) {
        this.paddle.dx = 0;
      }
    }
  };

  checkBallPaddleCollision() {
    // Outside Collision
    const outsideLeft = {
      x: this.paddle.x + this.paddle.width / 2 - 24,
      y: this.paddle.y,
      width: 8,
      height: 32,
    };
    const outsideRight = {
      x: this.paddle.x + this.paddle.width / 2 + 24,
      y: this.paddle.y,
      width: 8,
      height: 32,
    };
    // Inner side Collision
    const innerLeft = {
      x: this.paddle.x + this.paddle.width / 2 - 12,
      y: this.paddle.y,
      width: 8,
      height: 32,
    };
    const innerRight = {
      x: this.paddle.x + this.paddle.width / 2 + 12,
      y: this.paddle.y,
      width: 8,
      height: 32,
    };
    // Inner Collision
    const innerCenter = {
      x: this.paddle.x + this.paddle.width / 2,
      y: this.paddle.y,
      width: 16,
      height: 32,
    };

    if (this.collides(this.ball, innerCenter)) {
      window.parent.postMessage("hit", "*");
      this.ball.dx = this.ball.dx < 0 ? -1 : 1;
      this.ball.dy = this.ball.dy < 0 ? 2 : -2;
      this.ball.y = this.paddle.y - this.ball.height;
    } else if (
      this.collides(this.ball, innerRight) ||
      this.collides(this.ball, innerLeft)
    ) {
      window.parent.postMessage("hit", "*");
      this.ball.dx = this.ball.dx < 0 ? -2 : 2;
      this.ball.dy = this.ball.dy < 0 ? 2 : -2;
      this.ball.y = this.paddle.y - this.ball.height;
    } else if (
      this.collides(this.ball, outsideRight) ||
      this.collides(this.ball, outsideLeft)
    ) {
      window.parent.postMessage("hit", "*");
      this.ball.dx = this.ball.dx < 0 ? -2 : 2;
      this.ball.dy = this.ball.dy < 0 ? 1 : -1;
      this.ball.y = this.paddle.y - this.ball.height;
    }
  }

  resetLevel() {
    this.currentScore = 0;
    this.updateScore();
    this.bricks = [];
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.createLevel(this.level);
    this.paddle.x = this.canvas.width / 2 - this.brickWidth / 2;
    this.paddle.y = 600;
    this.ball.dx = 2;
    this.ball.dy = 2;
  }

  updateScore() {
    let maxScore = localStorage.getItem("maxBreakOutScore") || 0;
    if (this.currentScore > maxScore) {
      maxScore = this.currentScore;
      localStorage.setItem("maxBreakOutScore", this.currentScore);
    }
    this.currentScoreElement.textContent =
      "CURRENT SCORE: " + this.currentScore;

    this.maxScoreElement.textContent = "MAX SCORE: " + maxScore;
    if (this.currentScore >= this.limitScore) {
      this.resetLevel();
    }
  }

  handleParentMessage = (event) => {
    if (event.data.type === "keyDownParent") {
      this.keyDownHandler(event.data);
    } else if (event.data.type === "keyUpParent") {
      this.keyUpHandler(event.data);
    }
  };

  listenKeyboard() {
    window.addEventListener("message", this.handleParentMessage);
    window.addEventListener("keydown", this.keyDownHandler);
    window.addEventListener("keyup", this.keyUpHandler);
  }

  destroy() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    clearInterval(this.loopId);
    window.removeEventListener("message", this.handleParentMessage);
    window.removeEventListener("keydown", this.keyDownHandler);
    window.removeEventListener("keyup", this.keyUpHandler);
    this.canvas.style.display = "none";
  }

  start() {
    this.createLevel(this.level);
    this.ball.dx = 2;
    this.ball.dy = 2;
    this.listenKeyboard();
    this.loopId = setInterval(this.loop, this.loopInterval);
  }
}

export default BreakOut;
