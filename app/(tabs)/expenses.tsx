import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { ExpenseService } from '@/services/ExpenseService';
import { ExpenseListItem } from '@/components/ExpenseListItem';
import { Calendar, ChevronDown, Filter } from 'lucide-react-native';
import { useExpenseStore } from '@/stores/expenseStore';

export default function ExpensesScreen() {
  const { session } = useAuthStore();
  const { expenses, setExpenses } = useExpenseStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState('week'); // 'day', 'week', 'month', 'year'
  const [error, setError] = useState<string | null>(null);

  const loadExpenses = async () => {
    if (!session) return;

    try {
      setError(null);
      const expenseService = new ExpenseService(session.user.id);
      const data = await expenseService.getExpensesByTimeframe(timeframe);
      setExpenses(data as any);
    } catch (err: any) {
      console.error('Error loading expenses:', err);
      setError('Failed to load expenses. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExpenses();
  };

  useEffect(() => {
    loadExpenses();
  }, [session, timeframe]);

  const renderTimeframeButton = (label: string, value: string) => (
    <TouchableOpacity
      style={[
        styles.timeframeButton,
        timeframe === value && styles.timeframeButtonActive,
      ]}
      onPress={() => setTimeframe(value)}
    >
      <Text
        style={[
          styles.timeframeButtonText,
          timeframe === value && styles.timeframeButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A6FFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Expenses</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.timeframeContainer}>
        {renderTimeframeButton('Day', 'day')}
        {renderTimeframeButton('Week', 'week')}
        {renderTimeframeButton('Month', 'month')}
        {renderTimeframeButton('Year', 'year')}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }: { item: any }) => <ExpenseListItem expense={item} />}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Calendar size={48} color="#ccc" />
            <Text style={styles.emptyText}>No expenses found</Text>
            <Text style={styles.emptySubtext}>
              Add your first expense by tapping the + button
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeframeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  timeframeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: '#f0f0f0',
  },
  timeframeButtonActive: {
    backgroundColor: '#4A6FFF',
  },
  timeframeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  timeframeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  errorContainer: {
    backgroundColor: '#FFEEEE',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
});
