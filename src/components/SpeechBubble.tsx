import type { ReactNode } from 'react'

type Tail = 'bottom' | 'left'

const TAIL: Record<Tail, string> = {
  bottom: '-bottom-2.5 left-1/2 -translate-x-1/2 border-r-4 border-b-4',
  left: '-left-2.5 top-1/2 -translate-y-1/2 border-b-4 border-l-4',
}

interface Props {
  children: ReactNode
  /** 꼬리가 향하는 쪽. 펭귄이 말풍선 아래면 bottom, 옆(왼쪽)이면 left */
  tail?: Tail
  className?: string
}

/** 펭산이 말풍선 */
export function SpeechBubble({ children, tail = 'bottom', className = '' }: Props) {
  return (
    <div
      role="status"
      className={`relative border-4 border-pix-ink bg-pix-paper px-3 py-2 text-pix-body shadow-pix-sm ${className}`}
    >
      {children}
      <span
        aria-hidden="true"
        className={`absolute size-4 rotate-45 border-pix-ink bg-pix-paper ${TAIL[tail]}`}
      />
    </div>
  )
}
