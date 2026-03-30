'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, Compass, LayoutDashboard, LogOut, Rocket, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

const importantSections = [
    {
        title: 'Discover',
        description: 'See student profiles with their GitHub and LeetCode links to find collaborators.',
        href: '/discover',
        icon: Compass,
        iconClass: 'text-slate-800',
        iconBgClass: 'bg-slate-200',
    },
    {
        title: 'Browse Projects',
        description: 'Explore repositories and project details to choose where you can contribute.',
        href: '/projects',
        icon: Search,
        iconClass: 'text-slate-800',
        iconBgClass: 'bg-slate-200',
    },
    {
        title: 'Dashboard',
        description: 'View your overview, recommendations, requests, and collaboration progress.',
        href: '/dashboard',
        icon: LayoutDashboard,
        iconClass: 'text-slate-800',
        iconBgClass: 'bg-slate-200',
    },
    {
        title: 'Teams',
        description: 'Access your teams and collaboration space. Login is required to continue.',
        href: '/teams',
        icon: Users,
        iconClass: 'text-slate-800',
        iconBgClass: 'bg-slate-200',
    },
    {
        title: 'Events',
        description: 'View upcoming hackathons, showcases, and deadlines in one calendar.',
        href: '/events',
        icon: Calendar,
        iconClass: 'text-slate-800',
        iconBgClass: 'bg-slate-200',
    },
];

export function Hero() {
    const { isAuthenticated, logout } = useAuth();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    return (
        <section className="pb-16 pt-14 sm:pt-20">
            {isMounted && isAuthenticated && (
                <div className="fixed right-4 top-4 z-50 sm:right-6 sm:top-5">
                    <Button variant="outline" size="sm" onClick={logout} className="gap-2 border-slate-300 bg-white text-slate-800">
                        <LogOut className="h-4 w-4" />
                        Log out
                    </Button>
                </div>
            )}

            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center text-center">
                    <p className="animate-fade-up rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                        Student collaboration platform
                    </p>

                    <div className="animate-fade-up-delayed mt-6 inline-flex items-center gap-3 rounded-2xl border border-slate-300 bg-white px-5 py-3 shadow-sm">
                        <span className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-sm font-semibold text-white">
                            ASS
                        </span>
                        <code className="font-mono text-base font-semibold text-slate-800 sm:text-lg">APSIT Student Sphere</code>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            README
                        </span>
                    </div>

                    <p className="animate-fade-up-late mt-8 max-w-2xl text-balance text-lg text-slate-600 sm:text-xl">
                        Discover ideas, find collaborators, and participate in events, all in one simple place.
                    </p>
                </div>

                <div className="animate-fade-up-late mx-auto mt-16 max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">Sections</h2>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                            Quick Access
                        </span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {importantSections.map((section) => (
                            <Link
                                key={section.title}
                                href={section.href}
                                className="group rounded-xl border border-slate-200 bg-slate-50 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:bg-white hover:shadow-sm"
                            >
                                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${section.iconBgClass} ${section.iconClass}`}>
                                    <section.icon className="h-5 w-5" />
                                </div>
                                <p className="text-lg font-bold text-slate-900">{section.title}</p>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">{section.description}</p>
                                <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                                    Open
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="animate-fade-up-late mx-auto mt-10 max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">Your journey in three steps</h2>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                            Simple Flow
                        </span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-700">
                                <Compass className="h-5 w-5" />
                            </div>
                            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Step 1</p>
                            <p className="mt-1 text-lg font-bold text-slate-900">Discover Ideas</p>
                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                Explore active projects by skill, interest, or domain and find where you can contribute.
                            </p>
                        </article>

                        <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-700">
                                <Users className="h-5 w-5" />
                            </div>
                            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Step 2</p>
                            <p className="mt-1 text-lg font-bold text-slate-900">Join a Team</p>
                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                Connect with teammates who complement your strengths and collaborate with clear roles.
                            </p>
                        </article>

                        <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-700">
                                <Rocket className="h-5 w-5" />
                            </div>
                            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Step 3</p>
                            <p className="mt-1 text-lg font-bold text-slate-900">Launch & Showcase</p>
                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                Present your outcome in events and build a portfolio that proves real project impact.
                            </p>
                        </article>
                    </div>
                </div>
            </div>
        </section>
    );
}
