import axios from 'axios';
import api from '@/lib/axios';

export interface GitHubUser {
    login: string;
    name: string;
    avatar_url: string;
    bio: string;
    public_repos: number;
    followers: number;
    following: number;
    html_url: string;
    created_at: string;
}

export interface GitHubRepo {  
    id: number; 
    name: string; 
    full_name: string; 
    description: string; 
    html_url: string; 
    stargazers_count: number;  
    forks_count: number;  
    language: string; 
    updated_at: string; 
} 

export interface GitHubStats {
    user: GitHubUser;
    repos: number;
    totalStars: number;
    totalForks: number;
    topLanguages: { name: string; count: number }[];
    recentRepos: GitHubRepo[];
    contributionsThisYear: number;
}

export interface GitHubOAuthStartResponse {
    authorizationUrl: string;
}

export interface GitHubOAuthSession {
    sessionId: string;
    githubUsername: string;
}

const GITHUB_OAUTH_STORAGE_KEY = 'github_oauth_session';

const GITHUB_API = 'https://api.github.com';

export const githubApi = {
    getStoredOAuthSession(): GitHubOAuthSession | null {
        if (typeof window === 'undefined') return null;
        const raw = localStorage.getItem(GITHUB_OAUTH_STORAGE_KEY);
        if (!raw) return null;

        try {
            return JSON.parse(raw) as GitHubOAuthSession;
        } catch {
            localStorage.removeItem(GITHUB_OAUTH_STORAGE_KEY);
            return null;
        }
    },

    setStoredOAuthSession(session: GitHubOAuthSession) {
        if (typeof window === 'undefined') return;
        localStorage.setItem(GITHUB_OAUTH_STORAGE_KEY, JSON.stringify(session));
    },

    async clearStoredOAuthSession() {
        const session = this.getStoredOAuthSession();
        if (typeof window !== 'undefined') {
            localStorage.removeItem(GITHUB_OAUTH_STORAGE_KEY);
        }

        if (!session) return;
        try {
            await api.post('/user/github/oauth/disconnect', { session_id: session.sessionId });
        } catch {
            // Ignore disconnect errors during local cleanup.
        }
    },

    async getOAuthStartUrl(): Promise<GitHubOAuthStartResponse> {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            console.log('[GitHub OAuth] Token present:', !!token);
            console.log('[GitHub OAuth] Calling /user/github/oauth/start...');
            const response = await api.get('/user/github/oauth/start');
            console.log('[GitHub OAuth] Start response:', response.data);
            return response.data?.data as GitHubOAuthStartResponse;
        } catch (error) {
            console.error('[GitHub OAuth] Start endpoint error:', error);
            throw error;
        }
    },

    async getAuthorizedStats(sessionId: string): Promise<GitHubStats> {
        const response = await api.get('/user/github/oauth/stats', {
            params: {
                session_id: sessionId,
            },
        });

        return response.data?.data as GitHubStats;
    },

    async getUser(username: string): Promise<GitHubUser> {
        const response = await axios.get(`${GITHUB_API}/users/${username}`);
        return response.data;
    },

    async getRepos(username: string): Promise<GitHubRepo[]> {
        const response = await axios.get(`${GITHUB_API}/users/${username}/repos`, {
            params: {
                sort: 'updated',
                per_page: 100,
            },
        });
        return response.data;
    },

    async getStats(username: string): Promise<GitHubStats> {
        try {
            const oauthSession = this.getStoredOAuthSession();
            if (oauthSession?.sessionId) {
                try {
                    return await this.getAuthorizedStats(oauthSession.sessionId);
                } catch (error) {
                    const statusCode = (error as { response?: { status?: number } })?.response?.status;

                    // If backend session has expired or is invalid, clear local OAuth session and continue.
                    if (statusCode === 401 || statusCode === 403) {
                        if (typeof window !== 'undefined') {
                            localStorage.removeItem(GITHUB_OAUTH_STORAGE_KEY);
                        }
                    } else {
                        throw error;
                    }
                }
            }

            const [user, repos] = await Promise.all([
                this.getUser(username),
                this.getRepos(username),
            ]);

            // Calculate total stars and forks
            const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
            const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);

            // Calculate top languages
            const languageCounts: Record<string, number> = {};
            repos.forEach((repo) => {
                if (repo.language) {
                    languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
                }
            });

            const topLanguages = Object.entries(languageCounts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            // Get recent repos
            const recentRepos = repos.slice(0, 5);

            // Estimate contributions (GitHub doesn't provide this via API without auth)
            // This is a rough estimate based on repo activity
            const contributionsThisYear = repos.length * 50; // Rough estimate

            return {
                user,
                repos: user.public_repos,
                totalStars,
                totalForks,
                topLanguages,
                recentRepos,
                contributionsThisYear,
            };
        } catch (error) {
            console.error('Error fetching GitHub stats:', error);
            throw error;
        }
    },

    async validateUsername(username: string): Promise<boolean> {
        try {
            await this.getUser(username);
            return true;
        } catch {
            return false;
        }
    },
};
