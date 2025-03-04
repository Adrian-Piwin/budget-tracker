import React from 'react';
import { StyleSheet, Text, View, FlatList } from 'react-native';

interface Category {
  id: string | number;
  name: string;
  icon: string;
  color: string;
  monthly_budget: number;
  spent: number;
}

interface CategoryProgressListProps {
  categories: Category[];
}

export function CategoryProgressList({ categories }: CategoryProgressListProps) {
  const renderCategoryItem = ({ item }: { item: Category }) => {
    const percentage = item.monthly_budget > 0 ? (item.spent / item.monthly_budget) * 100 : 0;
    const isOverBudget = percentage > 100;

    return (
      <View style={styles.categoryItem}>
        <View style={styles.categoryHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
            <Text style={styles.categoryIconText}>{item.icon}</Text>
          </View>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{item.name}</Text>
            <Text style={styles.categoryAmount}>
              ${item.spent.toFixed(2)} / ${item.monthly_budget.toFixed(2)}
            </Text>
          </View>
        </View>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(percentage, 100)}%` },
                isOverBudget && styles.progressFillOverBudget,
              ]}
            />
          </View>
          <Text style={[styles.percentageText, isOverBudget && styles.percentageTextOverBudget]}>
            {percentage.toFixed(0)}%
          </Text>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={categories}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderCategoryItem}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No categories found</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  categoryItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  categoryAmount: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A6FFF',
  },
  progressFillOverBudget: {
    backgroundColor: '#FF3B30',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A6FFF',
    minWidth: 50,
    textAlign: 'right',
    flexShrink: 0,
    flexWrap: 'nowrap',
  },
  percentageTextOverBudget: {
    color: '#FF3B30',
  },
  emptyContainer: {
    width: 240,
    height: 100,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});
