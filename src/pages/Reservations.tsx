import Input from '../components/Input/Input'
import Button from '../components/Button/Button'

function Reservations() {
	return (
		<section>
			<h1>Nová rezervace</h1>
			<form className="reservation-form">
				<Input id="name" label="Jméno" type="text" placeholder="Jan Novák" required />
				<Input id="email" label="E-mail" type="email" placeholder="jan@example.com" required autoComplete="email" />
				<Input id="date" label="Datum" type="date" required />
				<Button type="submit">Rezervovat termín</Button>
			</form>
		</section>
	)
}

export default Reservations
