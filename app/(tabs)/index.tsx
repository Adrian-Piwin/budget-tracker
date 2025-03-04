import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { BudgetService } from '@/services/BudgetService';
import { ExpenseService } from '@/services/ExpenseService';
import { BudgetSummaryCard } from '@/components/BudgetSummaryCard';
import { RecentExpensesList } from '@/components/RecentExpensesList';
import { CategoryProgressList } from '@/components/CategoryProgressList';
import { useExpenseStore } from '@/stores/expenseStore';

export default function DashboardScreen() {
  const { session } = useAuthStore();
  const { recentExpenses } = useExpenseStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    if (!session) return;

    try {
      setError(null);
      
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('name')
        .eq('user_id', session.user.id)
        .single();
      
      if (profileError) throw profileError;
      if (profile) setUserName(profile.name);

      const budgetService = new BudgetService(session.user.id);
      const expenseService = new ExpenseService(session.user.id);
      
      const budgetSummary = await budgetService.getBudgetSummary();
      setTotalBudget(budgetSummary.totalBudget);
      setTotalSpent(budgetSummary.totalSpent);
      
      const recent = await expenseService.getRecentExpenses(5);
      useExpenseStore.getState().setRecentExpenses(recent as any);
      
      const cats = await budgetService.getCategoriesWithProgress();
      setCategories(cats as any);
      
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
  };

  useEffect(() => {
    loadDashboardData();
  }, [session]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A6FFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Dashboard</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <BudgetSummaryCard totalBudget={totalBudget} totalSpent={totalSpent} />

        <Text style={styles.sectionTitle}>Categories</Text>
        <CategoryProgressList categories={categories} />

        <Text style={styles.sectionTitle}>Recent Expenses</Text>
        <RecentExpensesList expenses={recentExpenses as any} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  date: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  errorContainer: {
    backgroundColor: '#FFEEEE',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: 12,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
  },
});
