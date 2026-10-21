import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarClock,
  Check,
  Clock3,
  Loader2,
  Pencil,
  Plus,
  Repeat2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { format, isBefore, parseISO, startOfDay } from 'date-fns';
import { toast } from 'react-toastify';
import { accountService } from '../services/accountService';
import { categoryService } from '../services/categoryService';
import { scheduledPaymentService } from '../services/scheduledPaymentService';
import { queryKeys } from '../lib/queryKeys';
import {
  CreateScheduledPaymentDto,
  ScheduledPayment,
  ScheduledPaymentStatus,
  TransactionType,
  UpdateScheduledPaymentDto,
} from '../types';
import { formatCurrency } from '../utils/transactions';
import { getScheduledPaymentDueState } from '../utils/scheduledPayments';
import { PageHeading } from '../components/PageHeading';
import { EmptyState } from '../components/EmptyState';
import { ScheduledPaymentModal } from '../components/ScheduledPaymentModal';

type ViewFilter = ScheduledPaymentStatus.PENDING | 'overdue';

const recurrenceLabel = (payment: ScheduledPayment) => {
  if (!payment.recurrence) return null;
  const unit = {
    weekly: payment.recurrence.interval === 1 ? 'semana' : 'semanas',
    monthly: payment.recurrence.interval === 1 ? 'mês' : 'meses',
    yearly: payment.recurrence.interval === 1 ? 'ano' : 'anos',
  }[payment.recurrence.frequency];
  return `A cada ${payment.recurrence.interval} ${unit}`;
};

export const ScheduledPaymentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ViewFilter>(ScheduledPaymentStatus.PENDING);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduledPayment | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const paymentsQuery = useQuery({
    queryKey: queryKeys.scheduledPayments.list(filter),
    queryFn: () => scheduledPaymentService.getAll({ status: filter }),
  });
  const pendingSummaryQuery = useQuery({
    queryKey: queryKeys.scheduledPayments.list(ScheduledPaymentStatus.PENDING),
    queryFn: () =>
      scheduledPaymentService.getAll({ status: ScheduledPaymentStatus.PENDING }),
  });
  const accountsQuery = useQuery({
    queryKey: queryKeys.accounts.all,
    queryFn: () => accountService.getAll(),
  });
  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => categoryService.getAll(),
  });

  const payments = paymentsQuery.data ?? [];
  const todayStart = useMemo(() => startOfDay(new Date()), []);
  const summary = useMemo(() => {
    const pending = pendingSummaryQuery.data ?? [];
    const expenses = pending.filter((item) => item.type === TransactionType.EXPENSE);
    const income = pending.filter((item) => item.type === TransactionType.INCOME);
    return {
      expenses: expenses.reduce((total, item) => total + item.amount, 0),
      income: income.reduce((total, item) => total + item.amount, 0),
      overdue: pending.filter((item) =>
        isBefore(startOfDay(parseISO(item.dueDate)), todayStart)
      ).length,
    };
  }, [pendingSummaryQuery.data, todayStart]);

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduledPayments.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all }),
    ]);

  const handleSubmit = async (
    data: CreateScheduledPaymentDto | UpdateScheduledPaymentDto
  ) => {
    if (editing) {
      await scheduledPaymentService.update(editing._id, data as UpdateScheduledPaymentDto);
      toast.success('Vencimento atualizado.');
    } else {
      await scheduledPaymentService.create(data as CreateScheduledPaymentDto);
      toast.success('Próximo vencimento agendado.');
    }
    await invalidate();
  };

  const handlePay = async (payment: ScheduledPayment) => {
    if (!confirm(`Marcar “${payment.description}” como pago e movimentar a conta?`)) {
      return;
    }
    setPayingId(payment._id);
    try {
      await scheduledPaymentService.pay(
        payment._id,
        format(new Date(), 'yyyy-MM-dd')
      );
      await invalidate();
      toast.success(
        payment.recurrence
          ? 'Pagamento registrado. O próximo vencimento já foi agendado.'
          : 'Pagamento registrado e saldo atualizado.'
      );
    } catch {
      toast.error('Não foi possível registrar o pagamento. Tente novamente.');
    } finally {
      setPayingId(null);
    }
  };

  const handleDelete = async (payment: ScheduledPayment) => {
    const message = payment.recurrence
      ? `Encerrar a recorrência de “${payment.description}”? Nenhum próximo vencimento será criado.`
      : `Excluir o vencimento de “${payment.description}”?`;
    if (!confirm(message)) return;
    try {
      await scheduledPaymentService.delete(payment._id);
      await invalidate();
      toast.success(
        payment.recurrence ? 'Recorrência encerrada.' : 'Vencimento excluído.'
      );
    } catch {
      toast.error('Somente vencimentos pendentes podem ser excluídos.');
    }
  };

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-7 md:px-[50px] md:py-10">
      <PageHeading
        title="Próximos vencimentos"
        subtitle="Uma ocorrência por compromisso; a próxima nasce após a quitação."
        actions={
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Novo vencimento
          </button>
        }
      />

      <section className="mt-8 grid gap-px overflow-hidden rounded-xl border border-bone-border bg-bone-border sm:grid-cols-3" aria-label="Resumo dos vencimentos">
        <div className="bg-[#121214] p-5">
          <p className="stat-label">A pagar</p>
          <p className="num mt-2 text-xl font-semibold text-[#e58b6a]">{formatCurrency(summary.expenses)}</p>
        </div>
        <div className="bg-[#121214] p-5">
          <p className="stat-label">A receber</p>
          <p className="num mt-2 text-xl font-semibold text-emerald-400">{formatCurrency(summary.income)}</p>
        </div>
        <div className="bg-[#121214] p-5">
          <p className="stat-label">Atenção</p>
          <p className={`num mt-2 text-xl font-semibold ${summary.overdue ? 'text-gold-400' : 'text-navy-900'}`}>
            {summary.overdue ? `${summary.overdue} vencido${summary.overdue > 1 ? 's' : ''}` : 'Tudo em dia'}
          </p>
        </div>
      </section>

      <div className="mt-8 flex gap-1 overflow-x-auto border-b border-bone-divider" role="tablist" aria-label="Filtrar vencimentos">
        {[
          [ScheduledPaymentStatus.PENDING, 'Pendentes'],
          ['overdue', 'Vencidos'],
        ].map(([value, label]) => (
          <button
            key={value}
            role="tab"
            aria-selected={filter === value}
            onClick={() => setFilter(value as ViewFilter)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm transition-colors ${
              filter === value
                ? 'border-gold-400 font-semibold text-gold-400'
                : 'border-transparent text-navy-500 hover:text-navy-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="mt-5 overflow-hidden rounded-xl border border-bone-border bg-[#121214]" aria-live="polite">
        {paymentsQuery.isPending ? (
          <div className="flex items-center justify-center gap-3 py-20 text-sm text-navy-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Carregando vencimentos…
          </div>
        ) : paymentsQuery.isError ? (
          <div className="flex flex-col items-center py-16 text-center">
            <AlertTriangle className="mb-3 h-7 w-7 text-[#e58b6a]" />
            <p className="font-medium">Não foi possível carregar os vencimentos.</p>
            <button className="btn btn-outline mt-4" onClick={() => paymentsQuery.refetch()}>Tentar novamente</button>
          </div>
        ) : payments.length === 0 ? (
          <EmptyState
            icon={<CalendarClock className="h-7 w-7" />}
            title={filter === 'overdue' ? 'Nenhum vencimento atrasado' : 'Nenhum vencimento pendente'}
            description={filter === ScheduledPaymentStatus.PENDING ? 'Agende contas e recebimentos para acompanhar o que vem pela frente.' : undefined}
            action={filter === ScheduledPaymentStatus.PENDING ? <button className="btn btn-primary" onClick={openCreate}><Plus className="h-4 w-4" /> Criar primeiro vencimento</button> : undefined}
          />
        ) : (
          <ul className="divide-classic">
            {payments.map((payment) => {
              const state = getScheduledPaymentDueState(payment);
              const recurrence = recurrenceLabel(payment);
              const isPending = payment.status === ScheduledPaymentStatus.PENDING;
              return (
                <li key={payment._id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:px-5">
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${payment.type === TransactionType.EXPENSE ? 'bg-[#ca7251]/10 text-[#e58b6a]' : 'bg-emerald-400/10 text-emerald-400'}`}>
                    {isBefore(startOfDay(parseISO(payment.dueDate)), todayStart) && isPending ? <AlertTriangle className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-navy-900">{payment.description}</p>
                      <span className={`chip ${state.tone}`}>{state.label}</span>
                      {recurrence && <span className="chip bg-navy-100 text-navy-500"><Repeat2 className="h-3 w-3" /> {recurrence}</span>}
                    </div>
                    <p className="mt-1 text-xs text-navy-500">
                      {payment.category?.name ?? 'Sem categoria'} · {payment.account?.name ?? 'Conta'}
                      {payment.recurrence ? ` · ocorrência ${payment.occurrenceNumber}` : ''}
                    </p>
                  </div>
                  <p className={`num text-base font-semibold ${payment.type === TransactionType.EXPENSE ? 'text-[#e58b6a]' : 'text-emerald-400'}`}>
                    {payment.type === TransactionType.EXPENSE ? '−' : '+'}{formatCurrency(payment.amount)}
                  </p>
                  {isPending && (
                    <div className="flex items-center gap-1 sm:ml-2">
                      <button className="btn btn-primary flex-1 sm:flex-none" onClick={() => handlePay(payment)} disabled={payingId === payment._id}>
                        {payingId === payment._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Marcar como pago
                      </button>
                      <button className="btn btn-ghost h-9 w-9 p-0" onClick={() => { setEditing(payment); setModalOpen(true); }} aria-label={`Editar ${payment.description}`}><Pencil className="h-4 w-4" /></button>
                      <button
                        className="btn btn-ghost h-9 w-9 p-0 text-[#e58b6a]"
                        onClick={() => handleDelete(payment)}
                        aria-label={
                          payment.recurrence
                            ? `Encerrar recorrência de ${payment.description}`
                            : `Excluir ${payment.description}`
                        }
                        title={
                          payment.recurrence
                            ? 'Encerrar recorrência'
                            : 'Excluir vencimento'
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="mt-4 text-xs leading-5 text-navy-500">
        Faturas de cartão continuam na área Cartões; aqui entram apenas compromissos de contas correntes.
      </p>

      <ScheduledPaymentModal
        open={modalOpen}
        accounts={accountsQuery.data ?? []}
        categories={categoriesQuery.data ?? []}
        initialData={editing}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSubmit={handleSubmit}
      />
    </div>
  );
};
