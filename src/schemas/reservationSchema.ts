import { z } from 'zod'
import { COURTS, RESERVATION_TIME_SLOTS } from '../constants/reservation'

export const reservationSchema = z.object({
  name: z.string().trim().min(4, 'Zadejte správné jméno.'),
  email: z.email('Zadejte platný e-mail.'),
  date: z.string().min(1, 'Vyberte datum.'),
  times: z.array(z.enum(RESERVATION_TIME_SLOTS))
    .min(1, 'Vyberte alespoň jeden čas.')
    .max(8, 'Lze vybrat nejvýše 8 hodin.')
    .refine((times) => new Set(times).size === times.length, 'Čas nesmí být vybrán vícekrát.'),
  court: z.number().refine((court) => COURTS.includes(court as typeof COURTS[number]), 'Vyberte hřiště.'),
})

export type ReservationForm = z.infer<typeof reservationSchema>
