'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
    Compass,
    LayoutDashboard,
    Search,
    Users,
    Calendar,
    User,
    Settings,
    Rocket,
    Trophy
} from 'lucide-react';
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

export function Sidebar() {
    const pathname = usePathname();
    const { profile } = useUser();

    const navigation = baseNavigation.filter(item =>
        !item.role || item.role === profile?.role
    );

    return (
        <div className="glass-panel hidden border-r border-slate-200/70 md:flex md:w-72 md:flex-col">
            <div className="flex h-16 shrink-0 items-center px-6">
                <Link href="/" className="font-display text-xl font-bold text-slate-900">
                    APSIT Student Sphere
                </Link>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
                <div className="mb-6">
                    <Link href="/dashboard" className="flex items-center gap-2 px-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-orange-500 text-white shadow-lg shadow-orange-200/60">
                            <Rocket className="h-5 w-5" />
                        </div>
                        <span className="font-display text-xl font-bold tracking-tight text-slate-900">
                            APSIT Student Sphere
                        </span>
                    </Link>
                </div>

                <nav className="relative flex-1 space-y-1.5">
                    {navigation.map((item) => {
                        const itemPath = item.href.split('?')[0];
                        const isActive = pathname === itemPath;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
                                    isActive
                                        ? 'text-teal-800'
                                        : 'text-slate-600 hover:bg-white hover:text-slate-900'
                                )}
                            >
                                {isActive && (
                                    <motion.span
                                        layoutId="sidebar-active"
                                        className="absolute inset-0 z-0 rounded-lg bg-teal-100/85"
                                        initial={false}
                                        transition={{
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 30
                                        }}
                                    />
                                )}
                                <item.icon
                                    className={cn(
                                        'h-5 w-5 shrink-0 relative z-10',
                                        isActive ? 'text-teal-700' : 'text-slate-400 group-hover:text-slate-600'
                                    )}
                                />
                                <span className="relative z-10">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto pb-4 space-y-4">
                    <Link
                        href="/settings"
                        className={cn(
                            'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
                            pathname === '/settings'
                                ? 'bg-teal-100/85 text-teal-800'
                                : 'text-slate-600 hover:bg-white hover:text-slate-900'
                        )}
                    >
                        <Settings className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-slate-600" />
                        Settings
                    </Link>

                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700 ring-2 ring-white">
                            {profile?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex min-w-0 flex-col">
                            <span className="text-sm font-semibold text-slate-900 truncate">
                                {profile?.name || 'Loading...'}
                            </span>
                            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                                {profile?.role || 'User'} Account
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
