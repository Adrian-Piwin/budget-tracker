import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { BudgetService } from '@/services/BudgetService';
import { ArrowLeft, DollarSign, CreditCard as Edit2, Plus, Trash2 } from 'lucide-react-native';
import React from 'react';

export default function CategoriesScreen() {
  const { session } = useAuthStore();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryBudget, setNewCategoryBudget] = useState('');
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
    if (!session) return;

    try {
      setError(null);
      const budgetService = new BudgetService(session.user.id);
      const cats = await budgetService.getCategories();
      setCategories(cats as any); // Type assertion to fix type error
    } catch (err: any) {
      console.error('Error loading categories:', err);
      setError('Failed to load categories. Please try again.');
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Failed to load categories. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [session]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setError('Please enter a category name');
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Please enter a category name');
      }
      return;
    }

    const budget = parseFloat(newCategoryBudget);
    if (isNaN(budget) || budget < 0) {
      setError('Please enter a valid budget amount');
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Please enter a valid budget amount');
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!session) throw new Error('Not authenticated');

      const budgetService = new BudgetService(session.user.id);
      const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
      
      await budgetService.addCategory({
        name: newCategoryName.trim(),
        icon: '📝',
        color: randomColor,
        monthly_budget: budget,
      });

      // Reset form and reload categories
      setNewCategoryName('');
      setNewCategoryBudget('');
      await loadCategories();
      
      if (Platform.OS !== 'web') {
        Alert.alert('Success', 'Category added successfully');
      }
      
    } catch (err: any) {
      console.error('Error adding category:', err);
      setError('Failed to add category. Please try again.');
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Failed to add category. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    
    if (!editingCategory.name.trim()) {
      setError('Please enter a category name');
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Please enter a category name');
      }
      return;
    }

    const budget = parseFloat(editingCategory.monthly_budget.toString());
    if (isNaN(budget) || budget < 0) {
      setError('Please enter a valid budget amount');
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Please enter a valid budget amount');
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!session) throw new Error('Not authenticated');

      const budgetService = new BudgetService(session.user.id);
      await budgetService.updateCategory(editingCategory.id, {
        name: editingCategory.name.trim(),
        monthly_budget: budget,
      });

      // Reset editing state and reload categories
      setEditingCategory(null);
      await loadCategories();
      
      if (Platform.OS !== 'web') {
        Alert.alert('Success', 'Category updated successfully');
      }
      
    } catch (err: any) {
      console.error('Error updating category:', err);
      setError('Failed to update category. Please try again.');
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Failed to update category. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Delete Category',
        'Are you sure you want to delete this category? All associated expenses will also be deleted.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            onPress: async () => {
              await deleteCategory(categoryId);
            },
            style: 'destructive',
          },
        ]
      );
    } else {
      if (confirm('Are you sure you want to delete this category? All associated expenses will also be deleted.')) {
        await deleteCategory(categoryId);
      }
    }
  };

  const deleteCategory = async (categoryId: string) => {
    setLoading(true);
    setError(null);

    try {
      if (!session) throw new Error('Not authenticated');

      const budgetService = new BudgetService(session.user.id);
      await budgetService.deleteCategory(categoryId);

      // Reload categories
      await loadCategories();
      
      if (Platform.OS !== 'web') {
        Alert.alert('Success', 'Category deleted successfully');
      }
      
    } catch (err: any) {
      console.error('Error deleting category:', err);
      setError('Failed to delete category. Please try again.');
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Failed to delete category. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryItem = ({ item }: { item: any }) => (
    <View style={styles.categoryItem}>
      {editingCategory && editingCategory.id === item.id ? (
        <View style={styles.editCategoryForm}>
          <TextInput
            style={styles.editCategoryInput}
            value={editingCategory.name}
            onChangeText={(text) => setEditingCategory({...editingCategory, name: text})}
            placeholder="Category name"
            placeholderTextColor="#555"
          />
          <View style={styles.editCategoryBudgetContainer}>
            <DollarSign size={16} color="#666" />
            <TextInput
              style={styles.editCategoryBudgetInput}
              value={editingCategory.monthly_budget.toString()}
              onChangeText={(text) => setEditingCategory({...editingCategory, monthly_budget: text})}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#555"
            />
          </View>
          <View style={styles.editCategoryActions}>
            <TouchableOpacity
              style={[styles.editCategoryButton, styles.cancelButton]}
              onPress={() => setEditingCategory(null)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editCategoryButton, styles.saveButton]}
              onPress={handleUpdateCategory}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.categoryInfo}>
            <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
              <Text style={styles.categoryIconText}>{item.icon}</Text>
            </View>
            <View style={styles.categoryDetails}>
              <Text style={styles.categoryName}>{item.name}</Text>
              <Text style={styles.categoryBudget}>${item.monthly_budget.toFixed(2)}/month</Text>
            </View>
          </View>
          <View style={styles.categoryActions}>
            <TouchableOpacity
              style={styles.categoryActionButton}
              onPress={() => setEditingCategory(item)}
            >
              <Edit2 size={18} color="#4A6FFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.categoryActionButton}
              onPress={() => handleDeleteCategory(item.id)}
            >
              <Trash2 size={18} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Categories</Text>
        <View style={styles.placeholder} />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.addCategoryContainer}>
        <Text style={styles.sectionTitle}>Add New Category</Text>
        <View style={styles.addCategoryForm}>
          <TextInput
            style={styles.addCategoryInput}
            placeholder="Category name"
            placeholderTextColor="#555"
            value={newCategoryName}
            onChangeText={setNewCategoryName}
          />
          <View style={styles.budgetInputContainer}>
            <DollarSign size={16} color="#666" />
            <TextInput
              style={styles.budgetInput}
              placeholder="Monthly budget"
              placeholderTextColor="#555"
              value={newCategoryBudget}
              onChangeText={setNewCategoryBudget}
              keyboardType="decimal-pad"
            />
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddCategory}
            disabled={loading}
          >
            <Plus size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Category</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Your Categories</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A6FFF" />
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCategoryItem}
          style={styles.categoryList}
          contentContainerStyle={styles.categoryListContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No categories found</Text>
              <Text style={styles.emptySubtext}>Add your first category above</Text>
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
  addCategoryContainer: {
    padding: 20,
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  addCategoryForm: {
    marginTop: 8,
  },
  addCategoryInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 12,
    color: '#333',
  },
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
    marginBottom: 16,
  },
  budgetInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    marginLeft: 8,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4A6FFF',
    borderRadius: 8,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  categoryList: {
    flex: 1,
  },
  categoryListContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  categoryItem: {
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
  categoryInfo: {
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
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  categoryBudget: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  categoryActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  categoryActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  editCategoryForm: {
    width: '100%',
  },
  editCategoryInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 12,
    color: '#333',
  },
  editCategoryBudgetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
    marginBottom: 16,
  },
  editCategoryBudgetInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    marginLeft: 8,
    color: '#333',
  },
  editCategoryActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editCategoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});
