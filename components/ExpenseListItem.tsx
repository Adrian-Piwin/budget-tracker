import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

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

interface ExpenseListItemProps {
  expense: Expense;
}

export function ExpenseListItem({ expense }: ExpenseListItemProps) {
  const formattedDate = new Date(expense.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.container}>
      <View style={[styles.categoryIcon, { backgroundColor: expense.category_color }]}>
        <Text style={styles.categoryIconText}>{expense.category_icon}</Text>
      </View>
      <View style={styles.expenseInfo}>
        <Text style={styles.expenseDescription}>{expense.description}</Text>
        <Text style={styles.expenseDetails}>
          {formattedDate} • {expense.category_name}
        </Text>
      </View>
      <Text style={styles.expenseAmount}>-${expense.amount.toFixed(2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
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
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  expenseDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
});