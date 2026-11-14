import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NewBadgeToast } from './components/NewBadgeToast.tsx'
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
import {
  BADGES,
  grantBadge,
  loadStamps,
  recordMountain,
  saveStamps,
  type BadgeId,
  type BadgeInfo,
  type StampState,
} from './lib/badges.ts'
import { judgeDescent } from './lib/judge.ts'
import { fetchSunsetMinutes } from './lib/sunset.ts'
import { seoulDateKey, seoulMinutes, targetDateKey } from './lib/time.ts'
import { CalculatingScreen } from './screens/CalculatingScreen.tsx'
import { GuideScreen } from './screens/GuideScreen.tsx'
import { ResultScreen } from './screens/ResultScreen.tsx'
import { SelectScreen, type SunsetLookup } from './screens/SelectScreen.tsx'
import { StampsScreen } from './screens/StampsScreen.tsx'
import { SunsetErrorScreen } from './screens/SunsetErrorScreen.tsx'

type Phase = 'select' | 'calculating' | 'result' | 'guide' | 'sunsetError' | 'stamps'

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
  /** 선택 화면에서 미리 조회한 결과 상태 (산·날짜별). 성공 값은 sunsets 캐시에 들어간다 */
  const [prefetchErrors, setPrefetchErrors] = useState<Partial<Record<string, true>>>({})
  const prefetchingRef = useRef(new Set<string>())
  /** 판정에 쓴 입산 시각. 결과 화면 안에서 시계가 흘러 숫자가 흔들리지 않게 고정한다 */
  const [checkedAtMin, setCheckedAtMin] = useState(0)
  const [runKey, setRunKey] = useState(0)
  const nowMin = useNowMinutes()
  const requestRef = useRef<AbortController | null>(null)

  const [stamps, setStamps] = useState<StampState>(loadStamps)
  const stampsRef = useRef(stamps)
  const [toast, setToast] = useState<readonly BadgeInfo[]>([])
  /** 직전 판정의 신호등. "코스를 줄여 초록불" 배지를 가려내는 데 쓴다 */
  const lastVerdictRef = useRef<Verdict | null>(null)
  /** 스탬프 화면에서 돌아갈 화면 */
  const returnPhaseRef = useRef<Phase>('select')

  useEffect(() => () => requestRef.current?.abort(), [])

  /** 배지를 지급한다. 이미 받은 배지는 건너뛰고, 새로 받은 것만 알림으로 보여준다. */
  const grant = useCallback((ids: readonly BadgeId[], checkedMountain?: MountainId) => {
    const today = seoulDateKey(new Date())
    let next = stampsRef.current
    if (checkedMountain) next = recordMountain(next, checkedMountain)

    const wanted = [...ids]
    if (next.mountains.length >= MOUNTAINS.length) wanted.push('three-mountains')

    const fresh: BadgeInfo[] = []
    for (const id of wanted) {
      if (next.earned[id]) continue
      next = grantBadge(next, id, today)
      const info = BADGES.find((badge) => badge.id === id)
      if (info) fresh.push(info)
    }

    if (next === stampsRef.current) return
    stampsRef.current = next
    setStamps(next)
    saveStamps(next)
    if (fresh.length > 0) setToast((prev) => [...prev, ...fresh])
  }, [])

  const closeToast = useCallback(() => setToast([]), [])

  const mountain = MOUNTAINS.find((m) => m.id === mountainId) ?? null
  const sunset = mountainId ? sunsets[sunsetKey(mountainId, dayOffset)] : undefined
  /** 입산 시간 칸에 보여 줄 값 */
  const shownDepartMin = departMin ?? (dayOffset === 'tomorrow' ? TOMORROW_DEFAULT_DEPART_MIN : nowMin)

  // 산이나 날짜를 고르면 Open-Meteo 일몰 시각을 바로 자동 조회해 둔다.
  // 확인하기를 누를 때는 이 캐시를 그대로 써서 기다리지 않는다.
  useEffect(() => {
    // 결과 화면에 표시 중인 값이 바뀌지 않도록 선택 화면에서만 미리 조회한다
    if (phase !== 'select' || !mountain) return
    const key = sunsetKey(mountain.id, dayOffset)
    const dateKey = targetDateKey(dayOffset)
    const cached = sunsets[key]
    if (cached && cached.source === 'api' && cached.dateKey === dateKey) return
    if (prefetchErrors[key] || prefetchingRef.current.has(key)) return

    // 'preset' 모드에서는 네트워크 없이 설정값을 바로 넣는다 (startCheck와 같은 기준)
    if (SUNSET_SOURCE === 'preset') {
      const minutes = PRESET_SUNSET_MIN[mountain.id][dayOffset]
      setSunsets((prev) => ({ ...prev, [key]: { minutes, source: 'api', dateKey } }))
      return
    }

    prefetchingRef.current.add(key)
    fetchSunsetMinutes(mountain.latitude, mountain.longitude, dayOffset)
      // 직접 입력한 값은 그 판정에서만 쓰므로(startCheck와 동일) API 값으로 갱신한다
      .then((minutes) => setSunsets((prev) => ({ ...prev, [key]: { minutes, source: 'api', dateKey } })))
      .catch(() => setPrefetchErrors((prev) => ({ ...prev, [key]: true })))
      .finally(() => prefetchingRef.current.delete(key))
  }, [phase, mountain, dayOffset, sunsets, prefetchErrors])

  const retryPrefetch = () => {
    if (!mountainId) return
    const key = sunsetKey(mountainId, dayOffset)
    setPrefetchErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  /** 선택 화면 안내 박스에 보여 줄 자동 조회 상태 */
  const lookupSunset = (): SunsetLookup => {
    if (!mountainId) return { state: 'idle' }
    const key = sunsetKey(mountainId, dayOffset)
    const cached = sunsets[key]
    if (cached && cached.dateKey === targetDateKey(dayOffset)) {
      return { state: 'ok', minutes: cached.minutes, source: cached.source }
    }
    if (prefetchErrors[key]) return { state: 'error' }
    return { state: 'loading' }
  }
  const sunsetLookup = lookupSunset()

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

  // 판정 결과가 나올 때마다 배지 조건을 확인한다. 같은 결과를 다시 봐도 배지는 한 번만 지급된다.
  useEffect(() => {
    if (phase === 'select') lastVerdictRef.current = null
    if (phase !== 'result' || !result || !mountain || !courseId) return

    const ids: BadgeId[] = ['first-check']
    if (result.verdict === 'green') ids.push('green-light')
    const before = lastVerdictRef.current
    if (result.verdict === 'green' && courseId === 'short' && before && before !== 'green') ids.push('short-saver')
    lastVerdictRef.current = result.verdict
    grant(ids, mountain.id)
  }, [phase, runKey, result, mountain, courseId, grant])

  const openStamps = () => {
    if (phase === 'calculating') return
    if (phase !== 'stamps') returnPhaseRef.current = phase
    setPhase('stamps')
  }

  const showResult = (day: DayOffset = dayOffset, depart: number | null = departMin) => {
    const fallback = day === 'tomorrow' ? TOMORROW_DEFAULT_DEPART_MIN : seoulMinutes(new Date())
    setCheckedAtMin(depart ?? fallback)
    setRunKey((key) => key + 1)
    setPhase('result')
  }

  const startCheck = async (day: DayOffset = dayOffset, depart: number | null = departMin) => {
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
      showResult(day, depart)
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
    if (result?.verdict === 'red') grant(['wise-choice'])
    // 오늘 늦은 시각을 그대로 내일에 쓰면 또 빨강이 나오므로, 직접 입력한 입산 시간은 비우고 내일 기본 시각으로 계산한다.
    setDayOffset('tomorrow')
    setDepartMin(null)
    void startCheck('tomorrow', null)
  }

  const showingJudgement = (phase === 'result' || phase === 'guide') && mountain && courseId && sunset && result
  const skyMood: SkyMood = showingJudgement ? SKY_BY_VERDICT[result.verdict] : 'dusk'

  return (
    <>
      <SkyBackdrop mood={skyMood} />
      <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col px-4 pt-6 pb-10">
        <header className="mb-8 flex items-center justify-between gap-2">
          <span className="inline-block border-4 border-pix-ink bg-pix-paper px-3 py-1 font-pix-display text-pix-caption font-bold shadow-pix-sm">
            펭산이의 하산 대작전
          </span>
          <button
            type="button"
            onClick={openStamps}
            disabled={phase === 'calculating'}
            className="min-h-11 cursor-pointer border-4 border-pix-ink bg-pix-sun px-3 font-pix-display text-pix-caption font-bold shadow-pix-sm focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-pix-orange disabled:cursor-not-allowed disabled:bg-pix-paper-shade"
          >
            스탬프 {BADGES.filter((badge) => stamps.earned[badge.id]).length}/{BADGES.length}
          </button>
        </header>

        <main>
          {phase === 'select' && (
            <SelectScreen
              mountainId={mountainId}
              courseId={courseId}
              day={dayOffset}
              departMin={shownDepartMin}
              trailheadIndex={trailheadIndex}
              sunsetLookup={sunsetLookup}
              onRetrySunset={retryPrefetch}
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
              onReady={() => grant(['ready'])}
              onRecalcShort={() => changeCourse('short')}
              onOtherMountain={() => setPhase('select')}
              onBackToResult={() => setPhase('result')}
            />
          )}

          {phase === 'stamps' && <StampsScreen stamps={stamps} onBack={() => setPhase(returnPhaseRef.current)} />}
        </main>
      </div>

      {toast.length > 0 && <NewBadgeToast badges={toast} onClose={closeToast} />}
    </>
  )
}
