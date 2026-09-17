import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Activity, Loader2 } from 'lucide-react';
import { categoryService } from '../services/categoryService';
import { transactionService } from '../services/transactionService';
import { accountService } from '../services/accountService';
import { Category, Transaction } from '../types';
import { CashFlowChart } from '../components/CashFlowChart';
import { CategoryComparisonChart } from '../components/CategoryComparisonChart';
import { CategoryEvolutionChart } from '../components/CategoryEvolutionChart';
import { DailySpendingChart } from '../components/DailySpendingChart';
import { DashboardCategoryDonut } from '../components/DashboardCategoryDonut';
import { DashboardInsights } from '../components/DashboardInsights';
import { DashboardRecentTransactions } from '../components/DashboardRecentTransactions';
import { DashboardSummaryCards } from '../components/DashboardSummaryCards';
import type { SummaryStat } from '../components/DashboardSummaryCards';
import { MonthSelector } from '../components/MonthSelector';
import { Button } from '../components/Button';

interface AccountLike {
  _id: string;
  name: string;
  type: string;
  initialBalance?: number;
  creditLimit?: number;
}

const brl = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [checkingAccounts, setCheckingAccounts] = useState<AccountLike[]>([]);
  const [creditCards, setCreditCards] = useState<AccountLike[]>([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [availableMonths, setAvailableMonths] = useState<
    { year: number; month: number; label: string }[]
  >([]);

  useEffect(() => {
    loadAvailableMonths();
    loadAccounts();
    loadCategories();
    loadAllTransactions();
  }, []);

  useEffect(() => {
    if (currentYear && currentMonth) loadMonthTransactions();
  }, [currentYear, currentMonth]);

  const loadAvailableMonths = async () => {
    try {
      const months = await transactionService.getAvailableMonths();
      setAvailableMonths(
        months.map((m) => ({
          year: m.year,
          month: m.month,
          label: format(new Date(m.year, m.month - 1), 'MMMM yyyy', {
            locale: ptBR,
          }),
        }))
      );
    } catch (err) {
      console.error('Erro ao carregar meses disponíveis:', err);
    }
  };

  const loadCategories = async () => {
    try {
      setCategories(await categoryService.getAll());
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    }
  };

  const loadAccounts = async () => {
    try {
      setCheckingAccounts(await accountService.getByType('checking'));
      setCreditCards(await accountService.getByType('credit_card'));
    } catch (err) {
      console.error('Erro ao carregar contas:', err);
    }
  };

  const loadAllTransactions = async () => {
    try {
      const all = await transactionService.getLastMonths(6);
      setAllTransactions(
        [...all].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      );
    } catch (err) {
      console.error('Erro ao carregar transações:', err);
    }
  };

  const loadMonthTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      setTransactions(
        await transactionService.getByMonth(currentYear, currentMonth)
      );
    } catch (err) {
      setError('Erro ao carregar dados do dashboard.');
    } finally {
      setLoading(false);
    }
  };

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
  const transactionsForTotals = transactions.filter((t) => !t.isPayment);
  const incomeTx = transactionsForTotals.filter((t) => t.type === 'income');
  const expenseTx = transactionsForTotals.filter((t) => t.type === 'expense');
  const totalIncome = incomeTx.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenseTx.reduce((sum, t) => sum + t.amount, 0);
  const totalCheckingBalance = checkingAccounts.reduce(
    (sum, acc) => sum + (acc.initialBalance || 0),
    0
  );
  const openInvoice = creditCards.reduce(
    (sum, card) =>
      sum + Math.max(0, (card.creditLimit || 0) - (card.initialBalance || 0)),
    0
  );
  const recentGlobalTransactions = allTransactions.slice(0, 5);

  const stats: SummaryStat[] = [
    {
      label: 'Saldo consolidado',
      value: brl(totalCheckingBalance),
      sub: `${checkingAccounts.length} conta(s) ativa(s)`,
    },
    {
      label: `Entradas (${monthShort})`,
      value: brl(totalIncome),
      sub: `${incomeTx.length} lançamento(s)`,
      tone: 'in',
    },
    {
      label: `Saídas (${monthShort})`,
      value: brl(totalExpense),
      sub: `${expenseTx.length} lançamento(s)`,
      tone: 'out',
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
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mb-4">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="font-display text-lg text-navy-900 mb-2">
            Ops, algo deu errado
          </h3>
          <p className="text-sm text-navy-500 mb-6">{error}</p>
          <Button onClick={loadMonthTransactions}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <p className="text-sm text-navy-500">
          Acompanhe seus resultados e atinja suas metas.
        </p>
        <MonthSelector
          label={currentMonthLabel}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          onPrevious={handlePreviousMonth}
          onNext={handleNextMonth}
        />
      </div>

      <DashboardSummaryCards stats={stats} />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <CashFlowChart allTransactions={allTransactions} />
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

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <DashboardRecentTransactions transactions={recentGlobalTransactions} />
        </div>
        <div className="lg:col-span-2">
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
