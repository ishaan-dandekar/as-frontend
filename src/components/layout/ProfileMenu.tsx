'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, LogOut, Settings } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { useClickOutside } from '@/hooks/utils';

type ProfileMenuProps = {
    name?: string;
    email?: string;
    avatarUrl?: string;
    onLogout: () => void;
    settingsHref?: string;
};

export function ProfileMenu({
    name,
    email,
    avatarUrl,
    onLogout,
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
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1.5 text-left shadow-sm transition-colors hover:bg-slate-50"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                aria-label="Open profile menu"
            >
                <Avatar
                    src={avatarUrl}
                    fallback={name?.charAt(0) || 'U'}
                    className="h-8 w-8 border border-slate-200"
                />
                <div className="hidden min-w-0 text-left lg:block">
                    <p className="truncate text-sm font-medium text-slate-900">{name || 'User'}</p>
                    <p className="truncate text-xs text-slate-500">{email || ''}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-500" />
            </button>

            {isOpen && (
                <div className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg ring-1 ring-black/5">
                    <Link
                        href={settingsHref}
                        onClick={() => setIsOpen(false)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
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