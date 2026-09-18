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
  /** Lime-tinted hero treatment (saldo total). */
  highlight?: boolean;
  /** Small positive/negative delta shown beside the label. */
  trend?: string;
  /** Sparkline bar heights (px) for the hero card. */
  spark?: number[];
  /** Mini progress bar fill, 0..100. */
  bar?: number;
  barWarm?: boolean;
}

/**
 * nivo KPI block: uppercase tracking label, large value, optional sparkline
 * or mini progress bar, and a muted caption.
 */
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sub,
  tone = 'navy',
  highlight = false,
  trend,
  spark,
  bar,
  barWarm = false,
}) => (
  <div
    className={`min-h-[168px] rounded-xl border p-5 ${
      highlight
        ? 'border-[#3d4722] bg-[#171a12]'
        : 'border-bone-border bg-[#121214]'
    }`}
  >
    <div className="flex items-center justify-between">
      <span className="stat-label">{label}</span>
      {trend && <span className="text-[10px] text-[#a6bd54]">{trend}</span>}
    </div>

    <div
      className={`num mt-4 font-bold tracking-[-0.04em] ${
        highlight ? 'text-[30px]' : 'text-2xl'
      } ${TONE_CLASSES[tone]}`}
    >
      {value}
    </div>

    {spark && spark.length > 0 && (
      <div className="mt-3 flex h-6 items-end gap-1">
        {spark.map((height, index) => (
          <span
            key={index}
            className="w-2.5 rounded-[3px_3px_1px_1px] bg-gold-400"
            style={{ height: `${height}px` }}
          />
        ))}
      </div>
    )}

    {bar !== undefined && (
      <div className="mt-7 h-1 overflow-hidden rounded-full bg-navy-100">
        <span
          className={`block h-full rounded-full ${
            barWarm ? 'bg-[#ca7251]' : 'bg-[#7790d5]'
          }`}
          style={{ width: `${Math.min(100, bar)}%` }}
        />
      </div>
    )}

    {sub && <p className="mt-3 text-[10px] text-navy-500">{sub}</p>}
  </div>
);
