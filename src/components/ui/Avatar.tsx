import * as React from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
    src?: string;
    alt?: string;
    fallback?: string;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
    ({ className, src, alt, fallback, ...props }, ref) => {
        const [hasError, setHasError] = React.useState(false);
        const normalizedSrc = (src || '').trim();

        React.useEffect(() => {
            setHasError(false);
        }, [src]);

        return (
            <div
                ref={ref}
                className={cn(
                    'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100',
                    className
                )}
                {...props}
            >
                {normalizedSrc && !hasError ? (
                    <img
                        src={normalizedSrc}
                        alt={alt || 'Avatar'}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={() => setHasError(true)}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-500 text-sm font-medium">
                        {fallback || 'U'}
                    </div>
                )}
            </div>
        );
    }
);
Avatar.displayName = 'Avatar';

export { Avatar };
