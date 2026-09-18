import React from 'react';

function barTone(pct: number | null): string {
  if (pct == null) return 'bg-navy-100';
  if (pct >= 100) return 'bg-rose-600';
  if (pct >= 80) return 'bg-[#ca7251]';
  return 'bg-gold-400';
}

interface BudgetProgressBarProps {
  pct: number | null;
  className?: string;
}

/** Shared budget progress bar: empty when no limit, navy below 80%, gold 80–99%, rose at/over limit. */
export const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({
  pct,
  className = '',
}) => {
  const width = pct == null ? 0 : Math.min(100, pct);
  return (
    <div className={`h-2 rounded-full bg-navy-100 overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${barTone(pct)}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
};
