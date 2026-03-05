'use client';

import { useEffect, useState } from "react";
import styles from "../page.module.css";

export default function SnakeGame() {
  const [score, setScore] = useState(0);

  useEffect(() => {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    const gridSize = 20;
    const speed = 5; // grid cells per second

    let snake = [{ x: 160, y: 160 }];
    let direction = { x: 1, y: 0 }; // normalized direction
    let food = { x: 200, y: 200 };
    let lastUpdate = 0;
    let moveAccumulator = 0;
    let animationFrameId: number;
    let currentScore = 0;
    let isPaused = false;

    const draw = () => {
      ctx!.clearRect(0, 0, canvas.width, canvas.height);

      // Draw food
      ctx!.fillStyle = '#58d163';
      ctx!.fillRect(food.x, food.y, gridSize, gridSize);

      // Draw snake
      const gradient = ctx!.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#9cb3c9');
      gradient.addColorStop(1, '#104e8b');
      ctx!.fillStyle = gradient;
      snake.forEach(segment => {
        ctx!.fillRect(segment.x, segment.y, gridSize, gridSize);
      });
    };

    const drawPausedScreen = () => {
      ctx!.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx!.fillRect(0, 0, canvas.width, canvas.height);
      ctx!.fillStyle = 'white';
      ctx!.font = '40px Arial';
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';
      ctx!.fillText('Paused', canvas.width / 2, canvas.height / 2);
    };

    const update = () => {
      const head = {
        x: snake[0].x + direction.x * gridSize,
        y: snake[0].y + direction.y * gridSize,
      };
      snake.unshift(head);

      // Eat food
      if (head.x === food.x && head.y === food.y) {
        currentScore++;
        setScore(currentScore);
        food = {
          x: Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize,
          y: Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize,
        };
      } else {
        snake.pop();
      }

      // Collision
      if (
        head.x < 0 || head.x >= canvas.width ||
        head.y < 0 || head.y >= canvas.height ||
        snake.slice(1).some(seg => seg.x === head.x && seg.y === head.y)
      ) {
        alert('Game Over!');
        snake = [{ x: 160, y: 160 }];
        direction = { x: 1, y: 0 };
        currentScore = 0;
        setScore(0);
      }

      draw();
    };

    const handleKey = (e: KeyboardEvent) => {
      // Toggle pause state with Space or 'p' key
      if (e.key === ' ' || e.key.toLowerCase() === 'p') {
        e.preventDefault(); // Prevent spacebar from scrolling the page
        isPaused = !isPaused;
        if (!isPaused) {
          // To avoid a large jump in time when unpausing
          lastUpdate = performance.now();
          animationFrameId = requestAnimationFrame(gameLoop);
        }
        return;
      }

      // Ignore movement keys if the game is paused
      if (isPaused) return;

      switch (e.key) {
        case 'ArrowUp':
          if (direction.y === 0) direction = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
          if (direction.y === 0) direction = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
          if (direction.x === 0) direction = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
          if (direction.x === 0) direction = { x: 1, y: 0 };
          break;
      }
    };

    document.addEventListener('keydown', handleKey);

    const gameLoop = (timestamp: number) => {
      if (isPaused) {
        drawPausedScreen();
        // Stop the game loop until unpaused
        return;
      }

      if (!lastUpdate) lastUpdate = timestamp;
      const delta = (timestamp - lastUpdate) / 1000; // seconds
      lastUpdate = timestamp;

      moveAccumulator += delta;
      if (moveAccumulator >= 1 / speed) {
        update();
        moveAccumulator = 0;
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      document.removeEventListener('keydown', handleKey);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div>
      <div style={{ color: 'white', fontSize: '24px', marginBottom: '10px', textAlign: 'center' }}>Score: {score}</div>
      <canvas id="gameCanvas" width={640} height={480}
        style={{
          border: '1px solid white',
        }}></canvas>
        <br />
        <br />
        <p style={{textAlign: 'center'}}>press SPACE to pause</p>
    </div>
  );
}