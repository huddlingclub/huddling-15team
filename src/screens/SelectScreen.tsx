import type { ReactNode } from 'react'
import mountainIconSrc from '../assets/sprites/icon-mountain.png'
import { ChoiceCard } from '../components/ChoiceCard.tsx'
import { Penguin } from '../components/Penguin.tsx'
import { PixelButton } from '../components/PixelButton.tsx'
import { SpeechBubble } from '../components/SpeechBubble.tsx'
import { TitlePlate } from '../components/TitlePlate.tsx'
import { COURSES, MOUNTAINS, type CourseId, type DayOffset, type MountainId } from '../config.ts'
import { SLOGAN } from '../content.ts'
import { useScreenFocus } from '../hooks/useScreenFocus.ts'
import { formatClock, formatDuration, parseClock } from '../lib/time.ts'

interface Props {
  mountainId: MountainId | null
  courseId: CourseId | null
  day: DayOffset
  /** 입산 시간 칸에 보여 줄 값(자정부터 분) */
  departMin: number
  trailheadIndex: number
  onMountain: (id: MountainId) => void
  onCourse: (id: CourseId) => void
  onDay: (day: DayOffset) => void
  /** 칸을 비우면 null → 기본 시각으로 돌아간다 */
  onDepart: (min: number | null) => void
  onTrailhead: (index: number) => void
  onSubmit: () => void
}

const FIELD_CONTROL =
  'mt-1 w-full min-h-11 bg-transparent font-pix-display text-pix-body font-bold outline-none disabled:text-pix-ink-soft'

/** 라벨이 붙은 입력 칸. 칸 전체를 누르면 안쪽 입력이 선택된다. */
function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label
      className={`block border-4 border-pix-ink bg-pix-paper px-3 py-2 shadow-pix-sm focus-within:outline-4 focus-within:outline-offset-2 focus-within:outline-pix-orange ${className}`}
    >
      <span className="block text-pix-caption">{label}</span>
      {children}
    </label>
  )
}

export function SelectScreen({
  mountainId,
  courseId,
  day,
  departMin,
  trailheadIndex,
  onMountain,
  onCourse,
  onDay,
  onDepart,
  onTrailhead,
  onSubmit,
}: Props) {
  const headingRef = useScreenFocus<HTMLHeadingElement>()
  const mountain = MOUNTAINS.find((m) => m.id === mountainId)
  const ready = mountainId !== null && courseId !== null

  return (
    <div className="flex flex-col gap-8">
      <TitlePlate ref={headingRef}>오늘은 어느 산에 갈까?</TitlePlate>

      <div className="flex items-center gap-4 animate-pix-rise">
        <Penguin size="md" />
        <SpeechBubble tail="left" className="flex-1">
          {SLOGAN}
        </SpeechBubble>
      </div>

      <fieldset>
        <legend className="sr-only">산 선택</legend>
        <div className="grid grid-cols-3 gap-2">
          {MOUNTAINS.map((m) => (
            <ChoiceCard
              key={m.id}
              name="mountain"
              value={m.id}
              checked={mountainId === m.id}
              onChange={() => onMountain(m.id)}
              className="flex flex-col items-center gap-1 px-1 py-3 text-center"
            >
              <img src={mountainIconSrc} alt="" draggable={false} className="pixelated h-8 w-auto" />
              <span className="font-pix-display text-pix-body font-bold">{m.name}</span>
              <span className="font-pix-display text-pix-caption font-bold">{m.elevationM}m</span>
            </ChoiceCard>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-3 gap-3">
        <Field label="들머리" className="col-span-2">
          <select
            className={FIELD_CONTROL}
            disabled={!mountain}
            value={trailheadIndex}
            onChange={(e) => onTrailhead(Number(e.target.value))}
          >
            {mountain ? (
              mountain.trailheads.map((name, index) => (
                <option key={name} value={index}>
                  {name}
                </option>
              ))
            ) : (
              <option>산을 먼저 골라줘</option>
            )}
          </select>
        </Field>
        <Field label="날짜">
          <select className={FIELD_CONTROL} value={day} onChange={(e) => onDay(e.target.value as DayOffset)}>
            <option value="today">오늘</option>
            <option value="tomorrow">내일</option>
          </select>
        </Field>
      </div>

      <Field label="입산 시간">
        <input
          type="time"
          className={FIELD_CONTROL}
          value={formatClock(departMin)}
          onChange={(e) => onDepart(parseClock(e.target.value))}
        />
      </Field>

      <fieldset>
        <legend className="mb-3 border-4 border-pix-ink bg-pix-ink px-2 text-pix-paper">
          코스 선택 · 왕복 소요 시간
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {COURSES.map((course) => (
            <ChoiceCard
              key={course.id}
              name="course"
              value={course.id}
              checked={courseId === course.id}
              onChange={() => onCourse(course.id)}
              className="p-2 text-center"
            >
              <span className="block font-pix-display text-pix-body font-bold">{course.label}</span>
              <span className="block text-pix-caption">
                {mountain ? formatDuration(mountain.roundTripMin[course.id]) : '산을 먼저 골라줘'}
              </span>
            </ChoiceCard>
          ))}
        </div>
      </fieldset>

      <p className="border-4 border-pix-ink bg-pix-paper px-3 py-2 text-pix-caption shadow-pix-sm">
        Open-Meteo 일출·일몰 조회 · 실패하면 일몰 시각을 직접 입력해요.
      </p>

      <div className="flex flex-col gap-3">
        <PixelButton disabled={!ready} onClick={onSubmit}>
          하산 가능 여부 확인하기
        </PixelButton>
        {!ready && (
          <p className="border-4 border-pix-ink bg-pix-paper px-3 py-1 text-center text-pix-body shadow-pix-sm">
            산과 코스를 모두 골라줘!
          </p>
        )}
      </div>
    </div>
  )
}
