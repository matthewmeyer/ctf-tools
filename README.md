# CTF-Tools

A React + TypeScript application for exploring number sequences and frequency distributions. Built with [Fluent UI v9](https://react.fluentui.dev/).

## Features

- **Random Number Generation** — Generate 1000 random integers (0–10)
- **Custom Formulas** — Apply user-defined formulas using `N` (current), `M` (next), and `I` (index)
- **Derived Sequences** — Iteratively apply formulas to produce child sequences (N=1 to N=10)
- **Ancestor Sequences** — Reconstruct possible parent sequences using inverse operations (N=-1 to N=-10)
- **Frequency Histograms** — Visualize distributions with adjustable bucket counts
- **Statistics** — View mean, min, max, mode bucket, and sequence length

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm start
```

Opens [http://localhost:3000](http://localhost:3000) in your browser with hot reload.

### Testing

```bash
npm test
```

### Build

```bash
npm run build
```

### Formatting

```bash
npm run format          # auto-fix
npm run format:check    # check only
```

## Project Structure

```
src/
  components/   # React components (NumberSeries)
  hooks/        # Custom React hooks
  types/        # TypeScript interfaces and type aliases
  utils/        # Pure utility functions (sequence math, frequency bucketing)
```

## Tech Stack

- **React 19** — UI framework
- **TypeScript** — Type safety with strict mode
- **Fluent UI v9** — Microsoft design system components
- **Create React App** — Build toolchain
- **Jest + Testing Library** — Unit and component testing
- **Prettier + ESLint** — Code formatting and linting
- **Husky + lint-staged** — Pre-commit quality gates
