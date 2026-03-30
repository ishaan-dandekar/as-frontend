'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/api/notification';

export function useNotifications() {
    const queryClient = useQueryClient();

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => notificationApi.getNotifications().then((res) => res.data),
        refetchInterval: 30000, // Poll every 30 seconds
    });

    const markAsReadMutation = useMutation({
        mutationFn: (id: string) => notificationApi.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: () => notificationApi.markAllAsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return {
        notifications,
        isLoading,
        unreadCount,
        markAsRead: markAsReadMutation.mutateAsync,
        markAllAsRead: markAllAsReadMutation.mutateAsync,
    };
}
