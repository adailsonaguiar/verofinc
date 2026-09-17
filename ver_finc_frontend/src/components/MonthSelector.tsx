import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthSelectorProps {
  label: string;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

/** Compact month navigation shared by Visão Geral, Contas and Cartões. */
export const MonthSelector: React.FC<MonthSelectorProps> = ({
  label,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}) => (
  <div className="card inline-flex items-center gap-1 p-1">
    <button
      onClick={onPrevious}
      disabled={!hasPrevious}
      className="p-2 rounded-md text-navy-500 hover:bg-navy-100 hover:text-navy-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      title="Mês anterior"
    >
      <ChevronLeft className="w-4 h-4" />
    </button>
    <span className="num text-sm text-navy-800 capitalize px-2 min-w-[130px] text-center">
      {label}
    </span>
    <button
      onClick={onNext}
      disabled={!hasNext}
      className="p-2 rounded-md text-navy-500 hover:bg-navy-100 hover:text-navy-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      title="Próximo mês"
    >
      <ChevronRight className="w-4 h-4" />
    </button>
  </div>
);
