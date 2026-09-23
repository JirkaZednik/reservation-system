import type { InputHTMLAttributes } from 'react'
import './Input.scss'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
	label: string
}

function Input({ id, label, ...props }: InputProps) {
	return (
		<label className="input-field" htmlFor={id}>
			<span>{label}</span>
			<input id={id} {...props} />
		</label>
	)
}

export default Input
