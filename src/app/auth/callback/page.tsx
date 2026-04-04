'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function decodeBase64Url(value: string) {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return atob(padded);
}

function CallbackHandler() {
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        const encoded = searchParams.get('data');
        if (!encoded) {
            setError('Missing callback data.');
            return;
        }

        try {
            const decoded = JSON.parse(decodeBase64Url(encoded));

            // Store result in localStorage so the opener window picks it up
            if (decoded.status === 'success' && decoded.payload) {
                localStorage.setItem('google_oauth_result', JSON.stringify(decoded.payload));
                setIsSuccess(true);
            }

            // Also try postMessage to opener (same origin now!)
            if (window.opener && !window.opener.closed) {
                try {
                    // Opener validates origin on receive; '*' avoids target-origin mismatch edge cases.
                    window.opener.postMessage(decoded, '*');
                } catch { /* */ }
            }

            // Try to close the popup
            const tryClose = () => { try { window.close(); } catch { /* */ } };
            setTimeout(tryClose, 150);
            setTimeout(tryClose, 600);
            setTimeout(tryClose, 1200);

            // If popup didn't close and there's an error, show it
            if (decoded.status !== 'success') {
                setError(decoded.message || 'Sign-in failed.');
            }
        } catch {
            setError('Failed to process sign-in data.');
        }
    }, [searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center p-8">
                {error ? (
                    <>
                        <p className="text-red-600 font-semibold mb-4">{error}</p>
                        <button
                            onClick={() => window.close()}
                            className="text-indigo-600 underline text-sm"
                        >
                            Close this window
                        </button>
                    </>
                ) : (
                    <>
                        <div className="w-10 h-10 border-3 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-slate-500 text-sm">
                            {isSuccess ? 'Sign-in complete. You can close this window.' : 'Completing sign-in...'}
                        </p>
                        {isSuccess ? (
                            <button
                                onClick={() => window.close()}
                                className="text-indigo-600 underline text-sm mt-3"
                            >
                                Close this window
                            </button>
                        ) : null}
                    </>
                )}
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <p className="text-slate-500 text-sm">Loading...</p>
            </div>
        }>
            <CallbackHandler />
        </Suspense>
    );
}
