import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, CreditCard, Wallet, X } from 'lucide-react';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import { Transaction } from '../types';
import { TransactionCard } from '../components/TransactionCard';
import { format } from 'date-fns';

export const CreditCardsPage: React.FC = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [editing, setEditing] = useState<any>(null);

  // Função de máscara para valor monetário (R$00,00)
  function formatCurrencyInput(value: string) {
    const digits = value.replace(/\D/g, '');
    const number = Number(digits) / 100;
    return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  // Handler para input de valor
  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, '');
    const limited = digits.slice(0, 12);
    const formatted = formatCurrencyInput(limited);
    setLimit(formatted);
  };
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [availableMonths, setAvailableMonths] = useState<{year: number, month: number, label: string}[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [checkingAccounts, setCheckingAccounts] = useState<any[]>([]);
  const [selectedCheckingAccount, setSelectedCheckingAccount] = useState('');
  const [payingInvoice, setPayingInvoice] = useState(false);

  useEffect(() => {
    loadCards();
    loadAvailableMonths();
  }, []);

  useEffect(() => {
    if (selectedCard && currentYear && currentMonth) {
      loadCardTransactions();
    }
  }, [selectedCard, currentYear, currentMonth]);

  useEffect(() => {
    if (cards.length > 0 && !selectedCard) {
      setSelectedCard(cards[0]);
    }
  }, [cards, selectedCard]);

  const loadCards = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await accountService.getByType('credit_card');
      setCards(data);
    } catch (err) {
      setError('Erro ao carregar cartões.');
    } finally {
      setLoading(false);
    }
  };

  const loadCheckingAccounts = async () => {
    try {
      const data = await accountService.getByType('checking');
      setCheckingAccounts(data);
      if (data.length > 0) {
        setSelectedCheckingAccount(data[0]._id);
      }
    } catch (err) {
      console.error('Erro ao carregar contas correntes:', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Extrai valor numérico do campo formatado (R$ 1.234,56)
      const numericLimit = Number(
        limit
          .replace(/[^\d,]/g, '')
          .replace(/\./g, '')
          .replace(',', '.')
      );

      if(transactions.length > 0 && editing) {
        alert('Não é possível editar o limite de um cartão com transações associadas.');
        return;
      }

      if (editing) {
        await accountService.update(editing._id, { name, creditLimit: numericLimit });
      } else {
        await accountService.create({ name, type: 'credit_card', creditLimit: numericLimit });
      }
      setName('');
      setLimit('');
      setEditing(null);
      setShowForm(false);
      await loadCards();
    } catch {
      alert('Erro ao salvar cartão.');
    }
  };

  const handleEdit = (card: any) => {
    setEditing(card);
    setName(card.name);
    setLimit(formatCurrencyInput(Math.round((card.creditLimit || 0) * 100).toString()));
    setShowForm(true);
  };

  const handleDelete = async (card: any) => {
    if (!window.confirm('Remover este cartão?')) return;
    try {
      await accountService.delete(card._id);
      if (selectedCard?._id === card._id) {
        setSelectedCard(null);
      }
      await loadCards();
    } catch {
      alert('Erro ao remover cartão.');
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

  const loadCardTransactions = async () => {
    if (!selectedCard) return;
    try {
      setLoadingTransactions(true);
      const params = {
        year: currentYear,
        month: currentMonth,
        account: selectedCard._id,
        withCreditCardFilter: true
      };
      const query = Object.entries(params)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join('&');
      const res = await fetch(`/api/transactions?${query}`);
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      console.error('Error loading card transactions:', err);
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

  const handleCardClick = (card: any) => {
    setSelectedCard(card);
  };

  const handleEditClick = (e: React.MouseEvent, card: any) => {
    e.stopPropagation();
    handleEdit(card);
  };

  const handleDeleteClick = (e: React.MouseEvent, card: any) => {
    e.stopPropagation();
    handleDelete(card);
  };

  const handleOpenPaymentModal = async () => {
    await loadCheckingAccounts();
    setShowPaymentModal(true);
  };

  const handlePayInvoice = async () => {
    if (!selectedCard || !selectedCheckingAccount) return;
    
    const invoiceAmount = selectedCard.creditLimit - (selectedCard.initialBalance || 0);
    if (invoiceAmount <= 0) {
      alert('Não há fatura para pagar.');
      return;
    }

    if (!window.confirm(`Pagar fatura de R$ ${invoiceAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}?`)) {
      return;
    }

    try {
      setPayingInvoice(true);
      
      // Chamar rota de pagamento de fatura
      await accountService.payInvoice(selectedCard._id, selectedCheckingAccount);

      alert('Fatura paga com sucesso!');
      setShowPaymentModal(false);
      await loadCards();
      await loadCardTransactions();
    } catch (err: any) {
      console.error('Erro ao pagar fatura:', err);
      const errorMessage = err.response?.data?.message || 'Erro ao pagar fatura. Tente novamente.';
      alert(errorMessage);
    } finally {
      setPayingInvoice(false);
    }
  };

  const currentMonthLabel = availableMonths.find(m => m.year === currentYear && m.month === currentMonth)?.label || '';
  const currentIndex = availableMonths.findIndex(m => m.year === currentYear && m.month === currentMonth);
  const hasPrevious = currentIndex < availableMonths.length - 1;
  const hasNext = currentIndex > 0;

  const selectedCardLimit = selectedCard ? (selectedCard.creditLimit || 0) / 100 : 0;
  const selectedCardBalance = selectedCard ? (selectedCard.initialBalance || 0) / 100 : 0;

  return (
    <div className="flex-1 overflow-auto bg-mac-bg text-mac-text">
      <div className="mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Cartões de Crédito</h2>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            onClick={() => { setShowForm(true); setEditing(null); setName(''); setLimit(''); }}
          >
            <Plus className="w-4 h-4" /> Novo Cartão
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl shadow p-6 mb-6 flex flex-col gap-4">
            <label className="font-medium text-gray-700">Nome do Cartão</label>
            <input
              className="px-4 py-2 border border-gray-300 rounded-lg outline-none"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Ex: Nubank, Visa XPTO"
            />
            <label className="font-medium text-gray-700">Limite</label>
            <input
              type="text"
              className="px-4 py-2 border border-gray-300 rounded-lg outline-none"
              value={limit}
              onChange={handleLimitChange}
              placeholder="R$ 0,00"
              inputMode="numeric"
              required
              autoComplete="off"
              maxLength={20}
            />
            <div className="flex gap-3 mt-2">
              <button type="submit" className="flex-1 bg-purple-600 text-white rounded-lg px-4 py-2 hover:bg-purple-700">
                {editing ? 'Salvar' : 'Criar'}
              </button>
              <button type="button" className="flex-1 bg-gray-200 text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-300" onClick={() => { setShowForm(false); setEditing(null); setName(''); setLimit(''); }}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">Carregando...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : cards.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Nenhum cartão cadastrado.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {cards.map((card: any) => (
              <div 
                key={card._id} 
                onClick={() => handleCardClick(card)}
                className={`aspect-square bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl shadow-lg p-4 cursor-pointer transition-all transform hover:scale-105 ${
                  selectedCard?._id === card._id ? 'ring-4 ring-purple-400 scale-105' : ''
                }`}
              >
                <div className="h-full flex flex-col justify-between text-white">
                  <div className="flex justify-between items-start">
                    <CreditCard className="w-8 h-8" />
                    <div className="flex gap-1">
                      <button 
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors" 
                        onClick={(e) => handleEditClick(e, card)}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors" 
                        onClick={(e) => handleDeleteClick(e, card)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-lg mb-1">{card.name}</p>
                    <p className="text-sm opacity-90">
                      Fatura: R$ {(selectedCardBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs opacity-75 mt-0.5">
                      Limite: R$ {selectedCardLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Transações do cartão selecionado */}
        {selectedCard && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Transações - {selectedCard.name}
              </h3>
              <button
                onClick={handleOpenPaymentModal}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Wallet className="w-4 h-4" />
                Pagar Fatura
              </button>
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
                      loadCardTransactions();
                      loadCards();
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal de Pagamento de Fatura */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowPaymentModal(false)} />
            
            <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl shadow-2xl border border-gray-200 bg-white">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Pagar Fatura</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Cartão</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedCard?.name}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Valor da Fatura</p>
                  <p className="text-2xl font-bold text-purple-600">
                    R$ {(selectedCard.creditLimit - selectedCard?.initialBalance ).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                <div>
                  <label htmlFor="checking-account" className="block text-sm font-medium text-gray-700 mb-2">
                    Pagar com a conta *
                  </label>
                  <select
                    id="checking-account"
                    value={selectedCheckingAccount}
                    onChange={e => setSelectedCheckingAccount(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white"
                    required
                  >
                    {checkingAccounts.length === 0 ? (
                      <option value="" disabled>Nenhuma conta disponível</option>
                    ) : (
                      checkingAccounts.map(acc => (
                        <option key={acc._id} value={acc._id}>
                          {acc.name} - R$ {(acc.initialBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handlePayInvoice}
                    disabled={payingInvoice || !selectedCheckingAccount || checkingAccounts.length === 0}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold shadow-md"
                  >
                    <Wallet className="w-5 h-5" />
                    {payingInvoice ? 'Pagando...' : 'Pagar Fatura'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
