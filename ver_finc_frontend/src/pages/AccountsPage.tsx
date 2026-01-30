import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Wallet } from 'lucide-react';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import { Transaction } from '../types';
import { TransactionCard } from '../components/TransactionCard';
import { format } from 'date-fns';
import api from '../services/api';

export const AccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<any>(null);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [availableMonths, setAvailableMonths] = useState<{year: number, month: number, label: string}[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    loadAccounts();
    loadAvailableMonths();
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
      const data = await accountService.getByType('checking');
      setAccounts(data);
    } catch (err) {
      setError('Erro ao carregar contas.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
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

  const handleEdit = (acc: any) => {
    setEditing(acc);
    setName(acc.name);
    setShowForm(true);
  };

  const handleDelete = async (acc: any) => {
    if (!window.confirm('Remover esta conta?')) return;
    try {
      await accountService.delete(acc._id);
      if (selectedAccount?._id === acc._id) {
        setSelectedAccount(null);
      }
      await loadAccounts();
    } catch {
      alert('Erro ao remover conta.');
    }
  };

  const loadAvailableMonths = async () => {
    try {
      const months = await transactionService.getAvailableMonths();
      const formattedMonths = months.map(m => ({
        year: m.year,
        month: m.month,
        label: format(new Date(m.year, m.month - 1), 'MMMM yyyy')
      }));
      setAvailableMonths(formattedMonths);
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
        account: selectedAccount._id
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

  const handlePreviousMonth = () => {
    const currentIndex = availableMonths.findIndex(m => m.year === currentYear && m.month === currentMonth);
    if (currentIndex < availableMonths.length - 1) {
      const prevMonth = availableMonths[currentIndex + 1];
      setCurrentYear(prevMonth.year);
      setCurrentMonth(prevMonth.month);
    }
  };

  const handleNextMonth = () => {
    const currentIndex = availableMonths.findIndex(m => m.year === currentYear && m.month === currentMonth);
    if (currentIndex > 0) {
      const nextMonth = availableMonths[currentIndex - 1];
      setCurrentYear(nextMonth.year);
      setCurrentMonth(nextMonth.month);
    }
  };

  const handleAccountClick = (acc: any) => {
    setSelectedAccount(acc);
  };

  const handleEditClick = (e: React.MouseEvent, acc: any) => {
    e.stopPropagation();
    handleEdit(acc);
  };

  const handleDeleteClick = (e: React.MouseEvent, acc: any) => {
    e.stopPropagation();
    handleDelete(acc);
  };

  const currentMonthLabel = availableMonths.find(m => m.year === currentYear && m.month === currentMonth)?.label || '';
  const currentIndex = availableMonths.findIndex(m => m.year === currentYear && m.month === currentMonth);
  const hasPrevious = currentIndex < availableMonths.length - 1;
  const hasNext = currentIndex > 0;

  return (
    <div className="flex-1 overflow-auto bg-mac-bg text-mac-text">
      <div className="mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Contas Correntes</h2>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={() => { setShowForm(true); setEditing(null); setName(''); }}
          >
            <Plus className="w-4 h-4" /> Nova Conta
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl shadow p-6 mb-6 flex flex-col gap-4">
            <label className="font-medium text-gray-700">Nome da Conta</label>
            <input
              className="px-4 py-2 border border-gray-300 rounded-lg outline-none"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Ex: Banco XPTO"
            />
            <div className="flex gap-3 mt-2">
              <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700">
                {editing ? 'Salvar' : 'Criar'}
              </button>
              <button type="button" className="flex-1 bg-gray-200 text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-300" onClick={() => { setShowForm(false); setEditing(null); setName(''); }}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">Carregando...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Nenhuma conta cadastrada.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {accounts.map((acc: any) => (
              <div 
                key={acc._id} 
                onClick={() => handleAccountClick(acc)}
                className={`aspect-square bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-lg p-4 cursor-pointer transition-all transform hover:scale-105 ${
                  selectedAccount?._id === acc._id ? 'ring-4 ring-blue-400 scale-105' : ''
                }`}
              >
                <div className="h-full flex flex-col justify-between text-white">
                  <div className="flex justify-between items-start">
                    <Wallet className="w-8 h-8" />
                    <div className="flex gap-1">
                      <button 
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors" 
                        onClick={(e) => handleEditClick(e, acc)}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors" 
                        onClick={(e) => handleDeleteClick(e, acc)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-lg mb-1">{acc.name}</p>
                    <p className="text-sm opacity-90">
                      Saldo: R$ {(acc.initialBalance/100 || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Transações da conta selecionada */}
        {selectedAccount && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Transações - {selectedAccount.name}
              </h3>
            </div>

            {/* Navegação de mês */}
            {availableMonths.length > 0 && (
              <div className="bg-white rounded-xl shadow border border-gray-200 mb-4">
                <div className="flex items-center justify-between px-4 py-3">
                  <button
                    onClick={handlePreviousMonth}
                    disabled={!hasPrevious}
                    className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>

                  <div className="text-center">
                    <h4 className="text-base font-semibold text-gray-900">{currentMonthLabel}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {transactions.length} transação(ões)
                    </p>
                  </div>

                  <button
                    onClick={handleNextMonth}
                    disabled={!hasNext}
                    className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            )}

            {/* Lista de transações */}
            {loadingTransactions ? (
              <div className="text-center py-8 text-gray-500">Carregando transações...</div>
            ) : transactions.length === 0 ? (
              <div className="bg-white rounded-xl shadow border border-gray-200 p-8 text-center">
                <p className="text-gray-500">Nenhuma transação neste mês</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map(transaction => (
                  <TransactionCard
                    key={transaction._id}
                    transaction={transaction}
                    onEdit={() => {}}
                    onDelete={async () => {
                      await transactionService.delete(transaction._id);
                      loadAccountTransactions();
                      loadAccounts();
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
