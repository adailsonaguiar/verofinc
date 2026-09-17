import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import {
  Transaction,
  CreateTransactionDto,
  UpdateTransactionDto,
} from '../types';
import { formatCurrency } from '../utils/transactions';
import { TransactionCard } from '../components/TransactionCard';
import { TransactionModal } from '../components/TransactionModal';
import { MonthSelector } from '../components/MonthSelector';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/EmptyState';
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../services/api';

type TabKey = 'todas' | 'entradas' | 'saidas';

interface AccountOption {
  _id: string;
  name: string;
  type: string;
}

interface CategoryOption {
  _id: string;
  name: string;
}

export const TransactionsPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  const [typeTab, setTypeTab] = useState<TabKey>('todas');
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [availableMonths, setAvailableMonths] = useState<
    { year: number; month: number; label: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // drag-and-drop secondary ordering
  const [orderedTransactions, setOrderedTransactions] = useState<Transaction[]>(
    []
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragIndexRef = useRef<number | null>(null);

  useEffect(() => {
    loadCategories();
    loadAvailableMonths();
    loadAccounts();
  }, []);

  useEffect(() => {
    if (searchParams.get('new') === '1') setIsModalOpen(true);
  }, [searchParams]);

  useEffect(() => {
    if (currentYear && currentMonth) {
      loadMonthTransactions();
    }
  }, [currentYear, currentMonth, selectedAccount, filterCategory, filterStatus]);

  const loadAccounts = async () => {
    try {
      setAccounts(await accountService.getAll());
    } catch (err) {
      console.error('Erro ao carregar contas:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res?.data);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    }
  };

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
      console.error('Error loading available months:', err);
    }
  };

  const loadMonthTransactions = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = {
        year: currentYear,
        month: currentMonth,
      };
      if (selectedAccount !== 'all') params.account = selectedAccount;
      if (filterCategory !== 'all') params.category = filterCategory;
      if (filterStatus !== 'all') params.status = filterStatus;

      const queryString = Object.entries(params)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join('&');

      const res = await api.get(`/transactions?${queryString}`);
      setTransactions(res?.data);
      setOrderedTransactions(res?.data ?? []);
    } catch (err) {
      console.error('Error loading transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransaction = async (data: CreateTransactionDto) => {
    await transactionService.create(data);
    await loadAvailableMonths();
    await loadMonthTransactions();
  };

  const handleUpdateTransaction = async (data: UpdateTransactionDto) => {
    if (!editingTransaction) return;
    await transactionService.update(editingTransaction._id, data);
    await loadAvailableMonths();
    await loadMonthTransactions();
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
      await loadAvailableMonths();
      await loadMonthTransactions();
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

  const transactionsForTotals = transactions.filter((t) => !t.isPayment);

  const totalIncome = transactionsForTotals
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactionsForTotals
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const accountName = (accountId?: string) =>
    accounts.find((acc) => acc._id === accountId)?.name ?? '—';

  const term = query.trim().toLowerCase();
  const visibleTransactions = orderedTransactions.filter((t) => {
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

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragIndexRef.current = index;
    setDraggingId(orderedTransactions[index]._id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const fromIndex = dragIndexRef.current;
    if (fromIndex === null || fromIndex === dropIndex) {
      setDraggingId(null);
      dragIndexRef.current = null;
      return;
    }
    const newOrder = [...orderedTransactions];
    const [removed] = newOrder.splice(fromIndex, 1);
    newOrder.splice(dropIndex, 0, removed);
    setOrderedTransactions(newOrder);
    setDraggingId(null);
    dragIndexRef.current = null;
    try {
      await transactionService.reorder(newOrder.map((t) => t._id));
    } catch (err) {
      console.error('Erro ao persistir ordenação:', err);
    }
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    dragIndexRef.current = null;
  };

  const TABS: TabKey[] = ['todas', 'entradas', 'saidas'];

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <p className="text-sm text-navy-500">
          Controle detalhado de cada movimentação.
        </p>
        <MonthSelector
          label={currentMonthLabel}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          onPrevious={handlePreviousMonth}
          onNext={handleNextMonth}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Entradas"
          value={formatCurrency(totalIncome)}
          sub={currentMonthLabel}
          tone="in"
        />
        <StatCard
          label="Saídas"
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
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 p-4 border-b border-bone-divider">
          <div className="flex gap-1 bg-navy-50 p-1 rounded-lg text-sm">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setTypeTab(tab)}
                className={`px-3 py-1.5 rounded-md capitalize transition-colors ${
                  typeTab === tab
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-navy-500 hover:text-navy-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-bone-border rounded-lg lg:w-60">
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
            className="input !w-auto !py-2 text-sm"
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
            className="input !w-auto !py-2 text-sm"
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
            className="input !w-auto !py-2 text-sm"
            aria-label="Filtrar por situação"
          >
            <option value="all">Todas as situações</option>
            <option value="paid">Pago / Recebido</option>
            <option value="unpaid">Pendente</option>
          </select>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary lg:ml-auto"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
        </div>

        {/* Desktop table */}
        {visibleTransactions.length > 0 ? (
          <>
            <table className="hidden md:table w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-navy-500 bg-bone-soft">
                <tr>
                  <th className="text-left px-4 py-3 w-10" />
                  <th className="text-left px-4 py-3">Descrição</th>
                  <th className="text-left px-4 py-3">Categoria</th>
                  <th className="text-left px-4 py-3">Conta</th>
                  <th className="text-left px-4 py-3">Data</th>
                  <th className="text-right px-4 py-3">Valor</th>
                  <th className="text-right px-4 py-3 w-14">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-classic">
                {visibleTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const orderIndex = orderedTransactions.findIndex(
                    (t) => t._id === tx._id
                  );
                  const canDrag = typeTab === 'todas' && term.length === 0;
                  return (
                    <tr
                      key={tx._id}
                      draggable={canDrag}
                      onDragStart={
                        canDrag
                          ? (e) => handleDragStart(e, orderIndex)
                          : undefined
                      }
                      onDragOver={canDrag ? handleDragOver : undefined}
                      onDrop={
                        canDrag ? (e) => handleDrop(e, orderIndex) : undefined
                      }
                      onDragEnd={handleDragEnd}
                      className={`hover:bg-bone-soft transition-colors ${
                        draggingId === tx._id ? 'opacity-40' : ''
                      } ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''}`}
                    >
                      <td className="px-4 py-3">
                        {canDrag && (
                          <GripVertical className="w-4 h-4 text-navy-300" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-8 h-8 rounded-full grid place-items-center shrink-0 ${
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
                            <div className="absolute right-4 top-12 w-40 bg-white rounded-lg border border-bone-border shadow-lg py-1 z-30">
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
              {visibleTransactions.map((tx) => (
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
