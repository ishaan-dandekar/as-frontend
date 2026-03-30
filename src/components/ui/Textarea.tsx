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
                        'flex min-h-[80px] w-full rounded-md border bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all',
                        error
                            ? 'border-rose-500 focus-visible:ring-rose-500'
                            : 'border-slate-200 focus-visible:ring-indigo-500',
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
                        "absolute bottom-2 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100/80 backdrop-blur-sm",
                        charCount >= maxLength ? "text-rose-600" : "text-slate-400"
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
