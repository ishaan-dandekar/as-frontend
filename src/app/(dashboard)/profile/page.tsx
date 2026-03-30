'use client';

import { useUser } from '@/hooks/useUser';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { Spinner } from '@/components/ui/Spinner';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { useProjects } from '@/hooks/useProjects';
import { GitHubStats } from '@/components/profile/GitHubStats';
import { LeetCodeStats } from '@/components/profile/LeetCodeStats';
import { ProfileIntegrations } from '@/components/profile/ProfileIntegrations';
import { Project } from '@/types';
import { githubApi, GitHubRepo } from '@/api/github';
import { leetcodeApi } from '@/api/leetcode';
import { projectApi } from '@/api/project';
import { ExternalLink, GitFork, Plus, RefreshCw, Star, X } from 'lucide-react';
import Link from 'next/link';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const router = useRouter();
    const storedOAuthSession = githubApi.getStoredOAuthSession();
    const storedLeetCodeUsername = leetcodeApi.getStoredUsername();
    const { profile, isLoading: userLoading, updateProfile } = useUser();
    const { projects, isLoading: projectsLoading, refetch } = useProjects();
    
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
    
    // Computed values: null means explicitly disconnected, undefined means use profile default
    const effectiveGithubUsername = githubUsername === null ? undefined : (githubUsername ?? profile?.githubUsername);
    const effectiveLeetCodeUsername = leetCodeUsername === null ? undefined : (leetCodeUsername ?? profile?.leetCodeUrl);
    const normalizedGithubUsername = (effectiveGithubUsername || '').trim().toLowerCase();
    const profileId = profile?.id;
    const visibleProjects = (Array.isArray(projects) ? projects : [])
        .filter((project): project is Project => Boolean(project && typeof project === 'object' && (project as Project).id))
        .filter((project) => !profileId || project.ownerId === profileId);

    const pinnedRepos = pinnedRepoIds
        .map((repoId) => allGithubRepos.find((repo) => String(repo.id) === repoId))
        .filter((repo): repo is GitHubRepo => Boolean(repo));

    const availableReposToPin = allGithubRepos.filter(
        (repo) => !pinnedRepoIds.includes(String(repo.id))
    );

    const showcaseTotal = visibleProjects.length > 0 ? visibleProjects.length : pinnedRepos.length;

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
        router.replace('/login');
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
                        followers={profile.followersCount}
                        following={profile.followingCount}
                        projects={profile.projectsCount}
                    />

                    <GitHubStats username={effectiveGithubUsername} />
                    <LeetCodeStats username={effectiveLeetCodeUsername} />
                </aside>

                <section className="space-y-6 lg:col-span-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <ProfileIntegrations
                            githubUsername={effectiveGithubUsername}
                            leetCodeUsername={effectiveLeetCodeUsername}
                            onGithubConnect={(username) => setGithubUsername(username)}
                            onLeetCodeConnect={(username) => {
                                const normalized = leetcodeApi.normalizeUsername(username);
                                setLeetCodeUsername(normalized);
                                leetcodeApi.setStoredUsername(normalized);
                                void updateProfile({ leetCodeUrl: username });
                            }}
                            onGithubDisconnect={() => setGithubUsername(null)}
                            onLeetCodeDisconnect={() => {
                                setLeetCodeUsername(null);
                                leetcodeApi.clearStoredUsername();
                                void updateProfile({ leetCodeUrl: '' });
                            }}
                        />
                    </div>

                    <div id="my-projects" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="font-display text-2xl font-bold text-slate-900">My Projects</h2>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                                {showcaseTotal} Total
                            </span>
                        </div>

                        {projectsLoading || (visibleProjects.length === 0 && isGithubShowcaseLoading) ? (
                            <div className="flex h-32 items-center justify-center">
                                <Spinner />
                            </div>
                        ) : visibleProjects.length === 0 && pinnedRepos.length === 0 && allGithubRepos.length === 0 ? (
                            <div className="flex h-44 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                                <p className="text-slate-500">No project showcase yet. Publish your first project to appear here.</p>
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
                                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                                    <p className="text-sm font-semibold text-slate-800">Pinned showcase settings</p>
                                    <p className="mt-1 text-xs text-slate-500">Choose projects of your choice and write your own description for each pinned card.</p>

                                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                        <select
                                            value={selectedRepoId}
                                            onChange={(e) => setSelectedRepoId(e.target.value)}
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400"
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
                                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Pin Project
                                        </button>
                                        <button
                                            type="button"
                                            onClick={refreshRepoOptions}
                                            disabled={isRefreshingRepoOptions}
                                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <RefreshCw className={`h-4 w-4 ${isRefreshingRepoOptions ? 'animate-spin' : ''}`} />
                                            Refresh Repos
                                        </button>
                                    </div>
                                </div>

                                {pinnedRepos.length === 0 ? (
                                    <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                                        <p className="text-slate-600">No pinned projects yet. Select a repository above to start your custom showcase.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-6 sm:grid-cols-2">
                                        {pinnedRepos.map((repo) => {
                                            const repoId = String(repo.id);
                                            const customDescription = repoDescriptions[repoId] || '';

                                            return (
                                                <div key={repo.id} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 transition-shadow hover:shadow-md">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <h3 className="text-lg font-semibold text-slate-900 line-clamp-1">{repo.name}</h3>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUnpinRepo(repoId)}
                                                                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-rose-600"
                                                                aria-label={`Unpin ${repo.name}`}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                            <Link
                                                                href={repo.html_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
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
                                                        className="mt-2 min-h-20 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400"
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
