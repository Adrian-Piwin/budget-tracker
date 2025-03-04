import React from 'react';
import { StyleSheet, Text, View, FlatList } from 'react-native';
import { ExpenseListItem } from './ExpenseListItem';

interface Expense {
  id: string | number;
  amount: number;
  description: string;
  date: string;
  category_id: string | number;
  category_name: string;
  category_icon: string;
  category_color: string;
}

interface RecentExpensesListProps {
  expenses: Expense[];
}

export function RecentExpensesList({ expenses }: RecentExpensesListProps) {
  return (
    <View style={styles.container}>
      {expenses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No recent expenses</Text>
          <Text style={styles.emptySubtext}>
            Add your first expense by tapping the + button
          </Text>
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <ExpenseListItem expense={item} />}
          scrollEnabled={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});