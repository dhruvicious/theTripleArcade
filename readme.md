# Three-in-One Arcade

A web-based arcade featuring three classic games: **Breakout**, **Snake**, and **Tetris**. Built with pure JavaScript, HTML5, and CSS3 in a single-page application for a seamless retro gaming experience.

## 🎮 Features

-   **Three Classic Games**: Breakout, Snake, and Tetris
-   **Single Page Application**: All games contained within one HTML file
-   **Vanilla JavaScript**: No external dependencies required
-   **Responsive Design**: Works across different screen sizes
-   **Retro Styling**: Classic arcade aesthetics with custom fonts

## 🚀 Quick Start

### Prerequisites

-   Any modern web browser (Chrome, Firefox, Safari, Edge)
-   No additional software installation required

### Installation

1. **Clone the repository**

    ```bash
    git clone https://github.com/yourusername/three-in-one-arcade.git
    ```

2. **Navigate to the project directory**

    ```bash
    cd three-in-one-arcade
    ```

3. **Open the game**

    ```bash
    # Option 1: Open directly in browser
    open src/index.html

    # Option 2: Use a local server (recommended)
    python -m http.server 8000
    # Then navigate to http://localhost:8000/src/
    ```

## 🎯 How to Play

### Game Selection

Use the main menu interface to select between the three available games.

### Controls

-   **Breakout**: Use arrow keys to control the paddle.
-   **Snake**: Arrow keys to navigate the snake.
-   **Tetris**: Arrow keys to move pieces.

## 📁 Project Structure

```
three-in-one-arcade/
├── bundler/                # Webpack configuration files
├── src/                    # Source code
│   ├── break-out.js        # Breakout game logic
│   ├── index.html          # Main HTML page
│   ├── script.js           # Main application logic
│   ├── snake.js            # Snake game logic
│   ├── style.css           # Global styles
│   └── tetris.js           # Tetris game logic
├── static/                 # Static assets
│   ├── fonts/              # Custom arcade fonts
│   └── images/             # Game images and icons
├── README.md               # Project documentation
└── package.json            # Project configuration
```

## 🛠️ Technologies Used

-   **HTML5**: Structure and Canvas API for game rendering
-   **CSS3**: Styling, animations, and responsive layout
-   **JavaScript (ES6+)**: Game logic and interactive functionality
-   **Webpack**: Module bundling for production builds

## 🔧 Running the Project

```bash
npm i

npm run dev

npm run build
```

---

**Enjoy the games!** 🕹️

> This project demonstrates vanilla JavaScript game development and serves as a great learning resource for aspiring web developers.
