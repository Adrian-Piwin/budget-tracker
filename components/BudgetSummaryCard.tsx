import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface BudgetSummaryCardProps {
  totalBudget: number;
  totalSpent: number;
}

export function BudgetSummaryCard({ totalBudget, totalSpent }: BudgetSummaryCardProps) {
  const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const remaining = totalBudget - totalSpent;
  const isOverBudget = remaining < 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Monthly Budget</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
      </View>

      <View style={styles.budgetInfo}>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Spent</Text>
          <Text style={styles.amountValue}>${totalSpent.toFixed(2)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Budget</Text>
          <Text style={styles.amountValue}>${totalBudget.toFixed(2)}</Text>
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
        <Text style={[styles.remainingText, isOverBudget && styles.overBudgetText]}>
          {isOverBudget
            ? `$${Math.abs(remaining).toFixed(2)} over budget`
            : `$${remaining.toFixed(2)} remaining`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  budgetInfo: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  amountContainer: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  divider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  progressContainer: {
    marginTop: 8,
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
  progressFillOverBudget: {
    backgroundColor: '#FF3B30',
  },
  remainingText: {
    fontSize: 14,
    color: '#4A6FFF',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'right',
  },
  overBudgetText: {
    color: '#FF3B30',
  },
});