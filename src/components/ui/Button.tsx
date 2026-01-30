/**
 * Reusable Button components
 */

import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost' | 'dark';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500',
  secondary: 'bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-500',
  success: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500',
  danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
  warning: 'bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-500',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 border border-gray-300',
  dark: 'bg-slate-800 text-white hover:bg-slate-900 focus:ring-slate-500',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = [
    'inline-flex items-center justify-center gap-2 font-semibold rounded',
    'transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'active:scale-[0.98]',
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={baseClasses} disabled={disabled} {...props}>
      {leftIcon && <span className="text-base">{leftIcon}</span>}
      <span>{children}</span>
      {rightIcon && <span className="text-base">{rightIcon}</span>}
    </button>
  );
};

/**
 * Icon button (square button with only an icon)
 */
interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  icon: React.ReactNode;
  size?: ButtonSize | 'xs';
  variant?: ButtonVariant;
  tooltip?: string;
}

const iconSizeClasses: Record<string, string> = {
  xs: 'p-1.5',
  sm: 'p-2',
  md: 'p-2.5',
  lg: 'p-3',
};

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = 'md',
  variant = 'ghost',
  tooltip,
  className = '',
  ...props
}) => {
  const baseClasses = [
    'rounded transition-all duration-150',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'hover:scale-105 active:scale-95',
    variantClasses[variant],
    iconSizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const button = (
    <button className={baseClasses} {...props}>
      <span className="text-base">{icon}</span>
    </button>
  );

  if (tooltip) {
    return (
      <div className="relative group inline-block">
        {button}
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {tooltip}
        </span>
      </div>
    );
  }

  return button;
};
