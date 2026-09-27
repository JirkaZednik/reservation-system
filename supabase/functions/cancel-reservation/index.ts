import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/http.ts'

async function hashToken(token: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Nepodporovaná metoda.' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Zrušení rezervace teď není dostupné.' }, 503)
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return jsonResponse({ error: 'Neplatný odkaz ke zrušení.' }, 400)
  }

  const token = payload && typeof payload === 'object' && 'token' in payload
    ? (payload as { token?: unknown }).token
    : null

  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
    return jsonResponse({ error: 'Odkaz ke zrušení je neplatný nebo vypršel.' }, 400)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const tokenHash = await hashToken(token)
  const { data: reservation, error: lookupError } = await supabase
    .from('reservations')
    .select('id')
    .eq('cancellation_token_hash', tokenHash)
    .eq('status', 'confirmed')
    .gt('cancellation_expires_at', new Date().toISOString())
    .maybeSingle()

  if (lookupError) {
    return jsonResponse({ error: 'Rezervaci se nepodařilo načíst.' }, 500)
  }

  if (!reservation) {
    return jsonResponse({ error: 'Odkaz je neplatný, vypršel nebo už byl použit.' }, 404)
  }

  const { error: cancellationError } = await supabase
    .from('reservations')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', reservation.id)
    .eq('status', 'confirmed')

  if (cancellationError) {
    return jsonResponse({ error: 'Rezervaci se nepodařilo zrušit.' }, 500)
  }

  return jsonResponse({ cancelled: true })
})
