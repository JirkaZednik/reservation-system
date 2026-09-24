import './App.scss'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout/Layout'

const Home = lazy(() => import('./pages/Home'))
const Admin = lazy(() => import('./pages/Admin'))
const Reservations = lazy(() => import('./pages/Reservations'))

function App() {
  return (
    <BrowserRouter>
      {/*
      Layout je komponenta, která obsahuje hlavičku a hlavní obsah stránky (společný rámec 
      stránky). Všechny ostatní komponenty (Home, Admin, Reservations) se vykreslí uvnitř 
      této komponenty jako children.
      */}
      <Layout>
        <Suspense fallback={<p>Načítám stránku...</p>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/reservations" element={<Reservations />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  )
}

export default App
