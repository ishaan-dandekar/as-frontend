'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
    return (
        <nav className={cn("flex", className)} aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
                <li>
                    <Link
                        href="/dashboard"
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <Home className="h-4 w-4" />
                        <span className="sr-only">Home</span>
                    </Link>
                </li>
                {items.map((item) => (
                    <li key={item.label} className="flex items-center space-x-2">
                        <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                        {item.href ? (
                            <Link
                                href={item.href}
                                className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span className="text-sm font-bold text-slate-900 truncate max-w-[150px] sm:max-w-[300px]">
                                {item.label}
                            </span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}
