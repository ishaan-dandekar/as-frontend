import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50/50">
            <div className="w-full flex items-center justify-center">
                <div className="w-full max-w-md">
                    <div className="mb-8 text-center text-indigo-600 font-bold text-2xl">
                        APSIT Student Sphere
                    </div>
                    <LoginForm />
                </div>
            </div>
        </div>
    );
}
