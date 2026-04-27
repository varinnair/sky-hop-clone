export type Direction = 1 | -1;
export type GameStatus = 'idle' | 'playing' | 'gameover';

export interface Platform {
  id: number;
  y: number;
  gapX: number;
  gapWidth: number;
  hammerAngle: number;
  hammerDirection: Direction;
  passed: boolean;
}

export interface GameState {
  characterX: number;
  characterY: number;
  characterRotation: number;
  velocityX: number;
  direction: Direction;
  propellerAngle: number;
  platforms: Platform[];
  score: number;
  gameStatus: GameStatus;
  scrollOffset: number;
}
