'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Spinner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { githubApi } from '@/api/github';
import { leetcodeApi } from '@/api/leetcode';
import { projectApi } from '@/api/project';
import { userApi } from '@/api/user';
import { useUser } from '@/hooks/useUser';
import { useDebounce } from '@/hooks/utils';
import { User } from '@/types';
import { Filter, Search, Users } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { formatAcademicProfile } from '@/lib/profileDisplay';
import { POPULAR_SKILL_TAGS, normalizeSkillTags } from '@/lib/skills';

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

function isDiscoverableProfile(user: User): boolean {
    return /@apsit\.edu\.in$/i.test((user.email || '').trim());
}

export default function DiscoverPage() {
    const { profile } = useUser();
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
    const [liveSearchProfiles, setLiveSearchProfiles] = useState<DiscoverProfile[] | null>(null);
    const [searchPeople, setSearchPeople] = useState('');
    const [skillSearch, setSkillSearch] = useState('');
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [showSkillFilters, setShowSkillFilters] = useState(false);
    const [githubStatsMap, setGithubStatsMap] = useState<Record<string, BriefGitHubStats | null>>({});
    const [leetCodeStatsMap, setLeetCodeStatsMap] = useState<Record<string, BriefLeetCodeStats | null>>({});

    const currentUserId = profile?.id;
    const debouncedSearchPeople = useDebounce(searchPeople, 300);

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
                    const resolvedProjectCount = Number(
                        user.activeProjectsCount ?? existing?.projectCount ?? 0
                    );

                    if (existing) {
                        mergedProfiles.set(user.id, {
                            ...existing,
                            user: {
                                ...existing.user,
                                ...user,
                            },
                            projectCount: resolvedProjectCount,
                        });
                        return;
                    }

                    const fallbackStats = ownerStats.get(user.id) || {
                        projectCount: 0,
                        topTeamSize: 0,
                        latestActivityTs: 0,
                    };

                    mergedProfiles.set(user.id, {
                        user,
                        projectCount: Number(user.activeProjectsCount ?? fallbackStats.projectCount ?? 0),
                        topTeamSize: fallbackStats.topTeamSize,
                        latestActivityTs: fallbackStats.latestActivityTs,
                    });
                });

                if (!cancelled) {
                    setProfiles(
                        Array.from(mergedProfiles.values()).filter((item) => isDiscoverableProfile(item.user))
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
    const statsByUserId = useMemo(() => {
        const map = new Map<string, OwnerProjectStats>();
        profiles.forEach((item) => {
            map.set(item.user.id, {
                projectCount: item.projectCount,
                topTeamSize: item.topTeamSize,
                latestActivityTs: item.latestActivityTs,
            });
        });
        return map;
    }, [profiles]);
    const sourceProfiles = useMemo(
        () => liveSearchProfiles ?? sortedProfiles,
        [liveSearchProfiles, sortedProfiles]
    );
    const availableSkills = useMemo(() => {
        const values = new Set<string>(POPULAR_SKILL_TAGS);
        sourceProfiles.forEach((item) => {
            normalizeSkillTags(item.user.skillTags || item.user.skills || []).forEach((skill) => values.add(skill));
        });
        return Array.from(values).sort((a, b) => a.localeCompare(b));
    }, [sourceProfiles]);
    const filteredAvailableSkills = useMemo(() => {
        const query = skillSearch.trim().toLowerCase();
        const sorted = [...availableSkills].sort((a, b) => {
            const aSelected = selectedSkills.includes(a) ? 1 : 0;
            const bSelected = selectedSkills.includes(b) ? 1 : 0;
            if (aSelected !== bSelected) return bSelected - aSelected;
            return a.localeCompare(b);
        });

        return sorted.filter((skill) => !query || skill.toLowerCase().includes(query));
    }, [availableSkills, selectedSkills, skillSearch]);
    const filteredProfiles = useMemo(() => {
        const query = debouncedSearchPeople.trim().toLowerCase();
        const hasSkillFilters = selectedSkills.length > 0;

        return sourceProfiles.filter((item) => {
            const githubUsername = (item.user.githubUsername || '').toLowerCase();
            const leetCodeUsername = leetcodeApi.normalizeUsername(item.user.leetCodeUrl || '').toLowerCase();
            const skillTags = (item.user.skillTags || item.user.skills || []).map((skill) => skill.toLowerCase());
            const haystack = [
                item.user.name,
                item.user.moodleId,
                item.user.email,
                item.user.branch,
                item.user.year,
                githubUsername,
                leetCodeUsername,
                ...skillTags,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            const matchesQuery = !query || haystack.includes(query);
            const matchesSkills = !hasSkillFilters || selectedSkills.every((skill) => skillTags.includes(skill.toLowerCase()));

            return matchesQuery && matchesSkills;
        });
    }, [debouncedSearchPeople, selectedSkills, sourceProfiles]);

    useEffect(() => {
        const hasRemoteFilters = debouncedSearchPeople.trim().length > 0 || selectedSkills.length > 0;
        if (!hasRemoteFilters) {
            setLiveSearchProfiles(null);
            setIsSearching(false);
            return;
        }

        let cancelled = false;
        setIsSearching(true);

        userApi.searchUsers(debouncedSearchPeople, 100, selectedSkills)
            .then((response) => {
                if (cancelled) return;

                const remoteProfiles = (Array.isArray(response.data) ? response.data : [])
                    .filter((user) => isDiscoverableProfile(user))
                    .map((user) => {
                        const fallbackStats = statsByUserId.get(user.id) || {
                            projectCount: Number(user.activeProjectsCount ?? 0),
                            topTeamSize: 0,
                            latestActivityTs: 0,
                        };

                        return {
                            user,
                            projectCount: fallbackStats.projectCount,
                            topTeamSize: fallbackStats.topTeamSize,
                            latestActivityTs: fallbackStats.latestActivityTs,
                        } satisfies DiscoverProfile;
                    })
                    .sort((a, b) => b.projectCount - a.projectCount || b.latestActivityTs - a.latestActivityTs);

                setLiveSearchProfiles(remoteProfiles);
            })
            .catch(() => {
                if (cancelled) return;
                setLiveSearchProfiles([]);
            })
            .finally(() => {
                if (!cancelled) {
                    setIsSearching(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [debouncedSearchPeople, selectedSkills, statsByUserId]);

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
            .map((item) => leetcodeApi.normalizeUsername(item.user.leetCodeUrl || '').toLowerCase())
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

    const toggleSkill = (skill: string) => {
        setSelectedSkills((prev) =>
            prev.includes(skill)
                ? prev.filter((item) => item !== skill)
                : [...prev, skill]
        );
    };

    return (
        <div className="space-y-6">
            <Breadcrumbs items={[{ label: 'Discover' }]} />

            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Discover Profiles</h1>
                <p className="text-slate-600">
                    Explore students and admins with their academic details, project activity, GitHub, and LeetCode links.
                </p>
            </div>

            <div className="flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex-1">
                    <Input
                        placeholder="Search people by name, Moodle ID, email, GitHub, LeetCode, or skill..."
                        value={searchPeople}
                        onChange={(event) => setSearchPeople(event.target.value)}
                        icon={<Search className="h-4 w-4" />}
                    />
                </div>
                <Button
                    type="button"
                    variant={showSkillFilters || selectedSkills.length > 0 ? 'secondary' : 'outline'}
                    size="icon"
                    onClick={() => setShowSkillFilters((prev) => !prev)}
                    aria-label="Toggle skill filters"
                >
                    <Filter className="h-4 w-4" />
                </Button>
            </div>

            {(showSkillFilters || selectedSkills.length > 0) && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900">Filter students by skill tags</p>
                        {selectedSkills.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setSelectedSkills([])}
                                className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-700"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                    <div className="mb-3">
                        <Input
                            placeholder="Search from 50 popular tech skills and profile tags..."
                            value={skillSearch}
                            onChange={(event) => setSkillSearch(event.target.value)}
                            icon={<Search className="h-4 w-4" />}
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {filteredAvailableSkills.map((skill) => {
                            const isSelected = selectedSkills.includes(skill);
                            return (
                                <button key={skill} type="button" onClick={() => toggleSkill(skill)}>
                                    <Badge variant={isSelected ? 'default' : 'outline'} className="cursor-pointer">
                                        {skill}
                                    </Badge>
                                </button>
                            );
                        })}
                        {filteredAvailableSkills.length === 0 && (
                            <p className="text-sm text-slate-500">No skill tags match your current filter.</p>
                        )}
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="flex h-56 items-center justify-center">
                    <Spinner size="lg" />
                </div>
            ) : error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>
            ) : isSearching ? (
                <div className="flex h-40 items-center justify-center">
                    <Spinner size="lg" />
                </div>
            ) : filteredProfiles.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
                    <p className="font-semibold text-slate-800">No people found</p>
                    <p className="mt-1 text-sm text-slate-500">Try another search keyword for name, Moodle ID, email, GitHub, LeetCode, or skill.</p>
                </div>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProfiles.map((item) => {
                        const githubUsername = (item.user.githubUsername || '').trim();
                        const leetCodeUsername = leetcodeApi.normalizeUsername(item.user.leetCodeUrl || '');
                        const isCurrentUser = item.user.id === currentUserId;
                        const githubStats = githubUsername ? githubStatsMap[githubUsername.toLowerCase()] : undefined;
                        const leetCodeStats = leetCodeUsername ? leetCodeStatsMap[leetCodeUsername.toLowerCase()] : undefined;

                        return (
                            <Link
                                key={item.user.id}
                                href={`/discover/${item.user.moodleId || item.user.id}`}
                                className="block rounded-2xl transition-transform duration-200 hover:-translate-y-0.5"
                            >
                            <article className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300">
                                <div className="mb-4 flex items-center gap-3">
                                    <Avatar
                                        src={item.user.avatarUrl}
                                        fallback={(item.user.name || 'U').charAt(0).toUpperCase()}
                                        className="h-11 w-11 border border-teal-200 bg-teal-100 text-sm font-bold text-teal-700"
                                    />
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="truncate text-base font-semibold text-slate-900">{item.user.name}</p>
                                            {isCurrentUser && (
                                                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                                                    You
                                                </span>
                                            )}
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                                                {item.user.role === 'ADMIN' ? 'Admin' : 'Student'}
                                            </Badge>
                                        </div>
                                        <p className="truncate text-xs text-slate-500">{item.user.email}</p>
                                        {item.user.moodleId ? (
                                            <p className="truncate text-xs text-slate-500">Moodle ID: {item.user.moodleId}</p>
                                        ) : null}
                                        {(item.user.department || item.user.branch || item.user.academicStatus || item.user.year) ? (
                                            <p className="truncate text-xs text-slate-500">
                                                {formatAcademicProfile(item.user.department || item.user.branch, item.user.academicStatus || item.user.year)}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="mb-4 flex items-center gap-4 text-xs text-slate-600">
                                    <span className="inline-flex items-center gap-1">
                                        <Users className="h-3.5 w-3.5" />
                                        {item.projectCount} active project{item.projectCount === 1 ? '' : 's'}
                                    </span>
                                </div>

                                <div className="mb-4 flex flex-wrap gap-2">
                                    {(item.user.skillTags || item.user.skills || []).slice(0, 4).map((skill) => (
                                        <Badge key={skill} variant="outline" className="font-normal">
                                            {skill}
                                        </Badge>
                                    ))}
                                    {(item.user.skillTags || item.user.skills || []).length === 0 && (
                                        <span className="text-xs text-slate-400">No skill tags added yet</span>
                                    )}
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
