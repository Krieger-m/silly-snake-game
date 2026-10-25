"use server";

import { db } from "@/lib/data";

const MAX_HIGH_SCORES = 10;

type UserEntry = {
  id: number;
  username: string;
  score: number;
};

function ensureTable() {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      score INTEGER NOT NULL
    )
  `).run();
}

function seedTableIfEmpty() {
  ensureTable();

  const existing = db
    .prepare("SELECT COUNT(*) as count FROM users")
    .get() as { count: number };

  if (existing.count > 0) return;

  const seedData = [
    { username: "Alice", score: 12 },
    { username: "Bob", score: 9 },
    { username: "Charlie", score: 15 },
    { username: "Diana", score: 8 },
    { username: "Dave", score: 20 },
  ];

  const insert = db.prepare(`
    INSERT INTO users (username, score)
    VALUES (@username, @score)
  `);

  const transaction = db.transaction((rows: typeof seedData) => {
    rows.forEach((row) => insert.run(row));
  });

  transaction(seedData);
}

export async function getUsers() {
  seedTableIfEmpty();

  return db
    .prepare("SELECT * FROM users ORDER BY score DESC LIMIT ?")
    .all(MAX_HIGH_SCORES) as UserEntry[];
}

export async function canSubmitHighScore(score: number) {
  const users = await getUsers();

  if (users.length < MAX_HIGH_SCORES) {
    return true;
  }

  return score > users[users.length - 1].score;
}

export async function insertUser(name: string, score: number) {
  ensureTable();

  const username = name.trim() || "Player";
  const normalizedScore = Number(score);

  if (!Number.isFinite(normalizedScore) || normalizedScore < 0) {
    return { success: false, users: await getUsers() };
  }

  db.prepare(`
    INSERT INTO users (username, score)
    VALUES (@username, @score)
  `).run({
    username,
    score: normalizedScore,
  });

  db.prepare(`
    DELETE FROM users
    WHERE id NOT IN (
      SELECT id
      FROM users
      ORDER BY score DESC
      LIMIT ?
    )
  `).run(MAX_HIGH_SCORES);

  return { success: true, users: await getUsers() };
}

export async function submitHighScore(name: string, score: number) {
  return insertUser(name, score);
}