import React from 'react';
import { StatCard } from './StatCard';

export interface SummaryStat {
  label: string;
  value: string;
  sub?: string;
  tone?: 'navy' | 'in' | 'out';
}

interface DashboardSummaryCardsProps {
  stats: SummaryStat[];
}

/** Row of four KPIs, mirroring the reference layout. */
export const DashboardSummaryCards: React.FC<DashboardSummaryCardsProps> = ({
  stats,
}) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {stats.map((stat) => (
      <StatCard
        key={stat.label}
        label={stat.label}
        value={stat.value}
        sub={stat.sub}
        tone={stat.tone}
      />
    ))}
  </div>
);
