import { UserRole } from '@/types';

export function formatUserRole(role?: UserRole): string {
    if (role === 'ADMIN') return 'Admin';
    if (role === 'STUDENT') return 'Student';
    return 'User';
}

export function formatGithubUsername(username?: string): string {
    const normalized = (username || '').trim();
    return normalized ? `@${normalized}` : 'Not linked';
}

export function formatAcademicProfile(branch?: string, year?: string): string {
    const parts = [year, branch].filter(Boolean);
    return parts.length > 0 ? parts.join(' • ') : 'Not added';
}

export function formatAcademicStatus(year?: string, branch?: string, admissionYear?: number): string[] {
    return [
        year || '',
        branch || '',
        admissionYear ? `Batch ${admissionYear}` : '',
    ].filter(Boolean);
}
