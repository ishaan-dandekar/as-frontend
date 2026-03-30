'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { X, Plus, Link as LinkIcon, Github } from 'lucide-react';
import { projectApi } from '@/api/project';
import { useRouter } from 'next/navigation';

const projectSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(20, 'Description must be at least 20 characters'),
    githubUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    liveUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    techStack: z.array(z.string()).min(1, 'Add at least one technology'),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

const SUGGESTED_TECH = ['React', 'Next.js', 'Typescript', 'Tailwind CSS', 'Node.js', 'Python', 'Firebase', 'MongoDB', 'PostgreSQL'];

export function ProjectForm() {
    const [step, setStep] = useState(1);
    const [skills, setSkills] = useState<string[]>([]);
    const [newSkill, setNewSkill] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const { register, handleSubmit, formState: { errors }, setValue } = useForm<ProjectFormValues>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            techStack: [],
        },
    });

    const addSkill = (skill: string) => {
        if (skill && !skills.includes(skill)) {
            const updated = [...skills, skill];
            setSkills(updated);
            setValue('techStack', updated, { shouldValidate: true });
            setNewSkill('');
        }
    };

    const removeSkill = (skill: string) => {
        const updated = skills.filter(s => s !== skill);
        setSkills(updated);
        setValue('techStack', updated, { shouldValidate: true });
    };

    const onSubmit = async (data: ProjectFormValues) => {
        setIsLoading(true);
        setError(null);
        try {
            await projectApi.createProject(data);
            router.push('/projects');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'Failed to create project');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="flex justify-between items-center mb-8">
                {[1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= i ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                            {i}
                        </div>
                        <span className={`text-sm font-medium ${step >= i ? 'text-slate-900' : 'text-slate-500'}`}>
                            {i === 1 ? 'Details' : 'Teck Stack & Links'}
                        </span>
                        {i < 2 && <div className="h-px w-16 bg-slate-200"></div>}
                    </div>
                ))}
            </div>

            {error && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                    {error}
                </div>
            )}

            {step === 1 && (
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <Input
                            label="Project Title"
                            placeholder="My Awesome App"
                            {...register('title')}
                            error={errors.title?.message}
                        />
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Description</label>
                            <textarea
                                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[150px]"
                                placeholder="Describe what you built, why you built it, and what you learned..."
                                {...register('description')}
                            />
                            {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === 2 && (
                <Card>
                    <CardContent className="pt-6 space-y-6">
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-slate-700">Tech Stack</label>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {skills.map(skill => (
                                    <Badge key={skill} variant="secondary" className="gap-1 px-3 py-1">
                                        {skill}
                                        <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => removeSkill(skill)} />
                                    </Badge>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Add technology (e.g. Docker, Rust)"
                                    value={newSkill}
                                    onChange={(e) => setNewSkill(e.target.value)}
                                    className="flex-1"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addSkill(newSkill);
                                        }
                                    }}
                                />
                                <Button type="button" variant="outline" onClick={() => addSkill(newSkill)}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <span className="text-xs text-slate-500 w-full mt-2">Recommended:</span>
                                {SUGGESTED_TECH.filter(t => !skills.includes(t)).map(tech => (
                                    <button
                                        key={tech}
                                        type="button"
                                        onClick={() => addSkill(tech)}
                                        className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors"
                                    >
                                        +{tech}
                                    </button>
                                ))}
                            </div>
                            {errors.techStack && <p className="text-xs text-red-500">{errors.techStack.message}</p>}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input
                                label="GitHub Repository"
                                placeholder="https://github.com/username/repo"
                                {...register('githubUrl')}
                                error={errors.githubUrl?.message}
                                icon={<Github className="h-4 w-4" />}
                            />
                            <Input
                                label="Live Demo URL"
                                placeholder="https://myproject.com"
                                {...register('liveUrl')}
                                error={errors.liveUrl?.message}
                                icon={<LinkIcon className="h-4 w-4" />}
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="flex justify-between gap-4">
                {step > 1 && (
                    <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                        Previous
                    </Button>
                )}
                <div className="ml-auto flex gap-4">
                    <Button type="button" variant="ghost" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    {step < 2 ? (
                        <Button type="button" onClick={() => setStep(step + 1)}>
                            Next Step
                        </Button>
                    ) : (
                        <Button type="submit" isLoading={isLoading}>
                            Create Project
                        </Button>
                    )}
                </div>
            </div>
        </form>
    );
}
