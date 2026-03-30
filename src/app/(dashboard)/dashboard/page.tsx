'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useProjects } from '@/hooks/useProjects';
import { User, Calendar, Rocket, Trophy, ExternalLink, Star, GitFork } from 'lucide-react';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { Project, Team } from '@/types';
import { useUser } from '@/hooks/useUser';
import { projectApi, ProjectJoinRequestItem } from '@/api/project';
import { teamApi } from '@/api/team';
import { githubApi, GitHubRepo } from '@/api/github';
import { leetcodeApi } from '@/api/leetcode';
import { useEffect, useMemo, useState } from 'react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

function normalizeToken(value: string): string {
    return value.trim().toLowerCase();
}

function extractKeywordTokens(value: string): string[] {
    return value
        .toLowerCase()
        .split(/[^a-z0-9+#.-]+/g)
        .map((token) => token.trim())
        .filter((token) => token.length >= 3);
}

export default function DashboardPage() {
    const { projects, isLoading: projectsLoading } = useProjects();
    const { profile } = useUser();
    const oauthSession = githubApi.getStoredOAuthSession();
    const storedLeetCodeUsername = leetcodeApi.getStoredUsername();
    const effectiveGithubUsername = profile?.githubUsername || oauthSession?.githubUsername;
    const effectiveLeetCodeUsername = leetcodeApi.normalizeUsername(profile?.leetCodeUrl || storedLeetCodeUsername || '');
    const [joinRequests, setJoinRequests] = useState<ProjectJoinRequestItem[]>([]);
    const [joinRequestLoading, setJoinRequestLoading] = useState(true);
    const [teams, setTeams] = useState<Team[]>([]);
    const [teamsLoading, setTeamsLoading] = useState(true);
    const [isResponding, setIsResponding] = useState<string | null>(null);
    const [recommendationSignals, setRecommendationSignals] = useState<string[]>([]);
    const [recommendationSignalsLoading, setRecommendationSignalsLoading] = useState(false);
    const [myGithubProjects, setMyGithubProjects] = useState<GitHubRepo[]>([]);
    const validProjects = (Array.isArray(projects) ? projects : []).filter(
        (project): project is Project => Boolean(project && typeof project === 'object' && (project as Project).id)
    );
    const profileId = profile?.id;
    const myListedProjects = useMemo(
        () => (profileId ? validProjects.filter((project) => project.ownerId === profileId) : []),
        [profileId, validProjects]
    );
    const activeProjectsCount = useMemo(
        () => myListedProjects.filter((project) => project.status === 'ACTIVE').length,
        [myListedProjects]
    );
    const pinnedProjects = useMemo(
        () => validProjects.filter((project) => project.isBookmarked),
        [validProjects]
    );

    const pinnedProjectSignals = useMemo(() => {
        const signals = new Set<string>();

        pinnedProjects.slice(0, 8).forEach((project) => {
            (project.techStack || []).forEach((tech) => signals.add(normalizeToken(tech)));
            extractKeywordTokens(`${project.title} ${project.description}`).forEach((token) => signals.add(token));
        });

        return Array.from(signals).slice(0, 28);
    }, [pinnedProjects]);

    const recommendedProjects = useMemo(() => {
        const candidates = validProjects.filter((project) => !profileId || project.ownerId !== profileId);
        if (candidates.length === 0) return [];

        const signalSet = new Set(
            [...pinnedProjectSignals, ...recommendationSignals].map(normalizeToken)
        );
        const hasSignals = signalSet.size > 0;

        const scored = candidates.map((project) => {
            let score = 0;

            if (project.status === 'ACTIVE') score += 3;
            score += (project.teamMemberCount || 0) * 0.5;

            if (hasSignals) {
                const techTokens = (project.techStack || []).map(normalizeToken);
                score += techTokens.reduce((acc, token) => acc + (signalSet.has(token) ? 5 : 0), 0);

                const searchableText = `${project.title} ${project.description}`.toLowerCase();
                signalSet.forEach((signal) => {
                    if (signal.length > 3 && searchableText.includes(signal)) {
                        score += 1;
                    }
                });
            }

            const updatedTs = new Date(project.updatedAt).getTime();
            return {
                project,
                score,
                updatedTs: Number.isNaN(updatedTs) ? 0 : updatedTs,
            };
        });

        scored.sort((a, b) => b.score - a.score || b.updatedTs - a.updatedTs);
        return scored.slice(0, 4).map((item) => item.project);
    }, [pinnedProjectSignals, profileId, recommendationSignals, validProjects]);

    const displayedRecommendedProjects = useMemo(() => {
        if (recommendedProjects.length > 0) return recommendedProjects;
        if (myListedProjects.length > 0) {
            return [...myListedProjects]
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .slice(0, 4);
        }
        return [];
    }, [myListedProjects, recommendedProjects]);

    useEffect(() => {
        let cancelled = false;

        const loadJoinRequests = async () => {
            try {
                setJoinRequestLoading(true);
                const response = await projectApi.getJoinRequests();
                if (!cancelled) {
                    setJoinRequests(response.data?.items || []);
                }
            } catch {
                if (!cancelled) {
                    setJoinRequests([]);
                }
            } finally {
                if (!cancelled) {
                    setJoinRequestLoading(false);
                }
            }
        };

        loadJoinRequests();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        const loadTeams = async () => {
            try {
                setTeamsLoading(true);
                const response = await teamApi.getMyTeams();
                if (!cancelled) {
                    setTeams(Array.isArray(response.data) ? response.data : []);
                }
            } catch {
                if (!cancelled) {
                    setTeams([]);
                }
            } finally {
                if (!cancelled) {
                    setTeamsLoading(false);
                }
            }
        };

        loadTeams();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!effectiveGithubUsername || typeof window === 'undefined') {
            setRecommendationSignals([]);
            setMyGithubProjects([]);
            setRecommendationSignalsLoading(false);
            return;
        }

        const normalizedGithubUsername = effectiveGithubUsername.trim().toLowerCase();
        if (!normalizedGithubUsername) {
            setRecommendationSignals([]);
            setMyGithubProjects([]);
            setRecommendationSignalsLoading(false);
            return;
        }

        const pinnedStorageKey = `profile_pinned_github_repos_${normalizedGithubUsername}`;
        let cancelled = false;
        setRecommendationSignalsLoading(true);

        githubApi
            .getRepos(effectiveGithubUsername)
            .then((repos) => {
                if (cancelled) return;
                const safeRepos = Array.isArray(repos) ? repos : [];

                let pinnedRepoIds: string[] = [];
                try {
                    const storedPinned = localStorage.getItem(pinnedStorageKey);
                    const parsed = storedPinned ? JSON.parse(storedPinned) : [];
                    if (Array.isArray(parsed)) {
                        pinnedRepoIds = parsed.map((repoId) => String(repoId));
                    }
                } catch {
                    pinnedRepoIds = [];
                }

                if (pinnedRepoIds.length === 0) {
                    setRecommendationSignals([]);
                    setMyGithubProjects(safeRepos.slice(0, 6));
                    return;
                }

                const pinnedRepos = safeRepos.filter((repo) => pinnedRepoIds.includes(String(repo.id)));
                const remainingRepos = safeRepos.filter((repo) => !pinnedRepoIds.includes(String(repo.id)));
                setMyGithubProjects([...pinnedRepos, ...remainingRepos].slice(0, 6));
                const signals = new Set<string>();
                pinnedRepos.slice(0, 6).forEach((repo) => {
                    if (repo.language) {
                        signals.add(normalizeToken(repo.language));
                    }

                    extractKeywordTokens(`${repo.name} ${repo.description || ''}`).forEach((token) => {
                        signals.add(token);
                    });
                });

                setRecommendationSignals(Array.from(signals).slice(0, 28));
            })
            .catch(() => {
                if (cancelled) return;
                setRecommendationSignals([]);
                setMyGithubProjects([]);
            })
            .finally(() => {
                if (cancelled) return;
                setRecommendationSignalsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [effectiveGithubUsername]);

    const pendingJoinRequests = joinRequests.filter((item) => item.status === 'PENDING');
    const displayedProjectJoinRequests = pendingJoinRequests;

    const respondJoinRequest = async (requestId: string, action: 'ACCEPT' | 'REJECT') => {
        try {
            setIsResponding(requestId);
            await projectApi.respondToJoinRequest(requestId, action);
            setJoinRequests((prev) =>
                prev.map((item) =>
                    item.id === requestId
                        ? { ...item, status: action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED' }
                        : item
                )
            );
        } catch {
            // Ignore action errors for now.
        } finally {
            setIsResponding(null);
        }
    };

    // In a real app, these would be separate hooks
    const stats = [
        { label: 'Active Projects', value: activeProjectsCount.toString(), color: 'indigo', icon: Rocket },
        { label: 'Project Requests', value: displayedProjectJoinRequests.length.toString(), color: 'fuchsia', icon: User },
        { label: 'Upcoming Events', value: '3', color: 'emerald', icon: Calendar },
        { label: 'Active Goals', value: '12', color: 'amber', icon: Trophy },
    ];

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="mx-auto max-w-7xl space-y-8"
        >
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Overview</h1>
                    <p className="text-slate-500 mt-1 font-medium">Welcome back to APSIT Student Sphere.</p>
                </div>
            </motion.div>

            <motion.div
                variants={containerVariants}
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
            >
                {stats.map((stat) => (
                    <motion.div
                        key={stat.label}
                        variants={itemVariants}
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                    >
                        <div className={`absolute top-0 right-0 h-24 w-24 -mr-8 -mt-8 rounded-full bg-${stat.color}-50/50 group-hover:bg-${stat.color}-100/50 transition-colors duration-300`} />
                        <div className="flex items-center justify-between relative z-10">
                            <stat.icon className={`h-5 w-5 text-${stat.color}-600`} />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-900 mt-4 relative z-10">{stat.value}</p>
                    </motion.div>
                ))}
            </motion.div>

            <motion.div
                variants={itemVariants}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-900">My Profile</h2>
                    <Link
                        href="/profile"
                        className="text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
                    >
                        Open full profile
                    </Link>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{profile?.name || 'Not available'}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
                        <p className="mt-1 truncate text-sm text-slate-700">{profile?.email || 'Not available'}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">GitHub</p>
                        <p className="mt-1 text-sm text-slate-700">{profile?.githubUsername ? `@${profile.githubUsername}` : 'Not linked'}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">LeetCode</p>
                        <p className="mt-1 text-sm text-slate-700">{effectiveLeetCodeUsername || 'Not linked'}</p>
                    </div>
                </div>
            </motion.div>

            <motion.div
                variants={itemVariants}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-900">My Projects</h2>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-slate-500">
                            {effectiveGithubUsername ? `From @${effectiveGithubUsername}` : 'GitHub not connected'}
                        </span>
                        <Link
                            href="/my-projects"
                            className="text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
                        >
                            Open My Projects
                        </Link>
                    </div>
                </div>

                {recommendationSignalsLoading ? (
                    <div className="flex h-32 items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                    </div>
                ) : !effectiveGithubUsername ? (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/40 p-5 text-sm text-slate-500">
                        Connect GitHub in your profile to sync your repositories here.
                    </div>
                ) : myGithubProjects.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/40 p-5 text-sm text-slate-500">
                        No repositories found for your GitHub profile.
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {myGithubProjects.slice(0, 4).map((repo) => (
                            <a
                                key={repo.id}
                                href={repo.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 transition-colors hover:border-slate-300 hover:bg-white"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <p className="line-clamp-1 text-sm font-semibold text-slate-900">{repo.name}</p>
                                    <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                                </div>
                                <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                                    {repo.description || 'Repository from your connected GitHub profile.'}
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                    {repo.language && <span>{repo.language}</span>}
                                    <span className="inline-flex items-center gap-1">
                                        <Star className="h-3 w-3" />
                                        {repo.stargazers_count}
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <GitFork className="h-3 w-3" />
                                        {repo.forks_count}
                                    </span>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </motion.div>

            <div className="grid items-start gap-6 lg:grid-cols-3">
                <motion.div
                    variants={itemVariants}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-900">Recommended Projects</h2>
                        <span className="text-xs font-medium text-indigo-600">
                            {displayedRecommendedProjects.length > 0 && recommendedProjects.length === 0
                                ? 'Using your existing projects'
                                : pinnedProjectSignals.length > 0 || recommendationSignals.length > 0
                                    ? 'Based on your pinned projects'
                                    : 'Popular for you'}
                        </span>
                    </div>
                    {projectsLoading || recommendationSignalsLoading ? (
                        <div className="flex-1 flex items-center justify-center py-12">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                        </div>
                    ) : displayedRecommendedProjects.length === 0 ? (
                        <div className="flex h-36 items-center justify-center rounded-lg bg-slate-50/50 border border-dashed border-slate-200 text-slate-400">
                            No recommendations yet
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {displayedRecommendedProjects.slice(0, 2).map(project => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                    )}
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Project Join Requests</h2>
                    {joinRequestLoading ? (
                        <div className="flex h-36 items-center justify-center">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                        </div>
                    ) : displayedProjectJoinRequests.length === 0 ? (
                        <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/40 text-sm text-slate-500">
                            No pending requests for your projects.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {displayedProjectJoinRequests.map((req) => {
                                return (
                                <div key={req.id} className="rounded-lg border border-slate-200 bg-slate-50/40 p-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{req.requester_name}</p>
                                            <p className="text-sm text-slate-500">{req.requester_email}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="rounded-full bg-fuchsia-100 px-2 py-0.5 text-xs font-semibold text-fuchsia-700">
                                                JOIN REQUEST
                                            </span>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-600">Project: {req.project_title}</p>
                                    {req.message && <p className="mt-1 text-sm text-slate-500">&quot;{req.message}&quot;</p>}
                                    <div className="mt-3 flex gap-2">
                                        <button
                                            type="button"
                                            disabled={isResponding === req.id}
                                            onClick={() => respondJoinRequest(req.id, 'ACCEPT')}
                                            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                                        >
                                            Accept
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isResponding === req.id}
                                            onClick={() => respondJoinRequest(req.id, 'REJECT')}
                                            className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">My Teams</h2>
                    {teamsLoading ? (
                        <div className="flex h-36 items-center justify-center">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                        </div>
                    ) : teams.length === 0 ? (
                        <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/40 text-sm text-slate-500">
                            You have not joined any teams yet.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {teams.slice(0, 4).map((team) => {
                                const membersCount = team.members?.length || team.teamMemberCount || 0;
                                const capacity = team.capacity || team.teamCapacity || 0;
                                return (
                                    <div key={team.id} className="rounded-lg border border-slate-200 bg-slate-50/40 p-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{team.name || 'Untitled Team'}</p>
                                                <p className="text-xs text-slate-500">{team.description || 'No description available.'}</p>
                                            </div>
                                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                                                {membersCount}/{capacity}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
}
