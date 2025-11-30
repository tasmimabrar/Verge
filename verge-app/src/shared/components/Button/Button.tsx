import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  /** Full width button */
  fullWidth?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Icon before text */
  iconBefore?: ReactNode;
  /** Icon after text */
  iconAfter?: ReactNode;
  /** Children */
  children: ReactNode;
}

export const Button = ({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  iconBefore,
  iconAfter,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) => {
  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    loading && styles.loading,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {iconBefore && <span>{iconBefore}</span>}
      {children}
      {iconAfter && <span>{iconAfter}</span>}
    </button>
  );
};
