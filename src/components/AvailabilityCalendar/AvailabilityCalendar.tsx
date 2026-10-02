import { useEffect, useState } from 'react'
import { COURTS, RESERVATION_TIME_SLOTS, type ReservationTime } from '../../constants/reservation'
import { supabase } from '../../lib/supabase'
import './AvailabilityCalendar.scss'

type AvailabilityCalendarProps = {
  selectedDate: string
  selectedTimes: ReservationTime[]
  selectedCourt: number
  onSlotSelect: (times: ReservationTime[], court: number) => void
}

type OccupiedSlot = {
  date: string
  time: string
  court: number
}

function AvailabilityCalendar({
  selectedDate,
  selectedTimes,
  selectedCourt,
  onSlotSelect,
}: AvailabilityCalendarProps) {
  const [occupiedSlots, setOccupiedSlots] = useState<OccupiedSlot[]>([])
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availabilityError, setAvailabilityError] = useState(false)

  useEffect(() => {
    const supabaseClient = supabase
    if (!selectedDate) {
      return
    }

    // Ignore stale responses if the selected date changes before the request finishes.
    let ignoreResult = false

    async function loadOccupiedSlots() {
      if (!supabaseClient) return

      setAvailabilityError(false)
      setAvailabilityLoading(true)

      const { data, error } = await supabaseClient.rpc('get_occupied_slots', { p_date: selectedDate })

      if (!ignoreResult) {
        if (error) {
          setAvailabilityError(true)
          setOccupiedSlots([])
        } else {
          setOccupiedSlots((data ?? []).map((slot: { court_id: number; start_time: string }) => ({
            date: selectedDate,
            time: slot.start_time,
            court: slot.court_id,
          })))
        }

        setAvailabilityLoading(false)
      }
    }

    void loadOccupiedSlots()

    return () => {
      ignoreResult = true
    }
  }, [selectedDate])

  function isOccupied(time: string, court: number) {
    return occupiedSlots.some(
      (slot) => slot.date === selectedDate && slot.time === time && slot.court === court,
    )
  }

  function handleSlotSelect(time: ReservationTime, court: number) {
    // Keep a reservation on one court and allow at most eight hourly slots.
    if (selectedCourt !== court) {
      onSlotSelect([time], court)
      return
    }

    if (selectedTimes.includes(time)) {
      onSlotSelect(selectedTimes.filter((selectedTime) => selectedTime !== time), court)
      return
    }

    if (selectedTimes.length < 8) {
      const times = [...selectedTimes, time].sort(
        (first, second) => RESERVATION_TIME_SLOTS.indexOf(first)
          - RESERVATION_TIME_SLOTS.indexOf(second),
      )
      onSlotSelect(times, court)
    }
  }

  if (!selectedDate) {
    return <p className="availability-empty">Nejdříve vyberte datum.</p>
  }

  return (
    <div className="availability-calendar" aria-label="Dostupnost hřišť">
      <div className="availability-header">
        <h2>Dostupnost hřišť</h2>
        <p>{selectedDate}</p>
      </div>
      {!supabase ? (
        <p className="availability-error" role="alert">Kalendář není dostupný, protože chybí konfigurace Supabase.</p>
      ) : (
        <>
          {availabilityLoading && <p role="status">Načítám dostupnost…</p>}
          {availabilityError && <p className="availability-error" role="alert">Dostupnost se nepodařilo načíst. Zkuste změnit datum nebo stránku obnovit.</p>}
          <div className="availability-scroll">
            <div className="availability-grid">
              <div className="availability-corner" aria-hidden="true" />
              {RESERVATION_TIME_SLOTS.map((time) => <div className="availability-time" key={time}>{time}</div>)}
              {COURTS.map((court) => (
                <div className="availability-row" key={court}>
                  <div className="availability-court">Hřiště {court}</div>
                  {RESERVATION_TIME_SLOTS.map((time) => {
                    const occupied = isOccupied(time, court)
                    const selected = selectedCourt === court && selectedTimes.includes(time)

                    return (
                      <button
                        className={`availability-slot${selected ? ' selected' : ''}`}
                        disabled={occupied || availabilityLoading || availabilityError}
                        key={`${time}-${court}`}
                        onClick={() => handleSlotSelect(time, court)}
                        type="button"
                        aria-label={`${time}, hřiště ${court}${occupied ? ', obsazeno' : selected ? ', vybráno' : ', volné'}${!selected && selectedTimes.length >= 8 ? ', dosažen limit 8 hodin' : ''}`}
                      >
                        {occupied ? 'Obsazeno' : selected ? 'Vybráno' : 'Volné'}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AvailabilityCalendar
