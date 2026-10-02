import './App.scss'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout/Layout'

// Split route bundles so less-used pages do not delay the initial load.
const Home = lazy(() => import('./pages/Home'))
const Admin = lazy(() => import('./pages/Admin'))
const Reservations = lazy(() => import('./pages/Reservations'))
const CancelReservation = lazy(() => import('./pages/CancelReservation'))

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<p>Načítám stránku...</p>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/reservations" element={<Reservations />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/cancel" element={<CancelReservation />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  )
}

export default App
