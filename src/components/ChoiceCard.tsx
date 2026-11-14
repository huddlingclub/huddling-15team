import type { ReactNode } from 'react'

interface Props {
  name: string
  value: string
  checked: boolean
  onChange: () => void
  children: ReactNode
  className?: string
}

/** 라디오 입력 위에 얹은 픽셀 카드. 키보드(화살표/탭)와 스크린리더 동작은 네이티브 radio를 그대로 쓴다. */
export function ChoiceCard({ name, value, checked, onChange, children, className = '' }: Props) {
  return (
    <label className="relative block cursor-pointer">
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="peer sr-only" />
      <div
        className={`border-4 border-pix-ink bg-pix-paper shadow-pix-sm transition-transform peer-checked:-translate-y-1 peer-checked:bg-pix-sun peer-checked:shadow-pix peer-focus-visible:outline-4 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-pix-orange ${className}`}
      >
        {children}
      </div>
      <span
        aria-hidden="true"
        className="absolute -top-3 -right-2 size-5 border-4 border-pix-ink bg-pix-green opacity-0 peer-checked:animate-pix-pop peer-checked:opacity-100"
      />
    </label>
  )
}
