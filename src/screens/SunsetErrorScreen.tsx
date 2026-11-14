import { useState, type FormEvent } from 'react'
import { Penguin } from '../components/Penguin.tsx'
import { PixelButton } from '../components/PixelButton.tsx'
import { PixelCard } from '../components/PixelCard.tsx'
import { SpeechBubble } from '../components/SpeechBubble.tsx'
import { TitlePlate } from '../components/TitlePlate.tsx'
import { useScreenFocus } from '../hooks/useScreenFocus.ts'
import { MANUAL_SUNSET_RANGE_MIN } from '../config.ts'
import { formatClock, isPlausibleSunset, parseClock } from '../lib/time.ts'

interface Props {
  mountainName: string
  /** "오늘" 또는 "내일" */
  dayLabel: string
  onRetry: () => void
  onManual: (sunsetMin: number) => void
  onBack: () => void
}

/** Open-Meteo 호출이 실패했을 때: 오류 안내 + 다시 시도 + 일몰 시각 직접 입력 */
export function SunsetErrorScreen({ mountainName, dayLabel, onRetry, onManual, onBack }: Props) {
  const headingRef = useScreenFocus<HTMLHeadingElement>()
  const [value, setValue] = useState('')
  const parsed = parseClock(value)
  const outOfRange = parsed !== null && !isPlausibleSunset(parsed)
  const valid = parsed !== null && !outOfRange

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (valid) onManual(parsed)
  }

  return (
    <div className="flex flex-col gap-8">
      <TitlePlate ref={headingRef}>일몰 시각을 못 가져왔어!</TitlePlate>

      <div className="flex flex-col items-center gap-5">
        <SpeechBubble>네트워크가 불안정한 것 같아. 다시 시도하거나 일몰 시각을 직접 알려줘!</SpeechBubble>
        <Penguin mood="worried" size="md" />
      </div>

      <PixelCard tone="lavender" tag="일몰 시각 직접 입력">
        <form onSubmit={submit} className="mt-2 flex flex-col gap-3">
          <label className="flex flex-col gap-2">
            <span>{dayLabel} {mountainName}의 일몰 시각 (날씨 앱에서 확인할 수 있어요)</span>
            <input
              type="time"
              required
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className="border-4 border-pix-ink bg-pix-paper px-3 py-2 font-pix-display text-pix-heading font-bold focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-pix-orange"
            />
          </label>
          {outOfRange && (
            <p role="alert" className="border-4 border-pix-ink bg-pix-paper px-3 py-1 text-pix-caption">
              일몰은 보통 {formatClock(MANUAL_SUNSET_RANGE_MIN.from)}~{formatClock(MANUAL_SUNSET_RANGE_MIN.to)} 사이예요.
              오전·오후를 확인해줘!
            </p>
          )}
          <PixelButton type="submit" disabled={!valid}>
            이 시각으로 계산하기
          </PixelButton>
        </form>
      </PixelCard>

      <div className="flex flex-col gap-3">
        <PixelButton variant="secondary" onClick={onRetry}>
          다시 시도하기
        </PixelButton>
        <PixelButton variant="secondary" onClick={onBack}>
          산 다시 고르기
        </PixelButton>
      </div>
    </div>
  )
}
