'use client';

import { useEffect } from "react";
import styles from "./page.module.css";

export default function SnakeGame() {
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

    const draw = () => {
      ctx!.clearRect(0, 0, canvas.width, canvas.height);

      // Draw food
      ctx!.fillStyle = 'blueviolet';
      ctx!.fillRect(food.x, food.y, gridSize, gridSize);

      // Draw snake
      ctx!.fillStyle = 'red';
      snake.forEach(segment => {
        ctx!.fillRect(segment.x, segment.y, gridSize, gridSize);
      });
    };

    const update = () => {
      const head = {
        x: snake[0].x + direction.x * gridSize,
        y: snake[0].y + direction.y * gridSize,
      };
      snake.unshift(head);

      // Eat food
      if (head.x === food.x && head.y === food.y) {
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
      }

      draw();
    };

    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': direction = { x: 0, y: -1 }; break;
        case 'ArrowDown': direction = { x: 0, y: 1 }; break;
        case 'ArrowLeft': direction = { x: -1, y: 0 }; break;
        case 'ArrowRight': direction = { x: 1, y: 0 }; break;
      }
    };

    document.addEventListener('keydown', handleKey);

    const gameLoop = (timestamp: number) => {
      if (!lastUpdate) lastUpdate = timestamp;
      const delta = (timestamp - lastUpdate) / 1000; // seconds
      lastUpdate = timestamp;

      moveAccumulator += delta;
      if (moveAccumulator >= 1 / speed) {
        update();
        moveAccumulator = 0;
      }

      requestAnimationFrame(gameLoop);
    };

    requestAnimationFrame(gameLoop);

    return () => {
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  return (
    <div className={styles.page}
      style={{
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <canvas id="gameCanvas" width={640} height={480}
        style={{
          border: '1px solid white',
        }}></canvas>
    </div>
  );
}