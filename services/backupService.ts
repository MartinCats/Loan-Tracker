import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import type { Loan } from "@/types/loan";
import type { PaymentHistory, PaymentHistoryType } from "@/types/payment";
import { isValidDateOnly } from "@/utils/dateOnly";

export type BackupPayload = {
  exportedAt: string;
  version: 1;
  loans: Loan[];
  paymentHistories: PaymentHistory[];
};

export type BackupExportResult = {
  fileName: string;
  uri: string;
};

export function createBackupPayload(loans: Loan[], paymentHistories: PaymentHistory[]): BackupPayload {
  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    loans,
    paymentHistories
  };
}

export async function readBackupJsonFile(uri: string) {
  try {
    const file = new File(uri);
    const text = await file.text();

    return parseBackupPayload(text);
  } catch (error) {
    if (error instanceof BackupValidationError) {
      throw error;
    }

    throw new BackupValidationError("corrupted");
  }
}

export function parseBackupPayload(text: string) {
  let value: unknown;

  try {
    value = JSON.parse(text);
  } catch {
    throw new BackupValidationError("invalid");
  }

  return validateBackupPayload(value);
}

export function validateBackupPayload(value: unknown): BackupPayload {
  if (!isRecord(value)) {
    throw new BackupValidationError("invalid");
  }

  if (
    typeof value.version !== "number" ||
    typeof value.exportedAt !== "string" ||
    !Array.isArray(value.loans) ||
    !Array.isArray(value.paymentHistories)
  ) {
    throw new BackupValidationError("invalid");
  }

  if (value.version !== 1) {
    throw new BackupValidationError("unsupported");
  }

  const loans = value.loans.map(validateBackupLoan);
  const loanIds = new Set(loans.map((loan) => loan.id));

  if (loanIds.size !== loans.length) {
    throw new BackupValidationError("corrupted");
  }

  validateActiveBorrowers(loans);

  const paymentHistories = value.paymentHistories.map((history) => validateBackupPaymentHistory(history, loanIds));
  const paymentHistoryIds = new Set(paymentHistories.map((history) => history.id));

  if (paymentHistoryIds.size !== paymentHistories.length) {
    throw new BackupValidationError("corrupted");
  }

  return {
    exportedAt: value.exportedAt,
    version: 1,
    loans,
    paymentHistories
  };
}

export function createLoansCsv(loans: Loan[]) {
  const headers = [
    "borrower_name",
    "status",
    "principal",
    "interest_rate",
    "cycle",
    "current_due_date",
    "unpaid_interest",
    "credit_balance",
    "accumulated_profit",
    "closed_at"
  ];
  const rows = loans.map((loan) => [
    loan.borrowerName,
    loan.status,
    loan.principal,
    loan.interestRate,
    loan.paymentCycle,
    loan.currentDueDate,
    loan.unpaidInterest,
    loan.creditBalance,
    loan.accumulatedProfit,
    loan.closedAt ?? ""
  ]);

  return [headers, ...rows]
    .map((row) => row.map((value) => escapeCsvValue(String(value))).join(","))
    .join("\n");
}

export async function exportJsonBackup(payload: BackupPayload): Promise<BackupExportResult> {
  const fileName = `loan-tracker-backup-${createFileTimestamp(payload.exportedAt)}.json`;
  const file = new File(Paths.cache, fileName);

  file.write(JSON.stringify(payload, null, 2));
  await shareFile(file.uri, "application/json");

  return {
    fileName,
    uri: file.uri
  };
}

export async function exportLoansCsv(loans: Loan[], exportedAt = new Date().toISOString()): Promise<BackupExportResult> {
  const fileName = `loan-tracker-loans-${createFileTimestamp(exportedAt)}.csv`;
  const file = new File(Paths.cache, fileName);

  file.write(createLoansCsv(loans));
  await shareFile(file.uri, "text/csv");

  return {
    fileName,
    uri: file.uri
  };
}

async function shareFile(uri: string, mimeType: string) {
  const canShare = await Sharing.isAvailableAsync();

  if (!canShare) {
    throw new Error("File sharing is not available on this device.");
  }

  await Sharing.shareAsync(uri, {
    mimeType,
    UTI: mimeType === "application/json" ? "public.json" : "public.comma-separated-values-text"
  });
}

function createFileTimestamp(value: string) {
  return value.replace(/[:.]/g, "-");
}

function escapeCsvValue(value: string) {
  if (!/[",\n\r]/.test(value)) {
    return value;
  }

  return `"${value.replace(/"/g, '""')}"`;
}

export class BackupValidationError extends Error {
  constructor(public readonly reason: "invalid" | "unsupported" | "corrupted") {
    super(reason);
  }
}

function validateBackupLoan(value: unknown): Loan {
  if (!isRecord(value)) {
    throw new BackupValidationError("invalid");
  }

  const loan = {
    id: value.id,
    borrowerName: value.borrowerName,
    principal: value.principal,
    interestRate: value.interestRate,
    paymentCycle: value.paymentCycle,
    currentDueDate: value.currentDueDate,
    unpaidInterest: value.unpaidInterest,
    creditBalance: value.creditBalance,
    accumulatedProfit: value.accumulatedProfit,
    status: value.status,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    closedAt: value.closedAt ?? null
  };

  if (
    typeof loan.id !== "string" ||
    !loan.id.trim() ||
    typeof loan.borrowerName !== "string" ||
    !loan.borrowerName.trim() ||
    !isFiniteNumber(loan.principal) ||
    loan.principal <= 0 ||
    !isFiniteNumber(loan.interestRate) ||
    loan.interestRate < 0 ||
    !isPaymentCycle(loan.paymentCycle) ||
    typeof loan.currentDueDate !== "string" ||
    !isValidDateOnly(loan.currentDueDate) ||
    !isFiniteNumber(loan.unpaidInterest) ||
    !isFiniteNumber(loan.creditBalance) ||
    !isFiniteNumber(loan.accumulatedProfit) ||
    !isLoanStatus(loan.status) ||
    typeof loan.createdAt !== "string" ||
    typeof loan.updatedAt !== "string" ||
    (loan.closedAt !== null && typeof loan.closedAt !== "string")
  ) {
    throw new BackupValidationError("invalid");
  }

  return {
    id: loan.id,
    borrowerName: loan.borrowerName,
    principal: loan.principal,
    interestRate: loan.interestRate,
    paymentCycle: loan.paymentCycle,
    currentDueDate: loan.currentDueDate,
    unpaidInterest: loan.unpaidInterest,
    creditBalance: loan.creditBalance,
    accumulatedProfit: loan.accumulatedProfit,
    status: loan.status,
    createdAt: loan.createdAt,
    updatedAt: loan.updatedAt,
    closedAt: loan.closedAt
  } as Loan;
}

function validateBackupPaymentHistory(value: unknown, loanIds: Set<string>): PaymentHistory {
  if (!isRecord(value)) {
    throw new BackupValidationError("invalid");
  }

  const history = {
    id: value.id,
    loanId: value.loanId,
    type: value.type,
    paidAmount: value.paidAmount,
    expectedAmount: value.expectedAmount,
    unpaidInterestCreated: value.unpaidInterestCreated,
    creditCreated: value.creditCreated,
    paymentDate: value.paymentDate ?? null,
    dueCycleDate: value.dueCycleDate ?? null,
    note: value.note ?? null,
    createdAt: value.createdAt
  };

  if (
    typeof history.id !== "string" ||
    !history.id.trim() ||
    typeof history.loanId !== "string" ||
    !loanIds.has(history.loanId) ||
    !isPaymentHistoryType(history.type) ||
    !isFiniteNumber(history.paidAmount) ||
    !isFiniteNumber(history.expectedAmount) ||
    !isFiniteNumber(history.unpaidInterestCreated) ||
    !isFiniteNumber(history.creditCreated) ||
    (history.paymentDate !== null && typeof history.paymentDate !== "string") ||
    (history.dueCycleDate !== null && typeof history.dueCycleDate !== "string") ||
    (history.note !== null && typeof history.note !== "string") ||
    typeof history.createdAt !== "string"
  ) {
    throw new BackupValidationError("invalid");
  }

  return {
    id: history.id,
    loanId: history.loanId,
    type: history.type,
    paidAmount: history.paidAmount,
    expectedAmount: history.expectedAmount,
    unpaidInterestCreated: history.unpaidInterestCreated,
    creditCreated: history.creditCreated,
    paymentDate: history.paymentDate,
    dueCycleDate: history.dueCycleDate,
    note: history.note,
    createdAt: history.createdAt
  } as PaymentHistory;
}

function validateActiveBorrowers(loans: Loan[]) {
  const activeBorrowers = new Set<string>();

  for (const loan of loans) {
    if (loan.status !== "active") {
      continue;
    }

    const normalizedName = loan.borrowerName.trim().toLowerCase();

    if (activeBorrowers.has(normalizedName)) {
      throw new BackupValidationError("corrupted");
    }

    activeBorrowers.add(normalizedName);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isPaymentCycle(value: unknown): value is Loan["paymentCycle"] {
  return value === "monthly" || value === "every_10_days";
}

function isLoanStatus(value: unknown): value is Loan["status"] {
  return value === "active" || value === "closed" || value === "archived";
}

function isPaymentHistoryType(value: unknown): value is PaymentHistoryType {
  return (
    value === "interest_payment" ||
    value === "auto_credit" ||
    value === "loan_close" ||
    value === "payment_received" ||
    value === "partial_payment" ||
    value === "overpayment" ||
    value === "reschedule"
  );
}
