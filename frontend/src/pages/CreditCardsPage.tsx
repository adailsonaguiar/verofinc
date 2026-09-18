import { useEffect, useState } from 'react';
import { Loader2, Pencil, Plus, Trash2, Wallet, X } from 'lucide-react';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import { invoiceService } from '../services/invoiceService';
import { Transaction, Invoice, InvoiceStatus } from '../types';
import { TransactionCard } from '../components/TransactionCard';
import { MonthSelector } from '../components/MonthSelector';
import { SectionTitle } from '../components/SectionTitle';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/EmptyState';
import { PageHeading } from '../components/PageHeading';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { computeInvoicePeriod, formatInvoiceDay } from '../utils/invoices';
import api from '../services/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface CardLike {
  _id: string;
  name: string;
  type: string;
  active?: boolean;
  initialBalance?: number;
  creditLimit?: number;
  closingDay?: number;
  dueDay?: number;
}

const brl = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** The backend has no brand/gradient field, so the plastic uses a dark ramp. */
const CARD_GRADIENTS = [
  'from-[#333239] to-[#17171a]',
  'from-[#2a2a33] to-[#141416]',
  'from-[#1e2a3a] to-[#131519]',
  'from-[#332a2a] to-[#17171a]',
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
  const [closingDay, setClosingDay] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [editing, setEditing] = useState<CardLike | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardLike | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
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
      loadInvoices();
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
    const closingDayValue = closingDay ? Number(closingDay) : undefined;
    const dueDayValue = dueDay ? Number(dueDay) : undefined;
    try {
      if (editing) {
        await accountService.update(editing._id, {
          name,
          creditLimit: numericLimit,
          closingDay: closingDayValue,
          dueDay: dueDayValue,
        });
      } else {
        await accountService.create({
          name,
          type: 'credit_card',
          creditLimit: numericLimit,
          initialBalance: numericLimit,
          closingDay: closingDayValue,
          dueDay: dueDayValue,
        });
      }
      setName('');
      setLimit('');
      setClosingDay('');
      setDueDay('');
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
    setClosingDay(card.closingDay ? String(card.closingDay) : '');
    setDueDay(card.dueDay ? String(card.dueDay) : '');
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

  const loadInvoices = async () => {
    if (!selectedCard) return;
    try {
      setInvoices(await invoiceService.listByAccount(selectedCard._id));
    } catch (err) {
      console.error('Error loading invoices:', err);
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
      toast.success('Fatura paga com sucesso!');
      setShowPaymentModal(false);
      await loadCards();
      await loadCardTransactions();
      await loadInvoices();
    } catch (err) {
      console.error('Erro ao pagar fatura:', err);
      toast.error('Erro ao pagar fatura. Tente novamente.', {
        position: 'top-center',
        autoClose: 3000,
      });
    } finally {
      setPayingInvoice(false);
    }
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

  const currentRefMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const currentInvoice = invoices.find(
    (inv) => inv.referenceMonth === currentRefMonth
  );
  const invoicePeriod = selectedCard?.closingDay
    ? computeInvoicePeriod(
        selectedCard.closingDay,
        selectedCard.dueDay ?? selectedCard.closingDay,
        new Date(currentYear, currentMonth - 1, 1)
      )
    : null;

  // Invoice of the selected month: expenses minus payments already made
  const monthExpensesSum = transactions
    .filter((t) => t.type === 'expense' && !t.isPayment)
    .reduce((sum, t) => sum + t.amount, 0);
  const monthPaymentsSum = transactions
    .filter((t) => t.type === 'income' && t.isPayment)
    .reduce((sum, t) => sum + t.amount, 0);
  const monthInvoiceAmount = (monthExpensesSum - monthPaymentsSum) / 100;
  // "Paga" follows the invoice entity status when one exists; otherwise fall
  // back to the transaction-sum heuristic.
  const monthInvoicePaid = currentInvoice
    ? currentInvoice.status === InvoiceStatus.PAID
    : monthInvoiceAmount <= 0;

  const invoiceStatusLabel = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID:
        return 'Paga';
      case InvoiceStatus.CLOSED:
        return 'Fechada';
      case InvoiceStatus.OVERDUE:
        return 'Vencida';
      default:
        return 'Aberta';
    }
  };

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
    <div className="mx-auto max-w-[1280px] space-y-6 px-4 pb-8 pt-8 md:px-[50px] md:pt-12">
      <PageHeading
        title="Cartões de Crédito"
        subtitle="Limites, faturas e compras no cartão."
        actions={
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
        }
      />

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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Dia de fechamento</label>
              <input
                type="number"
                min={1}
                max={31}
                className="input num"
                value={closingDay}
                onChange={(e) => setClosingDay(e.target.value)}
                placeholder="Ex: 10"
                inputMode="numeric"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="label">Dia de vencimento</label>
              <input
                type="number"
                min={1}
                max={31}
                className="input num"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                placeholder="Ex: 17"
                inputMode="numeric"
                autoComplete="off"
              />
            </div>
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
                setClosingDay('');
                setDueDay('');
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
        {/* <StatCard
          label="Utilizado"
          value={brl(totalUsed)}
          sub="Limite utilizado"
          tone="out"
        /> */}
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

                {card.closingDay && (
                  <div className="text-xs text-navy-500">
                    Fecha dia {card.closingDay}
                    {card.dueDay ? ` · Vence dia ${card.dueDay}` : ''}
                  </div>
                )}

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

          {(currentInvoice || invoicePeriod) && (
            <div className="px-4 py-3 border-b border-bone-divider flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-navy-500">
                Período{' '}
                <span className="num text-navy-800">
                  {currentInvoice
                    ? `${formatInvoiceDay(new Date(currentInvoice.startDate))} → ${formatInvoiceDay(new Date(currentInvoice.closingDate))}`
                    : invoicePeriod
                    ? `${formatInvoiceDay(invoicePeriod.startDate)} → ${formatInvoiceDay(invoicePeriod.closingDate)}`
                    : '—'}
                </span>
                {(currentInvoice || invoicePeriod) && (
                  <span className="text-navy-500">
                    {' '}
                    · vence em{' '}
                    {formatInvoiceDay(
                      new Date(
                        currentInvoice?.dueDate ?? invoicePeriod!.dueDate
                      )
                    )}
                  </span>
                )}
              </span>
              {currentInvoice && (
                <span
                  className={`chip ${
                    currentInvoice.status === InvoiceStatus.PAID
                      ? 'bg-emerald-100 text-emerald-700'
                      : currentInvoice.status === InvoiceStatus.OVERDUE
                      ? 'bg-rose-100 text-rose-700'
                      : currentInvoice.status === InvoiceStatus.CLOSED
                      ? 'bg-gold-100 text-gold-800'
                      : 'bg-navy-100 text-navy-800'
                  }`}
                >
                  {invoiceStatusLabel(currentInvoice.status)}
                </span>
              )}
            </div>
          )}

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
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
