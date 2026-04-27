import api from '@/lib/axios';
import { User, APIResponse } from '@/types';
import { withAvatarSyncVersion } from '@/lib/avatarUrl';

type BackendUser = {
    id: string;
    uid?: string;
    moodle_id?: string;
    unique_id?: string;
    name?: string;
    username?: string;
    email: string;
    first_name?: string;
    last_name?: string;
    profile_picture_url?: string;
    bio?: string;
    branch?: string;
    department?: string;
    admission_year?: number;
    year?: string;
    academic_status?: string;
    github_username?: string;
    leetcode_username?: string;
    role?: 'STUDENT' | 'ADMIN' | 'DEPARTMENT';
    skills?: string[];
    skill_tags?: string[];
    followersCount?: number;
    followingCount?: number;
    projectsCount?: number;
    projects_count?: number;
    activeProjectsCount?: number;
    active_projects_count?: number;
    created_at?: string;
};

function toTitleCase(value: string): string {
    return value
        .toLowerCase()
        .replace(/\b([a-z])/g, (char) => char.toUpperCase());
}

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
    if (best) return toTitleCase(best);

    const fallbackFromEmail = (user.email || '').split('@')[0]?.trim();
    return fallbackFromEmail ? toTitleCase(fallbackFromEmail) : 'User';
}

function resolveRole(user: BackendUser): 'STUDENT' | 'ADMIN' {
    if (user.role === 'STUDENT') return 'STUDENT';
    if (user.role === 'ADMIN' || user.role === 'DEPARTMENT') return 'ADMIN';

    const localPart = (user.email || '').split('@')[0] || '';
    const isLikelyStudent = /^\d+$/.test(localPart);
    return isLikelyStudent ? 'STUDENT' : 'ADMIN';
}

function mapUser(user: BackendUser): User {
    const normalizedRole = resolveRole(user);
    const moodleId = (user.moodle_id || user.unique_id || user.id || user.username || '').trim() || undefined;

    return {
        id: user.id,
        uid: user.uid || moodleId,
        moodleId,
        name: normalizeDisplayName(user),
        email: user.email,
        role: normalizedRole,
        branch: user.branch || undefined,
        department: user.department || user.branch || undefined,
        year: user.year || user.academic_status || undefined,
        academicStatus: user.academic_status || user.year || undefined,
        admissionYear: typeof user.admission_year === 'number' ? user.admission_year : undefined,
        avatarUrl: withAvatarSyncVersion(user.profile_picture_url),
        bio: user.bio || '',
        skills: user.skills || [],
        skillTags: user.skill_tags || user.skills || [],
        githubUsername: user.github_username,
        leetCodeUrl: user.leetcode_username,
        followersCount: user.followersCount || 0,
        followingCount: user.followingCount || 0,
        projectsCount: Number(user.projects_count ?? user.projectsCount ?? 0),
        activeProjectsCount: Number(user.active_projects_count ?? user.activeProjectsCount ?? 0),
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

        if (typeof userData.bio === 'string') payload.bio = userData.bio;
        if (typeof userData.githubUsername === 'string') payload.github_username = userData.githubUsername;
        if (typeof userData.leetCodeUrl === 'string') payload.leetcode_username = userData.leetCodeUrl;
        if (Array.isArray(userData.skills)) payload.skills = userData.skills;

        const response = await api.patch('/user/profile', payload);
        const mappedUser = mapUser(response.data?.data || {});

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
    searchUsers: async (query = '', limit = 50, skills?: string[]): Promise<APIResponse<User[]>> => {
        const response = await api.get('/user/search', {
            params: {
                q: query,
                limit,
                skills: skills && skills.length > 0 ? skills.join(',') : undefined,
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
