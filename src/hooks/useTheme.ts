'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type Theme = 'light' | 'dark';

const THEME_KEY = 'theme';

function getSystemTheme(): Theme {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>('light');

    const applyTheme = useCallback((nextTheme: Theme) => {
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem(THEME_KEY, nextTheme);
        setThemeState(nextTheme);
    }, []);

    useEffect(() => {
        const attrTheme = document.documentElement.getAttribute('data-theme');
        if (attrTheme === 'dark' || attrTheme === 'light') {
            setThemeState(attrTheme);
            return;
        }

        const savedTheme = localStorage.getItem(THEME_KEY);
        if (savedTheme === 'dark' || savedTheme === 'light') {
            applyTheme(savedTheme);
            return;
        }

        applyTheme(getSystemTheme());
    }, [applyTheme]);

    const toggleTheme = useCallback(() => {
        applyTheme(theme === 'dark' ? 'light' : 'dark');
    }, [applyTheme, theme]);

    return useMemo(
        () => ({
            theme,
            isDark: theme === 'dark',
            setTheme: applyTheme,
            toggleTheme,
        }),
        [applyTheme, theme, toggleTheme]
    );
}
