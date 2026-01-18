import React, { useEffect, useState } from 'react';
import { CreateTransactionDto, UpdateTransactionDto, TransactionType, TransactionStatus, Category, Transaction } from '../types';
import { categoryService } from '../services/categoryService';
import { X, Save } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTransactionDto | UpdateTransactionDto) => Promise<void>;
  initialData?: Transaction;
  isEditing?: boolean;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
}) => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  // Função de máscara para valor monetário (R$00,00)
  function formatCurrencyInput(value: string) {
    const digits = value.replace(/\D/g, '');
    const number = Number(digits) / 100;
    return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  // Handler para input de valor
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, '');
    const limited = digits.slice(0, 12);
    const formatted = formatCurrencyInput(limited);
    setAmount(formatted);
  };
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<TransactionStatus>(TransactionStatus.UNPAID);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDescription(initialData.description);
        setAmount(formatCurrencyInput(Math.round(initialData.amount).toString()));
        setDate(initialData.date.split('T')[0]);
        setType(initialData.type);
        setCategoryId(initialData.category._id);
        setStatus(initialData.status);
        setAccountId(initialData.account || '');
      } else {
        setAmount('');
        setAccountId('');
      }
      loadCategories();
      loadAccounts();
    }
  }, [isOpen, initialData]);

  // Atualizar status quando mudar a conta selecionada
  useEffect(() => {
    const selectedAccount = accounts.find(acc => acc._id === accountId);
    if (selectedAccount?.type === 'credit_card') {
      setStatus(TransactionStatus.PAID);
    }
  }, [accountId, accounts]);

  // Resetar conta se for cartão de crédito e tipo mudar para receita
  useEffect(() => {
    const selectedAccount = accounts.find(acc => acc._id === accountId);
    if (type === TransactionType.INCOME && selectedAccount?.type === 'credit_card') {
      // Selecionar a primeira conta que não seja cartão de crédito
      const firstValidAccount = accounts.find(acc => acc.type !== 'credit_card');
      if (firstValidAccount) {
        setAccountId(firstValidAccount._id);
      }
    }
  }, [type, accountId, accounts]);

  // Recarregar categorias quando o tipo mudar
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [type]);

  const loadAccounts = async () => {
    try {
      // Busca contas correntes e cartões de crédito
      const checking = await (await fetch('/api/accounts?type=checking')).json();
      const cards = await (await fetch('/api/accounts?type=credit_card')).json();
      setAccounts([...checking, ...cards]);
      
      // Verifica se não há contas cadastradas
      if (checking.length === 0 && cards.length === 0) {
        toast.warning('⚠️ Nenhuma conta cadastrada! Cadastre uma conta antes de criar transações.', {
          position: 'top-center',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        return;
      }
      
      // Se não houver conta selecionada, seleciona a primeira
      if (!accountId && (checking.length > 0 || cards.length > 0)) {
        setAccountId((checking[0]?._id || cards[0]?._id) ?? '');
      }
    } catch (err) {
      setAccounts([]);
      toast.error('Erro ao carregar contas. Tente novamente.', {
        position: 'top-center',
        autoClose: 3000,
      });
    }
  };

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const data = await categoryService.getByType(type);
      setCategories(data);
      if (data.length > 0 && !categoryId) {
        setCategoryId(data[0]._id);
      } else if (data.length > 0) {
        // Check if current categoryId is valid for the type
        const validCategory = data.find(cat => cat._id === categoryId);
        if (!validCategory) {
          setCategoryId(data[0]._id);
        }
      } else {
        setCategoryId('');
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim() || !amount || !categoryId || !accountId) {
      return;
    }

    // Extrai valor numérico do campo formatado (R$ 1.234,56)
    const numericAmount = Number(
      amount
        .replace(/[^\d,]/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
    );

    setLoading(true);
    try {
      await onSubmit({
        description: description.trim(),
        amount: numericAmount,
        date: date,
        type,
        categoryId,
        status,
        account: accountId,
      });

      // Reset form only if creating new transaction
      if (!isEditing) {
        setDescription('');
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setType(TransactionType.EXPENSE);
        setStatus(TransactionStatus.UNPAID);
        setCategoryId(categories[0]?._id || '');
      }
      onClose();
    } catch (error) {
      console.error('Error submitting transaction:', error);
      alert('Failed to save transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <ToastContainer />
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto">
      {/* Overlay com desfoque */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity md:block hidden" onClick={onClose} />

      {/* Modal moderna */}
      <div className="relative z-10 w-full h-full md:h-auto md:max-w-lg md:mx-auto md:rounded-3xl shadow-2xl md:border border-gray-200 bg-white md:bg-white/90 md:backdrop-blur-lg animate-fadeInUp">
        {/* Header */}
        <div className="flex items-center justify-between px-6 md:px-8 py-4 md:py-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            {isEditing ? 'Editar Transação' : 'Nova Transação'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 md:px-8 py-5 md:py-7 space-y-5 md:space-y-6 overflow-y-auto h-[calc(100vh-80px)] md:h-auto">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo *
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setType(TransactionType.INCOME)}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all border text-base shadow-sm ${
                  type === TransactionType.INCOME
                    ? 'bg-green-600 text-white border-green-600 scale-105 shadow-lg'
                    : 'bg-white text-green-700 border-green-200 hover:bg-green-50'
                }`}
              >
                Receita
              </button>
              <button
                type="button"
                onClick={() => setType(TransactionType.EXPENSE)}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all border text-base shadow-sm ${
                  type === TransactionType.EXPENSE
                    ? 'bg-red-600 text-white border-red-600 scale-105 shadow-lg'
                    : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
                }`}
              >
                Despesa
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descrição *
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-base bg-white/80"
              placeholder="Ex: Salário, Supermercado, Aluguel"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Valor *
            </label>
            <input
              type="text"
              id="amount"
              value={amount}
              onChange={handleAmountChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-lg bg-white/80"
              placeholder="R$ 0,00"
              inputMode="numeric"
              required
              autoComplete="off"
              maxLength={20}
            />
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Data *
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white/80"
              required
            />
          </div>

          {/* Category */}
                  {/* Account/Cartão */}
                  <div>
                    <label htmlFor="account" className="block text-sm font-medium text-gray-700 mb-1">
                      Conta / Cartão *
                    </label>
                    <select
                      id="account"
                      value={accountId}
                      onChange={e => setAccountId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white/80"
                      required
                    >
                      <option value="" disabled>Selecione...</option>
                      {accounts
                        .filter(acc => type === TransactionType.INCOME ? acc.type !== 'credit_card' : true)
                        .map(acc => (
                          <option key={acc._id} value={acc._id}>
                            {acc.name} {acc.type === 'credit_card' ? '(Cartão)' : ''}
                          </option>
                        ))}
                    </select>
                  </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Categoria *
            </label>
            {loadingCategories ? (
              <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500">
                Carregando categorias...
              </div>
            ) : categories.length > 0 ? (
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white/80"
                required
              >
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-yellow-50 text-yellow-800 text-sm">
                Nenhuma categoria disponível. Cadastre uma categoria primeiro.
              </div>
            )}
          </div>

          {/* Status - Oculto para cartão de crédito */}
          {accounts.find(acc => acc._id === accountId)?.type !== 'credit_card' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStatus(TransactionStatus.PAID)}
                  className={`flex-1 px-4 py-2 rounded-xl font-semibold transition-all border text-base shadow-sm ${
                    status === TransactionStatus.PAID
                      ? 'bg-blue-600 text-white border-blue-600 scale-105 shadow-lg'
                      : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
                  }`}
                >
                  ✓ Pago
                </button>
                <button
                  type="button"
                  onClick={() => setStatus(TransactionStatus.UNPAID)}
                  className={`flex-1 px-4 py-2 rounded-xl font-semibold transition-all border text-base shadow-sm ${
                    status === TransactionStatus.UNPAID
                      ? 'bg-yellow-500 text-white border-yellow-500 scale-105 shadow-lg'
                      : 'bg-white text-yellow-700 border-yellow-200 hover:bg-yellow-50'
                  }`}
                >
                  ⏳ Pendente
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !description.trim() || !amount || !categoryId || categories.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold shadow-md"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};
