import api from '@/lib/axios';
import { User, APIResponse } from '@/types';
import { withAvatarSyncVersion } from '@/lib/avatarUrl';

type BackendUser = {
    id: string;
    location?: string;
    name?: string;
    username?: string;
    email: string;
    first_name?: string;
    last_name?: string;
    profile_picture_url?: string;
    bio?: string;
    github_username?: string;
    leetcode_username?: string;
    role?: 'STUDENT' | 'DEPARTMENT';
    skills?: string[];
    followersCount?: number;
    followingCount?: number;
    projectsCount?: number;
    created_at?: string;
};

function isEmailLike(value?: string): boolean {
    if (!value) return false;
    return value.includes('@');
}

function normalizeDisplayName(user: BackendUser): string {
    const first = (user.first_name || '').trim();
    const last = (user.last_name || '').trim();
    const fullName = [first, last].filter(Boolean).join(' ').trim();

    const candidates = [
        fullName,
        (user.name || '').trim(),
        first,
        (user.username || '').trim(),
    ].filter(Boolean);

    const best = candidates.find((candidate) => !isEmailLike(candidate));
    if (best) return best;

    const fallbackFromEmail = (user.email || '').split('@')[0]?.trim();
    return fallbackFromEmail || 'User';
}

function resolveRole(user: BackendUser): 'STUDENT' | 'DEPARTMENT' {
    if (user.role === 'DEPARTMENT') return 'DEPARTMENT';

    const localPart = (user.email || '').split('@')[0] || '';
    const isLikelyStudent = /^\d+$/.test(localPart);
    return isLikelyStudent ? 'STUDENT' : 'DEPARTMENT';
}

function locationStorageKey(userId?: string): string | null {
    if (!userId) return null;
    return `profile_location:${userId}`;
}

function getStoredLocation(userId?: string): string | undefined {
    if (typeof window === 'undefined') return undefined;
    const key = locationStorageKey(userId);
    if (!key) return undefined;
    const value = localStorage.getItem(key);
    return value?.trim() || undefined;
}

function setStoredLocation(userId: string, location: string) {
    if (typeof window === 'undefined') return;
    const key = locationStorageKey(userId);
    if (!key) return;
    const normalized = location.trim();
    if (!normalized) {
        localStorage.removeItem(key);
        return;
    }
    localStorage.setItem(key, normalized);
}

function mapUser(user: BackendUser): User {
    const normalizedRole = resolveRole(user);
    const mappedLocation = (user.location || '').trim() || getStoredLocation(user.id);

    return {
        id: user.id,
        name: normalizeDisplayName(user),
        email: user.email,
        role: normalizedRole,
        avatarUrl: withAvatarSyncVersion(user.profile_picture_url),
        bio: user.bio || '',
        skills: user.skills || [],
        githubUsername: user.github_username,
        leetCodeUrl: user.leetcode_username,
        location: mappedLocation,
        followersCount: user.followersCount || 0,
        followingCount: user.followingCount || 0,
        projectsCount: user.projectsCount || 0,
        createdAt: user.created_at || new Date().toISOString(),
    };
}

export const userApi = {
    getProfile: async (): Promise<APIResponse<User>> => {
        const response = await api.get('/user/profile');
        return {
            ...response.data,
            data: mapUser(response.data?.data || {}),
        };
    },
    updateProfile: async (userData: Partial<User>): Promise<APIResponse<User>> => {
        const payload: Record<string, unknown> = {};

        if (typeof userData.name === 'string') payload.first_name = userData.name;
        if (typeof userData.bio === 'string') payload.bio = userData.bio;
        if (typeof userData.avatarUrl === 'string') payload.profile_picture_url = userData.avatarUrl;
        if (typeof userData.githubUsername === 'string') payload.github_username = userData.githubUsername;
        if (typeof userData.leetCodeUrl === 'string') payload.leetcode_username = userData.leetCodeUrl;
        if (typeof userData.location === 'string') payload.location = userData.location;
        if (Array.isArray(userData.skills)) payload.skills = userData.skills;

        const response = await api.patch('/user/profile', payload);
        const mappedUser = mapUser(response.data?.data || {});

        if (typeof userData.location === 'string' && mappedUser.id) {
            setStoredLocation(mappedUser.id, userData.location);
            mappedUser.location = userData.location.trim() || undefined;
        }

        return {
            ...response.data,
            data: mappedUser,
        };
    },
    getGitHubStats: async (username: string): Promise<APIResponse<Record<string, unknown>>> => {
        const response = await api.get(`/user/github/${username}`);
        return response.data;
    },
    getUserById: async (id: string): Promise<APIResponse<User>> => {
        const response = await api.get(`/user/${id}`);
        return {
            ...response.data,
            data: mapUser(response.data?.data || {}),
        };
    },
    searchUsers: async (query = '', limit = 50): Promise<APIResponse<User[]>> => {
        const response = await api.get('/user/search', {
            params: {
                q: query,
                limit,
            },
        });

        const items = Array.isArray(response.data?.data)
            ? (response.data.data as BackendUser[]).map(mapUser)
            : [];

        return {
            ...response.data,
            data: items,
        };
    },
};
