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
        <div className="border-app bg-surface-strong hover:border-app-strong hover:bg-surface flex items-center justify-between rounded-xl border p-4 transition-all">
            <div className="flex items-center gap-4">
                <Avatar
                    src={member.avatarUrl}
                    fallback={member.name.charAt(0)}
                    className="border-app h-12 w-12 border"
                />
                <div>
                    <div className="flex items-center gap-2">
                        <h4 className="text-app font-semibold">{member.name}</h4>
                        <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                            {formatTeamRole(member.role)}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-app-muted text-xs">{moodleLabel}</span>
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
                    className="text-app-muted hover:text-app hover:bg-surface rounded-lg p-2 transition-all"
                    title="Send Email"
                >
                    <Mail className="h-4 w-4" />
                </a>
                <Link
                    href={`/discover/${profileIdentifier}`}
                    className="text-app-muted hover:text-app hover:bg-surface rounded-lg p-2 transition-all"
                    title="View Profile"
                >
                    <ExternalLink className="h-4 w-4" />
                </Link>
            </div>
        </div>
    );
}
