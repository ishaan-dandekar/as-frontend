import api from '@/lib/axios';
import { Notification, APIResponse } from '@/types';

type BackendNotification = {
    id: string;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    related_id?: string | null;
    created_at: string;
};

function mapNotificationType(type: string): Notification['type'] {
    switch (type) {
        case 'JOIN_REQUEST':
            return 'JOIN_REQUEST';
        case 'JOIN_APPROVED':
            return 'REQUEST_ACCEPTED';
        case 'JOIN_REJECTED':
            return 'REQUEST_REJECTED';
        case 'PROJECT_UPDATE':
            return 'PROJECT_UPDATE';
        default:
            return 'PROJECT_UPDATE';
    }
}

function mapNotification(notification: BackendNotification): Notification {
    return {
        id: notification.id,
        userId: '',
        type: mapNotificationType(notification.type),
        title: notification.title,
        message: notification.message,
        isRead: notification.is_read,
        relatedId: notification.related_id || undefined,
        createdAt: notification.created_at,
    };
}

export const notificationApi = {
    getNotifications: async (): Promise<APIResponse<Notification[]>> => {
        const response = await api.get('/notifications/');
        const items = Array.isArray(response.data?.data)
            ? (response.data.data as BackendNotification[]).map(mapNotification)
            : [];

        return {
            success: !!response.data?.success,
            message: response.data?.message,
            data: items,
        };
    },
    markAsRead: async (id: string): Promise<APIResponse<void>> => {
        const response = await api.patch(`/notifications/${id}/read`);
        return response.data;
    },
    markAllAsRead: async (): Promise<APIResponse<void>> => {
        const response = await api.post('/notifications/read-all');
        return response.data;
    },
};
