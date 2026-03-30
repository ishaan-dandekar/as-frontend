'use client';

import { TeamMember } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ExternalLink, Mail } from 'lucide-react';

interface TeamMemberCardProps {
    member: TeamMember;
}

export function TeamMemberCard({ member }: TeamMemberCardProps) {
    return (
        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-all">
            <div className="flex items-center gap-4">
                <Avatar
                    src={member.avatarUrl}
                    fallback={member.name.charAt(0)}
                    className="h-12 w-12"
                />
                <div>
                    <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-900">{member.name}</h4>
                        <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                            {member.role}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">Joined Nov 2023</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <a
                    href={`mailto:${member.email}`}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="Send Email"
                >
                    <Mail className="h-4 w-4" />
                </a>
                <button
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="View Profile"
                >
                    <ExternalLink className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
