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
      className="min-h-11 cursor-pointer border-4 border-pix-ink bg-pix-sun px-3 font-pix-display text-pix-caption font-bold shadow-pix-sm focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-pix-orange disabled:cursor-not-allowed disabled:bg-pix-paper-shade"
    >
      {children}
    </button>
  )
}
