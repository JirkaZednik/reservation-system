import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import AvailabilityCalendar from '../components/AvailabilityCalendar/AvailabilityCalendar'
import Input from '../components/Input/Input'
import Button from '../components/Button/Button'
import { reservationSchema, type ReservationForm } from '../schemas/reservationSchema'
import type { ReservationTime } from '../constants/reservation'
import { createReservation } from '../services/reservations'
import { useState } from 'react'
import { Link } from 'react-router-dom'

function Reservations() {
	const [submitError, setSubmitError] = useState('')
	const [cancellationToken, setCancellationToken] = useState<string | null>(null)
	const { register, handleSubmit, setValue, control, formState: { errors, isSubmitting } } = useForm<ReservationForm>({
		resolver: zodResolver(reservationSchema),
		defaultValues: {
			name: '',
			email: '',
			date: '',
			times: [],
			court: 0,
		},
	})

	// Keep the availability calendar synchronized with the form values.
	const selectedDate = useWatch({ control, name: 'date' })
	const selectedTimes = useWatch({ control, name: 'times' })
	const selectedCourt = useWatch({ control, name: 'court' })
	const dateRegistration = register('date')

	async function onSubmit(data: ReservationForm) {
		setSubmitError('')
		setCancellationToken(null)

		try {
			const result = await createReservation(data)
			setCancellationToken(result.cancellationToken ?? '')
		} catch (error) {
			setSubmitError(error instanceof Error ? error.message : 'Rezervaci se nepodařilo odeslat.')
		}
	}

	return (
		<section className="reservation-layout">
			<div className="reservation-left-panel">
				<h1>Nová rezervace</h1>
				<form className="reservation-form" onSubmit={handleSubmit(onSubmit)} noValidate>
					<Input {...register('name')} id="name" label="Jméno" type="text" placeholder="Jan Novák" error={errors.name?.message} />
					<Input {...register('email')} id="email" label="E-mail" type="email" placeholder="jan@example.com" autoComplete="email" error={errors.email?.message} />
					<Input {...dateRegistration} onChange={(event) => {
						dateRegistration.onChange(event)
						setValue('times', [])
						setValue('court', 0)
					}} id="date" label="Datum" type="date" error={errors.date?.message} />
					{errors.times && <small className="input-error">{errors.times.message}</small>}
					{errors.court && <small className="input-error">{errors.court.message}</small>}
					{submitError && <small className="input-error" role="alert">{submitError}</small>}
					{cancellationToken !== null && (
						<div className="reservation-success" role="status">
							<p>Rezervace je potvrzená.</p>
							{cancellationToken ? (
								<Link className="button button--secondary" to={`/cancel?token=${encodeURIComponent(cancellationToken)}`}>
									Spravovat / zrušit rezervaci
								</Link>
							) : (
								<p>Odkaz pro správu rezervace najdete v potvrzovacím e-mailu.</p>
							)}
						</div>
					)}
					<Button type="submit" disabled={isSubmitting}>Rezervovat termín</Button>
				</form>
			</div>
			<div className="reservation-right-panel">
				<AvailabilityCalendar
					selectedDate={selectedDate}
					selectedTimes={selectedTimes}
					selectedCourt={selectedCourt}
					onSlotSelect={(times: ReservationTime[], court) => {
						setValue('times', times, { shouldDirty: true, shouldValidate: true })
						setValue('court', court, { shouldDirty: true, shouldValidate: true })
					}}
				/>
			</div>
		</section>
	)
}

export default Reservations
