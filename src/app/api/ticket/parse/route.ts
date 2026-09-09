import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { parseTicketWithGemini } from '@/lib/utils/ticketParser';

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ndsbngixgweetvrnzasz.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kc2JuZ2l4Z3dlZXR2cm56YXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MTkwMDMsImV4cCI6MjEwNDM5NTAwM30.vOVi6bhvmWVhYJ79J8GLxAf9Lwy2a9mG-BCcCHrRik4';

  const supabaseServer = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {},
    },
  });

  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  let body: { image?: string; mimeType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const { image, mimeType } = body;
  if (!image || !mimeType) {
    return NextResponse.json({ error: 'Falta la imagen' }, { status: 400 });
  }

  try {
    const parsed = await parseTicketWithGemini(image, mimeType);
    return NextResponse.json({ ticket: parsed });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'El servidor está ocupado, intentá de nuevo en un momento';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}