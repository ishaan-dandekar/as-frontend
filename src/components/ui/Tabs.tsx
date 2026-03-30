'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
    defaultValue: string;
    onValueChange?: (value: string) => void;
}

type TabsInjectedProps = {
    activeValue?: string;
    onValueChange?: (value: string) => void;
};

export function Tabs({ defaultValue, onValueChange, className, children, ...props }: TabsProps) {
    const [activeValue, setActiveValue] = React.useState(defaultValue);

    const handleValueChange = (newValue: string) => {
        setActiveValue(newValue);
        onValueChange?.(newValue);
    };

    return (
        <div className={cn("space-y-2", className)} {...props}>
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child as React.ReactElement<TabsInjectedProps>, {
                        activeValue,
                        onValueChange: handleValueChange
                    });
                }
                return child;
            })}
        </div>
    );
}

type TabsListProps = React.HTMLAttributes<HTMLDivElement> & TabsInjectedProps;

export function TabsList({ className, children, activeValue, onValueChange, ...props }: TabsListProps) {
    return (
        <div
            className={cn(
                "inline-flex h-10 items-center justify-center rounded-lg bg-slate-100 p-1 text-slate-500",
                className
            )}
            {...props}
        >
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child as React.ReactElement<TabsTriggerProps>, {
                        activeValue,
                        onValueChange,
                    });
                }
                return child;
            })}
        </div>
    );
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    value: string;
    activeValue?: string;
    onValueChange?: (value: string) => void;
}

export function TabsTrigger({ value, className, children, activeValue, onValueChange, ...props }: TabsTriggerProps) {
    const isActive = activeValue === value;

    return (
        <button
            onClick={() => onValueChange?.(value)}
            data-state={isActive ? 'active' : 'inactive'}
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                isActive
                    ? "bg-white text-slate-950 shadow-sm"
                    : "hover:bg-slate-50 hover:text-slate-900",
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}

type TabsContentProps = {
    value: string;
    className?: string;
    children: React.ReactNode;
} & TabsInjectedProps;

export function TabsContent({ value, className, children, activeValue, ...props }: TabsContentProps) {

    if (activeValue !== value) return null;

    return (
        <div
            className={cn(
                "mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
