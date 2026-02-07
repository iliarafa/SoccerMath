# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

```bash
npm install      # Install dependencies
npm run dev      # Start dev server at http://localhost:5173
npm run build    # Production build to dist/
npm run preview  # Preview production build
```

## Architecture

This is a React 18 + Vite game with Capacitor for mobile deployment. Zero external dependencies beyond React.

**Main game logic lives in `src/MathSoccer.jsx`** - a single 720-line component containing:
- Game state machine (menu → difficulty → playing → gameover screens)
- Math problem generation (`genProblem()`)
- Bot AI with difficulty-based timing and error rates (`BOT` config object)
- Player formation positioning with streak-based movement
- Answer processing with turnover/interception/goal logic

**Key game constants:**
- `GOAL_AT = 5` - consecutive correct answers needed to score
- `WIN_AT = 3` - goals needed to win the match
- Bot difficulties defined in `BOT` object with min/max response times and error rates

**State synchronization pattern:** The component uses parallel refs (`activeRef`, `probRef`, `possRef`, etc.) alongside useState to ensure bot timeout callbacks access current values.

**Capacitor config:** `capacitor.config.ts` defines iOS/Android app settings. Build to `dist/` before syncing native projects.
