// Shared booking options used by the form and availability calendar.
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

export function getLocalDateString(date = new Date()) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')

	return `${year}-${month}-${day}`
}