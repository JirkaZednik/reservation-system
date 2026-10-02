import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import './Layout.scss'

type LayoutProps = {
	children: ReactNode
}

function Layout({ children }: LayoutProps) {
	return (
		<>
			<header className="header-layout">
				<NavLink className="header-brand" to="/">
					Rezervační systém
				</NavLink>
				<nav aria-label="Hlavní navigace">
					<NavLink to="/" end>Domů</NavLink>
					<NavLink to="/reservations">Rezervace</NavLink>
					<NavLink to="/admin">Administrace</NavLink>
				</nav>
			</header>
			<main className="container">
				<div className="content-layout">{children}</div>
			</main>
		</>
	)
}

export default Layout
