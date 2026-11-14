import { SUNSET_API, TIMEZONE, type DayOffset } from '../config.ts'
import { parseOpenMeteoLocal } from './time.ts'

export class SunsetFetchError extends Error {}

interface OpenMeteoResponse {
  daily?: { sunset?: string[] }
}

/** Open-Meteo에서 해당 좌표의 오늘(또는 내일) 일몰 시각을 가져와 "자정부터 분"으로 돌려준다. */
export async function fetchSunsetMinutes(
  latitude: number,
  longitude: number,
  day: DayOffset,
  outer?: AbortSignal,
): Promise<number> {
  // 내일은 예보 이틀치를 받아 두 번째 값을 쓴다.
  const index = day === 'tomorrow' ? 1 : 0
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily: 'sunset',
    timezone: TIMEZONE,
    forecast_days: String(index + 1),
  })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SUNSET_API.timeoutMs)
  const onOuterAbort = () => controller.abort()
  outer?.addEventListener('abort', onOuterAbort)

  try {
    const response = await fetch(`${SUNSET_API.baseUrl}?${params}`, { signal: controller.signal })
    if (!response.ok) throw new SunsetFetchError(`Open-Meteo 응답 오류 (${response.status})`)

    const data = (await response.json()) as OpenMeteoResponse
    const iso = data.daily?.sunset?.[index]
    const minutes = iso ? parseOpenMeteoLocal(iso) : null
    if (minutes === null) throw new SunsetFetchError('일몰 시각을 응답에서 찾지 못했어요')
    return minutes
  } catch (error) {
    if (error instanceof SunsetFetchError) throw error
    throw new SunsetFetchError(error instanceof Error ? error.message : '알 수 없는 오류')
  } finally {
    clearTimeout(timer)
    outer?.removeEventListener('abort', onOuterAbort)
  }
}
