import { StrictMode } from 'react' //Importuje režim Reactu, který upozorňuje na potenciální problémy v kódu.
import { createRoot } from 'react-dom/client' //Importuje funkci pro připojení React aplikace do HTML stránky.
import './index.scss'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render( 
  /* Najde root element a vykreslí do něj komponentu <App /> */
  <StrictMode>
    <App />
  </StrictMode>,
)
