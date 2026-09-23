//import heroImg from './assets/hero.png'

import { useEffect, useState } from 'react'
import './App.scss'
import Layout from './components/Layout/Layout'
//Import Pages
import Home from './pages/Home'
import Admin from './pages/Admin'
import Reservations from './pages/Reservations'


function App() {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handlePopState)

    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function navigate(to: string) {
    window.history.pushState({}, '', to)
    setPath(to)
  }

  const page = path === '/reservations'
    ? <Reservations />
    : path === '/admin'
      ? <Admin />
      : <Home />

  return <Layout currentPath={path} onNavigate={navigate}>{page}</Layout>
}

export default App
