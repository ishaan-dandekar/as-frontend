'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode, useEffect, useState } from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import { setAvatarSyncVersionNow } from '@/lib/avatarUrl';

export default function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000,
                        retry: 1,
                    },
                },
            })
    );

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Force a fresh Google avatar request on each full page load.
        setAvatarSyncVersionNow();
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <ToastProvider>
                {children}
            </ToastProvider>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}
