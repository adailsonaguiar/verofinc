import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-6">
    <div className="w-16 h-16 rounded-xl bg-bone-soft border border-bone-border flex items-center justify-center mb-4 text-navy-300">
      {icon}
    </div>
    <p className="font-display text-lg text-navy-900">{title}</p>
    {description && (
      <p className="text-sm text-navy-500 mt-1 max-w-sm">{description}</p>
    )}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
