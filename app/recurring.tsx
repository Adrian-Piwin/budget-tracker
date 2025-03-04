import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { ExpenseService } from '@/services/ExpenseService';
import { BudgetService } from '@/services/BudgetService';
import { ArrowLeft, Calendar, DollarSign, CreditCard as Edit2, Plus, Trash2 } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const FREQUENCY_OPTIONS = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
];

export default function RecurringExpensesScreen() {
  const { session } = useAuthStore();
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category_id: null,
    frequency: 'monthly',
    next_date: new Date(),
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!session) return;

    try {
      setError(null);
      const expenseService = new ExpenseService(session.user.id);
      const budgetService = new BudgetService(session.user.id);
      
      const expenses = await expenseService.getRecurringExpenses();
      setRecurringExpenses(expenses);
      
      const cats = await budgetService.getCategories();
      setCategories(cats);
      
      if (cats.length > 0 && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: cats[0].id }));
      }
      
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Failed to load recurring expenses. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [session]);

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || formData.next_date;
    setShowDatePicker(Platform.OS === 'ios');
    setFormData(prev => ({ ...prev, next_date: currentDate }));
  };

  const handleSubmit = async () => {
    if (!formData.amount || !formData.description || !formData.category_id) {
      setError('Please fill in all required fields');
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Please fill in all required fields');
      }
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
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
      
      if (editingId) {
        await expenseService.updateRecurringExpense(editingId, {
          amount,
          description: formData.description,
          category_id: formData.category_id,
          frequency: formData.frequency,
          next_date: formData.next_date.toISOString(),
        });
      } else {
        await expenseService.addRecurringExpense({
          amount,
          description: formData.description,
          category_id: formData.category_id,
          frequency: formData.frequency,
          next_date: formData.next_date.toISOString(),
        });
      }

      // Reset form and reload data
      setFormData({
        amount: '',
        description: '',
        category_id: categories.length > 0 ? categories[0].id : null,
        frequency: 'monthly',
        next_date: new Date(),
      });
      setEditingId(null);
      setShowForm(false);
      await loadData();
      
      if (Platform.OS !== 'web') {
        Alert.alert('Success', editingId ? 'Recurring expense updated' : 'Recurring expense added');
      }
      
    } catch (err: any) {
      console.error('Error saving recurring expense:', err);
      setError('Failed to save recurring expense. Please try again.');
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Failed to save recurring expense. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (expense) => {
    setFormData({
      amount: expense.amount.toString(),
      description: expense.description,
      category_id: expense.category_id,
      frequency: expense.frequency,
      next_date: new Date(expense.next_date),
    });
    setEditingId(expense.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Delete Recurring Expense',
        'Are you sure you want to delete this recurring expense?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            onPress: async () => {
              await deleteRecurringExpense(id);
            },
            style: 'destructive',
          },
        ]
      );
    } else {
      if (confirm('Are you sure you want to delete this recurring expense?')) {
        await deleteRecurringExpense(id);
      }
    }
  };

  const deleteRecurringExpense = async (id) => {
    setLoading(true);
    setError(null);

    try {
      if (!session) throw new Error('Not authenticated');

      const expenseService = new ExpenseService(session.user.id);
      await expenseService.deleteRecurringExpense(id);

      // Reload data
      await loadData();
      
      if (Platform.OS !== 'web') {
        Alert.alert('Success', 'Recurring expense deleted');
      }
      
    } catch (err: any) {
      console.error('Error deleting recurring expense:', err);
      setError('Failed to delete recurring expense. Please try again.');
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Failed to delete recurring expense. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderRecurringExpenseItem = ({ item }) => {
    const category = categories.find(c => c.id === item.category_id);
    
    return (
      <View style={styles.expenseItem}>
        <View style={styles.expenseInfo}>
          <View style={[styles.categoryIcon, { backgroundColor: category?.color || '#ccc' }]}>
            <Text style={styles.categoryIconText}>{category?.icon || '📝'}</Text>
          </View>
          <View style={styles.expenseDetails}>
            <Text style={styles.expenseName}>{item.description}</Text>
            <Text style={styles.expenseFrequency}>
              ${item.amount.toFixed(2)} • {item.frequency.charAt(0).toUpperCase() + item.frequency.slice(1)}
            </Text>
            <Text style={styles.expenseDate}>
              Next: {new Date(item.next_date).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View style={styles.expenseActions}>
          <TouchableOpacity
            style={styles.expenseActionButton}
            onPress={() => handleEdit(item)}
          >
            <Edit2 size={18} color="#4A6FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.expenseActionButton}
            onPress={() => handleDelete(item.id)}
          >
            <Trash2 size={18} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Recurring Expenses</Text>
        <View style={styles.placeholder} />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!showForm ? (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowForm(true)}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Recurring Expense</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>
            {editingId ? 'Edit Recurring Expense' : 'New Recurring Expense'}
          </Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount</Text>
            <View style={styles.inputContainer}>
              <DollarSign size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#555"
                value={formData.amount}
                onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="e.g., Rent, Netflix subscription"
              placeholderTextColor="#555"
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoriesContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    formData.category_id === category.id && styles.categoryButtonSelected,
                    { borderColor: category.color },
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, category_id: category.id }))}
                >
                  <Text style={styles.categoryButtonIcon}>{category.icon}</Text>
                  <Text
                    style={[
                      styles.categoryButtonText,
                      formData.category_id === category.id && styles.categoryButtonTextSelected,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Frequency</Text>
            <View style={styles.frequencyContainer}>
              {FREQUENCY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.frequencyButton,
                    formData.frequency === option.value && styles.frequencyButtonSelected,
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, frequency: option.value }))}
                >
                  <Text
                    style={[
                      styles.frequencyButtonText,
                      formData.frequency === option.value && styles.frequencyButtonTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Next Occurrence</Text>
            <TouchableOpacity
              style={styles.dateInputContainer}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={20} color="#666" style={styles.inputIcon} />
              <Text style={styles.dateText}>
                {formData.next_date.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={formData.next_date}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity
              style={[styles.formButton, styles.cancelButton]}
              onPress={() => {
                setShowForm(false);
                setEditingId(null);
                setFormData({
                  amount: '',
                  description: '',
                  category_id: categories.length > 0 ? categories[0].id : null,
                  frequency: 'monthly',
                  next_date: new Date(),
                });
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formButton, styles.saveButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading && !showForm ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A6FFF" />
        </View>
      ) : (
        <FlatList
          data={recurringExpenses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderRecurringExpenseItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No recurring expenses</Text>
              <Text style={styles.emptySubtext}>
                Add your first recurring expense using the button above
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#4A6FFF',
    borderRadius: 8,
    margin: 20,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  descriptionInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryButtonSelected: {
    borderWidth: 1,
  },
  categoryButtonIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
  },
  categoryButtonTextSelected: {
    fontWeight: '600',
    color: '#333',
  },
  frequencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  frequencyButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  frequencyButtonSelected: {
    backgroundColor: '#4A6FFF',
  },
  frequencyButtonText: {
    fontSize: 14,
    color: '#666',
  },
  frequencyButtonTextSelected: {
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
    height: 50,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  formButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4A6FFF',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
    paddingTop: 0,
  },
  expenseItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  expenseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIconText: {
    fontSize: 18,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  expenseFrequency: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  expenseDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  expenseActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  expenseActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
});
