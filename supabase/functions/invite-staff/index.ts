import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── 1. Verificar que el que llama está autenticado ────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const callerToken = authHeader.replace('Bearer ', '')

    // Cliente admin para operaciones privilegiadas
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // ── 2. Verificar identidad del llamante con su JWT ────────────────────────
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(callerToken)
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: 'Token inválido o expirado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 3. Verificar que el llamante es staff registrado ─────────────────────
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('staff_users')
      .select('role')
      .eq('id_usuario', caller.id)
      .single()

    if (profileError || !callerProfile) {
      return new Response(
        JSON.stringify({ error: 'No tienes permiso para invitar miembros' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 4. Validar body ───────────────────────────────────────────────────────
    const { email, full_name, role, specialty } = await req.json()

    if (!email || !full_name || !role) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos: email, full_name, role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!['doctor', 'admin'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Rol inválido. Valores permitidos: doctor, admin' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 5. Invitar al nuevo usuario ───────────────────────────────────────────
    const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:4200'
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${siteUrl}/auth/callback`,
      data: { full_name, role, specialty: specialty || null },
    })

    if (error) {
      console.error('inviteUserByEmail failed:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
      const msg = error.message || error.code || JSON.stringify(error) || 'Error al invitar'
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 6. Pre-insertar en staff_users para que aparezca de inmediato ─────────
    // El trigger handle_new_auth_user() también lo hará al aceptar la invitación;
    // ON CONFLICT DO NOTHING evita duplicados.
    await supabaseAdmin.from('staff_users').insert({
      id_usuario: data.user.id,
      full_name,
      email,
      role,
      specialty: specialty || null,
    })

    return new Response(
      JSON.stringify({ id: data.user.id, email: data.user.email }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
