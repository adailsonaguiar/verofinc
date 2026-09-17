import React from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'outline';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  compact?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  ghost: 'btn-ghost',
  outline: 'btn-outline',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  compact = false,
  className = '',
  children,
  ...rest
}) => (
  <button
    className={`btn ${VARIANT_CLASSES[variant]} ${
      compact ? '!px-3 !py-1.5 text-xs' : ''
    } ${className}`}
    {...rest}
  >
    {children}
  </button>
);
