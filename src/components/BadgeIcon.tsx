import treeSrc from '../assets/sprites/prop-tree.png'
import signpostSrc from '../assets/sprites/prop-signpost.png'
import sunSrc from '../assets/sprites/icon-sun.png'
import mountainSrc from '../assets/sprites/icon-mountain.png'
import sparkleSrc from '../assets/sprites/icon-sparkle.png'
import restSrc from '../assets/sprites/penguin-rest.png'
import type { BadgeId } from '../lib/badges.ts'

// Figma 스프라이트를 배지 그림으로 재사용한다.
const ICON: Record<BadgeId, string> = {
  'first-check': signpostSrc,
  'green-light': sunSrc,
  'three-mountains': mountainSrc,
  'short-saver': treeSrc,
  'wise-choice': restSrc,
  ready: sparkleSrc,
}

interface Props {
  id: BadgeId
  /** 아직 못 받은 배지는 흐리게 보여준다 */
  locked?: boolean
}

export function BadgeIcon({ id, locked = false }: Props) {
  return (
    <img
      src={ICON[id]}
      alt=""
      draggable={false}
      className={`pixelated h-12 w-auto select-none ${locked ? 'opacity-40 grayscale' : ''}`}
    />
  )
}
