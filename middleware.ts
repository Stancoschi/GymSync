import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Read theme preference from cookie and pass to layout via header
  const themeCookie = request.cookies.get('gymsync-theme')?.value;
  const validTheme = themeCookie === 'light' ? 'light' : 'dark';

  const response = await updateSession(request);

  // Attach resolved theme so RootLayout can set the class server-side
  response.headers.set('x-gymsync-theme', validTheme);

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css)).*)',
  ],
};
