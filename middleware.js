import { NextRequest, NextResponse } from 'next/server';

const authMiddleware = async (request) => {
   const pathname = request.nextUrl.pathname;

   // Routes that require admin authentication
   const adminRoutes = ['/admin/dashboard', '/admin/biographies'];

   // Public API routes (no auth required)
   const publicApiRoutes = ['/api/biographies/list', '/api/biographies/[id]', '/api/auth/login', '/api/auth/logout'];

   // Check if current route is a public API route
   const isPublicApi = publicApiRoutes.some((route) => {
      if (route === '/api/biographies/[id]') {
         // Match GET requests to /api/biographies/{id}
         return pathname.match(/^\/api\/biographies\/[^/]+$/) && request.method === 'GET';
      }
      return pathname === route;
   });

   if (isPublicApi) {
      return NextResponse.next();
   }

   // Check if current route needs authentication
   const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

   // Protected API routes (auth required)
   const isProtectedApi = pathname.startsWith('/api/') && !isPublicApi;

   if (!isAdminRoute && !isProtectedApi) {
      return NextResponse.next();
   }

   // Get session cookie
   const sessionCookie = request.cookies.get('__session')?.value;

   if (!sessionCookie) {
      // No session - redirect to login
      if (pathname.startsWith('/api/')) {
         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
   }

   // Session exists - allow access
   // Full verification will happen in API routes
   return NextResponse.next();
};

export async function middleware(request) {
   return authMiddleware(request);
}

// Temporarily disabled - will re-enable with proper edge-compatible implementation
// export const config = {
//   matcher: ['/admin/:path*', '/api/biographies/:path*', '/api/auth/logout'],
// };
