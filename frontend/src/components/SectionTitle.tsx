import React from 'react';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

/** Playfair heading + small navy caption, as used on every reference card. */
export const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  subtitle,
  action,
  className = '',
}) => (
  <div className={`flex items-start justify-between gap-4 ${className}`}>
    <div>
      <div className="font-display text-lg text-navy-900">{title}</div>
      {subtitle && <div className="text-xs text-navy-500 mt-0.5">{subtitle}</div>}
    </div>
    {action}
  </div>
);
