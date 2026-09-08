import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getInternalAuthEmail, normalizeAuthIdentifier } from '@/lib/utils/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, familyCode, password, phone, familyName } = body;

    if (!username || !familyCode || !password) {
      return NextResponse.json(
        { error: 'Por favor completa todos los campos (código de familia, usuario y contraseña)' },
        { status: 400 }
      );
    }

    if (username.trim().length < 2) {
      return NextResponse.json(
        { error: 'El nombre de usuario debe tener al menos 2 caracteres' },
        { status: 400 }
      );
    }

    if (familyCode.trim().length < 3) {
      return NextResponse.json(
        { error: 'El código de familia debe tener al menos 3 caracteres' },
        { status: 400 }
      );
    }

    if (phone && (phone.trim().replace(/\D/g, '').length < 6)) {
      return NextResponse.json(
        { error: 'Ingresa un número de celular / WhatsApp válido' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    const cleanUser = normalizeAuthIdentifier(username);
    const cleanFam = normalizeAuthIdentifier(familyCode);

    if (!cleanUser || !cleanFam) {
      return NextResponse.json(
        { error: 'El usuario y código deben contener caracteres válidos (letras o números)' },
        { status: 400 }
      );
    }

    const email = getInternalAuthEmail(username, familyCode);
    const finalFamilyCode = familyCode.trim().toUpperCase();
    const admin = createAdminClient();

    // Create user with pre-confirmed email so no confirmation email is required
    const { data: userData, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: username.trim(),
        family_code: finalFamilyCode,
        phone: phone?.trim() || null,
        family_name: familyName?.trim() || null,
      },
    });

    if (createError) {
      const msg = createError.message?.toLowerCase() || '';
      if (msg.includes('already') || msg.includes('exists') || msg.includes('registered')) {
        return NextResponse.json(
          { error: 'Ese usuario ya existe en esta familia. Prueba iniciando sesión.' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: userData.user,
      email,
    });
  } catch (err: any) {
    console.error('Error in auth register route:', err);
    return NextResponse.json(
      { error: err.message || 'Error interno al registrar usuario' },
      { status: 500 }
    );
  }
}
