import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertCircle, ArrowRight, Plus } from 'lucide-react';
import { budgetService } from '../services/budgetService';
import { transactionService } from '../services/transactionService';
import { scheduledPaymentService } from '../services/scheduledPaymentService';
import { ScheduledPaymentStatus } from '../types';
import { queryKeys } from '../lib/queryKeys';
import { DashboardScheduledPayments } from '../components/DashboardScheduledPayments';
import { DashboardCategoryTrends } from '../components/DashboardCategoryTrends';
import { BudgetProgressBar } from '../components/BudgetProgressBar';
import { MonthSelector } from '../components/MonthSelector';
import { Button } from '../components/Button';
import { formatCurrency, isInvestmentTransaction } from '../utils/transactions';
import { monthlySnapshot } from '../utils/monthlySnapshot';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());
  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth() + 1;
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const monthLabel = format(selectedMonth, 'MMMM yyyy', { locale: ptBR });

  const monthsQuery = useQuery({
    queryKey: queryKeys.transactions.availableMonths,
    queryFn: () => transactionService.getAvailableMonths(),
  });
  const transactionsQuery = useQuery({
    queryKey: queryKeys.transactions.list({ year, month }),
    queryFn: () => transactionService.getByMonth(year, month),
  });
  const budgetQuery = useQuery({
    queryKey: queryKeys.budgets.overview(monthKey),
    queryFn: () => budgetService.getOverview(monthKey),
  });
  const scheduledQuery = useQuery({
    queryKey: queryKeys.scheduledPayments.byMonth(year, month),
    queryFn: () => {
      const start = startOfMonth(new Date(year, month - 1, 1));
      return scheduledPaymentService.getAll({
        status: ScheduledPaymentStatus.PENDING,
        startDate: start.toISOString(),
        endDate: endOfMonth(start).toISOString(),
      });
    },
  });
  const historyStart = new Date(year, month - 6, 1);
  const historyStartDate = `${historyStart.getFullYear()}-${String(historyStart.getMonth() + 1).padStart(2, '0')}-01`;
  const historyEndDate = `${year}-${String(month).padStart(2, '0')}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}T23:59:59.999Z`;
  const historyQuery = useQuery({
    queryKey: queryKeys.transactions.list({ startDate: historyStartDate, endDate: historyEndDate }),
    queryFn: () => transactionService.getByDateRange(historyStartDate, historyEndDate),
  });

  const months = useMemo(() => {
    const keys = new Set((monthsQuery.data ?? []).map((item) => `${item.year}-${String(item.month).padStart(2, '0')}`));
    keys.add(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
    keys.add(monthKey);
    return [...keys].sort().reverse();
  }, [monthsQuery.data, monthKey]);
  const index = months.indexOf(monthKey);
  const changeMonth = (key: string) => {
    const [nextYear, nextMonth] = key.split('-').map(Number);
    setSelectedMonth(new Date(nextYear, nextMonth - 1, 1));
  };

  const budget = budgetQuery.data;
  const transactions = transactionsQuery.data;
  const scheduled = scheduledQuery.data;
  const snapshot = budget && transactions && scheduled
    ? monthlySnapshot(budget, transactions, scheduled)
    : null;
  const loading = budgetQuery.isPending || transactionsQuery.isPending || scheduledQuery.isPending;
  const error = budgetQuery.isError || transactionsQuery.isError || scheduledQuery.isError;
  const statusCopy = snapshot?.status === 'over'
    ? 'Orçamento ultrapassado'
    : snapshot?.status === 'atRisk'
      ? 'Agendamentos ultrapassam o orçamento'
      : snapshot?.status === 'within'
        ? 'Dentro do orçamento'
        : 'Orçamento não definido';
  const statusTone = snapshot?.status === 'over' || snapshot?.status === 'atRisk'
    ? 'text-rose-700'
    : snapshot?.status === 'within' ? 'text-emerald-400' : 'text-navy-700';
  const budgetedCategories = (budget?.items ?? [])
    .filter((item) => item.limit != null)
    .sort((a, b) => (b.spent / (b.limit || 1)) - (a.spent / (a.limit || 1)))
    .slice(0, 3);
  const scheduledInvestments = (scheduled ?? [])
    .filter(isInvestmentTransaction)
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <main className="mx-auto max-w-[1280px] space-y-6 px-4 pb-10 pt-8 md:px-[50px] md:pt-12">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl text-navy-900 md:text-3xl">Seu mês, em números</h1>
          <p className="mt-2 text-sm text-navy-500">O que já aconteceu, o que vem pela frente e como fica seu orçamento.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MonthSelector
            label={monthLabel}
            hasPrevious={index < months.length - 1}
            hasNext={index > 0}
            onPrevious={() => changeMonth(months[index + 1])}
            onNext={() => changeMonth(months[index - 1])}
          />
          <button onClick={() => navigate('/transactions?new=1')} className="btn btn-primary">
            <Plus className="h-4 w-4" /> Nova transação
          </button>
        </div>
      </header>

      {loading ? (
        <div className="space-y-4" role="status" aria-label="Carregando resumo do mês">
          <div className="card h-44 animate-pulse bg-navy-100" />
          <div className="card h-48 animate-pulse bg-navy-100" />
        </div>
      ) : error || !snapshot ? (
        <div className="card p-6" role="alert">
          <AlertCircle className="mb-3 h-5 w-5 text-rose-700" />
          <h2 className="font-display text-lg">Não foi possível mostrar o resumo deste mês</h2>
          <p className="mt-2 text-sm text-navy-500">Seus dados não foram alterados. Tente carregar novamente.</p>
          <Button className="mt-4" onClick={() => {
            budgetQuery.refetch(); transactionsQuery.refetch(); scheduledQuery.refetch();
          }}>Tentar novamente</Button>
        </div>
      ) : (
        <>
          <section aria-label="Resumo financeiro do mês" className="card overflow-hidden">
            <div className="grid gap-px bg-bone-divider sm:grid-cols-3">
              <div className="bg-[#121214] p-5 md:p-7">
                <p className="text-sm text-navy-500">Já gastei</p>
                <p className="num mt-3 text-2xl font-semibold text-navy-900 md:text-3xl">{formatCurrency(snapshot.spent)}</p>
                <p className="mt-2 text-xs text-navy-500">Despesas registradas, sem repetir faturas pagas</p>
              </div>
              <div className="bg-[#121214] p-5 md:p-7">
                <p className="text-sm text-navy-500">Já recebi</p>
                <p className="num mt-3 text-2xl font-semibold text-emerald-400 md:text-3xl">{formatCurrency(snapshot.received)}</p>
                <p className="mt-2 text-xs text-navy-500">Receitas marcadas como recebidas</p>
              </div>
              <div className="bg-[#121214] p-5 md:p-7">
                <p className="text-sm text-navy-500">Total previsto de gastos</p>
                <p className="num mt-3 text-2xl font-semibold text-navy-900 md:text-3xl">{formatCurrency(snapshot.forecast)}</p>
                <p className="mt-2 text-xs text-navy-500">{formatCurrency(snapshot.spent)} registrados + {formatCurrency(snapshot.pending)} agendados</p>
              </div>
            </div>
          </section>

          <section aria-labelledby="budget-heading" className="card p-5 md:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="budget-heading" className="font-display text-xl text-navy-900">Como está meu orçamento?</h2>
                <p className={`mt-2 text-base font-semibold ${statusTone}`}>{statusCopy}</p>
              </div>
              <Link to="/budgets" className="btn btn-outline">{snapshot.limit == null ? 'Definir orçamento' : 'Ver orçamento'} <ArrowRight className="h-4 w-4" /></Link>
            </div>
            {snapshot.limit == null ? (
              <p className="mt-5 text-sm text-navy-500">Defina um limite mensal para comparar seus gastos registrados e agendados.</p>
            ) : (
              <div className="mt-6">
                <p className="text-sm text-navy-700">
                  {snapshot.status === 'over'
                    ? `O gasto registrado já passou ${formatCurrency(snapshot.spent - snapshot.limit)} do limite. Com agendamentos, o excesso previsto é ${formatCurrency(-snapshot.remaining!)}.`
                    : snapshot.status === 'atRisk'
                      ? `Ainda dentro do limite pelo que foi registrado, mas os agendamentos deixam a previsão ${formatCurrency(-snapshot.remaining!)} acima.`
                      : `Mesmo com os agendamentos, ainda restam ${formatCurrency(snapshot.remaining!)} do limite.`}
                </p>
                <div className="mt-5 flex flex-wrap justify-between gap-2 text-xs text-navy-500">
                  <span>Registrado: <strong className="num text-navy-900">{formatCurrency(snapshot.spent)}</strong></span>
                  <span>Agendado: <strong className="num text-navy-900">{formatCurrency(snapshot.pending)}</strong></span>
                  <span>Limite: <strong className="num text-navy-900">{formatCurrency(snapshot.limit)}</strong></span>
                </div>
                <BudgetProgressBar pct={snapshot.limit > 0 ? Math.round(snapshot.forecast / snapshot.limit * 100) : null} className="mt-3" />
                <p className="mt-2 text-xs text-navy-500">{snapshot.limit > 0 ? `${Math.round(snapshot.forecast / snapshot.limit * 100)}% do limite comprometido` : 'Limite sem valor'}</p>
              </div>
            )}
          </section>

          {budgetedCategories.length > 0 && (
            <section className="card p-5 md:p-7" aria-labelledby="categories-heading">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="categories-heading" className="font-display text-lg">Limites por categoria</h2>
                <Link to="/budgets" className="text-sm text-gold-400 hover:underline">Ver todas <ArrowRight className="inline h-4 w-4" /></Link>
              </div>
              <ul className="mt-5 grid gap-5 md:grid-cols-3">
                {budgetedCategories.map((item) => (
                  <li key={item.category._id}>
                    <div className="flex justify-between gap-2 text-sm"><span className="truncate">{item.category.name}</span><span className="num shrink-0 text-navy-500">{formatCurrency(item.spent)} / {formatCurrency(item.limit!)}</span></div>
                    <BudgetProgressBar pct={item.limit ? Math.round(item.spent / item.limit * 100) : null} className="mt-2" />
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-navy-500">Por categoria: apenas despesas registradas. Agendamentos entram na previsão geral acima.</p>
            </section>
          )}

          {historyQuery.isPending ? (
            <div className="card h-80 animate-pulse bg-navy-100" role="status" aria-label="Carregando comparativo por categoria" />
          ) : historyQuery.isError ? (
            <section className="card p-5" aria-label="Comparativo por categoria">
              <h2 className="font-display text-lg">Comparativo por categoria indisponível</h2>
              <p className="mt-2 text-sm text-navy-500">Não foi possível carregar o histórico de gastos.</p>
              <Button className="mt-4" onClick={() => historyQuery.refetch()}>Tentar novamente</Button>
            </section>
          ) : (
            <DashboardCategoryTrends transactions={historyQuery.data ?? []} year={year} month={month} />
          )}

          <section className="card p-5 md:p-7" aria-label="Próximos agendamentos">
            <DashboardScheduledPayments
              payments={scheduled!}
              scheduledOutflow={snapshot.pending - scheduledInvestments}
              scheduledInvestments={scheduledInvestments}
              scheduledIncome={scheduled!.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0)}
              monthLabel={monthLabel}
              loading={false}
              error={false}
              onRetry={() => scheduledQuery.refetch()}
            />
          </section>
        </>
      )}
    </main>
  );
};
