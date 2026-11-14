import { forwardRef } from 'react'

interface Props {
  children: string
}

/** 게임 타이틀 판. 배경 하늘색이 바뀌어도 글자 대비가 유지되도록 어두운 판 위에 올린다. */
export const TitlePlate = forwardRef<HTMLHeadingElement, Props>(function TitlePlate({ children }, ref) {
  return (
    <h1
      ref={ref}
      tabIndex={-1}
      className="border-4 border-pix-ink bg-pix-ink px-3 py-2 text-balance font-pix-display text-pix-title font-bold text-pix-sun shadow-pix outline-none"
    >
      {children}
    </h1>
  )
})
