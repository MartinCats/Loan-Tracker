import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import type { Loan } from "@/types/loan";
import type { PaymentHistory } from "@/types/payment";

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
