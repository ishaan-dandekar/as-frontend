'use client';

import { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi } from '@/api/project';
import { ProjectFilter } from '@/types';

export function useProjects(initialFilters?: ProjectFilter) {
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState<ProjectFilter | undefined>(initialFilters);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error,
        refetch,
    } = useInfiniteQuery({
        queryKey: ['projects', filters],
        queryFn: ({ pageParam = 1 }) =>
            projectApi.getProjects(filters, pageParam).then((res) => res.data),
        getNextPageParam: (lastPage) =>
            lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
        initialPageParam: 1,
    });

    const bookmarkMutation = useMutation({
        mutationFn: (id: string) => projectApi.bookmarkProject(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });

    const projects = data?.pages.flatMap((page) => page.items) ?? [];

    return {
        projects,
        isLoading,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
        bookmarkProject: bookmarkMutation.mutateAsync,
        setFilters
    };
}
