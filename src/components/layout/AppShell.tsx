'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';

export default function AppShell({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const [hasToken, setHasToken] = useState(false);
    const hideNavbarRoutes = new Set(['/', '/auth/callback']);
    const protectedRoutePrefixes = [
        '/dashboard',
        '/discover',
        '/projects',
        '/teams',
        '/events',
        '/notifications',
        '/profile',
        '/settings',
        '/my-projects',
    ];

    const isProtectedRoute = protectedRoutePrefixes.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

    useEffect(() => {
        setHasToken(!!localStorage.getItem('token'));
    }, [pathname]);

    const showNavbar = !hideNavbarRoutes.has(pathname) && !(isProtectedRoute && !hasToken);

    return (
        <>
            {showNavbar && <Navbar />}
            <div className={showNavbar ? 'pt-16' : ''}>{children}</div>
        </>
    );
}