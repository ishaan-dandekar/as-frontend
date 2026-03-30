'use client';

import * as React from 'react';
import { X, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'loading';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type: ToastType) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = React.useState<Toast[]>([]);

    const showToast = React.useCallback((message: string, type: ToastType) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        if (type !== 'loading') {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 5000);
        }
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={cn(
                            "pointer-events-auto flex items-center justify-between gap-4 rounded-xl px-4 py-3 shadow-2xl animate-in slide-in-from-right duration-300",
                            toast.type === 'success' && "bg-emerald-600 text-white",
                            toast.type === 'error' && "bg-rose-600 text-white",
                            toast.type === 'info' && "bg-indigo-600 text-white",
                            toast.type === 'loading' && "bg-slate-900 text-white"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            {toast.type === 'success' && <CheckCircle className="h-5 w-5 shrink-0" />}
                            {toast.type === 'error' && <AlertCircle className="h-5 w-5 shrink-0" />}
                            {toast.type === 'info' && <Info className="h-5 w-5 shrink-0" />}
                            {toast.type === 'loading' && <Loader2 className="h-5 w-5 shrink-0 animate-spin" />}
                            <p className="text-sm font-medium">{toast.message}</p>
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="rounded-full p-1 hover:bg-white/20 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = React.useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
