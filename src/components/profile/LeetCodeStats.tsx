'use client';

import { Code2, Trophy, Zap, TrendingUp, Target, Flame, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { leetcodeApi, LeetCodeFullStats } from '@/api/leetcode';

interface LeetCodeStatsProps {
    username?: string;
}

export function LeetCodeStats({ username }: LeetCodeStatsProps) {
    const [stats, setStats] = useState<LeetCodeFullStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchStats = useCallback(async () => {
        if (!username) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const data = await leetcodeApi.getStats(username);
            setStats(data);
            setLastUpdated(new Date());
        } catch (err) {
            setError('Failed to load LeetCode stats');
            console.error('LeetCode API error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [username]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    if (!username) {
        return (
            <div className="group relative rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white via-white to-amber-50/30 p-6 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-amber-100/50 transition-all duration-500 overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/10 to-orange-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-yellow-400/10 to-amber-400/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl blur-md opacity-40" />
                                <div className="relative p-2.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg shadow-amber-500/25">
                                    <Code2 className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            LeetCode Stats
                        </h3>
                    </div>

                    <div className="flex flex-col h-36 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-amber-50/50 border border-slate-100 text-center p-6 backdrop-blur-sm">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-3">
                            <Code2 className="h-6 w-6 text-amber-600" />
                        </div>
                        <p className="text-sm text-slate-600 mb-3 font-medium">Link LeetCode to display your coding rank</p>
                        <button className="group/btn relative inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
                            <span>Connect Profile</span>
                            <ExternalLink className="h-4 w-4 group-hover/btn:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Loading state
    if (isLoading && !stats) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white via-white to-amber-50/30 p-6 shadow-lg"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl">
                        <Code2 className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg font-bold text-slate-800">LeetCode Stats</span>
                </div>
                <div className="flex flex-col items-center justify-center h-48">
                    <RefreshCw className="h-8 w-8 text-amber-400 animate-spin mb-3" />
                    <p className="text-sm text-slate-500">Loading LeetCode stats...</p>
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
                    <div className="p-2.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl">
                        <Code2 className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg font-bold text-slate-800">LeetCode Stats</span>
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

    const profile = stats?.profile;
    const contest = stats?.contest;

    const easyPercentage = profile ? (profile.easySolved / profile.totalEasy) * 100 : 0;
    const mediumPercentage = profile ? (profile.mediumSolved / profile.totalMedium) * 100 : 0;
    const hardPercentage = profile ? (profile.hardSolved / profile.totalHard) * 100 : 0;

    const rankingDisplay = profile ? leetcodeApi.formatRanking(profile.ranking) : 'N/A';

    return (
        <div className="group relative rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white via-white to-amber-50/30 p-6 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-amber-100/50 transition-all duration-500 overflow-hidden">
            {/* Animated background gradients */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-400/10 to-orange-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-yellow-400/10 to-amber-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
            <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-gradient-to-r from-orange-300/5 to-red-300/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />

            <div className="relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent flex items-center gap-3">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
                            <div className="relative p-2.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg shadow-amber-500/25">
                                <Code2 className="h-5 w-5 text-white" />
                            </div>
                        </div>
                        LeetCode Stats
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
                            className="p-1.5 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 text-amber-500 ${isLoading ? 'animate-spin' : ''}`} />
                        </motion.button>
                        <a 
                            href={`https://leetcode.com/${username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-slate-400 hover:text-amber-600 flex items-center gap-1.5 transition-colors"
                        >
                            @{username}
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                </div>

                {/* Main Stats Section */}
                <div className="space-y-6">
                    {/* Top Stats Row */}
                    <div className="flex items-stretch gap-4">
                        {/* Solved Problems - Main Stat */}
                        <div className="flex-1 relative p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 overflow-hidden group/stat">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-100/50 to-transparent rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
                            <div className="relative">
                                <div className="flex items-center gap-2 mb-2">
                                    <Target className="h-4 w-4 text-amber-500" />
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Problems Solved</p>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-4xl font-black bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent">
                                        {profile?.totalSolved || 0}
                                    </p>
                                    <span className="text-sm font-medium text-slate-400">/ {profile?.totalQuestions || 3000}</span>
                                </div>
                                {/* Progress ring visual */}
                                <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${((profile?.totalSolved || 0) / (profile?.totalQuestions || 3000)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Ranking Badge */}
                        <div className="relative p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100/50 flex flex-col items-center justify-center min-w-[100px] overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 to-orange-400/10" />
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-2 shadow-lg shadow-amber-500/30">
                                    <Trophy className="h-5 w-5 text-white" />
                                </div>
                                <p className="text-lg font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent text-center">
                                    {rankingDisplay}
                                </p>
                                <p className="text-[10px] font-semibold text-amber-600/70 uppercase tracking-wider text-center">Global</p>
                            </div>
                        </div>
                    </div>

                    {/* Difficulty Breakdown */}
                    <div className="space-y-4">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-8 h-px bg-gradient-to-r from-slate-200 to-transparent" />
                            By Difficulty
                            <span className="flex-1 h-px bg-gradient-to-l from-slate-200 to-transparent" />
                        </p>
                        
                        <div className="grid grid-cols-3 gap-3">
                            {/* Easy */}
                            <div className="group/card relative p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50/50 border border-emerald-100/50 hover:shadow-lg hover:shadow-emerald-100/50 transition-all duration-300 overflow-hidden">
                                <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-emerald-200/30 to-transparent rounded-full blur-lg" />
                                <div className="relative">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Easy</span>
                                        <span className="text-[10px] font-semibold text-emerald-500">{easyPercentage.toFixed(0)}%</span>
                                    </div>
                                    <p className="text-2xl font-black text-emerald-700 mb-1">{profile?.easySolved || 0}</p>
                                    <p className="text-[10px] text-emerald-600/70 font-medium">of {profile?.totalEasy || 800}</p>
                                    <div className="mt-3 h-2 rounded-full bg-emerald-100 overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-700"
                                            style={{ width: `${easyPercentage}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Medium */}
                            <div className="group/card relative p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50/50 border border-amber-100/50 hover:shadow-lg hover:shadow-amber-100/50 transition-all duration-300 overflow-hidden">
                                <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-amber-200/30 to-transparent rounded-full blur-lg" />
                                <div className="relative">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Medium</span>
                                        <span className="text-[10px] font-semibold text-amber-500">{mediumPercentage.toFixed(0)}%</span>
                                    </div>
                                    <p className="text-2xl font-black text-amber-700 mb-1">{profile?.mediumSolved || 0}</p>
                                    <p className="text-[10px] text-amber-600/70 font-medium">of {profile?.totalMedium || 1650}</p>
                                    <div className="mt-3 h-2 rounded-full bg-amber-100 overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700"
                                            style={{ width: `${mediumPercentage}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Hard */}
                            <div className="group/card relative p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-red-50/50 border border-rose-100/50 hover:shadow-lg hover:shadow-rose-100/50 transition-all duration-300 overflow-hidden">
                                <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-rose-200/30 to-transparent rounded-full blur-lg" />
                                <div className="relative">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">Hard</span>
                                        <span className="text-[10px] font-semibold text-rose-500">{hardPercentage.toFixed(0)}%</span>
                                    </div>
                                    <p className="text-2xl font-black text-rose-700 mb-1">{profile?.hardSolved || 0}</p>
                                    <p className="text-[10px] text-rose-600/70 font-medium">of {profile?.totalHard || 550}</p>
                                    <div className="mt-3 h-2 rounded-full bg-rose-100 overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-rose-400 to-red-500 rounded-full transition-all duration-700"
                                            style={{ width: `${hardPercentage}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Stats Row */}
                    <div className="grid grid-cols-3 gap-3 pt-2">
                        {/* Contest Rating */}
                        <div className="relative p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50/50 border border-indigo-100/50 overflow-hidden">
                            <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-indigo-200/30 to-transparent rounded-full blur-md" />
                            <div className="relative flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 shadow-md shadow-indigo-500/20">
                                    <Zap className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider">Rating</p>
                                    <p className="text-lg font-black text-indigo-700">{contest?.rating || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Streak */}
                        <div className="relative p-3 rounded-xl bg-gradient-to-br from-orange-50 to-red-50/50 border border-orange-100/50 overflow-hidden">
                            <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-orange-200/30 to-transparent rounded-full blur-md" />
                            <div className="relative flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 shadow-md shadow-orange-500/20">
                                    <Flame className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold text-orange-500 uppercase tracking-wider">Streak</p>
                                    <p className="text-lg font-black text-orange-700">{stats?.streak || 0} days</p>
                                </div>
                            </div>
                        </div>

                        {/* Acceptance Rate */}
                        <div className="relative p-3 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50/50 border border-teal-100/50 overflow-hidden">
                            <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-teal-200/30 to-transparent rounded-full blur-md" />
                            <div className="relative flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 shadow-md shadow-teal-500/20">
                                    <TrendingUp className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold text-teal-500 uppercase tracking-wider">Acceptance</p>
                                    <p className="text-lg font-black text-teal-700">{profile?.acceptanceRate?.toFixed(1) || 0}%</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Last updated */}
                    {lastUpdated && (
                        <p className="text-[10px] text-slate-400 text-center pt-2">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
