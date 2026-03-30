import api from '@/lib/axios';
import { Notification, APIResponse } from '@/types';

export const notificationApi = {
    getNotifications: async (): Promise<APIResponse<Notification[]>> => {
        const response = await api.get('/notifications/');
        return response.data;
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
