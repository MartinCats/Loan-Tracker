import type { Loan } from "@/types/loan";

export function calculateExpectedInterest(_principal: number, _interestRate: number) {
  throw new Error("Not implemented yet");
}

export function calculateNextDueDate(_loan: Loan) {
  throw new Error("Not implemented yet");
}

export function calculateAmountDue(_loan: Loan) {
  throw new Error("Not implemented yet");
}

export function applyPaymentToLoan(_loan: Loan, _paidAmount: number) {
  throw new Error("Not implemented yet");
}
