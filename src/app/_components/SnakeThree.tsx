/* src/app/_components/SnakeThree.tsx */
'use client';

import { useEffect, useState, useRef, type CSSProperties } from "react";
import * as THREE from "three";

// --- Constants ---
const CELL_SIZE = 1; // Size of one grid cell in 3D units
const GAME_SPEED = 8; // Moves per second
const LAYOUT_GRID_SIZE = 20;

// Colors matching the original theme but adapted for 3D materials
const COLOR_SNAKE_HEAD = 0x104e8b;
const COLOR_SNAKE_BODY = 0x9cb3c9;
const COLOR_FOOD = 0x58d163;
const COLOR_FLOOR_1 = '#000000';
const COLOR_FLOOR_2 = '#000000';

export default function SnakeThree() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gridSize, setGridSize] = useState({ width: 32, height: 24 });
  const [containerStyle, setContainerStyle] = useState<CSSProperties>({
    position: 'relative',
    width: '100%',
    maxWidth: '800px',
    marginBottom: '40px',
    aspectRatio: '4/3',
  });

  // Mutable game state to avoid re-renders during the game loop
  const gameState = useRef({
    snake: [{ x: 16, y: 12 }],
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    food: { x: 24, y: 12 },
    running: true,
    lastUpdate: 0,
    moveAccumulator: 0,
    isPaused: false,
    isGameOver: false,
  });

  useEffect(() => {
    const handleLayoutResize = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        const pixelWidth = Math.min(window.innerWidth - 32, 400);
        const gw = Math.floor(pixelWidth / LAYOUT_GRID_SIZE);
        let pixelHeight = Math.max(Math.floor((window.innerHeight * 0.65) / LAYOUT_GRID_SIZE) * LAYOUT_GRID_SIZE, 500);
        pixelHeight = Math.min(pixelHeight, 800);
        const gh = Math.floor(pixelHeight / LAYOUT_GRID_SIZE);

        setGridSize({ width: gw, height: gh });
        setContainerStyle({
          position: 'relative',
          width: '100%',
          maxWidth: '400px',
          height: `${pixelHeight}px`,
          marginBottom: '40px',
        });
      } else {
        setGridSize({ width: 32, height: 24 });
        setContainerStyle({
          position: 'relative',
          width: '100%',
          maxWidth: '800px',
          marginBottom: '40px',
          aspectRatio: '4/3',
        });
      }
    };
    handleLayoutResize();
    window.addEventListener('resize', handleLayoutResize);
    return () => window.removeEventListener('resize', handleLayoutResize);
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    const BOARD_WIDTH = gridSize.width;
    const BOARD_HEIGHT = gridSize.height;

    const container = mountRef.current;

    // --- Three.js Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);
    // Add some fog for depth
    scene.fog = new THREE.Fog(0x111111, 40, 80);

    // Initial dummy values, will be fixed by ResizeObserver immediately
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    // Position camera for an angled top-down view
    camera.position.set(0, 0, 32);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    // Don't set initial size here; ResizeObserver will handle it when dimensions are valid
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, -10, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    scene.add(dirLight);

    // --- Objects ---
    const boardGroup = new THREE.Group();
    scene.add(boardGroup);

    // Floor (Checkerboard)
    const geometryPlane = new THREE.PlaneGeometry(CELL_SIZE, CELL_SIZE);
    const materialFloor1 = new THREE.MeshStandardMaterial({ color: COLOR_FLOOR_1, roughness: 0.8 });
    const materialFloor2 = new THREE.MeshStandardMaterial({ color: COLOR_FLOOR_2, roughness: 0.8 });

    // Center the board
    const offsetX = -(BOARD_WIDTH * CELL_SIZE) / 2 + CELL_SIZE / 2;
    const offsetY = -(BOARD_HEIGHT * CELL_SIZE) / 2 + CELL_SIZE / 2;

    for (let x = 0; x < BOARD_WIDTH; x++) {
      for (let y = 0; y < BOARD_HEIGHT; y++) {
        const isEven = (x + y) % 2 === 0;
        const tile = new THREE.Mesh(geometryPlane, isEven ? materialFloor1 : materialFloor2);
        tile.position.set(offsetX + x * CELL_SIZE, offsetY + y * CELL_SIZE, 0);
        tile.receiveShadow = true;
        boardGroup.add(tile);
      }
    }

    // Reuse geometries and materials for performance
    const snakeGeometry = new THREE.BoxGeometry(CELL_SIZE * 0.9, CELL_SIZE * 0.9, CELL_SIZE * 0.9);
    const snakeHeadMaterial = new THREE.MeshStandardMaterial({ color: COLOR_SNAKE_HEAD, roughness: 0.4 });
    const snakeBodyMaterial = new THREE.MeshStandardMaterial({ color: COLOR_SNAKE_BODY, roughness: 0.4 });
    
    const foodGeometry = new THREE.SphereGeometry(CELL_SIZE * 0.4, 16, 16);
    const foodMaterial = new THREE.MeshStandardMaterial({ 
      color: COLOR_FOOD, 
      emissive: COLOR_FOOD, 
      emissiveIntensity: 0.5 
    });

    // Dynamic objects containers
    const snakeMeshes: THREE.Mesh[] = [];
    let foodMesh: THREE.Mesh;

    // Helper: Grid to World Coordinates
    const gridToWorld = (gx: number, gy: number, z = 0) => {
      return new THREE.Vector3(
        offsetX + gx * CELL_SIZE,
        offsetY + gy * CELL_SIZE,
        z
      );
    };

    // Initialize Food
    foodMesh = new THREE.Mesh(foodGeometry, foodMaterial);
    foodMesh.castShadow = true;
    scene.add(foodMesh);

    // --- Logic ---
    const spawnFood = () => {
      let valid = false;
      let newFood = { x: 0, y: 0 };
      while (!valid) {
        newFood.x = Math.floor(Math.random() * BOARD_WIDTH);
        newFood.y = Math.floor(Math.random() * BOARD_HEIGHT);
        // Check collision
        valid = !gameState.current.snake.some(s => s.x === newFood.x && s.y === newFood.y);
      }
      gameState.current.food = newFood;
      const pos = gridToWorld(newFood.x, newFood.y, CELL_SIZE / 2);
      foodMesh.position.copy(pos);
    };

    const updateMeshes = () => {
      // Sync Snake Meshes
      const snake = gameState.current.snake;
      
      // Add missing meshes
      while (snakeMeshes.length < snake.length) {
        const isHead = snakeMeshes.length === 0;
        const mesh = new THREE.Mesh(snakeGeometry, isHead ? snakeHeadMaterial : snakeBodyMaterial);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        snakeMeshes.push(mesh);
      }

      // Remove extra meshes (shouldn't happen in normal gameplay, but good for reset)
      while (snakeMeshes.length > snake.length) {
        const mesh = snakeMeshes.pop();
        if (mesh) scene.remove(mesh);
      }

      // Update positions
      for (let i = 0; i < snake.length; i++) {
        const pos = gridToWorld(snake[i].x, snake[i].y, CELL_SIZE / 2);
        snakeMeshes[i].position.copy(pos);
        // Ensure head material is correct if snake was reset
        if (i === 0) snakeMeshes[i].material = snakeHeadMaterial;
        else snakeMeshes[i].material = snakeBodyMaterial;
      }
    };

    const resetGame = () => {
      gameState.current.snake = [{ x: Math.floor(BOARD_WIDTH / 2), y: Math.floor(BOARD_HEIGHT / 2) }];
      gameState.current.direction = { x: 1, y: 0 };
      gameState.current.nextDirection = { x: 1, y: 0 };
      gameState.current.isGameOver = false;
      gameState.current.isPaused = false;
      
      setScore(0);
      setIsGameOver(false);
      setIsPaused(false);
      
      spawnFood();
      updateMeshes();
    };

    const update = () => {
      const { snake, direction, food } = gameState.current;
      const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

      // Check walls
      if (head.x < 0 || head.x >= BOARD_WIDTH || head.y < 0 || head.y >= BOARD_HEIGHT) {
        gameState.current.isGameOver = true;
        setIsGameOver(true);
        return;
      }

      // Check self collision
      if (snake.some(s => s.x === head.x && s.y === head.y)) {
        gameState.current.isGameOver = true;
        setIsGameOver(true);
        return;
      }

      snake.unshift(head);

      if (head.x === food.x && head.y === food.y) {
        setScore(s => s + 1);
        spawnFood();
        // Don't pop tail -> grow
      } else {
        snake.pop();
      }

      updateMeshes();
    };

    // --- Inputs ---
    const handleKey = (e: KeyboardEvent) => {
      if (gameState.current.isGameOver) {
        if (e.key === 'Enter') resetGame();
        return;
      }

      if (e.key === ' ' || e.key.toLowerCase() === 'p') {
        gameState.current.isPaused = !gameState.current.isPaused;
        setIsPaused(gameState.current.isPaused);
        return;
      }

      if (gameState.current.isPaused) return;

      const { direction, nextDirection } = gameState.current;
      let newDir = nextDirection;

      switch (e.key) {
        case 'ArrowUp':
          if (direction.y === 0) newDir = { x: 0, y: 1 }; // In 3D Y is up on the board (2D plane logic)
          break;
        case 'ArrowDown':
          if (direction.y === 0) newDir = { x: 0, y: -1 };
          break;
        case 'ArrowLeft':
          if (direction.x === 0) newDir = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
          if (direction.x === 0) newDir = { x: 1, y: 0 };
          break;
      }
      gameState.current.nextDirection = newDir;
    };

    // --- Touch Controls (Simplified) ---
    let touchStartX = 0;
    let touchStartY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        
        // Tap to pause
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
           if(gameState.current.isGameOver) resetGame();
           else {
             gameState.current.isPaused = !gameState.current.isPaused;
             setIsPaused(gameState.current.isPaused);
           }
           return;
        }

        const { direction } = gameState.current;
        // Invert dy because screen coords Y grows down, world Y grows up
        const swipeY = -dy; 

        if (Math.abs(dx) > Math.abs(swipeY)) {
            if (dx > 0 && direction.x === 0) gameState.current.nextDirection = { x: 1, y: 0 };
            else if (dx < 0 && direction.x === 0) gameState.current.nextDirection = { x: -1, y: 0 };
        } else {
            if (swipeY > 0 && direction.y === 0) gameState.current.nextDirection = { x: 0, y: 1 };
            else if (swipeY < 0 && direction.y === 0) gameState.current.nextDirection = { x: 0, y: -1 };
        }
    };

    window.addEventListener('keydown', handleKey);
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    // --- Loop ---
    let reqId: number;
    const animate = (time: number) => {
      reqId = requestAnimationFrame(animate);

      if (!gameState.current.running) return;

      const delta = (time - gameState.current.lastUpdate) / 1000;
      if (delta < 0.2) { // prevent jump on tab switch
          if (!gameState.current.isPaused && !gameState.current.isGameOver) {
              gameState.current.moveAccumulator += delta;
              
              // Rotate food for fun
              if(foodMesh) {
                  foodMesh.rotation.z += delta * 2;
                  foodMesh.rotation.x += delta;
              }
          }
      }
      gameState.current.lastUpdate = time;

      if (gameState.current.moveAccumulator >= 1 / GAME_SPEED) {
        gameState.current.moveAccumulator = 0;
        // Apply buffered direction
        gameState.current.direction = gameState.current.nextDirection;
        if (!gameState.current.isPaused && !gameState.current.isGameOver) {
          update();
        }
      }

      renderer.render(scene, camera);
    };

    gameState.current.running = true;
    resetGame();
    animate(performance.now());

    // --- Resize Observer ---
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      // Guard against 0 dimensions (e.g. unmounted or hidden)
      if (w === 0 || h === 0) return;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);

      // Adjust camera distance to fit board
      const distH = BOARD_HEIGHT / (2 * Math.tan((camera.fov * Math.PI) / 360));
      const distW = BOARD_WIDTH / (2 * Math.tan((camera.fov * Math.PI) / 360) * camera.aspect);
      camera.position.z = Math.max(distH, distW) + 2; // +2 padding
    };

    // Use ResizeObserver instead of window resize to catch container size updates
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    
    // Initial check
    handleResize();

    // Cleanup
    return () => {
      gameState.current.running = false;
      window.removeEventListener('keydown', handleKey);
      
      resizeObserver.disconnect();
      
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      cancelAnimationFrame(reqId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      
      // Simple dispose
      renderer.dispose();
      geometryPlane.dispose();
      materialFloor1.dispose();
      materialFloor2.dispose();
      snakeGeometry.dispose();
      snakeBodyMaterial.dispose();
      snakeHeadMaterial.dispose();
      foodGeometry.dispose();
      foodMaterial.dispose();
    };
  }, [gridSize]);

  return (
    <div style={containerStyle}>
      {/* 3D Canvas Container */}
      <div ref={mountRef} style={{ width: '100%', height: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333' }} />

      {/* UI Overlay */}
      <div style={{ position: 'absolute', top: -40, left: 0, width: '100%', textAlign: 'center', pointerEvents: 'none', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
        <h2 style={{ margin: 0 }}>Score: {score}</h2>
      </div>

      {(isPaused || isGameOver) && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: 'white', backdropFilter: 'blur(4px)'
        }}>
          {isGameOver ? (
            <>
              <h1 style={{ fontSize: '3rem', margin: '0 0 20px 0' }}>Game Over</h1>
              <p>Final Score: {score}</p>
              <p style={{ marginTop: '20px', opacity: 0.8 }}>Press Enter or Tap to Restart</p>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: '3rem' }}>Paused</h1>
              <p>Press SPACE or Tap to Resume</p>
            </>
          )}
        </div>
      )}
      
      <p style={{ textAlign: 'center', color: '#888', marginTop: '20px', marginBottom: '20px', fontSize: '14px' }}>
         Use Arrow Keys to move • Space to Pause
      </p>
    </div>
  );
}
