

import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { UserService } from '@/services/UserService';
import { BudgetService } from '@/services/BudgetService';
import { ArrowRight, Check, DollarSign, Plus } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const DEFAULT_CATEGORIES = [
  { name: 'Housing', icon: '🏠', color: '#4A6FFF' },
  { name: 'Food', icon: '🍔', color: '#FF9500' },
  { name: 'Transportation', icon: '🚗', color: '#34C759' },
  { name: 'Entertainment', icon: '🎬', color: '#AF52DE' },
  { name: 'Shopping', icon: '🛍️', color: '#FF2D55' },
  { name: 'Utilities', icon: '💡', color: '#5AC8FA' },
  { name: 'Health', icon: '⚕️', color: '#FF3B30' },
  { name: 'Personal', icon: '👤', color: '#FFCC00' },
];

export default function OnboardingScreen() {
  const { session, setIsOnboarded } = useAuthStore();
  const [step, setStep] = useState(1);
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [savingsGoal, setSavingsGoal] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectCategory = (category) => {
    if (selectedCategories.some(c => c.name === category.name)) {
      setSelectedCategories(selectedCategories.filter(c => c.name !== category.name));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleAddCustomCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
    const newCategory = {
      name: newCategoryName.trim(),
      icon: '📝',
      color: randomColor,
    };
    
    setSelectedCategories([...selectedCategories, newCategory]);
    setNewCategoryName('');
  };

  const handleUpdateBudget = (category, amount) => {
    setCategoryBudgets({
      ...categoryBudgets,
      [category.name]: amount,
    });
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!monthlyIncome || !savingsGoal) {
        setError('Please enter both your monthly income and savings goal');
        return;
      }
      
      if (isNaN(parseFloat(monthlyIncome)) || isNaN(parseFloat(savingsGoal))) {
        setError('Please enter valid numbers');
        return;
      }
      
      setError(null);
      setStep(2);
    } else if (step === 2) {
      if (selectedCategories.length === 0) {
        setError('Please select at least one category');
        return;
      }
      
      setError(null);
      setStep(3);
    } else if (step === 3) {
      handleCompleteOnboarding();
    }
  };

  const handleCompleteOnboarding = async () => {
    if (!session) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const userService = new UserService(session.user.id);
      const budgetService = new BudgetService(session.user.id);
      
      // Save user profile with income and savings goal
      await userService.updateUserProfile({
        monthly_income: parseFloat(monthlyIncome),
        savings_goal: parseFloat(savingsGoal),
        is_onboarded: true,
      });
      
      // Save selected categories with budgets
      for (const category of selectedCategories) {
        const budget = categoryBudgets[category.name] || '0';
        await budgetService.addCategory({
          name: category.name,
          icon: category.icon,
          color: category.color,
          monthly_budget: parseFloat(budget) || 0,
        });
      }
      
      // Update onboarded state
      setIsOnboarded(true);
      
      // Navigate to main app
      router.replace('/');
      
    } catch (err: any) {
      console.error('Error completing onboarding:', err);
      setError('Failed to complete setup. Please try again.');
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Failed to complete setup');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Let's set up your budget</Text>
      <Text style={styles.stepDescription}>
        First, tell us about your monthly income and savings goal
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Monthly Income</Text>
        <View style={styles.inputContainer}>
          <DollarSign size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="0.00"
            value={monthlyIncome}
            onChangeText={setMonthlyIncome}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Monthly Savings Goal</Text>
        <View style={styles.inputContainer}>
          <DollarSign size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="0.00"
            value={savingsGoal}
            onChangeText={setSavingsGoal}
            keyboardType="decimal-pad"
          />
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select your budget categories</Text>
      <Text style={styles.stepDescription}>
        Choose the categories you want to track in your budget
      </Text>

      <View style={styles.categoriesContainer}>
        {DEFAULT_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.name}
            style={[
              styles.categoryButton,
              selectedCategories.some(c => c.name === category.name) && styles.categoryButtonSelected,
              { borderColor: category.color },
            ]}
            onPress={() => handleSelectCategory(category)}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={styles.categoryName}>{category.name}</Text>
            {selectedCategories.some(c => c.name === category.name) && (
              <View style={[styles.checkmark, { backgroundColor: category.color }]}>
                <Check size={12} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.addCategoryContainer}>
        <Text style={styles.label}>Add Custom Category</Text>
        <View style={styles.addCategoryInputContainer}>
          <TextInput
            style={styles.addCategoryInput}
            placeholder="Category name"
            value={newCategoryName}
            onChangeText={setNewCategoryName}
          />
          <TouchableOpacity
            style={styles.addCategoryButton}
            onPress={handleAddCustomCategory}
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Set your budget limits</Text>
      <Text style={styles.stepDescription}>
        Assign a monthly budget amount to each category
      </Text>

      <ScrollView style={styles.budgetListContainer}>
        {selectedCategories.map((category) => (
          <View key={category.name} style={styles.budgetItem}>
            <View style={styles.budgetItemHeader}>
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={styles.budgetItemName}>{category.name}</Text>
            </View>
            <View style={styles.budgetInputContainer}>
              <DollarSign size={16} color="#666" />
              <TextInput
                style={styles.budgetInput}
                placeholder="0.00"
                value={categoryBudgets[category.name] || ''}
                onChangeText={(value) => handleUpdateBudget(category, value)}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(step / 3) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>Step {step} of 3</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </ScrollView>

      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep(step - 1)}
            disabled={loading}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNextStep}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {step === 3 ? 'Complete Setup' : 'Next'}
              </Text>
              <ArrowRight size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
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
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A6FFF',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 56,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  categoryButton: {
    width: '46%',
    margin: '2%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  categoryButtonSelected: {
    borderWidth: 2,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4A6FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCategoryContainer: {
    marginTop: 20,
  },
  addCategoryInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addCategoryInput: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginRight: 12,
  },
  addCategoryButton: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#4A6FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetListContainer: {
    flex: 1,
  },
  budgetItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  budgetItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  budgetInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    marginLeft: 8,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 8,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: 12,
    height: 56,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  nextButton: {
    flex: 1,
    height: 56,
    backgroundColor: '#4A6FFF',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  }
});