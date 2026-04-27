'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, Users } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TeamMemberCard } from '@/components/team/TeamMemberCard';
import { JoinRequestCard } from '@/components/team/JoinRequestCard';
import { teamApi } from '@/api/team';
import { TeamMember } from '@/types';
import { useUser } from '@/hooks/useUser';

export default function TeamDetailPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const id = String(params.id || '');
    const [respondingRequestId, setRespondingRequestId] = useState<string | null>(null);
    const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
    const { profile } = useUser();

    const { data: teamRes, isLoading: isTeamLoading } = useQuery({
        queryKey: ['team-detail', id],
        queryFn: () => teamApi.getTeam(id),
        enabled: !!id,
    });

    const team = teamRes?.data;
    const isOwner = Boolean(profile?.id && team?.ownerId && profile.id === team.ownerId);

    const { data: incomingRequestsRes, isLoading: incomingRequestsLoading } = useQuery({
        queryKey: ['team-incoming-requests'],
        queryFn: () => teamApi.getIncomingJoinRequests(),
        enabled: !!id && isOwner,
        retry: false,
    });

    const respondRequestMutation = useMutation({
        mutationFn: ({ requestId, action }: { requestId: string; action: 'APPROVE' | 'REJECT' }) =>
            teamApi.respondToTeamJoinRequest(requestId, action),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['team-incoming-requests'] });
            queryClient.invalidateQueries({ queryKey: ['my-teams'] });
            queryClient.invalidateQueries({ queryKey: ['team-detail', id] });
        },
        onSettled: () => {
            setRespondingRequestId(null);
        },
    });

    const removeMemberMutation = useMutation({
        mutationFn: (userId: string) => teamApi.removeMember(id, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['team-detail', id] });
            queryClient.invalidateQueries({ queryKey: ['my-teams'] });
        },
        onSettled: () => {
            setRemovingMemberId(null);
        },
    });

    const deleteTeamMutation = useMutation({
        mutationFn: () => teamApi.deleteTeam(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-teams'] });
            router.push('/teams');
        },
    });

    const teamIncomingRequests = useMemo(() => {
        const items = incomingRequestsRes?.data?.items || [];
        return items.filter((item) => item.teamId === id && item.status === 'PENDING');
    }, [id, incomingRequestsRes?.data?.items]);

    const handleRespondJoinRequest = (requestId: string, action: 'APPROVE' | 'REJECT') => {
        if (respondingRequestId) return;
        setRespondingRequestId(requestId);
        respondRequestMutation.mutate({ requestId, action });
    };

    const handleRemoveMember = (member: TeamMember) => {
        if (!isOwner || removingMemberId || member.role === 'OWNER' || member.userId === team?.ownerId) return;
        const confirmed = window.confirm(`Remove ${member.name} from this team?`);
        if (!confirmed) return;

        setRemovingMemberId(member.userId);
        removeMemberMutation.mutate(member.userId);
    };

    const handleDeleteTeam = () => {
        if (!isOwner || deleteTeamMutation.isPending) return;
        const confirmed = window.confirm('Delete this team? This cannot be undone.');
        if (!confirmed) return;

        deleteTeamMutation.mutate();
    };

    if (isTeamLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!team || !team.id) {
        return (
            <div className="space-y-4">
                <Breadcrumbs items={[{ label: 'My Teams', href: '/teams' }, { label: 'Team Details' }]} />
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
                    <h2 className="text-lg font-semibold">Team not found</h2>
                    <p className="mt-1 text-sm">This team may have been removed or is not accessible to you.</p>
                    <Button className="mt-4" variant="outline" onClick={() => router.push('/teams')}>
                        Back to Teams
                    </Button>
                </div>
            </div>
        );
    }

    const memberCount = team.members?.length || team.teamMemberCount || 0;
    const capacity = team.capacity || team.teamCapacity || 0;

    return (
        <div className="space-y-6">
            <Breadcrumbs
                items={[
                    { label: 'My Teams', href: '/teams' },
                    { label: team.name || 'Team Details' },
                ]}
            />

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            {team.name || 'Untitled Team'}
                        </h1>
                        <p className="mt-2 text-slate-600">
                            {team.description || 'No description available for this team yet.'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {memberCount}/{capacity} members
                        </Badge>
                        {isOwner ? (
                            <Button
                                variant="danger"
                                size="sm"
                                className="gap-2"
                                onClick={handleDeleteTeam}
                                isLoading={deleteTeamMutation.isPending}
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete Team
                            </Button>
                        ) : null}
                    </div>
                </div>
            </div>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-900">Team Members</h2>
                {team.members?.length ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {team.members.map((member: TeamMember) => (
                            <TeamMemberCard
                                key={member.userId}
                                member={member}
                                canRemove={isOwner && member.role !== 'OWNER' && member.userId !== team.ownerId}
                                isRemoving={removingMemberId === member.userId}
                                onRemove={handleRemoveMember}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                        No members to show yet.
                    </div>
                )}
            </section>

            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-slate-900">Pending Requests</h2>
                    <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">
                        {teamIncomingRequests.length}
                    </Badge>
                </div>

                {!isOwner ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                        Only the team leader can review requests.
                    </div>
                ) : incomingRequestsLoading ? (
                    <div className="flex h-24 items-center justify-center">
                        <Spinner size="sm" />
                    </div>
                ) : teamIncomingRequests.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                        No pending requests for this team.
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {teamIncomingRequests.map((request) => (
                            <JoinRequestCard
                                key={request.id}
                                request={{
                                    id: request.id,
                                    projectId: request.teamId,
                                    userId: request.userId,
                                    message: request.message || 'Would like to join your team.',
                                    role: 'MEMBER',
                                    status: request.status,
                                    createdAt: request.createdAt,
                                    user: {
                                        id: request.userId,
                                        name: request.userName,
                                        email: request.userEmail,
                                        avatarUrl: request.userAvatarUrl,
                                        role: 'STUDENT',
                                        skills: [],
                                        followersCount: 0,
                                        followingCount: 0,
                                        projectsCount: 0,
                                        createdAt: request.createdAt,
                                    },
                                }}
                                onAccept={(requestId) => handleRespondJoinRequest(requestId, 'APPROVE')}
                                onReject={(requestId) => handleRespondJoinRequest(requestId, 'REJECT')}
                                disabled={respondingRequestId === request.id}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
