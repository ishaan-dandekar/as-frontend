'use client';

import { useEffect, useState } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import { MapPin, PencilLine, Shield, Sparkles } from 'lucide-react';

export default function SettingsPage() {
    const { profile, isLoading, updateProfile, isUpdating } = useUser();
    const { logout } = useAuth();

    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [location, setLocation] = useState('');
    const [githubUsername, setGithubUsername] = useState('');
    const [leetCodeUrl, setLeetCodeUrl] = useState('');
    const [skillsText, setSkillsText] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!profile) return;
        setName(profile.name || '');
        setBio(profile.bio || '');
        setLocation(profile.location || '');
        setGithubUsername(profile.githubUsername || '');
        setLeetCodeUrl(profile.leetCodeUrl || '');
        setSkillsText((profile.skills || []).join(', '));
    }, [profile]);

    const onSave = async () => {
        setMessage(null);
        setError(null);

        try {
            const skills = skillsText
                .split(',')
                .map((skill) => skill.trim())
                .filter(Boolean);

            await updateProfile({
                name,
                bio,
                location,
                githubUsername,
                leetCodeUrl,
                skills,
            });

            setMessage('Profile updated successfully.');
        } catch (err: unknown) {
            const apiError = err as { response?: { data?: { message?: string | Record<string, unknown> } } };
            const message = apiError.response?.data?.message;
            setError(typeof message === 'string' ? message : 'Failed to update profile. Please try again.');
        }
    };

    return (
        <div className="space-y-6">
            <Breadcrumbs items={[{ label: 'Settings' }]} />

            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
                <p className="text-slate-600">Customize your public profile and account preferences.</p>
            </div>

            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <Spinner size="lg" />
                </div>
            ) : (
                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
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
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your full name"
                            />

                            <Input
                                label="Location"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="City, Country"
                                icon={<MapPin className="h-4 w-4" />}
                            />

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
                                label="GitHub Username"
                                value={githubUsername}
                                onChange={(e) => setGithubUsername(e.target.value)}
                                placeholder="octocat"
                            />

                            <Input
                                label="LeetCode Username"
                                value={leetCodeUrl}
                                onChange={(e) => setLeetCodeUrl(e.target.value)}
                                placeholder="leetcode_user"
                            />

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

                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="border-b border-slate-100 bg-slate-50/70">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Shield className="h-5 w-5 text-slate-700" />
                                    Session
                                </CardTitle>
                                <CardDescription>Manage your current login session securely.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="danger" className="w-full" onClick={logout}>
                                    Logout
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="border-b border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50/60">
                                <CardTitle className="flex items-center gap-2 text-xl text-amber-800">
                                    <Sparkles className="h-5 w-5" />
                                    Profile Tips
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-slate-600">
                                <p>Add location so teammates can find collaborators in nearby time zones.</p>
                                <p>Keep your bio short and specific for better profile discovery.</p>
                                <p>List your strongest skills first (comma-separated).</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
