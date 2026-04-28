import { GRAVITY_X, MAX_VELOCITY_X, HAMMER_MAX_ANGLE, HAMMER_SWING_SPEED, PLATFORM_SPACING, INITIAL_PLATFORM_COUNT } from './constants';
import type { Direction, Platform } from './types';

export interface HorizontalMovementResult {
  characterX: number;
  velocityX: number;
}

export function stepHorizontalMovement(
  characterX: number,
  velocityX: number,
  direction: Direction,
  deltaTime: number,
): HorizontalMovementResult {
  const nextVelocity = clamp(
    velocityX + GRAVITY_X * direction * deltaTime,
    -MAX_VELOCITY_X,
    MAX_VELOCITY_X
  );

  const nextCharacterX = characterX + nextVelocity * deltaTime;

  return {
    characterX: nextCharacterX,
    velocityX: nextVelocity,
  };
}

export function calculateRotationFromVelocity(velocityX: number): number {
  return (velocityX / MAX_VELOCITY_X) * 25;
}

export function stepPlatforms(
  platforms: Platform[],
  scrollOffset: number,
  screenHeight: number,
  charY: number,
  generatePlatform: (id: number, baseY: number) => Platform,
  nowMs: number,
  deltaTime: number,
): { platforms: Platform[]; scoreGain: number } {
  let updatedPlatforms = platforms.map(p => {
    const nextAngle = p.hammerAngle + HAMMER_SWING_SPEED * p.hammerDirection * deltaTime;
    let nextDirection = p.hammerDirection;
    let hammerAngle = nextAngle;

    if (Math.abs(nextAngle) > HAMMER_MAX_ANGLE) {
      nextDirection = -p.hammerDirection;
      hammerAngle = Math.sign(nextAngle) * HAMMER_MAX_ANGLE;
    }

    return {
      ...p,
      hammerAngle,
      hammerDirection: nextDirection,
    };
  });

  let scoreGain = 0;
  updatedPlatforms = updatedPlatforms.map(platform => {
    const platformScreenY = platform.y + scrollOffset;
    if (!platform.passed && platformScreenY > charY) {
      scoreGain += 1;
      return { ...platform, passed: true };
    }
    return platform;
  });

  updatedPlatforms = updatedPlatforms.filter(platform => platform.y + scrollOffset < screenHeight + 100);

  while (updatedPlatforms.length < INITIAL_PLATFORM_COUNT) {
    const highestY = updatedPlatforms.length > 0
      ? Math.min(...updatedPlatforms.map(platform => platform.y))
      : -PLATFORM_SPACING;
    const platformBaseY = highestY - PLATFORM_SPACING;
    const platformId = nowMs + updatedPlatforms.length;
    updatedPlatforms.push(generatePlatform(platformId, platformBaseY));
  }

  return { platforms: updatedPlatforms, scoreGain };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
