'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export function Navbar() {
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);

    React.useEffect(() => {
        const syncAuthState = () => {
            setIsAuthenticated(!!localStorage.getItem('token'));
        };

        syncAuthState();
        window.addEventListener('storage', syncAuthState);

        return () => {
            window.removeEventListener('storage', syncAuthState);
        };
    }, []);

    return (
        <nav className="fixed top-0 z-50 w-full border-b border-slate-200 bg-white/95">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-sm font-bold text-white">
                        AS
                    </span>
                    <Link href="/" className="font-display text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                        APSIT Student Sphere
                    </Link>
                </div>

                <div className="hidden md:flex md:items-center md:gap-8">
                    <Link href="/discover" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Discover
                    </Link>
                    <Link href="/projects?discover=popular" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Browse Projects
                    </Link>
                    <Link href="/events" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Events
                    </Link>
                    <Link href="/teams" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
                        Teams
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    {isAuthenticated ? (
                        <Link href="/profile">
                            <Button size="sm" className="shadow-md shadow-teal-900/15">
                                Profile
                            </Button>
                        </Link>
                    ) : (
                        <>
                            <Link href="/login">
                                <Button variant="ghost" size="sm">
                                    Log in
                                </Button>
                            </Link>
                            <Link href="/register">
                                <Button size="sm" className="shadow-md shadow-teal-900/15">
                                    Sign up
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
