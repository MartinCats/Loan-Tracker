import { create } from "zustand";

import { initializeDatabase } from "@/database/database";
import {
  closeLoan as closeLoanInRepository,
  createLoan as createLoanInRepository,
  deleteLoan as deleteLoanInRepository,
  getActiveLoans,
  getArchivedLoans,
  updateLoan as updateLoanInRepository,
  type CreateLoanInput,
  type UpdateLoanInput
} from "@/database/loanRepository";
import type { Loan } from "@/types/loan";

type LoanState = {
  activeLoans: Loan[];
  archivedLoans: Loan[];
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  loadActiveLoans: () => Promise<void>;
  loadArchivedLoans: () => Promise<void>;
  loadLoans: () => Promise<void>;
  createLoan: (input: CreateLoanInput) => Promise<Loan>;
  updateLoan: (input: UpdateLoanInput) => Promise<Loan>;
  closeLoan: (id: string, closedAt?: string) => Promise<Loan>;
  deleteLoan: (id: string) => Promise<void>;
  clearError: () => void;
};

export const useLoanStore = create<LoanState>((set) => ({
  activeLoans: [],
  archivedLoans: [],
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
      const [activeLoans, archivedLoans] = await Promise.all([
        getActiveLoans(),
        getArchivedLoans()
      ]);

      set({
        activeLoans,
        archivedLoans,
        isInitialized: true
      });
    });
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

  deleteLoan: async (id) => {
    await runStoreAction(set, async () => {
      await deleteLoanInRepository(id);

      const loans = await loadLoansFromRepositories();

      set({
        ...loans,
        isInitialized: true
      });
    });
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
