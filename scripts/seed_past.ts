import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
    const db = new Database({
        filename: 'apps/desktop/src-tauri/twoline.db',
        driver: sqlite3.Database
    });

    const quotes = [
        "The quieter you become, the more you are able to hear.",
        "Do what you can, with what you have, where you are.",
        "It always seems impossible until it's done.",
        "Success is not final, failure is not fatal.",
        "Happiness is not something ready made."
    ];

    let curr = new Date();
    curr.setDate(curr.getDate() - 10);

    for (let i = 0; i < 50; i++) {
        const dStr = curr.toISOString().split('T')[0];
        const uuid = uuidv4();
        const body = quotes[Math.floor(Math.random() * quotes.length)] + ` (Entry #${50 - i})`;
        const now = new Date().toISOString();

        await db.run(
            `INSERT OR IGNORE INTO entries (id, date, body, created_at, updated_at, is_deleted) 
       VALUES (?, ?, ?, ?, ?, 0)`,
            [uuid, dStr, body, now, now]
        );

        await db.run(
            `INSERT INTO entries_fts(rowid, body) VALUES (?, ?)`,
            [uuid, body]
        );

        curr.setDate(curr.getDate() - 2); // Every other day to test missing gaps!
    }

    console.log("Seeded 50 past entries with gaps!");
}

seed();
