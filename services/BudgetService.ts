import { supabase } from '@/lib/supabase';

export class BudgetService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async getCategories() {
    const { data, error } = await supabase
      .from('budget_categories')
      .select('*')
      .eq('user_id', this.userId)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async addCategory(categoryData: any) {
    const { data, error } = await supabase
      .from('budget_categories')
      .insert({
        user_id: this.userId,
        ...categoryData,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateCategory(categoryId: string | number, categoryData: any) {
    const { data, error } = await supabase
      .from('budget_categories')
      .update(categoryData)
      .eq('id', categoryId)
      .eq('user_id', this.userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteCategory(categoryId: string | number) {
    // First delete all expenses in this category
    await supabase
      .from('expenses')
      .delete()
      .eq('category_id', categoryId)
      .eq('user_id', this.userId);

    // Then delete recurring expenses
    await supabase
      .from('recurring_expenses')
      .delete()
      .eq('category_id', categoryId)
      .eq('user_id', this.userId);

    // Finally delete the category
    const { error } = await supabase
      .from('budget_categories')
      .delete()
      .eq('id', categoryId)
      .eq('user_id', this.userId);

    if (error) throw error;
    return true;
  }

  async getBudgetSummary() {
    // Get total budget across all categories
    const { data: categories, error: categoriesError } = await supabase
      .from('budget_categories')
      .select('monthly_budget')
      .eq('user_id', this.userId);

    if (categoriesError) throw categoriesError;

    const totalBudget = categories.reduce((sum, category) => sum + (category.monthly_budget || 0), 0);

    // Get total spent this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', this.userId)
      .gte('date', startOfMonth.toISOString())
      .lte('date', now.toISOString());

    if (expensesError) throw expensesError;

    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    return {
      totalBudget,
      totalSpent,
      remaining: totalBudget - totalSpent,
    };
  }

  async getCategoriesWithProgress() {
    // Get all categories
    const { data: categories, error: categoriesError } = await supabase
      .from('budget_categories')
      .select('*')
      .eq('user_id', this.userId)
      .order('name');

    if (categoriesError) throw categoriesError;

    // Get expenses for the current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount, category_id')
      .eq('user_id', this.userId)
      .gte('date', startOfMonth.toISOString())
      .lte('date', now.toISOString());

    if (expensesError) throw expensesError;

    // Calculate spent amount for each category
    const categorySpending = {};
    expenses.forEach(expense => {
      if (!categorySpending[expense.category_id]) {
        categorySpending[expense.category_id] = 0;
      }
      categorySpending[expense.category_id] += expense.amount;
    });

    // Add spent amount to each category
    return categories.map(category => ({
      ...category,
      spent: categorySpending[category.id] || 0,
    }));
  }
}