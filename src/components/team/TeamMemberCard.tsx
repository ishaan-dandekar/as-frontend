'use client';

import Link from 'next/link';
import { TeamMember } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ExternalLink, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TeamMemberCardProps {
    member: TeamMember;
    canRemove?: boolean;
    isRemoving?: boolean;
    onRemove?: (member: TeamMember) => void;
}

function formatTeamRole(role: string) {
    if (role === 'OWNER') return 'Leader';
    return 'Member';
}

export function TeamMemberCard({ member, canRemove = false, isRemoving = false, onRemove }: TeamMemberCardProps) {
    const profileIdentifier = member.moodleId || member.userId;
    const moodleLabel = member.moodleId || 'Moodle ID unavailable';

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
                            {formatTeamRole(member.role)}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">{moodleLabel}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {canRemove && onRemove ? (
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onRemove(member)}
                        isLoading={isRemoving}
                    >
                        Remove
                    </Button>
                ) : null}
                <a
                    href={`mailto:${member.email}`}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="Send Email"
                >
                    <Mail className="h-4 w-4" />
                </a>
                <Link
                    href={`/discover/${profileIdentifier}`}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="View Profile"
                >
                    <ExternalLink className="h-4 w-4" />
                </Link>
            </div>
        </div>
    );
}
