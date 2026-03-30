import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Users, Rocket, Trophy, Compass } from 'lucide-react';

const features = [
    {
        title: 'Discover the right opportunity',
        description: 'Find active projects that match your interests, skills, and growth goals.',
        icon: Compass,
        badge: 'Explore',
        iconClass: 'text-teal-700',
        iconBgClass: 'bg-teal-100',
    },
    {
        title: 'Build with a strong team',
        description: 'Collaborate with students across departments and form teams with clear roles.',
        icon: Users,
        badge: 'Collaborate',
        iconClass: 'text-orange-700',
        iconBgClass: 'bg-orange-100',
    },
    {
        title: 'Ship and showcase outcomes',
        description: 'Turn ideas into real projects, then present your work with confidence.',
        icon: Rocket,
        badge: 'Launch',
        iconClass: 'text-sky-700',
        iconBgClass: 'bg-sky-100',
    },
    {
        title: 'Stay ready for every event',
        description: 'Track hackathons and showcases so your team is always prepared to participate.',
        icon: Trophy,
        badge: 'Compete',
        iconClass: 'text-violet-700',
        iconBgClass: 'bg-violet-100',
    },
];

export function Features() {
    return (
        <section className="py-24 sm:py-28">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mx-auto mb-14 max-w-3xl text-center sm:mb-16">
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-700">Core Capabilities</p>
                    <h2 className="font-display mt-3 text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                        Simple tools, meaningful progress
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-balance text-base text-slate-600 sm:text-lg">
                        Every feature is designed to help you move from idea to execution without unnecessary complexity.
                    </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {features.map((feature) => (
                        <Card key={feature.title} className="group h-full rounded-2xl border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                            <CardHeader className="space-y-4 p-5 sm:p-6">
                                <div className="flex items-center justify-between">
                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                                        {feature.badge}
                                    </span>
                                </div>
                                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${feature.iconBgClass} ${feature.iconClass}`}>
                                    <feature.icon className="h-6 w-6" />
                                </div>
                                <CardTitle className="text-xl leading-snug text-slate-900">{feature.title}</CardTitle>
                                <CardDescription className="text-[15px] leading-relaxed text-slate-600">{feature.description}</CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
