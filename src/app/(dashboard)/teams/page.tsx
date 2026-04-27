'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Inbox, Plus, Search, UserPlus, Users } from 'lucide-react';
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

function SummaryCard({
    label,
    value,
    helper,
    icon: Icon,
}: {
    label: string;
    value: number | string;
    helper: string;
    icon: typeof Users;
}) {
    return (
        <div className="rounded-[24px] border border-app bg-surface p-5 shadow-[0_18px_34px_-30px_rgba(15,23,42,0.35)]">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-app text-sm font-semibold">{label}</p>
                    <p className="text-app mt-3 text-3xl font-bold tracking-tight">{value}</p>
                    <p className="text-app-soft mt-2 max-w-[18rem] text-sm leading-6">{helper}</p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[color:var(--brand-soft)]/80 text-[color:var(--brand-strong)]">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

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
    const deferredTeamSearch = useDeferredValue(teamSearch);

    useEffect(() => {
        if (profileLoading || profile) return;
        router.replace('/');
    }, [profile, profileLoading, router]);

    const { data: teamsRes, isLoading, error } = useQuery({
        queryKey: ['my-teams'],
        queryFn: () => teamApi.getMyTeams(),
        retry: false,
        enabled: !!profile,
        staleTime: 2 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    const { data: discoverRes, isLoading: discoverLoading } = useQuery({
        queryKey: ['discover-teams'],
        queryFn: () => teamApi.discoverTeams(),
        retry: false,
        enabled: !!profile,
        staleTime: 2 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    const { data: incomingRequestsRes, isLoading: incomingRequestsLoading } = useQuery({
        queryKey: ['team-incoming-requests'],
        queryFn: () => teamApi.getIncomingJoinRequests(),
        retry: false,
        enabled: !!profile,
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
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
        onError: (mutationError: unknown) => {
            const apiError = mutationError as { response?: { data?: { message?: string } } };
            setCreateSuccess(null);
            setCreateError(apiError.response?.data?.message || 'Failed to create team.');
        },
    });

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

    const teams = useMemo(() => (teamsRes?.data || []) as Team[], [teamsRes?.data]);
    const discoverTeams = useMemo(() => (discoverRes?.data || []) as Team[], [discoverRes?.data]);
    const incomingRequests = incomingRequestsRes?.data?.items || [];
    const normalizedTeamSearch = deferredTeamSearch.trim().toLowerCase();

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

    const totalDiscoverCapacity = useMemo(
        () => filteredDiscoverTeams.reduce((sum, team) => sum + Number(team.capacity || team.teamCapacity || 0), 0),
        [filteredDiscoverTeams]
    );

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
        } catch (requestError: unknown) {
            const apiError = requestError as { response?: { data?: { message?: string } } };
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
        <div className="space-y-8">
            <Breadcrumbs items={[{ label: 'Collaboration' }]} />

            <section className="surface-elevated rounded-[34px] px-6 py-7 sm:px-8">
                <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex flex-col items-start gap-3 xl:items-end">
                        <Button className="gap-2" onClick={() => setShowCreateForm((prev) => !prev)}>
                            <Plus className="h-4 w-4" />
                            {showCreateForm ? 'Close Form' : 'Create Team'}
                        </Button>
                        <p className="text-app-muted text-sm">
                            {teams.length > 0 ? `${teams.length} team${teams.length === 1 ? '' : 's'} in your workspace` : 'Start with a small focused team'}
                        </p>
                    </div>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard
                        label="Your teams"
                        value={teams.length}
                        helper="Teams you own or belong to"
                        icon={Users}
                    />
                    <SummaryCard
                        label="Open requests"
                        value={incomingRequests.length}
                        helper="Pending join approvals"
                        icon={Inbox}
                    />
                    <SummaryCard
                        label="Discoverable"
                        value={filteredDiscoverTeams.length}
                        helper="Groups currently open to explore"
                        icon={Search}
                    />
                    <SummaryCard
                        label="Total seats"
                        value={totalDiscoverCapacity}
                        helper="Capacity across discoverable groups"
                        icon={UserPlus}
                    />
                </div>
            </section>

            {showCreateForm ? (
                <section className="surface-elevated rounded-[30px] p-6 sm:p-7">
                    <div className="mb-6 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-app text-2xl font-semibold">Create a New Team</h2>
                            <p className="text-app-soft mt-1 text-sm leading-6">Write this the way you would pitch the group to a classmate in person.</p>
                        </div>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-[1.15fr_0.6fr]">
                        <div className="space-y-4">
                            <Input
                                label="Team Name"
                                value={teamName}
                                onChange={(event) => setTeamName(event.target.value)}
                                placeholder="Example: Product Sprint Crew"
                            />
                            <div>
                                <p className="text-app mb-1.5 text-sm font-medium">Description</p>
                                <Textarea
                                    value={teamDescription}
                                    onChange={(event) => setTeamDescription(event.target.value)}
                                    placeholder="What is this team building, who should join, and what skills are helpful?"
                                    maxLength={300}
                                    showCount
                                />
                            </div>
                        </div>

                        <div className="space-y-4 rounded-[24px] border border-app bg-surface-strong p-5">
                            <Input
                                label="Capacity"
                                type="number"
                                min={2}
                                max={20}
                                value={teamCapacity}
                                onChange={(event) => setTeamCapacity(event.target.value)}
                            />
                            <div className="rounded-[20px] border border-app bg-surface p-4">
                                <p className="text-app text-sm font-semibold">A good starting point</p>
                                <p className="text-app-soft mt-2 text-sm leading-6">
                                    Small focused teams usually work best between 3 and 6 members. Keep the description concrete so the right people apply.
                                </p>
                            </div>
                            {createError ? <p className="text-sm text-red-500">{createError}</p> : null}
                            {createSuccess ? <p className="text-sm text-emerald-600">{createSuccess}</p> : null}
                            <Button onClick={handleCreateTeam} isLoading={createTeamMutation.isPending} className="w-full">
                                Save Team
                            </Button>
                        </div>
                    </div>
                </section>
            ) : null}

            <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
                <section className="surface-elevated rounded-[30px] p-6 sm:p-7">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-app text-2xl font-semibold">Your Teams</h2>
                            <p className="text-app-soft mt-1 text-sm leading-6">Open a group to manage members, capacity, and project context without jumping between screens.</p>
                        </div>
                        <Badge variant="secondary" className="bg-surface-strong px-3 py-1 text-app">{teams.length}</Badge>
                    </div>

                    {isLoading ? (
                        <div className="flex h-64 items-center justify-center">
                            <Spinner size="lg" />
                        </div>
                    ) : error ? (
                        <div className="rounded-2xl border border-amber-300/50 bg-amber-50/60 p-6 text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                            <h3 className="text-lg font-semibold">Unable to load teams</h3>
                            <p className="mt-1 text-sm">Please sign in from the landing page or try again in a moment.</p>
                        </div>
                    ) : teams.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-app bg-surface-strong p-10 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]">
                                <Users className="h-6 w-6" />
                            </div>
                            <h3 className="text-app text-lg font-semibold">No teams yet</h3>
                            <p className="text-app-soft mt-2 text-sm">Create your first team or browse discoverable teams below to get started.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 lg:grid-cols-2">
                            {teams.map((team) => (
                                <button
                                    key={team.id}
                                    type="button"
                                    onClick={() => router.push(`/teams/${team.id}`)}
                                    className="group rounded-[26px] border border-app bg-surface-strong p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-app-strong hover:bg-surface hover:shadow-soft"
                                >
                                    <div className="mb-5 flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-app text-lg font-semibold">{team.name || 'Untitled Team'}</h3>
                                            <p className="text-app-soft mt-2 line-clamp-2 text-sm leading-6">
                                                {team.description || 'No description available.'}
                                            </p>
                                        </div>
                                        <span className="rounded-full bg-[color:var(--brand-soft)] px-3 py-1 text-sm font-semibold text-[color:var(--brand-strong)]">
                                            {team.members?.length || team.teamMemberCount || 0}/{team.capacity || team.teamCapacity || 0}
                                        </span>
                                    </div>

                                    <div className="mb-5 flex flex-wrap gap-2">
                                        {(team.searchKeywords || []).slice(0, 4).map((keyword) => (
                                            <Badge key={keyword} variant="outline" className="rounded-full border-app bg-surface text-app-soft font-normal">
                                                {keyword}
                                            </Badge>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between border-t border-app pt-4 text-sm">
                                        <span className="text-app-soft">{team.members?.length || team.teamMemberCount || 0} members</span>
                                        <span className="text-app-soft">Capacity {team.capacity || team.teamCapacity || 0}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                <section className="surface-elevated rounded-[30px] p-6 sm:p-7">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-app text-2xl font-semibold">Incoming Join Requests</h2>
                            <p className="text-app-soft mt-1 text-sm leading-6">Review requests from students who want to contribute to your groups.</p>
                        </div>
                        <Badge variant="secondary" className="bg-surface-strong px-3 py-1 text-app">{incomingRequests.length}</Badge>
                    </div>

                    {incomingRequestsLoading ? (
                        <div className="flex h-40 items-center justify-center">
                            <Spinner size="lg" />
                        </div>
                    ) : incomingRequests.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-app bg-surface-strong p-10 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-app-soft">
                                <Inbox className="h-6 w-6" />
                            </div>
                            <h3 className="text-app text-lg font-semibold">No pending requests</h3>
                            <p className="text-app-soft mt-2 text-sm">When someone asks to join one of your teams, it will show up here.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {incomingRequests.map((request) => (
                                <div key={request.id} className="rounded-[24px] border border-app bg-surface-strong p-4">
                                    <p className="text-app-muted mb-3 text-xs font-semibold tracking-[0.08em]">
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
            </div>

            <section className="surface-elevated rounded-[30px] p-6 sm:p-7">
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h2 className="text-app text-2xl font-semibold">Discover Teams</h2>
                        <p className="text-app-soft mt-1 text-sm leading-6">Search by description keywords and look for groups that feel like a natural fit.</p>
                    </div>
                    <div className="w-full max-w-2xl">
                        <Input
                            placeholder="Search teams by mission, stack, or description keywords..."
                            value={teamSearch}
                            onChange={(event) => setTeamSearch(event.target.value)}
                            icon={<Search className="h-4 w-4" />}
                            helperText="Descriptions are converted into searchable keywords behind the scenes."
                        />
                    </div>
                </div>

                {joinFeedback ? (
                    <div className="mb-4 rounded-2xl border border-emerald-300/50 bg-emerald-50/70 p-4 text-sm text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-200">
                        {joinFeedback}
                    </div>
                ) : null}

                {discoverLoading ? (
                    <div className="flex h-40 items-center justify-center">
                        <Spinner size="lg" />
                    </div>
                ) : filteredDiscoverTeams.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-app bg-surface-strong p-10 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-app-soft">
                                <Search className="h-6 w-6" />
                            </div>
                        <h3 className="text-app text-lg font-semibold">No matching teams right now</h3>
                        <p className="text-app-soft mt-2 text-sm">Try a broader keyword or clear the search to see all discoverable teams.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {filteredDiscoverTeams.map((team) => (
                            <div key={team.id} className="flex flex-col rounded-[26px] border border-app bg-surface-strong p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-app-strong hover:bg-surface hover:shadow-soft">
                                <div className="mb-5 flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-app text-lg font-semibold">{team.name || 'Untitled Team'}</h3>
                                        <p className="text-app-soft mt-2 line-clamp-3 text-sm leading-6">
                                            {team.description || 'No description available.'}
                                        </p>
                                    </div>
                                    <span className="rounded-full bg-[color:var(--brand-soft)] px-3 py-1 text-sm font-semibold text-[color:var(--brand-strong)]">
                                        {team.teamMemberCount || team.members.length}/{team.capacity || team.teamCapacity || 0}
                                    </span>
                                </div>

                                <div className="mb-5 flex flex-wrap gap-2">
                                    {(team.searchKeywords || []).slice(0, 5).map((keyword) => (
                                        <Badge key={keyword} variant="outline" className="rounded-full border-app bg-surface text-app-soft font-normal text-xs">
                                            {keyword}
                                        </Badge>
                                    ))}
                                </div>

                                <div className="mt-auto flex items-center justify-between gap-3 border-t border-app pt-4">
                                    <div className="text-app-soft text-sm">
                                        {team.teamMemberCount || team.members.length} members
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleJoinTeam(team.id)}
                                        isLoading={joiningTeamId === team.id}
                                        disabled={joiningTeamId !== null && joiningTeamId !== team.id}
                                    >
                                        Request to Join
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
