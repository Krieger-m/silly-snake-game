"use server";

import { db } from "@/lib/data";

export async function seedUsers() {
  // Create table if it doesn't exist
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL,
      score INTEGER NOT NULL
    )
  `).run();

  // Seed data
  const seedData = [
    { id: 1, username: "Alice", score: 120 },
    { id: 2, username: "Bob", score: 95 },
    { id: 3, username: "Charlie", score: 150 },
    { id: 4, username: "Diana", score: 80 },
    { id: 5, username: "Eve", score: 200 },
  ];

  const insert = db.prepare(`
    INSERT OR REPLACE INTO users (id, username, score)
    VALUES (@id, @username, @score)
  `);

  const transaction = db.transaction((rows: typeof seedData) => {
    for (const row of rows) insert.run(row);
  });

  transaction(seedData);

  return { success: true, count: seedData.length };
}