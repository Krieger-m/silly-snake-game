'use client';

import { useEffect, useState, useRef } from "react";

// --- Constants ---
const GRID_SIZE = 20;
const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;
const GAME_SPEED = 5; // cells per second

const SNAKE_COLOR_START = '#9cb3c9';
const SNAKE_COLOR_END = '#104e8b';
const FOOD_COLOR = '#58d163';
const TEXT_COLOR = 'white';
const PAUSE_OVERLAY_COLOR = 'rgba(0, 0, 0, 0.5)';
const GAMEOVER_OVERLAY_COLOR = 'rgba(0, 0, 0, 0.7)';

const FONT_LARGE = '40px Arial';
const FONT_MEDIUM = '20px Arial';

// --- Types ---
type Point = { x: number; y: number };
type Direction = { x: -1 | 0 | 1; y: -1 | 0 | 1 };

export default function SnakeGame() {
  const [score, setScore] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Use refs for mutable game state that shouldn't trigger re-renders.
  const gameState = useRef({
    snake: [{ x: 160, y: 160 }] as Point[],
    direction: { x: 1, y: 0 } as Direction,
    food: { x: 200, y: 200 } as Point,
    isPaused: false,
    isGameOver: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastUpdate = 0;
    let moveAccumulator = 0;
    let animationFrameId: number;
    let currentScore = 0;

    const getRandomFoodPosition = (): Point => ({
      x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)) * GRID_SIZE,
      y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE)) * GRID_SIZE,
    });

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw food
      ctx.fillStyle = FOOD_COLOR;
      ctx.fillRect(gameState.current.food.x, gameState.current.food.y, GRID_SIZE, GRID_SIZE);

      // Draw snake
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, SNAKE_COLOR_START);
      gradient.addColorStop(1, SNAKE_COLOR_END);
      ctx.fillStyle = gradient;
      gameState.current.snake.forEach(segment => {
        ctx.fillRect(segment.x, segment.y, GRID_SIZE, GRID_SIZE);
      });
    };

    const drawPausedScreen = () => {
      ctx.fillStyle = PAUSE_OVERLAY_COLOR;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = FONT_LARGE;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Paused', canvas.width / 2, canvas.height / 2);
    };

    const drawGameOverScreen = () => {
      ctx.fillStyle = GAMEOVER_OVERLAY_COLOR;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = FONT_LARGE;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 40);
      ctx.font = FONT_MEDIUM;
      ctx.fillText(`Final Score: ${currentScore}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText('Press Enter to Restart', canvas.width / 2, canvas.height / 2 + 40);
    };

    const restartGame = () => {
      gameState.current = {
        snake: [{ x: 160, y: 160 }],
        direction: { x: 1, y: 0 },
        food: getRandomFoodPosition(),
        isPaused: false,
        isGameOver: false,
      };
      currentScore = 0;
      setScore(0);
      lastUpdate = 0;
      moveAccumulator = 0;
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    const update = () => {
      const { snake, direction, food } = gameState.current;
      const head = {
        x: snake[0].x + direction.x * GRID_SIZE,
        y: snake[0].y + direction.y * GRID_SIZE,
      };
      snake.unshift(head);

      // Eat food
      if (head.x === food.x && head.y === food.y) {
        currentScore++;
        setScore(currentScore);
        gameState.current.food = getRandomFoodPosition();
      } else {
        snake.pop();
      }

      // Collision
      const selfCollision = snake.slice(1).some(seg => seg.x === head.x && seg.y === head.y);
      if (
        head.x < 0 || head.x >= canvas.width ||
        head.y < 0 || head.y >= canvas.height ||
        selfCollision
      ) {
        gameState.current.isGameOver = true;
      }

      draw();
    };

    const handleKey = (e: KeyboardEvent) => {
      const { isGameOver, isPaused, direction } = gameState.current;

      if (isGameOver) {
        if (e.key === 'Enter') restartGame();
        return;
      }
      // Toggle pause state with Space or 'p' key
      if (e.key === ' ' || e.key.toLowerCase() === 'p') {
        e.preventDefault(); // Prevent spacebar from scrolling the page
        gameState.current.isPaused = !isPaused;
        if (!gameState.current.isPaused) {
          // To avoid a large jump in time when unpausing
          lastUpdate = performance.now();
          animationFrameId = requestAnimationFrame(gameLoop);
        }
        return;
      }

      // Ignore movement keys if the game is paused
      if (isPaused) return;

      let newDirection = direction;
      switch (e.key) {
        case 'ArrowUp':
          if (direction.y === 0) newDirection = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
          if (direction.y === 0) newDirection = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
          if (direction.x === 0) newDirection = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
          if (direction.x === 0) newDirection = { x: 1, y: 0 };
          break;
      }
      gameState.current.direction = newDirection;
    };

    document.addEventListener('keydown', handleKey);

    const gameLoop = (timestamp: number) => {
      if (gameState.current.isGameOver) {
        drawGameOverScreen();
        // Stop the game loop
        return;
      }

      if (gameState.current.isPaused) {
        drawPausedScreen();
        // Stop the game loop until unpaused
        return;
      }

      if (!lastUpdate) lastUpdate = timestamp;
      const delta = (timestamp - lastUpdate) / 1000; // seconds
      lastUpdate = timestamp;

      moveAccumulator += delta;
      if (moveAccumulator >= 1 / GAME_SPEED) {
        update();
        moveAccumulator = 0;
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    gameState.current.food = getRandomFoodPosition();
    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      document.removeEventListener('keydown', handleKey);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div>
      <div style={{ color: TEXT_COLOR, fontSize: '24px', marginBottom: '10px', textAlign: 'center' }}>Score: {score}</div>
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT}
        style={{
          border: '1px solid white',
        }}></canvas>
        <br />
        <br />
        <p style={{ textAlign: 'center', color: TEXT_COLOR }}>press SPACE to pause</p>
    </div>
  );
}