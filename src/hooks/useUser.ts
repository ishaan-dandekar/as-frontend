'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/api/user';
import { User } from '@/types';

type UseUserOptions = {
    enabled?: boolean;
};

export function useUser(options?: UseUserOptions) {
    const queryClient = useQueryClient();

    const { data: profile, isLoading, error } = useQuery({
        queryKey: ['profile'],
        queryFn: () => userApi.getProfile().then((res) => res.data),
        retry: false,
        enabled: options?.enabled ?? true,
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
        error,
        updateProfile: updateProfileMutation.mutateAsync,
        isUpdating: updateProfileMutation.isPending,
    };
}
