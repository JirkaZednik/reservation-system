import type { ReactNode } from 'react'
import './Layout.scss'

type LayoutProps = {
	children: ReactNode
	currentPath: string
	onNavigate: (to: string) => void
}

function Layout({ children, currentPath, onNavigate }: LayoutProps) {
	function handleNavigation(event: React.MouseEvent<HTMLAnchorElement>, to: string) {
		event.preventDefault()
		onNavigate(to)
	}

	return (
		<>
			<header className="header-layout">
				<a className="header-brand" href="/" onClick={(event) => handleNavigation(event, '/')}>
					Rezervační systém
				</a>
				<nav aria-label="Hlavní navigace">
					<a className={currentPath === '/' ? 'active' : ''} href="/" onClick={(event) => handleNavigation(event, '/')}>Domů</a>
					<a className={currentPath === '/reservations' ? 'active' : ''} href="/reservations" onClick={(event) => handleNavigation(event, '/reservations')}>Rezervace</a>
					<a className={currentPath === '/admin' ? 'active' : ''} href="/admin" onClick={(event) => handleNavigation(event, '/admin')}>Administrace</a>
				</nav>
			</header>
			<main className="container">
				<div className="content-layout">{children}</div>
			</main>
		</>
	)
}

export default Layout
