export const createLoansTableSql = `
  CREATE TABLE IF NOT EXISTS loans (
    id TEXT PRIMARY KEY NOT NULL,
    borrower_name TEXT NOT NULL,
    principal REAL NOT NULL,
    interest_rate REAL NOT NULL,
    payment_cycle TEXT NOT NULL,
    original_due_day INTEGER,
    current_due_date TEXT NOT NULL,
    unpaid_interest REAL NOT NULL DEFAULT 0,
    credit_balance REAL NOT NULL DEFAULT 0,
    accumulated_profit REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`;

export const createPaymentHistoriesTableSql = `
  CREATE TABLE IF NOT EXISTS payment_histories (
    id TEXT PRIMARY KEY NOT NULL,
    loan_id TEXT NOT NULL,
    type TEXT NOT NULL,
    paid_amount REAL NOT NULL,
    expected_amount REAL NOT NULL,
    unpaid_interest_created REAL NOT NULL DEFAULT 0,
    credit_created REAL NOT NULL DEFAULT 0,
    payment_date TEXT NOT NULL,
    due_cycle_date TEXT NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (loan_id) REFERENCES loans (id)
  );
`;

export const schemaStatements = [
  createLoansTableSql,
  createPaymentHistoriesTableSql
];
