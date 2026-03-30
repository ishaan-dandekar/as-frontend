import { User } from './user';

export interface TeamMember {
    userId: string;
    name: string;
    avatarUrl?: string;
    role: string;
    email: string;
}

export interface Team {
    id: string;
    projectId?: string;
    name?: string;
    description?: string;
    members: TeamMember[];
    capacity: number;
    teamMemberCount?: number;
    teamCapacity?: number;
}

export type JoinRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface JoinRequest {
    id: string;
    projectId: string;
    userId: string;
    message: string;
    role: string;
    status: JoinRequestStatus;
    createdAt: string;
    user?: User;
}
