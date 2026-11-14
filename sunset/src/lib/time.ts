import { DATE_RANGE_DAYS, RULES } from '../constants';
import type { Verdict } from '../constants';

const SEOUL = 'Asia/Seoul';
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** "HH:MM" → 자정 기준 분 */
export function hmToMin(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** 분 → "HH:MM" (24시간) */
export function minToHm(min: number): string {
  const v = ((Math.round(min) % 1440) + 1440) % 1440;
  const h = Math.floor(v / 60);
  const m = v % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** 분 → "오후 3:00" */
export function minToKorean(min: number): string {
  const v = ((Math.round(min) % 1440) + 1440) % 1440;
  const h = Math.floor(v / 60);
  const m = v % 60;
  const ampm = h < 12 ? '오전' : '오후';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${ampm} ${h12}:${String(m).padStart(2, '0')}`;
}

/** 분 → "1시간 22분" / "37분" / "-28분" */
export function formatDuration(min: number): string {
  const sign = min < 0 ? '-' : '';
  const abs = Math.abs(Math.round(min));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return `${sign}${m}분`;
  if (m === 0) return `${sign}${h}시간`;
  return `${sign}${h}시간 ${m}분`;
}

/** "2026-11-14T17:22" → 분 */
export function isoToMin(iso: string): number {
  const t = iso.split('T')[1] ?? '00:00';
  return hmToMin(t.slice(0, 5));
}

function seoulParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SEOUL,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return {
    y: get('year'),
    mo: get('month'),
    d: get('day'),
    h: Number(get('hour')) % 24,
    mi: Number(get('minute')),
  };
}

export interface DateOption {
  iso: string;
  label: string;
  /** "오늘 · 11/14 (토)" */
  full: string;
}

/** 오늘부터 DATE_RANGE_DAYS일치 날짜 옵션 (서울 기준) */
export function buildDateOptions(now = new Date()): DateOption[] {
  const out: DateOption[] = [];
  for (let i = 0; i < DATE_RANGE_DAYS; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    const p = seoulParts(d);
    const iso = `${p.y}-${p.mo}-${p.d}`;
    const wd = WEEKDAYS[new Date(`${iso}T12:00:00+09:00`).getUTCDay()];
    const md = `${Number(p.mo)}/${Number(p.d)} (${wd})`;
    const label = i === 0 ? '오늘' : i === 1 ? '내일' : md;
    out.push({ iso, label, full: `${label === md ? '' : `${label} · `}${md}` });
  }
  return out;
}

/** 현재 서울 시각을 10분 단위로 올림한 "HH:MM" */
export function nowRoundedHm(now = new Date()): string {
  const p = seoulParts(now);
  let min = p.h * 60 + p.mi;
  min = Math.ceil(min / 10) * 10;
  if (min >= 1440) min = 1430;
  return minToHm(min);
}

export interface JudgeInput {
  startMin: number;
  courseMin: number;
  sunsetMin: number;
}

export interface JudgeResult {
  startMin: number;
  courseMin: number;
  sunsetMin: number;
  descentMin: number;
  cutoffMin: number;
  marginMin: number;
  verdict: Verdict;
  alreadyDark: boolean;
}

/**
 * 예상 하산 = 입산 + 왕복 + 휴식
 * 권장 하산 마감 = 일몰 − 80분
 * 여유 시간 = 일몰 − 예상 하산
 * 🟢 ≥ 60분 / 🟡 ≥ 20분 / 🔴 < 20분 (출발이 일몰 이후면 무조건 🔴)
 */
export function judge({ startMin, courseMin, sunsetMin }: JudgeInput): JudgeResult {
  const descentMin = startMin + courseMin + RULES.REST_MIN;
  const cutoffMin = sunsetMin - RULES.SAFE_BUFFER_MIN;
  const marginMin = sunsetMin - descentMin;
  const alreadyDark = startMin >= sunsetMin;
  let verdict: Verdict;
  if (alreadyDark) verdict = 'red';
  else if (marginMin >= RULES.GREEN_MIN) verdict = 'green';
  else if (marginMin >= RULES.YELLOW_MIN) verdict = 'yellow';
  else verdict = 'red';
  return { startMin, courseMin, sunsetMin, descentMin, cutoffMin, marginMin, verdict, alreadyDark };
}
