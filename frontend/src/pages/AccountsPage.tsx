import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import { Transaction } from '../types';
import { TransactionCard } from '../components/TransactionCard';
import { MonthSelector } from '../components/MonthSelector';
import { SectionTitle } from '../components/SectionTitle';
import { SparklineChart } from '../components/SparklineChart';
import { EmptyState } from '../components/EmptyState';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../services/api';

interface AccountLike {
  _id: string;
  name: string;
  type: string;
  active?: boolean;
  initialBalance?: number;
  creditLimit?: number;
}

const brl = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Deterministic palette: the backend has no per-bank color field. */
const ACCOUNT_COLORS = [
  '#1f2a4d',
  '#c99a3b',
  '#3c4d78',
  '#a97d28',
  '#162038',
  '#93a1c1',
];

export const AccountsPage: React.FC = () => {
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState<AccountLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<AccountLike | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<AccountLike | null>(
    null
  );
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [availableMonths, setAvailableMonths] = useState<
    { year: number; month: number; label: string }[]
  >([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [nets, setNets] = useState<Record<string, Record<string, number>>>({});
  const [monthKeys, setMonthKeys] = useState<string[]>([]);

  useEffect(() => {
    loadAccounts();
    loadAvailableMonths();
    loadHistory();
  }, []);

  useEffect(() => {
    if (selectedAccount && currentYear && currentMonth) {
      loadAccountTransactions();
    }
  }, [selectedAccount, currentYear, currentMonth]);

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccount) {
      setSelectedAccount(accounts[0]);
    }
  }, [accounts, selectedAccount]);

  const loadAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      setAccounts(await accountService.getByType('checking'));
    } catch (err) {
      setError('Erro ao carregar contas.');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const all = await transactionService.getLastMonths(6);
      const map: Record<string, Record<string, number>> = {};
      const keys = new Set<string>();

      all
        .filter((t) => !t.isPayment)
        .forEach((t) => {
          const [year, month] = t.date.split('T')[0].split('-');
          const monthKey = `${year}-${month}`;
          keys.add(monthKey);
          if (!t.account) return;
          if (!map[t.account]) map[t.account] = {};
          const signed = t.type === 'income' ? t.amount : -t.amount;
          map[t.account][monthKey] = (map[t.account][monthKey] ?? 0) + signed;
        });

      setNets(map);
      setMonthKeys(Array.from(keys).sort());
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
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

  const loadAccountTransactions = async () => {
    if (!selectedAccount) return;
    try {
      setLoadingTransactions(true);
      const params = {
        year: currentYear,
        month: currentMonth,
        account: selectedAccount._id,
      };
      const query = Object.entries(params)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join('&');
      const res = await api.get(`/transactions?${query}`);
      setTransactions(res.data);
    } catch (err) {
      console.error('Error loading account transactions:', err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await accountService.update(editing._id, { name });
      } else {
        await accountService.create({ name, type: 'checking' });
      }
      setName('');
      setEditing(null);
      setShowForm(false);
      await loadAccounts();
    } catch {
      alert('Erro ao salvar conta.');
    }
  };

  const handleEdit = (acc: AccountLike) => {
    setEditing(acc);
    setName(acc.name);
    setShowForm(true);
  };

  const handleDelete = async (acc: AccountLike) => {
    if (!window.confirm('Remover esta conta?')) return;
    try {
      await accountService.delete(acc._id);
      if (selectedAccount?._id === acc._id) setSelectedAccount(null);
      await loadAccounts();
    } catch {
      alert('Erro ao remover conta.');
    }
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

  const openStatement = (acc: AccountLike) => {
    setSelectedAccount(acc);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + (acc.initialBalance || 0),
    0
  );

  const currentIndex = availableMonths.findIndex(
    (m) => m.year === currentYear && m.month === currentMonth
  );
  const hasPrevious = currentIndex < availableMonths.length - 1;
  const hasNext = currentIndex > 0;
  const currentMonthLabel =
    availableMonths.find(
      (m) => m.year === currentYear && m.month === currentMonth
    )?.label || '';

  // Rebuild each monthly balance by walking backwards from the current balance
  const trends = useMemo(() => {
    const result: Record<string, number[]> = {};
    accounts.forEach((acc) => {
      let running = acc.initialBalance || 0;
      const points: number[] = [];
      for (let i = monthKeys.length - 1; i >= 0; i--) {
        points.push(running / 100);
        running -= nets[acc._id]?.[monthKeys[i]] ?? 0;
      }
      result[acc._id] = points.reverse();
    });
    return result;
  }, [accounts, monthKeys, nets]);

  if (loading && accounts.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-navy-700 mb-3" />
          <p className="text-sm text-navy-500">Carregando contas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <p className="text-sm text-navy-500">
          Saldo consolidado e extrato por conta corrente.
        </p>
        <button
          onClick={() => {
            setShowForm(true);
            setEditing(null);
            setName('');
          }}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          Nova conta
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6">
          <label className="label">Nome da conta</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Ex: Banco XPTO"
          />
          <div className="flex gap-3 mt-5">
            <button type="submit" className="btn btn-primary flex-1">
              {editing ? 'Salvar' : 'Criar'}
            </button>
            <button
              type="button"
              className="btn btn-ghost flex-1"
              onClick={() => {
                setShowForm(false);
                setEditing(null);
                setName('');
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {error && <div className="card p-5 text-sm text-rose-700">{error}</div>}

      <div className="card p-6 bg-gradient-to-br from-navy-900 to-navy-800 border-navy-800 text-white">
        <div className="text-xs uppercase tracking-widest text-navy-200">
          Saldo consolidado
        </div>
        <div className="num text-4xl mt-2">{brl(totalBalance)}</div>
        <div className="text-sm text-navy-200 mt-1">
          {accounts.length} conta(s) ativa(s) · atualizado agora
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Wallet className="w-6 h-6" />}
            title="Nenhuma conta cadastrada"
            description="Crie sua primeira conta corrente para começar."
          />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {accounts.map((acc, index) => {
            const color = ACCOUNT_COLORS[index % ACCOUNT_COLORS.length];
            const trend = trends[acc._id] ?? [];
            return (
              <div key={acc._id} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ background: color }}
                      />
                      <span className="font-display text-lg text-navy-900 truncate">
                        {acc.name}
                      </span>
                    </div>
                    <div className="text-xs text-navy-500 mt-0.5">
                      Conta Corrente
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="chip bg-navy-100 text-navy-800">
                      {acc.active === false ? 'Inativa' : 'Ativa'}
                    </span>
                    <button
                      onClick={() => handleEdit(acc)}
                      className="p-2 rounded-lg text-navy-300 hover:text-navy-700 hover:bg-navy-100 transition-colors"
                      title="Editar conta"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(acc)}
                      className="p-2 rounded-lg text-navy-300 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                      title="Excluir conta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="num text-2xl mt-4 text-navy-900">
                  {brl(acc.initialBalance || 0)}
                </div>

                {monthKeys.length > 1 && trend.length > 1 && (
                  <div className="mt-3">
                    <SparklineChart data={trend} color={color} />
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => openStatement(acc)}
                    className="btn btn-outline flex-1 text-xs"
                  >
                    Extrato
                  </button>
                  <button
                    onClick={() => navigate('/transactions?new=1')}
                    className="btn btn-primary flex-1 text-xs"
                  >
                    Nova transação
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedAccount && (
        <div className="card">
          <div className="p-4 border-b border-bone-divider flex flex-col md:flex-row md:items-center justify-between gap-3">
            <SectionTitle
              title={`Extrato — ${selectedAccount.name}`}
              subtitle={currentMonthLabel}
            />
            <MonthSelector
              label={currentMonthLabel}
              hasPrevious={hasPrevious}
              hasNext={hasNext}
              onPrevious={handlePreviousMonth}
              onNext={handleNextMonth}
            />
          </div>

          {loadingTransactions ? (
            <div className="py-12 text-center text-sm text-navy-500">
              Carregando extrato...
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center text-sm text-navy-500">
              Nenhuma transação neste mês
            </div>
          ) : (
            <div className="divide-classic">
              {transactions.map((transaction) => (
                <TransactionCard
                  key={transaction._id}
                  transaction={transaction}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
