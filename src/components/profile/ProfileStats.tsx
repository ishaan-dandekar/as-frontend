'use client';

import { Activity, Folder, Users, UserPlus } from 'lucide-react';

interface ProfileStatsProps {
    followers?: number | null;
    following?: number | null;
    projects: number;
    activeProjects?: number;
}

export function ProfileStats({ followers, following, projects, activeProjects = 0 }: ProfileStatsProps) {
    const stats = [
        {
            label: 'Total Projects',
            value: projects,
            icon: Folder,
            iconClass: 'text-teal-700',
            iconBg: 'bg-teal-100'
        },
        {
            label: 'Active Now',
            value: activeProjects,
            icon: Activity,
            iconClass: 'text-emerald-700',
            iconBg: 'bg-emerald-100'
        },
        {
            label: 'Followers',
            value: followers,
            icon: Users,
            iconClass: 'text-sky-700',
            iconBg: 'bg-sky-100'
        },
        {
            label: 'Following',
            value: following,
            icon: UserPlus,
            iconClass: 'text-orange-700',
            iconBg: 'bg-orange-100'
        },
    ];

    return (
        <div className="surface-elevated rounded-2xl p-4">
            <h3 className="text-app-muted mb-3 text-sm font-semibold uppercase tracking-[0.12em]">Overview</h3>
            <div className="grid grid-cols-2 gap-3">
                {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                    <div
                        key={stat.label}
                        className="border-app bg-surface-strong rounded-xl border p-3"
                    >
                        <div className="flex flex-col items-center gap-2 text-center">
                            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${stat.iconBg}`}>
                                <Icon className={`h-4 w-4 ${stat.iconClass}`} />
                            </div>
                            <span className="text-app text-xl font-bold">
                                {typeof stat.value === 'number' ? stat.value : '—'}
                            </span>
                            <span className="text-app-muted text-[11px] font-semibold uppercase tracking-[0.12em]">
                                {stat.label}
                            </span>
                        </div>
                    </div>
                );
            })}
            </div>
        </div>
    );
}
