'use client';

import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { CheckCheck } from 'lucide-react';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default function NotificationsPage() {
    const { notifications, isLoading, markAllAsRead, markAsRead, unreadCount } = useNotifications();

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <Breadcrumbs items={[{ label: 'Notifications' }]} />
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
                    <p className="text-slate-500">Stay updated with your projects and team activities.</p>
                </div>
                {unreadCount > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => markAllAsRead()}
                    >
                        <CheckCheck className="h-4 w-4" />
                        Mark all as read
                    </Button>
                )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">All caught up!</h3>
                        <p className="text-slate-500">You don&apos;t have any notifications at the moment.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {notifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onMarkAsRead={markAsRead}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
