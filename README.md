# 🐍 Silly Snake Game

A small and playful Snake game I built to practice **Next.js**, **TypeScript**, and working with a simple **SQLite** database.  
It started as a practice project — now it’s a fully working browser game with a persistent high‑score system.

---

## 🎮 Features

- Classic Snake gameplay  
- Clean UI with *New Game*, *Pause*, and *Highscore* views  
- Pause the game anytime using **SPACE**  
- Highscore list stored in **SQLite**  
- Responsive and lightweight  
- Runs entirely in the browser  

---

## 🧱 Tech Stack

- **Next.js**  
- **TypeScript**  
- **SQLite**  
- **CSS Modules**

---

## 📁 Project Structure

Based on the repository layout visible in your GitHub tree:

Code
public/
src/
  app/
    _components/
    game/
    highscore/
    globals.css
    icon.png
    layout.tsx
    page.module.css
    page.tsx
lib/
data.sqlite
data.sqlite-shm
data.sqlite-wal
package.json
tsconfig.json
next.config.ts
eslint.config.mjs
README.md
  
## 🚀 Getting Started

Clone the repo:

bash
git clone https://github.com/Krieger-m/silly-snake-game
cd silly-snake-game
Install dependencies:

bash
npm install
Start the development server:

bash
npm run dev
Then open:

Code
http://localhost:3000
🗄️ Database
The project uses a small SQLite database (data.sqlite) to store highscores.
It initializes automatically on first run — no manual setup required.

📦 Deployment
This project can run in any Node.js environment.
Build and start:

bash
npm run build
npm start
📝 License
MIT — feel free to use, modify, or build on it.
