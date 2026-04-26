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
    const showEducationalBackdrop = !hideNavbarRoutes.has(pathname);

    return (
        <>
            {showNavbar && <Navbar />}
            <div className={`${showNavbar ? 'pt-16 ' : ''}relative`}
            >
                {showEducationalBackdrop && (
                    <div className="pointer-events-none absolute inset-0 -z-10">
                        <div className="absolute inset-0 bg-ambient opacity-82" />
                        <div className="absolute inset-0 bg-grid opacity-44" />
                        <div className="absolute inset-0 bg-edu opacity-26 bg-parallax" />
                        <div className="absolute inset-0 bg-edu-2 opacity-19 bg-parallax mix-blend-multiply" />
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-white/18" />
                        <div className="absolute left-[6%] top-[14%] rotate-[-6deg] rounded-full border border-emerald-200/40 bg-white/55 px-3 py-1.5 text-[9px] font-semibold text-emerald-700/75 shadow-soft animate-float-slower">
                            a^2 + b^2 = c^2
                        </div>
                        <div className="absolute right-[10%] top-[18%] rotate-[5deg] rounded-full border border-slate-200/50 bg-white/55 px-3 py-1.5 text-[9px] font-semibold text-slate-700/75 shadow-soft animate-float-slower">
                            E = mc^2
                        </div>
                        <div className="absolute left-[12%] bottom-[16%] rotate-[-4deg] rounded-full border border-amber-200/50 bg-white/55 px-3 py-1.5 text-[9px] font-semibold text-amber-700/75 shadow-soft animate-float-slower">
                            integral_0^1 x^2 dx = 1/3
                        </div>
                        <div className="absolute right-[14%] bottom-[14%] rotate-[4deg] rounded-full border border-emerald-200/40 bg-white/55 px-3 py-1.5 text-[9px] font-semibold text-emerald-700/75 shadow-soft animate-float-slower">
                            {'sum_{i=1}^n i = n(n+1)/2'}
                        </div>
                    </div>
                )}
                {children}
            </div>
        </>
    );
}