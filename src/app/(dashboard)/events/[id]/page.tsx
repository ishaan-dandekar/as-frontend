'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eventApi } from '@/api/event';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import Image from 'next/image';
import {
    Calendar,
    MapPin,
    Users,
    ArrowLeft,
    Share2,
    Globe,
    Clock,
    Trophy,
    Trash2,
    UserRound
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const id = params.id as string;
    const { profile } = useUser();

    const { data: eventRes, isLoading } = useQuery({
        queryKey: ['event', id],
        queryFn: () => eventApi.getEventById(id),
    });

    const event = eventRes?.data;
    const canDeleteEvent = Boolean(
        profile?.role === 'ADMIN' &&
        profile?.id &&
        event?.organizerId &&
        profile.id === event.organizerId
    );

    const deleteEventMutation = useMutation({
        mutationFn: () => eventApi.deleteEvent(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            router.push('/events');
        },
    });

    const toggleInterestMutation = useMutation({
        mutationFn: () => eventApi.markInterest(id, Boolean(event?.isInterested)),
        onSuccess: (response) => {
            queryClient.setQueryData(['event', id], response);
            queryClient.invalidateQueries({ queryKey: ['events'] });
        },
    });

    const handleDeleteEvent = () => {
        if (!canDeleteEvent || deleteEventMutation.isPending) return;
        const confirmed = window.confirm('Delete this event? This cannot be undone.');
        if (!confirmed) return;
        deleteEventMutation.mutate();
    };

    const handleToggleInterest = () => {
        if (toggleInterestMutation.isPending) return;
        toggleInterestMutation.mutate();
    };

    const handleShareEvent = async () => {
        const shareData = {
            title: event?.title || 'Campus Event',
            text: event?.description || 'Check out this event',
            url: typeof window !== 'undefined' ? window.location.href : '',
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                return;
            } catch {
                // Fall through to clipboard copy when share is dismissed or unsupported.
            }
        }

        if (shareData.url) {
            await navigator.clipboard.writeText(shareData.url);
            window.alert('Event link copied to clipboard.');
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold">Event not found</h2>
                <Button variant="ghost" onClick={() => router.back()}>Go back</Button>
            </div>
        );
    }

    const startDate = new Date(event.date);
    const endDate = event.endDate ? new Date(event.endDate) : null;
    const eventTimeRange = endDate
        ? `${startDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
        : startDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const attendanceLabel = event.isInterested ? 'Registered' : 'Register';
    const registrationProgress = event.capacity
        ? Math.min(100, Math.round((event.interestedCount / event.capacity) * 100))
        : Math.min(100, event.interestedCount > 0 ? 100 : 0);

    return (
        <div className="mx-auto max-w-5xl space-y-8">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Events
            </button>

            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-8">
                    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
                        {event.thumbnailUrl ? (
                            <Image src={event.thumbnailUrl} alt={event.title} fill className="object-cover" />
                        ) : (
                            <div className="flex h-full items-center justify-center text-slate-300">
                                <Calendar className="h-20 w-20" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Badge variant={event.type === 'HACKATHON' ? 'success' : 'secondary'} className="px-3 py-1">
                                {event.type}
                            </Badge>
                            <Badge variant="outline" className="px-3 py-1">
                                {event.interestedCount} attending
                            </Badge>
                            <span className="text-sm text-slate-500">Posted {formatRelativeTime(event.createdAt)}</span>
                        </div>
                        <h1 className="text-4xl font-bold text-slate-900">{event.title}</h1>
                        <div className="flex flex-wrap gap-6 text-slate-600">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-indigo-500" />
                                <span className="font-medium">{formatDate(event.date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-indigo-500" />
                                <span className="font-medium">{event.location || 'Location to be announced'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="prose prose-slate max-w-none">
                        <h3 className="text-xl font-semibold">About the Event</h3>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            {event.description}
                        </p>
                        {/* More detailed description would go here */}
                        <div className="mt-8 p-6 rounded-xl bg-slate-50 border border-slate-100">
                            <h4 className="font-semibold mb-2">Event Highlights</h4>
                            <ul className="list-disc list-inside space-y-2 text-slate-600">
                                <li>Networking with industry professionals</li>
                                <li>Hands-on workshops and guidance</li>
                                <li>Swag kits and certificates for participants</li>
                                <li>Exclusive access to student community resources</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 flex items-center gap-1.5">
                                    <Users className="h-4 w-4" />
                                    Attendance
                                </span>
                                <span className="font-bold text-slate-900">
                                    {event.interestedCount}
                                    {event.capacity ? ` / ${event.capacity}` : ''} students
                                </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 rounded-full"
                                    style={{ width: `${registrationProgress}%` }}
                                />
                            </div>
                        </div>

                    <div className="space-y-3">
                        <Button className="w-full gap-2 h-12 text-lg" onClick={handleToggleInterest} isLoading={toggleInterestMutation.isPending}>
                            <Trophy className="h-5 w-5" />
                            {attendanceLabel}
                        </Button>
                        {canDeleteEvent ? (
                            <Button
                                variant="danger"
                                className="w-full gap-2 h-12"
                                onClick={handleDeleteEvent}
                                isLoading={deleteEventMutation.isPending}
                            >
                                <Trash2 className="h-5 w-5" />
                                Delete Event
                            </Button>
                        ) : null}
                        <Button variant="outline" className="w-full gap-2 h-12" onClick={handleShareEvent}>
                            <Share2 className="h-5 w-5" />
                            Share Event
                        </Button>
                        </div>

                        <div className="pt-6 border-t border-slate-100 space-y-4">
                            <h4 className="font-semibold text-slate-900">Event Details</h4>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Clock className="h-4 w-4 text-indigo-500" />
                                    <span>{eventTimeRange}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Users className="h-4 w-4 text-indigo-500" />
                                    <span>
                                        {event.interestedCount} registered attendees
                                        {event.capacity ? ` out of ${event.capacity}` : ''}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Globe className="h-4 w-4 text-indigo-500" />
                                    <span>{event.isOnline ? 'Online event' : 'On-campus event'}</span>
                                </div>
                                {event.organizerId ? (
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <UserRound className="h-4 w-4 text-indigo-500" />
                                        <span>Organized by department account</span>
                                    </div>
                                ) : null}
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Calendar className="h-4 w-4 text-indigo-500" />
                                    <span>Status: {event.status || 'UPCOMING'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
