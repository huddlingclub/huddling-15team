import type { ReactNode } from 'react'
import skySrc from '../assets/sprites/bg-sky-sunset.png'

interface Props {
  children: ReactNode
  className?: string
}

/** 노을 하늘 그림을 깐 장면 패널. 안에 펭귄과 말풍선을 올린다. */
export function ScenePanel({ children, className = '' }: Props) {
  return (
    <div className={`relative overflow-hidden border-4 border-pix-ink shadow-pix ${className}`}>
      <img
        src={skySrc}
        alt=""
        draggable={false}
        className="pixelated absolute inset-0 size-full object-cover"
      />
      <div className="relative flex items-center justify-center gap-4 p-4">{children}</div>
    </div>
  )
}
