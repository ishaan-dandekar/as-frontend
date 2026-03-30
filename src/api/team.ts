import api from '@/lib/axios';
import { Team, JoinRequest, APIResponse } from '@/types';

export const teamApi = {
    getMyTeams: async (): Promise<APIResponse<Team[]>> => {
        const response = await api.get('/teams');
        return response.data;
    },
    getTeam: async (id: string): Promise<APIResponse<Team>> => {
        const response = await api.get(`/teams/${id}`);
        return response.data;
    },
    sendJoinRequest: async (projectId: string, requestData: Record<string, unknown>): Promise<APIResponse<JoinRequest>> => {
        const response = await api.post(`/projects/${projectId}/join`, requestData);
        return response.data;
    },
    getTeamByProjectId: async (projectId: string): Promise<APIResponse<Team>> => {
        const response = await api.get(`/projects/${projectId}/team`);
        return response.data;
    },
    getPendingRequests: async (projectId: string): Promise<APIResponse<JoinRequest[]>> => {
        const response = await api.get(`/projects/${projectId}/requests`);
        return response.data;
    },
    updateRequestStatus: async (requestId: string, status: 'ACCEPTED' | 'REJECTED'): Promise<APIResponse<void>> => {
        const response = await api.patch(`/requests/${requestId}`, { status });
        return response.data;
    },
};
