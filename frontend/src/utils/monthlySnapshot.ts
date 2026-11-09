import type { BudgetOverview, ScheduledPayment, Transaction } from '../types';

export function monthlySnapshot(
  budget: BudgetOverview,
  transactions: Transaction[],
  scheduled: ScheduledPayment[]
) {
  // O orçamento contabiliza despesas registradas (inclusive compras no cartão),
  // mas não pagamentos de fatura. Usar o total da API evita dupla contagem.
  const spent = budget.totalSpent;
  const received = transactions
    .filter((tx) => tx.type === 'income' && tx.status === 'paid' && !tx.isReversal)
    .reduce((sum, tx) => sum + tx.amount, 0);
  const pending = scheduled
    .filter((payment) => payment.type === 'expense' && payment.status === 'pending')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const forecast = spent + pending;
  const limit = budget.totalLimit;

  return {
    spent,
    received,
    pending,
    forecast,
    limit,
    remaining: limit == null ? null : limit - forecast,
    status: limit == null
      ? 'unset' as const
      : spent > limit
        ? 'over' as const
        : forecast > limit
          ? 'atRisk' as const
          : 'within' as const,
  };
}
