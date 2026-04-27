import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CHARACTER_SCREEN_Y_RATIO,
  GRAVITY_X,
  HAMMER_MAX_ANGLE,
  HAMMER_SWING_SPEED,
  INITIAL_PLATFORM_COUNT,
  MAX_VELOCITY_X,
  PLATFORM_SPACING,
  SCROLL_SPEED,
} from '@/game/constants';
import { checkCollision } from '@/game/collision';
import { createInitialPlatforms, createPlatform } from '@/game/platforms';
import type { GameState, Platform } from '@/game/types';

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
  
  const gameLoop = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const deltaTime = Math.min((timestamp - lastTimeRef.current) / 16.67, 2);
    lastTimeRef.current = timestamp;
    
    const state = gameStateRef.current;
    
    if (state.gameStatus !== 'playing') {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
      return;
    }
    
    // Update propeller animation
    const newPropellerAngle = (state.propellerAngle + 35 * deltaTime) % 360;
    
    // Apply horizontal gravity (character swings left/right)
    let newVelocityX = state.velocityX + GRAVITY_X * state.direction * deltaTime;
    newVelocityX = Math.max(-MAX_VELOCITY_X, Math.min(MAX_VELOCITY_X, newVelocityX));
    
    // Update character X position
    const newCharacterX = state.characterX + newVelocityX * deltaTime;
    
    // Scroll offset increases = platforms move DOWN the screen
    const newScrollOffset = state.scrollOffset + SCROLL_SPEED * deltaTime;
    
    // Calculate character rotation based on velocity
    const newRotation = (newVelocityX / MAX_VELOCITY_X) * 25;
    
    // Update hammer swing animations
    let newPlatforms = state.platforms.map(p => {
      let newAngle = p.hammerAngle + HAMMER_SWING_SPEED * p.hammerDirection * deltaTime;
      let newDirection = p.hammerDirection;
      
      if (Math.abs(newAngle) > HAMMER_MAX_ANGLE) {
        newDirection = -p.hammerDirection as 1 | -1;
        newAngle = Math.sign(newAngle) * HAMMER_MAX_ANGLE;
      }
      
      return {
        ...p,
        hammerAngle: newAngle,
        hammerDirection: newDirection,
      };
    });
    
    // Check for score - when platform scrolls past the character
    let newScore = state.score;
    const charY = state.characterY;
    
    newPlatforms = newPlatforms.map(p => {
      const platformScreenY = p.y + newScrollOffset;
      // Platform passed when it goes below the character
      if (!p.passed && platformScreenY > charY) {
        newScore++;
        return { ...p, passed: true };
      }
      return p;
    });
    
    // Remove platforms that are too far below screen and add new ones at top
    newPlatforms = newPlatforms.filter(p => {
      const platformScreenY = p.y + newScrollOffset;
      return platformScreenY < screenHeight + 100;
    });
    
    // Add new platforms at the top
    while (newPlatforms.length < INITIAL_PLATFORM_COUNT) {
      const highestY = Math.min(...newPlatforms.map(p => p.y));
      newPlatforms.push(generatePlatform(
        Date.now() + Math.random() * 1000,
        highestY - PLATFORM_SPACING
      ));
    }
    
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
  }, [screenHeight, screenWidth, generatePlatform, highScore]);
  
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
      setGameState(prev => ({
        ...prev,
        direction: prev.direction === 1 ? -1 : 1,
        velocityX: prev.velocityX * 0.2, // Reduce velocity on direction change for snappier control
      }));
    }
  }, []);
  
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
    restartGame,
  };
};
