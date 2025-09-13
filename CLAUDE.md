# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interactive swim lane diagram visualizer with a swimming pool theme. Built with Vite, vanilla JavaScript ES6 modules, and SVG graphics. Features JSON import/export, visual editing, and pool-themed animations.

## Commands

### Development
- `npm run dev` - Start Vite dev server on port 3000
- `npm run build` - Build for production to `dist/`
- `npm run preview` - Preview production build

### Testing
- `npm test` - Run Jest unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run test:e2e` - Run Playwright E2E tests

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run typecheck` - TypeScript type checking (no emit)
- `npm run format` - Format with Prettier
- `npm run format:check` - Check Prettier formatting

## Architecture

### Module System
ES6 modules with Vite bundling. Entry point is `index.html` which loads `src/app.js`.

### Core Components
- **SwimLaneApp** (`src/app.js`): Main application class that initializes all components
- **SwimLaneRenderer** (`src/components/diagram/SwimLane.js`): SVG rendering and lane management
- **DiagramEditor** (`src/components/editor/Editor.js`): Node editing and interaction handling
- **DiagramControls** (`src/components/controls/Controls.js`): Toolbar and control panel
- **ProcessParser** (`src/core/utils/parser.js`): JSON parsing and validation
- **ProcessExporter** (`src/lib/export/exporter.js`): Export to JSON/PNG/SVG

### Path Aliases
Configured in both Vite and TypeScript:
- `@/` → `src/`
- `@components/` → `src/components/`
- `@core/` → `src/core/`
- `@lib/` → `src/lib/`
- `@styles/` → `src/styles/`

### Data Structure
Process definitions use this JSON format:
```json
{
  "title": "Process Name",
  "lanes": [
    {
      "id": "lane_1",
      "name": "Department",
      "color": "#64b5f6",
      "nodes": [
        {
          "id": "node_1",
          "text": "Task",
          "type": "process|start|decision|end",
          "position": { "x": 100, "y": 50 }
        }
      ]
    }
  ],
  "connections": [
    {
      "from": "node_1",
      "to": "node_2",
      "label": "Flow Label"
    }
  ]
}
```

## Development Notes

### TypeScript Configuration
- Strict mode enabled with all strict checks
- Allows JavaScript files with type checking (`allowJs: true`, `checkJs: true`)
- Path aliases must match Vite config

### Testing Setup
- Jest for unit tests with jsdom environment
- Tests excluded from TypeScript compilation
- Test files: `*.test.js`, `*.spec.js`
- Coverage reports in `coverage/`

### Build Process
- Vite bundles to `dist/` with source maps
- CSS output as `swimlanes.css`
- Terser minification with console/debugger removal
- Legacy browser support via @vitejs/plugin-legacy

### Git Hooks
- Husky configured for pre-commit hooks
- Lint-staged runs ESLint and Prettier on staged files
- Commitlint enforces conventional commits