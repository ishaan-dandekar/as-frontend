'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Users, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { teamApi } from '@/api/team';
import { Team } from '@/types';
import { useUser } from '@/hooks/useUser';

export default function TeamsPage() {
    const router = useRouter();
    const { profile, isLoading: profileLoading } = useUser();

    useEffect(() => {
        if (profileLoading || profile) return;
        router.replace('/login');
    }, [profile, profileLoading, router]);

    const { data: teamsRes, isLoading, error } = useQuery({
        queryKey: ['my-teams'],
        queryFn: () => teamApi.getMyTeams(),
        retry: false,
        enabled: !!profile,
    });

    const teams = (teamsRes?.data || []) as Team[];

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

            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Teams</h1>
                <p className="text-slate-600">View and manage teams you are part of.</p>
            </div>

            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <Spinner size="lg" />
                </div>
            ) : error ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
                    <h3 className="text-lg font-semibold">Unable to load teams</h3>
                    <p className="mt-1 text-sm">Please login first or try again in a moment.</p>
                </div>
            ) : teams.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                        <Users className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">No teams to show yet</h3>
                    <p className="mt-2 text-slate-500">
                        Join a project team from the projects section to see your teams here.
                    </p>

                    <div className="mt-6">
                        <Link href="/projects">
                            <Button className="gap-2">
                                Explore Projects
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {teams.map((team) => (
                        <div key={team.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
