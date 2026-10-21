import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Repeat2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  Account,
  Category,
  CreateScheduledPaymentDto,
  RecurrenceFrequency,
  ScheduledPayment,
  TransactionType,
  UpdateScheduledPaymentDto,
} from '../types';

interface ScheduledPaymentModalProps {
  open: boolean;
  accounts: Account[];
  categories: Category[];
  initialData?: ScheduledPayment | null;
  onClose: () => void;
  onSubmit: (
    data: CreateScheduledPaymentDto | UpdateScheduledPaymentDto
  ) => Promise<void>;
}

const today = () => new Date().toISOString().split('T')[0];

export const ScheduledPaymentModal: React.FC<ScheduledPaymentModalProps> = ({
  open,
  accounts,
  categories,
  initialData,
  onClose,
  onSubmit,
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(today());
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(
    RecurrenceFrequency.MONTHLY
  );
  const [interval, setInterval] = useState('1');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const eligibleAccounts = useMemo(
    () => accounts.filter((account) => account.active && account.type !== 'credit_card'),
    [accounts]
  );
  const eligibleCategories = useMemo(
    () =>
      categories.filter(
        (category) => category.active && String(category.type) === String(type)
      ),
    [categories, type]
  );

  useEffect(() => {
    if (!open) return;
    setDescription(initialData?.description ?? '');
    setAmount(initialData ? String(initialData.amount / 100) : '');
    setDueDate(initialData?.dueDate.split('T')[0] ?? today());
    setType(initialData?.type ?? TransactionType.EXPENSE);
    setCategoryId(initialData?.category?._id ?? '');
    setAccountId(initialData?.account?._id ?? eligibleAccounts[0]?._id ?? '');
    setRecurring(false);
    setFrequency(RecurrenceFrequency.MONTHLY);
    setInterval('1');
    setEndDate('');
  }, [open, initialData, eligibleAccounts]);

  useEffect(() => {
    if (!eligibleCategories.some((category) => category._id === categoryId)) {
      setCategoryId(eligibleCategories[0]?._id ?? '');
    }
  }, [eligibleCategories, categoryId]);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const numericAmount = Number(amount.replace(',', '.'));
    if (!description.trim() || !numericAmount || !categoryId || !accountId) {
      toast.error('Preencha os dados obrigatórios do agendamento.');
      return;
    }
    if (recurring && endDate && endDate < dueDate) {
      toast.error('A recorrência não pode terminar antes do primeiro vencimento.');
      return;
    }

    setSubmitting(true);
    try {
      const base = {
        description: description.trim(),
        amount: numericAmount,
        dueDate,
        type,
        categoryId,
        account: accountId,
      };
      await onSubmit(
        initialData
          ? base
          : {
              ...base,
              recurrence: recurring
                ? {
                    frequency,
                    interval: Number(interval),
                    ...(endDate ? { endDate } : {}),
                  }
                : undefined,
            }
      );
      onClose();
    } catch {
      toast.error('Não foi possível salvar o agendamento.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6">
      <button
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Fechar formulário"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="scheduled-payment-title"
        className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-bone-border bg-[#121214] p-5 sm:max-w-2xl sm:rounded-2xl sm:p-7"
      >
        <div className="mb-7 flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-400 text-[#171916]">
              <CalendarClock className="h-5 w-5" />
            </span>
            <div>
              <h2 id="scheduled-payment-title" className="text-xl font-semibold tracking-[-0.03em]">
                {initialData ? 'Editar vencimento' : 'Novo vencimento'}
              </h2>
              <p className="mt-1 text-xs text-navy-500">
                Só afeta o saldo quando for marcado como pago.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost h-9 w-9 p-0" aria-label="Fechar">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="schedule-description" className="label">Descrição</label>
            <input id="schedule-description" className="input" value={description} onChange={(event) => setDescription(event.target.value)} required autoFocus />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="schedule-amount" className="label">Valor</label>
              <input id="schedule-amount" className="input num" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required />
            </div>
            <div>
              <label htmlFor="schedule-due-date" className="label">Vencimento</label>
              <input id="schedule-due-date" className="input" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required />
            </div>
          </div>

          <fieldset>
            <legend className="label">Tipo</legend>
            <div className="grid grid-cols-2 gap-3">
              {[
                [TransactionType.EXPENSE, 'Conta a pagar'],
                [TransactionType.INCOME, 'Valor a receber'],
              ].map(([value, label]) => (
                <button key={value} type="button" onClick={() => setType(value as TransactionType)} className={`rounded-lg border px-3 py-2.5 text-sm transition-colors ${type === value ? 'border-gold-400 bg-gold-400 text-[#171916]' : 'border-navy-200 text-navy-700 hover:bg-navy-100'}`}>
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="schedule-account" className="label">Conta</label>
              <select id="schedule-account" className="input" value={accountId} onChange={(event) => setAccountId(event.target.value)} required>
                <option value="" disabled>Selecione</option>
                {eligibleAccounts.map((account) => <option key={account._id} value={account._id}>{account.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="schedule-category" className="label">Categoria</label>
              <select id="schedule-category" className="input" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required>
                <option value="" disabled>Selecione</option>
                {eligibleCategories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
              </select>
            </div>
          </div>

          {!initialData && (
            <div className="rounded-xl border border-bone-border bg-bone-soft p-4">
              <label className="flex cursor-pointer items-center justify-between gap-4">
                <span className="flex items-center gap-3">
                  <Repeat2 className="h-4 w-4 text-gold-400" />
                  <span>
                    <span className="block text-sm font-medium">Repetir vencimento</span>
                    <span className="mt-0.5 block text-xs text-navy-500">O próximo vencimento será criado depois da quitação.</span>
                  </span>
                </span>
                <input type="checkbox" checked={recurring} onChange={(event) => setRecurring(event.target.checked)} className="h-4 w-4 accent-[#d7f36b]" />
              </label>

              {recurring && (
                <div className="mt-4 grid gap-4 border-t border-bone-divider pt-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="schedule-frequency" className="label">Frequência</label>
                    <select id="schedule-frequency" className="input" value={frequency} onChange={(event) => setFrequency(event.target.value as RecurrenceFrequency)}>
                      <option value={RecurrenceFrequency.WEEKLY}>Semanal</option>
                      <option value={RecurrenceFrequency.MONTHLY}>Mensal</option>
                      <option value={RecurrenceFrequency.YEARLY}>Anual</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="schedule-interval" className="label">A cada</label>
                    <input id="schedule-interval" className="input num" type="number" min="1" max="12" value={interval} onChange={(event) => setInterval(event.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="schedule-end" className="label">Até (opcional)</label>
                    <input id="schedule-end" className="input" type="date" min={dueDate} value={endDate} onChange={(event) => setEndDate(event.target.value)} />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-bone-divider pt-5">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Salvando…' : initialData ? 'Salvar alterações' : 'Criar vencimento'}</button>
          </div>
        </form>
      </section>
    </div>
  );
};
