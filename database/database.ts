import * as SQLite from "expo-sqlite";

import { schemaStatements } from "@/database/schema";

const databaseName = "personal-loan-tracker.db";

export const database = SQLite.openDatabaseSync(databaseName);

export function initializeDatabase() {
  database.withTransactionSync(() => {
    for (const statement of schemaStatements) {
      database.execSync(statement);
    }
  });
}
