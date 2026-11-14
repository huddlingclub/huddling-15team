import mountainIconSrc from '../assets/sprites/icon-mountain.png'
import { ChoiceCard } from '../components/ChoiceCard.tsx'
import { MissionCard } from '../components/MissionCard.tsx'
import { Penguin } from '../components/Penguin.tsx'
import { PixelButton } from '../components/PixelButton.tsx'
import { PixelSelect } from '../components/PixelSelect.tsx'
import { PixelTimePicker } from '../components/PixelTimePicker.tsx'
import { SpeechBubble } from '../components/SpeechBubble.tsx'
import { TitlePlate } from '../components/TitlePlate.tsx'
import { COURSES, MOUNTAINS, SUNSET_SOURCE, type CourseId, type DayOffset, type MountainId } from '../config.ts'
import { SLOGAN } from '../content.ts'
import { useScreenFocus } from '../hooks/useScreenFocus.ts'
import { formatClock, formatDuration } from '../lib/time.ts'

/** 선택 화면에서 자동 조회한 일몰 시각 상태 */
export type SunsetLookup =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'ok'; minutes: number; source: 'api' | 'manual' }
  | { state: 'error' }

interface Props {
  mountainId: MountainId | null
  sunsetLookup: SunsetLookup
  /** 자동 조회가 실패했을 때 다시 조회 */
  onRetrySunset: () => void
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

const DAY_OPTIONS = [
  { value: 'today', label: '오늘' },
  { value: 'tomorrow', label: '내일' },
] as const

export function SelectScreen({
  mountainId,
  courseId,
  day,
  departMin,
  trailheadIndex,
  sunsetLookup,
  onRetrySunset,
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

  const trailheadOptions = (mountain?.trailheads ?? []).map((name, index) => ({ value: String(index), label: name }))

  return (
    // 아래쪽 여백(pb-28)은 화면 아래에 고정된 버튼이 내용을 가리지 않게 하려는 공간이다.
    <div className="flex flex-col gap-8 pb-28">
      <TitlePlate ref={headingRef}>오늘은 어느 산에 갈까?</TitlePlate>

      <div className="flex items-center gap-4 animate-pix-rise">
        <Penguin size="md" />
        <SpeechBubble tail="left" className="flex-1">
          {SLOGAN}
        </SpeechBubble>
      </div>

      <MissionCard done={false} note="오늘의 미션은 정상 정복이 아니라 안전한 귀환이야!" />

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
        <PixelSelect
          label="들머리"
          className="col-span-2"
          value={String(trailheadIndex)}
          options={trailheadOptions}
          disabled={!mountain}
          placeholder="산을 먼저 골라줘"
          onChange={(value) => onTrailhead(Number(value))}
        />
        <PixelSelect label="날짜" value={day} options={DAY_OPTIONS} onChange={(value) => onDay(value as DayOffset)} />
      </div>

      <PixelTimePicker label="입산 시간" value={departMin} onChange={onDepart} />

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

      <div
        className="flex items-center gap-2 border-4 border-pix-ink bg-pix-paper px-3 py-2 text-pix-caption shadow-pix-sm"
        role="status"
        aria-live="polite"
      >
        <p className="flex-1">
          {sunsetLookup.state === 'idle' && '산을 고르면 일몰 시각을 자동으로 불러와요.'}
          {sunsetLookup.state === 'loading' &&
            `${mountain?.name ?? ''} ${day === 'tomorrow' ? '내일' : '오늘'} 일몰 시각을 불러오는 중…`}
          {sunsetLookup.state === 'ok' && (
            <>
              {mountain?.name} {day === 'tomorrow' ? '내일' : '오늘'} 일몰{' '}
              <b className="font-pix-display text-pix-body">{formatClock(sunsetLookup.minutes)}</b>
              {sunsetLookup.source === 'manual'
                ? ' · 직접 입력한 시각'
                : SUNSET_SOURCE === 'live'
                  ? ' · Open-Meteo 자동 조회'
                  : ' · 기본 설정값'}
            </>
          )}
          {sunsetLookup.state === 'error' && '일몰 자동 조회에 실패했어요. 다시 조회하거나, 확인하기 후 직접 입력할 수 있어요.'}
        </p>
        {sunsetLookup.state === 'error' && (
          <button
            type="button"
            onClick={onRetrySunset}
            className="min-h-11 shrink-0 cursor-pointer border-4 border-pix-ink bg-pix-sun px-2 font-pix-display text-pix-caption font-bold focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-pix-orange"
          >
            다시 조회
          </button>
        )}
      </div>

      {/* 스크롤해도 항상 보이도록 화면 아래에 고정한다. */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t-4 border-pix-ink bg-pix-night">
        <div className="mx-auto flex max-w-sm flex-col gap-2 px-4 py-3">
          {!ready && <p className="text-center text-pix-caption text-pix-paper">산과 코스를 모두 골라줘!</p>}
          <PixelButton disabled={!ready} onClick={onSubmit}>
            하산 가능 여부 확인하기
          </PixelButton>
        </div>
      </div>
    </div>
  )
}
