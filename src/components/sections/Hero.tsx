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

    const handleSpotlightMove = (event: React.MouseEvent<HTMLElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        event.currentTarget.style.setProperty('--spotlight-x', `${x}px`);
        event.currentTarget.style.setProperty('--spotlight-y', `${y}px`);
    };

    const resetSpotlight = (event: React.MouseEvent<HTMLElement>) => {
        event.currentTarget.style.setProperty('--spotlight-x', '50%');
        event.currentTarget.style.setProperty('--spotlight-y', '50%');
    };

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
        <section className="relative overflow-hidden pb-20 pt-12 sm:pt-16">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-ambient" />
            <div className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-45" />
            <div className="pointer-events-none absolute inset-0 -z-10 bg-edu opacity-30 bg-parallax" />
            <div className="pointer-events-none absolute inset-0 -z-10 bg-edu-2 opacity-20 bg-parallax" />
            <div className="pointer-events-none absolute -top-24 right-[-10%] h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(31,111,100,0.35),rgba(31,111,100,0))] blur-3xl" />
            <div className="pointer-events-none absolute bottom-[-10%] left-[-12%] h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.28),rgba(245,158,11,0))] blur-3xl" />
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute left-[6%] top-[18%] rotate-[-8deg] rounded-full border border-emerald-200/50 bg-white/60 px-4 py-2 text-[10px] font-semibold text-emerald-700/80 shadow-soft animate-float-slower">
                    E = mc^2
                </div>
                <div className="absolute right-[8%] top-[22%] rotate-[6deg] rounded-full border border-slate-200/60 bg-white/60 px-4 py-2 text-[10px] font-semibold text-slate-700/80 shadow-soft animate-float-slower">
                    a^2 + b^2 = c^2
                </div>
                <div className="absolute left-[14%] bottom-[22%] -rotate-6 rounded-full border border-amber-200/60 bg-white/60 px-4 py-2 text-[10px] font-semibold text-amber-700/80 shadow-soft animate-float-slower">
                    F = ma
                </div>
                <div className="absolute right-[18%] bottom-[18%] rotate-3 rounded-full border border-emerald-200/50 bg-white/60 px-4 py-2 text-[10px] font-semibold text-emerald-700/80 shadow-soft animate-float-slower">
                    H2O
                </div>
                <div className="absolute left-[45%] top-[10%] -rotate-2 rounded-full border border-slate-200/60 bg-white/60 px-4 py-2 text-[10px] font-semibold text-slate-700/80 shadow-soft animate-float-slower">
                    sin^2 x + cos^2 x = 1
                </div>
                <div className="absolute right-[40%] bottom-[8%] rotate-2 rounded-full border border-emerald-200/50 bg-white/60 px-4 py-2 text-[10px] font-semibold text-emerald-700/80 shadow-soft animate-float-slower">
                    d/dx (x^n) = n x^(n-1)
                </div>
                <div className="absolute left-[24%] top-[8%] hidden rotate-[-4deg] rounded-full border border-slate-200/60 bg-white/60 px-4 py-2 text-[10px] font-semibold text-slate-700/80 shadow-soft sm:block animate-float-slower">
                    {'sum_{i=1}^n i = n(n+1)/2'}
                </div>
                <div className="absolute right-[22%] top-[6%] hidden rotate-[4deg] rounded-full border border-amber-200/60 bg-white/60 px-4 py-2 text-[10px] font-semibold text-amber-700/80 shadow-soft sm:block animate-float-slower">
                    integral_0^1 x^2 dx = 1/3
                </div>
                <div className="absolute left-[10%] bottom-[12%] hidden rotate-[3deg] rounded-full border border-emerald-200/60 bg-white/60 px-4 py-2 text-[10px] font-semibold text-emerald-700/80 shadow-soft sm:block animate-float-slower">
                    v = u + at
                </div>
                <div className="absolute right-[12%] bottom-[30%] hidden rotate-[-2deg] rounded-full border border-slate-200/60 bg-white/60 px-4 py-2 text-[10px] font-semibold text-slate-700/80 shadow-soft sm:block animate-float-slower">
                    log_a (xy) = log_a x + log_a y
                </div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="text-center lg:text-left">
                        <p className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-soft">
                            Student collaboration platform
                        </p>

                        <div className="animate-fade-up-delayed mt-6 inline-flex items-center gap-3 rounded-2xl border border-slate-300/70 bg-white/90 px-5 py-3 shadow-soft">
                            <span className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-sm font-semibold text-white">
                                AS
                            </span>
                            <code className="font-mono text-base font-semibold text-slate-800 sm:text-lg">APSIT Student Sphere</code>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                Campus Network
                            </span>
                        </div>

                        <h1 className="animate-fade-up-late mt-8 font-display text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                            A calm, focused space to discover, collaborate, and launch student projects.
                        </h1>

                        <p className="animate-fade-up-late mt-5 max-w-2xl text-balance text-lg text-slate-600 sm:text-xl lg:mx-0">
                            APSIT Student Sphere helps students build profiles, join teams, contribute to projects, and stay ready for hackathons and showcases.
                        </p>

                        <div className="animate-fade-up-late mt-8 w-full max-w-md lg:mx-0">
                            <button
                                type="button"
                                onClick={handleContinueWithGoogle}
                                disabled={isLoading}
                                className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-emerald-200/80 bg-white/95 px-6 py-3 text-sm font-semibold text-slate-800 transition-all duration-200 hover:border-emerald-300 hover:bg-white hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
                                ) : (
                                    <svg className="h-5 w-5" viewBox="0 0 24 24">
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

                    <div className="animate-fade-up-delayed relative">
                        <div className="glass-panel shadow-soft rounded-3xl border border-white/70 p-6 sm:p-7">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Campus Pulse</p>
                                    <p className="mt-2 font-display text-2xl font-bold text-slate-900">
                                        Your project basecamp
                                    </p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 animate-float-slow">
                                    <Rocket className="h-5 w-5" />
                                </div>
                            </div>

                            <div className="mt-6 grid gap-3">
                                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                                    <p className="text-sm font-semibold text-slate-900">Profiles that speak</p>
                                    <p className="mt-1 text-xs text-slate-600">
                                        Showcase skills, domains, and recent wins with clarity.
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                                    <p className="text-sm font-semibold text-slate-900">Smart team matching</p>
                                    <p className="mt-1 text-xs text-slate-600">
                                        Find teammates based on focus areas and availability.
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                                    <p className="text-sm font-semibold text-slate-900">Event-ready workflow</p>
                                    <p className="mt-1 text-xs text-slate-600">
                                        Track milestones and stay on top of campus showcases.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                                <span className="font-semibold text-slate-900">Now onboarding:</span> final-year teams and club initiatives.
                            </div>
                        </div>
                        <div className="pointer-events-none absolute -bottom-6 -left-6 hidden h-24 w-24 rounded-2xl bg-emerald-100/70 blur-2xl sm:block" />
                    </div>
                </div>

                <div className="animate-fade-up-late mx-auto mt-14 max-w-5xl rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-soft sm:p-8">
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
                                className="rounded-2xl border border-slate-200 bg-white/70 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white"
                            >
                                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                    <item.icon className="h-5 w-5" />
                                </div>
                                <p className="text-lg font-bold text-slate-900">{item.title}</p>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
                            </article>
                        ))}
                    </div>
                </div>

                <div className="animate-fade-up-late mx-auto mt-10 max-w-5xl rounded-2xl border border-white/70 bg-white/70 p-6 shadow-soft backdrop-blur-lg sm:p-8">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">How it works</h2>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                            3 Steps
                        </span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <article
                            className="spotlight-card rounded-2xl border border-white/70 bg-white/60 p-5 shadow-soft backdrop-blur-lg"
                            onMouseMove={handleSpotlightMove}
                            onMouseLeave={resetSpotlight}
                        >
                            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                <Compass className="h-5 w-5" />
                            </div>
                            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Step 1</p>
                            <p className="mt-1 text-lg font-bold text-slate-900">Discover Opportunities</p>
                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                Explore students and ongoing work across domains that match your interests.
                            </p>
                        </article>

                        <article
                            className="spotlight-card rounded-2xl border border-white/70 bg-white/60 p-5 shadow-soft backdrop-blur-lg"
                            onMouseMove={handleSpotlightMove}
                            onMouseLeave={resetSpotlight}
                        >
                            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                <Users className="h-5 w-5" />
                            </div>
                            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Step 2</p>
                            <p className="mt-1 text-lg font-bold text-slate-900">Collaborate in Teams</p>
                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                Build with teammates who complement your skills and contribute consistently.
                            </p>
                        </article>

                        <article
                            className="spotlight-card rounded-2xl border border-white/70 bg-white/60 p-5 shadow-soft backdrop-blur-lg"
                            onMouseMove={handleSpotlightMove}
                            onMouseLeave={resetSpotlight}
                        >
                            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
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
