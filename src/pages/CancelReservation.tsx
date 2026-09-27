import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Button from '../components/Button/Button'
import { supabase } from '../lib/supabase'

function CancelReservation() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'idle' | 'loading' | 'cancelled' | 'error'>('idle')
  const token = searchParams.get('token')

  async function cancelReservation() {
    if (!supabase || !token) {
      setStatus('error')
      return
    }

    setStatus('loading')
    const { error } = await supabase.functions.invoke('cancel-reservation', {
      body: { token },
    })
    setStatus(error ? 'error' : 'cancelled')
  }

  return (
    <section className="cancel-reservation-page">
      <h1>Správa rezervace</h1>
      {status === 'cancelled' ? (
        <p>Rezervace byla zrušena.</p>
      ) : status === 'error' ? (
        <p role="alert">Rezervaci se nepodařilo zrušit. Odkaz může být neplatný nebo již použitý.</p>
      ) : (
        <>
          <p>Opravdu chcete zrušit tuto rezervaci?</p>
          <Button type="button" disabled={!token || status === 'loading'} onClick={cancelReservation}>
            {status === 'loading' ? 'Ruším rezervaci…' : 'Zrušit rezervaci'}
          </Button>
        </>
      )}
    </section>
  )
}

export default CancelReservation
