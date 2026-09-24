import type { ReactNode } from 'react'
/*
	NavLink:
	- Speciální odkaz pro routing v React Routeru. (místo <a>)
	- Pracuje s aktuální URL
	- Přidá automaticky class active, když je stránka aktivní
	- Zajistí SPA navigaci bez reloadu
 */
import { NavLink } from 'react-router-dom'
import './Layout.scss'

type LayoutProps = {
	children: ReactNode
}

//Children v Layout je to, co je mezi otevírací a zavírací značkou <Layout> v App.tsx
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
