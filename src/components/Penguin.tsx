import idleSrc from '../assets/sprites/penguin-idle.png'
import excitedSrc from '../assets/sprites/penguin-excited.png'
import cheerSrc from '../assets/sprites/penguin-happy.png'
import worriedSrc from '../assets/sprites/penguin-worried.png'
import restSrc from '../assets/sprites/penguin-rest.png'
import type { PenguinMood } from '../content.ts'

type Size = 'sm' | 'md' | 'lg'

// 스프라이트마다 가로세로 비율이 달라서 높이만 정하고 너비는 자동으로 둔다.
const SIZE: Record<Size, string> = {
  sm: 'h-20 w-auto',
  md: 'h-28 w-auto',
  lg: 'h-36 w-auto',
}

// Figma Sprites 시트에서 자른 표정별 그림. 의상·장식은 덧붙이지 않는다.
const SPRITE: Record<PenguinMood, string> = {
  idle: idleSrc,
  happy: excitedSrc,
  cheer: cheerSrc,
  worried: worriedSrc,
  sad: restSrc,
}

// 표정은 그림으로, 움직임은 애니메이션으로 더한다.
const MOTION: Record<PenguinMood, string> = {
  idle: 'animate-pix-bob',
  happy: 'animate-pix-hop',
  cheer: 'animate-pix-bob',
  worried: 'animate-pix-wobble',
  sad: 'animate-pix-droop',
}

interface Props {
  mood?: PenguinMood
  size?: Size
}

export function Penguin({ mood = 'idle', size = 'md' }: Props) {
  return (
    <img
      src={SPRITE[mood]}
      alt="펭산이"
      draggable={false}
      className={`pixelated select-none object-contain ${SIZE[size]} ${MOTION[mood]}`}
    />
  )
}
