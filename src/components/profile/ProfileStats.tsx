'use client';

import { Folder, Users, UserPlus } from 'lucide-react';

interface ProfileStatsProps {
    followers: number;
    following: number;
    projects: number;
}

export function ProfileStats({ followers, following, projects }: ProfileStatsProps) {
    const stats = [
        {
            label: 'Projects',
            value: projects,
            icon: Folder,
            iconClass: 'text-teal-700',
            iconBg: 'bg-teal-100'
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
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Overview</h3>
            <div className="grid grid-cols-3 gap-3">
                {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                    <div
                        key={stat.label}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                        <div className="flex flex-col items-center gap-2 text-center">
                            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${stat.iconBg}`}>
                                <Icon className={`h-4 w-4 ${stat.iconClass}`} />
                            </div>
                            <span className="text-xl font-bold text-slate-900">
                                {stat.value}
                            </span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
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
