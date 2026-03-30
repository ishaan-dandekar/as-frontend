export type ProjectStatus = 'LOOKING_FOR_TEAMMATES' | 'IN_PROGRESS' | 'COMPLETED' | 'ACTIVE';

export interface Project {
    id: string;
    title: string;
    description: string;
    thumbnailUrl?: string;
    images: string[];
    techStack: string[];
    ownerId: string;
    status: ProjectStatus;
    teamId?: string;
    teamMemberCount?: number;
    teamCapacity?: number;
    githubUrl?: string;
    liveUrl?: string;
    isBookmarked?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ProjectFilter {
    status?: ProjectStatus;
    techStack?: string[];
    search?: string;
    year?: string;
    branch?: string;
}
