import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { BudgetOverview, ScheduledPayment, Transaction } from '../types';
import { monthlySnapshot } from './monthlySnapshot.ts';

const budget = (totalSpent: number, totalLimit: number | null): BudgetOverview => ({
  month: '2026-11', totalSpent, totalLimit, items: [],
});
const transaction = (amount: number, type: Transaction['type'], status: Transaction['status']): Transaction =>
  ({ amount, type, status } as Transaction);
const payment = (amount: number, type: ScheduledPayment['type'], status: ScheduledPayment['status']): ScheduledPayment =>
  ({ amount, type, status } as ScheduledPayment);

test('combina gasto do orçamento com pendências sem contar receitas ou agendamentos quitados', () => {
  const result = monthlySnapshot(
    budget(70000, 100000),
    [transaction(90000, 'income' as Transaction['type'], 'paid' as Transaction['status']), transaction(20000, 'income' as Transaction['type'], 'unpaid' as Transaction['status'])],
    [payment(25000, 'expense' as ScheduledPayment['type'], 'pending' as ScheduledPayment['status']), payment(5000, 'expense' as ScheduledPayment['type'], 'paid' as ScheduledPayment['status']), payment(10000, 'income' as ScheduledPayment['type'], 'pending' as ScheduledPayment['status'])]
  );
  assert.deepEqual(result, { spent: 70000, received: 90000, pending: 25000, forecast: 95000, limit: 100000, remaining: 5000, status: 'within' });
});

test('distingue risco futuro de orçamento já ultrapassado', () => {
  assert.equal(monthlySnapshot(budget(80000, 100000), [], [payment(30000, 'expense' as ScheduledPayment['type'], 'pending' as ScheduledPayment['status'])]).status, 'atRisk');
  assert.equal(monthlySnapshot(budget(110000, 100000), [], []).status, 'over');
  assert.equal(monthlySnapshot(budget(100000, 100000), [], []).status, 'within');
});

test('sem limite não inventa avaliação nem saldo disponível', () => {
  const result = monthlySnapshot(budget(20000, null), [], []);
  assert.equal(result.status, 'unset');
  assert.equal(result.remaining, null);
  assert.equal(result.forecast, 20000);
});

test('estornos não são recebimentos', () => {
  const reversal = { ...transaction(30000, 'income' as Transaction['type'], 'paid' as Transaction['status']), isReversal: true };
  assert.equal(monthlySnapshot(budget(0, 100000), [reversal], []).received, 0);
});
