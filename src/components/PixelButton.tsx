import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary'

const VARIANT: Record<Variant, string> = {
  primary: 'bg-pix-orange text-pix-ink',
  secondary: 'bg-pix-paper text-pix-ink',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function PixelButton({ variant = 'primary', className = '', ...rest }: Props) {
  return (
    <button
      type="button"
      className={`w-full cursor-pointer border-4 border-pix-ink px-4 py-3 font-pix-display text-pix-heading font-bold shadow-pix-btn transition-transform focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-pix-sun active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:bg-pix-paper-shade disabled:text-pix-ink-soft disabled:shadow-none ${VARIANT[variant]} ${className}`}
      {...rest}
    />
  )
}
