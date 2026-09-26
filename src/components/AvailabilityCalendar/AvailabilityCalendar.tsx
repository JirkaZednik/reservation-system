import { useState } from 'react'
import { COURTS, RESERVATION_TIME_SLOTS, type ReservationTime } from '../../constants/reservation'
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

const storageKey = 'reservation-system:occupied-slots'

function getInitialOccupiedSlots(): OccupiedSlot[] {
  const storedSlots = localStorage.getItem(storageKey)
  const existingSlots = storedSlots ? JSON.parse(storedSlots) as OccupiedSlot[] : []
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const demoSlots: OccupiedSlot[] = [
    { date: today, time: '10:00', court: 2 },
    { date: today, time: '13:00', court: 4 },
    { date: today, time: '18:00', court: 1 },
  ]
  const initialSlots = [...existingSlots]

  for (const demoSlot of demoSlots) {
    const alreadyStored = initialSlots.some(
      (slot) => slot.date === demoSlot.date && slot.time === demoSlot.time && slot.court === demoSlot.court,
    )

    if (!alreadyStored) {
      initialSlots.push(demoSlot)
    }
  }

  if (initialSlots.length !== existingSlots.length) {
    localStorage.setItem(storageKey, JSON.stringify(initialSlots))
  }

  return initialSlots
}

function AvailabilityCalendar({
  selectedDate,
  selectedTimes,
  selectedCourt,
  onSlotSelect,
}: AvailabilityCalendarProps) {
  const [occupiedSlots] = useState(getInitialOccupiedSlots)

  function isOccupied(time: string, court: number) {
    return occupiedSlots.some( //some hledá, zda v poli existuje alespoň jeden odpovídající objekt.
      (slot) => slot.date === selectedDate && slot.time === time && slot.court === court,
    )
  }

  function handleSlotSelect(time: ReservationTime, court: number) {
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
                    disabled={occupied}
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
    </div>
  )
}

export default AvailabilityCalendar
