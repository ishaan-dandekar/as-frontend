import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format date to a readable string
 */
export function formatDate(date: string | Date, pattern = 'PPP') {
    return format(new Date(date), pattern);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date) {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, length: number) {
    if (text.length <= length) return text;
    return text.slice(0, length) + '...';
}
