'use client';

import Link from 'next/link';
import { Home, LogOut } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';

export function DashboardNavbar() {
    const { logout } = useAuth();
    const { profile } = useUser();

    return (
        <header className="glass-panel sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/70 px-4 shadow-sm sm:px-6 lg:px-8">
            <div className="flex items-center">
                <p className="font-display text-lg font-bold text-slate-900">APSIT Student Sphere</p>
            </div>

            <div className="flex items-center gap-4">
                <Link href="/">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <Home className="h-4 w-4" />
                        Landing
                    </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={logout} className="gap-2">
                    <LogOut className="h-4 w-4" />
                    Log out
                </Button>

                <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                    <div className="hidden text-right lg:block">
                        <p className="text-sm font-medium text-slate-900">{profile?.name || 'User'}</p>
                        <p className="text-xs text-slate-500">{profile?.email || ''}</p>
                    </div>
                    <Avatar
                        src={profile?.avatarUrl}
                        fallback={profile?.name?.charAt(0) || 'U'}
                        className="h-9 w-9 border border-slate-200 shadow-sm"
                    />
                </div>
            </div>
        </header>
    );
}
