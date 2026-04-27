'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, error, helperText, icon, ...props }, ref) => {
        const [showPassword, setShowPassword] = React.useState(false);
        const isPassword = type === 'password';
        const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

        return (
            <div className="w-full space-y-1.5">
                {label && (
                    <label className="text-app text-sm font-medium">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="text-app-muted absolute left-3 top-1/2 -translate-y-1/2">
                            {icon}
                        </div>
                    )}
                    <input
                        type={inputType}
                        className={cn(
                            'border-app bg-surface text-app placeholder:text-[color:var(--foreground-muted)] ring-offset-[color:var(--surface)] flex h-11 w-full rounded-xl border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)] disabled:cursor-not-allowed disabled:opacity-50',
                            error && 'border-red-500 focus-visible:ring-red-500',
                            icon && 'pl-10',
                            isPassword && 'pr-10',
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                    {isPassword && (
                        <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="text-app-muted hover:text-app absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    )}
                </div>
                {error && (
                    <p className="text-xs text-red-500">{error}</p>
                )}
                {helperText && !error && (
                    <p className="text-app-muted text-xs">{helperText}</p>
                )}
            </div>
        );
    }
);
Input.displayName = 'Input';

export { Input };
