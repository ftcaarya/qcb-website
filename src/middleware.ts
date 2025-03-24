import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get hostname (e.g. vercel.app, example.com) of the request
  const hostname = request.headers.get('host') || '';
  
  // If the request is for the admin API endpoint (timeslots) from a non-admin hostname,
  // block access to it unless it's in development mode
  if (
    pathname.startsWith('/api/timeslots') && 
    !hostname.includes('localhost') && 
    !hostname.includes('127.0.0.1') &&
    !hostname.startsWith('admin.')
  ) {
    // Block access to admin-only API routes from the client domain
    return new NextResponse(
      JSON.stringify({ error: 'Access Denied' }),
      { 
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
  
  // Continue processing request normally
  return NextResponse.next();
}

// Configure the middleware to run only for API routes
export const config = {
  matcher: '/api/:path*',
}; 