import type { CSSProperties, ReactNode } from 'react'

interface Props {
  /** 카드 위에 붙는 퀘스트 라벨 */
  tag?: string
  children: ReactNode
  className?: string
  /** 등장 애니메이션 지연 같은 동적 값 전달용 */
  style?: CSSProperties
}

/** 퀘스트 카드: 두꺼운 테두리 + 단단한 그림자 + 위쪽 라벨 탭 */
export function PixelCard({ tag, children, className = '', style }: Props) {
  return (
    <section style={style} className={`relative border-4 border-pix-ink bg-pix-paper p-4 shadow-pix ${className}`}>
      {tag && (
        <span className="absolute -top-4 left-3 border-4 border-pix-ink bg-pix-ink px-2 font-pix-display text-pix-caption font-bold text-pix-sun">
          {tag}
        </span>
      )}
      {children}
    </section>
  )
}
