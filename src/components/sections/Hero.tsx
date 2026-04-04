'use client';

import { useState } from 'react';
import { CalendarDays, Compass, Rocket, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const valueProps = [
    {
        title: 'Find collaborators fast',
        description: 'Discover APSIT students by skills, interests, and project goals.',
        icon: Compass,
    },
    {
        title: 'Build with clear teams',
        description: 'Create teams, manage requests, and collaborate with defined roles.',
        icon: Users,
    },
    {
        title: 'Ship and showcase',
        description: 'Track project progress and present outcomes in campus events.',
        icon: Rocket,
    },
    {
        title: 'Never miss an event',
        description: 'Stay updated with registrations, reminders, and important deadlines.',
        icon: CalendarDays,
    },
];

export function Hero() {
    const { googleLogin, isLoading } = useAuth();
    const [error, setError] = useState<string | null>(null);

    const handleContinueWithGoogle = async () => {
        setError(null);
        try {
            await googleLogin();
        } catch (err: unknown) {
            const authError = err as { message?: string };
            setError(authError.message || 'Sign-in failed. Please try again.');
        }
    };

    return (
        <section className="pb-16 pt-8 sm:pt-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
                    <p className="animate-fade-up rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                        Student collaboration platform
                    </p>

                    <div className="animate-fade-up-delayed mt-6 inline-flex items-center gap-3 rounded-2xl border border-slate-300 bg-white px-5 py-3 shadow-sm">
                        <span className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-sm font-semibold text-white">
                            AS
                        </span>
                        <code className="font-mono text-base font-semibold text-slate-800 sm:text-lg">APSIT Student Sphere</code>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            Campus Network
                        </span>
                    </div>

                    <h1 className="animate-fade-up-late mt-8 font-display text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                        One place to discover, collaborate, and launch student projects.
                    </h1>

                    <p className="animate-fade-up-late mt-5 max-w-3xl text-balance text-lg text-slate-600 sm:text-xl">
                        APSIT Student Sphere helps students build profiles, join teams, contribute to projects, and stay ready for hackathons and showcases.
                    </p>

                    <div className="animate-fade-up-late mt-8 w-full max-w-md">
                        <button
                            type="button"
                            onClick={handleContinueWithGoogle}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 h-12 px-6 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all duration-200 hover:shadow-md hover:border-slate-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
                            ) : (
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                            )}
                            {isLoading ? 'Signing in...' : 'Continue with Google'}
                        </button>
                        <p className="mt-3 text-xs text-slate-500">
                            Only <span className="font-semibold text-slate-700">@apsit.edu.in</span> accounts are accepted.
                        </p>
                        {error && (
                            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                <div className="animate-fade-up-late mx-auto mt-14 max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">What you can do here</h2>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                            Purpose
                        </span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {valueProps.map((item) => (
                            <article
                                key={item.title}
                                className="rounded-xl border border-slate-200 bg-slate-50 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
                            >
                                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-700">
                                    <item.icon className="h-5 w-5" />
                                </div>
                                <p className="text-lg font-bold text-slate-900">{item.title}</p>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
                            </article>
                        ))}
                    </div>
                </div>

                <div className="animate-fade-up-late mx-auto mt-10 max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">How it works</h2>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                            3 Steps
                        </span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-700">
                                <Compass className="h-5 w-5" />
                            </div>
                            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Step 1</p>
                            <p className="mt-1 text-lg font-bold text-slate-900">Discover Opportunities</p>
                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                Explore students and ongoing work across domains that match your interests.
                            </p>
                        </article>

                        <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-700">
                                <Users className="h-5 w-5" />
                            </div>
                            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Step 2</p>
                            <p className="mt-1 text-lg font-bold text-slate-900">Collaborate in Teams</p>
                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                Build with teammates who complement your skills and contribute consistently.
                            </p>
                        </article>

                        <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-700">
                                <Rocket className="h-5 w-5" />
                            </div>
                            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Step 3</p>
                            <p className="mt-1 text-lg font-bold text-slate-900">Showcase Impact</p>
                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                Participate in events, track progress, and turn outcomes into a stronger profile.
                            </p>
                        </article>
                    </div>
                </div>
            </div>
        </section>
    );
}
