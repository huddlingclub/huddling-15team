import type { Verdict } from '../config.ts'
import { formatClock, isNextDay } from '../lib/time.ts'

const FILL: Record<Verdict, string> = {
  green: 'bg-pix-green',
  yellow: 'bg-pix-yellow',
  red: 'bg-pix-red',
}

interface Props {
  nowMin: number
  finishMin: number
  sunsetMin: number
  verdict: Verdict
}

const clampPercent = (value: number) => Math.min(100, Math.max(0, value))

/**
 * 지금 → (일몰 또는 예상 하산 중 늦은 쪽) 구간을 한 줄로 보여준다.
 * 색칠된 구간 = 산에서 보내는 시간, 노란 눈금 = 일몰, 일몰 뒤로 넘어간 구간은 어두운 색으로 표시.
 */
export function TimelineGauge({ nowMin, finishMin, sunsetMin, verdict }: Props) {
  const end = Math.max(sunsetMin, finishMin)
  const span = Math.max(end - nowMin, 1)
  const toPercent = (minutes: number) => clampPercent(((minutes - nowMin) / span) * 100)

  const finishAt = toPercent(finishMin)
  const sunsetAt = toPercent(sunsetMin)
  const overflow = finishMin > sunsetMin

  const safeWidth = overflow ? sunsetAt : finishAt
  const overflowWidth = overflow ? finishAt - sunsetAt : 0

  return (
    <div>
      <div className="relative h-10 border-4 border-pix-ink bg-pix-lilac">
        <div className="absolute inset-0 origin-left animate-pix-grow">
          <div className={`absolute inset-y-0 left-0 ${FILL[verdict]}`} style={{ width: `${safeWidth}%` }} />
          {overflow && (
            <div
              className="absolute inset-y-0 bg-pix-night"
              style={{ left: `${sunsetAt}%`, width: `${overflowWidth}%` }}
            />
          )}
        </div>
        <span
          aria-hidden="true"
          className="absolute inset-y-0 -ml-1 w-1 bg-pix-sun outline-2 outline-pix-ink"
          style={{ left: `${sunsetAt}%` }}
        />
      </div>

      {overflow && <p className="mt-2 text-pix-body">어두운 구간은 일몰 이후예요.</p>}

      <dl className="mt-3 grid grid-cols-3 gap-2 text-pix-body">
        <div>
          <dt className="flex items-center gap-1">
            <span aria-hidden="true" className="size-3 border-2 border-pix-ink bg-pix-lilac" />
            지금
          </dt>
          <dd className="font-pix-display text-pix-heading font-bold">{formatClock(nowMin)}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1">
            <span aria-hidden="true" className={`size-3 border-2 border-pix-ink ${FILL[verdict]}`} />
            예상 하산
          </dt>
          <dd className="font-pix-display text-pix-heading font-bold">
            {formatClock(finishMin)}
            {isNextDay(finishMin) && <span className="block text-pix-caption">다음 날</span>}
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-1">
            <span aria-hidden="true" className="size-3 border-2 border-pix-ink bg-pix-sun" />
            일몰
          </dt>
          <dd className="font-pix-display text-pix-heading font-bold">{formatClock(sunsetMin)}</dd>
        </div>
      </dl>
    </div>
  )
}
