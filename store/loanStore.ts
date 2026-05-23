import { create } from "zustand";

import { initializeDatabase } from "@/database/database";
import {
  closeLoan as closeLoanInRepository,
  createLoan as createLoanInRepository,
  deleteLoan as deleteLoanInRepository,
  getActiveLoans,
  getArchivedLoans,
  getLoanById,
  updateLoan as updateLoanInRepository,
  type CreateLoanInput,
  type UpdateLoanInput
} from "@/database/loanRepository";
import {
  createPaymentHistory,
  deletePaymentHistoriesByLoanId,
  getAllPaymentHistories,
  getPaymentHistoriesByLoanId
} from "@/database/paymentHistoryRepository";
import {
  createBackupPayload,
  exportJsonBackup,
  exportLoansCsv,
  type BackupExportResult
} from "@/services/backupService";
import {
  applyPaymentToLoan,
  calculateAmountDue,
  calculateCloseLoanSettlement,
  calculateExpectedInterest,
  type AmountDueResult,
  type ApplyPaymentResult,
  type CloseLoanSettlementResult
} from "@/services/loanCalculator";
import type { Loan } from "@/types/loan";
import type { PaymentHistory, PaymentHistoryType } from "@/types/payment";

export type ReceivePaymentInput = {
  loanId: string;
  paidAmount: number;
  note?: string;
  paymentDate?: string;
};

export type ReceivePaymentResult = {
  loan: Loan;
  payment: PaymentHistory;
  calculation: ApplyPaymentResult;
};

export type CloseLoanWithSettlementResult = {
  loan: Loan;
  payment: PaymentHistory;
  settlement: CloseLoanSettlementResult;
};

type LoanState = {
  activeLoans: Loan[];
  archivedLoans: Loan[];
  selectedLoan: Loan | null;
  selectedPaymentHistories: PaymentHistory[];
  selectedPaymentQuote: AmountDueResult | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  loadActiveLoans: () => Promise<void>;
  loadArchivedLoans: () => Promise<void>;
  loadLoans: () => Promise<void>;
  loadLoanDetail: (id: string) => Promise<Loan | null>;
  getPaymentQuote: (loanId: string) => Promise<AmountDueResult>;
  getCloseLoanSettlement: (loanId: string) => Promise<CloseLoanSettlementResult>;
  createLoan: (input: CreateLoanInput) => Promise<Loan>;
  updateLoan: (input: UpdateLoanInput) => Promise<Loan>;
  closeLoan: (id: string, closedAt?: string) => Promise<Loan>;
  closeLoanWithSettlement: (loanId: string) => Promise<CloseLoanWithSettlementResult>;
  deleteArchivedLoan: (id: string) => Promise<void>;
  deleteLoan: (id: string) => Promise<void>;
  exportBackupCsv: () => Promise<BackupExportResult>;
  exportBackupJson: () => Promise<BackupExportResult>;
  receivePayment: (input: ReceivePaymentInput) => Promise<ReceivePaymentResult>;
  clearError: () => void;
};

export const useLoanStore = create<LoanState>((set) => ({
  activeLoans: [],
  archivedLoans: [],
  selectedLoan: null,
  selectedPaymentHistories: [],
  selectedPaymentQuote: null,
  isInitialized: false,
  isLoading: false,
  error: null,

  initialize: async () => {
    await runStoreAction(set, async () => {
      await initializeDatabase();
      set({ isInitialized: true });
    });
  },

  loadActiveLoans: async () => {
    await runStoreAction(set, async () => {
      const activeLoans = await getActiveLoans();

      set({ activeLoans, isInitialized: true });
    });
  },

  loadArchivedLoans: async () => {
    await runStoreAction(set, async () => {
      const archivedLoans = await getArchivedLoans();

      set({ archivedLoans, isInitialized: true });
    });
  },

  loadLoans: async () => {
    await runStoreAction(set, async () => {
      const { activeLoans, archivedLoans } = await loadLoansFromRepositories();

      set({
        activeLoans,
        archivedLoans,
        isInitialized: true
      });
    });
  },

  loadLoanDetail: async (id) => {
    let selectedLoan: Loan | null = null;

    await runStoreAction(set, async () => {
      selectedLoan = await getLoanById(id);
      const selectedPaymentHistories = selectedLoan
        ? await getPaymentHistoriesByLoanId(id)
        : [];
      const selectedPaymentQuote = selectedLoan
        ? calculatePaymentQuote(selectedLoan)
        : null;

      set({
        selectedLoan,
        selectedPaymentHistories,
        selectedPaymentQuote,
        isInitialized: true
      });
    });

    return selectedLoan;
  },

  getPaymentQuote: async (loanId) => {
    let paymentQuote: AmountDueResult | null = null;

    await runStoreAction(set, async () => {
      const loan = await getLoanById(loanId);

      if (!loan) {
        throw new Error(`Loan not found: ${loanId}`);
      }

      paymentQuote = calculatePaymentQuote(loan);
      set({ selectedPaymentQuote: paymentQuote });
    });

    if (!paymentQuote) {
      throw new Error(`Loan not found: ${loanId}`);
    }

    return paymentQuote;
  },

  getCloseLoanSettlement: async (loanId) => {
    let settlement: CloseLoanSettlementResult | null = null;

    await runStoreAction(set, async () => {
      const loan = await getLoanById(loanId);

      if (!loan) {
        throw new Error(`Loan not found: ${loanId}`);
      }

      if (loan.status !== "active") {
        throw new Error("Only active loans can be closed.");
      }

      settlement = calculateCloseSettlementForLoan(loan);
    });

    if (!settlement) {
      throw new Error("Close settlement could not be calculated.");
    }

    return settlement;
  },

  createLoan: async (input) => {
    let createdLoan: Loan | null = null;

    await runStoreAction(set, async () => {
      createdLoan = await createLoanInRepository(input);

      const loans = await loadLoansFromRepositories();

      set({
        ...loans,
        isInitialized: true
      });
    });

    if (!createdLoan) {
      throw new Error("Loan could not be created.");
    }

    return createdLoan;
  },

  updateLoan: async (input) => {
    let updatedLoan: Loan | null = null;

    await runStoreAction(set, async () => {
      updatedLoan = await updateLoanInRepository(input);

      if (!updatedLoan) {
        throw new Error(`Loan not found: ${input.id}`);
      }

      const loans = await loadLoansFromRepositories();

      set({
        ...loans,
        isInitialized: true
      });
    });

    if (!updatedLoan) {
      throw new Error(`Loan not found: ${input.id}`);
    }

    return updatedLoan;
  },

  closeLoan: async (id, closedAt) => {
    let closedLoan: Loan | null = null;

    await runStoreAction(set, async () => {
      closedLoan = await closeLoanInRepository(id, closedAt);

      const loans = await loadLoansFromRepositories();

      set({
        ...loans,
        isInitialized: true
      });
    });

    if (!closedLoan) {
      throw new Error(`Loan not found: ${id}`);
    }

    return closedLoan;
  },

  closeLoanWithSettlement: async (loanId) => {
    let result: CloseLoanWithSettlementResult | null = null;

    await runStoreAction(set, async () => {
      const loan = await getLoanById(loanId);

      if (!loan) {
        throw new Error(`Loan not found: ${loanId}`);
      }

      if (loan.status !== "active") {
        throw new Error("Only active loans can be closed.");
      }

      const closedAt = new Date().toISOString();
      const settlement = calculateCloseSettlementForLoan(loan);

      const closedLoan = await updateLoanInRepository({
        id: loan.id,
        status: "closed",
        closedAt,
        updatedAt: closedAt,
        unpaidInterest: 0,
        creditBalance: settlement.remainingCredit,
        accumulatedProfit: loan.accumulatedProfit + settlement.accumulatedProfitDelta
      });

      if (!closedLoan) {
        throw new Error(`Loan not found: ${loan.id}`);
      }

      const payment = await createPaymentHistory({
        id: createLocalId("close"),
        loanId: loan.id,
        type: "loan_close",
        paidAmount: settlement.totalRequiredToClose,
        expectedAmount: settlement.rawSettlementAmount,
        unpaidInterestCreated: 0,
        creditCreated: 0,
        paymentDate: closedAt,
        dueCycleDate: loan.currentDueDate,
        note: "Loan close settlement"
      });

      const [loans, selectedPaymentHistories] = await Promise.all([
        loadLoansFromRepositories(),
        getPaymentHistoriesByLoanId(loan.id)
      ]);

      set({
        ...loans,
        selectedLoan: closedLoan,
        selectedPaymentHistories,
        selectedPaymentQuote: calculatePaymentQuote(closedLoan),
        isInitialized: true
      });

      result = {
        loan: closedLoan,
        payment,
        settlement
      };
    });

    if (!result) {
      throw new Error("Loan could not be closed.");
    }

    return result;
  },

  deleteLoan: async (id) => {
    await runStoreAction(set, async () => {
      const loan = await getLoanById(id);

      if (!loan) {
        throw new Error(`Loan not found: ${id}`);
      }

      if (loan.status !== "active") {
        throw new Error("Only active loans can be deleted.");
      }

      await deletePaymentHistoriesByLoanId(id);
      await deleteLoanInRepository(id);

      const loans = await loadLoansFromRepositories();

      set({
        ...loans,
        selectedLoan: null,
        selectedPaymentHistories: [],
        selectedPaymentQuote: null,
        isInitialized: true
      });
    });
  },

  deleteArchivedLoan: async (id) => {
    await runStoreAction(set, async () => {
      const loan = await getLoanById(id);

      if (!loan) {
        throw new Error(`Loan not found: ${id}`);
      }

      if (loan.status !== "closed" && loan.status !== "archived") {
        throw new Error("Only archived loans can be deleted.");
      }

      await deletePaymentHistoriesByLoanId(id);
      await deleteLoanInRepository(id);

      const loans = await loadLoansFromRepositories();

      set({
        ...loans,
        selectedLoan: null,
        selectedPaymentHistories: [],
        selectedPaymentQuote: null,
        isInitialized: true
      });
    });
  },

  exportBackupJson: async () => {
    let result: BackupExportResult | null = null;

    await runStoreAction(set, async () => {
      const [loans, paymentHistories] = await Promise.all([
        loadLoansFromRepositories(),
        getAllPaymentHistories()
      ]);
      const allLoans = [...loans.activeLoans, ...loans.archivedLoans];
      const payload = createBackupPayload(allLoans, paymentHistories);

      result = await exportJsonBackup(payload);

      set({
        ...loans,
        isInitialized: true
      });
    });

    if (!result) {
      throw new Error("JSON backup could not be exported.");
    }

    return result;
  },

  exportBackupCsv: async () => {
    let result: BackupExportResult | null = null;

    await runStoreAction(set, async () => {
      const loans = await loadLoansFromRepositories();
      const allLoans = [...loans.activeLoans, ...loans.archivedLoans];

      result = await exportLoansCsv(allLoans);

      set({
        ...loans,
        isInitialized: true
      });
    });

    if (!result) {
      throw new Error("CSV backup could not be exported.");
    }

    return result;
  },

  receivePayment: async (input) => {
    let result: ReceivePaymentResult | null = null;

    await runStoreAction(set, async () => {
      if (input.paidAmount <= 0 || Number.isNaN(input.paidAmount)) {
        throw new Error("Payment amount must be greater than 0.");
      }

      const loan = await getLoanById(input.loanId);

      if (!loan) {
        throw new Error(`Loan not found: ${input.loanId}`);
      }

      const paymentDate = input.paymentDate ?? new Date().toISOString();
      const calculation = applyPaymentToLoan({
        principal: loan.principal,
        interestRate: loan.interestRate,
        unpaidInterest: loan.unpaidInterest,
        creditBalance: loan.creditBalance,
        paidAmount: input.paidAmount,
        currentDueDate: loan.currentDueDate,
        paymentCycle: loan.paymentCycle,
        paymentDate
      });

      validatePaymentCalculation(calculation);

      const updatedLoan = await updateLoanInRepository({
        id: loan.id,
        unpaidInterest: calculation.newUnpaidInterest,
        creditBalance: calculation.newCreditBalance,
        accumulatedProfit: loan.accumulatedProfit + calculation.accumulatedProfitDelta,
        currentDueDate: calculation.newCurrentDueDate
      });

      if (!updatedLoan) {
        throw new Error(`Loan not found: ${loan.id}`);
      }

      const payment = await createPaymentHistory({
        id: createLocalId("payment"),
        loanId: loan.id,
        type: getPaymentHistoryType(calculation),
        paidAmount: calculation.paidAmount,
        expectedAmount: calculation.rawDue,
        unpaidInterestCreated: calculation.unpaidInterestCreated,
        creditCreated: calculation.creditCreated,
        paymentDate,
        dueCycleDate: loan.currentDueDate,
        note: input.note?.trim() || null
      });

      const [loans, selectedPaymentHistories] = await Promise.all([
        loadLoansFromRepositories(),
        getPaymentHistoriesByLoanId(loan.id)
      ]);

      set({
        ...loans,
        selectedLoan: updatedLoan,
        selectedPaymentHistories,
        selectedPaymentQuote: calculatePaymentQuote(updatedLoan),
        isInitialized: true
      });

      result = {
        loan: updatedLoan,
        payment,
        calculation
      };
    });

    if (!result) {
      throw new Error("Payment could not be received.");
    }

    return result;
  },

  clearError: () => set({ error: null })
}));

async function loadLoansFromRepositories() {
  const [activeLoans, archivedLoans] = await Promise.all([
    getActiveLoans(),
    getArchivedLoans()
  ]);

  return {
    activeLoans,
    archivedLoans
  };
}

function calculatePaymentQuote(loan: Loan) {
  const expectedInterest = calculateExpectedInterest(loan.principal, loan.interestRate);

  return calculateAmountDue({
    expectedInterest,
    unpaidInterest: loan.unpaidInterest,
    creditBalance: loan.creditBalance
  });
}

function calculateCloseSettlementForLoan(loan: Loan) {
  return calculateCloseLoanSettlement({
    principal: loan.principal,
    interestRate: loan.interestRate,
    unpaidInterest: loan.unpaidInterest,
    creditBalance: loan.creditBalance
  });
}

function getPaymentHistoryType(result: ApplyPaymentResult): PaymentHistoryType {
  if (result.unpaidInterestCreated > 0) {
    return "partial_payment";
  }

  if (result.creditCreated > 0) {
    return "overpayment";
  }

  return "payment_received";
}

function validatePaymentCalculation(result: ApplyPaymentResult) {
  if (result.amountDue < 0 || result.rawDue < 0) {
    throw new Error("Invalid payment calculation result.");
  }
}

function createLocalId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function runStoreAction(
  set: (partial: Partial<LoanState>) => void,
  action: () => Promise<void>
) {
  set({ isLoading: true, error: null });

  try {
    await action();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected loan store error.";

    set({ error: message });
    throw error;
  } finally {
    set({ isLoading: false });
  }
}
