'use client';

import { Github, Star, GitFork, BookOpen, ExternalLink, Activity, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { githubApi, GitHubStats as GitHubStatsType } from '@/api/github';

interface GitHubStatsProps {
    username?: string;
}

export function GitHubStats({ username }: GitHubStatsProps) {
    const [hoveredStat, setHoveredStat] = useState<string | null>(null);
    const [isCardHovered, setIsCardHovered] = useState(false);
    const [stats, setStats] = useState<GitHubStatsType | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const oauthSession = githubApi.getStoredOAuthSession();
    const effectiveUsername = username || oauthSession?.githubUsername;

    const fetchStats = useCallback(async () => {
        if (!effectiveUsername && !oauthSession?.sessionId) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const data = await githubApi.getStats(effectiveUsername || '');
            setStats(data);
            setLastUpdated(new Date());
        } catch (err) {
            setError('Failed to load GitHub stats');
            console.error('GitHub API error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [effectiveUsername, oauthSession?.sessionId]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    if (!effectiveUsername && !oauthSession?.sessionId) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white via-white to-slate-50/50 p-6 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-all duration-500 overflow-hidden"
            >
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-100/50 to-indigo-100/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative">
                    <h3 className="text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent flex items-center gap-3 mb-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-slate-600 to-slate-800 rounded-xl blur-md opacity-40" />
                            <div className="relative p-2.5 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl shadow-lg shadow-slate-500/25">
                                <Github className="h-5 w-5 text-white" />
                            </div>
                        </div>
                        GitHub Stats
                    </h3>

                    <div className="flex flex-col h-36 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-100 text-center p-6">
                        <motion.div 
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                            className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-indigo-100 flex items-center justify-center mb-3"
                        >
                            <Github className="h-6 w-6 text-slate-600" />
                        </motion.div>
                        <p className="text-sm text-slate-600 mb-3 font-medium">Connect your GitHub to showcase your repositories</p>
                        <motion.button 
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-slate-700 to-slate-900 text-white text-sm font-semibold rounded-xl shadow-lg shadow-slate-500/25 hover:shadow-xl transition-shadow"
                        >
                            <span>Link Account</span>
                            <ExternalLink className="h-4 w-4" />
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        );
    }

    // Loading state
    if (isLoading && !stats) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white via-white to-slate-50/30 p-6 shadow-lg"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl">
                        <Github className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg font-bold text-slate-800">GitHub Stats</span>
                </div>
                <div className="flex flex-col items-center justify-center h-48">
                    <RefreshCw className="h-8 w-8 text-slate-400 animate-spin mb-3" />
                    <p className="text-sm text-slate-500">Loading GitHub stats...</p>
                </div>
            </motion.div>
        );
    }

    // Error state
    if (error && !stats) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-2xl border border-rose-200/60 bg-gradient-to-br from-white via-white to-rose-50/30 p-6 shadow-lg"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl">
                        <Github className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg font-bold text-slate-800">GitHub Stats</span>
                </div>
                <div className="flex flex-col items-center justify-center h-48">
                    <AlertCircle className="h-8 w-8 text-rose-400 mb-3" />
                    <p className="text-sm text-rose-600 mb-3">{error}</p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={fetchStats}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
                    >
                        Try Again
                    </motion.button>
                </div>
            </motion.div>
        );
    }

    const displayStats = [
        { 
            key: 'repos',
            label: 'Repositories', 
            value: stats?.repos || 0, 
            icon: BookOpen, 
            color: 'slate',
            gradient: 'from-slate-500 to-slate-700',
            bgGradient: 'from-slate-50 to-slate-100/50',
        },
        { 
            key: 'stars',
            label: 'Stars Earned', 
            value: stats?.totalStars || 0, 
            icon: Star, 
            color: 'amber',
            gradient: 'from-amber-400 to-orange-500',
            bgGradient: 'from-amber-50 to-orange-50/50',
        },
        { 
            key: 'forks',
            label: 'Forks', 
            value: stats?.totalForks || 0, 
            icon: GitFork, 
            color: 'indigo',
            gradient: 'from-indigo-500 to-purple-600',
            bgGradient: 'from-indigo-50 to-purple-50/50',
        },
        { 
            key: 'contributions',
            label: 'Contributions', 
            value: stats?.contributionsThisYear || 0, 
            icon: Activity, 
            color: 'emerald',
            gradient: 'from-emerald-500 to-teal-600',
            bgGradient: 'from-emerald-50 to-teal-50/50',
        }
    ];

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onHoverStart={() => setIsCardHovered(true)}
            onHoverEnd={() => setIsCardHovered(false)}
            className="group relative rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white via-white to-slate-50/30 p-6 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-200/70 transition-all duration-500 overflow-hidden"
        >
            {/* Animated background gradients */}
            <motion.div 
                animate={{ scale: isCardHovered ? 1.5 : 1, opacity: isCardHovered ? 0.8 : 0.5 }}
                transition={{ duration: 0.5 }}
                className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-100/30 to-purple-100/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" 
            />
            <motion.div 
                animate={{ scale: isCardHovered ? 1.3 : 1 }}
                transition={{ duration: 0.5 }}
                className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-slate-100/40 to-indigo-100/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" 
            />

            <div className="relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent flex items-center gap-3">
                        <motion.div 
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.5 }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-slate-600 to-slate-800 rounded-xl blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
                            <div className="relative p-2.5 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl shadow-lg shadow-slate-500/25">
                                <Github className="h-5 w-5 text-white" />
                            </div>
                        </motion.div>
                        GitHub Stats
                        {/* Live indicator */}
                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 rounded-full">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-bold text-emerald-700">LIVE</span>
                        </span>
                    </h3>
                    <div className="flex items-center gap-2">
                        <motion.button
                            whileHover={{ rotate: 180 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={fetchStats}
                            disabled={isLoading}
                            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
                        </motion.button>
                        <motion.a 
                            href={`https://github.com/${stats?.user?.login || effectiveUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ x: 3 }}
                            className="text-xs font-medium text-slate-400 hover:text-indigo-600 flex items-center gap-1.5 transition-colors"
                        >
                            @{stats?.user?.login || effectiveUsername}
                            <ExternalLink className="h-3 w-3" />
                        </motion.a>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {displayStats.map((stat, index) => {
                        const Icon = stat.icon;
                        const isHovered = hoveredStat === stat.key;
                        
                        return (
                            <motion.div
                                key={stat.key}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.03, y: -3 }}
                                onHoverStart={() => setHoveredStat(stat.key)}
                                onHoverEnd={() => setHoveredStat(null)}
                                className={`relative p-4 rounded-xl bg-gradient-to-br ${stat.bgGradient} border border-slate-100/50 cursor-pointer overflow-hidden transition-shadow hover:shadow-lg`}
                            >
                                {/* Glow effect */}
                                <AnimatePresence>
                                    {isHovered && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 0.1 }}
                                            exit={{ opacity: 0 }}
                                            className={`absolute inset-0 bg-gradient-to-br ${stat.gradient}`}
                                        />
                                    )}
                                </AnimatePresence>
                                
                                <div className="relative">
                                    <div className="flex items-center gap-2 mb-2">
                                        <motion.div
                                            animate={{ rotate: isHovered ? 10 : 0 }}
                                            className={`p-1.5 rounded-lg bg-gradient-to-br ${stat.gradient} shadow-sm`}
                                        >
                                            <Icon className="h-3.5 w-3.5 text-white" />
                                        </motion.div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
                                    </div>
                                    
                                    <motion.span 
                                        animate={{ scale: isHovered ? 1.05 : 1 }}
                                        className={`text-2xl font-black bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}
                                    >
                                        {stat.value.toLocaleString()}
                                    </motion.span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Top Languages */}
                {stats?.topLanguages && stats.topLanguages.length > 0 && (
                    <div className="relative p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Languages</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {stats.topLanguages.slice(0, 5).map((lang, index) => (
                                <motion.span
                                    key={lang.name}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="px-2.5 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-xs font-semibold rounded-full"
                                >
                                    {lang.name}
                                </motion.span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Last updated */}
                {lastUpdated && (
                    <p className="text-[10px] text-slate-400 text-center">
                        Last updated: {lastUpdated.toLocaleTimeString()}
                    </p>
                )}
            </div>
        </motion.div>
    );
}
