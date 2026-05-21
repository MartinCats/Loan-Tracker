export type LoanStatus = "active" | "closed" | "archived";

export type PaymentCycle = "monthly" | "every_10_days";

export type Loan = {
  id: string;
  borrowerName: string;
  principal: number;
  interestRate: number;
  paymentCycle: PaymentCycle;
  originalDueDay: number | null;
  currentDueDate: string;
  unpaidInterest: number;
  creditBalance: number;
  accumulatedProfit: number;
  status: LoanStatus;
  createdAt: string;
  updatedAt: string;
};
