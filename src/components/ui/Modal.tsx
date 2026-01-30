/**
 * Base Modal component with backdrop and close behavior
 */

import React, { useEffect, useCallback } from 'react';
import { MODAL_CONFIG } from '../../config';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  maxWidth?: string;
  maxHeight?: string;
  width?: string;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  size = 'medium',
  maxWidth,
  maxHeight = MODAL_CONFIG.MAX_HEIGHT,
  width = MODAL_CONFIG.WIDTH,
  closeOnBackdropClick = true,
  closeOnEscape = true,
}) => {
  // Handle Escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape' && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose, closeOnEscape]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalMaxWidth = maxWidth || MODAL_CONFIG.MAX_WIDTH[size.toUpperCase() as keyof typeof MODAL_CONFIG.MAX_WIDTH];

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4"
      onClick={closeOnBackdropClick ? onClose : undefined}
      style={{ zIndex: MODAL_CONFIG.Z_INDEX }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl overflow-hidden flex flex-col shadow-2xl"
        style={{
          width,
          maxWidth: modalMaxWidth,
          maxHeight,
        }}
      >
        {children}
      </div>
    </div>
  );
};

/**
 * Modal Header component
 */
interface ModalHeaderProps {
  title: string;
  onClose: () => void;
  subtitle?: string;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ title, subtitle, onClose }) => (
  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
    <div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    <button
      onClick={onClose}
      className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-200 rounded-lg"
      aria-label="Close"
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
);

/**
 * Modal Body component
 */
interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
  scrollable?: boolean;
}

export const ModalBody: React.FC<ModalBodyProps> = ({ children, className = '', scrollable = true }) => (
  <div className={`p-6 ${scrollable ? 'overflow-auto flex-1' : ''} ${className}`.trim()}>
    {children}
  </div>
);

/**
 * Modal Footer component
 */
interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right' | 'space-between';
}

export const ModalFooter: React.FC<ModalFooterProps> = ({
  children,
  className = '',
  align = 'right',
}) => {
  const alignClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    'space-between': 'justify-between',
  }[align];

  return (
    <div className={`px-6 py-4 border-t border-gray-200 flex gap-3 ${alignClass} ${className}`.trim()}>
      {children}
    </div>
  );
};
