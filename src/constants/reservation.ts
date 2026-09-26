//Sdílená pravidla rezervací: dostupné časy a hřiště.
export const RESERVATION_TIME_SLOTS = [
	'09:00',
	'10:00',
	'11:00',
	'12:00',
	'13:00',
	'14:00',
	'15:00',
	'16:00',
	'17:00',
	'18:00',
	'19:00',
	'20:00',
	'21:00',
] as const

export const COURTS = [1, 2, 3, 4, 5, 6] as const

export type ReservationTime = typeof RESERVATION_TIME_SLOTS[number]