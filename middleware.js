import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Public APIs (no token required)
  if (
    pathname.startsWith('/api/public') || 
    pathname.startsWith('/api/sms') 
  ) {
    return NextResponse.next();
  }

  // Protected APIs
 // Get token from cookie
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (token !== process.env.API_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/sms:path*'],
};
