'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Spinner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/Input';
import { githubApi } from '@/api/github';
import { leetcodeApi } from '@/api/leetcode';
import { projectApi } from '@/api/project';
import { userApi } from '@/api/user';
import { useUser } from '@/hooks/useUser';
import { User } from '@/types';
import { Search, Users } from 'lucide-react';

type DiscoverProfile = {
    user: User;
    projectCount: number;
    topTeamSize: number;
    latestActivityTs: number;
};

type OwnerProjectStats = {
    projectCount: number;
    topTeamSize: number;
    latestActivityTs: number;
};

type BriefGitHubStats = {
    repos: number;
    followers: number;
};

type BriefLeetCodeStats = {
    solved: number;
    ranking: number;
};

function normalizeLeetCodeUsername(rawValue?: string): string {
    const raw = (rawValue || '').trim();
    if (!raw) return '';

    const cleaned = raw
        .replace(/^https?:\/\/(www\.)?leetcode\.com\//i, '')
        .replace(/^u\//i, '')
        .replace(/^@/, '')
        .replace(/\/$/, '');

    return cleaned.split('/')[0].trim();
}

function isStudentProfile(user: User): boolean {
    if (user.role === 'DEPARTMENT') return false;
    return /^\d+@apsit\.edu\.in$/i.test((user.email || '').trim());
}

export default function DiscoverPage() {
    const { profile } = useUser();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
    const [searchPeople, setSearchPeople] = useState('');
    const [githubStatsMap, setGithubStatsMap] = useState<Record<string, BriefGitHubStats | null>>({});
    const [leetCodeStatsMap, setLeetCodeStatsMap] = useState<Record<string, BriefLeetCodeStats | null>>({});

    const currentUserId = profile?.id;

    useEffect(() => {
        let cancelled = false;

        const loadDiscoverProfiles = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const projectsResponse = await projectApi.getProjects({ status: 'ACTIVE' }, 1, 80);
                const projects = projectsResponse.data?.items || [];
                const ownerStats = new Map<string, OwnerProjectStats>();

                for (const project of projects) {
                    const ownerId = String(project.ownerId || '').trim();
                    if (!ownerId) continue;

                    const existing = ownerStats.get(ownerId) || {
                        projectCount: 0,
                        topTeamSize: 0,
                        latestActivityTs: 0,
                    };

                    const activityTs = new Date(project.updatedAt || project.createdAt).getTime();
                    ownerStats.set(ownerId, {
                        projectCount: existing.projectCount + 1,
                        topTeamSize: Math.max(existing.topTeamSize, project.teamMemberCount || 0),
                        latestActivityTs: Math.max(existing.latestActivityTs, Number.isNaN(activityTs) ? 0 : activityTs),
                    });
                }

                const ownerIds = Array.from(ownerStats.entries())
                    .sort(([, a], [, b]) => {
                        if (b.projectCount !== a.projectCount) return b.projectCount - a.projectCount;
                        if (b.topTeamSize !== a.topTeamSize) return b.topTeamSize - a.topTeamSize;
                        return b.latestActivityTs - a.latestActivityTs;
                    })
                    .map(([ownerId]) => ownerId)
                    .slice(0, 24);

                // Include current user in discover search, even without active projects.
                if (currentUserId && !ownerIds.includes(currentUserId)) {
                    ownerIds.unshift(currentUserId);
                }

                const profileResults = await Promise.all(
                    ownerIds.map(async (ownerId) => {
                        try {
                            const fallbackStats = ownerStats.get(ownerId) || {
                                projectCount: 0,
                                topTeamSize: 0,
                                latestActivityTs: 0,
                            };

                            if (profile?.id && ownerId === profile.id) {
                                return {
                                    user: profile,
                                    projectCount: fallbackStats.projectCount,
                                    topTeamSize: fallbackStats.topTeamSize,
                                    latestActivityTs: fallbackStats.latestActivityTs,
                                } satisfies DiscoverProfile;
                            }

                            const userResponse = await userApi.getUserById(ownerId);
                            if (!userResponse.data?.id) return null;

                            return {
                                user: userResponse.data,
                                projectCount: fallbackStats.projectCount,
                                topTeamSize: fallbackStats.topTeamSize,
                                latestActivityTs: fallbackStats.latestActivityTs,
                            } satisfies DiscoverProfile;
                        } catch {
                            return null;
                        }
                    })
                );

                const discoveredUsersResponse = await userApi.searchUsers('', 100);
                const discoveredUsers = Array.isArray(discoveredUsersResponse.data)
                    ? discoveredUsersResponse.data
                    : [];

                const mergedProfiles = new Map<string, DiscoverProfile>();

                profileResults
                    .filter((result): result is DiscoverProfile => Boolean(result))
                    .forEach((result) => {
                        mergedProfiles.set(result.user.id, result);
                    });

                discoveredUsers.forEach((user) => {
                    const existing = mergedProfiles.get(user.id);
                    if (existing) {
                        return;
                    }

                    const fallbackStats = ownerStats.get(user.id) || {
                        projectCount: 0,
                        topTeamSize: 0,
                        latestActivityTs: 0,
                    };

                    mergedProfiles.set(user.id, {
                        user,
                        projectCount: fallbackStats.projectCount,
                        topTeamSize: fallbackStats.topTeamSize,
                        latestActivityTs: fallbackStats.latestActivityTs,
                    });
                });

                if (!cancelled) {
                    setProfiles(
                        Array.from(mergedProfiles.values()).filter((item) => isStudentProfile(item.user))
                    );
                }
            } catch {
                if (!cancelled) {
                    setError('Unable to load student profiles right now. Please try again.');
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        void loadDiscoverProfiles();
        return () => {
            cancelled = true;
        };
    }, [currentUserId, profile]);

    const sortedProfiles = useMemo(
        () => [...profiles].sort((a, b) => b.projectCount - a.projectCount || b.latestActivityTs - a.latestActivityTs),
        [profiles]
    );
    const filteredProfiles = useMemo(() => {
        const query = searchPeople.trim().toLowerCase();
        if (!query) return sortedProfiles;

        return sortedProfiles.filter((item) => {
            const githubUsername = (item.user.githubUsername || '').toLowerCase();
            const leetCodeUsername = normalizeLeetCodeUsername(item.user.leetCodeUrl).toLowerCase();
            const haystack = [
                item.user.name,
                item.user.email,
                githubUsername,
                leetCodeUsername,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return haystack.includes(query);
        });
    }, [searchPeople, sortedProfiles]);

    useEffect(() => {
        const githubUsernames = filteredProfiles
            .map((item) => (item.user.githubUsername || '').trim().toLowerCase())
            .filter(Boolean)
            .filter((username, index, arr) => arr.indexOf(username) === index)
            .filter((username) => githubStatsMap[username] === undefined)
            .slice(0, 12);

        if (githubUsernames.length === 0) return;

        let cancelled = false;

        Promise.all(
            githubUsernames.map(async (username) => {
                try {
                    const stats = await githubApi.getStats(username);
                    return [
                        username,
                        {
                            repos: Number(stats?.user?.public_repos ?? stats?.repos ?? 0),
                            followers: Number(stats?.user?.followers ?? 0),
                        } satisfies BriefGitHubStats,
                    ] as const;
                } catch {
                    return [username, null] as const;
                }
            })
        ).then((results) => {
            if (cancelled) return;
            setGithubStatsMap((prev) => {
                const next = { ...prev };
                results.forEach(([username, stats]) => {
                    next[username] = stats;
                });
                return next;
            });
        });

        return () => {
            cancelled = true;
        };
    }, [filteredProfiles, githubStatsMap]);

    useEffect(() => {
        const leetCodeUsernames = filteredProfiles
            .map((item) => normalizeLeetCodeUsername(item.user.leetCodeUrl).toLowerCase())
            .filter(Boolean)
            .filter((username, index, arr) => arr.indexOf(username) === index)
            .filter((username) => leetCodeStatsMap[username] === undefined)
            .slice(0, 12);

        if (leetCodeUsernames.length === 0) return;

        let cancelled = false;

        Promise.all(
            leetCodeUsernames.map(async (username) => {
                try {
                    const stats = await leetcodeApi.getStats(username);
                    return [
                        username,
                        {
                            solved: Number(stats?.profile?.totalSolved ?? 0),
                            ranking: Number(stats?.profile?.ranking ?? 0),
                        } satisfies BriefLeetCodeStats,
                    ] as const;
                } catch {
                    return [username, null] as const;
                }
            })
        ).then((results) => {
            if (cancelled) return;
            setLeetCodeStatsMap((prev) => {
                const next = { ...prev };
                results.forEach(([username, stats]) => {
                    next[username] = stats;
                });
                return next;
            });
        });

        return () => {
            cancelled = true;
        };
    }, [filteredProfiles, leetCodeStatsMap]);

    return (
        <div className="space-y-6">
            <Breadcrumbs items={[{ label: 'Discover' }]} />

            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Discover Student Profiles</h1>
                <p className="text-slate-600">
                    Explore profiles from other students with their GitHub and LeetCode links.
                </p>
            </div>

            <div className="max-w-md">
                <Input
                    placeholder="Search people by name, email, GitHub, or LeetCode..."
                    value={searchPeople}
                    onChange={(event) => setSearchPeople(event.target.value)}
                    icon={<Search className="h-4 w-4" />}
                />
            </div>

            {isLoading ? (
                <div className="flex h-56 items-center justify-center">
                    <Spinner size="lg" />
                </div>
            ) : error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>
            ) : filteredProfiles.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
                    <p className="font-semibold text-slate-800">No people found</p>
                    <p className="mt-1 text-sm text-slate-500">Try another search keyword for name, email, GitHub, or LeetCode.</p>
                </div>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProfiles.map((item) => {
                        const githubUsername = (item.user.githubUsername || '').trim();
                        const leetCodeUsername = normalizeLeetCodeUsername(item.user.leetCodeUrl);
                        const isCurrentUser = item.user.id === currentUserId;
                        const githubStats = githubUsername ? githubStatsMap[githubUsername.toLowerCase()] : undefined;
                        const leetCodeStats = leetCodeUsername ? leetCodeStatsMap[leetCodeUsername.toLowerCase()] : undefined;

                        return (
                            <Link
                                key={item.user.id}
                                href={`/discover/${item.user.id}`}
                                className="block rounded-2xl transition-transform duration-200 hover:-translate-y-0.5"
                            >
                            <article className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300">
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">
                                        {(item.user.name || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="truncate text-base font-semibold text-slate-900">{item.user.name}</p>
                                            {isCurrentUser && (
                                                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                                                    You
                                                </span>
                                            )}
                                        </div>
                                        <p className="truncate text-xs text-slate-500">{item.user.email}</p>
                                    </div>
                                </div>

                                <div className="mb-4 flex items-center gap-4 text-xs text-slate-600">
                                    <span className="inline-flex items-center gap-1">
                                        <Users className="h-3.5 w-3.5" />
                                        {item.projectCount} active project{item.projectCount === 1 ? '' : 's'}
                                    </span>
                                </div>

                                <div className="mb-4 grid grid-cols-2 gap-2 text-[11px]">
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                                        <p className="font-semibold text-slate-500">GitHub Stats</p>
                                        {!githubUsername ? (
                                            <p className="mt-0.5 text-slate-400">Not linked</p>
                                        ) : githubStats === undefined ? (
                                            <p className="mt-0.5 text-slate-400">Loading...</p>
                                        ) : githubStats === null ? (
                                            <p className="mt-0.5 text-slate-400">Unavailable</p>
                                        ) : (
                                            <p className="mt-0.5 text-slate-800">{githubStats.repos} repos, {githubStats.followers} followers</p>
                                        )}
                                    </div>

                                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                                        <p className="font-semibold text-slate-500">LeetCode Stats</p>
                                        {!leetCodeUsername ? (
                                            <p className="mt-0.5 text-slate-400">Not linked</p>
                                        ) : leetCodeStats === undefined ? (
                                            <p className="mt-0.5 text-slate-400">Loading...</p>
                                        ) : leetCodeStats === null ? (
                                            <p className="mt-0.5 text-slate-400">Unavailable</p>
                                        ) : (
                                            <p className="mt-0.5 text-slate-800">
                                                {leetCodeStats.solved} solved, {leetCodeStats.ranking > 0 ? `#${leetCodeStats.ranking}` : 'unranked'}
                                            </p>
                                        )}
                                    </div>
                                </div>

                            </article>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
