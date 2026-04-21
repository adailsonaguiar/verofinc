import React, { useEffect, useState } from 'react';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionType,
  TransactionStatus,
  Category,
  Transaction,
} from '../types';
import { categoryService } from '../services/categoryService';
import api from '../services/api';
import {
  X,
  Save,
  DollarSign,
  Calendar,
  Tag,
  CreditCard as CreditCardIcon,
  CheckCircle2,
  Clock,
  AlignLeft,
  Plus,
  Loader2,
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: CreateTransactionDto | UpdateTransactionDto
  ) => Promise<void>;
  initialData?: Transaction;
  isEditing?: boolean;
  expenseOnly?: boolean;
  creditCardOnly?: boolean;
  hideStatus?: boolean;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
  expenseOnly = false,
  creditCardOnly = false,
  hideStatus = false,
}) => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<TransactionStatus>(
    TransactionStatus.UNPAID
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);

  function formatCurrencyInput(value: string) {
    const digits = value.replace(/\D/g, '');
    const number = Number(digits) / 100;
    return number.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, '');
    const limited = digits.slice(0, 12);
    const formatted = formatCurrencyInput(limited);
    setAmount(formatted);
  };

  useEffect(() => {
    if (isOpen) {
      const initializeForm = async () => {
        await loadAccounts();

        if (initialData) {
          setDescription(initialData.description);
          setAmount(
            formatCurrencyInput(Math.round(initialData.amount).toString())
          );
          setDate(initialData.date.split('T')[0]);
          setType(initialData.type);
          setCategoryId(initialData.category._id);
          setStatus(initialData.status);
          setAccountId(initialData.account || '');
        } else {
          setAmount('');
          setDescription('');
          setDate(new Date().toISOString().split('T')[0]);
          setType(TransactionType.EXPENSE);
          setStatus(TransactionStatus.UNPAID);
        }
        loadCategories();
      };
      initializeForm();
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    const selectedAccount = accounts.find((acc) => acc._id === accountId);
    if (hideStatus) {
      setStatus(TransactionStatus.UNPAID);
    } else if (selectedAccount?.type === 'credit_card') {
      setStatus(TransactionStatus.PAID);
    }
  }, [accountId, accounts, hideStatus]);

  useEffect(() => {
    const selectedAccount = accounts.find((acc) => acc._id === accountId);
    if (
      type === TransactionType.INCOME &&
      selectedAccount?.type === 'credit_card'
    ) {
      const firstValidAccount = accounts.find(
        (acc) => acc.type === 'credit_card'
      );
      if (firstValidAccount) {
        setAccountId(firstValidAccount._id);
      }
    }
  }, [type, accountId, accounts]);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [type]);

  const loadAccounts = async () => {
    try {
      const [checkingRes, cardsRes] = await Promise.all([
        api.get('/accounts?type=checking'),
        api.get('/accounts?type=credit_card'),
      ]);
      const checking = checkingRes.data;
      const cards = cardsRes.data;
      const allAccounts = creditCardOnly ? cards : [...checking, ...cards];
      setAccounts(allAccounts);

      if (allAccounts.length === 0) {
        toast.warning('⚠️ Nenhuma conta cadastrada!', {
          position: 'top-center',
        });
        return;
      }

      if (!initialData && !accountId && allAccounts.length > 0) {
        setAccountId((checking[0]?._id || cards[0]?._id) ?? '');
      }
    } catch (err) {
      setAccounts([]);
      toast.error('Erro ao carregar contas.');
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
        const validCategory = data.find((cat) => cat._id === categoryId);
        if (!validCategory) setCategoryId(data[0]._id);
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
    if (!description.trim() || !amount || !categoryId || !accountId) return;

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
      onClose();
    } catch (error) {
      console.error('Error submitting transaction:', error);
      toast.error('Falha ao salvar transação.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <ToastContainer theme="dark" />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
          onClick={onClose}
        />

        {/* Modal Content */}
        <div className="relative z-10 w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 transition-all duration-300 animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-500 overflow-hidden">
          {/* Top Bar / Header */}
          <div className="px-8 py-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-2xl ${isEditing ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600'}`}
              >
                {isEditing ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <Plus className="w-6 h-6" strokeWidth={3} />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {isEditing ? 'Editar Transação' : 'Nova Transação'}
                </h2>
                <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                  Preencha os detalhes abaixo
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all duration-200 active:scale-90"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-6">
            {/* Type Toggles */}
            {!expenseOnly && (
              <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-3xl flex gap-1.5 border border-slate-200/50 dark:border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setType(TransactionType.INCOME)}
                  className={`flex-1 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                    type === TransactionType.INCOME
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xl shadow-emerald-500/5'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Receita
                </button>
                <button
                  type="button"
                  onClick={() => setType(TransactionType.EXPENSE)}
                  className={`flex-1 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                    type === TransactionType.EXPENSE
                      ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xl shadow-rose-500/5'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
                  }`}
                >
                  <TrendingDown className="w-4 h-4" />
                  Despesa
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Description */}
              <div className="md:col-span-2 space-y-2">
                <label className="flex items-center gap-2 text-[13px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                  <AlignLeft className="w-4 h-4 text-indigo-500" /> Descrição
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-[1.25rem] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold placeholder:text-slate-300 dark:placeholder:text-slate-700"
                  placeholder="Ex: Aluguel, Salário, Internet..."
                  required
                />
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[13px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                  <DollarSign className="w-4 h-4 text-indigo-500" /> Valor
                </label>
                <input
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-[1.25rem] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-black text-xl"
                  placeholder="R$ 0,00"
                  inputMode="numeric"
                  required
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[13px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                  <Calendar className="w-4 h-4 text-indigo-500" /> Data
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-[1.25rem] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold appearance-none"
                  required
                />
              </div>

              {/* Account Selection */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[13px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                  <CreditCardIcon className="w-4 h-4 text-indigo-500" /> Conta /
                  Cartão
                </label>
                <div className="relative">
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-[1.25rem] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold appearance-none relative z-10"
                    required
                  >
                    <option value="" disabled>
                      Selecione a conta
                    </option>
                    {accounts
                      .filter((acc) =>
                        type === TransactionType.INCOME
                          ? acc.type !== 'credit_card'
                          : true
                      )
                      .map((acc) => (
                        <option key={acc._id} value={acc._id}>
                          {acc.name}{' '}
                          {acc.type === 'credit_card' ? '(Crédito)' : ''}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Category Selection */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[13px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                  <Tag className="w-4 h-4 text-indigo-500" /> Categoria
                </label>
                <div className="relative">
                  {loadingCategories ? (
                    <div className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950/50 rounded-[1.25rem] border border-slate-100 dark:border-slate-800 text-slate-400 text-sm font-bold animate-pulse">
                      Buscando...
                    </div>
                  ) : (
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-[1.25rem] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold appearance-none relative z-10"
                      required
                    >
                      <option value="" disabled>
                        Selecione a categoria
                      </option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.icon ? `${cat.icon} ` : ''}
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Status Selector - Only for non-credit accounts */}
            {!hideStatus &&
              accounts.find((acc) => acc._id === accountId)?.type !==
                'credit_card' && (
                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-2 text-[13px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                    <Clock className="w-4 h-4 text-indigo-500" /> Status da
                    Transação
                  </label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setStatus(TransactionStatus.PAID)}
                      className={`flex-1 px-4 py-3.5 rounded-2xl font-bold transition-all border flex items-center justify-center gap-2 ${
                        status === TransactionStatus.PAID
                          ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20'
                          : 'bg-white dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Pago
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus(TransactionStatus.UNPAID)}
                      className={`flex-1 px-4 py-3.5 rounded-2xl font-bold transition-all border flex items-center justify-center gap-2 ${
                        status === TransactionStatus.UNPAID
                          ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20'
                          : 'bg-white dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      Pendente
                    </button>
                  </div>
                </div>
              )}

            {/* Submit Actions */}
            <div className="flex gap-4 pt-8">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-4 rounded-2xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent transition-all duration-200"
              >
                Descartar
              </button>
              <button
                type="submit"
                disabled={
                  loading ||
                  !description.trim() ||
                  !amount ||
                  !categoryId ||
                  categories.length === 0
                }
                className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/30 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" strokeWidth={3} />
                )}
                {isEditing ? 'Atualizar' : 'Salvar Transação'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

const TrendingUp = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const TrendingDown = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);
