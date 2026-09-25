import { z } from 'zod'

export const reservationSchema = z.object({
  name: z.string().trim().min(4, 'Zadejte správné jméno.'),
  email: z.email('Zadejte platný e-mail.'),
  date: z.string().min(1, 'Vyberte datum.'),
  time: z.string().min(1, 'Vyberte čas.'),
  court: z.number().int().min(1).max(6),
})

export type ReservationForm = z.infer<typeof reservationSchema>
