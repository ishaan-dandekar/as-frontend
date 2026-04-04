'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatedTransitions } from '@/components/ui/AnimatedTransitions';
import { Spinner } from '@/components/ui/Spinner';
import { useUser } from '@/hooks/useUser';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { profile, isLoading } = useUser();

    useEffect(() => {
        if (!isLoading && !profile) {
            router.replace('/');
        }
    }, [isLoading, profile, router]);

    if (isLoading || !profile) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <main className="bg-transparent">
            <div className="min-h-[calc(100vh-4rem)] p-4 md:p-6 lg:p-8">
                <AnimatedTransitions>
                    {children}
                </AnimatedTransitions>
            </div>
        </main>
    );
}
