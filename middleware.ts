// middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // This is important! This line sets the cookie in the request
          request.cookies.set({
            name,
            value,
            ...options,
          });

          // We need to create a new response each time to apply the new cookie
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          // This sets the cookie in the response
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          // This is important! This line removes the cookie from the request
          request.cookies.set({
            name,
            value: '',
            ...options,
          });

          // We need to create a new response each time to apply the cookie change
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          // This removes the cookie from the response
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // This is important! This is what refreshes the session
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
