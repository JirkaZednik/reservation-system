import type { ButtonHTMLAttributes } from 'react' //Typ Reactu, který obsahuje všechny standardní HTML atributy pro button (disabled, onclick,..)
import './Button.scss'

/*
 Definice vstupních vlastností.
 Type = definice typu dat. 
 ButtonProps = objekt vlastností.
 ButtonHTMLAttributes = Typ se všemi atributy pro tlačítko.
 HTMLButtonElement = DOM typ HTML elementu.
 & = spojení dvou typů dohromady (AND)
 
 ButtonHTMLAttributes přidá všechny standardní atributy buttonu a potom se definují vlastní 
 vlastnosti jako "variant", který je nepovinný(?) a může být "primary" nebo "secondary".
 */
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: 'primary' | 'secondary'
}

/*
 Definice komponenty Button.
 props = Vstupní vlastnosti komponenty (objekt s vlastnostmi)
 Pokud uživatel variant neuvede, použije se výchozí hodnota 'primary'
 Pokud className nebude zadáno, nastaví se prázdný string.
 Zbytek všech ostatních atributů se zachytí do proměnné props a předá se dál do <button>.

 ": ButtonProps" znamená - Tento parametr, tedy vstupy této funkce, musí odpovídat 
 typu ButtonProps (TypeScript kontroluje, že komponenta dostává správné data)
 */
function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
	return <button className={`button button--${variant} ${className}`} {...props} />
}

export default Button
