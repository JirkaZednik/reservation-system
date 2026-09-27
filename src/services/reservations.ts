import type { ReservationForm } from '../schemas/reservationSchema'
import { supabase } from '../lib/supabase'

export async function createReservation(reservation: ReservationForm) {
  if (!supabase) {
    throw new Error('Supabase není nakonfigurovaný. Doplňte lokální proměnné prostředí.')
  }

  const { data, error } = await supabase.functions.invoke('create-reservation', {
    body: reservation,
  })

  if (error) {
    if (error.context instanceof Response) {
      const responseBody = await error.context.json().catch(() => null) as { error?: string } | null
      throw new Error(responseBody?.error ?? 'Rezervaci se nepodařilo odeslat.')
    }

    throw new Error('Rezervaci se nepodařilo odeslat. Zkontrolujte připojení a zkuste to znovu.')
  }

  return data as { reservationId: string }
}
