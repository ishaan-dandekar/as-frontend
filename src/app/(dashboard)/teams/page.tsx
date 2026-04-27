'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Users, Plus } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { JoinRequestCard } from '@/components/team/JoinRequestCard';
import { teamApi } from '@/api/team';
import { Team } from '@/types';
import { useUser } from '@/hooks/useUser';

export default function TeamsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { profile, isLoading: profileLoading } = useUser();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [teamName, setTeamName] = useState('');
    const [teamDescription, setTeamDescription] = useState('');
    const [teamCapacity, setTeamCapacity] = useState('5');
    const [createError, setCreateError] = useState<string | null>(null);
    const [createSuccess, setCreateSuccess] = useState<string | null>(null);
    const [joinFeedback, setJoinFeedback] = useState<string | null>(null);
    const [joiningTeamId, setJoiningTeamId] = useState<string | null>(null);
    const [respondingRequestId, setRespondingRequestId] = useState<string | null>(null);
    const [teamSearch, setTeamSearch] = useState('');

    useEffect(() => {
        if (profileLoading || profile) return;
        router.replace('/');
    }, [profile, profileLoading, router]);

    const { data: teamsRes, isLoading, error } = useQuery({
        queryKey: ['my-teams'],
        queryFn: () => teamApi.getMyTeams(),
        retry: false,
        enabled: !!profile,
    });

    const { data: discoverRes, isLoading: discoverLoading } = useQuery({
        queryKey: ['discover-teams'],
        queryFn: () => teamApi.discoverTeams(),
        retry: false,
        enabled: !!profile,
    });

    const { data: incomingRequestsRes, isLoading: incomingRequestsLoading } = useQuery({
        queryKey: ['team-incoming-requests'],
        queryFn: () => teamApi.getIncomingJoinRequests(),
        retry: false,
        enabled: !!profile,
    });

    const createTeamMutation = useMutation({
        mutationFn: (payload: { name: string; description?: string; capacity?: number }) => teamApi.createTeam(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-teams'] });
            queryClient.invalidateQueries({ queryKey: ['discover-teams'] });
            setTeamName('');
            setTeamDescription('');
            setTeamCapacity('5');
            setCreateError(null);
            setCreateSuccess('Team created successfully.');
            setShowCreateForm(false);
        },
        onError: (error: unknown) => {
            const apiError = error as { response?: { data?: { message?: string } } };
            setCreateSuccess(null);
            setCreateError(apiError.response?.data?.message || 'Failed to create team.');
        },
    });

    const teams = useMemo(() => (teamsRes?.data || []) as Team[], [teamsRes?.data]);
    const discoverTeams = useMemo(() => (discoverRes?.data || []) as Team[], [discoverRes?.data]);
    const incomingRequests = incomingRequestsRes?.data?.items || [];
    const normalizedTeamSearch = teamSearch.trim().toLowerCase();
    const filteredDiscoverTeams = useMemo(() => {
        if (!normalizedTeamSearch) return discoverTeams;

        return discoverTeams.filter((team) => {
            const keywordHaystack = [
                team.name,
                team.description,
                ...(team.searchKeywords || []),
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return keywordHaystack.includes(normalizedTeamSearch);
        });
    }, [discoverTeams, normalizedTeamSearch]);

    const respondRequestMutation = useMutation({
        mutationFn: ({ requestId, action }: { requestId: string; action: 'APPROVE' | 'REJECT' }) =>
            teamApi.respondToTeamJoinRequest(requestId, action),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['team-incoming-requests'] });
            queryClient.invalidateQueries({ queryKey: ['my-teams'] });
            queryClient.invalidateQueries({ queryKey: ['discover-teams'] });
        },
        onSettled: () => {
            setRespondingRequestId(null);
        },
    });

    const handleCreateTeam = () => {
        const normalizedName = teamName.trim();
        const capacityNumber = Number(teamCapacity);

        if (!normalizedName) {
            setCreateError('Team name is required.');
            return;
        }

        if (!Number.isFinite(capacityNumber) || capacityNumber < 2 || capacityNumber > 20) {
            setCreateError('Capacity must be between 2 and 20.');
            return;
        }

        setCreateError(null);
        setCreateSuccess(null);
        createTeamMutation.mutate({
            name: normalizedName,
            description: teamDescription.trim(),
            capacity: capacityNumber,
        });
    };

    const handleJoinTeam = async (teamId: string) => {
        if (joiningTeamId) return;
        setJoiningTeamId(teamId);
        setJoinFeedback(null);
        try {
            const response = await teamApi.requestToJoinTeam(teamId);
            setJoinFeedback(response.message || 'Join request sent successfully.');
            queryClient.invalidateQueries({ queryKey: ['discover-teams'] });
        } catch (error: unknown) {
            const apiError = error as { response?: { data?: { message?: string } } };
            setJoinFeedback(apiError.response?.data?.message || 'Failed to send join request.');
        } finally {
            setJoiningTeamId(null);
        }
    };

    const handleRespondJoinRequest = (requestId: string, action: 'APPROVE' | 'REJECT') => {
        if (respondingRequestId) return;
        setRespondingRequestId(requestId);
        respondRequestMutation.mutate({ requestId, action });
    };

    if (profileLoading || (!profile && typeof window !== 'undefined')) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Breadcrumbs items={[{ label: 'My Teams' }]} />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Teams</h1>
                    <p className="text-slate-600">View, create, and join teams.</p>
                </div>
                <Button className="gap-2" onClick={() => setShowCreateForm((prev) => !prev)}>
                    <Plus className="h-4 w-4" />
                    {showCreateForm ? 'Cancel' : 'Create Team'}
                </Button>
            </div>

            {showCreateForm ? (
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900">Create a New Team</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Input
                            label="Team Name"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder="Enter team name"
                        />
                        <Input
                            label="Capacity"
                            type="number"
                            min={2}
                            max={20}
                            value={teamCapacity}
                            onChange={(e) => setTeamCapacity(e.target.value)}
                        />
                    </div>
                    <div>
                        <p className="mb-1.5 text-sm font-medium text-slate-700">Description</p>
                        <Textarea
                            value={teamDescription}
                            onChange={(e) => setTeamDescription(e.target.value)}
                            placeholder="What is this team focused on?"
                            maxLength={300}
                            showCount
                        />
                    </div>
                    {createError ? <p className="text-sm text-red-600">{createError}</p> : null}
                    {createSuccess ? <p className="text-sm text-emerald-700">{createSuccess}</p> : null}
                    <Button onClick={handleCreateTeam} isLoading={createTeamMutation.isPending}>
                        Save Team
                    </Button>
                </div>
            ) : null}

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-900">Your Teams</h2>
                {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <Spinner size="lg" />
                </div>
            ) : error ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
                    <h3 className="text-lg font-semibold">Unable to load teams</h3>
                    <p className="mt-1 text-sm">Please sign in from the landing page or try again in a moment.</p>
                </div>
            ) : teams.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                        <Users className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">No teams to show yet</h3>
                    <p className="mt-2 text-slate-500">
                        Create your own team or send a request to join a team below.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {teams.map((team) => (
                        <button
                            key={team.id}
                            type="button"
                            onClick={() => router.push(`/teams/${team.id}`)}
                            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <h3 className="truncate text-lg font-semibold text-slate-900">{team.name || 'Untitled Team'}</h3>
                                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                                    {team.members?.length || team.teamMemberCount || 0}/{team.capacity || team.teamCapacity || 0}
                                </span>
                            </div>
                            <p className="line-clamp-2 text-sm text-slate-600">{team.description || 'No description available.'}</p>

                            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                                <span>{team.members?.length || team.teamMemberCount || 0} members</span>
                                <span>Capacity {team.capacity || team.teamCapacity || 0}</span>
                            </div>
                        </button>
                    ))}
                </div>
                )}
            </section>

            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-slate-900">Incoming Join Requests</h2>
                    <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">
                        {incomingRequests.length}
                    </Badge>
                </div>

                {incomingRequestsLoading ? (
                    <div className="flex h-32 items-center justify-center">
                        <Spinner size="lg" />
                    </div>
                ) : incomingRequests.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                        No pending requests for your teams right now.
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {incomingRequests.map((request) => (
                            <div key={request.id} className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Team: {request.teamName}
                                </p>
                                <JoinRequestCard
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
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-900">Discover Teams</h2>
                <div className="max-w-xl">
                    <Input
                        placeholder="Search teams by description keywords..."
                        value={teamSearch}
                        onChange={(event) => setTeamSearch(event.target.value)}
                        icon={<Search className="h-4 w-4" />}
                        helperText="Team descriptions are turned into searchable keywords behind the scenes."
                    />
                </div>
                {joinFeedback ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                        {joinFeedback}
                    </div>
                ) : null}
                {discoverLoading ? (
                    <div className="flex h-32 items-center justify-center">
                        <Spinner size="lg" />
                    </div>
                ) : filteredDiscoverTeams.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                        No teams match those description keywords right now.
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {filteredDiscoverTeams.map((team) => (
                            <div key={team.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <h3 className="truncate text-lg font-semibold text-slate-900">{team.name || 'Untitled Team'}</h3>
                                    <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                                        {team.teamMemberCount || team.members.length}/{team.capacity || team.teamCapacity || 0}
                                    </span>
                                </div>
                                <p className="line-clamp-2 text-sm text-slate-600 mb-4">
                                    {team.description || 'No description available.'}
                                </p>
                                {(team.searchKeywords || []).length > 0 && (
                                    <div className="mb-4 flex flex-wrap gap-2">
                                        {team.searchKeywords?.slice(0, 4).map((keyword) => (
                                            <Badge key={keyword} variant="outline" className="font-normal">
                                                {keyword}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                                <Button
                                    className="w-full"
                                    variant="outline"
                                    onClick={() => handleJoinTeam(team.id)}
                                    isLoading={joiningTeamId === team.id}
                                    disabled={joiningTeamId !== null && joiningTeamId !== team.id}
                                >
                                    Request to Join
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
