

import Database from "better-sqlite3";
import { join } from "path";

// Ensure this file is server-only
export const db = new Database(
  join(process.cwd(), "data.sqlite"),
  // { verbose: console.log }
);

// Optional but recommended
db.pragma("journal_mode = WAL");