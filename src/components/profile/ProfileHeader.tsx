'use client';

import { User } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Github, Link as LinkIcon, Calendar, GraduationCap, Hash, Settings, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { formatAcademicProfile, formatUserRole } from '@/lib/profileDisplay';

interface ProfileHeaderProps {
    user: User;
    isOwnProfile?: boolean;
}

export function ProfileHeader({ user, isOwnProfile }: ProfileHeaderProps) {
    const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'N/A';
    const bioText = user.bio?.trim() || '';
    const academicSummary = formatAcademicProfile(user.department || user.branch, user.academicStatus || user.year);
    const githubHref = user.githubUsername
        ? `https://github.com/${user.githubUsername}`
        : user.githubUrl;
    const leetCodeHref = user.leetCodeUrl
        ? (user.leetCodeUrl.startsWith('http') ? user.leetCodeUrl : `https://leetcode.com/u/${user.leetCodeUrl}/`)
        : undefined;
    const detailChips = [
        user.uid || user.moodleId ? { label: 'UID', value: user.uid || user.moodleId || '', icon: Hash } : null,
        user.admissionYear ? { label: 'Batch', value: String(user.admissionYear), icon: Calendar } : null,
        academicSummary !== 'Not added' ? { label: 'Academic', value: academicSummary, icon: GraduationCap } : null,
        { label: 'Role', value: formatUserRole(user.role), icon: ShieldCheck },
    ].filter(Boolean) as Array<{ label: string; value: string; icon: typeof Hash }>;

    return (
        <div className="surface-elevated overflow-hidden rounded-[28px]">
            <div className="profile-banner px-6 py-6 sm:px-7">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                        <Avatar
                            src={user.avatarUrl}
                            fallback={user.name.charAt(0)}
                            className="border-app bg-surface-strong text-app h-20 w-20 border shadow-sm sm:h-24 sm:w-24"
                        />

                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="font-display text-app text-2xl font-bold sm:text-3xl">{user.name}</h1>
                                <Badge variant="secondary" className="bg-[color:var(--accent)] px-3 py-1 text-white">
                                    {formatUserRole(user.role)}
                                </Badge>
                            </div>
                            <p className="text-app-soft text-sm">{user.email}</p>
                            {bioText ? (
                                <p className="text-app-soft max-w-2xl text-sm leading-relaxed sm:text-base">{bioText}</p>
                            ) : (
                                <p className="text-app-muted text-sm">Add a short bio to help teammates understand what you like building.</p>
                            )}
                        </div>
                    </div>

                    {isOwnProfile && (
                        <Link href="/settings">
                            <Button variant="outline" size="sm" className="border-app bg-surface text-app gap-2 backdrop-blur hover:bg-surface-strong">
                                <Settings className="h-4 w-4" />
                                Edit Profile
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            <div className="space-y-5 p-6 sm:p-7">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {detailChips.map((detail) => {
                        const Icon = detail.icon;
                        return (
                            <div key={detail.label} className="border-app bg-surface-strong rounded-2xl border p-4">
                                <div className="text-app-muted flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em]">
                                    <Icon className="h-3.5 w-3.5" />
                                    {detail.label}
                                </div>
                                <p className="text-app mt-2 text-sm font-semibold sm:text-base">{detail.value}</p>
                            </div>
                        );
                    })}
                </div>

                <div className="flex flex-wrap gap-2.5">
                    {githubHref && (
                        <a
                            href={githubHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="border-app bg-surface-strong text-app inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors hover:bg-surface"
                        >
                            <Github className="h-4 w-4" />
                            GitHub
                        </a>
                    )}
                    {leetCodeHref && (
                        <a
                            href={leetCodeHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/60 bg-amber-50/80 px-3 py-1.5 text-sm text-amber-800 transition-colors hover:bg-amber-100/90"
                        >
                            <LinkIcon className="h-4 w-4" />
                            LeetCode
                        </a>
                    )}
                    <span className="border-app bg-surface-strong text-app inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm">
                        <Calendar className="h-4 w-4" />
                        Joined {joined}
                    </span>
                </div>

                <div className="flex flex-wrap gap-2">
                    {(user.skills || []).length > 0 ? (
                        user.skills.map((skill) => (
                            <Badge key={skill} variant="secondary" className="bg-surface-strong text-app border border-app">
                                {skill}
                            </Badge>
                        ))
                    ) : (
                        <span className="text-app-muted text-sm">No skills added yet.</span>
                    )}
                </div>
            </div>
        </div>
    );
}
