# Fix FTS5 Datatype Mismatch

## Problem
Migration 2 in `packages/db/src/client.ts` creates FTS5 with `content_rowid='id'` but entries.id is TEXT (UUID), not INTEGER. SQLite requires rowid to be integer, causing datatype mismatch on save.

## Solution
Modify `packages/db/src/client.ts` lines 53-85:
1. Remove `content_rowid='id'` from FTS5 definition
2. Add `id` as regular TEXT column in FTS5
3. Update triggers to use `id` column instead of rowid

## Verify
Run `cargo tauri dev` and save entry - should work without error.