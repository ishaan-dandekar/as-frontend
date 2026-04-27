'use client';

import dynamic from 'next/dynamic';
import { KeyboardEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useUser } from '@/hooks/useUser';
import { Avatar } from '@/components/ui/Avatar';
import { githubApi } from '@/api/github';
import { leetcodeApi } from '@/api/leetcode';
import { Badge } from '@/components/ui/Badge';
import { GraduationCap, Hash, PencilLine, Plus, ShieldCheck, Sparkles, X } from 'lucide-react';
import { POPULAR_SKILL_TAGS, normalizeSkillTag, normalizeSkillTags, parseSkillInput } from '@/lib/skills';
import { formatAcademicProfile, formatUserRole } from '@/lib/profileDisplay';

const ProfileIntegrations = dynamic(
    () => import('@/components/profile/ProfileIntegrations').then((mod) => mod.ProfileIntegrations),
    {
        loading: () => <div className="surface-elevated h-80 animate-pulse rounded-2xl" />,
    }
);

export default function SettingsPage() {
    const { profile, isLoading, updateProfile, isUpdating } = useUser();
    const storedOAuthSession = githubApi.getStoredOAuthSession();
    const storedLeetCodeUsername = leetcodeApi.getStoredUsername();

    const [bio, setBio] = useState('');
    const [githubUsername, setGithubUsername] = useState<string | null | undefined>(storedOAuthSession?.githubUsername || undefined);
    const [leetCodeUsername, setLeetCodeUsername] = useState<string | null | undefined>(storedLeetCodeUsername || undefined);
    const [skills, setSkills] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState('');
    const [skillSearch, setSkillSearch] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const effectiveGithubUsername = githubUsername === null ? undefined : (githubUsername ?? profile?.githubUsername);
    const effectiveLeetCodeUsername = leetCodeUsername === null ? undefined : (leetCodeUsername ?? profile?.leetCodeUrl);

    useEffect(() => {
        if (!profile) return;
        setBio(profile.bio || '');
        setSkills(normalizeSkillTags(profile.skills || []));
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

    const addSkill = useCallback((value: string) => {
        const normalized = normalizeSkillTag(value);
        if (!normalized) return;

        setSkills((prev) => normalizeSkillTags([...prev, normalized]));
        setSkillInput('');
    }, []);

    const addSkillsFromInput = useCallback(() => {
        const parsed = parseSkillInput(skillInput);
        if (parsed.length === 0) return;

        setSkills((prev) => normalizeSkillTags([...prev, ...parsed]));
        setSkillInput('');
    }, [skillInput]);

    const removeSkill = useCallback((skillToRemove: string) => {
        setSkills((prev) => prev.filter((skill) => skill.toLowerCase() !== skillToRemove.toLowerCase()));
    }, []);

    const handleSkillInputKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            addSkillsFromInput();
        }
    }, [addSkillsFromInput]);

    const filteredPopularSkills = useMemo(() => {
        const query = skillSearch.trim().toLowerCase();
        return POPULAR_SKILL_TAGS.filter((skill) => {
            if (skills.includes(skill)) return false;
            return !query || skill.toLowerCase().includes(query);
        });
    }, [skillSearch, skills]);

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
                <div className="grid gap-6 xl:grid-cols-[0.95fr_1.45fr]">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="profile-banner border-b border-app">
                                <div className="flex items-center gap-4">
                                    <Avatar
                                        src={profile?.avatarUrl}
                                        fallback={profile?.name?.charAt(0) || 'U'}
                                        className="border-app bg-surface-strong h-16 w-16 border shadow-sm"
                                    />
                                    <div>
                                        <CardTitle className="text-app text-xl">{profile?.name}</CardTitle>
                                        <CardDescription className="text-app-soft">{profile?.email}</CardDescription>
                                        <div className="mt-2 inline-flex rounded-full bg-[color:var(--accent)] px-3 py-1 text-xs font-semibold text-white">
                                            {formatUserRole(profile?.role)}
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                                    <div className="border-app bg-surface-strong rounded-2xl border p-4">
                                        <p className="text-app-muted flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em]">
                                            <Hash className="h-3.5 w-3.5" />
                                            UID
                                        </p>
                                        <p className="text-app mt-2 text-sm font-semibold">{profile?.uid || profile?.moodleId || 'Not available'}</p>
                                    </div>
                                    <div className="border-app bg-surface-strong rounded-2xl border p-4">
                                        <p className="text-app-muted flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em]">
                                            <GraduationCap className="h-3.5 w-3.5" />
                                            Academic Snapshot
                                        </p>
                                        <p className="text-app mt-2 text-sm font-semibold">
                                            {formatAcademicProfile(profile?.department || profile?.branch, profile?.academicStatus || profile?.year)}
                                        </p>
                                        <p className="text-app-muted mt-1 text-xs">
                                            Admission year: {profile?.admissionYear || 'Not available'}
                                        </p>
                                    </div>
                                    <div className="border-app bg-surface-strong rounded-2xl border p-4">
                                        <p className="text-app-muted flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em]">
                                            <ShieldCheck className="h-3.5 w-3.5" />
                                            Role Access
                                        </p>
                                        <p className="text-app mt-2 text-sm font-semibold">{profile?.role === 'ADMIN' ? 'Admin can host and manage events.' : 'Student profile access is enabled.'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="border-b border-slate-100 bg-slate-50/70">
                                <CardTitle className="text-lg">Read-only academic fields</CardTitle>
                                <CardDescription>These are derived automatically from your APSIT UID during sign-in.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
                                <Input label="Department" value={profile?.department || profile?.branch || 'Not available'} disabled />
                                <Input label="Academic Status" value={profile?.academicStatus || profile?.year || 'Not available'} disabled />
                                <Input label="Admission Year" value={profile?.admissionYear ? String(profile.admissionYear) : 'Not available'} disabled />
                                <Input label="Role" value={formatUserRole(profile?.role)} disabled />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card id="integrations">
                            <CardHeader className="border-b border-slate-100 bg-slate-50/70">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <PencilLine className="h-5 w-5 text-indigo-600" />
                                    Edit Profile
                                </CardTitle>
                                <CardDescription>Update the parts of your profile that are meant to evolve over time.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
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

                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Skills</label>
                                    <p className="text-xs text-slate-500">
                                        Add your own skills manually or pick from the popular tech tags below.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row">
                                        <Input
                                            value={skillInput}
                                            onChange={(e) => setSkillInput(e.target.value)}
                                            onKeyDown={handleSkillInputKeyDown}
                                            placeholder="Type a skill and press Enter or comma"
                                        />
                                        <Button type="button" variant="outline" onClick={addSkillsFromInput} className="sm:self-end">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Skill
                                        </Button>
                                    </div>

                                    <div className="flex min-h-14 flex-wrap gap-2 rounded-lg border border-dashed border-slate-300 bg-white p-3">
                                        {skills.length > 0 ? skills.map((skill) => (
                                            <button
                                                key={skill}
                                                type="button"
                                                onClick={() => removeSkill(skill)}
                                                className="inline-flex"
                                                aria-label={`Remove ${skill}`}
                                            >
                                                <Badge variant="default" className="gap-1 rounded-full bg-teal-100 text-teal-800 hover:bg-teal-200">
                                                    {skill}
                                                    <X className="h-3 w-3" />
                                                </Badge>
                                            </button>
                                        )) : (
                                            <p className="text-sm text-slate-500">No skills added yet.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-white p-4">
                                    <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                                <Sparkles className="h-4 w-4 text-amber-500" />
                                                Popular Tech Skills
                                            </p>
                                            <p className="text-xs text-slate-500">Click any tag to add it to your profile.</p>
                                        </div>
                                        <div className="w-full md:w-72">
                                            <Input
                                                value={skillSearch}
                                                onChange={(e) => setSkillSearch(e.target.value)}
                                                placeholder="Search skill tags"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex max-h-72 flex-wrap gap-2 overflow-y-auto pr-1">
                                        {filteredPopularSkills.map((skill) => (
                                            <button key={skill} type="button" onClick={() => addSkill(skill)}>
                                                <Badge variant="outline" className="cursor-pointer hover:border-teal-300 hover:text-teal-700">
                                                    {skill}
                                                </Badge>
                                            </button>
                                        ))}
                                        {filteredPopularSkills.length === 0 && (
                                            <p className="text-sm text-slate-500">All matching tags are already added.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

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
                </div>
            )}
        </div>
    );
}
