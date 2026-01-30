/**
 * Reusable Input components
 */

import React from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const inputClasses = [
    'px-3 py-2 rounded-lg border text-sm transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    error
      ? 'border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-blue-500',
    'disabled:bg-gray-100 disabled:cursor-not-allowed',
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input className={inputClasses} {...props} />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const textareaClasses = [
    'px-3 py-2 rounded-lg border text-sm font-mono transition-colors resize-vertical',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    error
      ? 'border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-blue-500',
    'disabled:bg-gray-100 disabled:cursor-not-allowed',
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <textarea className={textareaClasses} {...props} />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  options: { value: string; label: string; disabled?: boolean }[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  className = '',
  options,
  ...props
}) => {
  const selectClasses = [
    'px-3 py-2 rounded-lg border text-sm bg-white transition-colors cursor-pointer',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    error
      ? 'border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-blue-500',
    'disabled:bg-gray-100 disabled:cursor-not-allowed',
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <select className={selectClasses} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
    </div>
  );
};
