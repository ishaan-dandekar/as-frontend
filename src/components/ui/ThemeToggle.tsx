'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';

type ThemeToggleProps = {
    compact?: boolean;
};

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
    const { isDark, toggleTheme } = useTheme();

    if (compact) {
        return (
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9"
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
        );
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className="gap-2"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {isDark ? 'Light' : 'Dark'}
        </Button>
    );
}
