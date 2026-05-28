// Edge Function: metrics (#5) — dashboard administrativo de telemetria.
// Acesso restrito a admins: o usuário precisa estar autenticado (JWT) e ter o
// e-mail listado no secret ADMIN_EMAILS (lista separada por vírgula). As
// agregações vêm da função SQL get_metrics() executada com service_role.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function decodeJwt(req: Request): { role?: string; email?: string } {
  try {
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const payload = token.split('.')[1];
    if (!payload) return {};
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return {};
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admins = (Deno.env.get('ADMIN_EMAILS') ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const { role, email } = decodeJwt(req);
  const isAdmin = role === 'authenticated' && !!email && admins.includes(email.toLowerCase());
  if (!isAdmin) {
    return json({ error: 'Acesso restrito a administradores.' }, 403);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
  const { data, error } = await supabase.rpc('get_metrics');
  if (error) return json({ error: 'Falha ao obter métricas', detail: error.message }, 500);
  return json(data);
});
