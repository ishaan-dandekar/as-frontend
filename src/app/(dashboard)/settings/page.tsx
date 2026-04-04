'use client';

import { useCallback, useEffect, useState } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useUser } from '@/hooks/useUser';
import { Avatar } from '@/components/ui/Avatar';
import { ProfileIntegrations } from '@/components/profile/ProfileIntegrations';
import { githubApi } from '@/api/github';
import { leetcodeApi } from '@/api/leetcode';
import { PencilLine } from 'lucide-react';

export default function SettingsPage() {
    const { profile, isLoading, updateProfile, isUpdating } = useUser();
    const storedOAuthSession = githubApi.getStoredOAuthSession();
    const storedLeetCodeUsername = leetcodeApi.getStoredUsername();

    const [bio, setBio] = useState('');
    const [githubUsername, setGithubUsername] = useState<string | null | undefined>(storedOAuthSession?.githubUsername || undefined);
    const [leetCodeUsername, setLeetCodeUsername] = useState<string | null | undefined>(storedLeetCodeUsername || undefined);
    const [skillsText, setSkillsText] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const effectiveGithubUsername = githubUsername === null ? undefined : (githubUsername ?? profile?.githubUsername);
    const effectiveLeetCodeUsername = leetCodeUsername === null ? undefined : (leetCodeUsername ?? profile?.leetCodeUrl);

    useEffect(() => {
        if (!profile) return;
        setBio(profile.bio || '');
        setSkillsText((profile.skills || []).join(', '));
    }, [profile]);

    useEffect(() => {
        if (!profile?.leetCodeUrl) return;
        const normalized = leetcodeApi.normalizeUsername(profile.leetCodeUrl);
        if (!normalized) return;
        setLeetCodeUsername((prev) => prev ?? normalized);
        leetcodeApi.setStoredUsername(normalized);
    }, [profile?.leetCodeUrl]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const params = new URLSearchParams(window.location.search);
        const status = params.get('github_oauth');
        if (!status) return;

        const sessionId = params.get('session_id') || '';
        const githubUsernameFromQuery = params.get('github_username') || '';
        const githubMessage = params.get('github_message') || '';

        if (status === 'success' && sessionId && githubUsernameFromQuery) {
            const session = {
                sessionId,
                githubUsername: githubUsernameFromQuery,
            };

            githubApi.setStoredOAuthSession(session);
            setGithubUsername(githubUsernameFromQuery);
            void updateProfile({ githubUsername: githubUsernameFromQuery });

            try {
                if (window.opener && !window.opener.closed) {
                    window.opener.postMessage(
                        {
                            type: 'github_oauth',
                            status: 'success',
                            message: 'GitHub connected',
                            payload: session,
                        },
                        window.location.origin,
                    );
                }
            } catch {
                // Ignore opener messaging failures; localStorage session is already persisted.
            }

            window.history.replaceState({}, document.title, window.location.pathname);

            try {
                if (window.opener && !window.opener.closed) {
                    window.close();
                }
            } catch {
                // Ignore popup close errors.
            }
            return;
        }

        if (status === 'error') {
            setError(githubMessage || 'GitHub authorization failed. Please try again.');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [updateProfile]);

    const onSave = async () => {
        setMessage(null);
        setError(null);

        try {
            const skills = skillsText
                .split(',')
                .map((skill) => skill.trim())
                .filter(Boolean);

            await updateProfile({
                bio,
                skills,
            });

            setMessage('Settings updated successfully.');
        } catch (err: unknown) {
            const apiError = err as { response?: { data?: { message?: string | Record<string, unknown> } } };
            const message = apiError.response?.data?.message;
            setError(typeof message === 'string' ? message : 'Failed to update profile. Please try again.');
        }
    };

    const handleGithubConnect = useCallback((username: string) => {
        const next = (username || '').trim();
        if (!next) return;

        setGithubUsername((prev) => (prev === next ? prev : next));
        if (effectiveGithubUsername !== next) {
            void updateProfile({ githubUsername: next });
        }
    }, [effectiveGithubUsername, updateProfile]);

    const handleLeetCodeConnect = useCallback((username: string) => {
        const normalized = leetcodeApi.normalizeUsername(username);
        setLeetCodeUsername((prev) => (prev === normalized ? prev : normalized));
        leetcodeApi.setStoredUsername(normalized);
        if ((effectiveLeetCodeUsername || '') !== (username || '')) {
            void updateProfile({ leetCodeUrl: username });
        }
    }, [effectiveLeetCodeUsername, updateProfile]);

    const handleGithubDisconnect = useCallback(() => {
        setGithubUsername((prev) => (prev === null ? prev : null));
        if (effectiveGithubUsername) {
            void updateProfile({ githubUsername: '' });
        }
    }, [effectiveGithubUsername, updateProfile]);

    const handleLeetCodeDisconnect = useCallback(() => {
        setLeetCodeUsername((prev) => (prev === null ? prev : null));
        leetcodeApi.clearStoredUsername();
        if (effectiveLeetCodeUsername) {
            void updateProfile({ leetCodeUrl: '' });
        }
    }, [effectiveLeetCodeUsername, updateProfile]);

    return (
        <div className="space-y-6">
            <Breadcrumbs items={[{ label: 'Settings' }]} />

            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
                <p className="text-slate-600">Manage editable profile fields and connected coding accounts.</p>
            </div>

            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <Spinner size="lg" />
                </div>
            ) : (
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="border-b border-slate-100 bg-slate-50/70">
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <PencilLine className="h-5 w-5 text-indigo-600" />
                                Edit Profile
                            </CardTitle>
                            <CardDescription>These details are shown on your profile and project collaborations.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {message && (
                                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                                    {message}
                                </div>
                            )}

                            {error && (
                                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            <Input
                                label="Full Name"
                                value={profile?.name || ''}
                                disabled
                                helperText="Name is synced from your Google account and cannot be edited here."
                            />

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center gap-3">
                                    <Avatar
                                        src={profile?.avatarUrl}
                                        fallback={profile?.name?.charAt(0) || 'U'}
                                        className="h-16 w-16 border border-slate-200"
                                    />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">Profile Picture</p>
                                        <p className="text-xs text-slate-600">This avatar is synced from your Google account.</p>
                                    </div>
                                </div>
                                <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                    Your profile picture matches with Google. To change it here, update your Google profile photo.
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Bio</label>
                                <textarea
                                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[100px]"
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Tell us about yourself"
                                />
                            </div>

                            <Input
                                label="Skills"
                                value={skillsText}
                                onChange={(e) => setSkillsText(e.target.value)}
                                placeholder="React, Python, Django"
                            />

                            <div className="flex justify-end">
                                <Button onClick={onSave} isLoading={isUpdating}>Save Changes</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="border-b border-slate-100 bg-slate-50/70">
                            <CardTitle className="text-xl">Coding Integrations</CardTitle>
                            <CardDescription>Connect GitHub and LeetCode from settings to power your profile stats.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ProfileIntegrations
                                githubUsername={effectiveGithubUsername}
                                leetCodeUsername={effectiveLeetCodeUsername}
                                onGithubConnect={handleGithubConnect}
                                onLeetCodeConnect={handleLeetCodeConnect}
                                onGithubDisconnect={handleGithubDisconnect}
                                onLeetCodeDisconnect={handleLeetCodeDisconnect}
                            />
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
