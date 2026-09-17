import { useEffect, useState } from 'react';
import { Loader2, Pencil, Plus, Trash2, Wallet, X } from 'lucide-react';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import { Transaction } from '../types';
import { TransactionCard } from '../components/TransactionCard';
import { MonthSelector } from '../components/MonthSelector';
import { SectionTitle } from '../components/SectionTitle';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/EmptyState';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../services/api';

interface CardLike {
  _id: string;
  name: string;
  type: string;
  active?: boolean;
  initialBalance?: number;
  creditLimit?: number;
}

const brl = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** The backend has no brand/gradient field, so the plastic uses a navy ramp. */
const CARD_GRADIENTS = [
  'from-navy-800 to-navy-950',
  'from-navy-900 to-navy-950',
  'from-navy-700 to-navy-900',
  'from-[#1b2a4a] to-navy-950',
];

function formatCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, '');
  const number = Number(digits) / 100;
  return number.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export const CreditCardsPage: React.FC = () => {
  const [cards, setCards] = useState<CardLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [editing, setEditing] = useState<CardLike | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardLike | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [availableMonths, setAvailableMonths] = useState<
    { year: number; month: number; label: string }[]
  >([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [checkingAccounts, setCheckingAccounts] = useState<CardLike[]>([]);
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

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
    setLimit(formatCurrencyInput(digits));
  };

  const loadCards = async () => {
    setLoading(true);
    setError(null);
    try {
      setCards(await accountService.getByType('credit_card'));
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
      if (data.length > 0) setSelectedCheckingAccount(data[0]._id);
    } catch (err) {
      console.error('Erro ao carregar contas correntes:', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericLimit = Number(limit.replace(/\D/g, '')) / 100;
    try {
      if (editing) {
        await accountService.update(editing._id, { name, creditLimit: numericLimit });
      } else {
        await accountService.create({
          name,
          type: 'credit_card',
          creditLimit: numericLimit,
          initialBalance: numericLimit,
        });
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

  const handleEdit = (card: CardLike) => {
    setEditing(card);
    setName(card.name);
    setLimit(formatCurrencyInput(Math.round(card.creditLimit || 0).toString()));
    setShowForm(true);
  };

  const handleDelete = async (card: CardLike) => {
    if (!window.confirm('Remover este cartão?')) return;
    try {
      await accountService.delete(card._id);
      if (selectedCard?._id === card._id) setSelectedCard(null);
      await loadCards();
    } catch {
      alert('Erro ao remover cartão.');
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

  const loadCardTransactions = async () => {
    if (!selectedCard) return;
    try {
      setLoadingTransactions(true);
      const params = {
        year: currentYear,
        month: currentMonth,
        account: selectedCard._id,
        withCreditCardFilter: true,
      };
      const query = Object.entries(params)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join('&');
      const res = await api.get(`/transactions?${query}`);
      const sorted = [...(res.data as Transaction[])].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setTransactions(sorted);
    } catch (err) {
      console.error('Error loading card transactions:', err);
    } finally {
      setLoadingTransactions(false);
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

  const handleOpenPaymentModal = async () => {
    await loadCheckingAccounts();
    setShowPaymentModal(true);
  };

  const handlePayInvoice = async () => {
    if (!selectedCard || !selectedCheckingAccount) return;

    try {
      setPayingInvoice(true);
      await accountService.payInvoice(
        selectedCard._id,
        selectedCheckingAccount,
        currentYear,
        currentMonth
      );
      alert('Fatura paga com sucesso!');
      setShowPaymentModal(false);
      await loadCards();
      await loadCardTransactions();
    } catch (err) {
      console.error('Erro ao pagar fatura:', err);
      alert('Erro ao pagar fatura. Tente novamente.');
    } finally {
      setPayingInvoice(false);
    }
  };

  const openStatement = (card: CardLike) => {
    setSelectedCard(card);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const totalLimit = cards.reduce((sum, c) => sum + (c.creditLimit || 0), 0);
  const totalUsed = cards.reduce(
    (sum, c) => sum + Math.max(0, (c.creditLimit || 0) - (c.initialBalance || 0)),
    0
  );

  const currentMonthLabel =
    availableMonths.find(
      (m) => m.year === currentYear && m.month === currentMonth
    )?.label || '';
  const currentIndex = availableMonths.findIndex(
    (m) => m.year === currentYear && m.month === currentMonth
  );
  const hasPrevious = currentIndex < availableMonths.length - 1;
  const hasNext = currentIndex > 0;

  // Invoice of the selected month: expenses minus payments already made
  const monthExpensesSum = transactions
    .filter((t) => t.type === 'expense' && !t.isPayment)
    .reduce((sum, t) => sum + t.amount, 0);
  const monthPaymentsSum = transactions
    .filter((t) => t.type === 'income' && t.isPayment)
    .reduce((sum, t) => sum + t.amount, 0);
  const monthInvoiceAmount = (monthExpensesSum - monthPaymentsSum) / 100;
  const monthInvoicePaid = monthInvoiceAmount <= 0;

  if (loading && cards.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-navy-700 mb-3" />
          <p className="text-sm text-navy-500">Carregando cartões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <p className="text-sm text-navy-500">
          Limites, faturas e compras no cartão.
        </p>
        <button
          onClick={() => {
            setShowForm(true);
            setEditing(null);
            setName('');
            setLimit('');
          }}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          Novo cartão
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card p-6 space-y-4">
          <div>
            <label className="label">Nome do cartão</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Nubank, Visa XPTO"
            />
          </div>
          <div>
            <label className="label">Limite</label>
            <input
              type="text"
              className="input num"
              value={limit}
              onChange={handleLimitChange}
              placeholder="R$ 0,00"
              inputMode="numeric"
              required
              autoComplete="off"
              maxLength={20}
            />
          </div>
          <div className="flex gap-3 pt-2">
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
                setLimit('');
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {error && <div className="card p-5 text-sm text-rose-700">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Limite total"
          value={brl(totalLimit)}
          sub={`${cards.length} cartão(ões)`}
        />
        <StatCard
          label="Fatura em aberto"
          value={brl(totalUsed)}
          sub="Limite utilizado"
          tone="out"
        />
        <StatCard
          label="Limite disponível"
          value={brl(Math.max(0, totalLimit - totalUsed))}
          sub="Disponível para compras"
          tone="in"
        />
      </div>

      {cards.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Wallet className="w-6 h-6" />}
            title="Nenhum cartão cadastrado"
            description="Cadastre um cartão para acompanhar limites e faturas."
          />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {cards.map((card, index) => {
            const limitValue = card.creditLimit || 0;
            const used = Math.max(0, limitValue - (card.initialBalance || 0));
            const pct =
              limitValue > 0
                ? Math.min(100, Math.round((used / limitValue) * 100))
                : 0;
            return (
              <div key={card._id} className="card p-5 space-y-4">
                <div
                  className={`rounded-xl p-5 h-40 text-white bg-gradient-to-br ${
                    CARD_GRADIENTS[index % CARD_GRADIENTS.length]
                  } relative overflow-hidden`}
                >
                  <div className="flex justify-between items-start">
                    <div className="font-display text-lg truncate">
                      {card.name}
                    </div>
                    <div className="w-10 h-7 rounded bg-gold-400/70 shrink-0" />
                  </div>
                  <div className="absolute bottom-5 left-5 right-5">
                    <div
                      className="num tracking-widest text-lg"
                      title="O backend não armazena o final nem a bandeira do cartão"
                    >
                      •••• •••• •••• ----
                    </div>
                    <div className="flex justify-between text-xs mt-2 opacity-80">
                      <span>Fatura de {currentMonthLabel || '—'}</span>
                      <span>{card.active === false ? 'Inativa' : 'Ativa'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-navy-500">
                    <span>Utilizado</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-2 bg-navy-100 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-gold-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm mt-2 num">
                    <span className="text-rose-700">{brl(used)}</span>
                    <span className="text-navy-500">{brl(limitValue)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openStatement(card)}
                    className="btn btn-outline flex-1 text-xs"
                  >
                    Fatura
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCard(card);
                      handleOpenPaymentModal();
                    }}
                    disabled={used === 0}
                    className="btn btn-primary flex-1 text-xs"
                  >
                    Pagar
                  </button>
                </div>

                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => handleEdit(card)}
                    className="p-2 rounded-lg text-navy-300 hover:text-navy-700 hover:bg-navy-100 transition-colors"
                    title="Editar cartão"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(card)}
                    className="p-2 rounded-lg text-navy-300 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                    title="Excluir cartão"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedCard && (
        <div className="card">
          <div className="p-4 border-b border-bone-divider flex flex-col md:flex-row md:items-center justify-between gap-3">
            <SectionTitle
              title={`Fatura — ${selectedCard.name}`}
              subtitle={`${currentMonthLabel}${
                monthInvoicePaid ? ' · paga' : ''
              }`}
            />
            <div className="flex items-center gap-2 flex-wrap">
              <MonthSelector
                label={currentMonthLabel}
                hasPrevious={hasPrevious}
                hasNext={hasNext}
                onPrevious={handlePreviousMonth}
                onNext={handleNextMonth}
              />
              <button
                onClick={handleOpenPaymentModal}
                disabled={monthInvoicePaid}
                className="btn btn-primary"
              >
                <Wallet className="w-4 h-4" />
                {monthInvoicePaid ? 'Fatura paga' : 'Pagar fatura'}
              </button>
            </div>
          </div>

          <div className="px-4 py-3 border-b border-bone-divider flex items-center justify-between">
            <span className="stat-label">Valor da fatura</span>
            <span
              className={`num ${
                monthInvoicePaid ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {monthInvoicePaid ? 'Paga' : brl(monthInvoiceAmount * 100)}
            </span>
          </div>

          {loadingTransactions ? (
            <div className="py-12 text-center text-sm text-navy-500">
              Carregando compras...
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center text-sm text-navy-500">
              Nenhuma compra neste mês
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

      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm"
            onClick={() => setShowPaymentModal(false)}
          />
          <div className="relative z-10 w-full max-w-md card">
            <div className="flex items-center justify-between px-6 py-4 border-b border-bone-border">
              <h3 className="font-display text-lg text-navy-900">
                Pagar fatura
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="btn btn-ghost !p-2"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="stat-label">Cartão</p>
                <p className="text-sm text-navy-900 mt-1">
                  {selectedCard?.name}
                </p>
              </div>

              <div>
                <p className="stat-label">Fatura de {currentMonthLabel}</p>
                <p className="num text-2xl text-rose-700 mt-1">
                  {brl(monthInvoiceAmount * 100)}
                </p>
              </div>

              <div>
                <label className="label">Pagar com a conta *</label>
                <select
                  value={selectedCheckingAccount}
                  onChange={(e) => setSelectedCheckingAccount(e.target.value)}
                  className="input"
                  required
                >
                  {checkingAccounts.length === 0 ? (
                    <option value="" disabled>
                      Nenhuma conta disponível
                    </option>
                  ) : (
                    checkingAccounts.map((acc) => (
                      <option key={acc._id} value={acc._id}>
                        {acc.name} - {brl(acc.initialBalance || 0)}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="btn btn-ghost flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handlePayInvoice}
                  disabled={
                    payingInvoice ||
                    !selectedCheckingAccount ||
                    checkingAccounts.length === 0
                  }
                  className="btn btn-primary flex-1"
                >
                  <Wallet className="w-4 h-4" />
                  {payingInvoice ? 'Pagando...' : 'Pagar fatura'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
