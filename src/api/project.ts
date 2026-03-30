import api from '@/lib/axios';
import { Project, ProjectFilter, APIResponse, PaginatedResponse } from '@/types';

type BackendProject = {
    id: string;
    title: string;
    description: string;
    thumbnail_url?: string | null;
    images?: string[];
    tech_stack?: string[];
    owner?: { id?: string };
    status: Project['status'];
    team?: string | null;
    team_member_count?: number;
    team_capacity?: number;
    github_url?: string | null;
    live_url?: string | null;
    is_bookmarked?: boolean;
    created_at?: string;
    updated_at?: string;
};

export type ProjectJoinRequestItem = {
    id: string;
    project_id: string;
    project_title: string;
    requester_id: string;
    requester_name: string;
    requester_email: string;
    message: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    created_at: string;
};

function mapProject(project: BackendProject): Project {
    return {
        id: String(project.id),
        title: project.title || 'Untitled Project',
        description: project.description || '',
        thumbnailUrl: project.thumbnail_url || undefined,
        images: Array.isArray(project.images) ? project.images : [],
        techStack: Array.isArray(project.tech_stack) ? project.tech_stack : [],
        ownerId: String(project.owner?.id || ''),
        status: project.status,
        teamId: project.team || undefined,
        teamMemberCount: Number(project.team_member_count || 0),
        teamCapacity: Number(project.team_capacity || 0),
        githubUrl: project.github_url || undefined,
        liveUrl: project.live_url || undefined,
        isBookmarked: !!project.is_bookmarked,
        createdAt: project.created_at || new Date().toISOString(),
        updatedAt: project.updated_at || new Date().toISOString(),
    };
}

function toBackendProjectPayload(projectData: Partial<Project> & Record<string, unknown>): Record<string, unknown> {
    const payload: Record<string, unknown> = { ...projectData };

    if ('thumbnailUrl' in payload) {
        payload.thumbnail_url = payload.thumbnailUrl;
        delete payload.thumbnailUrl;
    }
    if ('techStack' in payload) {
        payload.tech_stack = payload.techStack;
        delete payload.techStack;
    }
    if ('teamId' in payload) {
        payload.team = payload.teamId;
        delete payload.teamId;
    }
    if ('teamMemberCount' in payload) {
        payload.team_member_count = payload.teamMemberCount;
        delete payload.teamMemberCount;
    }
    if ('teamCapacity' in payload) {
        payload.team_capacity = payload.teamCapacity;
        delete payload.teamCapacity;
    }
    if ('githubUrl' in payload) {
        payload.github_url = payload.githubUrl;
        delete payload.githubUrl;
    }
    if ('liveUrl' in payload) {
        payload.live_url = payload.liveUrl;
        delete payload.liveUrl;
    }

    return payload;
}

export const projectApi = {
    getProjects: async (filters?: ProjectFilter, page = 1, limit = 10): Promise<APIResponse<PaginatedResponse<Project>>> => {
        const response = await api.get('/projects/', { params: { ...filters, page, limit } });
        const items = Array.isArray(response.data?.data)
            ? (response.data.data as BackendProject[]).map(mapProject)
            : [];
        const pagination = response.data?.pagination || {};

        return {
            success: !!response.data?.success,
            message: response.data?.message,
            data: {
                items,
                total: Number(pagination.total || items.length),
                page: Number(pagination.page || page),
                limit: Number(pagination.limit || limit),
                totalPages: Number(pagination.pages || 1),
            },
        };
    },
    getProjectById: async (id: string): Promise<APIResponse<Project>> => {
        const response = await api.get(`/projects/${id}/`);
        return {
            success: !!response.data?.success,
            message: response.data?.message,
            data: mapProject((response.data?.data || {}) as BackendProject),
        };
    },
    createProject: async (projectData: Partial<Project>): Promise<APIResponse<Project>> => {
        const response = await api.post('/projects/', toBackendProjectPayload(projectData));
        return {
            success: !!response.data?.success,
            message: response.data?.message,
            data: mapProject((response.data?.data || {}) as BackendProject),
        };
    },
    updateProject: async (id: string, projectData: Partial<Project>): Promise<APIResponse<Project>> => {
        const response = await api.patch(`/projects/${id}/`, toBackendProjectPayload(projectData));
        return {
            success: !!response.data?.success,
            message: response.data?.message,
            data: mapProject((response.data?.data || {}) as BackendProject),
        };
    },
    deleteProject: async (id: string): Promise<APIResponse<void>> => {
        const response = await api.delete(`/projects/${id}/`);
        return response.data;
    },
    bookmarkProject: async (id: string): Promise<APIResponse<void>> => {
        const response = await api.post(`/projects/${id}/bookmark`);
        return response.data;
    },
    requestToJoinProject: async (id: string, message?: string): Promise<APIResponse<{ requested: boolean }>> => {
        const response = await api.post(`/projects/${id}/request`, {
            message: message || '',
        });
        return response.data;
    },
    getMyProjects: async (): Promise<APIResponse<Project[]>> => {
        const response = await api.get('/projects/my-projects/');
        const items = Array.isArray(response.data?.data)
            ? (response.data.data as BackendProject[]).map(mapProject)
            : [];

        return {
            success: !!response.data?.success,
            message: response.data?.message,
            data: items,
        };
    },
    getProjectsByUser: async (userId: string, status?: Project['status']): Promise<APIResponse<Project[]>> => {
        const response = await api.get(`/projects/by-user/${userId}/`, {
            params: status ? { status } : undefined,
        });
        const items = Array.isArray(response.data?.data)
            ? (response.data.data as BackendProject[]).map(mapProject)
            : [];

        return {
            success: !!response.data?.success,
            message: response.data?.message,
            data: items,
        };
    },
    getJoinRequests: async (): Promise<APIResponse<{ items: ProjectJoinRequestItem[]; pending_count: number }>> => {
        const response = await api.get('/projects/join-requests/');
        return response.data;
    },
    respondToJoinRequest: async (requestId: string, action: 'ACCEPT' | 'REJECT'): Promise<APIResponse<{ status: string }>> => {
        const response = await api.post(`/projects/join-requests/${requestId}/respond`, {
            action,
        });
        return response.data;
    },
};
