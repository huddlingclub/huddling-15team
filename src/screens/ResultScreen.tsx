import { useState, type CSSProperties, type ReactNode } from 'react'
import { ChoiceCard } from '../components/ChoiceCard.tsx'
import { MissionCard } from '../components/MissionCard.tsx'
import { Disclaimer } from '../components/Disclaimer.tsx'
import { Penguin } from '../components/Penguin.tsx'
import { PixelButton } from '../components/PixelButton.tsx'
import { PixelCard } from '../components/PixelCard.tsx'
import { ScenePanel } from '../components/ScenePanel.tsx'
import { SpeechBubble } from '../components/SpeechBubble.tsx'
import { TimelineGauge } from '../components/TimelineGauge.tsx'
import { TitlePlate } from '../components/TitlePlate.tsx'
import { TrafficLight } from '../components/TrafficLight.tsx'
import {
  COURSES,
  REST_MIN,
  SAFE_FINISH_BEFORE_SUNSET_MIN,
  type CourseId,
  type DayOffset,
  type Mountain,
  type Verdict,
} from '../config.ts'
import { verdictCopy } from '../content.ts'
import { useScreenFocus } from '../hooks/useScreenFocus.ts'
import type { JudgeResult } from '../lib/judge.ts'
import { buildShareText, shareText, type ShareOutcome } from '../lib/share.ts'
import { formatClock, formatDuration, isNextDay } from '../lib/time.ts'

// 판정 제목과 여유 시간 글자색(카드 바탕이 밝아서 어두운 판정색을 쓴다)
const TONE: Record<Verdict, string> = {
  green: 'text-pix-green-dim',
  yellow: 'text-pix-yellow-dim',
  red: 'text-pix-red-dim',
}

const MISSION_NOTE: Record<Verdict, string> = {
  green: '이 계획이면 미션 달성이 가능해! 하산 시각만 꼭 지켜줘.',
  yellow: '미션은 가능하지만 빠듯해. 코스를 줄이면 더 안전해!',
  red: '오늘은 미션 보류. 무리하지 않는 것도 미션이야!',
}

const RED_TOMORROW_MISSION_NOTE = '내일 이 계획은 미션 보류. 출발 시각을 앞당겨 보자!'

const SHARE_NOTE: Record<ShareOutcome, string | null> = {
  shared: null,
  cancelled: null,
  copied: '결과 문구를 복사했어요. 카카오톡에 붙여넣어 보내세요.',
  failed: '공유하지 못했어요. 잠시 후 다시 눌러줘.',
}

// 신호등이 자리 잡은 뒤에 아래 정보가 차례로 떠오르게 한다.
const REVEAL_START_S = 0.5
const REVEAL_STEP_S = 0.15
const reveal = (order: number): CSSProperties => ({ animationDelay: `${REVEAL_START_S + order * REVEAL_STEP_S}s` })

interface Props {
  mountain: Mountain
  courseId: CourseId
  day: DayOffset
  trailhead: string
  /** 계산 기준이 된 입산 시각 */
  nowMin: number
  sunsetMin: number
  sunsetSource: 'api' | 'manual'
  result: JudgeResult
  /** 값이 바뀌면(재계산) 판정 연출이 처음부터 다시 재생된다 */
  runKey: number
  onChangeCourse: (id: CourseId) => void
  onTomorrow: () => void
  onOtherMountain: () => void
  onGuide: () => void
}

function StatRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <dt>{label}</dt>
      <dd className="text-right font-pix-display text-pix-heading font-bold">{children}</dd>
    </div>
  )
}

export function ResultScreen({
  mountain,
  courseId,
  day,
  trailhead,
  nowMin,
  sunsetMin,
  sunsetSource,
  result,
  runKey,
  onChangeCourse,
  onTomorrow,
  onOtherMountain,
  onGuide,
}: Props) {
  const headingRef = useScreenFocus<HTMLHeadingElement>()
  const [shareNote, setShareNote] = useState<string | null>(null)
  const copy = verdictCopy(result.verdict, day)
  const course = COURSES.find((c) => c.id === courseId)
  const roundTripMin = mountain.roundTripMin[courseId]
  const late = result.marginMin < 0
  const canTomorrow = result.verdict === 'red' && day === 'today'
  const canShorten = result.verdict !== 'green' && courseId !== 'short' && !canTomorrow

  const share = async () => {
    const text = buildShareText({
      mountainName: mountain.name,
      courseLabel: course?.label ?? '',
      finishMin: result.finishMin,
      sunsetMin,
      verdictTitle: copy.badge,
      day,
    })
    setShareNote(SHARE_NOTE[await shareText(text)])
  }

  return (
    <div className="flex flex-col gap-8">
      <TitlePlate ref={headingRef}>펭산이의 하산 판정!</TitlePlate>

      <div key={runKey} className="flex flex-col gap-8">
        <PixelCard>
          <div className="flex items-center justify-center gap-4">
            <TrafficLight verdict={result.verdict} day={day} />
            <div className="flex flex-col gap-1">
              <p className={`font-pix-display text-pix-heading font-bold ${TONE[result.verdict]}`}>{copy.badge}</p>
              <p>{copy.bubble}</p>
            </div>
          </div>
        </PixelCard>

        <ScenePanel className="animate-pix-rise">
          <Penguin mood={copy.mood} size="lg" />
          {copy.scene && (
            <SpeechBubble className="flex-1">
              {copy.scene}
            </SpeechBubble>
          )}
        </ScenePanel>

        <MissionCard done={result.verdict === 'green'} note={result.verdict === 'red' && day === 'tomorrow' ? RED_TOMORROW_MISSION_NOTE : MISSION_NOTE[result.verdict]} className="animate-pix-rise" />

        <PixelCard className="animate-pix-rise" style={reveal(0)}>
          <dl className="divide-y-4 divide-pix-paper-shade">
            <StatRow label="예상 하산">
              {formatClock(result.finishMin)}
              {isNextDay(result.finishMin) && <span className="ml-2 text-pix-body">다음 날</span>}
            </StatRow>
            <StatRow label="일몰 시각">{formatClock(sunsetMin)}</StatRow>
            <StatRow label="여유 시간">
              <span className={TONE[result.verdict]}>
                {late ? '-' : ''}
                {formatDuration(result.marginMin)}
              </span>
            </StatRow>
            <StatRow label="권장 하산 마감">{formatClock(result.recommendedFinishMin)}</StatRow>
          </dl>
          <p className="mt-2 text-pix-caption">
            {day === 'tomorrow' ? '내일 ' : ''}
            {formatClock(nowMin)} 입산 + 왕복 {formatDuration(roundTripMin)} + 휴식 {REST_MIN}분 · 들머리 {trailhead} ·{' '}
            {sunsetSource === 'api' ? '일몰은 Open-Meteo 기준' : '일몰은 직접 입력한 시각'}
          </p>
          <p className="mt-1 text-pix-caption">
            판정 공식: 예상 하산 = 입산 + 왕복 소요 + 휴식 {REST_MIN}분 · 권장 하산 = 일몰 − {SAFE_FINISH_BEFORE_SUNSET_MIN}분
          </p>
        </PixelCard>

        <TimelineGauge
          departMin={nowMin}
          sunsetMin={sunsetMin}
          marginMin={result.marginMin}
          verdict={result.verdict}
          mood={copy.mood}
          className="animate-pix-rise"
          style={reveal(1)}
        />

        <PixelCard tag={`${mountain.name} · 코스 바꾸기`} className="animate-pix-rise" style={reveal(2)}>
          <fieldset className="mt-2">
            <legend className="sr-only">코스 다시 선택</legend>
            <div className="grid grid-cols-3 gap-2">
              {COURSES.map((c) => (
                <ChoiceCard
                  key={c.id}
                  name="course"
                  value={c.id}
                  checked={courseId === c.id}
                  onChange={() => onChangeCourse(c.id)}
                  className="p-2 text-center"
                >
                  <span className="block">{c.label}</span>
                  <span className="block font-pix-display text-pix-caption font-bold">
                    {formatDuration(mountain.roundTripMin[c.id])}
                  </span>
                </ChoiceCard>
              ))}
            </div>
          </fieldset>
        </PixelCard>

        <Disclaimer />

        <div className="flex flex-col gap-3">
          {result.verdict === 'green' && <PixelButton onClick={() => void share()}>카카오톡으로 결과 공유</PixelButton>}
          {shareNote && (
            <p role="status" className="border-4 border-pix-ink bg-pix-paper px-3 py-1 text-center shadow-pix-sm">
              {shareNote}
            </p>
          )}
          {canTomorrow && <PixelButton onClick={onTomorrow}>내일 산행으로 다시 계산</PixelButton>}
          {canShorten && <PixelButton onClick={() => onChangeCourse('short')}>짧은 코스로 다시 계산</PixelButton>}
          <PixelButton variant="secondary" onClick={onGuide}>
            안전 가이드 보기
          </PixelButton>
          <PixelButton variant="secondary" onClick={onOtherMountain}>
            다른 산 선택하기
          </PixelButton>
        </div>
      </div>
    </div>
  )
}
