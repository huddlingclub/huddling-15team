import type { CSSProperties } from 'react'
import { GAUGE_FULL_MARGIN_MIN, type Verdict } from '../config.ts'
import { marginPercent } from '../lib/judge.ts'
import { formatClock } from '../lib/time.ts'
import lavenderSkin from '../assets/sprites/ui-skin-lavender.png'

/** 판정별 채움 색과 위쪽 하이라이트(피그마 S2-A/B/C · Animated gauge, Pixel bevel) */
const FILL: Record<Verdict, { body: string; bevel: string }> = {
  green: { body: 'bg-pix-gauge-green', bevel: 'bg-pix-gauge-green-bevel' },
  yellow: { body: 'bg-pix-gauge-yellow', bevel: 'bg-pix-gauge-yellow-bevel' },
  red: { body: 'bg-pix-gauge-red', bevel: 'bg-pix-gauge-red-bevel' },
}

/** 피그마 "원본 UI · lavender" 9-slice 스킨. 모서리 8px을 늘리지 않고 가운데만 채운다. */
const SKIN: CSSProperties = {
  borderStyle: 'solid',
  borderWidth: 8,
  borderImage: `url(${lavenderSkin}) 8 fill / 8px stretch`,
}

/** 25px 간격, 3px 폭의 흰 눈금으로 막대를 칸처럼 나눈다. */
const TICKS: CSSProperties = {
  backgroundImage: 'repeating-linear-gradient(to right, transparent 0 22px, var(--color-pix-gauge-tick) 22px 25px)',
}

interface Props {
  /** 입산 시각(자정부터 분) */
  departMin: number
  sunsetMin: number
  /** 일몰 − 예상 하산(분). 음수면 일몰 뒤에 하산 */
  marginMin: number
  verdict: Verdict
  className?: string
  style?: CSSProperties
}

/**
 * 일몰까지 남은 시간 (피그마 디자인 시스템 · Timeline).
 * 막대는 "하산 후 일몰까지 남는 여유"를 나타내서, 판정이 나쁠수록 짧아진다.
 */
export function TimelineGauge({ departMin, sunsetMin, marginMin, verdict, className = '', style }: Props) {
  const percent = marginPercent(marginMin)
  const margin = Math.max(0, Math.round(marginMin))

  return (
    <section style={{ ...SKIN, ...style }} className={`flex flex-col gap-2 p-1 font-pix-ui ${className}`}>
      <h2 className="text-xs leading-[1.35] font-bold text-pix-text-strong">일몰까지 남은 시간</h2>

      <div
        role="meter"
        aria-label="하산 후 일몰까지 여유"
        aria-valuemin={0}
        aria-valuemax={GAUGE_FULL_MARGIN_MIN}
        aria-valuenow={Math.min(margin, GAUGE_FULL_MARGIN_MIN)}
        aria-valuetext={marginMin < 0 ? '일몰 뒤에 하산' : `여유 ${margin}분`}
        className="relative h-3.5 w-full overflow-hidden rounded-[3px] border-2 border-pix-gauge-border bg-pix-gauge-track"
      >
        <div className="absolute inset-0 origin-left animate-pix-grow" style={{ width: `${percent}%` }}>
          <div className={`absolute inset-0 ${FILL[verdict].body}`} />
          <div className={`absolute inset-x-0 top-0 h-[3px] ${FILL[verdict].bevel}`} />
        </div>
        <div aria-hidden="true" className="absolute inset-0" style={TICKS} />
      </div>

      <div className="flex items-start justify-between text-[10px] leading-[1.35]">
        <p className="font-medium text-pix-text-muted">입산 {formatClock(departMin)}</p>
        <p className="font-bold text-pix-text-strong">일몰 {formatClock(sunsetMin)}</p>
      </div>
    </section>
  )
}
