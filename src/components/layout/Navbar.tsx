'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { ProfileMenu } from '@/components/layout/ProfileMenu';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export function Navbar() {
    const pathname = usePathname();
    const { isAuthenticated, logout } = useAuth();
    const { profile } = useUser({ enabled: isAuthenticated });
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    const links = [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/discover', label: 'Discover' },
        { href: '/projects?discover=popular', label: 'Projects' },
        { href: '/teams', label: 'Teams' },
        { href: '/events', label: 'Events' },
    ];

    React.useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    React.useEffect(() => {
        document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileMenuOpen]);

    const isActiveLink = (href: string) => {
        const baseHref = href.split('?')[0];
        if (baseHref === '/') return pathname === '/';
        return pathname === baseHref || pathname.startsWith(`${baseHref}/`);
    };

    return (
        <nav className="fixed top-0 z-50 w-full border-b border-nav bg-nav/95 shadow-[0_14px_36px_-26px_rgba(15,23,42,0.55)] backdrop-blur-2xl">
            <div className="container mx-auto flex h-[76px] items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3 sm:gap-4">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-[20px] bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-500 text-sm font-extrabold text-white shadow-[0_18px_34px_-18px_rgba(13,148,136,0.7)] ring-1 ring-white/20">
                        AS
                    </span>
                    <Link href="/" className="min-w-0">
                        <div className="flex flex-col">
                            <span className="brand-wordmark text-app text-[1.75rem] sm:text-[2rem]">
                                <span className="brand-highlight">APSIT</span>{' '}
                                <span className="text-app">Student Sphere</span>
                            </span>
                            <span className="text-app-soft hidden text-[11px] font-semibold tracking-[0.28em] uppercase sm:block">
                                Build. Collaborate. Grow.
                            </span>
                        </div>
                    </Link>
                </div>

                <div className="hidden md:flex md:items-center">
                    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-slate-900/55 p-1.5 shadow-inner shadow-black/10 dark:border-white/5 dark:bg-slate-950/35">
                    {links.map((link) => {
                        const isActive = isActiveLink(link.href);

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={[
                                    'rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200',
                                    isActive
                                        ? 'bg-gradient-to-r from-teal-200 to-emerald-100 text-teal-950 shadow-[0_10px_24px_-16px_rgba(13,148,136,0.95)] dark:from-teal-500/30 dark:to-emerald-500/20 dark:text-teal-100'
                                        : 'text-slate-300/92 hover:bg-white/6 hover:text-white dark:text-slate-300 dark:hover:bg-white/8',
                                ].join(' ')}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-slate-900/50 p-1.5 shadow-inner shadow-black/10 sm:flex dark:border-white/5 dark:bg-slate-950/30">
                        <ThemeToggle compact />
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full border border-white/10 bg-slate-900/50 text-slate-100 hover:bg-slate-800/80 hover:text-white md:hidden"
                        onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                        aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                    >
                        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>

                    {isAuthenticated ? (
                        <ProfileMenu
                            name={profile?.name}
                            email={profile?.email}
                            avatarUrl={profile?.avatarUrl}
                            onLogout={logout}
                            profileHref="/profile"
                        />
                    ) : (
                        <>
                            <Link href="/" className="hidden sm:block">
                                <Button size="sm" className="shadow-md shadow-teal-900/15">
                                    Continue with Google
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {isMobileMenuOpen && (
                <div className="border-t border-white/10 bg-nav/98 px-4 py-4 shadow-[0_18px_32px_-24px_rgba(15,23,42,0.75)] md:hidden">
                    <div className="flex flex-col gap-2">
                        <div className="mb-1 flex justify-end">
                            <ThemeToggle />
                        </div>

                        {links.map((link) => {
                            const isActive = isActiveLink(link.href);
                            return (
                                <Link
                                    key={link.href}
                                href={link.href}
                                className={[
                                        'rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                                        isActive
                                            ? 'bg-gradient-to-r from-teal-200 to-emerald-100 text-teal-950 dark:from-teal-500/25 dark:to-emerald-500/20 dark:text-teal-100'
                                            : 'text-app-soft hover:bg-slate-100/80 hover:text-app dark:hover:bg-slate-800/60',
                                    ].join(' ')}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}

                        {!isAuthenticated && (
                            <div className="mt-3 border-t border-slate-100 pt-3">
                                <Link href="/" className="block">
                                    <Button size="sm" className="w-full">
                                        Continue with Google
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
