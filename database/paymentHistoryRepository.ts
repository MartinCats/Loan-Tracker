import { getDatabase, initializeDatabase } from "@/database/database";
import type { PaymentHistory, PaymentHistoryType } from "@/types/payment";

type PaymentHistoryRow = {
  id: string;
  loan_id: string;
  type: PaymentHistoryType;
  paid_amount: number;
  expected_amount: number;
  unpaid_interest_created: number;
  credit_created: number;
  payment_date: string | null;
  due_cycle_date: string | null;
  note: string | null;
  created_at: string;
};

export type CreatePaymentHistoryInput = {
  id: string;
  loanId: string;
  type: PaymentHistoryType;
  paidAmount?: number;
  expectedAmount?: number;
  unpaidInterestCreated?: number;
  creditCreated?: number;
  paymentDate?: string | null;
  dueCycleDate?: string | null;
  note?: string | null;
  createdAt?: string;
};

export async function createPaymentHistory(input: CreatePaymentHistoryInput) {
  await initializeDatabase();
  validateCreatePaymentHistoryInput(input);

  const database = await getDatabase();
  const createdAt = input.createdAt ?? new Date().toISOString();

  await database.runAsync(
    `
      INSERT INTO payment_histories (
        id,
        loan_id,
        type,
        paid_amount,
        expected_amount,
        unpaid_interest_created,
        credit_created,
        payment_date,
        due_cycle_date,
        note,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    [
      input.id,
      input.loanId,
      input.type,
      input.paidAmount ?? 0,
      input.expectedAmount ?? 0,
      input.unpaidInterestCreated ?? 0,
      input.creditCreated ?? 0,
      input.paymentDate ?? null,
      input.dueCycleDate ?? null,
      input.note ?? null,
      createdAt
    ]
  );

  const histories = await getPaymentHistoriesByLoanId(input.loanId);
  const createdHistory = histories.find((history) => history.id === input.id);

  if (!createdHistory) {
    throw new Error("Payment history was created but could not be loaded.");
  }

  return createdHistory;
}

export async function getPaymentHistoriesByLoanId(loanId: string) {
  await initializeDatabase();

  const database = await getDatabase();
  const rows = await database.getAllAsync<PaymentHistoryRow>(
    `
      SELECT *
      FROM payment_histories
      WHERE loan_id = ?
      ORDER BY created_at DESC;
    `,
    [loanId]
  );

  return rows.map(mapPaymentHistoryRow);
}

export async function getAllPaymentHistories() {
  await initializeDatabase();

  const database = await getDatabase();
  const rows = await database.getAllAsync<PaymentHistoryRow>(
    `
      SELECT *
      FROM payment_histories
      ORDER BY created_at DESC;
    `
  );

  return rows.map(mapPaymentHistoryRow);
}

export async function deletePaymentHistoriesByLoanId(loanId: string) {
  await initializeDatabase();

  const database = await getDatabase();

  await database.runAsync("DELETE FROM payment_histories WHERE loan_id = ?;", [loanId]);
}

function validateCreatePaymentHistoryInput(input: CreatePaymentHistoryInput) {
  if (!input.id.trim()) {
    throw new Error("Payment history id is required.");
  }

  if (!input.loanId.trim()) {
    throw new Error("Loan id is required.");
  }

  if (!isValidPaymentHistoryType(input.type)) {
    throw new Error("Payment history type is invalid.");
  }
}

function mapPaymentHistoryRow(row: PaymentHistoryRow): PaymentHistory {
  return {
    id: row.id,
    loanId: row.loan_id,
    type: row.type,
    paidAmount: row.paid_amount,
    expectedAmount: row.expected_amount,
    unpaidInterestCreated: row.unpaid_interest_created,
    creditCreated: row.credit_created,
    paymentDate: row.payment_date,
    dueCycleDate: row.due_cycle_date,
    note: row.note,
    createdAt: row.created_at
  };
}

function isValidPaymentHistoryType(type: string): type is PaymentHistoryType {
  return (
    type === "interest_payment" ||
    type === "auto_credit" ||
    type === "loan_close" ||
    type === "payment_received" ||
    type === "partial_payment" ||
    type === "overpayment" ||
    type === "reschedule"
  );
}
