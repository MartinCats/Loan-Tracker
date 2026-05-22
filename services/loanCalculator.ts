import type { PaymentCycle } from "@/types/loan";

export type LoanUrgencyStatus = "overdue" | "due_today" | "due_soon" | "upcoming";

export type AmountDueInput = {
  expectedInterest: number;
  unpaidInterest: number;
  creditBalance: number;
};

export type AmountDueResult = {
  rawDue: number;
  creditApplied: number;
  amountDue: number;
  remainingCredit: number;
};

export type ApplyPaymentInput = {
  principal: number;
  interestRate: number;
  unpaidInterest: number;
  creditBalance: number;
  paidAmount: number;
  currentDueDate: string | Date;
  paymentCycle: PaymentCycle;
  paymentDate: string | Date;
};

export type ApplyPaymentResult = {
  expectedInterest: number;
  rawDue: number;
  creditApplied: number;
  amountDue: number;
  paidAmount: number;
  accumulatedProfitDelta: number;
  unpaidInterestCreated: number;
  creditCreated: number;
  newUnpaidInterest: number;
  newCreditBalance: number;
  nextDueDate: string;
  isCyclePaid: boolean;
  newCurrentDueDate: string;
};

export type CloseLoanSettlementInput = {
  principal: number;
  interestRate: number;
  unpaidInterest: number;
  creditBalance: number;
};

export type CloseLoanSettlementResult = {
  principal: number;
  currentInterest: number;
  unpaidInterest: number;
  rawSettlementAmount: number;
  creditApplied: number;
  totalRequiredToClose: number;
  remainingCredit: number;
  accumulatedProfitDelta: number;
};

const millisecondsPerDay = 24 * 60 * 60 * 1000;

export function calculateExpectedInterest(principal: number, interestRate: number) {
  return principal * interestRate / 100;
}

export function calculateAmountDue({
  expectedInterest,
  unpaidInterest,
  creditBalance
}: AmountDueInput): AmountDueResult {
  const rawDue = expectedInterest + unpaidInterest;
  const creditApplied = Math.min(Math.max(creditBalance, 0), rawDue);
  const amountDue = Math.max(rawDue - creditApplied, 0);
  const remainingCredit = Math.max(creditBalance - creditApplied, 0);

  return {
    rawDue,
    creditApplied,
    amountDue,
    remainingCredit
  };
}

export function calculateNextDueDate(
  currentDueDate: string | Date,
  paymentCycle: PaymentCycle
) {
  if (paymentCycle === "monthly") {
    return toDateOnlyString(addMonthlyCycle(currentDueDate));
  }

  if (paymentCycle === "every_10_days") {
    const date = toDateOnly(currentDueDate);
    date.setUTCDate(date.getUTCDate() + 10);

    return toDateOnlyString(date);
  }

  throw new Error(`Unsupported payment cycle: ${paymentCycle satisfies never}`);
}

export function getLoanUrgencyStatus(
  dueDate: string | Date,
  today: string | Date
): LoanUrgencyStatus {
  const due = toDateOnly(dueDate);
  const current = toDateOnly(today);
  const daysUntilDue = Math.floor((due.getTime() - current.getTime()) / millisecondsPerDay);

  if (daysUntilDue < 0) {
    return "overdue";
  }

  if (daysUntilDue === 0) {
    return "due_today";
  }

  if (daysUntilDue <= 7) {
    return "due_soon";
  }

  return "upcoming";
}

export function applyPaymentToLoan({
  principal,
  interestRate,
  unpaidInterest,
  creditBalance,
  paidAmount,
  currentDueDate,
  paymentCycle
}: ApplyPaymentInput): ApplyPaymentResult {
  const expectedInterest = calculateExpectedInterest(principal, interestRate);
  const {
    rawDue,
    creditApplied,
    amountDue,
    remainingCredit
  } = calculateAmountDue({
    expectedInterest,
    unpaidInterest,
    creditBalance
  });

  const normalizedPaidAmount = Math.max(paidAmount, 0);
  const accumulatedProfitDelta = Math.min(normalizedPaidAmount, amountDue);
  const unpaidInterestCreated = Math.max(amountDue - normalizedPaidAmount, 0);
  const creditCreated = Math.max(normalizedPaidAmount - amountDue, 0);
  const newCreditBalance = remainingCredit + creditCreated;
  const newUnpaidInterest = unpaidInterestCreated;
  const nextDueDate = calculateNextDueDate(currentDueDate, paymentCycle);
  const isCyclePaid = amountDue === 0 || normalizedPaidAmount >= amountDue;
  const newCurrentDueDate = isCyclePaid ? nextDueDate : toDateOnlyString(currentDueDate);

  return {
    expectedInterest,
    rawDue,
    creditApplied,
    amountDue,
    paidAmount: normalizedPaidAmount,
    accumulatedProfitDelta,
    unpaidInterestCreated,
    creditCreated,
    newUnpaidInterest,
    newCreditBalance,
    nextDueDate,
    isCyclePaid,
    newCurrentDueDate
  };
}

export function calculateCloseLoanSettlement({
  principal,
  interestRate,
  unpaidInterest,
  creditBalance
}: CloseLoanSettlementInput): CloseLoanSettlementResult {
  const currentInterest = calculateExpectedInterest(principal, interestRate);
  const rawSettlementAmount = principal + currentInterest + unpaidInterest;
  const creditApplied = Math.min(Math.max(creditBalance, 0), rawSettlementAmount);
  const totalRequiredToClose = Math.max(rawSettlementAmount - creditApplied, 0);
  const remainingCredit = Math.max(creditBalance - creditApplied, 0);
  const totalInterestDue = currentInterest + unpaidInterest;
  const accumulatedProfitDelta = Math.min(totalRequiredToClose, totalInterestDue);

  return {
    principal,
    currentInterest,
    unpaidInterest,
    rawSettlementAmount,
    creditApplied,
    totalRequiredToClose,
    remainingCredit,
    accumulatedProfitDelta
  };
}

export function isSameDate(left: string | Date, right: string | Date) {
  return toDateOnlyString(left) === toDateOnlyString(right);
}

export function addMonthlyCycle(dateInput: string | Date) {
  const date = toDateOnly(dateInput);
  const sourceYear = date.getUTCFullYear();
  const sourceMonth = date.getUTCMonth();
  const sourceDay = date.getUTCDate();
  const targetMonthIndex = sourceMonth + 1;
  const targetYear = sourceYear + Math.floor(targetMonthIndex / 12);
  const targetMonth = targetMonthIndex % 12;
  const targetLastDay = getLastDayOfMonth(targetYear, targetMonth);
  const targetDay = Math.min(sourceDay, targetLastDay);

  return new Date(Date.UTC(targetYear, targetMonth, targetDay));
}

export function getLastDayOfMonth(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function toDateOnly(input: string | Date) {
  if (input instanceof Date) {
    return new Date(Date.UTC(
      input.getUTCFullYear(),
      input.getUTCMonth(),
      input.getUTCDate()
    ));
  }

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;

    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  }

  const parsedDate = new Date(input);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid date: ${input}`);
  }

  return new Date(Date.UTC(
    parsedDate.getUTCFullYear(),
    parsedDate.getUTCMonth(),
    parsedDate.getUTCDate()
  ));
}

function toDateOnlyString(input: string | Date) {
  return toDateOnly(input).toISOString().slice(0, 10);
}
