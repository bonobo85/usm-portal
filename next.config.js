/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.discordapp.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  async rewrites() {
    return [
      // NextAuth needs /api/auth/callback/discord, /api/auth/signin, etc.
      // Rewrite all /api/auth/* subroutes to the single handler
      {
        source: '/api/auth/:path*',
        destination: '/api/auth',
      },
    ];
  },
};

module.exports = nextConfig;
