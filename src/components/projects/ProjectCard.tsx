'use client';

import { Project } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Bookmark, Users } from 'lucide-react';
import Link from 'next/link';
import { formatRelativeTime, cn } from '@/lib/utils';

import { motion } from 'framer-motion';

interface ProjectCardProps {
    project: Project;
    onBookmark?: (id: string) => void;
    onRequestToJoin?: (id: string) => void;
    disableRequestButton?: boolean;
    requestButtonLabel?: string;
    onMarkActive?: (id: string) => Promise<void> | void;
    isMarkActiveLoading?: boolean;
    onToggleActive?: (project: Project) => Promise<void> | void;
    isToggleActiveLoading?: boolean;
}

export function ProjectCard({
    project,
    onBookmark,
    onRequestToJoin,
    disableRequestButton,
    requestButtonLabel,
    onMarkActive,
    isMarkActiveLoading,
    onToggleActive,
    isToggleActiveLoading,
}: ProjectCardProps) {
    const shouldShowRequestButton = Boolean(onRequestToJoin || requestButtonLabel);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="h-full border-app bg-surface transition-shadow hover:shadow-xl">
                <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between gap-2">
                        <Badge variant={project.status === 'LOOKING_FOR_TEAMMATES' ? 'success' : 'secondary'}>
                            {project.status.replace(/_/g, ' ')}
                        </Badge>
                        <button
                            onClick={() => onBookmark?.(project.id)}
                            className={cn(
                                'text-app-muted hover:text-indigo-600 transition-colors dark:hover:text-indigo-300',
                                project.isBookmarked && 'text-indigo-600 dark:text-indigo-300'
                            )}
                        >
                            <Bookmark className="h-5 w-5" fill={project.isBookmarked ? 'currentColor' : 'none'} />
                        </button>
                    </div>
                    <CardTitle className="mt-2 text-lg leading-snug">
                        <Link href={`/projects/${project.id}`} className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-300">
                            {project.title}
                        </Link>
                    </CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                        {project.description}
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-4 py-2">
                    {project.domainTags.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-1.5">
                            {project.domainTags.slice(0, 2).map((domain) => (
                                <Badge key={domain} className="bg-emerald-100/80 text-emerald-700 hover:bg-emerald-200 border-none font-normal dark:bg-emerald-500/20 dark:text-emerald-300">
                                    {domain}
                                </Badge>
                            ))}
                        </div>
                    )}

                    <div className="flex flex-wrap gap-1.5">
                        {project.techStack.slice(0, 3).map((tech) => (
                            <Badge key={tech} variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 font-normal dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
                                {tech}
                            </Badge>
                        ))}
                        {project.techStack.length > 3 && (
                            <span className="text-app-muted self-center text-xs">+{project.techStack.length - 3} more</span>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="border-app flex items-center justify-between border-t p-4 pt-2">
                    <div className="flex flex-col gap-2 w-full">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                            <div className="text-app-muted flex items-center gap-1.5 font-medium">
                                <Users className="h-3.5 w-3.5" />
                                <span>{project.teamMemberCount || 0} / {project.teamCapacity || 5} members</span>
                            </div>
                            <span className="text-app-muted">
                                {formatRelativeTime(project.createdAt)}
                            </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                                className={cn(
                                    'h-full transition-all duration-500',
                                    (project.teamMemberCount || 0) >= (project.teamCapacity || 5)
                                        ? 'bg-slate-300 dark:bg-slate-600'
                                        : 'bg-indigo-500 dark:bg-indigo-400'
                                )}
                                style={{ width: `${Math.min(100, ((project.teamMemberCount || 0) / (project.teamCapacity || 5)) * 100)}%` }}
                            />
                        </div>

                        {onToggleActive ? (
                            <button
                                type="button"
                                onClick={() => onToggleActive(project)}
                                disabled={isToggleActiveLoading}
                                className={cn(
                                    'mt-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                                    project.status === 'ACTIVE'
                                        ? 'bg-gradient-to-r from-emerald-300 to-teal-300 text-teal-950 hover:from-emerald-400 hover:to-teal-400 shadow-sm'
                                        : 'border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 dark:border-teal-500/40 dark:bg-teal-500/10 dark:text-teal-200 dark:hover:bg-teal-500/20'
                                )}
                            >
                                {isToggleActiveLoading
                                    ? 'Updating...'
                                    : project.status === 'ACTIVE'
                                        ? 'Mark as Not Active'
                                        : 'Mark as Active'}
                            </button>
                        ) : (
                            (onMarkActive && project.status !== 'ACTIVE') && (
                                <button
                                type="button"
                                onClick={() => onMarkActive(project.id)}
                                disabled={isMarkActiveLoading}
                                className="mt-1 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-teal-500/40 dark:bg-teal-500/10 dark:text-teal-200 dark:hover:bg-teal-500/20"
                            >
                                {isMarkActiveLoading ? 'Updating...' : 'Mark as Active'}
                            </button>
                            )
                        )}

                        {shouldShowRequestButton && (
                            <button
                                type="button"
                                onClick={() => onRequestToJoin?.(project.id)}
                                disabled={disableRequestButton}
                                className="mt-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {requestButtonLabel || 'Request to Work'}
                            </button>
                        )}
                    </div>
                </CardFooter>
            </Card>
        </motion.div>
    );
}
