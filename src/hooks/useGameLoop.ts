import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CHARACTER_SCREEN_Y_RATIO,
  SCROLL_SPEED,
} from '@/game/constants';
import { checkCollision } from '@/game/collision';
import { createInitialPlatforms, createPlatform } from '@/game/platforms';
import type { GameState, Platform } from '@/game/types';
import { calculateRotationFromVelocity, stepHorizontalMovement, stepPlatforms } from '@/game/physics';

export const useGameLoop = (screenWidth: number, screenHeight: number) => {
  const [gameState, setGameState] = useState<GameState>({
    characterX: screenWidth / 2,
    characterY: screenHeight * CHARACTER_SCREEN_Y_RATIO,
    characterRotation: 0,
    velocityX: 0,
    direction: 1,
    propellerAngle: 0,
    platforms: [],
    score: 0,
    gameStatus: 'idle',
    scrollOffset: 0,
  });
  
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('swingcopters-highscore');
    return saved ? parseInt(saved, 10) : 0;
  });
  
  const gameStateRef = useRef(gameState);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  
  const generatePlatform = useCallback(
    (id: number, baseY: number): Platform => createPlatform(id, baseY, screenWidth),
    [screenWidth]
  );
  
  const initializeGame = useCallback(() => {
    const platforms = createInitialPlatforms(screenWidth);
    
    setGameState({
      characterX: screenWidth / 2,
      characterY: screenHeight * CHARACTER_SCREEN_Y_RATIO,
      characterRotation: 0,
      velocityX: 0,
      direction: Math.random() > 0.5 ? 1 : -1,
      propellerAngle: 0,
      platforms,
      score: 0,
      gameStatus: 'idle',
      scrollOffset: 0,
    });
  }, [screenWidth, screenHeight]);
  
  const getDeltaTime = useCallback((timestamp: number): number => {
    if (!lastTimeRef.current) {
      lastTimeRef.current = timestamp;
      return 0;
    }
    
    const rawDelta = (timestamp - lastTimeRef.current) / 16.67;
    lastTimeRef.current = timestamp;
    return Math.min(rawDelta, 2);
  }, []);
  
  const trySetDirection = useCallback((direction: -1 | 1) => {
    if (gameStateRef.current.gameStatus !== 'playing') {
      return;
    }
    
    setGameState(prev => {
      if (prev.gameStatus !== 'playing') {
        return prev;
      }
      
      const shouldDampenVelocity = prev.direction !== direction;
      return {
        ...prev,
        direction,
        velocityX: shouldDampenVelocity ? prev.velocityX * 0.2 : prev.velocityX,
      };
    });
  }, []);
  
  const gameLoop = useCallback((timestamp: number) => {
    const deltaTime = getDeltaTime(timestamp);
    if (!deltaTime) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
      return;
    }
    
    const state = gameStateRef.current;
    
    if (state.gameStatus !== 'playing') {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
      return;
    }
    
    // Update propeller animation
    const newPropellerAngle = (state.propellerAngle + 35 * deltaTime) % 360;
    
    const { characterX: newCharacterX, velocityX: newVelocityX } = stepHorizontalMovement(
      state.characterX,
      state.velocityX,
      state.direction,
      deltaTime,
      screenWidth
    );
    
    // Scroll offset increases = platforms move DOWN the screen
    const newScrollOffset = state.scrollOffset + SCROLL_SPEED * deltaTime;
    
    // Calculate character rotation based on velocity
    const platformStep = stepPlatforms(
      state.platforms,
      newScrollOffset,
      screenHeight,
      state.characterY,
      (id, baseY) => generatePlatform(id, baseY),
      Date.now(),
      deltaTime
    );
    
    const charY = state.characterY;
    const newScore = state.score + platformStep.scoreGain;
    const newPlatforms = platformStep.platforms;
    
    const newRotation = calculateRotationFromVelocity(newVelocityX);
    
    // Check collision
    if (checkCollision(newCharacterX, charY, newPlatforms, newScrollOffset, screenWidth)) {
      // Game over
      const finalScore = newScore;
      if (finalScore > highScore) {
        setHighScore(finalScore);
        localStorage.setItem('swingcopters-highscore', finalScore.toString());
      }
      
      setGameState(prev => ({
        ...prev,
        gameStatus: 'gameover',
        score: finalScore,
      }));
      return;
    }
    
    setGameState({
      characterX: newCharacterX,
      characterY: charY,
      characterRotation: newRotation,
      velocityX: newVelocityX,
      direction: state.direction,
      propellerAngle: newPropellerAngle,
      platforms: newPlatforms,
      score: newScore,
      gameStatus: 'playing',
      scrollOffset: newScrollOffset,
    });
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [getDeltaTime, screenHeight, screenWidth, generatePlatform, highScore]);
  
  const startGame = useCallback(() => {
    initializeGame();
    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        gameStatus: 'playing',
      }));
      lastTimeRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }, 50);
  }, [initializeGame, gameLoop]);
  
  const handleTap = useCallback(() => {
    if (gameStateRef.current.gameStatus === 'playing') {
      const nextDirection = gameStateRef.current.direction === 1 ? -1 : 1;
      trySetDirection(nextDirection);
    }
  }, [trySetDirection]);
  
  const restartGame = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
    initializeGame();
    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        gameStatus: 'playing',
      }));
      lastTimeRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }, 100);
  }, [initializeGame, gameLoop]);
  
  useEffect(() => {
    initializeGame();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [initializeGame]);
  
  return {
    gameState,
    highScore,
    startGame,
    handleTap,
    setDirection: trySetDirection,
    restartGame,
  };
};
