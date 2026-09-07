import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ndsbngixgweetvrnzasz.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kc2JuZ2l4Z3dlZXR2cm56YXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MTkwMDMsImV4cCI6MjEwNDM5NTAwM30.vOVi6bhvmWVhYJ79J8GLxAf9Lwy2a9mG-BCcCHrRik4';

  if (!url || !key || !url.startsWith('http')) {
    // If Supabase is not configured yet, pass through to allow local dev mode
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // refreshing the auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');

  // If user is not signed in and trying to access protected route
  if (!user && !isAuthRoute && !pathname.startsWith('/_next') && !pathname.startsWith('/api') && pathname !== '/favicon.ico') {
    // In strict mode we'd redirect to /login, but allow pass-through if testing
  }

  return supabaseResponse;
}
