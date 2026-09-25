import type { InputHTMLAttributes } from 'react'
import './Input.scss'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
	label: string
	error?: string
}

function Input({ id, label, error, ...props }: InputProps) {
	return (
		<label className="input-field" htmlFor={id}>
			<span>{label}</span>
			<input id={id} aria-invalid={Boolean(error)} {...props} />
			{error && <small className="input-error">{error}</small>}
		</label>
	)
}

export default Input
