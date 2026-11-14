import { useEffect } from 'react'
import type { BadgeInfo } from '../lib/badges.ts'
import { BadgeIcon } from './BadgeIcon.tsx'

/** 알림이 저절로 사라지기까지의 시간(ms) */
const VISIBLE_MS = 4000

interface Props {
  badges: readonly BadgeInfo[]
  onClose: () => void
}

/** 새 배지를 받았을 때 화면 위에 잠깐 나타나는 알림 */
export function NewBadgeToast({ badges, onClose }: Props) {
  useEffect(() => {
    const timer = setTimeout(onClose, VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [badges, onClose])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-2 z-10 mx-auto w-full max-w-sm px-4">
      <div
        role="status"
        className="pointer-events-auto flex items-center gap-3 border-4 border-pix-ink bg-pix-sun px-3 py-2 shadow-pix animate-pix-pop"
      >
        <BadgeIcon id={badges[0].id} />
        <div className="flex-1">
          <p className="font-pix-display text-pix-caption font-bold">새 스탬프 획득!</p>
          <p className="font-pix-display text-pix-body font-bold">{badges.map((badge) => badge.name).join(', ')}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="알림 닫기"
          className="size-11 shrink-0 cursor-pointer border-4 border-pix-ink bg-pix-paper font-pix-display font-bold focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-pix-orange"
        >
          ×
        </button>
      </div>
    </div>
  )
}
