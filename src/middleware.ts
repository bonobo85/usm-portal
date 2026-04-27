import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: { signIn: '/login' },
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/personnel/:path*',
    '/profil/:path*',
    '/badges/:path*',
    '/entrainement/:path*',
    '/formateurs/:path*',
    '/rapports/:path*',
    '/sanctions/:path*',
    '/crash/:path*',
    '/archives/:path*',
    '/workspace/:path*',
    '/admin/:path*',
  ],
};
