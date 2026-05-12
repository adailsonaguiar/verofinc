import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DashboardHeaderProps {
  currentMonthLabel: string;
  hasPrevious: boolean;
  hasNext: boolean;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  currentMonthLabel,
  hasPrevious,
  hasNext,
  onPreviousMonth,
  onNextMonth,
}) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
        Visão Geral
      </h1>
      <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
        Acompanhe seus resultados e atinja suas metas.
      </p>
    </div>

    <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60">
      <button
        onClick={onPreviousMonth}
        disabled={!hasPrevious}
        className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-600 dark:text-slate-300"
        title="Mês anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-2 px-3">
        <Calendar className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
        <span className="min-w-[120px] text-center text-sm font-bold text-slate-800 dark:text-slate-200 capitalize tracking-wide">
          {currentMonthLabel}
        </span>
      </div>
      <button
        onClick={onNextMonth}
        disabled={!hasNext}
        className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-600 dark:text-slate-300"
        title="Próximo mês"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  </div>
);
