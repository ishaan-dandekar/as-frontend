export type UserRole = 'STUDENT' | 'ADMIN';

export interface User {
    id: string;
    uid?: string;
    moodleId?: string;
    name: string;
    email: string;
    role: UserRole;
    branch?: string;
    department?: string;
    year?: string;
    academicStatus?: string;
    admissionYear?: number;
    avatarUrl?: string;
    bio?: string;
    skills: string[];
    skillTags?: string[];
    githubUrl?: string;
    leetCodeUrl?: string;
    followersCount: number;
    followingCount: number;
    projectsCount: number;
    activeProjectsCount?: number;
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
