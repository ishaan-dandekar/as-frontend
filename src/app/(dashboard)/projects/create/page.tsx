'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ProjectForm } from '@/components/projects/ProjectForm';

export default function CreateProjectPage() {
    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <Breadcrumbs
                items={[
                    { label: 'Projects', href: '/projects' },
                    { label: 'Create' }
                ]}
            />
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Create New Project</h1>
                <p className="text-slate-500">
                    Share your project with the community and find the perfect teammates.
                </p>
            </div>

            <div className="rounded-2xl bg-white p-1 shadow-sm border border-slate-100">
                <div className="p-6">
                    <ProjectForm />
                </div>
            </div>
        </div>
    );
}
