import { create } from 'zustand';

interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
}

interface ExpenseState {
  expenses: Expense[];
  recentExpenses: Expense[];
  timeframeExpenses: Expense[];
  addExpense: (expense: Expense) => void;
  setExpenses: (expenses: Expense[]) => void;
  setRecentExpenses: (expenses: Expense[]) => void;
  setTimeframeExpenses: (expenses: Expense[]) => void;
}

export const useExpenseStore = create<ExpenseState>((set) => ({
  expenses: [],
  recentExpenses: [],
  timeframeExpenses: [],
  addExpense: (expense) => set((state) => ({
    expenses: [expense, ...state.expenses],
    recentExpenses: [expense, ...state.recentExpenses].slice(0, 5),
    timeframeExpenses: [expense, ...state.timeframeExpenses],
  })),
  setExpenses: (expenses) => set({ expenses }),
  setRecentExpenses: (expenses) => set({ recentExpenses: expenses }),
  setTimeframeExpenses: (expenses) => set({ timeframeExpenses: expenses }),
})); 
