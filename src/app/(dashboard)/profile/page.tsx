'use client';

import dynamic from 'next/dynamic';
import { useUser } from '@/hooks/useUser';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { Spinner } from '@/components/ui/Spinner';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { Project } from '@/types';
import { githubApi, GitHubRepo, GitHubStats as GitHubStatsType } from '@/api/github';
import { leetcodeApi } from '@/api/leetcode';
import { projectApi } from '@/api/project';
import { ExternalLink, GitFork, Plus, RefreshCw, Star, X } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const GitHubStats = dynamic(
    () => import('@/components/profile/GitHubStats').then((mod) => mod.GitHubStats),
    {
        loading: () => <div className="surface-elevated h-56 animate-pulse rounded-2xl" />,
    }
);

const LeetCodeStats = dynamic(
    () => import('@/components/profile/LeetCodeStats').then((mod) => mod.LeetCodeStats),
    {
        loading: () => <div className="surface-elevated h-56 animate-pulse rounded-2xl" />,
    }
);

export default function ProfilePage() {
    const router = useRouter();
    const storedOAuthSession = githubApi.getStoredOAuthSession();
    const storedLeetCodeUsername = leetcodeApi.getStoredUsername();
    const { profile, isLoading: userLoading } = useUser();
    
    // State for connected profiles - use null to indicate explicitly disconnected
    const [githubUsername, setGithubUsername] = useState<string | null | undefined>(storedOAuthSession?.githubUsername || undefined);
    const [leetCodeUsername, setLeetCodeUsername] = useState<string | null | undefined>(storedLeetCodeUsername || undefined);
    const [allGithubRepos, setAllGithubRepos] = useState<GitHubRepo[]>([]);
    const [isGithubShowcaseLoading, setIsGithubShowcaseLoading] = useState(false);
    const [pinnedRepoIds, setPinnedRepoIds] = useState<string[]>([]);
    const [repoDescriptions, setRepoDescriptions] = useState<Record<string, string>>({});
    const [selectedRepoId, setSelectedRepoId] = useState('');
    const [isRefreshingRepoOptions, setIsRefreshingRepoOptions] = useState(false);
    const [isPinnedStateHydrated, setIsPinnedStateHydrated] = useState(false);
    const [activatingProjectId, setActivatingProjectId] = useState<string | null>(null);
    const [liveGithubStats, setLiveGithubStats] = useState<GitHubStatsType | null>(null);
    
    // Computed values: null means explicitly disconnected, undefined means use profile default
    const effectiveGithubUsername = githubUsername === null ? undefined : (githubUsername ?? profile?.githubUsername);
    const effectiveLeetCodeUsername = leetCodeUsername === null ? undefined : (leetCodeUsername ?? profile?.leetCodeUrl);
    const normalizedGithubUsername = (effectiveGithubUsername || '').trim().toLowerCase();
    const profileId = profile?.id;
    const { data: visibleProjects = [], isLoading: projectsLoading, refetch } = useQuery({
        queryKey: ['profile-projects', profileId],
        queryFn: () => projectApi.getMyProjects().then((response) => {
            const items = Array.isArray(response.data) ? response.data : [];
            return items
                .filter((project): project is Project => Boolean(project && typeof project === 'object' && project.id))
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        }),
        enabled: !!profileId,
    });

    const pinnedRepos = pinnedRepoIds
        .map((repoId) => allGithubRepos.find((repo) => String(repo.id) === repoId))
        .filter((repo): repo is GitHubRepo => Boolean(repo));

    const availableReposToPin = allGithubRepos.filter(
        (repo) => !pinnedRepoIds.includes(String(repo.id))
    );

    const totalProjectsCount = Number(
        liveGithubStats?.user?.public_repos
        ?? liveGithubStats?.repos
        ?? (effectiveGithubUsername ? allGithubRepos.length : undefined)
        ?? profile?.projectsCount
        ?? visibleProjects.length
        ?? 0
    );
    const activeProjectsCount = Number(
        profile?.activeProjectsCount ?? visibleProjects.filter((project) => project.status === 'ACTIVE').length
    );

    const handleToggleProjectActive = async (project: Project) => {
        try {
            setActivatingProjectId(project.id);
            const nextStatus = project.status === 'ACTIVE' ? 'IN_PROGRESS' : 'ACTIVE';
            await projectApi.updateProject(project.id, { status: nextStatus });
            await refetch();
        } catch {
            // Keep UX minimal; failed status updates are ignored silently for now.
        } finally {
            setActivatingProjectId(null);
        }
    };

    useEffect(() => {
        if (userLoading || profile) return;
        router.replace('/');
    }, [profile, router, userLoading]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const params = new URLSearchParams(window.location.search);
        if (params.get('github_oauth') !== 'success') return;

        const sessionId = params.get('session_id');
        const githubUsernameFromQuery = params.get('github_username');

        if (sessionId && githubUsernameFromQuery) {
            githubApi.setStoredOAuthSession({
                sessionId,
                githubUsername: githubUsernameFromQuery,
            });
            setGithubUsername(githubUsernameFromQuery);
        }

        window.history.replaceState({}, document.title, window.location.pathname);

        if (window.opener && !window.opener.closed) {
            window.close();
        }
    }, []);

    useEffect(() => {
        if (!profile?.leetCodeUrl) return;

        const normalized = leetcodeApi.normalizeUsername(profile.leetCodeUrl);
        if (!normalized) return;

        setLeetCodeUsername((prev) => prev ?? normalized);
        leetcodeApi.setStoredUsername(normalized);
    }, [profile?.leetCodeUrl]);

    useEffect(() => {
        if (!effectiveGithubUsername) {
            setLiveGithubStats(null);
            return;
        }

        let cancelled = false;

        githubApi.getStats(effectiveGithubUsername)
            .then((stats) => {
                if (!cancelled) {
                    setLiveGithubStats(stats);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setLiveGithubStats(null);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [effectiveGithubUsername]);

    useEffect(() => {
        if (visibleProjects.length > 0 || !effectiveGithubUsername) {
            setAllGithubRepos([]);
            setPinnedRepoIds([]);
            setRepoDescriptions({});
            setSelectedRepoId('');
            setIsGithubShowcaseLoading(false);
            setIsPinnedStateHydrated(false);
            return;
        }

        const pinnedStorageKey = `profile_pinned_github_repos_${normalizedGithubUsername}`;
        const descriptionsStorageKey = `profile_pinned_github_repo_descriptions_${normalizedGithubUsername}`;

        let cancelled = false;
        setIsGithubShowcaseLoading(true);

        githubApi
            .getRepos(effectiveGithubUsername)
            .then((repos) => {
                if (cancelled) return;

                setAllGithubRepos(repos);

                let nextPinnedRepoIds: string[] = [];
                let hasSavedPinnedRepoState = false;
                try {
                    const storedPinned = localStorage.getItem(pinnedStorageKey);
                    if (storedPinned !== null) {
                        hasSavedPinnedRepoState = true;
                        const parsed = JSON.parse(storedPinned);
                        if (Array.isArray(parsed)) {
                            nextPinnedRepoIds = parsed
                                .map((repoId) => String(repoId))
                                .filter((repoId) => repos.some((repo) => String(repo.id) === repoId));
                        }
                    }
                } catch {
                    nextPinnedRepoIds = [];
                }

                if (!hasSavedPinnedRepoState) {
                    nextPinnedRepoIds = repos.slice(0, 4).map((repo) => String(repo.id));
                }

                setPinnedRepoIds(nextPinnedRepoIds);

                try {
                    const storedDescriptions = localStorage.getItem(descriptionsStorageKey);
                    if (storedDescriptions) {
                        const parsed = JSON.parse(storedDescriptions) as Record<string, string>;
                        if (parsed && typeof parsed === 'object') {
                            setRepoDescriptions(parsed);
                        }
                    }
                } catch {
                    setRepoDescriptions({});
                }

                setSelectedRepoId('');
                setIsPinnedStateHydrated(true);
            })
            .catch(() => {
                if (cancelled) return;
                setAllGithubRepos([]);
                setPinnedRepoIds([]);
                setRepoDescriptions({});
                setSelectedRepoId('');
                setIsPinnedStateHydrated(true);
            })
            .finally(() => {
                if (cancelled) return;
                setIsGithubShowcaseLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [effectiveGithubUsername, normalizedGithubUsername, visibleProjects.length]);

    useEffect(() => {
        if (!effectiveGithubUsername || visibleProjects.length > 0 || !isPinnedStateHydrated) return;
        localStorage.setItem(
            `profile_pinned_github_repos_${normalizedGithubUsername}`,
            JSON.stringify(pinnedRepoIds)
        );
    }, [effectiveGithubUsername, normalizedGithubUsername, pinnedRepoIds, visibleProjects.length, isPinnedStateHydrated]);

    useEffect(() => {
        if (!effectiveGithubUsername || visibleProjects.length > 0 || !isPinnedStateHydrated) return;
        localStorage.setItem(
            `profile_pinned_github_repo_descriptions_${normalizedGithubUsername}`,
            JSON.stringify(repoDescriptions)
        );
    }, [effectiveGithubUsername, normalizedGithubUsername, repoDescriptions, visibleProjects.length, isPinnedStateHydrated]);

    const handlePinSelectedRepo = () => {
        if (!selectedRepoId) return;
        setPinnedRepoIds((prev) => {
            if (prev.includes(selectedRepoId)) return prev;
            return [selectedRepoId, ...prev];
        });
        setSelectedRepoId('');
    };

    const handleUnpinRepo = (repoId: string) => {
        setPinnedRepoIds((prev) => prev.filter((id) => id !== repoId));
    };

    const refreshRepoOptions = async () => {
        if (!effectiveGithubUsername || isRefreshingRepoOptions) return;

        try {
            setIsRefreshingRepoOptions(true);
            const repos = await githubApi.getRepos(effectiveGithubUsername);
            setAllGithubRepos(repos);
        } finally {
            setIsRefreshingRepoOptions(false);
        }
    };

    const overviewFollowers = Number(liveGithubStats?.user?.followers ?? profile?.followersCount ?? 0);
    const overviewFollowing = Number(liveGithubStats?.user?.following ?? profile?.followingCount ?? 0);
    const overviewProjects = totalProjectsCount;

    if (userLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Breadcrumbs items={[{ label: 'Profile' }]} />
            <ProfileHeader user={profile} isOwnProfile={true} />

            <div className="grid gap-6 lg:grid-cols-3">
                <aside className="space-y-6 lg:col-span-1">
                    <ProfileStats
                        followers={overviewFollowers}
                        following={overviewFollowing}
                        projects={overviewProjects}
                        activeProjects={activeProjectsCount}
                    />

                    <GitHubStats username={effectiveGithubUsername} />
                    <LeetCodeStats username={effectiveLeetCodeUsername} />
                </aside>

                <section className="space-y-6 lg:col-span-2">
                    <div id="my-projects" className="surface-elevated rounded-2xl p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="font-display text-app text-2xl font-bold">My Projects</h2>
                            <span className="border-app bg-surface-strong text-app-muted rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]">
                                {totalProjectsCount} Total
                            </span>
                        </div>

                        {projectsLoading || (visibleProjects.length === 0 && isGithubShowcaseLoading) ? (
                            <div className="flex h-32 items-center justify-center">
                                <Spinner />
                            </div>
                        ) : visibleProjects.length === 0 && pinnedRepos.length === 0 && allGithubRepos.length === 0 ? (
                            <div className="border-app bg-surface-strong flex h-44 flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center">
                                <p className="text-app-muted">No project showcase yet. Publish your first project to appear here.</p>
                            </div>
                        ) : visibleProjects.length > 0 ? (
                            <div className="grid gap-6 sm:grid-cols-2">
                                {visibleProjects.map((project) => (
                                    <ProjectCard
                                        key={project.id}
                                        project={project}
                                        onToggleActive={project.ownerId === profileId ? handleToggleProjectActive : undefined}
                                        isToggleActiveLoading={activatingProjectId === project.id}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="border-app bg-surface-strong rounded-xl border p-4">
                                    <p className="text-app text-sm font-semibold">Pinned showcase settings</p>
                                    <p className="text-app-muted mt-1 text-xs">Choose projects of your choice and write your own description for each pinned card.</p>

                                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                        <select
                                            value={selectedRepoId}
                                            onChange={(e) => setSelectedRepoId(e.target.value)}
                                            className="border-app bg-surface text-app w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[color:var(--brand)]"
                                        >
                                            <option value="">Select a GitHub repo to pin</option>
                                            {availableReposToPin.map((repo) => (
                                                <option key={repo.id} value={String(repo.id)}>
                                                    {repo.full_name}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={handlePinSelectedRepo}
                                            disabled={!selectedRepoId}
                                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Pin Project
                                        </button>
                                        <button
                                            type="button"
                                            onClick={refreshRepoOptions}
                                            disabled={isRefreshingRepoOptions}
                                            className="border-app bg-surface text-app inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <RefreshCw className={`h-4 w-4 ${isRefreshingRepoOptions ? 'animate-spin' : ''}`} />
                                            Refresh Repos
                                        </button>
                                    </div>
                                </div>

                                {pinnedRepos.length === 0 ? (
                                    <div className="border-app bg-surface-strong flex h-32 flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center">
                                        <p className="text-app-soft">No pinned projects yet. Select a repository above to start your custom showcase.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-6 sm:grid-cols-2">
                                        {pinnedRepos.map((repo) => {
                                            const repoId = String(repo.id);
                                            const customDescription = repoDescriptions[repoId] || '';

                                            return (
                                                <div key={repo.id} className="border-app bg-surface-strong rounded-2xl border p-5 transition-shadow hover:shadow-md">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <h3 className="text-app line-clamp-1 text-lg font-semibold">{repo.name}</h3>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUnpinRepo(repoId)}
                                                                className="text-app-muted hover:bg-surface rounded-lg p-1.5 hover:text-rose-600"
                                                                aria-label={`Unpin ${repo.name}`}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                            <Link
                                                                href={repo.html_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-app-muted hover:bg-surface hover:text-app rounded-lg p-1.5"
                                                            >
                                                                <ExternalLink className="h-4 w-4" />
                                                            </Link>
                                                        </div>
                                                    </div>

                                                    <textarea
                                                        value={customDescription}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            setRepoDescriptions((prev) => ({
                                                                ...prev,
                                                                [repoId]: value,
                                                            }));
                                                        }}
                                                        placeholder={repo.description || 'Add your own showcase description for this pinned project'}
                                                        className="border-app bg-surface text-app mt-2 min-h-20 w-full resize-y rounded-lg border px-3 py-2 text-sm outline-none focus:border-[color:var(--brand)]"
                                                    />

                                                    <div className="mt-4 flex flex-wrap gap-2">
                                                        {repo.language && (
                                                            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                                                                {repo.language}
                                                            </span>
                                                        )}
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                                                            <Star className="h-3.5 w-3.5" />
                                                            {repo.stargazers_count}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                                                            <GitFork className="h-3.5 w-3.5" />
                                                            {repo.forks_count}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
