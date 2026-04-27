'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/api/auth';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '@/types';

export function useAuth() {
    const [isLoading, setIsLoading] = useState(false);
    const [hasToken, setHasToken] = useState(false);
    const router = useRouter();
    const queryClient = useQueryClient();

    useEffect(() => {
        setHasToken(!!localStorage.getItem('token'));
    }, []);

    const googleLogin = useCallback(async () => {
        setIsLoading(true);
        let popup: Window | null = null;
        try {
            // Clear stale payloads from previous attempts.
            localStorage.removeItem('google_oauth_result');

            const popupWidth = 500;
            const popupHeight = 650;
            const dualScreenLeft = window.screenLeft ?? window.screenX ?? 0;
            const dualScreenTop = window.screenTop ?? window.screenY ?? 0;
            const viewportWidth = window.innerWidth || document.documentElement.clientWidth || screen.width;
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight || screen.height;
            const popupLeft = Math.max(0, Math.round(dualScreenLeft + (viewportWidth - popupWidth) / 2));
            const popupTop = Math.max(0, Math.round(dualScreenTop + (viewportHeight - popupHeight) / 2));

            // Open popup immediately in direct response to user click to avoid popup blockers.
            popup = window.open(
                '',
                'google_oauth',
                `width=${popupWidth},height=${popupHeight},left=${popupLeft},top=${popupTop},menubar=no,toolbar=no,location=yes,resizable=yes,scrollbars=yes,status=no`
            );
            if (!popup) {
                throw new Error('Popup was blocked. Please allow popups and try again.');
            }

            const { authorizationUrl } = await authApi.getGoogleOAuthUrl(window.location.origin);
            if (!authorizationUrl) {
                throw new Error('Missing Google authorization URL');
            }
            popup.location.href = authorizationUrl;

            const result = await new Promise<{
                user: User;
                token: string;
                refreshToken: string;
            }>((resolve, reject) => {
                let settled = false;
                let popupClosedAt: number | null = null;

                const finish = (
                    mode: 'resolve' | 'reject',
                    value: { user: User; token: string; refreshToken: string } | Error
                ) => {
                    if (settled) return;
                    settled = true;
                    window.clearTimeout(timeout);
                    clearInterval(storageCheck);
                    clearInterval(popupClosedCheck);
                    window.removeEventListener('message', onMessage);
                    window.removeEventListener('storage', onStorage);

                    if (mode === 'resolve') {
                        resolve(value as { user: User; token: string; refreshToken: string });
                    } else {
                        reject(value);
                    }
                };

                const tryResolveFromStorage = () => {
                    try {
                        const raw = localStorage.getItem('google_oauth_result');
                        if (!raw) return false;
                        const payload = JSON.parse(raw);
                        const processed = authApi.processGoogleOAuthResult(payload);
                        localStorage.removeItem('google_oauth_result');
                        finish('resolve', processed);
                        return true;
                    } catch {
                        return false;
                    }
                };

                const timeout = window.setTimeout(() => {
                    finish('reject', new Error('Google sign-in timed out. Please try again.'));
                }, 120000);

                // Check localStorage fallback (popup writes to it if postMessage fails)
                const storageCheck = window.setInterval(() => {
                    tryResolveFromStorage();
                }, 200);

                const onStorage = (event: StorageEvent) => {
                    if (event.key === 'google_oauth_result') {
                        tryResolveFromStorage();
                    }
                };

                window.addEventListener('storage', onStorage);

                const popupClosedCheck = window.setInterval(() => {
                    if (!popup || popup.closed) {
                        if (tryResolveFromStorage()) return;

                        if (popupClosedAt === null) {
                            popupClosedAt = Date.now();
                            return;
                        }

                        // Give a short grace period for opener message/localStorage propagation.
                        if (Date.now() - popupClosedAt >= 5000) {
                            finish('reject', new Error('Google sign-in cancelled.'));
                        }
                    }
                }, 200);

                const onMessage = (event: MessageEvent) => {
                    const expectedOrigins = new Set<string>([window.location.origin]);
                    const apiBase = process.env.NEXT_PUBLIC_API_URL?.trim()
                        || `${window.location.protocol}//${window.location.hostname}:8000/api`;
                    try {
                        expectedOrigins.add(new URL(apiBase).origin);
                    } catch {
                        // Ignore malformed API URL and keep same-origin validation.
                    }

                    if (!expectedOrigins.has(event.origin)) return;

                    const data = event.data as {
                        type?: string;
                        status?: 'success' | 'error';
                        message?: string;
                        payload?: Record<string, unknown>;
                    };

                    if (data?.type !== 'google_oauth') return;

                    if (data.status !== 'success' || !data.payload) {
                        finish('reject', new Error(data.message || 'Google sign-in failed'));
                        return;
                    }

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const processed = authApi.processGoogleOAuthResult(data.payload as any);
                    finish('resolve', processed);
                };

                window.addEventListener('message', onMessage);
            });

            // Store tokens and set user
            localStorage.setItem('token', result.token);
            localStorage.setItem('refreshToken', result.refreshToken);
            localStorage.setItem('userRole', result.user.role);
            setHasToken(true);
            queryClient.setQueryData(['profile'], result.user);
            router.push('/dashboard');
        } catch (error) {
            if (popup && !popup.closed) {
                popup.close();
            }
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [router, queryClient]);

    const logout = useCallback(() => {
        if (!window.confirm('Are you sure you want to log out?')) return;
        authApi.logout();
        setHasToken(false);
        queryClient.removeQueries({ queryKey: ['profile'] });
        router.push('/');
    }, [router, queryClient]);

    return {
        user: null as User | null,
        isLoading,
        googleLogin,
        logout,
        isAuthenticated: hasToken,
    };
}
