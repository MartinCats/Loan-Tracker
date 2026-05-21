import * as SQLite from "expo-sqlite";

import { schemaStatements } from "@/database/schema";

const databaseName = "personal-loan-tracker.db";

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(databaseName);
  }

  return databasePromise;
}

export async function initializeDatabase() {
  const database = await getDatabase();

  await database.execAsync("PRAGMA foreign_keys = ON;");

  for (const statement of schemaStatements) {
    await database.execAsync(statement);
  }
}
