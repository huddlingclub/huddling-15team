import type { CSSProperties, ReactNode } from 'react'

type Tone = 'cream' | 'lavender'

// 에셋 카탈로그의 크림 패널(결과·안내·미션)과 라벤더 패널(선택지·입력·체크리스트)
const TONE: Record<Tone, string> = {
  cream: 'pix-skin-panel-cream',
  lavender: 'pix-skin-panel-lavender',
}

interface Props {
  /** 카드 위에 붙는 퀘스트 라벨 */
  tag?: string
  /** cream: 결과·안내 카드, lavender: 고르거나 입력하는 카드 */
  tone?: Tone
  children: ReactNode
  className?: string
  /** 등장 애니메이션 지연 같은 동적 값 전달용 */
  style?: CSSProperties
}

/** 퀘스트 카드: 팀 에셋의 패널 그림 + 위쪽 라벨 탭 */
export function PixelCard({ tag, tone = 'cream', children, className = '', style }: Props) {
  return (
    <section style={style} className={`relative px-1 py-1.5 ${TONE[tone]} ${className}`}>
      {tag && (
        <span className="absolute -top-8 left-0 border-4 border-pix-ink bg-pix-ink px-2 font-pix-display text-pix-caption font-bold text-pix-sun">
          {tag}
        </span>
      )}
      {children}
    </section>
  )
}
