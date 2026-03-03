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

Automatic builds for macOS (ARM + Intel) and Windows are triggered by GitHub Actions when you push a tag matching `app-v*`.

### Required Secrets

Configure these in **Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `TAURI_SIGNING_PRIVATE_KEY` | Private key for signing update bundles (`tauri signer generate`) |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Password for the private key (empty string if none) |
| `GITHUB_TOKEN` | Auto-provided by GitHub Actions — no setup needed |

### Release Process

The CI/CD pipeline is triggered by git tags matching the pattern `app-v*` (e.g., `app-v0.1.0`). To perform a release:

1. **Bump Version**: Update the `version` field in `apps/desktop/src-tauri/tauri.conf.json`.

2. **Commit Changes**: Push the version bump to `main`:
   ```bash
   git add apps/desktop/src-tauri/tauri.conf.json
   git commit -m "release: v0.2.0"
   git push origin main
   ```

3. **Tag and Push**: Create a new git tag and push it to the repository:
   ```bash
   git tag app-v0.2.0
   git push origin app-v0.2.0
   ```

4. **Monitor Build**: GitHub Actions will build artifacts for macOS (ARM + Intel) and Windows in parallel.

5. **Review Draft**: A **draft** release named "Atomic v0.2.0" will be created automatically in the GitHub repository. Review the release notes and artifacts, then publish it when ready.

> [!TIP]
> To generate a new signing keypair for updates, run:
> `cargo tauri signer generate -w ~/.tauri/atomic.key`
