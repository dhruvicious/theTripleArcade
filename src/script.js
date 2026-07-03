import "./style.css";
import SnakeGame from "./snake.js";
import Tetris from "./tetris.js";
import BreakOut from "./break-out.js";
const gameOptions = document.querySelectorAll(".game-option");
const menuElement = document.getElementById("menu");
const titleElement = document.getElementById("title");
const currentScoreElement = document.getElementById("currentScore");
const maxScoreElement = document.getElementById("maxScore");
let selectedIndex = 0;
let currentGame = null;

gameOptions.forEach(function (option, index) {
  option.addEventListener("mouseenter", function () {
    if (currentGame == null && selectedIndex !== index) {
      window.parent.postMessage("select1", "*");
      selectedIndex = index;
      updateSelected();
    }
  });

  option.addEventListener("click", function () {
    if (currentGame == null) {
      window.parent.postMessage("select2", "*");
      selectedIndex = index;
      updateSelected();
      startGameSelected();
    }
  });
});

updateSelected();

function updateSelected() {
  gameOptions.forEach(function (option) {
    option.classList.remove("selected");
  });
  const selectedOption = gameOptions[selectedIndex];
  selectedOption.classList.add("selected");
}

function handleKeyPress(event) {
  if (currentGame == null) {
    switch (event.key) {
      case "ArrowUp":
        window.parent.postMessage("select1", "*");
        selectedIndex = selectedIndex === 0 ? 2 : selectedIndex - 1;
        break;
      case "ArrowDown":
        window.parent.postMessage("select1", "*");
        selectedIndex = selectedIndex === 2 ? 0 : selectedIndex + 1;
        break;
      case " ":
        window.parent.postMessage("select2", "*");
        startGameSelected();
        break;
      case "Enter":
        window.parent.postMessage("select2", "*");
        startGameSelected();
        break;
    }
    updateSelected();
  } else if (event.key == "Escape" && currentGame != null) {
    window.parent.postMessage("select2", "*");
    currentScoreElement.style.display = "none";
    maxScoreElement.style.display = "none";
    currentGame.destroy();
    currentGame = null;
    titleElement.style.display = "block";
    menuElement.style.display = "block";
    window.addEventListener("message", handleParentMessage);
    window.addEventListener("keydown", handleKeyPress);
  }
}

function startGameSelected() {
  switch (selectedIndex) {
    case 0:
      menuElement.style.display = "none";
      titleElement.style.display = "none";

      currentGame = new SnakeGame();
      currentGame.start();
      break;
    case 1:
      menuElement.style.display = "none";
      titleElement.style.display = "none";
      currentGame = new Tetris();
      currentGame.start();

      break;
    case 2:
      menuElement.style.display = "none";
      titleElement.style.display = "none";
      currentGame = new BreakOut();
      currentGame.start();

      break;
  }
}

function handleParentMessage(event) {
  if (event.data.type === "keyDownParent") {
    handleKeyPress(event.data);
  }
}

window.addEventListener("message", handleParentMessage);
window.addEventListener("keydown", handleKeyPress);
