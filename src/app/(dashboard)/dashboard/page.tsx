'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useProjects } from '@/hooks/useProjects';
import { User, Calendar, Rocket, Bell, ExternalLink, Star, GitFork } from 'lucide-react';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { Project, Team } from '@/types';
import { useUser } from '@/hooks/useUser';
import { projectApi, ProjectJoinRequestItem } from '@/api/project';
import { teamApi } from '@/api/team';
import { eventApi } from '@/api/event';
import { githubApi, GitHubRepo } from '@/api/github';
import { leetcodeApi } from '@/api/leetcode';
import { formatAcademicProfile, formatGithubUsername } from '@/lib/profileDisplay';
import { useNotifications } from '@/hooks/useNotifications';
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

export default function DashboardPage() {
    const { projects, isLoading: projectsLoading } = useProjects();
    const { profile } = useUser();
    const oauthSession = githubApi.getStoredOAuthSession();
    const storedLeetCodeUsername = leetcodeApi.getStoredUsername();
    const effectiveGithubUsername = profile?.githubUsername || oauthSession?.githubUsername;
    const effectiveLeetCodeUsername = leetcodeApi.normalizeUsername(profile?.leetCodeUrl || storedLeetCodeUsername || '');
    const { unreadCount } = useNotifications();
    const [joinRequests, setJoinRequests] = useState<ProjectJoinRequestItem[]>([]);
    const [joinRequestLoading, setJoinRequestLoading] = useState(true);
    const [teams, setTeams] = useState<Team[]>([]);
    const [teamsLoading, setTeamsLoading] = useState(true);
    const [isResponding, setIsResponding] = useState<string | null>(null);
    const [recommendedProjects, setRecommendedProjects] = useState<Project[]>([]);
    const [recommendationsLoading, setRecommendationsLoading] = useState(true);
    const [myGithubProjects, setMyGithubProjects] = useState<GitHubRepo[]>([]);
    const [upcomingEventsCount, setUpcomingEventsCount] = useState(0);
    const [eventsLoading, setEventsLoading] = useState(true);
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

        const loadEvents = async () => {
            try {
                setEventsLoading(true);
                const response = await eventApi.getEvents();
                if (cancelled) return;

                const now = Date.now();
                const events = Array.isArray(response.data) ? response.data : [];
                const upcomingCount = events.filter((event) => {
                    const eventTs = new Date(event.date).getTime();
                    return !Number.isNaN(eventTs) && eventTs >= now;
                }).length;

                setUpcomingEventsCount(upcomingCount);
            } catch {
                if (!cancelled) {
                    setUpcomingEventsCount(0);
                }
            } finally {
                if (!cancelled) {
                    setEventsLoading(false);
                }
            }
        };

        loadEvents();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        const loadRecommendedProjects = async () => {
            try {
                setRecommendationsLoading(true);
                const response = await projectApi.getRecommendedProjects();
                if (!cancelled) {
                    setRecommendedProjects(Array.isArray(response.data) ? response.data : []);
                }
            } catch {
                if (!cancelled) {
                    setRecommendedProjects([]);
                }
            } finally {
                if (!cancelled) {
                    setRecommendationsLoading(false);
                }
            }
        };

        loadRecommendedProjects();
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
            setMyGithubProjects([]);
            return;
        }

        const normalizedGithubUsername = effectiveGithubUsername.trim().toLowerCase();
        if (!normalizedGithubUsername) {
            setMyGithubProjects([]);
            return;
        }

        const pinnedStorageKey = `profile_pinned_github_repos_${normalizedGithubUsername}`;
        let cancelled = false;

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
                    setMyGithubProjects(safeRepos.slice(0, 6));
                    return;
                }

                const pinnedRepos = safeRepos.filter((repo) => pinnedRepoIds.includes(String(repo.id)));
                const remainingRepos = safeRepos.filter((repo) => !pinnedRepoIds.includes(String(repo.id)));
                setMyGithubProjects([...pinnedRepos, ...remainingRepos].slice(0, 6));
            })
            .catch(() => {
                if (!cancelled) {
                    setMyGithubProjects([]);
                }
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

    const stats = [
        {
            label: 'Active Projects',
            value: activeProjectsCount.toString(),
            icon: Rocket,
            iconClassName: 'text-indigo-600 dark:text-indigo-300',
            accentClassName: 'bg-indigo-100/90 dark:bg-indigo-400/15',
            glowClassName: 'from-indigo-500/10',
        },
        {
            label: 'Project Requests',
            value: displayedProjectJoinRequests.length.toString(),
            icon: User,
            iconClassName: 'text-fuchsia-600 dark:text-fuchsia-300',
            accentClassName: 'bg-fuchsia-100/90 dark:bg-fuchsia-400/15',
            glowClassName: 'from-fuchsia-500/10',
        },
        {
            label: 'Upcoming Events',
            value: eventsLoading ? '...' : upcomingEventsCount.toString(),
            icon: Calendar,
            iconClassName: 'text-emerald-600 dark:text-emerald-300',
            accentClassName: 'bg-emerald-100/90 dark:bg-emerald-400/15',
            glowClassName: 'from-emerald-500/10',
        },
        {
            label: 'Unread Alerts',
            value: unreadCount.toString(),
            icon: Bell,
            iconClassName: 'text-amber-600 dark:text-amber-300',
            accentClassName: 'bg-amber-100/90 dark:bg-amber-400/15',
            glowClassName: 'from-amber-500/10',
        },
    ];

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="mx-auto max-w-7xl space-y-8"
        >
            <motion.div
                variants={itemVariants}
                className="hero-panel rounded-[28px] p-6 sm:p-8"
            >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <span className="eyebrow-badge mb-3 inline-flex rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.28em]">
                            Student workspace
                        </span>
                        <h1 className="font-display text-app text-3xl font-bold tracking-tight sm:text-4xl">
                            Dashboard Overview
                        </h1>
                        <p className="text-app-soft mt-3 max-w-xl text-sm font-medium sm:text-base">
                            Welcome back to APSIT Student Sphere. Track your projects, requests, and team activity in one polished workspace.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:min-w-[320px]">
                        <div className="rounded-2xl border border-app bg-surface p-4">
                            <p className="text-app-muted text-xs font-semibold uppercase tracking-[0.18em]">Profile</p>
                            <p className="text-app mt-2 truncate text-sm font-semibold">{profile?.name || 'Student'}</p>
                            <p className="text-app-soft truncate text-xs">{profile?.email || 'Update your profile details'}</p>
                        </div>
                        <div className="rounded-2xl border border-app bg-surface p-4">
                            <p className="text-app-muted text-xs font-semibold uppercase tracking-[0.18em]">Connected GitHub</p>
                            <p className="text-app mt-2 text-sm font-semibold">
                                {effectiveGithubUsername ? `@${effectiveGithubUsername}` : 'Not connected'}
                            </p>
                            <p className="text-app-soft text-xs">Sync repositories and activity</p>
                        </div>
                    </div>
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
                        className={`stat-shell group relative overflow-hidden rounded-[24px] p-6 transition-shadow hover:shadow-lg ${stat.glowClassName} bg-gradient-to-br to-transparent`}
                    >
                        <div className={`absolute right-5 top-5 h-12 w-12 rounded-2xl ${stat.accentClassName} blur-2xl transition-transform duration-300 group-hover:scale-125`} />
                        <div className="relative z-10 flex items-start justify-between gap-4">
                            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${stat.accentClassName}`}>
                                <stat.icon className={`h-5 w-5 ${stat.iconClassName}`} />
                            </div>
                            <span className="text-app-muted text-right text-[11px] font-bold uppercase tracking-[0.22em]">{stat.label}</span>
                        </div>
                        <p className="text-app relative z-10 mt-6 text-4xl font-bold tracking-tight">{stat.value}</p>
                    </motion.div>
                ))}
            </motion.div>

            <motion.div
                variants={itemVariants}
                className="surface-elevated rounded-[28px] p-6"
            >
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-app text-lg font-semibold">My Profile</h2>
                    <Link
                        href="/profile"
                        className="text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
                    >
                        Open full profile
                    </Link>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-app bg-surface-strong p-4">
                        <p className="text-app-muted text-xs font-semibold uppercase tracking-wide">Name</p>
                        <p className="text-app mt-2 text-sm font-semibold">{profile?.name || 'Not available'}</p>
                    </div>
                    <div className="rounded-2xl border border-app bg-surface-strong p-4">
                        <p className="text-app-muted text-xs font-semibold uppercase tracking-wide">Email</p>
                        <p className="text-app-soft mt-2 truncate text-sm">{profile?.email || 'Not available'}</p>
                    </div>
                    <div className="rounded-2xl border border-app bg-surface-strong p-4">
                        <p className="text-app-muted text-xs font-semibold uppercase tracking-wide">GitHub</p>
                        <p className="text-app-soft mt-2 text-sm">{formatGithubUsername(profile?.githubUsername)}</p>
                    </div>
                    <div className="rounded-2xl border border-app bg-surface-strong p-4">
                        <p className="text-app-muted text-xs font-semibold uppercase tracking-wide">LeetCode</p>
                        <p className="text-app-soft mt-2 text-sm">{effectiveLeetCodeUsername || 'Not linked'}</p>
                    </div>
                    {profile?.role === 'STUDENT' ? (
                        <div className="rounded-2xl border border-app bg-surface-strong p-4">
                            <p className="text-app-muted text-xs font-semibold uppercase tracking-wide">Academic</p>
                            <p className="text-app-soft mt-2 text-sm">{formatAcademicProfile(profile?.branch, profile?.year)}</p>
                        </div>
                    ) : null}
                </div>
            </motion.div>

            <motion.div
                variants={itemVariants}
                className="surface-elevated rounded-[28px] p-6"
            >
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-app text-lg font-semibold">My Projects</h2>
                    <div className="flex items-center gap-3">
                        <span className="text-app-muted text-xs font-medium">
                            {effectiveGithubUsername ? `From @${effectiveGithubUsername}` : 'GitHub not connected'}
                        </span>
                        <Link
                            href="/my-projects"
                            className="text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
                        >
                            Open My Projects
                        </Link>
                    </div>
                </div>

                {projectsLoading ? (
                    <div className="flex h-32 items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                    </div>
                ) : !effectiveGithubUsername ? (
                    <div className="text-app-soft rounded-2xl border border-app border-dashed bg-surface-strong p-5 text-sm">
                        Connect GitHub in your profile to sync your repositories here.
                    </div>
                ) : myGithubProjects.length === 0 ? (
                    <div className="text-app-soft rounded-2xl border border-app border-dashed bg-surface-strong p-5 text-sm">
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
                                className="rounded-2xl border border-app bg-surface-strong p-4 transition-colors hover:border-app-strong hover:bg-surface"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-app line-clamp-1 text-sm font-semibold">{repo.name}</p>
                                    <ExternalLink className="text-app-muted h-3.5 w-3.5" />
                                </div>
                                <p className="text-app-soft mt-1 line-clamp-2 text-xs">
                                    {repo.description || 'Repository from your connected GitHub profile.'}
                                </p>
                                <div className="text-app-muted mt-3 flex flex-wrap items-center gap-2 text-xs">
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
                    className="surface-elevated rounded-[28px] p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-app text-lg font-semibold">Recommended Projects</h2>
                        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-300">
                            {displayedRecommendedProjects.length > 0 && recommendedProjects.length === 0
                                ? 'Using your existing projects'
                                : 'Based on your profile and skills'}
                        </span>
                    </div>
                    {projectsLoading || recommendationsLoading ? (
                        <div className="flex-1 flex items-center justify-center py-12">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                        </div>
                    ) : displayedRecommendedProjects.length === 0 ? (
                        <div className="text-app-muted flex h-36 items-center justify-center rounded-2xl border border-app border-dashed bg-surface-strong">
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
                    className="surface-elevated rounded-[28px] p-6"
                >
                    <h2 className="text-app mb-4 text-lg font-semibold">Project Join Requests</h2>
                    {joinRequestLoading ? (
                        <div className="flex h-36 items-center justify-center">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                        </div>
                    ) : displayedProjectJoinRequests.length === 0 ? (
                        <div className="text-app-soft flex h-36 items-center justify-center rounded-2xl border border-app border-dashed bg-surface-strong text-sm">
                            No pending requests for your projects.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {displayedProjectJoinRequests.map((req) => {
                                return (
                                <div key={req.id} className="rounded-2xl border border-app bg-surface-strong p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-app text-sm font-semibold">{req.requester_name}</p>
                                            <p className="text-app-muted text-sm">{req.requester_email}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="rounded-full bg-fuchsia-100 px-2 py-0.5 text-xs font-semibold text-fuchsia-700 dark:bg-fuchsia-400/15 dark:text-fuchsia-200">
                                                JOIN REQUEST
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-app-soft mt-2 text-sm">Project: {req.project_title}</p>
                                    {req.message && <p className="text-app-muted mt-1 text-sm">&quot;{req.message}&quot;</p>}
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
                    className="surface-elevated rounded-[28px] p-6"
                >
                    <h2 className="text-app mb-4 text-lg font-semibold">My Teams</h2>
                    {teamsLoading ? (
                        <div className="flex h-36 items-center justify-center">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                        </div>
                    ) : teams.length === 0 ? (
                        <div className="text-app-soft flex h-36 items-center justify-center rounded-2xl border border-app border-dashed bg-surface-strong text-sm">
                            You have not joined any teams yet.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {teams.slice(0, 4).map((team) => {
                                const membersCount = team.members?.length || team.teamMemberCount || 0;
                                const capacity = team.capacity || team.teamCapacity || 0;
                                return (
                                    <div key={team.id} className="rounded-2xl border border-app bg-surface-strong p-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-app text-sm font-semibold">{team.name || 'Untitled Team'}</p>
                                                <p className="text-app-muted text-xs">{team.description || 'No description available.'}</p>
                                            </div>
                                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-200">
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
