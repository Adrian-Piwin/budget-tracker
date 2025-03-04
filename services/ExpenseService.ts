import { supabase } from '@/lib/supabase';

interface ExpenseData {
  amount: number;
  category_id: string;
  description: string;
  date: string;
}

export class ExpenseService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async getExpenses() {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        budget_categories (
          name,
          icon,
          color
        )
      `)
      .eq('user_id', this.userId)
      .order('date', { ascending: false });

    if (error) throw error;

    // Format the data to make it easier to use
    return (data || []).map(expense => ({
      id: expense.id,
      amount: expense.amount,
      description: expense.description,
      date: expense.date,
      category_id: expense.category_id,
      category_name: expense.budget_categories.name,
      category_icon: expense.budget_categories.icon,
      category_color: expense.budget_categories.color,
    }));
  }

  async getRecentExpenses(limit = 5) {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        budget_categories (
          name,
          icon,
          color
        )
      `)
      .eq('user_id', this.userId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Format the data to make it easier to use
    return (data || []).map(expense => ({
      id: expense.id,
      amount: expense.amount,
      description: expense.description,
      date: expense.date,
      category_id: expense.category_id,
      category_name: expense.budget_categories.name,
      category_icon: expense.budget_categories.icon,
      category_color: expense.budget_categories.color,
    }));
  }

  async getExpensesByTimeframe(timeframe: string) {
    const now = new Date();
    let startDate: Date;
    
    switch (timeframe) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        budget_categories (
          name,
          icon,
          color
        )
      `)
      .eq('user_id', this.userId)
      .gte('date', startDate.toISOString())
      .lte('date', now.toISOString())
      .order('date', { ascending: false });

    if (error) throw error;

    // Format the data to make it easier to use
    return (data || []).map(expense => ({
      id: expense.id,
      amount: expense.amount,
      description: expense.description,
      date: expense.date,
      category_id: expense.category_id,
      category_name: expense.budget_categories.name,
      category_icon: expense.budget_categories.icon,
      category_color: expense.budget_categories.color,
    }));
  }

  async addExpense(data: ExpenseData) {
    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({
        user_id: this.userId,
        ...data,
      })
      .select(`
        *,
        budget_categories (
          name,
          icon,
          color
        )
      `)
      .single();

    if (error) throw error;

    return {
      id: expense.id,
      amount: expense.amount,
      description: expense.description,
      date: expense.date,
      category_id: expense.category_id,
      category_name: expense.budget_categories.name,
      category_icon: expense.budget_categories.icon,
      category_color: expense.budget_categories.color,
    };
  }

  async updateExpense(expenseId: string | number, expenseData: any) {
    const { data, error } = await supabase
      .from('expenses')
      .update(expenseData)
      .eq('id', expenseId)
      .eq('user_id', this.userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteExpense(expenseId: string | number) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId)
      .eq('user_id', this.userId);

    if (error) throw error;
    return true;
  }

  async getRecurringExpenses() {
    const { data, error } = await supabase
      .from('recurring_expenses')
      .select(`
        *,
        budget_categories (
          name,
          icon,
          color
        )
      `)
      .eq('user_id', this.userId)
      .order('next_date');

    if (error) throw error;

    // Format the data to make it easier to use
    return (data || []).map(expense => ({
      id: expense.id,
      amount: expense.amount,
      description: expense.description,
      frequency: expense.frequency,
      next_date: expense.next_date,
      category_id: expense.category_id,
      category_name: expense.budget_categories.name,
      category_icon: expense.budget_categories.icon,
      category_color: expense.budget_categories.color,
    }));
  }

  async addRecurringExpense(expenseData: any) {
    const { data, error } = await supabase
      .from('recurring_expenses')
      .insert({
        user_id: this.userId,
        ...expenseData,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateRecurringExpense(expenseId: string | number, expenseData: any) {
    const { data, error } = await supabase
      .from('recurring_expenses')
      .update(expenseData)
      .eq('id', expenseId)
      .eq('user_id', this.userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteRecurringExpense(expenseId: string | number) {
    const { error } = await supabase
      .from('recurring_expenses')
      .delete()
      .eq('id', expenseId)
      .eq('user_id', this.userId);

    if (error) throw error;
    return true;
  }
}
