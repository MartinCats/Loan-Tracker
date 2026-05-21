import { createLoan, getActiveLoans } from "@/database/loanRepository";
import {
  createPaymentHistory,
  getPaymentHistoriesByLoanId
} from "@/database/paymentHistoryRepository";

export async function runRepositoryExample() {
  const now = new Date().toISOString();

  const loan = await createLoan({
    id: "example-loan-1",
    borrowerName: "Example Borrower",
    principal: 10000,
    interestRate: 10,
    paymentCycle: "monthly",
    currentDueDate: "2026-05-18",
    createdAt: now,
    updatedAt: now
  });

  await createPaymentHistory({
    id: "example-payment-1",
    loanId: loan.id,
    type: "interest_payment",
    paidAmount: 1000,
    expectedAmount: 1000,
    paymentDate: "2026-05-18",
    dueCycleDate: "2026-05-18",
    createdAt: now
  });

  return {
    activeLoans: await getActiveLoans(),
    histories: await getPaymentHistoriesByLoanId(loan.id)
  };
}
