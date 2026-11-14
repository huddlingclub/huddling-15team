import { TIMEZONE, type DayOffset } from '../config.ts'

export const MINUTES_PER_DAY = 1440

const clockFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

// en-CA 로케일은 YYYY-MM-DD 형태로 나온다.
const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** 한국 시간 기준 자정부터 지난 분. 사용자 기기의 시간대와 무관하게 계산한다. */
export function seoulMinutes(date: Date): number {
  const parts = clockFormatter.formatToParts(date)
  const hour = Number(parts.find((p) => p.type === 'hour')?.value)
  const minute = Number(parts.find((p) => p.type === 'minute')?.value)
  return hour * 60 + minute
}

/** 한국 시간 기준 날짜 키(YYYY-MM-DD). 일몰 캐시가 오늘 것인지 확인할 때 쓴다. */
export function seoulDateKey(date: Date): string {
  return dateFormatter.format(date)
}

/** 오늘 또는 내일의 한국 날짜 키. 한국은 summer time이 없어서 24시간을 더하면 정확히 내일이다. */
export function targetDateKey(day: DayOffset, now: Date = new Date()): string {
  const MS_PER_DAY = 24 * 60 * 60 * 1000
  return seoulDateKey(day === 'tomorrow' ? new Date(now.getTime() + MS_PER_DAY) : now)
}

/** "17:23" → 1043. 형식이 틀리면 null. */
export function parseClock(text: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(text.trim())
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour > 23 || minute > 59) return null
  return hour * 60 + minute
}

/** Open-Meteo의 "2026-11-14T17:20" 형태 현지 시각에서 시:분만 분으로 변환. */
export function parseOpenMeteoLocal(iso: string): number | null {
  const match = /T(\d{2}):(\d{2})/.exec(iso)
  return match ? parseClock(`${match[1]}:${match[2]}`) : null
}

export function isNextDay(minutes: number): boolean {
  return minutes >= MINUTES_PER_DAY
}

/** 분 → "HH:MM". 자정을 넘으면 다음 날 시각으로 접어서 표시한다. */
export function formatClock(minutes: number): string {
  const wrapped = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
  const hour = String(Math.floor(wrapped / 60)).padStart(2, '0')
  const minute = String(wrapped % 60).padStart(2, '0')
  return `${hour}:${minute}`
}

/** 분 → "1시간 15분". 부호는 붙이지 않는다(절댓값). */
export function formatDuration(minutes: number): string {
  const total = Math.abs(Math.round(minutes))
  const hour = Math.floor(total / 60)
  const minute = total % 60
  if (hour === 0) return `${minute}분`
  if (minute === 0) return `${hour}시간`
  return `${hour}시간 ${minute}분`
}
