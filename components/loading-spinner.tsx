interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
}

export default function LoadingSpinner({ 
  className = "",
  size = 'lg',
  variant = 'light'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-16 w-16', 
    lg: 'h-32 w-32'
  };

  const variantClasses = {
    light: 'border-white',
    dark: 'border-foreground'
  };

  return (
    <div className="flex items-center justify-center">
      <div 
        className={`animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      />
    </div>
  );
}