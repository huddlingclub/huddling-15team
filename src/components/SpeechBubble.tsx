import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
}

/**
 * 펭산이 말풍선. 에셋 카탈로그의 말풍선 그림을 9분할로 늘려 쓴다.
 * 그림의 꼬리가 아래쪽 왼쪽에 있어서, 펭귄이 말풍선의 왼쪽 아래에 오도록 배치한다.
 * 아래쪽 padding은 꼬리 자리라서 넉넉히 둔다.
 */
export function SpeechBubble({ children, className = '' }: Props) {
  return (
    <div role="status" className={`pix-skin-bubble px-5 pt-3 pb-9 text-pix-body ${className}`}>
      {children}
    </div>
  )
}
