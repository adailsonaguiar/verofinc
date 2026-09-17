import React from 'react';

export type ChipTone =
  | 'navy'
  | 'gold'
  | 'emerald'
  | 'rose'
  | 'amber'
  | 'neutral';

const TONE_CLASSES: Record<ChipTone, string> = {
  navy: 'bg-navy-100 text-navy-800',
  gold: 'bg-gold-400/20 text-gold-600',
  emerald: 'bg-emerald-100 text-emerald-800',
  rose: 'bg-rose-100 text-rose-800',
  amber: 'bg-amber-100 text-amber-800',
  neutral: 'bg-bone-soft text-navy-500 border border-bone-border',
};

interface ChipProps {
  tone?: ChipTone;
  children: React.ReactNode;
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({
  tone = 'navy',
  children,
  className = '',
}) => <span className={`chip ${TONE_CLASSES[tone]} ${className}`}>{children}</span>;
