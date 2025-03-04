import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { AnalyticsService } from '@/services/AnalyticsService';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { ChevronDown } from 'lucide-react-native';
import { useExpenseStore } from '@/stores/expenseStore';
import { ExpenseService } from '@/services/ExpenseService';

const screenWidth = Dimensions.get('window').width;

export default function InsightsScreen() {
  const { session } = useAuthStore();
  const { timeframeExpenses, setTimeframeExpenses } = useExpenseStore();
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('month'); // 'week', 'month', 'year'
  const [categoryData, setCategoryData] = useState([]);
  const [trendData, setTrendData] = useState({
    labels: [],
    datasets: [{ data: [] }],
  });
  const [summaryData, setSummaryData] = useState({
    totalSpent: 0,
    avgPerDay: 0,
    mostExpensiveCategory: '',
    mostExpensiveDay: '',
  });
  const [error, setError] = useState<string | null>(null);

  const loadExpenses = async () => {
    if (!session) return;

    try {
      setError(null);
      const expenseService = new ExpenseService(session.user.id);
      const data = await expenseService.getExpensesByTimeframe(timeframe);
      setTimeframeExpenses(data as any);
    } catch (err: any) {
      setError('Failed to load expenses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadInsights = async () => {
    if (!session) return;

    try {
      setError(null);
      const analyticsService = new AnalyticsService(session.user.id);
      
      // Get spending by category
      const categories = await analyticsService.getSpendingByCategory(timeframe);
      setCategoryData(categories as any);
      
      // Get spending trends
      const trends = await analyticsService.getSpendingTrends(timeframe);
      setTrendData(trends as any);
      
      // Get summary data
      const summary = await analyticsService.getSpendingSummary(timeframe);
      setSummaryData(summary);
      
    } catch (err: any) {
      console.error('Error loading insights:', err);
      setError('Failed to load insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
    loadInsights();
  }, [session, timeframe, timeframeExpenses]);

  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    color: (opacity = 1) => `rgba(74, 111, 255, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A6FFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Insights</Text>
          <TouchableOpacity style={styles.timeframeSelector}>
            <Text style={styles.timeframeText}>
              {timeframe === 'week' ? 'This Week' : 
               timeframe === 'month' ? 'This Month' : 'This Year'}
            </Text>
            <ChevronDown size={20} color="#333" />
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>${summaryData.totalSpent.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Total Spent</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>${summaryData.avgPerDay.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Avg. per Day</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Spending by Category</Text>
        <View style={styles.chartContainer}>
          {categoryData.length > 0 ? (
            <PieChart
              data={categoryData}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              accessor="value"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No data available</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Spending Trends</Text>
        <View style={styles.chartContainer}>
          {trendData.labels.length > 0 ? (
            <LineChart
              data={trendData}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={{ borderRadius: 16 }}
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No data available</Text>
            </View>
          )}
        </View>

        <View style={styles.insightsContainer}>
          <Text style={styles.sectionTitle}>Key Insights</Text>
          
          {summaryData.mostExpensiveCategory && (
            <View style={styles.insightItem}>
              <Text style={styles.insightText}>
                Your highest spending category is <Text style={styles.insightHighlight}>{summaryData.mostExpensiveCategory}</Text>
              </Text>
            </View>
          )}
          
          {summaryData.mostExpensiveDay && (
            <View style={styles.insightItem}>
              <Text style={styles.insightText}>
                Your highest spending day was <Text style={styles.insightHighlight}>{summaryData.mostExpensiveDay}</Text>
              </Text>
            </View>
          )}
          
          {!summaryData.mostExpensiveCategory && !summaryData.mostExpensiveDay && (
            <View style={styles.insightItem}>
              <Text style={styles.insightText}>
                Add more expenses to see personalized insights
              </Text>
            </View>
          )}
        </View>
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
  timeframeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timeframeText: {
    fontSize: 14,
    color: '#333',
    marginRight: 4,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 16,
  },
  summaryItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  noDataContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#999',
  },
  insightsContainer: {
    marginBottom: 40,
  },
  insightItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  insightText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  insightHighlight: {
    fontWeight: 'bold',
    color: '#4A6FFF',
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
