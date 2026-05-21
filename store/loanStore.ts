import { create } from "zustand";

import type { Loan } from "@/types/loan";

type LoanState = {
  loans: Loan[];
  setLoans: (loans: Loan[]) => void;
  clearLoans: () => void;
};

export const useLoanStore = create<LoanState>((set) => ({
  loans: [],
  setLoans: (loans) => set({ loans }),
  clearLoans: () => set({ loans: [] })
}));
