import React from 'react';

const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  ...props
}) => {
  
  const baseClasses = 'inline-flex items-center cursor-pointer justify-center font-semibold rounded-[8px] transition-all duration-200 focus:outline-none disabled:opacity-50 ';

  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover',
    secondary: 'bg-surface text-text-primary hover:bg-surface-hover hover:border-text-secondary/20',
    outline: 'bg-transparent text-text-primary border border-border hover:bg-surface',
    ghost: 'bg-transparent text-text-primary hover:bg-surface/50',
    link: 'bg-transparent text-text-primary hover:underline',
    danger: 'bg-danger text-white hover:opacity-90 ',
  };

  // Modern size paddings
  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3.5 py-2.5 text-sm',
    lg: 'px-4.5 py-3.5 text-base',
  };

  // Resolve Tailwind classes dynamically
  const sizeClass = sizes[size] || sizes.md;
  const variantClass = variants[variant] || variants.primary;
  const classes = `${baseClasses} ${sizeClass} ${variantClass} ${className}`;

  return (
    <button
      type={type}
      className={classes}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;