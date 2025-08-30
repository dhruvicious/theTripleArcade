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
    #using SSL
    git clone git@github.com:dhruvicious/theTripleArcade.git

    #using HTTPS
    git clone https://github.com/dhruvicious/theTripleArcade.git
    ```

2. **Navigate to the project directory**

    ```bash
    cd tripleArcade
    ```

3. **Open the game**

```bash
npm i

npm run dev

npm run build
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

---

**Enjoy the games!** 🕹️
