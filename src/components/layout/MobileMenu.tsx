'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Compass,
    LayoutDashboard,
    Search,
    Users,
    Calendar,
    User,
    Settings,
    PlusCircle,
    X,
    Menu,
    Trophy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useUser } from '@/hooks/useUser';

const baseNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Discover', href: '/discover', icon: Compass },
    { name: 'Projects', href: '/projects?discover=popular', icon: Search },
    { name: 'My Teams', href: '/teams', icon: Users, role: 'STUDENT' },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Manage Events', href: '/manage-events', icon: Calendar, role: 'DEPARTMENT' },
    { name: 'Create Hackathon', href: '/create-hackathon', icon: Trophy, role: 'DEPARTMENT' },
    { name: 'Profile', href: '/profile', icon: User },
];

export function MobileMenu() {
    const [isOpen, setIsOpen] = React.useState(false);
    const pathname = usePathname();
    const { profile } = useUser();

    const navigation = baseNavigation.filter(item =>
        !item.role || item.role === profile?.role
    );

    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen]);

    // Close menu when pathname changes
    React.useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    return (
        <div className="md:hidden">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(true)}
                className="h-10 w-10 p-0 rounded-full"
            >
                <Menu className="h-6 w-6 text-slate-600" />
                <span className="sr-only">Open menu</span>
            </Button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex flex-col bg-slate-50/95 backdrop-blur animate-in slide-in-from-bottom duration-300">
                    <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6">
                        <span className="font-display text-xl font-bold text-slate-900">APSIT Student Sphere</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsOpen(false)}
                            className="h-10 w-10 p-0 rounded-full"
                        >
                            <X className="h-6 w-6 text-slate-600" />
                            <span className="sr-only">Close menu</span>
                        </Button>
                    </div>

                    <div className="flex-1 space-y-8 overflow-y-auto px-6 py-8">
                        <div>
                            <Link href="/projects/create">
                                <button className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-teal-700 to-orange-600 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-teal-900/20 transition-all active:scale-95">
                                    <PlusCircle className="h-6 w-6" />
                                    New Project
                                </button>
                            </Link>
                        </div>

                        <nav className="space-y-2">
                            {navigation.map((item) => {
                                const itemPath = item.href.split('?')[0];
                                const isActive = pathname === itemPath;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            'flex items-center gap-4 rounded-xl px-4 py-4 text-lg font-semibold transition-all active:bg-white',
                                            isActive
                                                ? 'bg-teal-100 text-teal-800'
                                                : 'text-slate-600 hover:text-slate-900'
                                        )}
                                    >
                                        <item.icon
                                            className={cn(
                                                'h-6 w-6',
                                                isActive ? 'text-teal-700' : 'text-slate-400'
                                            )}
                                        />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="border-t border-slate-200 pt-8">
                            <Link
                                href="/settings"
                                className={cn(
                                    'flex items-center gap-4 rounded-xl px-4 py-4 text-lg font-semibold transition-all active:bg-white',
                                    pathname === '/settings'
                                        ? 'bg-teal-100 text-teal-800'
                                        : 'text-slate-600 hover:text-slate-900'
                                )}
                            >
                                <Settings className="h-6 w-6 text-slate-400" />
                                Settings
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
