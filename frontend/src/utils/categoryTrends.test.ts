import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Transaction } from '../types';
import { categoryTrends } from './categoryTrends.ts';

const expense = (date: string, amount: number, id = 'food', name = 'Alimentação', extras: Partial<Transaction> = {}): Transaction =>
  ({ date, amount, category: { _id: id, name }, type: 'expense', ...extras } as Transaction);

test('compara meses consecutivos e inclui meses sem gasto na série', () => {
  const result = categoryTrends([
    expense('2026-10-12T00:00:00.000Z', 20000),
    expense('2026-11-02T00:00:00.000Z', 18000),
    expense('2026-11-20T00:00:00.000Z', 12000),
  ], 2026, 11);
  assert.deepEqual(result.months, ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11']);
  assert.deepEqual(result.categories[0].amounts, [0, 0, 0, 0, 20000, 30000]);
  assert.equal(result.categories[0].percentage, 50);
  assert.equal(result.increases[0].difference, 10000);
});

test('ignora faturas pagas, estornos, receitas e despesas fora da janela', () => {
  const result = categoryTrends([
    expense('2026-11-04', 10000),
    expense('2026-11-04', 80000, 'food', 'Alimentação', { isPayment: true }),
    expense('2026-11-04', 80000, 'food', 'Alimentação', { isReversal: true }),
    expense('2026-11-04', 80000, 'food', 'Alimentação', { type: 'income' as Transaction['type'] }),
    expense('2026-05-04', 80000),
  ], 2026, 11);
  assert.equal(result.categories[0].current, 10000);
  assert.equal(result.categories[0].percentage, null);
  assert.equal(result.increases.length, 1);
});

test('não alerta por aumentos pequenos ou inferiores a 30%, mesmo com valor alto', () => {
  const result = categoryTrends([
    expense('2026-10-05', 5000), expense('2026-11-05', 10000),
    expense('2026-10-05', 100000, 'rent', 'Moradia'),
    expense('2026-11-05', 120000, 'rent', 'Moradia'),
  ], 2026, 11);
  assert.deepEqual(result.increases, []);
});

test('mudança de ano mantém ordem cronológica e categoria sem gasto no mês atual', () => {
  const result = categoryTrends([expense('2026-12-05', 15000)], 2027, 1);
  assert.equal(result.months[4], '2026-12');
  assert.equal(result.months[5], '2027-01');
  assert.equal(result.categories[0].difference, -15000);
  assert.deepEqual(result.increases, []);
});
