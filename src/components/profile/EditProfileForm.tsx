'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { userApi } from '@/api/user';
import { useRouter } from 'next/navigation';
import { Github, Globe, MapPin, Camera } from 'lucide-react';

const profileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    bio: z.string().max(160, 'Bio must be less than 160 characters').optional(),
    location: z.string().optional(),
    githubUsername: z.string().optional(),
    website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface EditProfileFormProps {
    user: User;
}

export function EditProfileForm({ user }: EditProfileFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user.name,
            bio: user.bio || '',
            location: user.location || '',
            githubUsername: user.githubUsername || '',
            website: user.website || '',
        },
    });

    const onSubmit = async (data: ProfileFormValues) => {
        setIsLoading(true);
        setError(null);
        try {
            await userApi.updateProfile(data);
            router.refresh();
            router.push('/profile');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="relative group">
                    <Avatar
                        src={user.avatarUrl}
                        fallback={user.name.charAt(0)}
                        className="h-24 w-24 border-2 border-white shadow-md"
                    />
                    <button
                        type="button"
                        className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Camera className="h-6 w-6" />
                    </button>
                </div>
                <div className="text-center sm:text-left">
                    <h3 className="text-lg font-semibold text-slate-900">Profile Picture</h3>
                    <p className="text-sm text-slate-500">Click to upload a new image </p>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                    {error}
                </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
                <Input
                    label="Full Name"
                    {...register('name')}
                    error={errors.name?.message}
                />
                <Input
                    label="Location"
                    placeholder="New York, NY"
                    {...register('location')}
                    error={errors.location?.message}
                    icon={<MapPin className="h-4 w-4" />}
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Bio</label>
                <textarea
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                    placeholder="Tell us about yourself..."
                    {...register('bio')}
                />
                {errors.bio && <p className="text-xs text-red-500">{errors.bio.message}</p>}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
                <Input
                    label="GitHub Username"
                    placeholder="octocat"
                    {...register('githubUsername')}
                    error={errors.githubUsername?.message}
                    icon={<Github className="h-4 w-4" />}
                />
                <Input
                    label="Website"
                    placeholder="https://example.com"
                    {...register('website')}
                    error={errors.website?.message}
                    icon={<Globe className="h-4 w-4" />}
                />
            </div>

            <div className="flex justify-end gap-4">
                <Button type="button" variant="ghost" onClick={() => router.back()}>
                    Cancel
                </Button>
                <Button type="submit" isLoading={isLoading}>
                    Save Changes
                </Button>
            </div>
        </form>
    );
}
