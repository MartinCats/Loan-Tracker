export type PaymentHistoryType = "interest_payment" | "auto_credit" | "loan_close";

export type PaymentHistory = {
  id: string;
  loanId: string;
  type: PaymentHistoryType;
  paidAmount: number;
  expectedAmount: number;
  unpaidInterestCreated: number;
  creditCreated: number;
  paymentDate: string | null;
  dueCycleDate: string | null;
  note?: string | null;
  createdAt: string;
};
