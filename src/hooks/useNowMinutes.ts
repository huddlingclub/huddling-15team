import { useEffect, useState } from 'react'
import { seoulMinutes } from '../lib/time.ts'

const TICK_MS = 15_000

/** 지금 시각(한국 시간, 자정부터 분). 출발 시각 표시가 멈춰 있지 않도록 주기적으로 갱신한다. */
export function useNowMinutes(): number {
  const [minutes, setMinutes] = useState(() => seoulMinutes(new Date()))

  useEffect(() => {
    const id = setInterval(() => setMinutes(seoulMinutes(new Date())), TICK_MS)
    return () => clearInterval(id)
  }, [])

  return minutes
}
