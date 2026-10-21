import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CalendarClock,
  Loader2,
  Plus,
} from 'lucide-react';
import { ScheduledPayment, TransactionType } from '../types';
import {
  formatCurrency,
  isInvestmentTransaction,
} from '../utils/transactions';
import { getScheduledPaymentDueState } from '../utils/scheduledPayments';
import { SectionTitle } from './SectionTitle';

interface DashboardScheduledPaymentsProps {
  payments: ScheduledPayment[];
  scheduledOutflow: number;
  scheduledInvestments: number;
  scheduledIncome: number;
  monthLabel: string;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}

export const DashboardScheduledPayments: React.FC<
  DashboardScheduledPaymentsProps
> = ({
  payments,
  scheduledOutflow,
  scheduledInvestments,
  scheduledIncome,
  monthLabel,
  loading,
  error,
  onRetry,
}) => {
  const visiblePayments = payments.slice(0, 5);
  const remaining = payments.length - visiblePayments.length;
  const expensePayments = payments.filter(
    (payment) => payment.type === TransactionType.EXPENSE
  );
  const outflowCount = expensePayments.filter(
    (payment) => !isInvestmentTransaction(payment)
  ).length;
  const investmentCount = expensePayments.filter((payment) =>
    isInvestmentTransaction(payment)
  ).length;
  const incomeCount = payments.filter(
    (payment) => payment.type === TransactionType.INCOME
  ).length;

  return (
    <>
      <SectionTitle
        title="Pagamentos agendados"
        subtitle={`Pendentes em ${monthLabel}`}
        action={
          <Link
            to="/scheduled-payments"
            className="btn btn-outline !px-3 !py-1.5 text-xs"
          >
            Ver todos
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      {loading ? (
        <div className="flex min-h-[180px] items-center justify-center gap-3 text-sm text-navy-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando agendamentos...
        </div>
      ) : error ? (
        <div className="flex min-h-[180px] flex-col items-center justify-center text-center">
          <AlertTriangle className="mb-3 h-6 w-6 text-[#e58b6a]" />
          <p className="text-sm text-navy-700">
            Não foi possível carregar os agendamentos.
          </p>
          <button className="btn btn-outline mt-4" onClick={onRetry}>
            Tentar novamente
          </button>
        </div>
      ) : payments.length === 0 ? (
        <div className="flex min-h-[180px] flex-col items-center justify-center px-6 text-center">
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-xl border border-bone-border bg-bone-soft text-navy-300">
            <CalendarClock className="h-6 w-6" />
          </div>
          <p className="font-display text-base text-navy-900">
            Nenhum agendamento pendente
          </p>
          <p className="mt-1 max-w-sm text-sm text-navy-500">
            Agende contas e recebimentos para acompanhar as saídas previstas do
            mês.
          </p>
          <Link to="/scheduled-payments" className="btn btn-primary mt-5">
            <Plus className="h-4 w-4" />
            Novo vencimento
          </Link>
        </div>
      ) : (
        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div>
            <ul className="divide-classic -mx-1">
              {visiblePayments.map((payment) => {
                const isIncome = payment.type === TransactionType.INCOME;
                const state = getScheduledPaymentDueState(payment);

                return (
                  <li
                    key={payment._id}
                    className="flex items-center gap-3 px-1 py-3"
                  >
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                        isIncome
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDown className="h-4 w-4" />
                      ) : (
                        <ArrowUp className="h-4 w-4" />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm text-navy-900">
                          {payment.description}
                        </p>
                        <span className={`chip ${state.tone}`}>
                          {state.label}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-navy-500">
                        {payment.category?.name ?? 'Sem categoria'} ·{' '}
                        {payment.account?.name ?? 'Conta'}
                      </p>
                    </div>

                    <p
                      className={`num shrink-0 text-sm font-semibold ${
                        isIncome ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {isIncome ? '+' : '−'}
                      {formatCurrency(payment.amount)}
                    </p>
                  </li>
                );
              })}
            </ul>

            {remaining > 0 && (
              <p className="mt-3 text-xs text-navy-500">
                Mais {remaining} agendamento{remaining > 1 ? 's' : ''} pendente
                {remaining > 1 ? 's' : ''}.{' '}
                <Link
                  to="/scheduled-payments"
                  className="text-gold-400 hover:underline"
                >
                  Ver todos
                </Link>
              </p>
            )}
          </div>

          <aside
            className="rounded-lg border border-bone-divider bg-[#171719] p-4"
            aria-label="Resumo dos pagamentos agendados"
          >
            <p className="stat-label">Resumo do mês</p>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-xs text-navy-500">Saídas agendadas</dt>
                <dd className="num mt-1 text-lg font-semibold text-[#e58b6a]">
                  {formatCurrency(scheduledOutflow)}
                </dd>
                <p className="mt-0.5 text-[10px] text-navy-500">
                  {outflowCount} vencimento{outflowCount === 1 ? '' : 's'}
                </p>
              </div>
              {scheduledInvestments > 0 && (
                <div>
                  <dt className="text-xs text-navy-500">
                    Investimentos agendados
                  </dt>
                  <dd className="num mt-1 text-lg font-semibold text-gold-400">
                    {formatCurrency(scheduledInvestments)}
                  </dd>
                  <p className="mt-0.5 text-[10px] text-navy-500">
                    {investmentCount} vencimento
                    {investmentCount === 1 ? '' : 's'}
                  </p>
                </div>
              )}
              <div>
                <dt className="text-xs text-navy-500">A receber</dt>
                <dd className="num mt-1 text-lg font-semibold text-emerald-400">
                  {formatCurrency(scheduledIncome)}
                </dd>
                <p className="mt-0.5 text-[10px] text-navy-500">
                  {incomeCount} vencimento{incomeCount === 1 ? '' : 's'}
                </p>
              </div>
            </dl>
          </aside>
        </div>
      )}
    </>
  );
};
