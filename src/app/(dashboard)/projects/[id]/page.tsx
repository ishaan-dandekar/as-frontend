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
    ChevronRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';
import { useMemo, useState } from 'react';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
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
        enabled: Boolean(projectRes?.data?.teamId),
    });

    const project = projectRes?.data;
    const team = teamRes?.data;
    const isOwner = user?.id === project?.ownerId;

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

            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Badge variant={project.status === 'COMPLETED' ? 'success' : 'secondary'}>
                                        {project.status}
                                    </Badge>
                                    <span className="text-sm text-slate-500 flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        Created {formatDate(project.createdAt)}
                                    </span>
                                </div>
                                <h1 className="text-4xl font-bold text-slate-900">{project.title}</h1>
                            </div>
                            {isOwner && (
                                <Button variant="outline" size="sm">Edit Project</Button>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-4">
                            {project.techStack.map(tech => (
                                <Badge key={tech} variant="outline" className="bg-slate-50">
                                    {tech}
                                </Badge>
                            ))}
                        </div>

                        <div className="prose prose-slate max-w-none">
                            <h3 className="text-xl font-semibold">About this project</h3>
                            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                                {project.description}
                            </p>
                        </div>
                    </div>

                    <Tabs defaultValue="team">
                        <TabsList className="w-full justify-start border-b border-slate-200 bg-transparent rounded-none p-0 h-auto gap-8">
                            <TabsTrigger
                                value="team"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 bg-transparent shadow-none px-0 py-2"
                            >
                                People ({team?.members.length || project.teamMemberCount || 0})
                            </TabsTrigger>
                            <TabsTrigger
                                value="showcase"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 bg-transparent shadow-none px-0 py-2"
                            >
                                Showcase
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="team" className="pt-6 space-y-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                {team?.members.map((member: TeamMember) => (
                                    <TeamMemberCard key={member.userId} member={member} />
                                ))}
                            </div>

                            {isOwner && (
                                <div className="space-y-4 pt-6">
                                    <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                                        Pending Requests
                                        <Badge variant="secondary" className="rounded-full h-5 w-5 flex items-center justify-center p-0">
                                            {pendingJoinRequests.length}
                                        </Badge>
                                    </h4>
                                    {isJoinRequestsLoading ? (
                                        <div className="flex h-24 items-center justify-center rounded-xl border border-slate-100 bg-slate-50/50">
                                            <Spinner size="sm" />
                                        </div>
                                    ) : pendingJoinRequests.length === 0 ? (
                                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-4 text-sm text-slate-500">
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
                    </Tabs>
                </div>

                <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                        <h4 className="font-semibold text-slate-900">Project Links</h4>
                        <div className="space-y-3">
                            {project.githubUrl && (
                                <a
                                    href={project.githubUrl}
                                    target="_blank"
                                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Github className="h-5 w-5" />
                                        <span className="text-sm font-medium">Repository</span>
                                    </div>
                                    <ExternalLink className="h-4 w-4 text-slate-400" />
                                </a>
                            )}
                            {project.liveUrl && (
                                <a
                                    href={project.liveUrl}
                                    target="_blank"
                                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Trophy className="h-5 w-5 text-amber-500" />
                                        <span className="text-sm font-medium">Live Demo</span>
                                    </div>
                                    <ExternalLink className="h-4 w-4 text-slate-400" />
                                </a>
                            )}
                        </div>

                        {!isOwner && (
                            <div className="pt-6 border-t border-slate-100 space-y-4">
                                <div className="flex items-center justify-between text-sm mb-4">
                                    <span className="text-slate-500">Team Capacity</span>
                                    <span className="font-bold">{team?.members.length || project.teamMemberCount || 0} / {team?.capacity || project.teamCapacity || 4}</span>
                                </div>
                                <Button className="w-full gap-2" variant="primary" onClick={handleJoinProject} disabled={isJoiningProject}>
                                    Join Project
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                {joinFeedback ? (
                                    <p className="text-xs text-slate-600">{joinFeedback}</p>
                                ) : null}
                                <Button className="w-full gap-2" variant="outline">
                                    <MessageSquare className="h-4 w-4" />
                                    Ask a Question
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
