import React from 'react';
import { StatCard } from './StatCard';

export interface SummaryStat {
  label: string;
  value: string;
  sub?: string;
  tone?: 'navy' | 'in' | 'out';
  highlight?: boolean;
  trend?: string;
  spark?: number[];
  bar?: number;
  barWarm?: boolean;
}

interface DashboardSummaryCardsProps {
  stats: SummaryStat[];
}

/** Row of KPIs in the nivo style, the first (saldo) carrying the hero treatment. */
export const DashboardSummaryCards: React.FC<DashboardSummaryCardsProps> = ({
  stats,
}) => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
    {stats.map((stat) => (
      <StatCard key={stat.label} {...stat} />
    ))}
  </div>
);
