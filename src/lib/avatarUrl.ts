const AVATAR_SYNC_VERSION_KEY = 'avatarSyncVersion';

function parseUrl(value: string): URL | null {
    try {
        return new URL(value);
    } catch {
        return null;
    }
}

function isGoogleAvatarHost(hostname: string): boolean {
    return (
        hostname.endsWith('googleusercontent.com')
        || hostname.endsWith('ggpht.com')
    );
}

export function isGoogleAvatarUrl(value?: string): boolean {
    if (!value) return false;
    const parsed = parseUrl(value);
    if (!parsed) return false;
    return isGoogleAvatarHost(parsed.hostname);
}

export function setAvatarSyncVersionNow(): string {
    const version = Date.now().toString();
    if (typeof window !== 'undefined') {
        localStorage.setItem(AVATAR_SYNC_VERSION_KEY, version);
    }
    return version;
}

export function getAvatarSyncVersion(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    return localStorage.getItem(AVATAR_SYNC_VERSION_KEY) || undefined;
}

export function withAvatarSyncVersion(value?: string, version?: string): string | undefined {
    if (!value) return value;

    const parsed = parseUrl(value);
    if (!parsed) return value;
    if (!isGoogleAvatarHost(parsed.hostname)) return value;

    const resolvedVersion = version || getAvatarSyncVersion();
    if (!resolvedVersion) return value;

    parsed.searchParams.set('v', resolvedVersion);
    return parsed.toString();
}
