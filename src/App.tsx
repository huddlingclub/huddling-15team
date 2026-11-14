import { useEffect, useMemo, useRef, useState } from 'react'
import { SkyBackdrop, type SkyMood } from './components/SkyBackdrop.tsx'
import {
  MIN_LOADING_MS,
  MOUNTAINS,
  PRESET_SUNSET_MIN,
  SUNSET_SOURCE,
  TOMORROW_DEFAULT_DEPART_MIN,
  type CourseId,
  type DayOffset,
  type MountainId,
  type Verdict,
} from './config.ts'
import { useNowMinutes } from './hooks/useNowMinutes.ts'
import { judgeDescent } from './lib/judge.ts'
import { fetchSunsetMinutes } from './lib/sunset.ts'
import { seoulMinutes, targetDateKey } from './lib/time.ts'
import { CalculatingScreen } from './screens/CalculatingScreen.tsx'
import { GuideScreen } from './screens/GuideScreen.tsx'
import { ResultScreen } from './screens/ResultScreen.tsx'
import { SelectScreen } from './screens/SelectScreen.tsx'
import { SunsetErrorScreen } from './screens/SunsetErrorScreen.tsx'

type Phase = 'select' | 'calculating' | 'result' | 'guide' | 'sunsetError'

interface SunsetInfo {
  minutes: number
  source: 'api' | 'manual'
  /** 한국 시간 기준 대상 날짜(YYYY-MM-DD). 하루가 지나면 API 값을 다시 받는다 */
  dateKey: string
}

/** 일몰 캐시는 산과 날짜(오늘/내일)별로 따로 보관한다. */
const sunsetKey = (id: MountainId, day: DayOffset) => `${id}:${day}`

/** 판정에 따라 배경 하늘이 바뀐다: 초록은 노을, 노랑은 더 짙은 주황, 빨강은 밤하늘 */
const SKY_BY_VERDICT: Record<Verdict, SkyMood> = { green: 'dusk', yellow: 'glow', red: 'night' }

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export default function App() {
  const [phase, setPhase] = useState<Phase>('select')
  const [mountainId, setMountainId] = useState<MountainId | null>(null)
  const [courseId, setCourseId] = useState<CourseId | null>(null)
  const [dayOffset, setDayOffset] = useState<DayOffset>('today')
  /** 사용자가 직접 고른 입산 시간. 비어 있으면 오늘은 현재 시각, 내일은 기본 시각을 쓴다 */
  const [departMin, setDepartMin] = useState<number | null>(null)
  const [trailheadIndex, setTrailheadIndex] = useState(0)
  const [sunsets, setSunsets] = useState<Partial<Record<string, SunsetInfo>>>({})
  /** 판정에 쓴 입산 시각. 결과 화면 안에서 시계가 흘러 숫자가 흔들리지 않게 고정한다 */
  const [checkedAtMin, setCheckedAtMin] = useState(0)
  const [runKey, setRunKey] = useState(0)
  const nowMin = useNowMinutes()
  const requestRef = useRef<AbortController | null>(null)

  useEffect(() => () => requestRef.current?.abort(), [])

  const mountain = MOUNTAINS.find((m) => m.id === mountainId) ?? null
  const sunset = mountainId ? sunsets[sunsetKey(mountainId, dayOffset)] : undefined
  /** 입산 시간 칸에 보여 줄 값 */
  const shownDepartMin = departMin ?? (dayOffset === 'tomorrow' ? TOMORROW_DEFAULT_DEPART_MIN : nowMin)

  const selectMountain = (id: MountainId) => {
    setMountainId(id)
    setTrailheadIndex(0)
  }

  const result = useMemo(
    () =>
      mountain && courseId && sunset
        ? judgeDescent({
            nowMin: checkedAtMin,
            roundTripMin: mountain.roundTripMin[courseId],
            sunsetMin: sunset.minutes,
          })
        : null,
    [mountain, courseId, sunset, checkedAtMin],
  )

  const showResult = (day: DayOffset = dayOffset) => {
    const fallback = day === 'tomorrow' ? TOMORROW_DEFAULT_DEPART_MIN : seoulMinutes(new Date())
    setCheckedAtMin(departMin ?? fallback)
    setRunKey((key) => key + 1)
    setPhase('result')
  }

  const startCheck = async (day: DayOffset = dayOffset) => {
    if (!mountain || !courseId) return

    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller

    setPhase('calculating')
    const minimumLoading = wait(MIN_LOADING_MS)
    const dateKey = targetDateKey(day)
    const key = sunsetKey(mountain.id, day)
    const cached = sunsets[key]
    // 직접 입력한 값은 그 판정에서만 쓴다. 다시 확인하면 API 값을 새로 받는다.
    const reusable = cached && cached.source === 'api' && cached.dateKey === dateKey ? cached : null

    try {
      const info: SunsetInfo =
        reusable ?? {
          minutes:
            SUNSET_SOURCE === 'preset'
              ? PRESET_SUNSET_MIN[mountain.id][day]
              : await fetchSunsetMinutes(mountain.latitude, mountain.longitude, day, controller.signal),
          source: 'api',
          dateKey,
        }
      await minimumLoading
      if (controller.signal.aborted) return
      setSunsets((prev) => ({ ...prev, [key]: info }))
      showResult(day)
    } catch {
      await minimumLoading
      if (controller.signal.aborted) return
      setPhase('sunsetError')
    }
  }

  const changeCourse = (id: CourseId) => {
    setCourseId(id)
    showResult()
  }

  const applyManualSunset = (minutes: number) => {
    if (!mountain) return
    setSunsets((prev) => ({
      ...prev,
      [sunsetKey(mountain.id, dayOffset)]: { minutes, source: 'manual', dateKey: targetDateKey(dayOffset) },
    }))
    showResult()
  }

  /** 오늘은 늦었을 때: 내일 산행으로 바꿔 내일 일몰로 다시 계산한다. */
  const recalcTomorrow = () => {
    setDayOffset('tomorrow')
    void startCheck('tomorrow')
  }

  const showingJudgement = (phase === 'result' || phase === 'guide') && mountain && courseId && sunset && result
  const skyMood: SkyMood = showingJudgement ? SKY_BY_VERDICT[result.verdict] : 'dusk'

  return (
    <>
      <SkyBackdrop mood={skyMood} />
      <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col px-4 pt-6 pb-10">
        <header className="mb-8 text-center">
          <span className="inline-block border-4 border-pix-ink bg-pix-paper px-3 py-1 font-pix-display text-pix-caption font-bold shadow-pix-sm">
            펭산이의 하산 대작전
          </span>
        </header>

        <main>
          {phase === 'select' && (
            <SelectScreen
              mountainId={mountainId}
              courseId={courseId}
              day={dayOffset}
              departMin={shownDepartMin}
              trailheadIndex={trailheadIndex}
              onMountain={selectMountain}
              onCourse={setCourseId}
              onDay={setDayOffset}
              onDepart={setDepartMin}
              onTrailhead={setTrailheadIndex}
              onSubmit={() => void startCheck()}
            />
          )}

          {phase === 'calculating' && <CalculatingScreen mountainName={mountain?.name ?? ''} />}

          {phase === 'sunsetError' && mountain && (
            <SunsetErrorScreen
              mountainName={mountain.name}
              dayLabel={dayOffset === 'tomorrow' ? '내일' : '오늘'}
              onRetry={() => void startCheck()}
              onManual={applyManualSunset}
              onBack={() => setPhase('select')}
            />
          )}

          {phase === 'result' && showingJudgement && (
            <ResultScreen
              mountain={mountain}
              courseId={courseId}
              day={dayOffset}
              trailhead={mountain.trailheads[trailheadIndex] ?? mountain.trailheads[0]}
              nowMin={checkedAtMin}
              sunsetMin={sunset.minutes}
              sunsetSource={sunset.source}
              result={result}
              runKey={runKey}
              onChangeCourse={changeCourse}
              onTomorrow={recalcTomorrow}
              onOtherMountain={() => setPhase('select')}
              onGuide={() => setPhase('guide')}
            />
          )}

          {phase === 'guide' && showingJudgement && (
            <GuideScreen
              verdict={result.verdict}
              courseId={courseId}
              onRecalcShort={() => changeCourse('short')}
              onOtherMountain={() => setPhase('select')}
              onBackToResult={() => setPhase('result')}
            />
          )}
        </main>
      </div>
    </>
  )
}
