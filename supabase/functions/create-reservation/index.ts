import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/http.ts'

const allowedTimes = new Set([
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00',
  '16:00', '17:00', '18:00', '19:00', '20:00', '21:00',
])

function escapeHtml(value: string) {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',                                                                                                                                                                                                                      
    "'": '&#39;',
  }

  return value.replace(/[&<>"']/g, (character) => entities[character] ?? character)
}

function createToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))                                                                                                          
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

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
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  const emailFrom = Deno.env.get('RESERVATION_EMAIL_FROM')
  const appUrl = Deno.env.get('APP_URL')

  if (!supabaseUrl || !serviceRoleKey || !resendApiKey || !emailFrom || !appUrl) {
    return jsonResponse({ error: 'Rezervace teď není možné odeslat. Zkuste to prosím později.' }, 503)
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return jsonResponse({ error: 'Neplatná data požadavku.' }, 400)
  }

  if (!payload || typeof payload !== 'object') {
    return jsonResponse({ error: 'Neplatná data požadavku.' }, 400)
  }

  const { name, email, date, times, court } = payload as Record<string, unknown>
  const normalizedName = typeof name === 'string' ? name.trim() : ''
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
  const validDate = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
    && !Number.isNaN(Date.parse(`${date}T00:00:00Z`))
  const validTimes = Array.isArray(times)
    && times.length >= 1
    && times.length <= 8
    && times.every((time) => typeof time === 'string' && allowedTimes.has(time))
    && new Set(times).size === times.length
  const validCourt = Number.isInteger(court) && Number(court) >= 1 && Number(court) <= 6
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)

  if (normalizedName.length < 4 || normalizedName.length > 120 || !validEmail || !validDate || !validTimes || !validCourt) {
    return jsonResponse({ error: 'Zkontrolujte jméno, e-mail, datum, hřiště a vybrané časy.' }, 400)
  }

  const reservationDate = date as string
  const selectedTimes = times as string[]
  const selectedCourt = court as number
  const today = new Date().toISOString().slice(0, 10)
  if (reservationDate < today) {
    return jsonResponse({ error: 'Nelze vytvořit rezervaci v minulosti.' }, 400)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const clientIp = request.headers.get('cf-connecting-ip')
    ?? request.headers.get('x-forwarded-for')?.split(',')[0].trim()

  if (!clientIp) {
    return jsonResponse({ error: 'Požadavek se nepodařilo bezpečně ověřit.' }, 503)
  }

  for (const identifier of [`ip:${clientIp}`, `email:${normalizedEmail}`]) {
    const identifierHash = await hashToken(`${serviceRoleKey}:${identifier}`)
    const { data: allowed, error: rateLimitError } = await supabase.rpc('consume_reservation_rate_limit', {
      p_identifier_hash: identifierHash,
    })

    if (rateLimitError) {
      return jsonResponse({ error: 'Rezervaci teď není možné odeslat. Zkuste to prosím později.' }, 503)
    }

    if (!allowed) {
      return jsonResponse({ error: 'Bylo odesláno příliš mnoho požadavků. Zkuste to prosím za 15 minut.' }, 429)
    }
  }

  const cancellationToken = createToken()
  const cancellationTokenHash = await hashToken(cancellationToken)

  const { data: reservationId, error: createError } = await supabase.rpc('create_reservation', {
    p_customer_name: normalizedName,
    p_customer_email: normalizedEmail,
    p_reservation_date: reservationDate,
    p_court_id: selectedCourt,
    p_times: selectedTimes,
    p_cancellation_token_hash: cancellationTokenHash,
  })

  if (createError) {
    if (createError.code === '23505') {
      return jsonResponse({ error: 'Některý z vybraných časů už mezitím někdo rezervoval. Obnovte dostupnost a vyberte jiné.' }, 409)
    }
    return jsonResponse({ error: 'Rezervaci se nepodařilo uložit.' }, 500)
  }

  const cancelUrl = new URL('/cancel', appUrl)
  cancelUrl.searchParams.set('token', cancellationToken)
  const safeName = escapeHtml(normalizedName)
  const safeTimes = selectedTimes.map((time) => `<li>${escapeHtml(time)}</li>`).join('')

  let emailResponse: Response
  try {
    emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [normalizedEmail],
        subject: 'Potvrzení rezervace',
        html: `<p>Dobrý den, ${safeName}.</p><p>Vaše rezervace na ${reservationDate}, hřiště ${selectedCourt}, byla potvrzena pro tyto hodiny:</p><ul>${safeTimes}</ul><p>Pro zrušení rezervace použijte tento odkaz:</p><p><a href="${cancelUrl.toString()}">Spravovat rezervaci</a></p>`,
        text: `Dobrý den, ${normalizedName}. Vaše rezervace na ${reservationDate}, hřiště ${selectedCourt}, byla potvrzena pro hodiny: ${selectedTimes.join(', ')}. Zrušení: ${cancelUrl.toString()}`,
      }),
    })
  } catch {
    emailResponse = new Response(null, { status: 500 })
  }

  if (!emailResponse.ok) {
    await supabase.from('reservations')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', reservationId)
      .eq('status', 'confirmed')

    return jsonResponse({ error: 'Rezervaci se nepodařilo potvrdit e-mailem. Zkontrolujte údaje a zkuste to znovu.' }, 502)
  }

  return jsonResponse({ reservationId }, 201)
})
