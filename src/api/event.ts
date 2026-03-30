import api from '@/lib/axios';
import { Event, APIResponse } from '@/types';

type CreateEventPayload = {
    title: string;
    description: string;
    location: string;
    start_date: string;
    end_date: string;
    capacity?: number;
    image_url?: string;
    tags?: string[];
};

type BackendEvent = {
    id: string;
    title: string;
    description: string;
    image_url?: string | null;
    location: string;
    start_date: string;
    end_date: string;
    attendee_count?: number;
    capacity?: number;
    tags?: string[];
    created_at?: string;
};

const MOCK_EVENTS: Event[] = [
    {
        id: 'mock-hackathon-2026',
        title: 'APSIT BuildSprint Hackathon',
        description: 'A 24-hour campus hackathon focused on AI, Web, and IoT problem statements.',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
        location: 'Main Auditorium, APSIT',
        isOnline: false,
        interestedCount: 132,
        isInterested: false,
        type: 'HACKATHON',
        createdAt: new Date().toISOString(),
    },
    {
        id: 'mock-orientation-2026',
        title: 'Student Project Orientation',
        description: 'Orientation session for first-time contributors to understand project workflows and team formation.',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4).toISOString(),
        location: 'Seminar Hall 1',
        isOnline: false,
        interestedCount: 84,
        isInterested: false,
        type: 'MEETUP',
        createdAt: new Date().toISOString(),
    },
    {
        id: 'mock-workshop-2026',
        title: 'Hands-on Full Stack Workshop',
        description: 'Practical workshop covering React, Django APIs, authentication, and deployment basics.',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 16).toISOString(),
        location: 'Lab 3, APSIT',
        isOnline: false,
        interestedCount: 96,
        isInterested: false,
        type: 'WORKSHOP',
        createdAt: new Date().toISOString(),
    },
];

const MOCK_EVENT_INTEREST_KEY = 'mock_event_interest:v1';

function isMockEventId(eventId: string): boolean {
    return eventId.startsWith('mock-');
}

function readMockInterestState(): Record<string, boolean> {
    if (typeof window === 'undefined') return {};

    try {
        const raw = localStorage.getItem(MOCK_EVENT_INTEREST_KEY);
        if (!raw) return {};

        const parsed = JSON.parse(raw) as Record<string, unknown>;
        const normalized: Record<string, boolean> = {};

        Object.entries(parsed).forEach(([key, value]) => {
            if (typeof value === 'boolean') {
                normalized[key] = value;
            }
        });

        return normalized;
    } catch {
        return {};
    }
}

function writeMockInterestState(state: Record<string, boolean>) {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(MOCK_EVENT_INTEREST_KEY, JSON.stringify(state));
    } catch {
        // Ignore storage failures and keep UI responsive.
    }
}

const mapBackendEvent = (event: BackendEvent): Event => ({
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.start_date,
    location: event.location,
    isOnline: false,
    interestedCount: event.attendee_count ?? 0,
    isInterested: false,
    thumbnailUrl: event.image_url ?? undefined,
    type: 'OTHER',
    createdAt: event.created_at ?? event.start_date,
});

function applyMockInterestOverrides(event: Event, state: Record<string, boolean>): Event {
    if (!isMockEventId(event.id)) return event;

    const interested = Boolean(state[event.id]);
    return {
        ...event,
        isInterested: interested,
        interestedCount: event.interestedCount + (interested ? 1 : 0),
    };
}

export const eventApi = {
    getEvents: async (): Promise<APIResponse<Event[]>> => {
        const response = await api.get<APIResponse<BackendEvent[]>>('/events/');
        const mockInterestState = readMockInterestState();
        const backendEvents = Array.isArray(response.data.data)
            ? response.data.data.map(mapBackendEvent)
            : [];

        const mergedMap = new Map<string, Event>();
        [...backendEvents, ...MOCK_EVENTS].forEach((event) => {
            mergedMap.set(event.id, event);
        });

        const events = Array.from(mergedMap.values())
            .map((event) => applyMockInterestOverrides(event, mockInterestState))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return {
            ...response.data,
            data: events,
        };
    },
    getEventById: async (id: string): Promise<APIResponse<Event>> => {
        const response = await api.get<APIResponse<BackendEvent>>(`/events/${id}/`);
        return {
            ...response.data,
            data: mapBackendEvent(response.data.data),
        };
    },
    markInterest: async (id: string, currentlyInterested = false): Promise<APIResponse<Event>> => {
        if (isMockEventId(id)) {
            const state = readMockInterestState();
            const nextInterested = !currentlyInterested;
            state[id] = nextInterested;
            writeMockInterestState(state);

            const mockEvent = MOCK_EVENTS.find((event) => event.id === id);
            if (mockEvent) {
                return {
                    success: true,
                    data: {
                        ...mockEvent,
                        isInterested: nextInterested,
                        interestedCount: mockEvent.interestedCount + (nextInterested ? 1 : 0),
                    },
                };
            }

            return {
                success: true,
                data: {
                    id,
                    title: 'Event',
                    description: '',
                    date: new Date().toISOString(),
                    location: '',
                    isOnline: false,
                    interestedCount: nextInterested ? 1 : 0,
                    isInterested: nextInterested,
                    type: 'OTHER',
                    createdAt: new Date().toISOString(),
                },
            };
        }

        const endpoint = currentlyInterested ? `/events/${id}/unregister` : `/events/${id}/register`;
        const response = await api.post<APIResponse<BackendEvent>>(endpoint);

        return {
            ...response.data,
            data: {
                ...mapBackendEvent(response.data.data),
                isInterested: !currentlyInterested,
            },
        };
    },
    createEvent: async (eventData: CreateEventPayload): Promise<APIResponse<Event>> => {
        const response = await api.post<APIResponse<BackendEvent>>('/events/', eventData);
        return {
            ...response.data,
            data: mapBackendEvent(response.data.data),
        };
    },
};
