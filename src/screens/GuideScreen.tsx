import { useEffect, useState } from 'react'
import sparkleSrc from '../assets/sprites/icon-sparkle.png'
import { Disclaimer } from '../components/Disclaimer.tsx'
import { MissionCard } from '../components/MissionCard.tsx'
import { Penguin } from '../components/Penguin.tsx'
import { PixelButton } from '../components/PixelButton.tsx'
import { PixelCard } from '../components/PixelCard.tsx'
import { ScenePanel } from '../components/ScenePanel.tsx'
import { TitlePlate } from '../components/TitlePlate.tsx'
import type { CourseId, Verdict } from '../config.ts'
import { CHECKLIST, VERDICT_COPY } from '../content.ts'
import { useScreenFocus } from '../hooks/useScreenFocus.ts'

// 준비물을 다 챙기면 펭귄 장면 위에 반짝이가 깜빡인다. 위치는 장면 패널 기준(%·rem 단위 클래스).
const SPARKLES = ['top-2 left-4', 'top-4 right-6', 'bottom-3 left-1/2'] as const

interface Props {
  verdict: Verdict
  courseId: CourseId
  /** 준비물을 모두 체크했을 때 한 번 불린다 */
  onReady: () => void
  onRecalcShort: () => void
  onOtherMountain: () => void
  onBackToResult: () => void
}

export function GuideScreen({ verdict, courseId, onReady, onRecalcShort, onOtherMountain, onBackToResult }: Props) {
  const headingRef = useScreenFocus<HTMLHeadingElement>()
  const [checked, setChecked] = useState<ReadonlySet<string>>(new Set())
  const allChecked = checked.size === CHECKLIST.length
  const alreadyShort = courseId === 'short'

  useEffect(() => {
    if (allChecked) onReady()
  }, [allChecked, onReady])

  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className="flex flex-col gap-8">
      <TitlePlate ref={headingRef}>펭산이의 안전 귀환 작전</TitlePlate>

      <ScenePanel
        overlay={
          allChecked &&
          SPARKLES.map((spot, index) => (
            <img
              key={spot}
              src={sparkleSrc}
              alt=""
              className={`pixelated absolute size-8 animate-pix-blink ${spot}`}
              style={{ animationDelay: `${index * 0.25}s` }}
            />
          ))
        }
      >
        <Penguin mood={allChecked ? 'happy' : 'cheer'} size="lg" />
        <div className="flex-1 border-4 border-pix-ink bg-pix-paper px-3 py-2 shadow-pix-sm">
          {allChecked ? (
            <p>준비 완료! 안전하게 돌아오자!</p>
          ) : (
            <>
              <p>오늘도 무리하지 않고 안전하게 다녀오자!</p>
              <p className="text-pix-orange-deep">
                미션 성공 = <strong className="font-normal">안전한 귀환</strong>
              </p>
            </>
          )}
        </div>
      </ScenePanel>

      <MissionCard
        done={allChecked}
        note={allChecked ? '준비물을 다 챙겼어! 이제 안전하게 다녀오자.' : '준비물을 모두 체크하면 미션 준비 완료!'}
      />

      <PixelCard tag="안전 메시지">
        <p className="mt-2">{VERDICT_COPY[verdict].guide}</p>
      </PixelCard>

      <PixelCard tag={`출발 전 체크리스트 ${checked.size}/${CHECKLIST.length}`}>
        <ul className="mt-2 flex flex-col gap-3">
          {CHECKLIST.map((item) => (
            <li key={item.id}>
              <label className="flex cursor-pointer items-center gap-3 border-4 border-pix-ink bg-pix-paper p-2 has-checked:bg-pix-sun has-focus-visible:outline-4 has-focus-visible:outline-offset-2 has-focus-visible:outline-pix-orange">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={checked.has(item.id)}
                  onChange={() => toggle(item.id)}
                />
                <span
                  aria-hidden="true"
                  className="size-8 shrink-0 border-4 border-pix-ink bg-pix-paper peer-checked:bg-pix-green"
                />
                <span>
                  <span className="block font-pix-display text-pix-heading font-bold">{item.label}</span>
                  <span className="block text-pix-body">{item.hint}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        {allChecked && (
          <p
            role="status"
            className="mt-4 border-4 border-pix-ink bg-pix-sun px-3 py-2 text-center font-pix-display text-pix-heading font-bold shadow-pix-sm animate-pix-pop"
          >
            미션 준비 완료!
          </p>
        )}
      </PixelCard>

      <Disclaimer />

      <div className="flex flex-col gap-3">
        <PixelButton variant="secondary" disabled={alreadyShort} onClick={onRecalcShort}>
          짧은 코스로 다시 계산하기
        </PixelButton>
        {alreadyShort && (
          <p className="border-4 border-pix-ink bg-pix-paper px-3 py-1 text-center shadow-pix-sm">
            이미 가장 짧은 코스예요.
          </p>
        )}
        <PixelButton variant="secondary" onClick={onOtherMountain}>
          다른 산 선택하기
        </PixelButton>
        <button
          type="button"
          onClick={onBackToResult}
          className="cursor-pointer self-center border-4 border-pix-ink bg-pix-ink px-3 py-1 text-pix-paper focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-pix-sun"
        >
          판정 화면으로 돌아가기
        </button>
      </div>
    </div>
  )
}
