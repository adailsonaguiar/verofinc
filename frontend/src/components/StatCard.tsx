import React from 'react';

type StatTone = 'navy' | 'in' | 'out';

const TONE_CLASSES: Record<StatTone, string> = {
  navy: 'text-navy-900',
  in: 'text-emerald-700',
  out: 'text-rose-700',
};

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  tone?: StatTone;
}

/**
 * KPI block: uppercase tracking label, mono value, optional caption.
 * Mirrors the `Stat` component of the reference design.
 */
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sub,
  tone = 'navy',
}) => (
  <div className="card p-5">
    <div className="stat-label">{label}</div>
    <div className={`num text-2xl md:text-3xl mt-2 ${TONE_CLASSES[tone]}`}>
      {value}
    </div>
    {sub && <div className="text-xs text-navy-500 mt-1">{sub}</div>}
  </div>
);
