import { updateSession } from '@/lib/supabase/proxy'

export async function middleware(request: import('next/server').NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|js)$).*)',
  ],
}
