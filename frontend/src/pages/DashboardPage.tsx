import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Activity, Loader2, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { categoryService } from '../services/categoryService';
import { transactionService } from '../services/transactionService';
import { accountService } from '../services/accountService';
import { scheduledPaymentService } from '../services/scheduledPaymentService';
import { ScheduledPaymentStatus, TransactionType } from '../types';
import { queryKeys } from '../lib/queryKeys';
import { CashFlowChart } from '../components/CashFlowChart';
import { CategoryComparisonChart } from '../components/CategoryComparisonChart';
import { CategoryEvolutionChart } from '../components/CategoryEvolutionChart';
import { DailySpendingChart } from '../components/DailySpendingChart';
import { DashboardCategoryDonut } from '../components/DashboardCategoryDonut';
import { DashboardBudgetSection } from '../components/DashboardBudgetSection';
import { DashboardInsights } from '../components/DashboardInsights';
import { DashboardRecentTransactions } from '../components/DashboardRecentTransactions';
import { DashboardScheduledPayments } from '../components/DashboardScheduledPayments';
import { DashboardSummaryCards } from '../components/DashboardSummaryCards';
import type { SummaryStat } from '../components/DashboardSummaryCards';
import { MonthSelector } from '../components/MonthSelector';
import { Button } from '../components/Button';
import {
  FinancialView,
  isInvestmentTransaction,
  matchesFinancialView,
} from '../utils/transactions';

const brl = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [financialView, setFinancialView] =
    useState<FinancialView>('consumption');

  const availableMonthsQuery = useQuery({
    queryKey: queryKeys.transactions.availableMonths,
    queryFn: () => transactionService.getAvailableMonths(),
  });

  const availableMonths = useMemo(
    () =>
      (availableMonthsQuery.data ?? []).map((m) => ({
        year: m.year,
        month: m.month,
        label: format(new Date(m.year, m.month - 1), 'MMMM yyyy', {
          locale: ptBR,
        }),
      })),
    [availableMonthsQuery.data]
  );

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => categoryService.getAll(),
  });

  const checkingAccountsQuery = useQuery({
    queryKey: queryKeys.accounts.byType('checking'),
    queryFn: () => accountService.getByType('checking'),
  });

  const creditCardsQuery = useQuery({
    queryKey: queryKeys.accounts.byType('credit_card'),
    queryFn: () => accountService.getByType('credit_card'),
  });

  const lastMonthsQuery = useQuery({
    queryKey: queryKeys.transactions.lastMonths(6),
    queryFn: () => transactionService.getLastMonths(6),
  });

  const allTransactions = useMemo(
    () =>
      [...(lastMonthsQuery.data ?? [])].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [lastMonthsQuery.data]
  );

  const monthTransactionsQuery = useQuery({
    queryKey: queryKeys.transactions.list({
      year: currentYear,
      month: currentMonth,
    }),
    queryFn: () => transactionService.getByMonth(currentYear, currentMonth),
    placeholderData: keepPreviousData,
  });

  const scheduledPaymentsQuery = useQuery({
    queryKey: queryKeys.scheduledPayments.byMonth(currentYear, currentMonth),
    queryFn: () => {
      const monthStart = startOfMonth(
        new Date(currentYear, currentMonth - 1, 1)
      );
      const monthEnd = endOfMonth(monthStart);

      return scheduledPaymentService.getAll({
        status: ScheduledPaymentStatus.PENDING,
        startDate: monthStart.toISOString(),
        endDate: monthEnd.toISOString(),
      });
    },
    placeholderData: keepPreviousData,
  });

  const categories = categoriesQuery.data ?? [];
  const checkingAccounts = useMemo(
    () => checkingAccountsQuery.data ?? [],
    [checkingAccountsQuery.data]
  );
  const creditCards = useMemo(
    () => creditCardsQuery.data ?? [],
    [creditCardsQuery.data]
  );
  const transactions = useMemo(
    () => monthTransactionsQuery.data ?? [],
    [monthTransactionsQuery.data]
  );
  const loading =
    availableMonthsQuery.isPending ||
    categoriesQuery.isPending ||
    checkingAccountsQuery.isPending ||
    creditCardsQuery.isPending ||
    lastMonthsQuery.isPending ||
    monthTransactionsQuery.isPending ||
    scheduledPaymentsQuery.isPending;
  const error =
    monthTransactionsQuery.isError && !monthTransactionsQuery.data
      ? 'Erro ao carregar dados do dashboard.'
      : null;

  // Month navigation
  const currentIndex = availableMonths.findIndex(
    (m) => m.year === currentYear && m.month === currentMonth
  );
  const hasPrevious = currentIndex < availableMonths.length - 1;
  const hasNext = currentIndex > 0;
  const currentMonthLabel =
    availableMonths.find(
      (m) => m.year === currentYear && m.month === currentMonth
    )?.label ||
    format(new Date(currentYear, currentMonth - 1), 'MMMM yyyy', {
      locale: ptBR,
    });
  const monthShort = format(new Date(currentYear, currentMonth - 1), 'MMM', {
    locale: ptBR,
  })
    .replace('.', '')
    .replace(/^./, (char) => char.toUpperCase());

  const handlePreviousMonth = () => {
    if (hasPrevious) {
      const prev = availableMonths[currentIndex + 1];
      setCurrentYear(prev.year);
      setCurrentMonth(prev.month);
    }
  };

  const handleNextMonth = () => {
    if (hasNext) {
      const next = availableMonths[currentIndex - 1];
      setCurrentYear(next.year);
      setCurrentMonth(next.month);
    }
  };

  // Computed values
  const accounts = useMemo(
    () => [...checkingAccounts, ...creditCards],
    [checkingAccounts, creditCards]
  );
  const transactionsForTotals = useMemo(
    () =>
      transactions.filter((transaction) =>
        matchesFinancialView(transaction, financialView, accounts)
      ),
    [transactions, financialView, accounts]
  );
  const allTransactionsForView = useMemo(
    () =>
      allTransactions.filter((transaction) =>
        matchesFinancialView(transaction, financialView, accounts)
      ),
    [allTransactions, financialView, accounts]
  );
  const incomeTx = transactionsForTotals.filter((t) => t.type === 'income');
  const expenseTx = transactionsForTotals.filter((t) => t.type === 'expense');
  const investmentTx = expenseTx.filter(isInvestmentTransaction);
  const cashOutflowTx = expenseTx.filter((t) => !isInvestmentTransaction(t));
  const totalIncome = incomeTx.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenseTx.reduce((sum, t) => sum + t.amount, 0);
  const totalCashOutflow = cashOutflowTx.reduce((sum, t) => sum + t.amount, 0);
  const totalInvoicePayments = transactionsForTotals
    .filter((transaction) => transaction.isPayment)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalInvestments = investmentTx.reduce((sum, t) => sum + t.amount, 0);
  const totalCheckingBalance = checkingAccounts.reduce(
    (sum, acc) => sum + (acc.initialBalance || 0),
    0
  );
  const openInvoice = creditCards.reduce(
    (sum, card) =>
      sum + Math.max(0, (card.creditLimit || 0) - (card.initialBalance || 0)),
    0
  );
  const recentGlobalTransactions = allTransactionsForView.slice(0, 5);

  const scheduledPayments = scheduledPaymentsQuery.isError
    ? []
    : scheduledPaymentsQuery.data ?? [];
  const scheduledExpensePayments = scheduledPayments.filter(
    (payment) => payment.type === TransactionType.EXPENSE
  );
  const scheduledCashOutflowPayments = scheduledExpensePayments.filter(
    (payment) => !isInvestmentTransaction(payment)
  );
  const scheduledInvestmentPayments = scheduledExpensePayments.filter(
    (payment) => isInvestmentTransaction(payment)
  );
  const scheduledIncomePayments = scheduledPayments.filter(
    (payment) => payment.type === TransactionType.INCOME
  );
  const totalScheduledCashOutflow = scheduledCashOutflowPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );
  const totalScheduledInvestments = scheduledInvestmentPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );
  const totalScheduledIncome = scheduledIncomePayments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );
  const totalForecastOutflow = totalCashOutflow + totalScheduledCashOutflow;
  const scheduledPaymentsUnavailable = scheduledPaymentsQuery.isError;

  const spark = useMemo(() => {
    const map: Record<string, number> = {};
    allTransactionsForView
      .forEach((t) => {
        const [y, m] = t.date.split('T')[0].split('-');
        const key = `${y}-${m}`;
        const signed = t.type === 'income' ? t.amount : -t.amount;
        map[key] = (map[key] ?? 0) + signed;
      });
    const values = Object.keys(map)
      .sort()
      .slice(-9)
      .map((k) => map[k] / 100);
    const max = Math.max(1, ...values.map((v) => Math.abs(v)));
    return values.map((v) => Math.round(8 + (Math.abs(v) / max) * 17));
  }, [allTransactionsForView]);

  const firstName = (user?.name || '').split(' ')[0] || '';
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const dateKicker = format(new Date(), 'EEEE, d \'de\' MMMM \'de\' yyyy', {
    locale: ptBR,
  }).toUpperCase();

  const stats: SummaryStat[] = [
    {
      label: 'Saldo consolidado',
      value: brl(totalCheckingBalance),
      sub: `${checkingAccounts.length} conta(s) ativa(s)`,
      highlight: true,
      trend: '+4,8%',
      spark,
    },
    {
      label: `Entradas (${monthShort})`,
      value: brl(totalIncome),
      sub: `${incomeTx.length} lançamento(s)`,
      tone: 'in',
      bar: 62,
    },
    {
      label:
        financialView === 'cashFlow'
          ? `Saídas efetivas (${monthShort})`
          : `Despesas previstas (${monthShort})`,
      value:
        financialView === 'cashFlow'
          ? brl(totalExpense)
          : brl(totalForecastOutflow),
      sub:
        financialView === 'cashFlow'
          ? 'Movimentadas nas contas'
          : scheduledPaymentsUnavailable
            ? `${brl(totalCashOutflow)} realizado · agendados indisponíveis`
            : `${brl(totalCashOutflow)} realizado + ${brl(
                totalScheduledCashOutflow
              )} agendado`,
      tone: 'out',
      bar: 38,
      barWarm: true,
    },
    {
      label:
        financialView === 'cashFlow'
          ? `Faturas pagas (${monthShort})`
          : `Investimentos (${monthShort})`,
      value:
        financialView === 'cashFlow'
          ? brl(totalInvoicePayments)
          : brl(totalInvestments),
      sub:
        financialView === 'cashFlow'
          ? 'Incluídas nas saídas efetivas'
          : `${investmentTx.length} aporte(s)`,
    },
    {
      label: 'Fatura aberta',
      value: brl(openInvoice),
      sub: `${creditCards.length} cartão(ões) ativo(s)`,
    },
  ];

  if (loading && allTransactions.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-navy-700 mb-3" />
          <p className="text-sm text-navy-500">Buscando suas finanças...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <div className="card p-8 max-w-md">
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="font-display text-lg text-navy-900 mb-2">
            Ops, algo deu errado
          </h3>
          <p className="text-sm text-navy-500 mb-6">{error}</p>
          <Button onClick={() => monthTransactionsQuery.refetch()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] space-y-6 px-4 pb-8 pt-8 md:px-[50px] md:pt-12">
      <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-3 text-[9px] font-medium uppercase tracking-[0.16em] text-navy-300">
            {dateKicker}
          </p>
          <h1 className="text-2xl font-[650] tracking-[-0.06em] md:text-[33px]">
            {greeting}
            {firstName ? `, ${firstName}` : ''}{' '}
            <span className="align-top text-lg text-gold-400">✦</span>
          </h1>
          <p className="mt-2 text-xs text-navy-500">
            Aqui está o retrato da sua vida financeira.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MonthSelector
            label={currentMonthLabel}
            hasPrevious={hasPrevious}
            hasNext={hasNext}
            onPrevious={handlePreviousMonth}
            onNext={handleNextMonth}
          />
          <button
            onClick={() => navigate('/transactions?new=1')}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4" />
            Nova transação
          </button>
        </div>
      </section>

      <DashboardSummaryCards stats={stats} />

      <div className="flex flex-col gap-3 border-y border-bone-divider py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-navy-900">Visão financeira</p>
          <p className="mt-1 text-xs text-navy-500">
            {financialView === 'consumption'
              ? 'Mostra quando você comprou ou assumiu uma despesa, sem duplicar o pagamento da fatura.'
              : 'Mostra somente o dinheiro que entrou ou saiu das suas contas, incluindo faturas pagas.'}
          </p>
        </div>
        <div className="flex shrink-0 gap-1 rounded-lg bg-navy-50 p-1" role="group" aria-label="Selecionar visão financeira">
          {([
            ['consumption', 'Consumo'],
            ['cashFlow', 'Fluxo de caixa'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFinancialView(value)}
              aria-pressed={financialView === value}
              className={`rounded-md px-3 py-2 text-sm transition-colors ${
                financialView === value
                  ? 'bg-gold-400 font-semibold text-[#171916]'
                  : 'text-navy-500 hover:text-navy-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <DashboardScheduledPayments
          payments={scheduledPayments}
          scheduledOutflow={totalScheduledCashOutflow}
          scheduledInvestments={totalScheduledInvestments}
          scheduledIncome={totalScheduledIncome}
          monthLabel={currentMonthLabel}
          loading={scheduledPaymentsQuery.isPending}
          error={scheduledPaymentsQuery.isError}
          onRetry={() => scheduledPaymentsQuery.refetch()}
        />
      </div>

      <DashboardBudgetSection year={currentYear} month={currentMonth} />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <CashFlowChart
            allTransactions={allTransactionsForView}
            includeInvestments={financialView === 'cashFlow'}
            subtitle={
              financialView === 'cashFlow'
                ? 'Movimentações efetivas · últimos 7 meses'
                : 'Receitas e despesas · últimos 7 meses'
            }
          />
        </div>
        <div className="card p-5">
          <DashboardCategoryDonut
            categories={categories}
            transactions={transactions}
            currentMonthLabel={currentMonthLabel}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <DailySpendingChart
            transactions={transactionsForTotals}
            year={currentYear}
            month={currentMonth}
          />
        </div>
        <div className="card p-5">
          <DashboardInsights
            transactions={transactions}
            allTransactions={allTransactions}
            year={currentYear}
            month={currentMonth}
          />
        </div>
      </div>

      <div className="grid min-w-0 lg:grid-cols-3 gap-4">
        <div className="card min-w-0 p-5">
          <DashboardRecentTransactions transactions={recentGlobalTransactions} />
        </div>
        <div className="min-w-0 lg:col-span-2">
          <CategoryEvolutionChart
            allTransactions={allTransactions}
            categories={categories}
          />
        </div>
      </div>

      <CategoryComparisonChart
        allTransactions={allTransactions}
        categories={categories}
      />
    </div>
  );
};
