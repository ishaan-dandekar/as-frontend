export type UserRole = 'STUDENT' | 'DEPARTMENT';

export interface User {
    id: string;
    moodleId?: string;
    name: string;
    email: string;
    role: UserRole;
    branch?: string;
    year?: string;
    avatarUrl?: string;
    bio?: string;
    skills: string[];
    skillTags?: string[];
    githubUrl?: string;
    leetCodeUrl?: string;
    followersCount: number;
    followingCount: number;
    projectsCount: number;
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
