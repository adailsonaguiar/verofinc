import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { accountService } from '../services/accountService';
import { categoryService } from '../services/categoryService';
import { transactionService } from '../services/transactionService';
import { queryKeys } from '../lib/queryKeys';
import {
  Transaction,
  CreateTransactionDto,
  UpdateTransactionDto,
} from '../types';
import {
  FinancialView,
  formatCurrency,
  matchesFinancialView,
} from '../utils/transactions';
import { TransactionCard } from '../components/TransactionCard';
import { TransactionModal } from '../components/TransactionModal';
import { MonthSelector } from '../components/MonthSelector';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/EmptyState';
import { PageHeading } from '../components/PageHeading';
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type TabKey = 'todas' | 'entradas' | 'saidas';

export const TransactionsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [typeTab, setTypeTab] = useState<TabKey>('todas');
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [financialView, setFinancialView] =
    useState<FinancialView>('consumption');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const accountsQuery = useQuery({
    queryKey: queryKeys.accounts.all,
    queryFn: () => accountService.getAll(),
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => categoryService.getAll(),
  });

  const availableMonthsQuery = useQuery({
    queryKey: queryKeys.transactions.availableMonths,
    queryFn: () => transactionService.getAvailableMonths(),
  });

  const filters = useMemo(
    () => ({
      year: currentYear,
      month: currentMonth,
      account: selectedAccount === 'all' ? undefined : selectedAccount,
      category: filterCategory === 'all' ? undefined : filterCategory,
      status: filterStatus === 'all' ? undefined : filterStatus,
    }),
    [currentYear, currentMonth, selectedAccount, filterCategory, filterStatus]
  );

  const transactionsQuery = useQuery({
    queryKey: queryKeys.transactions.list(filters),
    queryFn: () => transactionService.getFiltered(filters),
    placeholderData: keepPreviousData,
  });

  const accounts = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);
  const categories = categoriesQuery.data ?? [];
  const transactions = useMemo(
    () => transactionsQuery.data ?? [],
    [transactionsQuery.data]
  );
  const loading = transactionsQuery.isPending && !transactionsQuery.data;

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

  useEffect(() => {
    if (searchParams.get('new') === '1') setIsModalOpen(true);
  }, [searchParams]);

  const invalidateTransactionData = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all }),
    ]);

  const handleCreateTransaction = async (data: CreateTransactionDto) => {
    await transactionService.create(data);
    await invalidateTransactionData();
  };

  const handleUpdateTransaction = async (data: UpdateTransactionDto) => {
    if (!editingTransaction) return;
    await transactionService.update(editingTransaction._id, data);
    await invalidateTransactionData();
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setOpenMenuId(null);
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = async (transaction: Transaction) => {
    setOpenMenuId(null);
    if (!confirm(`Deseja realmente excluir "${transaction.description}"?`)) {
      return;
    }

    try {
      await transactionService.delete(transaction._id);
      await invalidateTransactionData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Falha ao excluir transação.');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const handlePreviousMonth = () => {
    const index = availableMonths.findIndex(
      (m) => m.year === currentYear && m.month === currentMonth
    );
    if (index < availableMonths.length - 1) {
      const prevMonth = availableMonths[index + 1];
      setCurrentYear(prevMonth.year);
      setCurrentMonth(prevMonth.month);
    }
  };

  const handleNextMonth = () => {
    const index = availableMonths.findIndex(
      (m) => m.year === currentYear && m.month === currentMonth
    );
    if (index > 0) {
      const nextMonth = availableMonths[index - 1];
      setCurrentYear(nextMonth.year);
      setCurrentMonth(nextMonth.month);
    }
  };

  const currentIndexMonth = availableMonths.findIndex(
    (m) => m.year === currentYear && m.month === currentMonth
  );
  const hasPrevious = currentIndexMonth < availableMonths.length - 1;
  const hasNext = currentIndexMonth > 0;
  const currentMonthLabel =
    availableMonths.find(
      (m) => m.year === currentYear && m.month === currentMonth
    )?.label || '';

  const transactionsForView = useMemo(
    () =>
      transactions.filter((transaction) =>
        matchesFinancialView(transaction, financialView, accounts)
      ),
    [transactions, financialView, accounts]
  );

  const totalIncome = transactionsForView
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactionsForView
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const accountName = (accountId?: string) =>
    accounts.find((acc) => acc._id === accountId)?.name ?? '—';

  const term = query.trim().toLowerCase();
  const visibleTransactions = useMemo(() => {
    return transactionsForView.filter((t) => {
      const matchesTab =
        typeTab === 'todas'
          ? true
          : typeTab === 'entradas'
            ? t.type === 'income'
            : t.type === 'expense';
      const matchesQuery =
        term.length === 0 ||
        t.description.toLowerCase().includes(term) ||
        (t.category?.name ?? '').toLowerCase().includes(term);
      return matchesTab && matchesQuery;
    });
  }, [transactionsForView, typeTab, term]);

  const sortedVisibleTransactions = useMemo(
    () =>
      [...visibleTransactions].sort((a, b) => {
        const dateDiff =
          new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }),
    [visibleTransactions]
  );

  if (loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-navy-700 mb-3" />
          <p className="text-sm text-navy-500">Carregando transações...</p>
        </div>
      </div>
    );
  }

  const TABS: TabKey[] = ['todas', 'entradas', 'saidas'];

  return (
    <div className="mx-auto max-w-[1280px] space-y-6 px-4 pb-8 pt-8 md:px-[50px] md:pt-12">
      <PageHeading
        title="Transações"
        subtitle="Controle detalhado de cada movimentação."
        actions={
          <MonthSelector
            label={currentMonthLabel}
            hasPrevious={hasPrevious}
            hasNext={hasNext}
            onPrevious={handlePreviousMonth}
            onNext={handleNextMonth}
          />
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Entradas"
          value={formatCurrency(totalIncome)}
          sub={currentMonthLabel}
          tone="in"
        />
        <StatCard
          label={financialView === 'consumption' ? 'Despesas' : 'Saídas'}
          value={formatCurrency(totalExpense)}
          sub={currentMonthLabel}
          tone="out"
        />
        <StatCard
          label="Saldo do período"
          value={formatCurrency(balance)}
          sub={balance >= 0 ? 'Positivo' : 'Negativo'}
        />
      </div>

      <div className="card">
        <div className="flex flex-col gap-3 p-4 border-b border-bone-divider lg:flex-row lg:flex-wrap lg:items-center">
          <div className="min-w-0 lg:w-52">
            <label htmlFor="financial-view" className="sr-only">
              Visão financeira
            </label>
            <select
              id="financial-view"
              value={financialView}
              onChange={(e) =>
                setFinancialView(e.target.value as FinancialView)
              }
              className="input !py-2 text-sm"
            >
              <option value="consumption">Visão: consumo</option>
              <option value="cashFlow">Visão: fluxo de caixa</option>
              <option value="all">Todas as movimentações</option>
            </select>
          </div>

          <div className="flex shrink-0 gap-1 bg-navy-50 p-1 rounded-lg text-sm">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setTypeTab(tab)}
                className={`px-3 py-1.5 rounded-md capitalize transition-colors ${
                  typeTab === tab
                    ? 'bg-gold-400 text-[#171916] shadow-sm font-semibold'
                    : 'text-navy-500 hover:text-navy-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex min-w-0 items-center gap-2 px-3 py-2 bg-[#171719] border border-navy-200 rounded-lg lg:w-52">
            <Search className="w-4 h-4 text-navy-300 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent outline-none text-sm flex-1 text-navy-900 placeholder:text-navy-300"
              placeholder="Buscar..."
            />
          </div>

          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="input !w-auto min-w-0 max-w-full !py-2 text-sm"
            aria-label="Filtrar por conta"
          >
            <option value="all">Todas as contas</option>
            {accounts.map((acc) => (
              <option key={acc._id} value={acc._id}>
                {acc.name}
                {acc.type === 'credit_card' ? ' (Cartão)' : ''}
              </option>
            ))}
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input !w-auto min-w-0 max-w-full !py-2 text-sm"
            aria-label="Filtrar por categoria"
          >
            <option value="all">Todas as categorias</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input !w-auto min-w-0 max-w-full !py-2 text-sm"
            aria-label="Filtrar por situação"
          >
            <option value="all">Todas as situações</option>
            <option value="paid">Pago / Recebido</option>
            <option value="unpaid">Pendente</option>
          </select>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary shrink-0 lg:ml-auto"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
        </div>

        <div className="border-b border-bone-divider px-4 py-2.5 text-xs text-navy-500">
          {financialView === 'consumption'
            ? 'Compras e despesas do período; pagamentos de fatura não são contados novamente.'
            : financialView === 'cashFlow'
              ? 'Somente valores efetivamente movimentados nas contas, incluindo pagamentos de fatura.'
              : 'Histórico completo, incluindo compras no cartão e pagamentos de fatura.'}
        </div>

        {/* Desktop table */}
        {visibleTransactions.length > 0 ? (
          <>
            <table className="hidden md:table w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-navy-500 bg-bone-soft">
                <tr>
                  <th className="text-left px-4 py-3">Descrição</th>
                  <th className="text-left px-4 py-3">Categoria</th>
                  <th className="text-left px-4 py-3">Conta</th>
                  <th className="text-left px-4 py-3">Data</th>
                  <th className="text-right px-4 py-3">Valor</th>
                  <th className="text-right px-4 py-3 w-14">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-classic">
                {sortedVisibleTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';

                  const canDrag = typeTab === 'todas' && term.length === 0;
                  return (
                    <tr
                      key={tx._id}
                      className={`hover:bg-bone-soft transition-colors ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 ${
                              isIncome
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {isIncome ? (
                              <ArrowDown className="w-4 h-4" />
                            ) : (
                              <ArrowUp className="w-4 h-4" />
                            )}
                          </span>
                          <span className="text-navy-900 truncate">
                            {tx.description}
                          </span>
                          {tx.status === 'unpaid' && (
                            <span className="chip bg-amber-100 text-amber-800">
                              Pendente
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="chip bg-navy-100 text-navy-800">
                          {tx.category?.name || 'Sem categoria'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-navy-500">
                        {accountName(tx.account)}
                      </td>
                      <td className="px-4 py-3 num text-navy-500">
                        {format(
                          new Date(`${tx.date.split('T')[0]}T12:00:00`),
                          'dd/MM/yyyy'
                        )}
                      </td>
                      <td
                        className={`px-4 py-3 text-right num ${
                          isIncome ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-4 py-3 text-right relative">
                        <button
                          onClick={() =>
                            setOpenMenuId(openMenuId === tx._id ? null : tx._id)
                          }
                          className="p-2 rounded-lg text-navy-300 hover:text-navy-700 hover:bg-navy-100 transition-colors"
                          aria-label="Opções"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openMenuId === tx._id && (
                          <>
                            <div
                              className="fixed inset-0 z-20"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-4 top-12 w-40 bg-[#171719] rounded-lg border border-bone-border shadow-lg py-1 z-30">
                              <button
                                onClick={() => handleEditTransaction(tx)}
                                className="w-full px-3 py-2 text-left text-sm text-navy-700 hover:bg-bone-soft flex items-center gap-2"
                              >
                                <Pencil className="w-4 h-4" />
                                Editar
                              </button>
                              <button
                                onClick={() => handleDeleteTransaction(tx)}
                                className="w-full px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Excluir
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="md:hidden divide-classic">
              {sortedVisibleTransactions.map((tx) => (
                <TransactionCard
                  key={tx._id}
                  transaction={tx}
                  onEdit={handleEditTransaction}
                  onDelete={handleDeleteTransaction}
                />
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            icon={<Search className="w-6 h-6" />}
            title="Nenhuma transação encontrada"
            description="Ajuste os filtros ou mude o mês selecionado para encontrar o que procura."
          />
        )}
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={(data) =>
          editingTransaction
            ? handleUpdateTransaction(data as UpdateTransactionDto)
            : handleCreateTransaction(data as CreateTransactionDto)
        }
        initialData={editingTransaction || undefined}
        isEditing={!!editingTransaction}
      />
    </div>
  );
};
