import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary'

// 에셋 카탈로그의 노란 버튼(주요 동작)과 라벤더 버튼(보조 동작)
const VARIANT: Record<Variant, string> = {
  primary: 'pix-skin-yellow',
  secondary: 'pix-skin-lavender',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function PixelButton({ variant = 'primary', className = '', ...rest }: Props) {
  return (
    <button
      type="button"
      className={`w-full cursor-pointer px-5 py-2 font-pix-display text-pix-heading font-bold text-pix-ink transition-transform focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-pix-sun active:translate-x-1 active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-60 disabled:grayscale ${VARIANT[variant]} ${className}`}
      {...rest}
    />
  )
}
