import { API_CONFIG } from '../constants';
import { isoToMin } from './time';

export interface SunTimes {
  sunriseMin: number;
  sunsetMin: number;
}

/** Open-Meteo로 해당 좌표·날짜의 일출/일몰 시각 조회 (API 키 불필요) */
export async function fetchSunTimes(lat: number, lon: number, dateIso: string): Promise<SunTimes> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: 'sunrise,sunset',
    timezone: API_CONFIG.TIMEZONE,
    start_date: dateIso,
    end_date: dateIso,
  });
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);
  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}?${params.toString()}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const sunset: string | undefined = json?.daily?.sunset?.[0];
    const sunrise: string | undefined = json?.daily?.sunrise?.[0];
    if (!sunset || !sunrise) throw new Error('일몰 데이터 없음');
    return { sunriseMin: isoToMin(sunrise), sunsetMin: isoToMin(sunset) };
  } finally {
    window.clearTimeout(timer);
  }
}
