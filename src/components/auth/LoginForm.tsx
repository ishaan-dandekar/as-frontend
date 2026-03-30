'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 },
};

export function LoginForm() {
    const { googleLogin, isLoading } = useAuth();
    const [error, setError] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
        setError(null);
        try {
            await googleLogin();
        } catch (err: unknown) {
            const error = err as { message?: string };
            setError(error.message || 'Sign-in failed. Please try again.');
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto shadow-xl border-slate-200/60 transition-all duration-300 overflow-hidden">
            <CardHeader className="space-y-1 pb-2">
                <CardTitle className="text-2xl text-center font-bold tracking-tight">
                    Welcome to APSIT Student Sphere
                </CardTitle>
                <CardDescription className="text-center">
                    Sign in with your APSIT Google account to continue
                </CardDescription>
            </CardHeader>
            <CardContent>
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="space-y-5"
                >
                    {error && (
                        <motion.div
                            variants={itemVariants}
                            className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm font-medium"
                        >
                            {error}
                        </motion.div>
                    )}

                    <motion.div variants={itemVariants}>
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 h-12 px-6 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all duration-200 hover:shadow-md hover:border-slate-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
                            ) : (
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                            )}
                            {isLoading ? 'Signing in...' : 'Continue with Google'}
                        </button>
                    </motion.div>

                    <motion.div variants={itemVariants} className="text-center">
                        <p className="text-xs text-slate-400">
                            Only <span className="font-semibold text-slate-500">@apsit.edu.in</span> accounts are accepted
                        </p>
                    </motion.div>
                </motion.div>
            </CardContent>
        </Card>
    );
}
