export type NotificationType = 'JOIN_REQUEST' | 'REQUEST_ACCEPTED' | 'REQUEST_REJECTED' | 'NEW_FOLLOWER' | 'PROJECT_UPDATE' | 'TEAM_UPDATE';

export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    relatedId?: string; // e.g., projectId or requestId
    createdAt: string;
}

export type EventType = 'HACKATHON' | 'WORKSHOP' | 'MEETUP' | 'OTHER';

export interface Event {
    id: string;
    title: string;
    description: string;
    date: string;
    endDate?: string;
    status?: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
    location?: string;
    isOnline: boolean;
    interestedCount: number;
    capacity?: number;
    isInterested?: boolean;
    thumbnailUrl?: string;
    type: EventType;
    organizerId?: string;
    createdAt: string;
}
