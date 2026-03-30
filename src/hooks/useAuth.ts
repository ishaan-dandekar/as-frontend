'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/api/auth';
import { userApi } from '@/api/user';
import { User } from '@/types';
import { useQueryClient } from '@tanstack/react-query';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const queryClient = useQueryClient();

    const fetchProfile = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await userApi.getProfile();
            setUser(response.data);
            queryClient.setQueryData(['profile'], response.data);
        } catch {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
        } finally {
            setIsLoading(false);
        }
    }, [queryClient]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && !user) {
            fetchProfile();
        }
    }, [fetchProfile, user]);

    const googleLogin = useCallback(async () => {
        setIsLoading(true);
        try {
            const { authorizationUrl } = await authApi.getGoogleOAuthUrl();
            if (!authorizationUrl) {
                throw new Error('Missing Google authorization URL');
            }

            const popup = window.open(authorizationUrl, 'google_oauth', 'width=500,height=600');
            if (!popup) {
                throw new Error('Popup was blocked. Please allow popups and try again.');
            }

            const result = await new Promise<{
                user: User;
                token: string;
                refreshToken: string;
            }>((resolve, reject) => {
                const timeout = window.setTimeout(() => {
                    window.removeEventListener('message', onMessage);
                    clearInterval(storageCheck);
                    reject(new Error('Google sign-in timed out. Please try again.'));
                }, 120000);

                // Check localStorage fallback (popup writes to it if postMessage fails)
                const storageCheck = window.setInterval(() => {
                    try {
                        const raw = localStorage.getItem('google_oauth_result');
                        if (raw) {
                            localStorage.removeItem('google_oauth_result');
                            clearInterval(storageCheck);
                            window.clearTimeout(timeout);
                            window.removeEventListener('message', onMessage);
                            const payload = JSON.parse(raw);
                            const processed = authApi.processGoogleOAuthResult(payload);
                            resolve(processed);
                        }
                    } catch { /* ignore */ }
                }, 500);

                const onMessage = (event: MessageEvent) => {
                    const expectedOrigins = new Set<string>([
                        window.location.origin,
                        'http://localhost:8000',   // backend origin (popup posts from here)
                    ]);
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
                    if (apiUrl) {
                        try { expectedOrigins.add(new URL(apiUrl).origin); } catch { /* */ }
                    }

                    if (!expectedOrigins.has(event.origin)) return;

                    const data = event.data as {
                        type?: string;
                        status?: 'success' | 'error';
                        message?: string;
                        payload?: Record<string, unknown>;
                    };

                    if (data?.type !== 'google_oauth') return;

                    window.clearTimeout(timeout);
                    clearInterval(storageCheck);
                    window.removeEventListener('message', onMessage);

                    if (data.status !== 'success' || !data.payload) {
                        reject(new Error(data.message || 'Google sign-in failed'));
                        return;
                    }

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const processed = authApi.processGoogleOAuthResult(data.payload as any);
                    resolve(processed);
                };

                window.addEventListener('message', onMessage);
            });

            // Store tokens and set user
            localStorage.setItem('token', result.token);
            localStorage.setItem('refreshToken', result.refreshToken);
            localStorage.setItem('userRole', result.user.role);
            setUser(result.user);
            queryClient.setQueryData(['profile'], result.user);
            router.push('/dashboard');
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [router, queryClient]);

    const logout = useCallback(() => {
        if (!window.confirm('Are you sure you want to log out?')) return;
        authApi.logout();
        setUser(null);
        queryClient.removeQueries({ queryKey: ['profile'] });
        router.push('/login');
    }, [router, queryClient]);

    return {
        user,
        isLoading,
        googleLogin,
        logout,
        isAuthenticated: !!user || (typeof window !== 'undefined' && !!localStorage.getItem('token')),
    };
}
