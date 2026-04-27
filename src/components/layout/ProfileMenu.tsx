'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, LogOut, Settings, UserCircle2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { useClickOutside } from '@/hooks/utils';

type ProfileMenuProps = {
    name?: string;
    email?: string;
    avatarUrl?: string;
    onLogout: () => void;
    profileHref?: string;
    settingsHref?: string;
};

export function ProfileMenu({
    name,
    email,
    avatarUrl,
    onLogout,
    profileHref = '/profile',
    settingsHref = '/settings',
}: ProfileMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useClickOutside(dropdownRef, () => setIsOpen(false));

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border border-app bg-surface px-2 py-1.5 text-left shadow-sm transition-colors hover:bg-surface-strong"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                aria-label="Open profile menu"
            >
                <Avatar
                    src={avatarUrl}
                    fallback={name?.charAt(0) || 'U'}
                    className="h-8 w-8 border border-app"
                />
                <div className="hidden min-w-0 text-left lg:block">
                    <p className="text-app truncate text-sm font-medium">{name || 'User'}</p>
                    <p className="text-app-muted truncate text-xs">{email || ''}</p>
                </div>
                <ChevronDown className="text-app-muted h-4 w-4" />
            </button>

            {isOpen && (
                <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-2xl border border-app bg-surface p-1.5 shadow-lg ring-1 ring-black/5">
                    <Link
                        href={profileHref}
                        onClick={() => setIsOpen(false)}
                        className="text-app-soft hover:text-app flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-100/80 dark:hover:bg-slate-800/60"
                    >
                        <UserCircle2 className="h-4 w-4" />
                        My Profile
                    </Link>

                    <Link
                        href={settingsHref}
                        onClick={() => setIsOpen(false)}
                        className="text-app-soft hover:text-app flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-100/80 dark:hover:bg-slate-800/60"
                    >
                        <Settings className="h-4 w-4" />
                        Settings
                    </Link>

                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            onLogout();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
}
