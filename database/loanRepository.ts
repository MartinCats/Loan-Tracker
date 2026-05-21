import { getDatabase, initializeDatabase } from "@/database/database";
import type { Loan, LoanStatus, PaymentCycle } from "@/types/loan";

type LoanRow = {
  id: string;
  borrower_name: string;
  principal: number;
  interest_rate: number;
  payment_cycle: PaymentCycle;
  current_due_date: string;
  unpaid_interest: number;
  credit_balance: number;
  accumulated_profit: number;
  status: LoanStatus;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
};

export type CreateLoanInput = {
  id: string;
  borrowerName: string;
  principal: number;
  interestRate: number;
  paymentCycle: PaymentCycle;
  currentDueDate: string;
  unpaidInterest?: number;
  creditBalance?: number;
  accumulatedProfit?: number;
  status?: LoanStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type UpdateLoanInput = Partial<Omit<Loan, "id" | "createdAt">> & {
  id: string;
};

export async function createLoan(input: CreateLoanInput) {
  await initializeDatabase();
  validateCreateLoanInput(input);

  const database = await getDatabase();
  const now = new Date().toISOString();
  const createdAt = input.createdAt ?? now;
  const updatedAt = input.updatedAt ?? now;
  const status = input.status ?? "active";

  if (status === "active") {
    await assertBorrowerHasNoActiveLoan(input.borrowerName);
  }

  await database.runAsync(
    `
      INSERT INTO loans (
        id,
        borrower_name,
        principal,
        interest_rate,
        payment_cycle,
        current_due_date,
        unpaid_interest,
        credit_balance,
        accumulated_profit,
        status,
        created_at,
        updated_at,
        closed_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL);
    `,
    [
      input.id,
      input.borrowerName.trim(),
      input.principal,
      input.interestRate,
      input.paymentCycle,
      input.currentDueDate,
      input.unpaidInterest ?? 0,
      input.creditBalance ?? 0,
      input.accumulatedProfit ?? 0,
      status,
      createdAt,
      updatedAt
    ]
  );

  const loan = await getLoanById(input.id);

  if (!loan) {
    throw new Error("Loan was created but could not be loaded.");
  }

  return loan;
}

export async function getLoanById(id: string) {
  await initializeDatabase();

  const database = await getDatabase();
  const row = await database.getFirstAsync<LoanRow>(
    "SELECT * FROM loans WHERE id = ? LIMIT 1;",
    [id]
  );

  return row ? mapLoanRow(row) : null;
}

export async function getActiveLoans() {
  return getLoansByStatus("active");
}

export async function getArchivedLoans() {
  await initializeDatabase();

  const database = await getDatabase();
  const rows = await database.getAllAsync<LoanRow>(
    "SELECT * FROM loans WHERE status IN ('archived', 'closed') ORDER BY updated_at DESC;"
  );

  return rows.map(mapLoanRow);
}

export async function updateLoan(input: UpdateLoanInput) {
  await initializeDatabase();

  if (!input.id) {
    throw new Error("Loan id is required.");
  }

  const currentLoan = await getLoanById(input.id);

  if (!currentLoan) {
    throw new Error(`Loan not found: ${input.id}`);
  }

  const nextLoan: Loan = {
    ...currentLoan,
    ...input,
    updatedAt: input.updatedAt ?? new Date().toISOString()
  };

  validateLoanValues(nextLoan);

  if (nextLoan.status === "active") {
    await assertBorrowerHasNoActiveLoan(nextLoan.borrowerName, nextLoan.id);
  }

  const database = await getDatabase();

  await database.runAsync(
    `
      UPDATE loans
      SET
        borrower_name = ?,
        principal = ?,
        interest_rate = ?,
        payment_cycle = ?,
        current_due_date = ?,
        unpaid_interest = ?,
        credit_balance = ?,
        accumulated_profit = ?,
        status = ?,
        updated_at = ?,
        closed_at = ?
      WHERE id = ?;
    `,
    [
      nextLoan.borrowerName.trim(),
      nextLoan.principal,
      nextLoan.interestRate,
      nextLoan.paymentCycle,
      nextLoan.currentDueDate,
      nextLoan.unpaidInterest,
      nextLoan.creditBalance,
      nextLoan.accumulatedProfit,
      nextLoan.status,
      nextLoan.updatedAt,
      nextLoan.closedAt ?? null,
      nextLoan.id
    ]
  );

  return getLoanById(nextLoan.id);
}

export async function closeLoan(id: string, closedAt = new Date().toISOString()) {
  const updatedLoan = await updateLoan({
    id,
    status: "closed",
    closedAt,
    updatedAt: closedAt
  });

  if (!updatedLoan) {
    throw new Error(`Loan not found: ${id}`);
  }

  return updatedLoan;
}

export async function deleteLoan(id: string) {
  await initializeDatabase();

  const database = await getDatabase();

  await database.runAsync("DELETE FROM loans WHERE id = ?;", [id]);
}

async function getLoansByStatus(status: LoanStatus) {
  await initializeDatabase();

  const database = await getDatabase();
  const rows = await database.getAllAsync<LoanRow>(
    "SELECT * FROM loans WHERE status = ? ORDER BY current_due_date ASC;",
    [status]
  );

  return rows.map(mapLoanRow);
}

async function assertBorrowerHasNoActiveLoan(borrowerName: string, exceptLoanId?: string) {
  const database = await getDatabase();
  const normalizedName = normalizeBorrowerName(borrowerName);
  const existingLoan = await database.getFirstAsync<{ id: string }>(
    `
      SELECT id
      FROM loans
      WHERE LOWER(TRIM(borrower_name)) = ?
        AND status = 'active'
        AND (? IS NULL OR id != ?)
      LIMIT 1;
    `,
    [normalizedName, exceptLoanId ?? null, exceptLoanId ?? null]
  );

  if (existingLoan) {
    throw new Error(`Borrower "${borrowerName.trim()}" already has an active loan.`);
  }
}

function validateCreateLoanInput(input: CreateLoanInput) {
  if (!input.id.trim()) {
    throw new Error("Loan id is required.");
  }

  validateLoanValues({
    id: input.id,
    borrowerName: input.borrowerName,
    principal: input.principal,
    interestRate: input.interestRate,
    paymentCycle: input.paymentCycle,
    currentDueDate: input.currentDueDate,
    unpaidInterest: input.unpaidInterest ?? 0,
    creditBalance: input.creditBalance ?? 0,
    accumulatedProfit: input.accumulatedProfit ?? 0,
    status: input.status ?? "active",
    createdAt: input.createdAt ?? new Date().toISOString(),
    updatedAt: input.updatedAt ?? new Date().toISOString(),
    closedAt: null
  });
}

function validateLoanValues(loan: Loan) {
  if (!loan.borrowerName.trim()) {
    throw new Error("Borrower name is required.");
  }

  if (loan.principal <= 0) {
    throw new Error("Principal must be greater than 0.");
  }

  if (loan.interestRate < 0) {
    throw new Error("Interest rate must be greater than or equal to 0.");
  }

  if (!isValidPaymentCycle(loan.paymentCycle)) {
    throw new Error("Payment cycle must be monthly or every_10_days.");
  }

  if (!loan.currentDueDate.trim()) {
    throw new Error("Current due date is required.");
  }

  if (!isValidLoanStatus(loan.status)) {
    throw new Error("Loan status is invalid.");
  }
}

function mapLoanRow(row: LoanRow): Loan {
  return {
    id: row.id,
    borrowerName: row.borrower_name,
    principal: row.principal,
    interestRate: row.interest_rate,
    paymentCycle: row.payment_cycle,
    currentDueDate: row.current_due_date,
    unpaidInterest: row.unpaid_interest,
    creditBalance: row.credit_balance,
    accumulatedProfit: row.accumulated_profit,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    closedAt: row.closed_at
  };
}

function normalizeBorrowerName(name: string) {
  return name.trim().toLowerCase();
}

function isValidPaymentCycle(paymentCycle: string): paymentCycle is PaymentCycle {
  return paymentCycle === "monthly" || paymentCycle === "every_10_days";
}

function isValidLoanStatus(status: string): status is LoanStatus {
  return status === "active" || status === "closed" || status === "archived";
}
