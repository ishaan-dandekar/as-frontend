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
        <nav className="fixed top-0 z-50 w-full border-b border-nav bg-nav shadow-sm shadow-slate-900/10 backdrop-blur-xl">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-500 text-sm font-bold text-white shadow-lg shadow-teal-900/20">
                        AS
                    </span>
                    <Link href="/" className="font-display text-xl font-bold tracking-tight text-app sm:text-2xl">
                        APSIT Student Sphere
                    </Link>
                </div>

                <div className="hidden md:flex md:items-center md:gap-6">
                    {links.map((link) => {
                        const isActive = isActiveLink(link.href);

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={[
                                    'rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-colors',
                                    isActive
                                        ? 'bg-teal-100/90 text-teal-900 shadow-sm shadow-teal-900/10 dark:bg-teal-500/20 dark:text-teal-200'
                                        : 'text-app-soft hover:bg-slate-100/80 hover:text-app dark:hover:bg-slate-800/60',
                                ].join(' ')}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </div>

                <div className="flex items-center gap-4">
                    <ThemeToggle compact />

                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
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
                <div className="border-t border-nav bg-nav px-4 py-4 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.75)] md:hidden">
                    <div className="flex flex-col gap-1">
                        <div className="mb-2 flex justify-end">
                            <ThemeToggle />
                        </div>

                        {links.map((link) => {
                            const isActive = isActiveLink(link.href);
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={[
                                        'rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                                        isActive
                                            ? 'bg-teal-100 text-teal-900 dark:bg-teal-500/20 dark:text-teal-200'
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
