'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
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
    Trophy
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/lib/utils';

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const { data: eventRes, isLoading } = useQuery({
        queryKey: ['event', id],
        queryFn: () => eventApi.getEventById(id),
    });

    const event = eventRes?.data;

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
                                <span className="font-medium">{event.location}</span>
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
                                    Interest
                                </span>
                                <span className="font-bold text-slate-900">{event.interestedCount} students</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '45%' }}></div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Button className="w-full gap-2 h-12 text-lg">
                                <Trophy className="h-5 w-5" />
                                Show Interest
                            </Button>
                            <Button variant="outline" className="w-full gap-2 h-12">
                                <Share2 className="h-5 w-5" />
                                Share Event
                            </Button>
                        </div>

                        <div className="pt-6 border-t border-slate-100 space-y-4">
                            <h4 className="font-semibold text-slate-900">Event Details</h4>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Clock className="h-4 w-4 text-indigo-500" />
                                    <span>Time: 10:00 AM - 4:00 PM</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Globe className="h-4 w-4 text-indigo-500" />
                                    <a href="#" className="hover:text-indigo-600 underline">Official Website</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
