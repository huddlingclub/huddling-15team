import { BadgeIcon } from '../components/BadgeIcon.tsx'
import { PixelButton } from '../components/PixelButton.tsx'
import { PixelCard } from '../components/PixelCard.tsx'
import { TitlePlate } from '../components/TitlePlate.tsx'
import { useScreenFocus } from '../hooks/useScreenFocus.ts'
import { BADGES, type StampState } from '../lib/badges.ts'

interface Props {
  stamps: StampState
  onBack: () => void
}

/** 지금까지 모은 스탬프. 이 기기에만 저장되고 로그인은 필요 없다. */
export function StampsScreen({ stamps, onBack }: Props) {
  const headingRef = useScreenFocus<HTMLHeadingElement>()
  const count = BADGES.filter((badge) => stamps.earned[badge.id]).length

  return (
    <div className="flex flex-col gap-8">
      <TitlePlate ref={headingRef}>펭산이의 스탬프</TitlePlate>

      <PixelCard tag={`모은 스탬프 ${count}/${BADGES.length}`}>
        <p className="mt-2">
          스탬프는 출발 전에 안전하게 계획한 기록이에요. 실제로 내려온 것을 확인하는 건 아니라서, 산에서는 꼭 하산 시각을
          지켜줘!
        </p>
      </PixelCard>

      <ul className="grid grid-cols-2 gap-3">
        {BADGES.map((badge) => {
          const date = stamps.earned[badge.id]
          return (
            <li
              key={badge.id}
              className={`flex flex-col items-center gap-2 border-4 border-pix-ink p-3 text-center shadow-pix-sm ${
                date ? 'bg-pix-sun' : 'bg-pix-paper'
              }`}
            >
              <BadgeIcon id={badge.id} locked={!date} />
              <p className="font-pix-display text-pix-body font-bold">{badge.name}</p>
              <p className="text-pix-caption">{badge.hint}</p>
              <p className="font-pix-display text-pix-caption font-bold">{date ? `${date} 획득` : '아직 못 받았어요'}</p>
            </li>
          )
        })}
      </ul>

      <PixelButton variant="secondary" onClick={onBack}>
        돌아가기
      </PixelButton>
    </div>
  )
}
