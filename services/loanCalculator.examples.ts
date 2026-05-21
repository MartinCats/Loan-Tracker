import {
  applyPaymentToLoan,
  calculateAmountDue,
  calculateNextDueDate,
  getLoanUrgencyStatus
} from "@/services/loanCalculator";

export const loanCalculatorExamples = {
  monthEndNonLeapYear: calculateNextDueDate("2025-01-31", "monthly"),
  monthEndLeapYear: calculateNextDueDate("2024-01-31", "monthly"),
  creditGreaterThanDue: calculateAmountDue({
    expectedInterest: 1000,
    unpaidInterest: 0,
    creditBalance: 1200
  }),
  partialPayment: applyPaymentToLoan({
    principal: 10000,
    interestRate: 10,
    unpaidInterest: 0,
    creditBalance: 0,
    paidAmount: 600,
    currentDueDate: "2026-05-18",
    paymentCycle: "monthly",
    paymentDate: "2026-05-18"
  }),
  overpayment: applyPaymentToLoan({
    principal: 10000,
    interestRate: 10,
    unpaidInterest: 400,
    creditBalance: 0,
    paidAmount: 2000,
    currentDueDate: "2026-05-18",
    paymentCycle: "monthly",
    paymentDate: "2026-05-18"
  }),
  fixedBillingCycle: applyPaymentToLoan({
    principal: 10000,
    interestRate: 10,
    unpaidInterest: 0,
    creditBalance: 0,
    paidAmount: 1000,
    currentDueDate: "2026-05-18",
    paymentCycle: "monthly",
    paymentDate: "2026-05-10"
  }),
  dueSoon: getLoanUrgencyStatus("2026-05-24", "2026-05-21")
} as const;
