export const createLoansTableSql = `
  CREATE TABLE IF NOT EXISTS loans (
    id TEXT PRIMARY KEY NOT NULL,
    borrower_name TEXT NOT NULL,
    principal REAL NOT NULL,
    interest_rate REAL NOT NULL,
    payment_cycle TEXT NOT NULL,
    current_due_date TEXT NOT NULL,
    unpaid_interest REAL NOT NULL DEFAULT 0,
    credit_balance REAL NOT NULL DEFAULT 0,
    accumulated_profit REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    closed_at TEXT
  );
`;

export const createPaymentHistoriesTableSql = `
  CREATE TABLE IF NOT EXISTS payment_histories (
    id TEXT PRIMARY KEY NOT NULL,
    loan_id TEXT NOT NULL,
    type TEXT NOT NULL,
    paid_amount REAL DEFAULT 0,
    expected_amount REAL DEFAULT 0,
    unpaid_interest_created REAL NOT NULL DEFAULT 0,
    credit_created REAL NOT NULL DEFAULT 0,
    payment_date TEXT,
    due_cycle_date TEXT,
    note TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (loan_id) REFERENCES loans (id)
  );
`;

export const createActiveBorrowerIndexSql = `
  CREATE UNIQUE INDEX IF NOT EXISTS loans_one_active_borrower_idx
  ON loans (LOWER(TRIM(borrower_name)))
  WHERE status = 'active';
`;

export const schemaStatements = [
  createLoansTableSql,
  createPaymentHistoriesTableSql,
  createActiveBorrowerIndexSql
];
