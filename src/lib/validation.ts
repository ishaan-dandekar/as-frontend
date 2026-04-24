export const validationRules = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/,
    github: /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9-]+\/?$/,
};

export const isValidEmail = (email: string): boolean => {
    return validationRules.email.test(email);
};

export const isValidUrl = (url: string): boolean => {
    if (!url) return true;
    return validationRules.url.test(url);
};

export const getCharacterCount = (text: string, max: number): string => {
    return `${text.length}/${max}`;
};

export const normalizeLeetCodeUsername = (input: string): string => {
    const raw = (input || '').trim();
    if (!raw) return '';

    const cleaned = raw
        .replace(/^https?:\/\/(www\.)?leetcode\.com\//i, '')
        .replace(/^u\//i, '')
        .replace(/^@/, '')
        .replace(/\/$/, '');

    return cleaned.split('/')[0].trim();
};
