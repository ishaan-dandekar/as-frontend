import * as React from 'react';
import { cn } from '@/lib/utils';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    error?: boolean;
    showCount?: boolean;
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, error, showCount, maxLength, value, onChange, ...props }, ref) => {
        const charCount = typeof value === 'string' ? value.length : 0;

        return (
            <div className="relative w-full">
                <textarea
                    className={cn(
                        'border-app bg-surface text-app placeholder:text-[color:var(--foreground-muted)] ring-offset-[color:var(--surface)] flex min-h-[120px] w-full rounded-xl border px-3 py-2.5 text-sm leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all',
                        error
                            ? 'border-rose-500 focus-visible:ring-rose-500'
                            : 'focus-visible:ring-[color:var(--brand)]',
                        className
                    )}
                    ref={ref}
                    maxLength={maxLength}
                    value={value}
                    onChange={onChange}
                    {...props}
                />
                {showCount && maxLength && (
                    <div className={cn(
                        'text-app-muted absolute bottom-2.5 right-2.5 rounded bg-surface-strong/90 px-1.5 py-0.5 text-[10px] font-medium backdrop-blur-sm',
                        charCount >= maxLength && 'text-rose-600'
                    )}>
                        {charCount}/{maxLength}
                    </div>
                )}
            </div>
        );
    }
);
Textarea.displayName = 'Textarea';

export { Textarea };
