import api from '@/lib/axios';
import { setAvatarSyncVersionNow, withAvatarSyncVersion } from '@/lib/avatarUrl';

type BackendUser = {
    id: string;
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

function toTitleCase(value: string): string {
    return value
        .toLowerCase()
        .replace(/\b([a-z])/g, (char) => char.toUpperCase());
}

function normalizeDisplayName(user: BackendUser): string {
    const first = (user.first_name || '').trim();
    const last = (user.last_name || '').trim();
    const fullName = [first, last].filter(Boolean).join(' ').trim();

    const candidates = [
        fullName,
        (user.name || '').trim(),
        first,
    ].filter(Boolean);

    const best = candidates.find((c) => !c.includes('@'));
    if (best) return toTitleCase(best);

    const fallbackFromEmail = (user.email || '').split('@')[0]?.trim();
    return fallbackFromEmail ? toTitleCase(fallbackFromEmail) : 'User';
}

function resolveRole(user: BackendUser, hintRole?: string): 'STUDENT' | 'DEPARTMENT' {
    if (hintRole === 'DEPARTMENT' || hintRole === 'STUDENT') return hintRole;
    if (user.role === 'DEPARTMENT') return 'DEPARTMENT';

    const storedRole =
        typeof window !== 'undefined'
            ? localStorage.getItem('userRole')
            : null;
    if (storedRole === 'DEPARTMENT' || storedRole === 'STUDENT') {
        return storedRole;
    }

    const localPart = (user.email || '').split('@')[0] || '';
    const hasDigits = /\d/.test(localPart);
    return hasDigits ? 'STUDENT' : 'DEPARTMENT';
}

function mapUser(user: BackendUser, hintRole?: string) {
    const normalizedRole = resolveRole(user, hintRole);

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
        followersCount: user.followersCount || 0,
        followingCount: user.followingCount || 0,
        projectsCount: user.projectsCount || 0,
        createdAt: user.created_at || new Date().toISOString(),
    };
}

export const authApi = {
    getGoogleOAuthUrl: async (frontendOrigin?: string): Promise<{ authorizationUrl: string }> => {
        const response = await api.get('/auth/google/start', {
            params: frontendOrigin ? { frontend_origin: frontendOrigin } : undefined,
        });
        return response.data?.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('google_oauth_result');
        localStorage.removeItem('avatarSyncVersion');
    },

    /**
     * Process the OAuth result payload that comes from the popup callback.
     */
    processGoogleOAuthResult: (payload: {
        user: BackendUser;
        token: string;
        refreshToken: string;
        role?: string;
    }) => {
        const avatarVersion = setAvatarSyncVersionNow();
        const user = {
            ...mapUser(payload.user, payload.role),
            avatarUrl: withAvatarSyncVersion(payload.user.profile_picture_url, avatarVersion),
        };
        return {
            user,
            token: payload.token,
            refreshToken: payload.refreshToken,
        };
    },
};
