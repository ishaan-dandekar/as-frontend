import axios from 'axios';
import { MOCK_PROJECTS, MOCK_EVENTS, MOCK_STUDENT } from './mockData';
import { User } from '@/types';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
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
    if (!userId) return null;

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
                        data: { data: currentUser, message: 'Profile fetched' },
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
                            data: { data: userWithoutPassword, message: 'Profile updated' },
                            status: 200,
                            statusText: 'OK',
                            headers: {},
                            config,
                        });
                        return config;
                    }
                }
            }

            // Handle projects - only show mock projects for mock student
            if (url.includes('/projects')) {
                const currentUserId = localStorage.getItem(CURRENT_USER_KEY);
                const isMockStudent = currentUserId === MOCK_STUDENT.id;

                config.adapter = async () => ({
                    data: {
                        data: {
                            items: isMockStudent ? MOCK_PROJECTS : [],
                            page: 1,
                            totalPages: 1,
                            totalItems: isMockStudent ? MOCK_PROJECTS.length : 0
                        },
                        message: 'Projects fetched'
                    },
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    config,
                });
                return config;
            }

            // Other mock routes
            const mockRoutes: Record<string, Record<string, unknown>> = {
                '/events': { data: { items: MOCK_EVENTS, page: 1, totalPages: 1, totalItems: 2 }, message: 'Events fetched' },
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
                const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
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
