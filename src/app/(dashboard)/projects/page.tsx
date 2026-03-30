'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useDebounce, useIntersectionObserver } from '@/hooks/utils';
import { useUser } from '@/hooks/useUser';
import { Project } from '@/types';
import { projectApi } from '@/api/project';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

export default function ProjectFeedPage() {
    const { profile } = useUser();
    const [search, setSearch] = useState('');
    const [tech, setTech] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState<'ALL' | Project['status']>('ALL');
    const [requestStateMap, setRequestStateMap] = useState<Record<string, 'idle' | 'loading' | 'sent' | 'error'>>({});
    const [requestMessage, setRequestMessage] = useState<string | null>(null);
    const debouncedSearch = useDebounce(search, 500);

    const {
        projects,
        isLoading,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
        bookmarkProject,
        setFilters,
    } = useProjects();

    const validProjects = (Array.isArray(projects) ? projects : []).filter(
        (project): project is Project => Boolean(project && typeof project === 'object' && (project as Project).id)
    );

    const profileId = profile?.id;
    const sortedProjects = useMemo(
        () =>
            [...validProjects]
                .sort((a, b) => {
                    const memberDelta = (b.teamMemberCount || 0) - (a.teamMemberCount || 0);
                    if (memberDelta !== 0) return memberDelta;

                    const updatedDelta = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                    return Number.isNaN(updatedDelta) ? 0 : updatedDelta;
                }),
        [validProjects]
    );

    useEffect(() => {
        setFilters({
            search: debouncedSearch,
            status: statusFilter === 'ALL' ? undefined : statusFilter,
            techStack: tech === 'ALL' ? undefined : [tech],
        });
    }, [debouncedSearch, setFilters, statusFilter, tech]);

    const loadMoreRef = useIntersectionObserver(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    });

    const handleRequestToJoin = async (projectId: string) => {
        setRequestMessage(null);
        setRequestStateMap((prev) => ({ ...prev, [projectId]: 'loading' }));

        try {
            const response = await projectApi.requestToJoinProject(projectId);
            const successMessage = response.message || 'Request sent successfully.';
            setRequestStateMap((prev) => ({ ...prev, [projectId]: 'sent' }));
            setRequestMessage(successMessage);
        } catch (error: unknown) {
            const apiError = error as { response?: { data?: { message?: string } } };
            const message = apiError.response?.data?.message || 'Failed to send request. Please try again.';
            setRequestStateMap((prev) => ({ ...prev, [projectId]: 'error' }));
            setRequestMessage(message);
        }
    };

    return (
        <div className="space-y-6">
            <Breadcrumbs items={[{ label: 'Browse Projects' }]} />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Browse Projects</h1>
                    <p className="text-slate-600">
                        Explore student projects across all statuses.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search projects..."
                            className="pl-9 bg-white"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select
                        className="w-full sm:w-40 bg-white"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as 'ALL' | Project['status'])}
                        options={[
                            { label: 'All Status', value: 'ALL' },
                            { label: 'Active', value: 'ACTIVE' },
                            { label: 'Looking for Teammates', value: 'LOOKING_FOR_TEAMMATES' },
                            { label: 'In Progress', value: 'IN_PROGRESS' },
                            { label: 'Completed', value: 'COMPLETED' },
                        ]}
                    />
                    <Select
                        className="w-full sm:w-40 bg-white"
                        value={tech}
                        onChange={(e) => setTech(e.target.value)}
                        options={[
                            { label: 'All Tech', value: 'ALL' },
                            { label: 'React', value: 'React' },
                            { label: 'Node.js', value: 'Node.js' },
                            { label: 'Python', value: 'Python' },
                            { label: 'TypeScript', value: 'TypeScript' },
                            { label: 'Tailwind', value: 'Tailwind' },
                        ]}
                    />
                </div>
            </div>

            {requestMessage && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {requestMessage}
                </div>
            )}

            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <Spinner size="lg" />
                </div>
            ) : sortedProjects.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
                    <h3 className="text-lg font-semibold text-slate-900">No projects found</h3>
                    <p className="mt-2 text-slate-500">
                        Try another search or check back soon.
                    </p>
                </div>
            ) : (
                <>
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    >
                        {sortedProjects.map((project) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onBookmark={bookmarkProject}
                                onRequestToJoin={project.ownerId === profileId ? undefined : handleRequestToJoin}
                                disableRequestButton={requestStateMap[project.id] === 'loading' || requestStateMap[project.id] === 'sent'}
                                requestButtonLabel={
                                    requestStateMap[project.id] === 'loading'
                                        ? 'Sending...'
                                        : requestStateMap[project.id] === 'sent'
                                            ? 'Request Sent'
                                            : 'Request to Work'
                                }
                            />
                        ))}
                    </motion.div>

                    <div ref={loadMoreRef} className="flex h-24 items-center justify-center">
                        {isFetchingNextPage && <Spinner />}
                        {!hasNextPage && sortedProjects.length > 0 && (
                            <p className="text-sm text-slate-400">You&apos;ve reached the end of the feed.</p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
