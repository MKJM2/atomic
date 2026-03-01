# Atomic Journal

Atomic is a high-performance, minimalist desktop journaling application built with Tauri, React, and SQLite.

## Features

- **Blazing Fast**: Infinitely virtualized timeline for smooth scrolling through thousands of entries.
- **Privacy First**: Local-first data storage with SQLite.
- **Smart Search**: Trigram-based full-text search (FTS5) for instant retrieval.
- **Minimalist Aesthetic**: Focused on typography and distraction-free writing.
- **Seamless Updates**: Integrated auto-updater for macOS and Windows.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/)

### Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:MKJM2/atomic.git
   cd atomic
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start development mode:
   ```bash
   pnpm dev
   ```

## Architecture

This project is a pnpm workspace monorepo:

- `apps/desktop`: The primary Tauri + React application.
- `packages/ui`: Shared, stateless UI components.
- `packages/db`: SQLite persistence layer.
- `packages/core`: Shared logic and interfaces.

## CI/CD

Automatic builds for macOS and Windows are handled via GitHub Actions on every push to the `main` branch. 

To enable signing for releases, ensure the following secrets are configured in your repository:
- `TAURI_SIGNING_PRIVATE_KEY`
- `GITHUB_TOKEN`
