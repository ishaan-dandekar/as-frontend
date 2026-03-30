import axios from 'axios';

export interface LeetCodeStats {
    username: string;
    ranking: number;
    totalSolved: number;
    totalQuestions: number;
    easySolved: number;
    totalEasy: number;
    mediumSolved: number;
    totalMedium: number;
    hardSolved: number;
    totalHard: number;
    acceptanceRate: number;
    contributionPoints: number;
    reputation: number;
}

export interface LeetCodeContestInfo {
    attendedContestsCount: number;
    rating: number;
    globalRanking: number;
    topPercentage: number;
}

export interface LeetCodeFullStats {
    profile: LeetCodeStats;
    contest: LeetCodeContestInfo | null;
    streak: number;
    badges: number;
}

const LEETCODE_CACHE_PREFIX = 'leetcode_stats_cache:v2:';
const LEETCODE_USERNAME_STORAGE_KEY = 'leetcode_connected_username:v1';

function normalizeLeetCodeUsername(input: string): string {
    const raw = (input || '').trim();
    if (!raw) return '';

    // Allow users to paste full profile URLs like https://leetcode.com/u/username/
    const cleaned = raw
        .replace(/^https?:\/\/(www\.)?leetcode\.com\//i, '')
        .replace(/^u\//i, '')
        .replace(/^@/, '')
        .replace(/\/$/, '');

    return cleaned.split('/')[0].trim();
}

function loadCachedStats(username: string): LeetCodeFullStats | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(`${LEETCODE_CACHE_PREFIX}${username.toLowerCase()}`);
        if (!raw) return null;
        return JSON.parse(raw) as LeetCodeFullStats;
    } catch {
        return null;
    }
}

function saveCachedStats(username: string, stats: LeetCodeFullStats) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(`${LEETCODE_CACHE_PREFIX}${username.toLowerCase()}`, JSON.stringify(stats));
    } catch {
        // Ignore cache write failures.
    }
}

export const leetcodeApi = {
    normalizeUsername(input: string): string {
        return normalizeLeetCodeUsername(input);
    },

    getStoredUsername(): string | null {
        if (typeof window === 'undefined') return null;
        const raw = localStorage.getItem(LEETCODE_USERNAME_STORAGE_KEY);
        if (!raw) return null;
        const normalized = normalizeLeetCodeUsername(raw);
        return normalized || null;
    },

    setStoredUsername(username: string) {
        if (typeof window === 'undefined') return;
        const normalized = normalizeLeetCodeUsername(username);
        if (!normalized) return;
        localStorage.setItem(LEETCODE_USERNAME_STORAGE_KEY, normalized);
    },

    clearStoredUsername() {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(LEETCODE_USERNAME_STORAGE_KEY);
    },

    async getStats(username: string): Promise<LeetCodeFullStats> {
        const normalizedUsername = normalizeLeetCodeUsername(username);
        if (!normalizedUsername) {
            throw new Error('Please enter a valid LeetCode username.');
        }

        try {
            const response = await axios.get(`/api/leetcode/${encodeURIComponent(normalizedUsername)}`, {
                timeout: 15000,
            });

            const result = response.data as LeetCodeFullStats;

            this.setStoredUsername(normalizedUsername);
            saveCachedStats(normalizedUsername, result);
            return result;

        } catch (error) {
            console.error('Error fetching LeetCode stats:', error);
            const cached = loadCachedStats(normalizedUsername);
            if (cached) {
                return cached;
            }
            throw new Error('Failed to fetch LeetCode stats. Check the username or try again in a moment.');
        }
    },

    async validateUsername(username: string): Promise<boolean> {
        const normalizedUsername = normalizeLeetCodeUsername(username);
        if (!normalizedUsername) return false;

        try {
            const response = await axios.get(`/api/leetcode/${encodeURIComponent(normalizedUsername)}`, {
                timeout: 10000,
            });
            return !!response.data?.profile?.username;
        } catch {
            return false;
        }
    },

    formatRanking(ranking: number): string {
        if (ranking === 0) return 'Unranked';
        const percentage = (ranking / 1000000) * 100; // Rough estimate
        if (percentage <= 1) return 'Top 1%';
        if (percentage <= 5) return 'Top 5%';
        if (percentage <= 10) return 'Top 10%';
        if (percentage <= 25) return 'Top 25%';
        return `#${ranking.toLocaleString()}`;
    },
};
