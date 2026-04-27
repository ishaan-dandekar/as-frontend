'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/api/user';
import { User } from '@/types';

type UseUserOptions = {
    enabled?: boolean;
    refetchOnMount?: boolean | 'always';
};

export function useUser(options?: UseUserOptions) {
    const queryClient = useQueryClient();

    const { data: profile, isLoading, isFetching, isFetchedAfterMount, error } = useQuery({
        queryKey: ['profile'],
        queryFn: () => userApi.getProfile().then((res) => res.data),
        retry: false,
        enabled: options?.enabled ?? true,
        staleTime: 5 * 60 * 1000,
        gcTime: 15 * 60 * 1000,
        refetchOnMount: options?.refetchOnMount ?? true,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    const updateProfileMutation = useMutation({
        mutationFn: (userData: Partial<User>) => userApi.updateProfile(userData),
        onSuccess: (response) => {
            queryClient.setQueryData(['profile'], response.data);
        },
    });

    return {
        profile,
        isLoading,
        isFetching,
        isFetchedAfterMount,
        error,
        updateProfile: updateProfileMutation.mutateAsync,
        isUpdating: updateProfileMutation.isPending,
    };
}
