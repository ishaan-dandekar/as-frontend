'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { ProfileMenu } from '@/components/layout/ProfileMenu';

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
        <nav className="fixed top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-sm font-bold text-white">
                        AS
                    </span>
                    <Link href="/" className="font-display text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
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
                                    'text-sm font-medium transition-colors',
                                    isActive ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900',
                                ].join(' ')}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </div>

                <div className="flex items-center gap-4">
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
                <div className="border-t border-slate-200 bg-white/95 px-4 py-4 md:hidden">
                    <div className="flex flex-col gap-1">
                        {links.map((link) => {
                            const isActive = isActiveLink(link.href);
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={[
                                        'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-slate-100 text-slate-900'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
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
