'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, GitFork, Rocket, Star } from 'lucide-react';
import { githubApi, GitHubRepo } from '@/api/github';
import { projectApi } from '@/api/project';
import { Project } from '@/types';
import { Spinner } from '@/components/ui/Spinner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useUser } from '@/hooks/useUser';

function normalizeGithubRepoUrl(url?: string): string {
    return (url || '').trim().replace(/\/+$/, '').toLowerCase();
}

export default function MyProjectsPage() {
    const { profile } = useUser();
    const oauthSession = githubApi.getStoredOAuthSession();
    const effectiveGithubUsername = profile?.githubUsername || oauthSession?.githubUsername;

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isGithubLoading, setIsGithubLoading] = useState(false);
    const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([]);
    const [myProjects, setMyProjects] = useState<Project[]>([]);
    const [updatingRepoId, setUpdatingRepoId] = useState<number | null>(null);

    const loadMyProjects = useCallback(async () => {
        try {
            const response = await projectApi.getMyProjects();
            setMyProjects(Array.isArray(response.data) ? response.data : []);
        } catch {
            setMyProjects([]);
        }
    }, []);

    const loadGithubRepos = useCallback(async () => {
        if (!effectiveGithubUsername) {
            setGithubRepos([]);
            return;
        }

        try {
            setIsGithubLoading(true);
            const response = await githubApi.getRepos(effectiveGithubUsername);
            const repos = Array.isArray(response) ? response : [];
            setGithubRepos(repos.slice(0, 18));
        } catch {
            setGithubRepos([]);
        } finally {
            setIsGithubLoading(false);
        }
    }, [effectiveGithubUsername]);

    const loadPageData = useCallback(async (withRefresh = false) => {
        if (withRefresh) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }

        try {
            await Promise.all([loadMyProjects(), loadGithubRepos()]);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [loadGithubRepos, loadMyProjects]);

    useEffect(() => {
        void loadPageData();
    }, [loadPageData]);

    const projectByGithubUrl = useMemo(() => {
        const map = new Map<string, Project>();
        for (const project of myProjects) {
            const key = normalizeGithubRepoUrl(project.githubUrl);
            if (!key) continue;

            const current = map.get(key);
            if (!current) {
                map.set(key, project);
                continue;
            }

            if (current.status !== 'ACTIVE' && project.status === 'ACTIVE') {
                map.set(key, project);
            }
        }
        return map;
    }, [myProjects]);

    const getRepoActiveState = useCallback(
        (repo: GitHubRepo) => {
            const key = normalizeGithubRepoUrl(repo.html_url);
            const linkedProject = projectByGithubUrl.get(key);
            return linkedProject?.status === 'ACTIVE';
        },
        [projectByGithubUrl]
    );

    const activeCount = useMemo(
        () => githubRepos.filter((repo) => getRepoActiveState(repo)).length,
        [getRepoActiveState, githubRepos]
    );

    const handleToggleRepoActive = async (repo: GitHubRepo) => {
        const repoKey = normalizeGithubRepoUrl(repo.html_url);
        const linkedProject = projectByGithubUrl.get(repoKey);
        const currentlyActive = linkedProject?.status === 'ACTIVE';

        try {
            setUpdatingRepoId(repo.id);

            if (linkedProject) {
                await projectApi.updateProject(linkedProject.id, {
                    status: currentlyActive ? 'IN_PROGRESS' : 'ACTIVE',
                });
            } else {
                await projectApi.createProject({
                    title: repo.name,
                    description: repo.description || `Repository synced from GitHub (${repo.full_name}).`,
                    techStack: repo.language ? [repo.language] : [],
                    githubUrl: repo.html_url,
                    status: 'ACTIVE',
                    teamCapacity: 5,
                });
            }

            await loadPageData(true);
        } catch {
            // Keep UX minimal; failed sync/toggle actions are ignored for now.
        } finally {
            setUpdatingRepoId(null);
        }
    };

    return (
        <div className="space-y-6">
            <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'My Projects' }]} />

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Projects</h1>
                        <p className="mt-1 text-slate-600">
                            Projects are fetched from GitHub. Mark repos as active to make them visible in student feeds.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            <Rocket className="h-3.5 w-3.5" />
                            {activeCount} Active
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {githubRepos.length} GitHub
                        </span>
                        <button
                            type="button"
                            onClick={() => void loadPageData(true)}
                            disabled={isRefreshing || isLoading}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isRefreshing ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-2xl font-semibold text-slate-900">GitHub Repositories</h2>
                    <span className="text-sm text-slate-500">
                        {effectiveGithubUsername ? `@${effectiveGithubUsername}` : 'GitHub not connected'}
                    </span>
                </div>

                {isLoading || isGithubLoading ? (
                    <div className="flex h-28 items-center justify-center">
                        <Spinner />
                    </div>
                ) : !effectiveGithubUsername ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                        Connect GitHub from your profile to fetch repositories.
                    </div>
                ) : githubRepos.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                        No repositories found for this GitHub account.
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {githubRepos.map((repo) => {
                            const isActive = getRepoActiveState(repo);
                            const isUpdating = updatingRepoId === repo.id;

                            return (
                                <article
                                    key={repo.id}
                                    className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition-colors hover:border-slate-300 hover:bg-white"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="line-clamp-1 text-2xl font-semibold text-slate-900">{repo.name}</h3>
                                        <a
                                            href={repo.html_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                            aria-label={`Open ${repo.name} on GitHub`}
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    </div>

                                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                                        {repo.description || 'Repository from your connected GitHub profile.'}
                                    </p>

                                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                        {repo.language && <span>{repo.language}</span>}
                                        <span className="inline-flex items-center gap-1">
                                            <Star className="h-3.5 w-3.5" />
                                            {repo.stargazers_count}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <GitFork className="h-3.5 w-3.5" />
                                            {repo.forks_count}
                                        </span>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between">
                                        <span
                                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                isActive
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-slate-200 text-slate-700'
                                            }`}
                                        >
                                            {isActive ? 'ACTIVE' : 'NOT ACTIVE'}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() => void handleToggleRepoActive(repo)}
                                            disabled={isUpdating}
                                            className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                                isActive
                                                    ? 'border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                    : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                            }`}
                                        >
                                            {isUpdating ? 'Updating...' : isActive ? 'Mark Not Active' : 'Mark Active'}
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
