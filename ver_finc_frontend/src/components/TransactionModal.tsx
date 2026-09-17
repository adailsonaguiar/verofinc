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
  Loader2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface AccountOption {
  _id: string;
  name: string;
  type: string;
}

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
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [accountId, setAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<TransactionStatus>(
    TransactionStatus.UNPAID
  );
  const [isFixed, setIsFixed] = useState(false);
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
    const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
    setAmount(formatCurrencyInput(digits));
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
          setIsFixed(initialData.isFixed || false);
          loadCategories(initialData.category._id);
        } else {
          setAmount('');
          setDescription('');
          setDate(new Date().toISOString().split('T')[0]);
          setType(TransactionType.EXPENSE);
          setStatus(TransactionStatus.UNPAID);
          setIsFixed(false);
          loadCategories();
        }
      };
      initializeForm();
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    const selectedAccount = accounts.find((acc) => acc._id === accountId);
    if (selectedAccount?.type === 'credit_card') {
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
        if (creditCardOnly) setAccountId(cards[0]._id);
        else setAccountId(allAccounts[0]._id);
      }
    } catch (err) {
      setAccounts([]);
      toast.error('Erro ao carregar contas.');
    }
  };

  const loadCategories = async (targetCategoryId?: string) => {
    try {
      setLoadingCategories(true);
      const data = await categoryService.getByType(type);
      setCategories(data);
      const effectiveCategoryId =
        targetCategoryId !== undefined ? targetCategoryId : categoryId;
      if (data.length > 0 && !effectiveCategoryId) {
        setCategoryId(data[0]._id);
      } else if (data.length > 0) {
        const validCategory = data.find((cat) => cat._id === effectiveCategoryId);
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
        date,
        type,
        categoryId,
        status,
        account: accountId,
        isFixed,
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
      <ToastContainer theme="light" />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div
          className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="relative z-10 w-full max-w-xl card overflow-hidden">
          <div className="px-6 py-5 flex items-center justify-between border-b border-bone-border">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full grid place-items-center ${
                  isEditing
                    ? 'bg-gold-400/20 text-gold-600'
                    : 'bg-navy-100 text-navy-700'
                }`}
              >
                {isEditing ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <DollarSign className="w-5 h-5" />
                )}
              </div>
              <div>
                <h2 className="font-display text-lg text-navy-900">
                  {isEditing ? 'Editar transação' : 'Nova transação'}
                </h2>
                <p className="text-xs text-navy-500">Preencha os detalhes</p>
              </div>
            </div>
            <button onClick={onClose} className="btn btn-ghost !p-2">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="px-6 py-5 space-y-5 max-h-[75vh] overflow-y-auto"
          >
            {!expenseOnly && (
              <div className="p-1 bg-navy-50 rounded-lg flex gap-1">
                <button
                  type="button"
                  onClick={() => setType(TransactionType.INCOME)}
                  className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    type === TransactionType.INCOME
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-navy-500 hover:text-navy-700'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Receita
                </button>
                <button
                  type="button"
                  onClick={() => setType(TransactionType.EXPENSE)}
                  className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    type === TransactionType.EXPENSE
                      ? 'bg-white text-rose-700 shadow-sm'
                      : 'text-navy-500 hover:text-navy-700'
                  }`}
                >
                  <TrendingDown className="w-4 h-4" />
                  Despesa
                </button>
              </div>
            )}

            <div className="space-y-2">
              <label className="label flex items-center gap-2">
                <AlignLeft className="w-4 h-4 text-navy-500" /> Descrição
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input"
                placeholder="Ex: Aluguel, Salário, Internet..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="label flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-navy-500" /> Valor
                </label>
                <input
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  className="input num"
                  placeholder="R$ 0,00"
                  inputMode="numeric"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="label flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-navy-500" /> Data
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input num"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="label flex items-center gap-2">
                  <CreditCardIcon className="w-4 h-4 text-navy-500" /> Conta /
                  Cartão
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="input"
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
                        {acc.name}
                        {acc.type === 'credit_card' ? ' (Crédito)' : ''}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="label flex items-center gap-2">
                  <Tag className="w-4 h-4 text-navy-500" /> Categoria
                </label>
                {loadingCategories ? (
                  <div className="input text-navy-300">Buscando...</div>
                ) : (
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="input"
                    required
                  >
                    <option value="" disabled>
                      Selecione a categoria
                    </option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {!hideStatus && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStatus(TransactionStatus.PAID)}
                  className={`py-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    status === TransactionStatus.PAID
                      ? 'bg-navy-700 text-white border-navy-700'
                      : 'bg-white text-navy-500 border-bone-border hover:bg-bone-soft'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Pago / Recebido
                </button>
                <button
                  type="button"
                  onClick={() => setStatus(TransactionStatus.UNPAID)}
                  className={`py-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    status === TransactionStatus.UNPAID
                      ? 'bg-gold-500 text-navy-900 border-gold-500'
                      : 'bg-white text-navy-500 border-bone-border hover:bg-bone-soft'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Pendente
                </button>
              </div>
            )}

            {!isEditing && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-bone-soft border border-bone-border">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-navy-900">
                    Fixar transação
                  </h3>
                  <p className="text-xs text-navy-500 mt-0.5">
                    Criará lançamentos para os próximos 11 meses
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFixed(!isFixed)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isFixed ? 'bg-navy-700' : 'bg-navy-200'
                  }`}
                  aria-label="Fixar transação"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isFixed ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-bone-divider">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost flex-1"
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
                className="btn btn-primary flex-[2]"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isEditing ? 'Atualizar' : 'Salvar transação'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

