'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectApi } from '@/api/project';
import { teamApi } from '@/api/team';
import { TeamMember } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { TeamMemberCard } from '@/components/team/TeamMemberCard';
import { JoinRequestCard } from '@/components/team/JoinRequestCard';
import {
    Github,
    ExternalLink,
    Calendar,
    Trophy,
    MessageSquare,
    ChevronRight,
    Layers3,
    Sparkles,
} from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { formatDate } from '@/lib/utils';
import { useMemo, useState } from 'react';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

function formatProjectStatus(status: string) {
    return status.replace(/_/g, ' ');
}

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { profile } = useUser();
    const queryClient = useQueryClient();
    const id = params.id as string;
    const [respondingRequestId, setRespondingRequestId] = useState<string | null>(null);
    const [isJoiningProject, setIsJoiningProject] = useState(false);
    const [joinFeedback, setJoinFeedback] = useState<string | null>(null);

    const { data: projectRes, isLoading: isProjectLoading } = useQuery({
        queryKey: ['project', id],
        queryFn: () => projectApi.getProjectById(id),
    });

    const { data: teamRes } = useQuery({
        queryKey: ['team', id],
        queryFn: () => teamApi.getTeamByProjectId(id),
        enabled: Boolean(projectRes?.data),
    });

    const project = projectRes?.data;
    const team = teamRes?.data;
    const isOwner = profile?.id === project?.ownerId;
    const teamMemberCount = team?.members.length || project?.teamMemberCount || 0;
    const teamCapacity = team?.capacity || project?.teamCapacity || 4;
    const openSeats = Math.max(teamCapacity - teamMemberCount, 0);
    const projectLinkCount = [project?.githubUrl, project?.liveUrl].filter(Boolean).length;

    const { data: joinRequestsRes, isLoading: isJoinRequestsLoading } = useQuery({
        queryKey: ['project-join-requests', id],
        queryFn: () => projectApi.getJoinRequests(),
        enabled: Boolean(isOwner),
    });

    const respondJoinRequestMutation = useMutation({
        mutationFn: ({ requestId, action }: { requestId: string; action: 'ACCEPT' | 'REJECT' }) =>
            projectApi.respondToJoinRequest(requestId, action),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-join-requests', id] });
            queryClient.invalidateQueries({ queryKey: ['team', id] });
            queryClient.invalidateQueries({ queryKey: ['project', id] });
        },
        onSettled: () => {
            setRespondingRequestId(null);
        },
    });

    const pendingJoinRequests = useMemo(() => {
        const items = joinRequestsRes?.data?.items || [];
        return items.filter((item) => item.project_id === id && item.status === 'PENDING');
    }, [id, joinRequestsRes?.data?.items]);

    const handleRespondJoinRequest = (requestId: string, action: 'ACCEPT' | 'REJECT') => {
        if (respondingRequestId) return;
        setRespondingRequestId(requestId);
        respondJoinRequestMutation.mutate({ requestId, action });
    };

    const handleJoinProject = async () => {
        if (isJoiningProject) return;
        setJoinFeedback(null);
        setIsJoiningProject(true);
        try {
            const response = await projectApi.requestToJoinProject(id);
            setJoinFeedback(response.message || 'Join request sent successfully.');
        } catch (error: unknown) {
            const apiError = error as { response?: { data?: { message?: string } } };
            setJoinFeedback(apiError.response?.data?.message || 'Failed to send join request.');
        } finally {
            setIsJoiningProject(false);
        }
    };

    if (isProjectLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold">Project not found</h2>
                <Button variant="ghost" onClick={() => router.push('/projects')}>Go to Projects</Button>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <Breadcrumbs
                items={[
                    { label: 'Projects', href: '/projects' },
                    { label: project.title }
                ]}
            />

            <section className="hero-panel rounded-[32px] p-6 sm:p-8">
                <div className="grid gap-6 xl:grid-cols-[1.65fr_0.9fr]">
                    <div className="space-y-6">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant={project.status === 'COMPLETED' ? 'success' : 'secondary'} className="px-3 py-1">
                                        {formatProjectStatus(project.status)}
                                    </Badge>
                                    <span className="text-app-soft inline-flex items-center gap-1.5 text-sm">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Created {formatDate(project.createdAt)}
                                    </span>
                                    <span className="text-app-soft inline-flex items-center gap-1.5 text-sm">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Updated {formatDate(project.updatedAt)}
                                    </span>
                                </div>
                                <h1 className="font-display text-app text-4xl font-bold tracking-tight sm:text-5xl">{project.title}</h1>
                                <p className="text-app-soft max-w-3xl text-base leading-8 sm:text-lg">
                                    {project.description}
                                </p>
                            </div>

                            {isOwner ? (
                                <Button variant="outline" size="sm" className="shrink-0">
                                    Edit Project
                                </Button>
                            ) : null}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="border-app bg-surface rounded-2xl border p-4">
                                <p className="text-app-muted text-xs font-semibold uppercase tracking-[0.12em]">People</p>
                                <p className="text-app mt-2 text-2xl font-bold">{teamMemberCount}</p>
                                <p className="text-app-soft mt-1 text-sm">{openSeats} seat{openSeats === 1 ? '' : 's'} open</p>
                            </div>
                            <div className="border-app bg-surface rounded-2xl border p-4">
                                <p className="text-app-muted text-xs font-semibold uppercase tracking-[0.12em]">Stack</p>
                                <p className="text-app mt-2 text-2xl font-bold">{project.techStack.length}</p>
                                <p className="text-app-soft mt-1 text-sm">Technologies listed</p>
                            </div>
                            <div className="border-app bg-surface rounded-2xl border p-4">
                                <p className="text-app-muted text-xs font-semibold uppercase tracking-[0.12em]">Links</p>
                                <p className="text-app mt-2 text-2xl font-bold">{projectLinkCount}</p>
                                <p className="text-app-soft mt-1 text-sm">Repository and demo</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2.5">
                            {project.domainTags.map((domain) => (
                                <Badge key={domain} className="bg-emerald-100/85 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
                                    {domain}
                                </Badge>
                            ))}
                            {project.techStack.map((tech) => (
                                <Badge key={tech} variant="outline" className="rounded-full bg-surface px-3 py-1 text-app-soft">
                                    {tech}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <aside className="surface-elevated rounded-[28px] p-6">
                        <div className="space-y-5">
                            <div>
                                <h2 className="text-app text-2xl font-semibold">Project Links</h2>
                                <p className="text-app-soft mt-1 text-sm">Everything collaborators need before they jump in.</p>
                            </div>

                            <div className="space-y-3">
                                {project.githubUrl && (
                                    <a
                                        href={project.githubUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="border-app bg-surface-strong hover:border-app-strong hover:bg-surface flex items-center justify-between rounded-xl border p-4 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Github className="text-app h-5 w-5" />
                                            <div>
                                                <p className="text-app text-sm font-semibold">Repository</p>
                                                <p className="text-app-muted text-xs">Source code and commits</p>
                                            </div>
                                        </div>
                                        <ExternalLink className="text-app-muted h-4 w-4" />
                                    </a>
                                )}
                                {project.liveUrl && (
                                    <a
                                        href={project.liveUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="border-app bg-surface-strong hover:border-app-strong hover:bg-surface flex items-center justify-between rounded-xl border p-4 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Trophy className="h-5 w-5 text-amber-500" />
                                            <div>
                                                <p className="text-app text-sm font-semibold">Live Demo</p>
                                                <p className="text-app-muted text-xs">Preview the working build</p>
                                            </div>
                                        </div>
                                        <ExternalLink className="text-app-muted h-4 w-4" />
                                    </a>
                                )}
                                {!project.githubUrl && !project.liveUrl ? (
                                    <div className="border-app bg-surface-strong text-app-muted rounded-xl border border-dashed p-4 text-sm">
                                        No project links added yet.
                                    </div>
                                ) : null}
                            </div>

                            <div className="border-app bg-surface-strong space-y-3 rounded-2xl border p-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-app-soft">Team Capacity</span>
                                    <span className="text-app font-semibold">{teamMemberCount} / {teamCapacity}</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-muted-surface">
                                    <div
                                        className="h-full rounded-full bg-[color:var(--brand)] transition-all"
                                        style={{ width: `${Math.min(100, (teamMemberCount / teamCapacity) * 100)}%` }}
                                    />
                                </div>
                                <div className="text-app-muted flex items-center justify-between text-xs">
                                    <span>{openSeats} seat{openSeats === 1 ? '' : 's'} open</span>
                                    <span>{project.status === 'ACTIVE' ? 'Currently active' : formatProjectStatus(project.status)}</span>
                                </div>
                            </div>

                            {!isOwner ? (
                                <div className="space-y-3">
                                    <Button className="w-full gap-2" variant="primary" onClick={handleJoinProject} disabled={isJoiningProject}>
                                        Join Project
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    {joinFeedback ? (
                                        <p className="text-app-soft text-xs">{joinFeedback}</p>
                                    ) : null}
                                    <Button className="w-full gap-2" variant="outline">
                                        <MessageSquare className="h-4 w-4" />
                                        Ask a Question
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                    </aside>
                </div>
            </section>

            <section className="surface-elevated rounded-[30px] p-6 sm:p-7">
                <Tabs defaultValue="team">
                    <TabsList className="border-app bg-surface-strong h-auto w-full justify-start rounded-full border p-1.5 sm:w-fit">
                        <TabsTrigger
                            value="team"
                            className="text-app-soft data-[state=active]:bg-surface data-[state=active]:text-app rounded-full px-4 py-2.5 shadow-none"
                        >
                            People ({teamMemberCount})
                        </TabsTrigger>
                        <TabsTrigger
                            value="showcase"
                            className="text-app-soft data-[state=active]:bg-surface data-[state=active]:text-app rounded-full px-4 py-2.5 shadow-none"
                        >
                            Showcase
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="team" className="space-y-8 pt-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            {team?.members.map((member: TeamMember) => (
                                <TeamMemberCard key={member.userId} member={member} />
                            ))}
                        </div>

                        {!team?.members?.length ? (
                            <div className="border-app bg-surface-strong text-app-muted rounded-2xl border border-dashed p-6 text-sm">
                                No team members have been added yet.
                            </div>
                        ) : null}

                        {isOwner && (
                            <div className="space-y-4 border-t border-app pt-6">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-app text-lg font-semibold">Pending Requests</h4>
                                    <Badge variant="secondary" className="h-6 min-w-6 justify-center rounded-full px-2">
                                        {pendingJoinRequests.length}
                                    </Badge>
                                </div>
                                {isJoinRequestsLoading ? (
                                    <div className="border-app bg-surface-strong flex h-24 items-center justify-center rounded-xl border">
                                        <Spinner size="sm" />
                                    </div>
                                ) : pendingJoinRequests.length === 0 ? (
                                    <div className="border-app bg-surface-strong text-app-muted rounded-xl border border-dashed p-4 text-sm">
                                        No pending requests for this project yet.
                                    </div>
                                ) : (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {pendingJoinRequests.map((request) => (
                                            <JoinRequestCard
                                                key={request.id}
                                                request={{
                                                    id: request.id,
                                                    projectId: request.project_id,
                                                    userId: request.requester_id,
                                                    role: 'Contributor',
                                                    message: request.message || 'Interested to contribute to this project.',
                                                    status: request.status,
                                                    createdAt: request.created_at,
                                                    user: {
                                                        id: request.requester_id,
                                                        name: request.requester_name,
                                                        email: request.requester_email,
                                                        role: 'STUDENT',
                                                        skills: [],
                                                        followersCount: 0,
                                                        followingCount: 0,
                                                        projectsCount: 0,
                                                        createdAt: request.created_at,
                                                    },
                                                }}
                                                onAccept={(requestId: string) => handleRespondJoinRequest(requestId, 'ACCEPT')}
                                                onReject={(requestId: string) => handleRespondJoinRequest(requestId, 'REJECT')}
                                                disabled={respondingRequestId === request.id}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="showcase" className="space-y-6 pt-6">
                        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
                            <div className="border-app bg-surface-strong rounded-[26px] border p-5">
                                <div className="mb-4 flex items-center gap-2">
                                    <Layers3 className="text-app-muted h-4 w-4" />
                                    <h3 className="text-app text-lg font-semibold">Build Snapshot</h3>
                                </div>
                                <p className="text-app-soft whitespace-pre-wrap leading-7">
                                    {project.description}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="border-app bg-surface-strong rounded-[24px] border p-5">
                                    <p className="text-app-muted text-xs font-semibold uppercase tracking-[0.12em]">Domains</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {project.domainTags.length > 0 ? project.domainTags.map((domain) => (
                                            <Badge key={domain} className="bg-emerald-100/85 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
                                                {domain}
                                            </Badge>
                                        )) : <span className="text-app-soft text-sm">No domains listed</span>}
                                    </div>
                                </div>

                                <div className="border-app bg-surface-strong rounded-[24px] border p-5">
                                    <p className="text-app-muted text-xs font-semibold uppercase tracking-[0.12em]">Stack</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {project.techStack.length > 0 ? project.techStack.map((tech) => (
                                            <Badge key={tech} variant="outline" className="rounded-full bg-surface text-app-soft">
                                                {tech}
                                            </Badge>
                                        )) : <span className="text-app-soft text-sm">No technologies listed</span>}
                                    </div>
                                </div>

                                <div className="border-app bg-surface-strong rounded-[24px] border p-5">
                                    <p className="text-app-muted text-xs font-semibold uppercase tracking-[0.12em]">Quick Facts</p>
                                    <div className="mt-3 space-y-3 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-app-soft">Status</span>
                                            <span className="text-app font-semibold">{formatProjectStatus(project.status)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-app-soft">Team</span>
                                            <span className="text-app font-semibold">{teamMemberCount}/{teamCapacity}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-app-soft">Links</span>
                                            <span className="text-app font-semibold">{projectLinkCount}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </section>
        </div>
    );
}
