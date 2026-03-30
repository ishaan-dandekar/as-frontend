'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * useDebounce hook
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * useIntersectionObserver hook for infinite scroll
 */
export function useIntersectionObserver(
    callback: () => void,
    options?: IntersectionObserverInit
) {
    const observerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const target = observerRef.current;
        if (!target) return;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                callback();
            }
        }, options);

        observer.observe(target);

        return () => {
            if (target) observer.unobserve(target);
        };
    }, [callback, options]);

    return observerRef;
}

/**
 * useLocalStorage hook
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') return initialValue;
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue] as const;
}

/**
 * useClickOutside hook
 */
export function useClickOutside(ref: React.RefObject<HTMLElement>, callback: () => void) {
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                callback();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [ref, callback]);
}
