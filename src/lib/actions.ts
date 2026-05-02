// app/actions.ts
"use server";

import { db } from "@/lib/data";

export async function getUsers() {
  const stmt = db.prepare("SELECT * FROM users ORDER BY score DESC");
  return stmt.all();
}

export async function insertUser(name: string, s: number) {
  const newUser = { username: name, score: s };
  const insert = db.prepare(`
    INSERT OR REPLACE INTO users (username, score)
    VALUES (@username, @score)
  `);

  const transaction = db.transaction((user) => {
    insert.run(user);
  });

  transaction(newUser);
}
