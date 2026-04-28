export type ProjectStatus = 'LOOKING_FOR_TEAMMATES' | 'IN_PROGRESS' | 'COMPLETED' | 'ACTIVE';
export type ProjectJoinState = 'IDLE' | 'REQUEST_PENDING' | 'JOINED' | 'OWNER';

export interface Project {
    id: string;
    title: string;
    description: string;
    thumbnailUrl?: string;
    images: string[];
    techStack: string[];
    domainTags: string[];
    ownerId: string;
    status: ProjectStatus;
    teamId?: string;
    teamMemberCount?: number;
    teamCapacity?: number;
    githubUrl?: string;
    liveUrl?: string;
    isBookmarked?: boolean;
    joinState?: ProjectJoinState;
    createdAt: string;
    updatedAt: string;
}

export interface ProjectFilter {
    status?: ProjectStatus;
    techStack?: string[];
    domains?: string[];
    search?: string;
    year?: string;
    branch?: string;
}
