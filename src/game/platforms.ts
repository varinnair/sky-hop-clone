import {
  GAP_WIDTH,
  HAMMER_MAX_ANGLE,
  INITIAL_PLATFORM_COUNT,
  PLATFORM_SPACING,
  PLATFORM_START_Y,
} from './constants';
import type { Platform } from './types';

export function createPlatform(id: number, baseY: number, screenWidth: number): Platform {
  const minGapX = 50;
  const maxGapX = screenWidth - GAP_WIDTH - 50;
  const gapX = minGapX + Math.random() * (maxGapX - minGapX);

  return {
    id,
    y: baseY,
    gapX,
    gapWidth: GAP_WIDTH,
    hammerAngle: (Math.random() - 0.5) * HAMMER_MAX_ANGLE,
    hammerDirection: Math.random() > 0.5 ? 1 : -1,
    passed: false,
  };
}

export function createInitialPlatforms(screenWidth: number): Platform[] {
  return Array.from({ length: INITIAL_PLATFORM_COUNT }, (_, i) =>
    createPlatform(i, PLATFORM_START_Y - i * PLATFORM_SPACING, screenWidth)
  );
}
