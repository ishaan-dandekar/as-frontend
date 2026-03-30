export type UserRole = 'STUDENT' | 'DEPARTMENT';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatarUrl?: string;
    bio?: string;
    skills: string[];
    githubUrl?: string;
    leetCodeUrl?: string;
    followersCount: number;
    followingCount: number;
    projectsCount: number;
    location?: string;
    githubUsername?: string;
    website?: string;
    lastSyncTimestamp?: string;
    createdAt: string;
}

export interface AuthResponse {
    user: User;
    token: string;
    refreshToken: string;
}
