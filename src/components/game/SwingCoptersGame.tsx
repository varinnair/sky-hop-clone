import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Character } from './Character';
import { Platform } from './Platform';
import { Hammer } from './Hammer';
import { Cloud } from './Cloud';
import { ScoreDisplay } from './ScoreDisplay';
import { GameOver } from './GameOver';
import { StartScreen } from './StartScreen';
import { useGameLoop } from '@/hooks/useGameLoop';

const createCloudSeed = (screenWidth: number) => [
  { x: 20, y: 100, scale: 0.8 },
  { x: screenWidth - 150, y: 250, scale: 1 },
  { x: 50, y: 450, scale: 0.6 },
  { x: screenWidth - 120, y: 550, scale: 0.9 },
  { x: 30, y: 700, scale: 0.7 },
];

const getWindowDimensions = () => ({
  width: Math.min(window.innerWidth, 420),
  height: window.innerHeight,
});

export const SwingCoptersGame: React.FC = () => {
  const [dimensions, setDimensions] = useState({ width: 360, height: 640 });

  const { gameState, highScore, startGame, handleTap, setDirection, restartGame } = useGameLoop(
    dimensions.width,
    dimensions.height
  );

  const handleResize = useCallback(() => {
    setDimensions(getWindowDimensions());
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  const handleInput = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (gameState.gameStatus === 'idle') {
      startGame();
      return;
    }
    if (gameState.gameStatus === 'playing') {
      handleTap();
    }
  }, [gameState.gameStatus, handleTap, startGame]);

  const handleArrowKey = useCallback((e: KeyboardEvent) => {
    if (e.code !== 'ArrowLeft' && e.code !== 'ArrowRight') {
      return;
    }
    e.preventDefault();
    setDirection(e.code === 'ArrowLeft' ? -1 : 1);
  }, [setDirection]);

  useEffect(() => {
    window.addEventListener('keydown', handleArrowKey);
    return () => window.removeEventListener('keydown', handleArrowKey);
  }, [handleArrowKey]);

  const clouds = useMemo(() => createCloudSeed(dimensions.width), [dimensions.width]);

  const renderClouds = () =>
    clouds.map((cloud, i) => (
      <Cloud
        key={i}
        x={cloud.x}
        y={(cloud.y + gameState.scrollOffset * 0.2) % (dimensions.height + 100)}
        scale={cloud.scale}
      />
    ));

  const renderPlatformsAndCharacter = () => (
    <>
      {gameState.platforms.map(platform => {
        const screenY = platform.y + gameState.scrollOffset;

        if (screenY < -100 || screenY > dimensions.height + 100) {
          return null;
        }

        return (
          <React.Fragment key={platform.id}>
            <Platform
              y={screenY}
              gapX={platform.gapX}
              gapWidth={platform.gapWidth}
              screenWidth={dimensions.width}
            />
            <Hammer
              x={platform.gapX + platform.gapWidth / 2}
              y={screenY + 24}
              angle={platform.hammerAngle}
              side="left"
            />
          </React.Fragment>
        );
      })}
      <Character
        x={gameState.characterX}
        y={gameState.characterY}
        rotation={gameState.characterRotation}
        propellerAngle={gameState.propellerAngle}
      />
    </>
  );

  const renderHUD = () => {
    if (gameState.gameStatus === 'playing') {
      return <ScoreDisplay score={gameState.score} />;
    }
    if (gameState.gameStatus === 'idle') {
      return <StartScreen onStart={startGame} />;
    }
    if (gameState.gameStatus === 'gameover') {
      return <GameOver score={gameState.score} highScore={highScore} onRestart={restartGame} />;
    }
    return null;
  };

  return (
    <div
      className="relative overflow-hidden mx-auto"
      style={{
        width: dimensions.width,
        height: dimensions.height,
        backgroundColor: 'hsl(var(--game-sky))',
        touchAction: 'none',
      }}
      onTouchStart={handleInput}
      onMouseDown={handleInput}
    >
      {renderClouds()}

      {gameState.gameStatus !== 'idle' && renderPlatformsAndCharacter()}

      {renderHUD()}
    </div>
  );
};
