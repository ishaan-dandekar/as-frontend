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
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-teal-50 via-white to-amber-50 px-6 py-6 sm:px-7">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                        <Avatar
                            src={user.avatarUrl}
                            fallback={user.name.charAt(0)}
                            className="h-20 w-20 border border-white shadow-sm sm:h-24 sm:w-24"
                        />

                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">{user.name}</h1>
                                <Badge variant="secondary" className="bg-slate-900 text-white">
                                    {formatUserRole(user.role)}
                                </Badge>
                            </div>
                            <p className="text-sm text-slate-600">{user.email}</p>
                            {bioText ? (
                                <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">{bioText}</p>
                            ) : (
                                <p className="text-sm text-slate-500">Add a short bio to help teammates understand what you like building.</p>
                            )}
                        </div>
                    </div>

                    {isOwnProfile && (
                        <Link href="/settings">
                            <Button variant="outline" size="sm" className="gap-2 bg-white/90 backdrop-blur">
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
                            <div key={detail.label} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                    <Icon className="h-3.5 w-3.5" />
                                    {detail.label}
                                </div>
                                <p className="mt-2 text-sm font-semibold text-slate-900 sm:text-base">{detail.value}</p>
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
                            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-200"
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
                            className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm text-amber-700 transition-colors hover:bg-amber-100"
                        >
                            <LinkIcon className="h-4 w-4" />
                            LeetCode
                        </a>
                    )}
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700">
                        <Calendar className="h-4 w-4" />
                        Joined {joined}
                    </span>
                </div>

                <div className="flex flex-wrap gap-2">
                    {(user.skills || []).length > 0 ? (
                        user.skills.map((skill) => (
                            <Badge key={skill} variant="secondary" className="bg-slate-100 text-slate-700">
                                {skill}
                            </Badge>
                        ))
                    ) : (
                        <span className="text-sm text-slate-500">No skills added yet.</span>
                    )}
                </div>
            </div>
        </div>
    );
}
