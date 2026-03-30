import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
    ({ className, variant = 'default', ...props }, ref) => {
        const variants = {
            default: 'bg-indigo-100 text-indigo-700',
            secondary: 'bg-slate-100 text-slate-700',
            outline: 'border border-slate-200 text-slate-600',
            success: 'bg-emerald-100 text-emerald-700',
            warning: 'bg-amber-100 text-amber-700',
            danger: 'bg-red-100 text-red-700',
        };

        return (
            <div
                ref={ref}
                className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                    variants[variant],
                    className
                )}
                {...props}
            />
        );
    }
);
Badge.displayName = 'Badge';

export { Badge };
