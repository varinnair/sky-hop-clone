# Sky Hopper Clone

A small React + TypeScript browser game inspired by Swing Copters.

The player controls a propeller character that climbs through gaps in scrolling platforms while avoiding walls and swinging hammers.

## Run Locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://localhost:5173/
```

Build check:

```bash
npm run build
```

## Project Structure

```text
src/
  components/game/
    SwingCoptersGame.tsx  Main game scene and input event wiring
    Character.tsx         Propeller character rendering
    Platform.tsx          Platform bar rendering
    Hammer.tsx            Swinging hammer rendering
    Cloud.tsx             Background clouds
    StartScreen.tsx       Start overlay
    GameOver.tsx          Game-over overlay
    ScoreDisplay.tsx      Score UI

  game/
    constants.ts          Tunable game constants
    types.ts              Game state and platform types
    platforms.ts          Platform generation helpers
    collision.ts          Wall, platform, and hammer collision checks

  hooks/
    useGameLoop.ts        Main game state, animation loop, scoring, and tap handler

  pages/
    Index.tsx             App entry page that renders the game
```

The generated `components/ui/` folder contains shadcn-style UI primitives. Most of it is not relevant to the game exercise.

## Useful Starting Points

Start with these files:

- `src/components/game/SwingCoptersGame.tsx`
- `src/hooks/useGameLoop.ts`
- `src/game/constants.ts`
- `src/game/collision.ts`
- `src/game/platforms.ts`
- `src/game/types.ts`

## Interview Goal

This codebase is being used as an interview debugging exercise. It builds, but the desktop controls and obstacle layout currently do not feel reliable enough to ship.

Make the game respond consistently to player input on desktop, then consider how the same fix should behave on mobile.

Known behavior to reproduce on desktop:

- Arrow keys are expected to switch direction, but currently do nothing.
- Mouse clicks can switch direction, but the character may still drift into a wall and feel hard to control.
- Some platform gaps feel unfair because a hammer is placed directly in the path.
- The character can keep leaning and moving toward one side even after the user clicks.

Mobile/touch support should be considered, but a real phone is not required during the interview.

The candidate should investigate the input handling and game loop, make a focused fix, and verify the game manually.

## What To Avoid

- Do not hide the problem by disabling wall or hammer collisions.
- Do not rewrite the entire game.
- Do not remove TypeScript checks or use broad `any` types.
- Do not tune constants randomly without explaining what changed.
- Do not rely on build success alone; manually play the game.
