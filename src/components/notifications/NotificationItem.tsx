'use client';

import { Notification } from '@/types';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils';
import {
    UserPlus,
    CheckCircle2,
    XCircle,
    Bell,
    MessageSquare
} from 'lucide-react';

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead?: (id: string) => void;
}

const icons = {
    JOIN_REQUEST: MessageSquare,
    REQUEST_ACCEPTED: CheckCircle2,
    REQUEST_REJECTED: XCircle,
    NEW_FOLLOWER: UserPlus,
    PROJECT_UPDATE: Bell,
};

const colors = {
    JOIN_REQUEST: 'text-blue-500 bg-blue-50',
    REQUEST_ACCEPTED: 'text-green-500 bg-green-50',
    REQUEST_REJECTED: 'text-red-500 bg-red-50',
    NEW_FOLLOWER: 'text-purple-500 bg-purple-50',
    PROJECT_UPDATE: 'text-amber-500 bg-amber-50',
};

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
    const Icon = icons[notification.type] || Bell;
    const colorClass = colors[notification.type] || 'text-slate-500 bg-slate-50';

    return (
        <div
            className={cn(
                "flex gap-4 p-4 transition-colors hover:bg-slate-50",
                !notification.isRead && "bg-indigo-50/30"
            )}
            onClick={() => !notification.isRead && onMarkAsRead?.(notification.id)}
        >
            <div className={cn("mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", colorClass)}>
                <Icon className="h-4 w-4" />
            </div>

            <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                    <p className={cn("text-sm font-medium", !notification.isRead ? "text-slate-900" : "text-slate-600")}>
                        {notification.title}
                    </p>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                        {formatRelativeTime(notification.createdAt)}
                    </span>
                </div>
                <p className="text-sm text-slate-500 line-clamp-2">
                    {notification.message}
                </p>
            </div>

            {!notification.isRead && (
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
            )}
        </div>
    );
}
