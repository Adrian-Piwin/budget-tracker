import { supabase } from '@/lib/supabase';

export class AnalyticsService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async getSpendingByCategory(timeframe: string) {
    const now = new Date();
    let startDate: Date;
    
    switch (timeframe) {
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

    // Get all expenses for the timeframe
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select(`
        amount,
        category_id,
        budget_categories (
          name,
          color
        )
      `)
      .eq('user_id', this.userId)
      .gte('date', startDate.toISOString())
      .lte('date', now.toISOString());

    if (expensesError) throw expensesError;

    // Group expenses by category
    const categoryTotals = {};
    expenses.forEach(expense => {
      const categoryId = expense.category_id;
      if (!categoryTotals[categoryId]) {
        categoryTotals[categoryId] = {
          name: expense.budget_categories.name,
          color: expense.budget_categories.color,
          total: 0,
        };
      }
      categoryTotals[categoryId].total += expense.amount;
    });

    // Format for pie chart
    return Object.values(categoryTotals).map((category: any) => ({
      name: category.name,
      value: category.total,
      color: category.color,
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }));
  }

  async getSpendingTrends(timeframe: string) {
    const now = new Date();
    let startDate: Date;
    let format: string;
    let labels: string[] = [];
    
    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
        format = 'day';
        // Generate last 7 days as labels
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
          labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        }
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        format = 'day';
        // Generate days of current month as labels
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
          if (i > now.getDate()) break; // Don't include future days
          labels.push(i.toString());
        }
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        format = 'month';
        // Generate months as labels
        for (let i = 0; i < 12; i++) {
          if (i > now.getMonth()) break; // Don't include future months
          const monthDate = new Date(now.getFullYear(), i, 1);
          labels.push(monthDate.toLocaleDateString('en-US', { month: 'short' }));
        }
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        format = 'day';
        // Default to days of current month
        const defaultDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        for (let i = 1; i <= defaultDaysInMonth; i++) {
          if (i > now.getDate()) break;
          labels.push(i.toString());
        }
    }

    // Get all expenses for the timeframe
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount, date')
      .eq('user_id', this.userId)
      .gte('date', startDate.toISOString())
      .lte('date', now.toISOString())
      .order('date');

    if (expensesError) throw expensesError;

    // Group expenses by the format (day, month)
    const dataByFormat = {};
    
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      let key: string;
      
      if (format === 'day') {
        if (timeframe === 'week') {
          key = date.toLocaleDateString('en-US', { weekday: 'short' });
        } else {
          key = date.getDate().toString();
        }
      } else if (format === 'month') {
        key = date.toLocaleDateString('en-US', { month: 'short' });
      }
      
      if (!dataByFormat[key]) {
        dataByFormat[key] = 0;
      }
      dataByFormat[key] += expense.amount;
    });

    // Create dataset with values matching labels
    const data = labels.map(label => dataByFormat[label] || 0);

    return {
      labels,
      datasets: [
        {
          data,
          color: (opacity = 1) => `rgba(74, 111, 255, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  }

  async getSpendingSummary(timeframe: string) {
    const now = new Date();
    let startDate: Date;
    
    switch (timeframe) {
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

    // Get all expenses for the timeframe
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select(`
        amount,
        date,
        category_id,
        budget_categories (
          name
        )
      `)
      .eq('user_id', this.userId)
      .gte('date', startDate.toISOString())
      .lte('date', now.toISOString());

    if (expensesError) throw expensesError;

    // Calculate total spent
    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate average per day
    const daysDiff = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const avgPerDay = totalSpent / daysDiff;

    // Find most expensive category
    const categoryTotals = {};
    expenses.forEach(expense => {
      const categoryId = expense.category_id;
      if (!categoryTotals[categoryId]) {
        categoryTotals[categoryId] = {
          name: expense.budget_categories.name,
          total: 0,
        };
      }
      categoryTotals[categoryId].total += expense.amount;
    });

    let mostExpensiveCategory = '';
    let maxCategorySpent = 0;
    
    Object.values(categoryTotals).forEach((category: any) => {
      if (category.total > maxCategorySpent) {
        maxCategorySpent = category.total;
        mostExpensiveCategory = category.name;
      }
    });

    // Find most expensive day
    const dayTotals = {};
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const dayKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (!dayTotals[dayKey]) {
        dayTotals[dayKey] = 0;
      }
      dayTotals[dayKey] += expense.amount;
    });

    let mostExpensiveDay = '';
    let maxDaySpent = 0;
    
    Object.entries(dayTotals).forEach(([day, total]) => {
      if (total > maxDaySpent) {
        maxDaySpent = total as number;
        mostExpensiveDay = day;
      }
    });

    return {
      totalSpent,
      avgPerDay,
      mostExpensiveCategory,
      mostExpensiveDay,
    };
  }
}