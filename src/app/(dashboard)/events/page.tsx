'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { eventApi } from '@/api/event';
import { Event } from '@/types';
import { EventCard } from '@/components/events/EventCard';
import { Spinner } from '@/components/ui/Spinner';
import { Search, Calendar as CalendarIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useUser } from '@/hooks/useUser';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 }
};

const useCountUp = (value: number, duration = 700) => {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const start = performance.now();
        let raf = 0;

        const tick = (time: number) => {
            const progress = Math.min((time - start) / duration, 1);
            const nextValue = Math.round(progress * value);
            setCurrent(nextValue);
            if (progress < 1) {
                raf = requestAnimationFrame(tick);
            }
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [value, duration]);

    return current;
};

export default function EventsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { profile } = useUser();
    const [activeTab, setActiveTab] = useState('upcoming');
    const [searchQuery, setSearchQuery] = useState('');
    const [showHostForm, setShowHostForm] = useState(false);
    const [hostForm, setHostForm] = useState({
        title: '',
        description: '',
        location: '',
        startDate: '',
        endDate: '',
        capacity: '100',
    });
    const [hostError, setHostError] = useState<string | null>(null);

    const toApiDateTime = (value: string): string => {
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return value;
        }
        return parsed.toISOString();
    };

    const formatApiError = (payload?: unknown): string => {
        if (!payload) {
            return 'Failed to host event. Please try again.';
        }

        if (typeof payload === 'string') {
            return payload;
        }

        if (typeof payload !== 'object') {
            return 'Failed to host event. Please try again.';
        }

        const record = payload as Record<string, unknown>;
        const primaryText = record.message ?? record.detail ?? record.error;
        if (typeof primaryText === 'string') {
            return primaryText;
        }

        const parts = Object.entries(record).flatMap(([field, value]) => {
            if (Array.isArray(value)) {
                return [`${field}: ${value.join(', ')}`];
            }
            if (typeof value === 'string') {
                return [`${field}: ${value}`];
            }
            if (value && typeof value === 'object') {
                const nestedParts = Object.entries(value as Record<string, unknown>)
                    .map(([nestedKey, nestedValue]) => {
                        if (Array.isArray(nestedValue)) {
                            return `${field}.${nestedKey}: ${nestedValue.join(', ')}`;
                        }
                        if (typeof nestedValue === 'string') {
                            return `${field}.${nestedKey}: ${nestedValue}`;
                        }
                        return null;
                    })
                    .filter((entry): entry is string => Boolean(entry));

                return nestedParts;
            }

            return [];
        });

        return parts.length > 0 ? parts.join(' | ') : 'Failed to host event. Please check your inputs.';
    };

    const handlePublishEvent = () => {
        const { title, description, location, startDate, endDate } = hostForm;

        if (!title || !description || !location || !startDate || !endDate) {
            setHostError('Please fill all fields before publishing the event.');
            return;
        }

        if (new Date(endDate) <= new Date(startDate)) {
            setHostError('End date/time must be after start date/time.');
            return;
        }

        createEventMutation.mutate();
    };

    const createEventMutation = useMutation({
        mutationFn: () => eventApi.createEvent({
            title: hostForm.title.trim(),
            description: hostForm.description.trim(),
            location: hostForm.location.trim(),
            start_date: toApiDateTime(hostForm.startDate),
            end_date: toApiDateTime(hostForm.endDate),
            capacity: Number(hostForm.capacity) || 100,
        }),
        onSuccess: () => {
            setHostError(null);
            setShowHostForm(false);
            setHostForm({
                title: '',
                description: '',
                location: '',
                startDate: '',
                endDate: '',
                capacity: '100',
            });
            queryClient.invalidateQueries({ queryKey: ['events'] });
        },
        onError: (error: unknown) => {
            const apiError = error as { response?: { status?: number; data?: unknown } };
            const statusCode = apiError.response?.status;
            const responseData = apiError.response?.data;

            if (statusCode === 401 || statusCode === 403) {
                setHostError('Your session is not authorized to host events. Please log out and log in again as a department account.');
                return;
            }

            setHostError(formatApiError(responseData));
        },
    });

    const { data: eventsRes, isLoading } = useQuery({
        queryKey: ['events'],
        queryFn: () => eventApi.getEvents(),
    });

    const events = useMemo(() => {
        const eventsData = eventsRes?.data as Event[] | { items?: Event[] } | undefined;
        return Array.isArray(eventsData)
            ? eventsData
            : Array.isArray(eventsData?.items)
                ? eventsData.items
                : [];
    }, [eventsRes?.data]);

    const upcomingCount = useMemo(() => {
        const now = new Date();
        return events.filter((event) => {
            const eventDate = event.date ? new Date(event.date) : null;
            return eventDate ? eventDate >= now : false;
        }).length;
    }, [events]);

    const workshopCount = useMemo(
        () => events.filter((event) => event.type === 'WORKSHOP').length,
        [events]
    );

    const hackathonCount = useMemo(
        () => events.filter((event) => event.type === 'HACKATHON').length,
        [events]
    );

    const animatedUpcoming = useCountUp(upcomingCount);
    const animatedHackathon = useCountUp(hackathonCount);
    const animatedWorkshop = useCountUp(workshopCount);

    const featuredEvent = useMemo(() => {
        if (!events.length) return null;
        const now = new Date();
        const upcomingEvent = events.find(event => {
            const eventDate = event.date ? new Date(event.date) : null;
            return eventDate ? eventDate >= now : false;
        });
        return upcomingEvent || events[0];
    }, [events]);

    // Simple filtering logic
    const filteredEvents = useMemo(() => events.filter((event) => {
        const eventDate = event.date ? new Date(event.date) : null;
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.description.toLowerCase().includes(searchQuery.toLowerCase());

        const isUpcoming = eventDate ? eventDate >= new Date() : false;
        const matchesTab = activeTab === 'upcoming' ? isUpcoming : !isUpcoming;

        return matchesSearch && matchesTab;
    }), [activeTab, events, searchQuery]);

    return (
        <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <Breadcrumbs items={[{ label: 'Events' }]} />
            <motion.div
                className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                variants={itemVariants}
            >
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Campus Events</h1>
                    <p className="text-slate-500">Discover hackathons, workshops, and orientation sessions.</p>
                </div>
                {profile?.role === 'ADMIN' && (
                    <Button onClick={() => setShowHostForm((prev) => !prev)}>
                        {showHostForm ? 'Cancel Hosting' : 'Host Event'}
                    </Button>
                )}
            </motion.div>

            {featuredEvent && (
                <motion.div
                    className="surface-elevated overflow-hidden rounded-2xl"
                    variants={itemVariants}
                >
                    <div className="grid gap-6 p-5 sm:grid-cols-[1.1fr_0.9fr] sm:items-center">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Featured Event</p>
                            <h2 className="text-app mt-2 text-2xl font-bold">{featuredEvent.title}</h2>
                            <p className="text-app-soft mt-2 line-clamp-3 text-sm">
                                {featuredEvent.description}
                            </p>
                            <div className="text-app-soft mt-4 flex flex-wrap items-center gap-3 text-xs">
                                <span className="rounded-full border border-emerald-200/60 bg-emerald-50/80 px-3 py-1 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                                    {featuredEvent.date ? new Date(featuredEvent.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBA'}
                                    {featuredEvent.endDate && ` - ${new Date(featuredEvent.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                                </span>
                                <span className="border-app bg-surface rounded-full border px-3 py-1">
                                    {featuredEvent.isOnline ? 'Online' : (featuredEvent.location || 'TBA')}
                                </span>
                            </div>
                            <Button className="mt-4" variant="outline" onClick={() => router.push(`/events/${featuredEvent.id}`)}>
                                View schedule
                            </Button>
                        </div>
                        <div className="border-app bg-surface overflow-hidden rounded-xl border">
                            <Image
                                src="/featured-event.svg"
                                alt="Featured event illustration"
                                width={640}
                                height={360}
                                className="h-full w-full object-cover"
                            />
                        </div>
                    </div>
                </motion.div>
            )}

            <motion.div className="grid gap-4 sm:grid-cols-3" variants={itemVariants}>
                <div
                    className="surface-elevated rounded-2xl p-4"
                >
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">Upcoming</p>
                    <p className="text-app mt-1 text-2xl font-bold">{animatedUpcoming}</p>
                </div>
                <div
                    className="surface-elevated rounded-2xl p-4"
                >
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Hackathons</p>
                    <p className="text-app mt-1 text-2xl font-bold">{animatedHackathon}</p>
                </div>
                <div
                    className="surface-elevated rounded-2xl p-4"
                >
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Workshops</p>
                    <p className="text-app mt-1 text-2xl font-bold">{animatedWorkshop}</p>
                </div>
            </motion.div>

            {profile?.role === 'ADMIN' && showHostForm && (
                <motion.div
                    className="surface-elevated space-y-3 rounded-2xl p-4"
                    variants={itemVariants}
                >
                    <h3 className="text-app text-lg font-semibold">Host a New Event</h3>

                    {hostError && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {hostError}
                        </div>
                    )}

                    <div className="grid gap-3 md:grid-cols-2">
                        <input
                            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400"
                            placeholder="Event title"
                            value={hostForm.title}
                            onChange={(e) => setHostForm((prev) => ({ ...prev, title: e.target.value }))}
                        />
                        <input
                            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400"
                            placeholder="Location"
                            value={hostForm.location}
                            onChange={(e) => setHostForm((prev) => ({ ...prev, location: e.target.value }))}
                        />
                        <input
                            type="datetime-local"
                            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
                            value={hostForm.startDate}
                            onChange={(e) => setHostForm((prev) => ({ ...prev, startDate: e.target.value }))}
                        />
                        <input
                            type="datetime-local"
                            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
                            value={hostForm.endDate}
                            onChange={(e) => setHostForm((prev) => ({ ...prev, endDate: e.target.value }))}
                        />
                    </div>

                    <textarea
                        className="w-full min-h-[96px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
                        placeholder="Event description"
                        value={hostForm.description}
                        onChange={(e) => setHostForm((prev) => ({ ...prev, description: e.target.value }))}
                    />

                    <div className="flex items-center justify-between">
                        <input
                            type="number"
                            min={1}
                            className="h-10 w-32 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400"
                            placeholder="Capacity"
                            value={hostForm.capacity}
                            onChange={(e) => setHostForm((prev) => ({ ...prev, capacity: e.target.value }))}
                        />
                        <Button
                            onClick={handlePublishEvent}
                            isLoading={createEventMutation.isPending}
                            disabled={createEventMutation.isPending}
                        >
                            Publish Event
                        </Button>
                    </div>
                </motion.div>
            )}

            <div className="surface-elevated flex flex-col gap-4 rounded-xl p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by event title or description..."
                        className="flex-1 bg-transparent text-sm outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('upcoming')}
                            className={cn(
                                "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                                activeTab === 'upcoming' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            Upcoming
                        </button>
                        <button
                            onClick={() => setActiveTab('past')}
                            className={cn(
                                "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                                activeTab === 'past' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            Past
                        </button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <motion.div className="flex h-64 items-center justify-center" variants={itemVariants}>
                    <Spinner size="lg" />
                </motion.div>
            ) : filteredEvents.length === 0 ? (
                <motion.div
                    className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-dashed border-slate-300 bg-white"
                    variants={itemVariants}
                >
                    <CalendarIcon className="mb-4 h-12 w-12 text-slate-300" />
                    <h3 className="text-lg font-semibold text-slate-900">No events found</h3>
                    <p className="text-slate-500">Try adjusting your search or filters.</p>
                </motion.div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {filteredEvents.map((event) => (
                        <motion.div key={event.id} variants={itemVariants}>
                            <EventCard event={event} />
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </motion.div>
    );
}
