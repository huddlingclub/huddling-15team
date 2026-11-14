import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
}

/** 화면 위쪽에 놓이는 작은 노란 버튼(스탬프, 안전 가이드). 두 버튼이 같은 모양이도록 한 곳에서 만든다. */
export function HeaderButton({ children, onClick, disabled = false }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="pix-skin-yellow min-h-11 cursor-pointer px-4 font-pix-display text-pix-caption font-bold text-pix-ink focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-pix-orange disabled:cursor-not-allowed disabled:opacity-60 disabled:grayscale"
    >
      {children}
    </button>
  )
}
