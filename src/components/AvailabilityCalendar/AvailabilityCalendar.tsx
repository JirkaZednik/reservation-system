import { useState } from 'react'
import './AvailabilityCalendar.scss'

type AvailabilityCalendarProps = {
  selectedDate: string
  selectedTime: string
  selectedCourt: number
  onSlotSelect: (time: string, court: number) => void
}

type OccupiedSlot = {
  date: string
  time: string
  court: number
}

const timeSlots = Array.from({ length: 13 }, (_, index) => `${String(index + 9).padStart(2, '0')}:00`)
const courts = [1, 2, 3, 4, 5, 6]
const storageKey = 'reservation-system:occupied-slots'

function getInitialOccupiedSlots(): OccupiedSlot[] {
  const storedSlots = localStorage.getItem(storageKey)

  if (storedSlots) {
    return JSON.parse(storedSlots) as OccupiedSlot[]
  }

  const today = new Date().toISOString().slice(0, 10)
  const initialSlots = [
    { date: today, time: '10:00', court: 2 },
    { date: today, time: '13:00', court: 4 },
    { date: today, time: '18:00', court: 1 },
  ]

  localStorage.setItem(storageKey, JSON.stringify(initialSlots))
  return initialSlots
}

function AvailabilityCalendar({
  selectedDate,
  selectedTime,
  selectedCourt,
  onSlotSelect,
}: AvailabilityCalendarProps) {
  const [occupiedSlots] = useState(getInitialOccupiedSlots)

  function isOccupied(time: string, court: number) {
    return occupiedSlots.some(
      (slot) => slot.date === selectedDate && slot.time === time && slot.court === court,
    )
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
      <div className="availability-scroll">
        <div className="availability-grid">
          <div className="availability-corner" aria-hidden="true" />
          {timeSlots.map((time) => <div className="availability-time" key={time}>{time}</div>)}
          {courts.map((court) => (
            <div className="availability-row" key={court}>
              <div className="availability-court">Hřiště {court}</div>
              {timeSlots.map((time) => {
                const occupied = isOccupied(time, court)
                const selected = selectedTime === time && selectedCourt === court

                return (
                  <button
                    className={`availability-slot${selected ? ' selected' : ''}`}
                    disabled={occupied}
                    key={`${time}-${court}`}
                    onClick={() => onSlotSelect(time, court)}
                    type="button"
                    aria-label={`${time}, hřiště ${court}${occupied ? ', obsazeno' : ''}`}
                  >
                    {occupied ? 'Obsazeno' : selected ? 'Vybráno' : 'Volné'}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AvailabilityCalendar
