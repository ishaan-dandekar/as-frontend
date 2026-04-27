'use client';

import { Event } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Calendar, Users, ExternalLink, Trophy } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { eventApi } from '@/api/event';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EventCardProps {
    event: Event;
}

export function EventCard({ event }: EventCardProps) {
    const [isInterested, setIsInterested] = useState(event.isInterested);
    const [interestCount, setInterestCount] = useState(event.interestedCount);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsInterested(event.isInterested);
        setInterestCount(event.interestedCount);
    }, [event.id, event.interestedCount, event.isInterested]);

    const handleInterest = async () => {
        setIsLoading(true);
        try {
            const response = await eventApi.markInterest(event.id, Boolean(isInterested));
            const updated = response.data;

            if (updated) {
                setIsInterested(Boolean(updated.isInterested));
                setInterestCount(updated.interestedCount);
            } else {
                setIsInterested(!isInterested);
                setInterestCount(prev => isInterested ? prev - 1 : prev + 1);
            }
        } catch (error) {
            console.error('Failed to mark interest:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
        >
            <Card
                className="surface-elevated flex h-full flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-soft"
            >
                <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-cyan-500 to-indigo-500" />

                <CardHeader className="p-5 pb-2">
                    <div className="flex items-center justify-between mb-2">
                        <Badge variant={event.type === 'HACKATHON' ? 'success' : 'secondary'}>
                            {event.type}
                        </Badge>
                        <span className="text-app-muted flex items-center gap-1 text-xs font-medium">
                            <Calendar className="h-3 w-3" />
                            {formatDate(event.date)}
                        </span>
                    </div>
                    <CardTitle className="text-xl line-clamp-1">{event.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1 min-h-[2.5rem]">
                        {event.description}
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-5 py-2 space-y-3">
                    <div className="text-app-soft flex items-center gap-2 text-sm">
                        <Users className="text-app-muted h-4 w-4 shrink-0" />
                        <span>{interestCount} students interested</span>
                    </div>
                </CardContent>

                <CardFooter className="border-app mt-auto flex gap-3 border-t p-5 pt-4">
                    <Button
                        variant={isInterested ? "secondary" : "outline"}
                        className="flex-1 gap-2"
                        onClick={handleInterest}
                        disabled={isLoading}
                    >
                        <Trophy className={cn("h-4 w-4", isInterested && "text-amber-500 fill-amber-500")} />
                        {isInterested ? 'Interested' : 'Show Interest'}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => {
                            const query = encodeURIComponent(event.location || event.title);
                            window.open(`https://www.google.com/search?q=${query}`, '_blank', 'noopener,noreferrer');
                        }}
                    >
                        <ExternalLink className="h-4 w-4" />
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    );
}
