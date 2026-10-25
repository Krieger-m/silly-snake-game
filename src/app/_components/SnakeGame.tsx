"use client";

import { canSubmitHighScore, getUsers, submitHighScore } from "@/lib/actions";
import { FormEvent, useEffect, useRef, useState } from "react";

const GRID_SIZE = 20;
const DEFAULT_CANVAS_WIDTH = 640;
const DEFAULT_CANVAS_HEIGHT = 480;
const GAME_SPEED = 5;

const SNAKE_COLOR_START = "#9cb3c9";
const SNAKE_COLOR_END = "#104e8b";
const FOOD_COLOR = "#58d163";
const TEXT_COLOR = "white";
const PAUSE_OVERLAY_COLOR = "rgba(0, 0, 0, 0.5)";
const GAMEOVER_OVERLAY_COLOR = "rgba(0, 0, 0, 0.7)";
const FONT_LARGE = "40px Arial";
const FONT_MEDIUM = "20px Arial";

type Point = { x: number; y: number };
type Direction = { x: -1 | 0 | 1; y: -1 | 0 | 1 };
type LeaderboardEntry = { username: string; score: number };

export default function SnakeGame() {
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [nameError, setNameError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameOverHandledRef = useRef(false);
  const [dimensions, setDimensions] = useState({
    width: DEFAULT_CANVAS_WIDTH,
    height: DEFAULT_CANVAS_HEIGHT,
  });

  const gameState = useRef({
    snake: [{ x: 160, y: 160 }] as Point[],
    direction: { x: 1, y: 0 } as Direction,
    food: { x: 200, y: 200 } as Point,
    isPaused: false,
    isGameOver: false,
  });

  const refreshLeaderboard = async () => {
    const users = await getUsers();
    setLeaderboard(users as LeaderboardEntry[]);
  };

  const submitScore = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = playerName.trim();
    if (!trimmed) {
      setNameError("Please enter your name.");
      return;
    }

    setIsSubmitting(true);

    const result = await submitHighScore(trimmed, score);
    setLeaderboard((result.users as LeaderboardEntry[]) ?? []);
    setShowNamePrompt(false);
    setPlayerName("");
    setNameError("");
    setIsSubmitting(false);
  };

  useEffect(() => {
    refreshLeaderboard();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;

      if (isMobile) {
        let newWidth = Math.min(window.innerWidth - 32, 400);
        newWidth = Math.floor(newWidth / GRID_SIZE) * GRID_SIZE;

        let newHeight = Math.max(
          Math.floor((window.innerHeight * 0.65) / GRID_SIZE) * GRID_SIZE,
          500,
        );
        newHeight = Math.min(newHeight, 800);

        setDimensions({ width: newWidth, height: newHeight });
      } else {
        setDimensions({ width: DEFAULT_CANVAS_WIDTH, height: DEFAULT_CANVAS_HEIGHT });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastUpdate = 0;
    let moveAccumulator = 0;
    let animationFrameId: number;
    let currentScore = 0;

    const getRandomFoodPosition = (): Point => ({
      x: Math.floor(Math.random() * (canvas.width / GRID_SIZE)) * GRID_SIZE,
      y: Math.floor(Math.random() * (canvas.height / GRID_SIZE)) * GRID_SIZE,
    });

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = FOOD_COLOR;
      ctx.fillRect(gameState.current.food.x, gameState.current.food.y, GRID_SIZE, GRID_SIZE);

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, SNAKE_COLOR_START);
      gradient.addColorStop(1, SNAKE_COLOR_END);
      ctx.fillStyle = gradient;

      gameState.current.snake.forEach((segment) => {
        ctx.fillRect(segment.x, segment.y, GRID_SIZE, GRID_SIZE);
      });
    };

    const drawPausedScreen = () => {
      ctx.fillStyle = PAUSE_OVERLAY_COLOR;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = FONT_LARGE;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Paused", canvas.width / 2, canvas.height / 2);
    };

    const drawGameOverScreen = () => {
      ctx.fillStyle = GAMEOVER_OVERLAY_COLOR;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = FONT_LARGE;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 40);
      ctx.font = FONT_MEDIUM;
      ctx.fillText(`Final Score: ${currentScore}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText("Press Enter to Restart", canvas.width / 2, canvas.height / 2 + 40);
    };

    const restartGame = () => {
      const startX = Math.floor(canvas.width / 2 / GRID_SIZE) * GRID_SIZE;
      const startY = Math.floor(canvas.height / 2 / GRID_SIZE) * GRID_SIZE;

      gameOverHandledRef.current = false;
      setShowNamePrompt(false);
      setNameError("");

      gameState.current = {
        snake: [{ x: startX, y: startY }],
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

      if (head.x === food.x && head.y === food.y) {
        currentScore += 1;
        setScore(currentScore);
        gameState.current.food = getRandomFoodPosition();
      } else {
        snake.pop();
      }

      const selfCollision = snake.slice(1).some(
        (seg) => seg.x === head.x && seg.y === head.y,
      );

      if (
        head.x < 0 ||
        head.x >= canvas.width ||
        head.y < 0 ||
        head.y >= canvas.height ||
        selfCollision
      ) {
        gameState.current.isGameOver = true;
      }

      draw();
    };

    const handleKey = (e: KeyboardEvent) => {
      const { isGameOver, isPaused, direction } = gameState.current;

      if (showNamePrompt) return;

      if (isGameOver) {
        if (e.key === "Enter") restartGame();
        return;
      }

      if (e.key === " " || e.key.toLowerCase() === "p") {
        e.preventDefault();
        gameState.current.isPaused = !isPaused;

        if (!gameState.current.isPaused) {
          lastUpdate = performance.now();
          animationFrameId = requestAnimationFrame(gameLoop);
        }

        return;
      }

      if (isPaused) return;

      let newDirection = direction;

      switch (e.key) {
        case "ArrowUp":
          if (direction.y === 0) newDirection = { x: 0, y: -1 };
          break;
        case "ArrowDown":
          if (direction.y === 0) newDirection = { x: 0, y: 1 };
          break;
        case "ArrowLeft":
          if (direction.x === 0) newDirection = { x: -1, y: 0 };
          break;
        case "ArrowRight":
          if (direction.x === 0) newDirection = { x: 1, y: 0 };
          break;
      }

      gameState.current.direction = newDirection;
    };

    const handleGameOver = async (finalScore: number) => {
      if (gameOverHandledRef.current) return;
      gameOverHandledRef.current = true;

      const qualifies = await canSubmitHighScore(finalScore);

      if (qualifies) {
        setPlayerName("");
        setNameError("");
        setShowNamePrompt(true);
        return;
      }

      await refreshLeaderboard();
    };

    document.addEventListener("keydown", handleKey);

    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();

      if (gameState.current.isGameOver) {
        restartGame();
        return;
      }

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;

      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
        gameState.current.isPaused = !gameState.current.isPaused;
        if (!gameState.current.isPaused) {
          lastUpdate = performance.now();
          animationFrameId = requestAnimationFrame(gameLoop);
        }
        return;
      }

      if (gameState.current.isPaused) return;

      const { direction } = gameState.current;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && direction.x === 0) gameState.current.direction = { x: 1, y: 0 };
        else if (dx < 0 && direction.x === 0) gameState.current.direction = { x: -1, y: 0 };
      } else {
        if (dy > 0 && direction.y === 0) gameState.current.direction = { x: 0, y: 1 };
        else if (dy < 0 && direction.y === 0) gameState.current.direction = { x: 0, y: -1 };
      }
    };

    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd);

    const gameLoop = (timestamp: number) => {
      if (gameState.current.isGameOver) {
        if (!gameOverHandledRef.current) {
          void handleGameOver(currentScore);
        }

        drawGameOverScreen();
        return;
      }

      if (gameState.current.isPaused) {
        drawPausedScreen();
        return;
      }

      if (!lastUpdate) lastUpdate = timestamp;
      const delta = (timestamp - lastUpdate) / 1000;
      lastUpdate = timestamp;

      moveAccumulator += delta;
      if (moveAccumulator >= 1 / GAME_SPEED) {
        update();
        moveAccumulator = 0;
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    restartGame();

    return () => {
      document.removeEventListener("keydown", handleKey);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);

      cancelAnimationFrame(animationFrameId);
    };
  }, [dimensions]);

  return (
    <div>
      <div
        style={{
          color: TEXT_COLOR,
          fontSize: "24px",
          marginBottom: "10px",
          textAlign: "center",
        }}
      >
        Score: {score}
      </div>

      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{
          border: "1px solid white",
          touchAction: "none",
        }}
      />

      <div style={{ textAlign: "center", marginTop: "12px" }}>
        <p style={{ color: TEXT_COLOR }}>press SPACE to pause</p>
      </div>

      {showNamePrompt && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "grid",
            placeItems: "center",
            zIndex: 10,
          }}
        >
          <form
            onSubmit={submitScore}
            style={{
              background: "#0f172a",
              border: "1px solid #cbd5e1",
              borderRadius: "12px",
              padding: "20px",
              width: "min(90vw, 320px)",
              color: TEXT_COLOR,
            }}
          >
            <h3 style={{ marginTop: 0, textAlign: "center" }}>New Highscore!</h3>
            <p style={{ textAlign: "center", marginBottom: "12px" }}>
              You scored {score} points.
            </p>

            <label
              htmlFor="player-name"
              style={{ display: "block", marginBottom: "8px" }}
            >
              Enter your name
            </label>

            <input
              id="player-name"
              value={playerName}
              onChange={(event) => {
                setPlayerName(event.target.value);
                if (nameError) setNameError("");
              }}
              placeholder="Player"
              autoFocus
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #64748b",
                marginBottom: "10px",
                boxSizing: "border-box",
              }}
            />

            {nameError && (
              <p style={{ color: "#fca5a5", margin: "0 0 8px" }}>{nameError}</p>
            )}

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  background: "#16a34a",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 16px",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                }}
              >
                {isSubmitting ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {leaderboard.length > 0 && (
        <div
          style={{
            marginTop: "20px",
            maxWidth: "320px",
            marginInline: "auto",
            color: TEXT_COLOR,
          }}
        >
          <h3 style={{ textAlign: "center", marginBottom: "8px" }}>Highscores</h3>
          {leaderboard.map((entry, index) => (
            <div
              key={`${entry.username}-${index}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px solid rgba(255,255,255,0.2)",
                padding: "6px 0",
              }}
            >
              <span>
                {index + 1}. {entry.username}
              </span>
              <strong>{entry.score}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}