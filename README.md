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

Automatic builds for macOS (ARM + Intel) and Windows are triggered by GitHub Actions on every push to the `release` branch. Builds on `main` do **not** trigger releases.

### Required Secrets

Configure these in **Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `TAURI_SIGNING_PRIVATE_KEY` | Private key for signing update bundles (`tauri signer generate`) |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Password for the private key (empty string if none) |
| `GITHUB_TOKEN` | Auto-provided by GitHub Actions — no setup needed |

### Release Process

1. Merge your changes into `main` as usual.

2. When ready to ship, push to the `release` branch:
   ```bash
   git checkout release
   git merge main
   git push origin release
   ```

3. GitHub Actions will build three targets in parallel:
   - macOS ARM (`aarch64-apple-darwin`) → `.dmg`
   - macOS Intel (`x86_64-apple-darwin`) → `.dmg`
   - Windows x64 → `.msi` + `.exe` (NSIS)

4. A **draft** GitHub Release named `Atomic v<version>` is created automatically with all artifacts attached. Review it and publish when ready.

> **Tip**: To generate a signing keypair: `cargo tauri signer generate -w ~/.tauri/atomic.key`
