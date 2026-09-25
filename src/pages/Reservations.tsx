import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import AvailabilityCalendar from '../components/AvailabilityCalendar/AvailabilityCalendar'
import Input from '../components/Input/Input'
import Button from '../components/Button/Button'
import { reservationSchema, type ReservationForm } from '../schemas/reservationSchema'

function Reservations() {
	const { register, handleSubmit, setValue, control, formState: { errors, isSubmitting } } = useForm<ReservationForm>({
		resolver: zodResolver(reservationSchema),
		defaultValues: {
			name: '',
			email: '',
			date: '',
			time: '',
			court: 0,
		},
	})

	const selectedDate = useWatch({ control, name: 'date' }) //useWatch sleduje konkrétní pole formuláře/kalendáře a vrací jeho aktuální hodnotu v reálném čase (když se změní datum/čas/hřiště React znovu vykreslí komponentu)
	const selectedTime = useWatch({ control, name: 'time' })
	const selectedCourt = useWatch({ control, name: 'court' })

	function onSubmit(data: ReservationForm) {
		console.log('Nová rezervace:', data)
	}

	return (
		<section className="reservation-layout">
			<div className="reservation-left-panel">
				<h1>Nová rezervace</h1>
				<form className="reservation-form" onSubmit={handleSubmit(onSubmit)} noValidate>
					<Input {...register('name')} id="name" label="Jméno" type="text" placeholder="Jan Novák" error={errors.name?.message} />
					<Input {...register('email')} id="email" label="E-mail" type="email" placeholder="jan@example.com" autoComplete="email" error={errors.email?.message} />
					<Input {...register('date')} id="date" label="Datum" type="date" error={errors.date?.message} />
					{errors.time && <small className="input-error">{errors.time.message}</small>}
					{errors.court && <small className="input-error">{errors.court.message}</small>}
					<Button type="submit" disabled={isSubmitting}>Rezervovat termín</Button>
				</form>
			</div>
			<div className="reservation-right-panel">
				<AvailabilityCalendar
					selectedDate={selectedDate}
					selectedTime={selectedTime}
					selectedCourt={selectedCourt}
					onSlotSelect={(time, court) => {
						setValue('time', time, { shouldDirty: true, shouldValidate: true })
						setValue('court', court, { shouldDirty: true, shouldValidate: true })
					}}
				/>
			</div>
		</section>
	)
}

export default Reservations
