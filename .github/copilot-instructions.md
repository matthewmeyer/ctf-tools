# Copilot Instructions for ctf-tools

## Project Overview
This is a React + TypeScript app using Fluent UI v9 for building CTF (Capture The Flag) analysis tools. It visualizes number sequences and frequency distributions.

## Tech Stack
- **React 19** with functional components and hooks
- **TypeScript** with strict mode enabled
- **Fluent UI v9** (`@fluentui/react-components`) for all UI components
- **Create React App** as the build toolchain

## Coding Conventions

### TypeScript
- Use strict TypeScript — avoid `any` types
- Prefer `interface` over `type` for object shapes
- Export types from dedicated files in `src/types/`
- Use explicit return types on exported functions

### React Components
- Use functional components exclusively (no class components)
- Use `makeStyles` from Fluent UI for styling (no inline styles except dynamic values)
- Keep components focused — extract logic into custom hooks (`src/hooks/`) and utility functions (`src/utils/`)
- Place each component in `src/components/` as a single file or folder with an index

### Fluent UI
- Always wrap the app in `<FluentProvider>` with a theme
- Use Fluent UI tokens (`tokens.*`) for spacing, colors, and typography — avoid hardcoded CSS values
- Prefer Fluent UI components over native HTML elements when an equivalent exists (e.g., `Button`, `Input`, `Text`)

### File Organization
```
src/
  components/   # React components
  hooks/        # Custom React hooks
  types/        # TypeScript interfaces and types
  utils/        # Pure utility functions (no React dependencies)
```

### Testing
- Write tests alongside components using `*.test.tsx`
- Use `@testing-library/react` for component tests
- Test user-visible behavior, not implementation details

### Code Style
- Prettier is configured — do not override formatting manually
- Use single quotes, trailing commas, semicolons
- Keep functions small and focused
