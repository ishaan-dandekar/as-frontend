'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Spinner } from '@/components/ui/Spinner';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { githubApi, GitHubRepo, GitHubStats } from '@/api/github';
import { leetcodeApi } from '@/api/leetcode';
import { projectApi } from '@/api/project';
import { userApi } from '@/api/user';
import { useUser } from '@/hooks/useUser';
import { formatRelativeTime } from '@/lib/utils';
import { formatAcademicProfile, formatGithubUsername } from '@/lib/profileDisplay';
import { Project, User } from '@/types';
import { CalendarDays, Code2, FolderGit2, Github, GraduationCap, Hash, Pin, ShieldCheck, Users } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

const PINNED_PROJECT_LIMIT = 3;

const statusWeight: Record<Project['status'], number> = {
    ACTIVE: 4,
    LOOKING_FOR_TEAMMATES: 3,
    IN_PROGRESS: 2,
    COMPLETED: 1,
};

export default function DiscoverUserDetailPage() {
    const params = useParams();
    const { profile: currentProfile } = useUser();
    const storedLeetCodeUsername = leetcodeApi.getStoredUsername();
    const [profile, setProfile] = useState<User | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [githubStats, setGithubStats] = useState<GitHubStats | null | undefined>(undefined);
    const [githubPinnedRepos, setGithubPinnedRepos] = useState<GitHubRepo[]>([]);
    const [githubPinnedReposLoading, setGithubPinnedReposLoading] = useState(false);

    const userIdParam = params?.id;
    const userIdentifier = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
    const isCurrentUser = Boolean(currentProfile?.id && profile?.id && currentProfile.id === profile.id);
    const effectiveGithubUsername = (profile?.githubUsername || '').trim();
    const effectiveLeetCodeUsername = leetcodeApi.normalizeUsername(
        profile?.leetCodeUrl || (isCurrentUser ? storedLeetCodeUsername || '' : '')
    );

    useEffect(() => {
        if (!userIdentifier) {
            setError('Invalid profile link.');
            setIsLoading(false);
            return;
        }

        let cancelled = false;
        setIsLoading(true);
        setError(null);

        const load = async () => {
            try {
                const currentMoodleId = (currentProfile?.moodleId || '').trim();
                const isSelfByMoodleId = Boolean(currentMoodleId && currentMoodleId === userIdentifier);
                const isSelf = Boolean(currentProfile?.id && currentProfile.id === userIdentifier) || isSelfByMoodleId;
                const profilePromise =
                    isSelf
                        ? userApi.getProfile()
                        : userApi.getUserById(userIdentifier);

                const profileResponse = await profilePromise;

                if (cancelled) return;
                const loadedProfile = profileResponse?.data;
                if (!loadedProfile?.id) {
                    setError('User profile not found.');
                    setProfile(null);
                    setProjects([]);
                    return;
                }

                let userProjects: Project[] = [];

                if (isSelf) {
                    try {
                        const myProjectsResponse = await projectApi.getMyProjects();
                        userProjects = Array.isArray(myProjectsResponse.data) ? myProjectsResponse.data : [];
                    } catch {
                        userProjects = [];
                    }
                } else {
                    const publicProjectsResponse = await projectApi.getProjectsByUser(loadedProfile.id);
                    userProjects = Array.isArray(publicProjectsResponse.data) ? publicProjectsResponse.data : [];
                }

                const normalizedProjects = userProjects
                    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

                setProfile(loadedProfile);
                setProjects(normalizedProjects);
            } catch {
                if (cancelled) return;
                setError('Unable to load this profile right now. Please try again.');
                setProfile(null);
                setProjects([]);
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        void load();

        return () => {
            cancelled = true;
        };
    }, [currentProfile, userIdentifier]);

    useEffect(() => {
        const githubUsername = (profile?.githubUsername || '').trim();
        if (!githubUsername) {
            setGithubStats(null);
            return;
        }

        let cancelled = false;
        setGithubStats(undefined);

        githubApi
            .getStats(githubUsername)
            .then((stats) => {
                if (cancelled) return;
                setGithubStats(stats);
            })
            .catch(() => {
                if (cancelled) return;
                setGithubStats(null);
            });

        return () => {
            cancelled = true;
        };
    }, [profile?.githubUsername]);

    useEffect(() => {
        const githubUsername = (profile?.githubUsername || '').trim();
        if (!githubUsername) {
            setGithubPinnedRepos([]);
            setGithubPinnedReposLoading(false);
            return;
        }

        let cancelled = false;
        setGithubPinnedReposLoading(true);

        githubApi
            .getRepos(githubUsername)
            .then((repos) => {
                if (cancelled) return;
                const normalizedUsername = githubUsername.toLowerCase();
                let selectedRepos = [...repos];

                if (isCurrentUser && typeof window !== 'undefined') {
                    const storageKey = `profile_pinned_github_repos_${normalizedUsername}`;
                    try {
                        const rawPinned = localStorage.getItem(storageKey);
                        const parsedPinned = rawPinned ? JSON.parse(rawPinned) : [];
                        if (Array.isArray(parsedPinned) && parsedPinned.length > 0) {
                            const pinnedIdSet = new Set(parsedPinned.map((repoId) => String(repoId)));
                            const pinnedRepos = selectedRepos.filter((repo) => pinnedIdSet.has(String(repo.id)));
                            if (pinnedRepos.length > 0) {
                                selectedRepos = pinnedRepos;
                            }
                        }
                    } catch {
                        // Ignore malformed local pinned data.
                    }
                }

                setGithubPinnedRepos(selectedRepos.slice(0, PINNED_PROJECT_LIMIT));
            })
            .catch(() => {
                if (cancelled) return;
                setGithubPinnedRepos([]);
            })
            .finally(() => {
                if (cancelled) return;
                setGithubPinnedReposLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [isCurrentUser, profile?.githubUsername]);

    const activeProjectsCount = useMemo(
        () => projects.filter((project) => project.status === 'ACTIVE').length,
        [projects]
    );
    const followersCount = githubStats && githubStats !== null
        ? Number(githubStats.user.followers || 0)
        : Number(profile?.followersCount || 0);
    const followingCount = githubStats && githubStats !== null
        ? Number(githubStats.user.following || 0)
        : Number(profile?.followingCount || 0);
    const totalProjectsCount = githubStats && githubStats !== null
        ? Number(githubStats.user.public_repos || githubStats.repos || 0)
        : Number(profile?.projectsCount || projects.length || 0);

    const pinnedProjects = useMemo(() => {
        const explicitPinned = projects
            .filter((project) => project.isBookmarked)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        if (explicitPinned.length > 0) {
            return explicitPinned.slice(0, PINNED_PROJECT_LIMIT);
        }

        return [...projects]
            .sort((a, b) => {
                const statusDelta = statusWeight[b.status] - statusWeight[a.status];
                if (statusDelta !== 0) return statusDelta;

                const memberDelta = (b.teamMemberCount || 0) - (a.teamMemberCount || 0);
                if (memberDelta !== 0) return memberDelta;

                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            })
            .slice(0, PINNED_PROJECT_LIMIT);
    }, [projects]);

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="mx-auto max-w-3xl space-y-4">
                <Breadcrumbs items={[{ label: 'Discover', href: '/discover' }, { label: 'Profile' }]} />
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
                    {error || 'Unable to load profile details.'}
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <Breadcrumbs
                items={[
                    { label: 'Discover', href: '/discover' },
                    { label: profile.name || 'Profile' },
                ]}
            />

            <section className="surface-elevated overflow-hidden rounded-[28px]">
                <div className="profile-banner px-6 py-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Avatar
                                src={profile.avatarUrl}
                                fallback={(profile.name || 'U').charAt(0).toUpperCase()}
                                className="border-app bg-surface-strong text-app h-16 w-16 border text-lg font-bold"
                            />
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-app text-2xl font-bold tracking-tight">{profile.name}</h1>
                                    {isCurrentUser && (
                                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                                            You
                                        </span>
                                    )}
                                    <Badge variant="secondary" className="bg-[color:var(--accent)] px-3 py-1 text-white">
                                        {profile.role === 'ADMIN' ? 'Admin' : 'Student'}
                                    </Badge>
                                </div>
                                <p className="text-app-soft text-sm">{profile.email}</p>
                                {profile.bio && <p className="text-app-muted mt-2 max-w-2xl text-sm">{profile.bio}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-5 p-6">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="border-app bg-surface-strong rounded-2xl border p-4">
                            <p className="text-app-muted flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em]">
                                <Hash className="h-3.5 w-3.5" />
                                UID
                            </p>
                            <p className="text-app mt-2 text-sm font-semibold">{profile.uid || profile.moodleId || 'Not available'}</p>
                        </div>
                        <div className="border-app bg-surface-strong rounded-2xl border p-4">
                            <p className="text-app-muted flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em]">
                                <GraduationCap className="h-3.5 w-3.5" />
                                Academic
                            </p>
                            <p className="text-app mt-2 text-sm font-semibold">
                                {formatAcademicProfile(profile.department || profile.branch, profile.academicStatus || profile.year)}
                            </p>
                        </div>
                        <div className="border-app bg-surface-strong rounded-2xl border p-4">
                            <p className="text-app-muted flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em]">
                                <CalendarDays className="h-3.5 w-3.5" />
                                Admission
                            </p>
                            <p className="text-app mt-2 text-sm font-semibold">{profile.admissionYear || 'Not available'}</p>
                        </div>
                        <div className="border-app bg-surface-strong rounded-2xl border p-4">
                            <p className="text-app-muted flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em]">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Role
                            </p>
                            <p className="text-app mt-2 text-sm font-semibold">{profile.role === 'ADMIN' ? 'Admin' : 'Student'}</p>
                        </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <ProfileStats
                            followers={followersCount}
                            following={followingCount}
                            projects={totalProjectsCount}
                            activeProjects={Number(profile.activeProjectsCount || activeProjectsCount)}
                        />

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="border-app bg-surface-strong rounded-xl border p-3">
                                <p className="text-app-muted text-xs font-semibold uppercase tracking-wide">Active</p>
                                <p className="text-app mt-1 text-xl font-bold">{Number(profile.activeProjectsCount || activeProjectsCount)}</p>
                            </div>
                            <div className="border-app bg-surface-strong rounded-xl border p-3">
                                <p className="text-app-muted text-xs font-semibold uppercase tracking-wide">GitHub</p>
                                <p className="text-app mt-1 text-xl font-bold">
                                    {formatGithubUsername(effectiveGithubUsername)}
                                </p>
                                <p className="text-app-muted text-xs">Username</p>
                            </div>
                            <div className="border-app bg-surface-strong rounded-xl border p-3">
                                <p className="text-app-muted text-xs font-semibold uppercase tracking-wide">LeetCode</p>
                                <p className="text-app mt-1 text-xl font-bold">
                                    {effectiveLeetCodeUsername || 'Not linked'}
                                </p>
                                <p className="text-app-muted text-xs">Username</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="surface-elevated rounded-2xl p-6">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-app flex items-center gap-2 text-lg font-semibold">
                        <Pin className="h-4 w-4" />
                        Pinned Projects
                    </h2>
                    <span className="text-app-muted text-xs">Top {PINNED_PROJECT_LIMIT}</span>
                </div>

                {pinnedProjects.length === 0 ? (
                    githubPinnedReposLoading ? (
                        <div className="border-app bg-surface-strong flex h-20 items-center justify-center rounded-xl border border-dashed">
                            <Spinner />
                        </div>
                    ) : githubPinnedRepos.length > 0 ? (
                        <div className="space-y-3">
                            {githubPinnedRepos.map((repo) => (
                                <a
                                    key={repo.id}
                                    href={repo.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="border-app bg-surface-strong hover:border-app-strong hover:bg-surface block rounded-xl border p-4 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-app truncate text-base font-semibold">{repo.name}</p>
                                            <p className="text-app-soft mt-1 line-clamp-2 text-sm">
                                                {repo.description || 'Repository from linked GitHub profile.'}
                                            </p>
                                        </div>
                                        <Badge variant="secondary">GitHub</Badge>
                                    </div>
                                    <div className="text-app-muted mt-3 flex flex-wrap items-center gap-2 text-xs">
                                        {repo.language && <span>{repo.language}</span>}
                                        <span>{repo.stargazers_count} stars</span>
                                        <span>{repo.forks_count} forks</span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    ) : (
                        <div className="border-app bg-surface-strong text-app-muted rounded-xl border border-dashed p-6 text-sm">
                            No pinned projects yet.
                        </div>
                    )
                ) : (
                    <div className="space-y-3">
                        {pinnedProjects.map((project) => (
                            <Link
                                key={project.id}
                                href={`/projects/${project.id}`}
                                className="border-app bg-surface-strong hover:border-app-strong hover:bg-surface block rounded-xl border p-4 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-app truncate text-base font-semibold">{project.title}</p>
                                        <p className="text-app-soft mt-1 line-clamp-2 text-sm">{project.description}</p>
                                    </div>
                                    <Badge variant={project.status === 'ACTIVE' ? 'success' : 'secondary'}>
                                        {project.status.replace(/_/g, ' ')}
                                    </Badge>
                                </div>
                                <div className="text-app-muted mt-3 flex flex-wrap items-center gap-2 text-xs">
                                    <span className="inline-flex items-center gap-1">
                                        <Users className="h-3.5 w-3.5" />
                                        {project.teamMemberCount || 0} members
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <FolderGit2 className="h-3.5 w-3.5" />
                                        Updated {formatRelativeTime(project.updatedAt)}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            <section className="surface-elevated rounded-2xl p-6">
                <h2 className="text-app mb-4 text-lg font-semibold">Linked Profiles</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="border-app bg-surface-strong rounded-xl border p-4">
                        <div className="text-app mb-2 inline-flex items-center gap-2 text-sm font-semibold">
                            <Github className="h-4 w-4" />
                            GitHub
                        </div>
                        <p className="text-app-soft text-sm">{profile.githubUsername ? `@${profile.githubUsername}` : 'Not linked'}</p>
                    </div>
                    <div className="border-app bg-surface-strong rounded-xl border p-4">
                        <div className="text-app mb-2 inline-flex items-center gap-2 text-sm font-semibold">
                            <Code2 className="h-4 w-4" />
                            LeetCode
                        </div>
                        <p className="text-app-soft text-sm">
                            {effectiveLeetCodeUsername || 'Not linked'}
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
