'use client';

import { useState, useRef } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { NotificationItem } from './NotificationItem';
import { useNotifications } from '@/hooks/useNotifications';
import { useClickOutside } from '@/hooks/utils';
import Link from 'next/link';

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useClickOutside(dropdownRef, () => setIsOpen(false));

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className="relative"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </Button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-xl border border-slate-200 bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="flex items-center justify-between border-b border-slate-100 p-4">
                        <h3 className="font-semibold text-slate-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllAsRead()}
                                className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-sm text-slate-500">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {notifications.slice(0, 5).map((notification) => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onMarkAsRead={markAsRead}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="border-t border-slate-100 p-3 text-center">
                        <Link
                            href="/notifications"
                            className="text-xs font-semibold text-slate-600 hover:text-indigo-600"
                            onClick={() => setIsOpen(false)}
                        >
                            View all notifications
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
