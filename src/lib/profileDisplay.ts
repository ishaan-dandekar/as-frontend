import { UserRole } from '@/types';

export function formatUserRole(role?: UserRole): string {
    if (role === 'DEPARTMENT') return 'Department';
    if (role === 'STUDENT') return 'Student';
    return 'User';
}

export function formatGithubUsername(username?: string): string {
    const normalized = (username || '').trim();
    return normalized ? `@${normalized}` : 'Not linked';
}
