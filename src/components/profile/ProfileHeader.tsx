'use client';

import { User } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Github, MapPin, Link as LinkIcon, Calendar, Settings } from 'lucide-react';
import Link from 'next/link';

interface ProfileHeaderProps {
    user: User;
    isOwnProfile?: boolean;
}

export function ProfileHeader({ user, isOwnProfile }: ProfileHeaderProps) {
    const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'N/A';
    const displayLocation = user.location?.trim() || 'Location not set';
    const bioText = user.bio?.trim() || '';

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                    <Avatar
                        src={user.avatarUrl}
                        fallback={user.name.charAt(0)}
                        className="h-20 w-20 border border-slate-200 shadow-sm sm:h-24 sm:w-24"
                    />

                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">{user.name}</h1>
                            <Badge variant="secondary" className="bg-teal-100 text-teal-800">
                                {user.role}
                            </Badge>
                        </div>
                        <p className="text-sm text-slate-600">{user.email}</p>
                        {bioText && (
                            <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">{bioText}</p>
                        )}
                    </div>
                </div>

                {isOwnProfile && (
                    <Link href="/settings">
                        <Button variant="outline" size="sm" className="gap-2">
                            <Settings className="h-4 w-4" />
                            Edit Profile
                        </Button>
                    </Link>
                )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2.5">
                {user.githubUrl && (
                    <a
                        href={user.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-200"
                    >
                        <Github className="h-4 w-4" />
                        GitHub
                    </a>
                )}
                {user.leetCodeUrl && (
                    <a
                        href={user.leetCodeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm text-amber-700 transition-colors hover:bg-amber-100"
                    >
                        <LinkIcon className="h-4 w-4" />
                        LeetCode
                    </a>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700">
                    <MapPin className="h-4 w-4" />
                    {displayLocation}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700">
                    <Calendar className="h-4 w-4" />
                    Joined {joined}
                </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
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
    );
}
