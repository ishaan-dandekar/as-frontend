export const POPULAR_SKILL_TAGS = [
    'JavaScript',
    'TypeScript',
    'Python',
    'Java',
    'C++',
    'C',
    'C#',
    'Go',
    'Rust',
    'PHP',
    'Ruby',
    'Kotlin',
    'Swift',
    'Dart',
    'React',
    'Next.js',
    'Node.js',
    'Express',
    'Django',
    'Flask',
    'FastAPI',
    'Spring Boot',
    'Angular',
    'Vue.js',
    'Tailwind CSS',
    'HTML',
    'CSS',
    'PostgreSQL',
    'MySQL',
    'MongoDB',
    'Redis',
    'Firebase',
    'Supabase',
    'Docker',
    'Kubernetes',
    'AWS',
    'Azure',
    'GCP',
    'Git',
    'GitHub',
    'Linux',
    'GraphQL',
    'REST API',
    'TensorFlow',
    'PyTorch',
    'Pandas',
    'NumPy',
    'Machine Learning',
    'Data Structures',
    'DevOps',
] as const;

const SKILL_ALIASES: Record<string, string> = {
    js: 'JavaScript',
    javascript: 'JavaScript',
    ts: 'TypeScript',
    typescript: 'TypeScript',
    py: 'Python',
    python: 'Python',
    java: 'Java',
    cpp: 'C++',
    'c++': 'C++',
    c: 'C',
    csharp: 'C#',
    'c#': 'C#',
    golang: 'Go',
    go: 'Go',
    rust: 'Rust',
    php: 'PHP',
    ruby: 'Ruby',
    kotlin: 'Kotlin',
    swift: 'Swift',
    dart: 'Dart',
    react: 'React',
    reactjs: 'React',
    'react.js': 'React',
    next: 'Next.js',
    nextjs: 'Next.js',
    'next.js': 'Next.js',
    node: 'Node.js',
    nodejs: 'Node.js',
    'node.js': 'Node.js',
    express: 'Express',
    django: 'Django',
    flask: 'Flask',
    fastapi: 'FastAPI',
    spring: 'Spring Boot',
    'spring boot': 'Spring Boot',
    angular: 'Angular',
    vue: 'Vue.js',
    vuejs: 'Vue.js',
    'vue.js': 'Vue.js',
    tailwind: 'Tailwind CSS',
    tailwindcss: 'Tailwind CSS',
    'tailwind css': 'Tailwind CSS',
    html: 'HTML',
    css: 'CSS',
    postgres: 'PostgreSQL',
    postgresql: 'PostgreSQL',
    mysql: 'MySQL',
    mongodb: 'MongoDB',
    mongo: 'MongoDB',
    redis: 'Redis',
    firebase: 'Firebase',
    supabase: 'Supabase',
    docker: 'Docker',
    k8s: 'Kubernetes',
    kubernetes: 'Kubernetes',
    aws: 'AWS',
    azure: 'Azure',
    gcp: 'GCP',
    git: 'Git',
    github: 'GitHub',
    linux: 'Linux',
    graphql: 'GraphQL',
    rest: 'REST API',
    'rest api': 'REST API',
    tensorflow: 'TensorFlow',
    pytorch: 'PyTorch',
    pandas: 'Pandas',
    numpy: 'NumPy',
    ml: 'Machine Learning',
    'machine learning': 'Machine Learning',
    dsa: 'Data Structures',
    'data structures': 'Data Structures',
    devops: 'DevOps',
};

const SPECIAL_CASES = new Set(['AI', 'ML', 'AWS', 'GCP', 'HTML', 'CSS', 'SQL', 'UI', 'UX', 'API']);

export function normalizeSkillTag(value?: string | null): string {
    const cleaned = String(value || '').trim().replace(/\s+/g, ' ');
    if (!cleaned) return '';

    const aliased = SKILL_ALIASES[cleaned.toLowerCase()];
    if (aliased) return aliased;

    return cleaned
        .split(' ')
        .map((token) => {
            const upper = token.toUpperCase();
            if (SPECIAL_CASES.has(upper)) return upper;
            if (/[.+#]/.test(token) || /[A-Z]/.test(token.slice(1))) return token;
            return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
        })
        .join(' ');
}

export function normalizeSkillTags(values: string[]): string[] {
    const seen = new Set<string>();
    const normalized: string[] = [];

    values.forEach((value) => {
        const tag = normalizeSkillTag(value);
        const key = tag.toLowerCase();
        if (!tag || seen.has(key)) return;
        seen.add(key);
        normalized.push(tag);
    });

    return normalized;
}

export function parseSkillInput(value: string): string[] {
    return normalizeSkillTags(
        value
            .split(/[\n,]/)
            .map((item) => item.trim())
            .filter(Boolean)
    );
}
