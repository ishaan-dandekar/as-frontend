import api from '@/lib/axios';
import { Team, JoinRequest, APIResponse } from '@/types';
import { projectApi } from '@/api/project';

type BackendTeamMember = {
    id: string;
    moodle_id?: string;
    name?: string;
    username?: string;
    email?: string;
    profile_picture_url?: string;
    role?: string;
};

type BackendTeam = {
    id: string;
    owner_id?: string;
    project?: string;
    name?: string;
    description?: string;
    members?: BackendTeamMember[];
    member_count?: number;
    capacity?: number;
    search_keywords?: string[];
};

type BackendJoinRequestItem = {
    id: string;
    team_id: string;
    team_name: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    message: string;
    created_at: string;
    user?: {
        id?: string;
        moodle_id?: string;
        name?: string;
        username?: string;
        email?: string;
        profile_picture_url?: string;
    };
};

export type TeamIncomingJoinRequestItem = {
    id: string;
    teamId: string;
    teamName: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    message: string;
    createdAt: string;
    userId: string;
    userMoodleId: string;
    userName: string;
    userEmail: string;
    userAvatarUrl?: string;
};

function mapTeam(team: BackendTeam): Team {
    const members = Array.isArray(team.members)
        ? team.members.map((member) => ({
            userId: String(member.id),
            moodleId: member.moodle_id || member.username || String(member.id),
            name: member.name || member.username || 'Unknown',
            avatarUrl: member.profile_picture_url,
            role: member.role || 'MEMBER',
            email: member.email || '',
        }))
        : [];

    return {
        id: String(team.id),
        ownerId: team.owner_id ? String(team.owner_id) : undefined,
        projectId: team.project,
        name: team.name,
        description: team.description,
        searchKeywords: Array.isArray(team.search_keywords) ? team.search_keywords : [],
        members,
        capacity: Number(team.capacity || 0),
        teamMemberCount: Number(team.member_count || members.length),
        teamCapacity: Number(team.capacity || 0),
    };
}

function mapIncomingJoinRequest(item: BackendJoinRequestItem): TeamIncomingJoinRequestItem {
    return {
        id: item.id,
        teamId: item.team_id,
        teamName: item.team_name,
        status: item.status === 'APPROVED' ? 'ACCEPTED' : item.status,
        message: item.message || '',
        createdAt: item.created_at,
        userId: String(item.user?.id || ''),
        userMoodleId: String(item.user?.moodle_id || item.user?.username || item.user?.id || ''),
        userName: item.user?.name || item.user?.username || 'Unknown',
        userEmail: item.user?.email || '',
        userAvatarUrl: item.user?.profile_picture_url,
    };
}

export const teamApi = {
    getMyTeams: async (): Promise<APIResponse<Team[]>> => {
        const response = await api.get('/teams');
        const items = Array.isArray(response.data?.data)
            ? (response.data.data as BackendTeam[]).map(mapTeam)
            : [];

        return {
            success: !!response.data?.success,
            message: response.data?.message,
            data: items,
        };
    },

    discoverTeams: async (query?: string): Promise<APIResponse<Team[]>> => {
        const response = await api.get('/teams/discover/', {
            params: query ? { q: query } : undefined,
        });
        const items = Array.isArray(response.data?.data)
            ? (response.data.data as BackendTeam[]).map(mapTeam)
            : [];

        return {
            success: !!response.data?.success,
            message: response.data?.message,
            data: items,
        };
    },

    createTeam: async (payload: { name: string; description?: string; capacity?: number }): Promise<APIResponse<Team>> => {
        const response = await api.post('/teams/', payload);
        return {
            success: !!response.data?.success,
            message: response.data?.message,
            data: mapTeam((response.data?.data || {}) as BackendTeam),
        };
    },

    getTeam: async (id: string): Promise<APIResponse<Team>> => {
        const response = await api.get(`/teams/${id}/`);
        return {
            success: !!response.data?.success,
            message: response.data?.message,
            data: mapTeam((response.data?.data || {}) as BackendTeam),
        };
    },

    sendJoinRequest: async (projectId: string, requestData: Record<string, unknown>): Promise<APIResponse<JoinRequest>> => {
        const response = await api.post(`/projects/${projectId}/request`, requestData);
        return response.data;
    },

    getTeamByProjectId: async (projectId: string): Promise<APIResponse<Team>> => {
        const projectRes = await projectApi.getProjectById(projectId);
        const teamId = projectRes?.data?.teamId;

        if (!teamId) {
            return {
                success: true,
                data: {
                    id: '',
                    projectId,
                    name: 'No Team Yet',
                    description: '',
                    members: [],
                    capacity: projectRes?.data?.teamCapacity || 0,
                    teamMemberCount: 0,
                    teamCapacity: projectRes?.data?.teamCapacity || 0,
                },
                message: 'Team not created yet',
            };
        }

        return teamApi.getTeam(teamId);
    },

    getPendingRequests: async (projectId: string): Promise<APIResponse<JoinRequest[]>> => {
        const response = await projectApi.getJoinRequests();
        const requests = (response.data?.items || [])
            .filter((item) => item.project_id === projectId && item.status === 'PENDING')
            .map((item) => ({
                id: item.id,
                projectId: item.project_id,
                userId: item.requester_id,
                message: item.message || '',
                role: 'CONTRIBUTOR',
                status: item.status,
                createdAt: item.created_at,
                user: {
                    id: item.requester_id,
                    name: item.requester_name,
                    email: item.requester_email,
                    role: 'STUDENT' as const,
                    skills: [],
                    followersCount: 0,
                    followingCount: 0,
                    projectsCount: 0,
                    createdAt: item.created_at,
                },
            }));

        return {
            success: !!response.success,
            message: response.message,
            data: requests,
        };
    },

    updateRequestStatus: async (requestId: string, status: 'ACCEPTED' | 'REJECTED'): Promise<APIResponse<void>> => {
        const action = status === 'ACCEPTED' ? 'ACCEPT' : 'REJECT';
        const response = await projectApi.respondToJoinRequest(requestId, action);
        return {
            success: !!response.success,
            message: response.message,
            data: undefined,
        };
    },

    requestToJoinTeam: async (teamId: string, message?: string): Promise<APIResponse<JoinRequest>> => {
        const response = await api.post(`/teams/${teamId}/join`, {
            message: message || '',
        });
        return response.data;
    },

    getIncomingJoinRequests: async (): Promise<APIResponse<{ items: TeamIncomingJoinRequestItem[]; count: number }>> => {
        const response = await api.get('/teams/join-requests/');
        const rawItems = Array.isArray(response.data?.data?.items)
            ? (response.data.data.items as BackendJoinRequestItem[])
            : [];

        return {
            success: !!response.data?.success,
            message: response.data?.message,
            data: {
                items: rawItems.map(mapIncomingJoinRequest),
                count: Number(response.data?.data?.count || rawItems.length),
            },
        };
    },

    respondToTeamJoinRequest: async (requestId: string, action: 'APPROVE' | 'REJECT'): Promise<APIResponse<{ status: string }>> => {
        const response = await api.post(`/teams/join-request/${requestId}/respond`, { action });
        return response.data;
    },

    removeMember: async (teamId: string, userId: string): Promise<APIResponse<void>> => {
        const response = await api.delete(`/teams/${teamId}/members/${userId}/remove`);
        return response.data;
    },

    deleteTeam: async (teamId: string): Promise<APIResponse<void>> => {
        const response = await api.delete(`/teams/${teamId}/`);
        return response.data;
    },
};
