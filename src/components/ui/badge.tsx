import { clsx } from 'clsx';

type BadgeVariant = 'green' | 'indigo' | 'purple' | 'amber' | 'gray' | 'red';

const variantStyles: Record<BadgeVariant, string> = {
  green:  'bg-emerald-50 text-emerald-700',
  indigo: 'bg-indigo-50 text-indigo-700',
  purple: 'bg-purple-50 text-purple-700',
  amber:  'bg-amber-50 text-amber-700',
  gray:   'bg-gray-100 text-gray-600',
  red:    'bg-red-50 text-red-700',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'gray', children, className }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      variantStyles[variant],
      className
    )}>
      {children}
    </span>
  );
}
