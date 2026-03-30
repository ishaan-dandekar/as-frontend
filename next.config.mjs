/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        dangerouslyAllowSVG: true,
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'api.dicebear.com',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'lh4.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: '**.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'ggpht.com',
            },
            {
                protocol: 'https',
                hostname: '**.ggpht.com',
            },
            {
                protocol: 'https',
                hostname: 'avatars.githubusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'github.com',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
            },
        ],
    },
    transpilePackages: ['framer-motion'],
};

export default nextConfig;
