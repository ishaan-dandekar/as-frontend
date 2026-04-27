'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Github, 
    Code2, 
    Link2, 
    Unlink, 
    Check, 
    X, 
    ExternalLink, 
    RefreshCw,
    Shield,
    Zap,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { githubApi } from '@/api/github';

interface ProfileIntegrationsProps {
    githubUsername?: string;
    leetCodeUsername?: string;
    onGithubConnect?: (username: string) => void;
    onLeetCodeConnect?: (username: string) => void;
    onGithubDisconnect?: () => void;
    onLeetCodeDisconnect?: () => void;
}

export function ProfileIntegrations({
    githubUsername,
    leetCodeUsername,
    onGithubConnect,
    onLeetCodeConnect,
    onGithubDisconnect,
    onLeetCodeDisconnect
}: ProfileIntegrationsProps) {
    const [activeModal, setActiveModal] = useState<'github' | 'leetcode' | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [isGithubAuthorizing, setIsGithubAuthorizing] = useState(false);
    const [githubAuthError, setGithubAuthError] = useState<string | null>(null);
    const [oauthSession, setOauthSession] = useState(() => githubApi.getStoredOAuthSession());

    useEffect(() => {
        const syncSessionFromStorage = () => {
            const session = githubApi.getStoredOAuthSession();
            setOauthSession((prev) => {
                if (!prev && !session) return prev;
                if (
                    prev?.sessionId === session?.sessionId &&
                    prev?.githubUsername === session?.githubUsername
                ) {
                    return prev;
                }
                return session;
            });

            if (session?.githubUsername && session.githubUsername !== githubUsername) {
                onGithubConnect?.(session.githubUsername);
                setIsGithubAuthorizing(false);
                setGithubAuthError(null);
            }
        };

        const onStorage = (event: StorageEvent) => {
            if (event.key && event.key !== 'github_oauth_session') {
                return;
            }
            syncSessionFromStorage();
        };

        window.addEventListener('storage', onStorage);
        syncSessionFromStorage();

        return () => {
            window.removeEventListener('storage', onStorage);
        };
    }, [githubUsername, onGithubConnect]);

    const handleGitHubOAuth = async () => {
        let popup: Window | null = null;
        let shouldClosePopup = false;
        try {
            setIsGithubAuthorizing(true);
            setGithubAuthError(null);

            // Clear stale session payload from previous attempts.
            localStorage.removeItem('github_oauth_session');

            const popupWidth = 620;
            const popupHeight = 740;
            const dualScreenLeft = window.screenLeft ?? window.screenX ?? 0;
            const dualScreenTop = window.screenTop ?? window.screenY ?? 0;
            const viewportWidth = window.innerWidth || document.documentElement.clientWidth || screen.width;
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight || screen.height;
            const popupLeft = Math.max(0, Math.round(dualScreenLeft + (viewportWidth - popupWidth) / 2));
            const popupTop = Math.max(0, Math.round(dualScreenTop + (viewportHeight - popupHeight) / 2));

            popup = window.open(
                '',
                'github_oauth',
                `width=${popupWidth},height=${popupHeight},left=${popupLeft},top=${popupTop},menubar=no,toolbar=no,location=yes,resizable=yes,scrollbars=yes,status=no`
            );
            if (!popup) {
                throw new Error('Popup was blocked. Please allow popups and try again.');
            }

            const start = await githubApi.getOAuthStartUrl(window.location.origin);
            if (!start?.authorizationUrl) {
                throw new Error('Missing GitHub authorization URL');
            }

            await new Promise<void>((resolve, reject) => {
                let resolved = false;
                let popupClosedAt: number | null = null;

                const finish = (mode: 'resolve' | 'reject', value?: Error) => {
                    if (resolved) return;
                    resolved = true;
                    window.clearTimeout(timeout);
                    window.removeEventListener('message', onMessage);
                    window.removeEventListener('storage', onStorage);
                    clearInterval(storageCheck);
                    clearInterval(popupClosedCheck);

                    if (mode === 'resolve' && popup && !popup.closed) {
                        try {
                            popup.close();
                        } catch {
                            // Ignore popup close errors; auth already succeeded.
                        }
                    }

                    if (mode === 'resolve') {
                        resolve();
                    } else {
                        reject(value || new Error('GitHub authorization failed. Please try again.'));
                    }
                };

                const tryResolveFromStorage = () => {
                    try {
                        const stored = localStorage.getItem('github_oauth_session');
                        if (!stored) return false;

                        const session = JSON.parse(stored);
                        if (!session?.sessionId || !session?.githubUsername) return false;

                        githubApi.setStoredOAuthSession(session);
                        setOauthSession(session);
                        onGithubConnect?.(session.githubUsername);
                        localStorage.removeItem('github_oauth_session');
                        finish('resolve');
                        return true;
                    } catch {
                        return false;
                    }
                };

                const timeout = window.setTimeout(() => {
                    if (tryResolveFromStorage()) return;
                    finish('reject', new Error('GitHub authorization timed out. Please try again.'));
                }, 120000);

                const storageCheck = window.setInterval(() => {
                    tryResolveFromStorage();
                }, 200);

                const onStorage = (event: StorageEvent) => {
                    if (event.key === 'github_oauth_session') {
                        tryResolveFromStorage();
                    }
                };

                const popupClosedCheck = window.setInterval(() => {
                    if (!popup || popup.closed) {
                        if (tryResolveFromStorage()) {
                            return;
                        }

                        if (popupClosedAt === null) {
                            popupClosedAt = Date.now();
                            return;
                        }

                        if (Date.now() - popupClosedAt >= 10000) {
                            finish('reject', new Error('GitHub authorization window closed. Please try again.'));
                        }
                    }
                }, 200);

                const onMessage = (event: MessageEvent) => {
                    if (resolved) {
                        return;
                    }

                    const expectedOrigins = new Set<string>([
                        window.location.origin,
                    ]);
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim()
                        || `${window.location.protocol}//${window.location.hostname}:8000/api`;
                    if (apiUrl) {
                        try {
                            expectedOrigins.add(new URL(apiUrl).origin);
                        } catch {
                            // Ignore malformed API URL and continue with known origins.
                        }
                    }

                    if (!expectedOrigins.has(event.origin)) {
                        return;
                    }

                    const data = event.data as {
                        type?: string;
                        status?: 'success' | 'error';
                        message?: string;
                        payload?: {
                            sessionId?: string;
                            githubUsername?: string;
                        };
                    };

                    if (data?.type !== 'github_oauth') {
                        return;
                    }

                    if (data.status !== 'success' || !data.payload?.sessionId || !data.payload?.githubUsername) {
                        finish('reject', new Error(data.message || 'GitHub authorization failed'));
                        return;
                    }

                    githubApi.setStoredOAuthSession({
                        sessionId: data.payload.sessionId,
                        githubUsername: data.payload.githubUsername,
                    });
                    setOauthSession({
                        sessionId: data.payload.sessionId,
                        githubUsername: data.payload.githubUsername,
                    });
                    onGithubConnect?.(data.payload.githubUsername);
                    finish('resolve');
                };

                window.addEventListener('message', onMessage);
                window.addEventListener('storage', onStorage);

                // Navigate only after listeners are registered to avoid missing fast callback messages.
                if (!popup) {
                    finish('reject', new Error('GitHub authorization popup was closed before navigation.'));
                    return;
                }

                popup.location.href = start.authorizationUrl;
            });
        } catch (error) {
            shouldClosePopup = true;
            const err = error as { response?: { data?: { message?: string }; status?: number }; message?: string };
            const serverMessage = err.response?.data?.message;
            setGithubAuthError(serverMessage || err.message || 'Failed to start GitHub authorization');
        } finally {
            if (popup && !popup.closed && shouldClosePopup) {
                popup.close();
            }
            setIsGithubAuthorizing(false);
        }
    };

    const handleConnect = async (platform: 'github' | 'leetcode') => {
        if (!inputValue.trim()) return;
        
        setIsLoading(true);
        setIsVerifying(true);
        setVerificationStatus('idle');

        // Simulate API verification
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const normalizedInput = platform === 'leetcode'
            ? inputValue
                .trim()
                .replace(/^https?:\/\/(www\.)?leetcode\.com\//i, '')
                .replace(/^u\//i, '')
                .replace(/^@/, '')
                .replace(/\/$/, '')
                .split('/')[0]
                .trim()
            : inputValue.trim();

        // Mock verification (in real app, validate the username exists)
        const isValid = normalizedInput.length >= 2;
        
        if (isValid) {
            setVerificationStatus('success');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (platform === 'github') {
                onGithubConnect?.(normalizedInput);
            } else {
                onLeetCodeConnect?.(normalizedInput);
            }
            setActiveModal(null);
            setInputValue('');
        } else {
            setVerificationStatus('error');
        }
        
        setIsVerifying(false);
        setIsLoading(false);
    };

    const handleDisconnect = (platform: 'github' | 'leetcode') => {
        if (platform === 'github') {
            onGithubDisconnect?.();
        } else {
            onLeetCodeDisconnect?.();
        }
    };

    const integrations = [
        {
            id: 'github',
            name: 'GitHub',
            description: 'Showcase your repositories, contributions, and coding activity',
            icon: Github,
            color: 'slate',
            gradient: 'from-slate-700 to-slate-900',
            bgGradient: 'from-slate-50 to-slate-100/50',
            borderColor: 'border-slate-200',
            connected: !!(githubUsername || oauthSession?.sessionId),
            username: githubUsername || oauthSession?.githubUsername,
            url: (githubUsername || oauthSession?.githubUsername)
                ? `https://github.com/${githubUsername || oauthSession?.githubUsername}`
                : undefined,
            features: ['Repository stats', 'Contribution graph', 'Star count', 'Fork tracking'],
            placeholder: 'Enter your GitHub username'
        },
        {
            id: 'leetcode',
            name: 'LeetCode',
            description: 'Display your problem-solving skills and competitive ranking',
            icon: Code2,
            color: 'amber',
            gradient: 'from-amber-500 to-orange-600',
            bgGradient: 'from-amber-50 to-orange-50/50',
            borderColor: 'border-amber-200',
            connected: !!leetCodeUsername,
            username: leetCodeUsername,
            url: leetCodeUsername ? `https://leetcode.com/${leetCodeUsername}` : undefined,
            features: ['Problems solved', 'Difficulty breakdown', 'Contest rating', 'Streak tracking'],
            placeholder: 'Enter your LeetCode username'
        }
    ];

    return (
        <div className="space-y-6">
            {githubAuthError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {githubAuthError}
                </div>
            )}

            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/25">
                    <Link2 className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                        Profile Integrations
                    </h2>
                    <p className="text-sm text-slate-500">Connect your coding profiles to showcase your skills</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {integrations.map((integration) => {
                    const Icon = integration.icon;
                    
                    return (
                        <motion.div
                            key={integration.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ y: -3 }}
                            className={`relative p-5 rounded-2xl border ${integration.borderColor} bg-gradient-to-br ${integration.bgGradient} overflow-hidden transition-shadow hover:shadow-xl`}
                        >
                            {/* Background decoration */}
                            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${integration.gradient} opacity-5 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2`} />
                            
                            <div className="relative">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <motion.div 
                                            whileHover={{ rotate: 10 }}
                                            className={`p-3 rounded-xl bg-gradient-to-br ${integration.gradient} shadow-lg`}
                                        >
                                            <Icon className="h-6 w-6 text-white" />
                                        </motion.div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">{integration.name}</h3>
                                            <p className="text-xs text-slate-500 max-w-[180px]">{integration.description}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Status Badge */}
                                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                        integration.connected 
                                            ? 'bg-emerald-100 text-emerald-700' 
                                            : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {integration.connected ? (
                                            <>
                                                <Check className="h-3 w-3" />
                                                Connected
                                            </>
                                        ) : (
                                            <>
                                                <X className="h-3 w-3" />
                                                Not Connected
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Features */}
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    {integration.features.map((feature, index) => (
                                        <motion.div
                                            key={feature}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="flex items-center gap-2 text-xs text-slate-600"
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${integration.gradient}`} />
                                            {feature}
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Connected State */}
                                {integration.connected ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/60 border border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                                    <Icon className="h-4 w-4 text-slate-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">@{integration.username}</p>
                                                    <p className="text-[10px] text-slate-500">Last synced: Just now</p>
                                                </div>
                                            </div>
                                            <a 
                                                href={integration.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                            >
                                                <ExternalLink className="h-4 w-4 text-slate-400" />
                                            </a>
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                                Sync Now
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={async () => {
                                                    if (integration.id === 'github') {
                                                        await githubApi.clearStoredOAuthSession();
                                                        setOauthSession(null);
                                                    }
                                                    handleDisconnect(integration.id as 'github' | 'leetcode');
                                                }}
                                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-100 text-sm font-medium text-rose-600 hover:bg-rose-100 transition-colors"
                                            >
                                                <Unlink className="h-4 w-4" />
                                                {integration.id === 'github' ? 'Unauthorize GitHub' : 'Disconnect'}
                                            </motion.button>
                                        </div>

                                        {integration.id === 'github' && (
                                            <a
                                                href="https://github.com/settings/applications"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-700"
                                            >
                                                Manage authorized apps on GitHub
                                                <ExternalLink className="h-3.5 w-3.5" />
                                            </a>
                                        )}
                                    </div>
                                ) : (
                                    <motion.button
                                        whileHover={{ scale: 1.02, y: -1 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            if (integration.id === 'github') {
                                                handleGitHubOAuth();
                                                return;
                                            }
                                            setActiveModal('leetcode');
                                            setInputValue('');
                                            setVerificationStatus('idle');
                                        }}
                                        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r ${integration.gradient} text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-shadow`}
                                    >
                                        {integration.id === 'github' && isGithubAuthorizing ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                Authorizing...
                                            </>
                                        ) : (
                                            <>
                                                <Link2 className="h-4 w-4" />
                                                {integration.id === 'github' ? 'Authorize GitHub' : `Connect ${integration.name}`}
                                            </>
                                        )}
                                    </motion.button>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Connection Modal */}
            <AnimatePresence>
                {activeModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={() => setActiveModal(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
                        >
                            {(() => {
                                const integration = integrations.find(i => i.id === activeModal)!;
                                const Icon = integration.icon;
                                
                                return (
                                    <>
                                        {/* Modal Header */}
                                        <div className={`relative p-6 bg-gradient-to-br ${integration.bgGradient}`}>
                                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${integration.gradient} opacity-10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2`} />
                                            
                                            <div className="relative flex items-center gap-4">
                                                <motion.div 
                                                    animate={{ rotate: [0, 5, -5, 0] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    className={`p-4 rounded-2xl bg-gradient-to-br ${integration.gradient} shadow-lg`}
                                                >
                                                    <Icon className="h-8 w-8 text-white" />
                                                </motion.div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-slate-900">
                                                        Connect {integration.name}
                                                    </h3>
                                                    <p className="text-sm text-slate-500">
                                                        Link your account to display your stats
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <button
                                                onClick={() => setActiveModal(null)}
                                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/50 transition-colors"
                                            >
                                                <X className="h-5 w-5 text-slate-500" />
                                            </button>
                                        </div>

                                        {/* Modal Body */}
                                        <div className="p-6 space-y-5">
                                            {/* Security Note */}
                                            <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                                                <Shield className="h-5 w-5 text-indigo-600 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-semibold text-indigo-900">Secure Connection</p>
                                                    <p className="text-xs text-indigo-600">We only access public profile information</p>
                                                </div>
                                            </div>

                                            {/* Username Input */}
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-slate-700">
                                                    {integration.name} Username
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={inputValue}
                                                        onChange={(e) => {
                                                            setInputValue(e.target.value);
                                                            setVerificationStatus('idle');
                                                        }}
                                                        placeholder={integration.placeholder}
                                                        className={`w-full px-4 py-3 rounded-xl border-2 bg-white text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
                                                            verificationStatus === 'error' 
                                                                ? 'border-rose-300 focus:border-rose-500' 
                                                                : verificationStatus === 'success'
                                                                ? 'border-emerald-300 focus:border-emerald-500'
                                                                : 'border-slate-200 focus:border-indigo-500'
                                                        }`}
                                                    />
                                                    
                                                    {/* Verification Status Icon */}
                                                    <AnimatePresence>
                                                        {verificationStatus !== 'idle' && (
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                exit={{ opacity: 0, scale: 0 }}
                                                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                                            >
                                                                {verificationStatus === 'success' ? (
                                                                    <div className="p-1.5 rounded-full bg-emerald-100">
                                                                        <Check className="h-4 w-4 text-emerald-600" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="p-1.5 rounded-full bg-rose-100">
                                                                        <X className="h-4 w-4 text-rose-600" />
                                                                    </div>
                                                                )}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                                
                                                {verificationStatus === 'error' && (
                                                    <motion.p
                                                        initial={{ opacity: 0, y: -5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="flex items-center gap-1.5 text-xs text-rose-600"
                                                    >
                                                        <AlertCircle className="h-3 w-3" />
                                                        Username not found. Please check and try again.
                                                    </motion.p>
                                                )}
                                            </div>

                                            {/* What you'll get */}
                                            <div className="space-y-3">
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                    What you&apos;ll unlock
                                                </p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {integration.features.map((feature, index) => (
                                                        <motion.div
                                                            key={feature}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: index * 0.1 }}
                                                            className="flex items-center gap-2 p-2 rounded-lg bg-slate-50"
                                                        >
                                                            <Zap className={`h-3.5 w-3.5 ${
                                                                activeModal === 'github' ? 'text-slate-600' : 'text-amber-500'
                                                            }`} />
                                                            <span className="text-xs font-medium text-slate-700">{feature}</span>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Modal Footer */}
                                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                                            <Button
                                                variant="ghost"
                                                onClick={() => setActiveModal(null)}
                                                className="flex-1"
                                            >
                                                Cancel
                                            </Button>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleConnect(activeModal)}
                                                disabled={!inputValue.trim() || isLoading}
                                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r ${integration.gradient} text-white text-sm font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
                                            >
                                                {isVerifying ? (
                                                    <>
                                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                                        Verifying...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Link2 className="h-4 w-4" />
                                                        Connect Account
                                                    </>
                                                )}
                                            </motion.button>
                                        </div>
                                    </>
                                );
                            })()}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
