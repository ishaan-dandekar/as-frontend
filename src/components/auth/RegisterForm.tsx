'use client';

import { LoginForm } from './LoginForm';

/**
 * Registration is handled automatically via Google OAuth.
 * If the user doesn't have an account, one is created on first sign-in.
 * This component simply renders the same Google sign-in button.
 */
export function RegisterForm() {
    return <LoginForm />;
}
