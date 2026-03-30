import { User, Project, Event } from '@/types';

export const MOCK_USER: User = {
    id: 'u1',
    name: 'APSIT Admin',
    email: 'admin@apsit.edu.in',
    role: 'DEPARTMENT',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    bio: 'Official Department Account for APSIT.',
    skills: ['Management', 'Coordination', 'Public Relations'],
    projectsCount: 12,
    followersCount: 156,
    followingCount: 42,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
};

export const MOCK_STUDENT: User = {
    id: 's1',
    name: 'Zaib Khan',
    email: 'zaib@apsit.edu.in',
    role: 'STUDENT',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2.25&w=256&h=256&q=80',
    bio: 'Full Stack Developer | AI Enthusiast | APSIT 2026',
    skills: ['Next.js', 'TypeScript', 'Tailwind', 'Python'],
    projectsCount: 5,
    followersCount: 89,
    followingCount: 120,
    githubUsername: 'zaib-khan',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
};

export const MOCK_PROJECTS: Project[] = [
    {
        id: 'p1',
        title: 'Project Nexus',
        description: 'A comprehensive management system for student collaborations and department events.',
        ownerId: 's1',
        status: 'LOOKING_FOR_TEAMMATES',
        techStack: ['React', 'Node.js', 'MongoDB', 'Tailwind CSS'],
        teamMemberCount: 3,
        teamCapacity: 5,
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isBookmarked: false,
    },
    {
        id: 'p2',
        title: 'EcoTrack Mobile',
        description: 'IoT-enabled mobile application for tracking real-time carbon footprint of campus activities.',
        ownerId: 'u1',
        status: 'IN_PROGRESS',
        techStack: ['React Native', 'Firebase', 'IoT', 'Python'],
        teamMemberCount: 4,
        teamCapacity: 4,
        images: [],
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        updatedAt: new Date().toISOString(),
        isBookmarked: true,
    }
];

export const MOCK_EVENTS: Event[] = [
    {
        id: 'e1',
        title: 'APSIT Hack-A-Thon 2026',
        description: 'Annual 48-hour hackathon for building innovative solutions for campus life.',
        date: new Date(Date.now() + 86400000 * 10).toISOString(),
        location: 'Main Auditorium, APSIT',
        type: 'HACKATHON',
        thumbnailUrl: '',
        interestedCount: 245,
        isInterested: true,
        isOnline: false,
        createdAt: new Date().toISOString(),
    },
    {
        id: 'e2',
        title: 'Tech Talk: Future of AI',
        description: 'A deep dive into the practical applications of Large Language Models in engineering.',
        date: new Date(Date.now() + 86400000 * 3).toISOString(),
        location: 'Seminar Hall 2',
        type: 'WORKSHOP',
        thumbnailUrl: '',
        interestedCount: 120,
        isInterested: false,
        isOnline: false,
        createdAt: new Date().toISOString(),
    }
];
