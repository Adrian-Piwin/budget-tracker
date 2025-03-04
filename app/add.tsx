import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { ExpenseService } from '@/services/ExpenseService';
import { BudgetService } from '@/services/BudgetService';
import { Calendar, DollarSign, FileText } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AddExpenseScreen() {
  const { session } = useAuthStore();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      if (!session) return;

      try {
        const budgetService = new BudgetService(session.user.id);
        const cats = await budgetService.getCategories();
        setCategories(cats);
        if (cats.length > 0) {
          setSelectedCategory(cats[0].id);
        }
      } catch (err) {
        console.error('Error loading categories:', err);
        setError('Failed to load categories');
        if (Platform.OS !== 'web') {
          Alert.alert('Error', 'Failed to load categories. Please try again.');
        }
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, [session]);

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const handleAddExpense = async () => {
    if (!amount || !selectedCategory) {
      setError('Please enter an amount and select a category');
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Please enter an amount and select a category');
      }
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Please enter a valid amount');
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!session) throw new Error('Not authenticated');

      const expenseService = new ExpenseService(session.user.id);
      await expenseService.addExpense({
        amount: amountNum,
        category_id: selectedCategory,
        description: description || 'Expense',
        date: date.toISOString(),
      });

      // Success
      if (Platform.OS !== 'web') {
        Alert.alert('Success', 'Expense added successfully');
      }
      
      // Reset form
      setAmount('');
      setDescription('');
      setDate(new Date());
      
      // Navigate back to expenses screen
      router.replace('/expenses');
    } catch (err: any) {
      console.error('Error adding expense:', err);
      setError('Failed to add expense. Please try again.');
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Failed to add expense');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingCategories) {
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
          <Text style={styles.title}>Add Expense</Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount</Text>
            <View style={styles.amountInputContainer}>
              <DollarSign size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="#555"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoriesContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.id && styles.categoryButtonSelected,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      selectedCategory === category.id && styles.categoryButtonTextSelected,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity
              style={styles.dateInputContainer}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={20} color="#666" style={styles.inputIcon} />
              <Text style={styles.dateText}>
                {date.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <View style={styles.descriptionInputContainer}>
              <FileText size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.descriptionInput}
                placeholder="Enter description"
                placeholderTextColor="#999"
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddExpense}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.addButtonText}>Add Expense</Text>
            )}
          </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 56,
  },
  amountInput: {
    flex: 1,
    height: 56,
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  inputIcon: {
    marginRight: 10,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  categoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 4,
    marginBottom: 8,
  },
  categoryButtonSelected: {
    backgroundColor: '#4A6FFF',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
  },
  categoryButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 56,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  descriptionInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 100,
  },
  descriptionInput: {
    flex: 1,
    fontSize: 16,
    textAlignVertical: 'top',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4A6FFF',
    borderRadius: 8,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: 12,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
});
