import axios from 'axios';
import { MOCK_PROJECTS, MOCK_STUDENT, MOCK_DIRECTORY_USERS, MOCK_TEAMS, MOCK_TEAM_JOIN_REQUESTS } from './mockData';
import { Project, User } from '@/types';

function resolveApiBaseUrl() {
    const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (configured) return configured;

    if (typeof window !== 'undefined') {
        return `${window.location.protocol}//${window.location.hostname}:8000/api`;
    }

    return 'http://localhost:8000/api';
}

const api = axios.create({
    baseURL: resolveApiBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});

const isMockApiEnabled = process.env.NEXT_PUBLIC_ENABLE_MOCK_API === 'true';

// Helper functions for mock user storage
const USERS_STORAGE_KEY = 'mock_users';
const CURRENT_USER_KEY = 'current_user_id';

function getStoredUsers(): Record<string, User & { password: string }> {
    if (typeof window === 'undefined') return {};
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
}

function saveStoredUsers(users: Record<string, User & { password: string }>) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userId = localStorage.getItem(CURRENT_USER_KEY);
    if (!userId) return MOCK_STUDENT;

    // Check if it's the mock student
    if (userId === MOCK_STUDENT.id) return MOCK_STUDENT;

    const users = getStoredUsers();
    const userWithPassword = users[userId];
    if (!userWithPassword) return null;

    // Return user without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...user } = userWithPassword;
    return user;
}

function getMockDirectoryUsers(): User[] {
    const storedUsers = Object.values(getStoredUsers()).map((userWithPassword) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...user } = userWithPassword;
        return user;
    });

    const directory = new Map<string, User>();
    [MOCK_STUDENT, ...MOCK_DIRECTORY_USERS, ...storedUsers].forEach((user) => {
        directory.set(user.id, user);
    });

    return Array.from(directory.values());
}

function matchesMockUserSearch(user: User, query: string, skills: string[]) {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedSkills = skills.map((skill) => skill.trim().toLowerCase()).filter(Boolean);
    const haystack = [
        user.name,
        user.moodleId,
        user.email,
        user.branch,
        user.year,
        user.githubUsername,
        user.leetCodeUrl,
        ...(user.skillTags || user.skills || []),
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
    const skillTags = (user.skillTags || user.skills || []).map((skill) => skill.toLowerCase());
    const matchesSkills = normalizedSkills.length === 0 || normalizedSkills.every((skill) => skillTags.includes(skill));

    return matchesQuery && matchesSkills;
}

function toMockSearchResponseUser(user: User) {
    return {
        id: user.id,
        moodle_id: user.moodleId || user.id,
        unique_id: user.moodleId || user.id,
        username: user.moodleId || user.name,
        email: user.email,
        first_name: user.name,
        last_name: '',
        profile_picture_url: user.avatarUrl,
        branch: user.branch,
        year: user.year,
        skills: user.skills || [],
        skill_tags: user.skillTags || user.skills || [],
        github_username: user.githubUsername,
        leetcode_username: user.leetCodeUrl,
    };
}

function toMockBackendUser(user: User) {
    return {
        ...toMockSearchResponseUser(user),
        role: user.role,
        name: user.name,
        bio: user.bio || '',
        created_at: user.createdAt,
        projects_created: user.projectsCount || 0,
        projects_completed: 0,
        teams_joined: 0,
        followersCount: user.followersCount || 0,
        followingCount: user.followingCount || 0,
        projectsCount: user.projectsCount || 0,
    };
}

function toMockBackendProject(project: Project) {
    return {
        id: project.id,
        title: project.title,
        description: project.description,
        thumbnail_url: project.thumbnailUrl || null,
        images: project.images || [],
        tech_stack: project.techStack || [],
        domain_tags: project.domainTags || [],
        owner: { id: project.ownerId },
        status: project.status,
        team: project.teamId || null,
        team_member_count: project.teamMemberCount || 0,
        team_capacity: project.teamCapacity || 0,
        github_url: project.githubUrl || null,
        live_url: project.liveUrl || null,
        is_bookmarked: !!project.isBookmarked,
        created_at: project.createdAt,
        updated_at: project.updatedAt,
    };
}

function buildMockTeamMember(userId: string, role: string) {
    const user = getMockDirectoryUsers().find((item) => item.id === userId);
    return {
        id: userId,
        moodle_id: user?.moodleId || userId,
        username: user?.name || userId,
        email: user?.email || '',
        profile_picture_url: user?.avatarUrl,
        role,
    };
}

function toMockBackendTeam(team: typeof MOCK_TEAMS[number]) {
    return {
        id: team.id,
        owner_id: team.owner_id,
        project: team.project,
        name: team.name,
        description: team.description,
        members: team.members.map((member) => buildMockTeamMember(member.id, member.role)),
        member_count: team.member_count,
        capacity: team.capacity,
        search_keywords: team.search_keywords,
    };
}

// Mocking Interceptor for Demo Purpose
api.interceptors.request.use(
    async (config) => {
        if (isMockApiEnabled) {
            const url = config.url || '';

            // Handle get profile
            if (url.includes('/user/profile') && config.method === 'get') {
                const currentUser = getCurrentUser();
                if (currentUser) {
                    config.adapter = async () => ({
                        data: { success: true, data: toMockBackendUser(currentUser), message: 'Profile fetched' },
                        status: 200,
                        statusText: 'OK',
                        headers: {},
                        config,
                    });
                    return config;
                }
            }

            // Handle update profile
            if (url.includes('/user/profile') && config.method === 'patch') {
                const requestData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
                const currentUserId = localStorage.getItem(CURRENT_USER_KEY);

                if (currentUserId && currentUserId !== MOCK_STUDENT.id) {
                    const users = getStoredUsers();
                    if (users[currentUserId]) {
                        users[currentUserId] = { ...users[currentUserId], ...requestData };
                        saveStoredUsers(users);
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { password: _pwd, ...userWithoutPassword } = users[currentUserId];
                        config.adapter = async () => ({
                            data: { success: true, data: toMockBackendUser(userWithoutPassword), message: 'Profile updated' },
                            status: 200,
                            statusText: 'OK',
                            headers: {},
                            config,
                        });
                        return config;
                    }
                }
            }

            if (url.includes('/user/search') && config.method === 'get') {
                const directoryUsers = getMockDirectoryUsers();
                const query = String(config.params?.q || '');
                const skills = String(config.params?.skills || '')
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean);
                const limit = Number(config.params?.limit || 50);
                const items = directoryUsers
                    .filter((user) => matchesMockUserSearch(user, query, skills))
                    .slice(0, Number.isFinite(limit) ? limit : 50)
                    .map(toMockSearchResponseUser);

                config.adapter = async () => ({
                    data: { success: true, data: items, message: 'Users fetched' },
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    config,
                });
                return config;
            }

            if (url.startsWith('/user/') && !url.includes('/user/profile') && !url.includes('/user/search') && config.method === 'get') {
                const identifier = url.replace('/user/', '').replace(/\/$/, '');
                const matchedUser = getMockDirectoryUsers().find((user) =>
                    user.id === identifier || user.moodleId === identifier
                );

                if (matchedUser) {
                    config.adapter = async () => ({
                        data: { success: true, data: toMockBackendUser(matchedUser), message: 'User fetched' },
                        status: 200,
                        statusText: 'OK',
                        headers: {},
                        config,
                    });
                    return config;
                }
            }

            if (url === '/projects/' && config.method === 'get') {
                const search = String(config.params?.search || '').trim().toLowerCase();
                const status = String(config.params?.status || '').trim();
                const domains = String(config.params?.domains || '')
                    .split(',')
                    .map((item) => item.trim().toLowerCase())
                    .filter(Boolean);
                const page = Number(config.params?.page || 1);
                const limit = Number(config.params?.limit || 10);

                const filteredProjects = MOCK_PROJECTS.filter((project) => {
                    const haystack = [
                        project.title,
                        project.description,
                        ...(project.techStack || []),
                        ...(project.domainTags || []),
                    ].join(' ').toLowerCase();

                    const matchesSearch = !search || haystack.includes(search);
                    const matchesStatus = !status || project.status === status;
                    const projectDomains = (project.domainTags || []).map((tag) => tag.toLowerCase());
                    const matchesDomains = domains.length === 0 || domains.some((domain) => projectDomains.includes(domain));

                    return matchesSearch && matchesStatus && matchesDomains;
                });

                const start = Math.max(0, (page - 1) * limit);
                const paginatedProjects = filteredProjects.slice(start, start + limit).map(toMockBackendProject);

                config.adapter = async () => ({
                    data: {
                        success: true,
                        data: paginatedProjects,
                        pagination: {
                            page,
                            limit,
                            total: filteredProjects.length,
                            pages: Math.max(1, Math.ceil(filteredProjects.length / limit)),
                        },
                        message: 'Projects fetched',
                    },
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    config,
                });
                return config;
            }

            if (url.startsWith('/projects/') && config.method === 'get') {
                const projectId = url.replace('/projects/', '').replace(/\/$/, '');
                const matchedProject = MOCK_PROJECTS.find((project) => project.id === projectId);
                if (matchedProject) {
                    config.adapter = async () => ({
                        data: {
                            success: true,
                            data: toMockBackendProject(matchedProject),
                            message: 'Project fetched',
                        },
                        status: 200,
                        statusText: 'OK',
                        headers: {},
                        config,
                    });
                    return config;
                }
            }

            if ((url === '/teams' || url === '/teams/') && config.method === 'get') {
                const currentUser = getCurrentUser();
                const items = MOCK_TEAMS
                    .filter((team) => team.members.some((member) => member.id === currentUser?.id))
                    .map(toMockBackendTeam);

                config.adapter = async () => ({
                    data: { success: true, data: items, message: 'Teams fetched' },
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    config,
                });
                return config;
            }

            if (url === '/teams/discover/' && config.method === 'get') {
                const currentUser = getCurrentUser();
                const query = String(config.params?.q || '').trim().toLowerCase();
                const items = MOCK_TEAMS
                    .filter((team) => !team.members.some((member) => member.id === currentUser?.id))
                    .filter((team) => {
                        if (!query) return true;
                        const haystack = [team.name, team.description, ...team.search_keywords].join(' ').toLowerCase();
                        return haystack.includes(query);
                    })
                    .map(toMockBackendTeam);

                config.adapter = async () => ({
                    data: { success: true, data: items, message: 'Discover teams fetched' },
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    config,
                });
                return config;
            }

            if (url === '/teams/join-requests/' && config.method === 'get') {
                const currentUser = getCurrentUser();
                const ownedTeamIds = new Set(
                    MOCK_TEAMS.filter((team) => team.owner_id === currentUser?.id).map((team) => team.id)
                );
                const items = MOCK_TEAM_JOIN_REQUESTS
                    .filter((request) => ownedTeamIds.has(request.team_id))
                    .map((request) => {
                        const user = getMockDirectoryUsers().find((item) => item.id === request.user_id);
                        return {
                            id: request.id,
                            team_id: request.team_id,
                            team_name: request.team_name,
                            status: request.status,
                            message: request.message,
                            created_at: request.created_at,
                            user: user
                                ? {
                                    id: user.id,
                                    moodle_id: user.moodleId,
                                    username: user.name,
                                    email: user.email,
                                    profile_picture_url: user.avatarUrl,
                                }
                                : undefined,
                        };
                    });

                config.adapter = async () => ({
                    data: { success: true, data: { items, count: items.length }, message: 'Join requests fetched' },
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    config,
                });
                return config;
            }

            if (url.startsWith('/teams/') && config.method === 'get') {
                const teamId = url.replace('/teams/', '').replace(/\/$/, '');
                const team = MOCK_TEAMS.find((item) => item.id === teamId);
                if (team) {
                    config.adapter = async () => ({
                        data: { success: true, data: toMockBackendTeam(team), message: 'Team fetched' },
                        status: 200,
                        statusText: 'OK',
                        headers: {},
                        config,
                    });
                    return config;
                }
            }

            // Other mock routes
            const mockRoutes: Record<string, Record<string, unknown>> = {
                '/events': { success: true, data: [], message: 'Events fetched' },
            };

            const route = Object.keys(mockRoutes).find(r => config.url?.includes(r));

            if (route) {
                // Short-circuit the request with a mock response
                config.adapter = async () => ({
                    data: mockRoutes[route],
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    config,
                });
            }
        }

        const token = localStorage.getItem('token');
        if (!isMockApiEnabled && token?.startsWith('mock-token')) {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem(CURRENT_USER_KEY);
            return config;
        }
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const requestUrl = originalRequest?.url || '';
        const isAuthEndpoint =
            requestUrl.includes('/auth/google/start') ||
            requestUrl.includes('/auth/refresh');

        // Custom error for no internet or server down - can be used to fail-over to mock
        if (!error.response && process.env.NODE_ENV === 'development') {
            // We can handle specific failover here if needed
        }

        if (isAuthEndpoint) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    return Promise.reject(error);
                }
                const baseUrl = String(api.defaults.baseURL || '').replace(/\/$/, '');
                const refreshUrl = `${baseUrl}/auth/refresh`;
                const response = await axios.post(refreshUrl, {
                    refresh_token: refreshToken,
                });

                const token = response.data?.data?.access_token || response.data?.data?.token;
                if (!token) {
                    return Promise.reject(error);
                }
                localStorage.setItem('token', token);

                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
