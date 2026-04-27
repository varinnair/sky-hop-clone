import {
  CHARACTER_HEIGHT,
  CHARACTER_WIDTH,
  HAMMER_CHAIN_LENGTH,
  HAMMER_HEIGHT,
  HAMMER_WIDTH,
  PLATFORM_HEIGHT,
  PLATFORM_VERTICAL_PADDING,
} from './constants';
import type { Platform } from './types';

export function checkCollision(
  charX: number,
  charY: number,
  platforms: Platform[],
  scrollOffset: number,
  screenWidth: number
): boolean {
  const charLeft = charX - CHARACTER_WIDTH / 2;
  const charRight = charX + CHARACTER_WIDTH / 2;
  const charTop = charY - CHARACTER_HEIGHT / 2;
  const charBottom = charY + CHARACTER_HEIGHT / 2;

  if (charLeft < 0 || charRight > screenWidth) {
    return true;
  }

  for (const platform of platforms) {
    const platformScreenY = platform.y + scrollOffset;
    const platformTop = platformScreenY;
    const platformBottom = platformScreenY + PLATFORM_HEIGHT;

    if (
      platformBottom < charTop - PLATFORM_VERTICAL_PADDING ||
      platformTop > charBottom + PLATFORM_VERTICAL_PADDING
    ) {
      continue;
    }

    if (charBottom > platformTop && charTop < platformBottom) {
      if (charRight < platform.gapX || charLeft > platform.gapX + platform.gapWidth) {
        return true;
      }
    }

    const hammerPivotX = platform.gapX + platform.gapWidth / 2;
    const hammerPivotY = platformScreenY + PLATFORM_HEIGHT;
    const hammerX = hammerPivotX + Math.sin(platform.hammerAngle) * HAMMER_CHAIN_LENGTH;
    const hammerY = hammerPivotY + Math.cos(platform.hammerAngle) * HAMMER_CHAIN_LENGTH;

    const hammerLeft = hammerX - HAMMER_WIDTH / 2;
    const hammerRight = hammerX + HAMMER_WIDTH / 2;
    const hammerTop = hammerY;
    const hammerBottom = hammerY + HAMMER_HEIGHT;

    if (
      charRight > hammerLeft &&
      charLeft < hammerRight &&
      charBottom > hammerTop &&
      charTop < hammerBottom
    ) {
      return true;
    }
  }

  return false;
}
