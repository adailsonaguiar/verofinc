import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2, Target } from 'lucide-react';
import { budgetService } from '../services/budgetService';
import { BudgetCategoryItem, BudgetOverview } from '../types';
import { formatCurrency } from '../utils/transactions';
import { SectionTitle } from './SectionTitle';
import { BudgetProgressBar } from './BudgetProgressBar';

const brl = (cents: number) => formatCurrency(cents);

interface DashboardBudgetSectionProps {
  year: number;
  month: number;
}

/** Read-only monthly budget summary for the dashboard, linking to /budgets for editing. */
export const DashboardBudgetSection: React.FC<DashboardBudgetSectionProps> = ({
  year,
  month,
}) => {
  const [overview, setOverview] = useState<BudgetOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    setLoading(true);
    budgetService
      .getOverview(monthKey)
      .then((data) => {
        if (active) setOverview(data);
      })
      .catch((err) => {
        console.error('Erro ao carregar orçamento:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [year, month]);

  const totalLimit = overview?.totalLimit ?? null;
  const totalSpent = overview?.totalSpent ?? 0;
  const totalPct = totalLimit ? Math.round((totalSpent / totalLimit) * 100) : null;
  const available = totalLimit != null ? totalLimit - totalSpent : null;

  const budgetedItems = (overview?.items ?? [])
    .filter(
      (item): item is BudgetCategoryItem & { limit: number } => item.limit != null
    )
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 4);

  const hasAnyBudget = totalLimit != null || budgetedItems.length > 0;

  return (
    <section className="card p-5 md:p-6">
      <SectionTitle
        title="Orçamento do mês"
        subtitle="Limites e gastos por categoria"
        action={
          <Link to="/budgets" className="btn btn-outline !px-3 !py-1.5 text-xs">
            Gerenciar
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      />

      {loading && !overview ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-navy-700" />
        </div>
      ) : !hasAnyBudget ? (
        <div className="flex flex-col items-center justify-center text-center py-10">
          <div className="w-14 h-14 rounded-full bg-bone-soft border border-bone-border flex items-center justify-center mb-4 text-navy-300">
            <Target className="w-6 h-6" />
          </div>
          <p className="font-display text-base text-navy-900">
            Nenhum orçamento definido
          </p>
          <p className="text-sm text-navy-500 mt-1 max-w-sm">
            Defina limites por categoria para acompanhar seus gastos do mês.
          </p>
          <Link to="/budgets" className="btn btn-primary mt-5">
            Definir orçamento
          </Link>
        </div>
      ) : (
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          {/* Total */}
          <div>
            <div className="flex items-baseline justify-between">
              <span className="stat-label">Gasto do mês</span>
              {totalPct != null && (
                <span className="num text-xs text-navy-700">{totalPct}%</span>
              )}
            </div>
            <div className="num text-2xl md:text-3xl text-navy-900 mt-2">
              {brl(totalSpent)}
            </div>
            <BudgetProgressBar pct={totalPct} className="mt-3" />
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <div className="stat-label">Limite</div>
                <div className="num text-base text-navy-900 mt-1">
                  {totalLimit != null ? brl(totalLimit) : '—'}
                </div>
              </div>
              <div>
                <div className="stat-label">Disponível</div>
                <div
                  className={`num text-base mt-1 ${
                    available == null
                      ? 'text-navy-900'
                      : available < 0
                        ? 'text-rose-700'
                        : 'text-emerald-700'
                  }`}
                >
                  {available != null ? brl(available) : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Category progress */}
          <div>
            <span className="text-xs text-navy-500">Por categoria</span>
            {budgetedItems.length > 0 ? (
              <ul className="space-y-4">
                {budgetedItems.map((item) => {
                  const pct = Math.round((item.spent / item.limit) * 100);
                  return (
                    <li key={item.category._id}>
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <span className="text-sm text-navy-900 truncate">
                          {item.category.name}
                        </span>
                        <span className="num text-xs text-navy-700 shrink-0">
                          {brl(item.spent)} / {brl(item.limit)}
                        </span>
                      </div>
                      <BudgetProgressBar pct={pct} />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-navy-500">
                Defina limites por categoria para ver o progresso aqui.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
