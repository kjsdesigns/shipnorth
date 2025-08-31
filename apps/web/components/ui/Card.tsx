import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ 
  children, 
  className = '', 
  padding = 'md',
  hover = false 
}: CardProps) {
  const baseStyles = 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700';
  
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverStyles = hover 
    ? 'hover:shadow-md transition-shadow duration-200' 
    : '';

  const combinedClassName = `
    ${baseStyles}
    ${paddingStyles[padding]}
    ${hoverStyles}
    ${className}
  `.trim();

  return (
    <div className={combinedClassName}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`mb-4 ${className}`.trim()}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`mt-4 ${className}`.trim()}>
      {children}
    </div>
  );
}

// Export compound component
Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;