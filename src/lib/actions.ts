// app/actions.ts
"use server";

import { db } from "@/lib/data";

export async function getUsers() {
  const stmt = db.prepare("SELECT * FROM users ORDER BY score DESC");
  return stmt.all();
}

export async function insertUser(id: number, name: string, s: number) {
  const newUser = { id: id, username: name, score: s };
  const insert = db.prepare(`
    INSERT OR REPLACE INTO users (id, username, score)
    VALUES (@id, @username, @score)
  `);

  const transaction = db.transaction((user) => {
    insert.run(user);
  });

  transaction(newUser);
}
