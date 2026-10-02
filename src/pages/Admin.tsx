import { useEffect, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import Button from '../components/Button/Button'
import { supabase } from '../lib/supabase'
import './Admin.scss'

type AdminReservation = {
	id: string
	customer_name: string
	customer_email: string
	status: 'confirmed' | 'cancelled'
	created_at: string
	reservation_slots: {
		reservation_date: string
		start_time: string
		court_id: number
	}[]
}

function Admin() {
	const [session, setSession] = useState<Session | null>(null)
	const [checkingSession, setCheckingSession] = useState(true)
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [authError, setAuthError] = useState('')
	const [reservations, setReservations] = useState<AdminReservation[]>([])
	const [loadingReservations, setLoadingReservations] = useState(true)
	const [reservationsError, setReservationsError] = useState('')

	useEffect(() => {
		if (!supabase) return

		let active = true
		void supabase.auth.getSession().then(({ data }) => {
			if (active) {
				setSession(data.session)
				setCheckingSession(false)
			}
		})

		const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
			setSession(nextSession)
			setCheckingSession(false)
		})

		return () => {
			active = false
			subscription.unsubscribe()
		}
	}, [])

	useEffect(() => {
		// This UI check is backed by database RLS policies; it is not the security boundary.
		if (!supabase || session?.user.app_metadata.role !== 'admin') {
			return
		}

		let active = true
		void supabase
			.from('reservations')
			.select('id, customer_name, customer_email, status, created_at, reservation_slots(reservation_date, start_time, court_id)')
			.order('created_at', { ascending: false })
			.then(({ data, error }) => {
				if (!active) return
				if (error) {
					setReservationsError('Rezervace se nepodařilo načíst. Zkontrolujte oprávnění správce.')
				} else {
					setReservations(data as unknown as AdminReservation[])
				}
				setLoadingReservations(false)
			})

		return () => {
			active = false
		}
	}, [session])

	async function handleSignIn(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		if (!supabase) {
			setAuthError('Supabase není nakonfigurovaný.')
			return
		}

		setAuthError('')
		setReservationsError('')
		const { data, error } = await supabase.auth.signInWithPassword({ email, password })
		if (error) {
			setAuthError('Přihlášení se nezdařilo. Zkontrolujte e-mail a heslo.')
			return
		}

		if (data.user.app_metadata.role !== 'admin') {
			await supabase.auth.signOut()
			setAuthError('Tento účet nemá oprávnění správce.')
		}
	}

	async function cancelReservation(reservationId: string) {
		if (!supabase) return

		const { error } = await supabase
			.from('reservations')
			.update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
			.eq('id', reservationId)

		if (error) {
			setReservationsError('Rezervaci se nepodařilo zrušit.')
			return
		}

		setReservations((current) => current.map((reservation) => reservation.id === reservationId
			? { ...reservation, status: 'cancelled', reservation_slots: [] }
			: reservation))
	}

	async function signOut() {
		await supabase?.auth.signOut()
		setReservations([])
	}

	if (!supabase) {
		return <section className="admin-page"><h1>Administrace</h1><p>Nejdřív nastavte připojení k Supabase.</p></section>
	}

	if (checkingSession) {
		return <section className="admin-page"><h1>Administrace</h1><p role="status">Ověřuji přihlášení…</p></section>
	}

	if (!session) {
		return (
			<section className="admin-page admin-login">
				<h1>Administrace</h1>
				<form className="reservation-form" onSubmit={handleSignIn}>
					<label className="input-field" htmlFor="admin-email">
						<span>E-mail správce</span>
						<input id="admin-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
					</label>
					<label className="input-field" htmlFor="admin-password">
						<span>Heslo</span>
						<input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
					</label>
					{authError && <p className="admin-error" role="alert">{authError}</p>}
					<Button type="submit">Přihlásit se</Button>
				</form>
			</section>
		)
	}

	if (session.user.app_metadata.role !== 'admin') {
		return <section className="admin-page"><h1>Administrace</h1><p role="alert">Tento účet nemá oprávnění správce.</p></section>
	}

	return (
		<section className="admin-page">
			<div className="admin-heading">
				<div><h1>Administrace</h1><p>Rezervace a stav hřišť</p></div>
				<Button type="button" variant="secondary" onClick={signOut}>Odhlásit se</Button>
			</div>
			{reservationsError && <p className="admin-error" role="alert">{reservationsError}</p>}
			{loadingReservations ? <p role="status">Načítám rezervace…</p> : reservations.length === 0 ? (
				<p>Zatím tu nejsou žádné rezervace.</p>
			) : (
				<div className="admin-table-scroll">
					<table className="admin-table">
						<thead><tr><th>Zákazník</th><th>Termíny</th><th>Stav</th><th>Akce</th></tr></thead>
						<tbody>
							{reservations.map((reservation) => (
								<tr key={reservation.id}>
									<td><strong>{reservation.customer_name}</strong><br />{reservation.customer_email}</td>
									<td>{reservation.reservation_slots.map((slot) => `${slot.reservation_date} ${slot.start_time.slice(0, 5)} · hřiště ${slot.court_id}`).join(', ') || '—'}</td>
									<td>{reservation.status === 'confirmed' ? 'Potvrzená' : 'Zrušená'}</td>
									<td>{reservation.status === 'confirmed' && <Button type="button" variant="secondary" onClick={() => void cancelReservation(reservation.id)}>Zrušit</Button>}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</section>
	)
}

export default Admin
