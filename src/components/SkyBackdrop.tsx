import mountainSrc from '../assets/sprites/bg-mountain.png'
import forestSrc from '../assets/sprites/prop-forest.png'

export type SkyMood = 'dusk' | 'glow' | 'night'

// 하늘을 5단 색 띠로 나눠 그라데이션 대신 계단식으로 칠한다(8비트 느낌).
const BANDS: Record<SkyMood, readonly string[]> = {
  dusk: ['bg-pix-indigo', 'bg-pix-purple', 'bg-pix-pink', 'bg-pix-rose', 'bg-pix-peach'],
  glow: ['bg-pix-indigo', 'bg-pix-pink', 'bg-pix-orange', 'bg-pix-peach', 'bg-pix-sun'],
  night: ['bg-pix-night', 'bg-pix-navy', 'bg-pix-navy', 'bg-pix-indigo', 'bg-pix-purple'],
}

// 밤에는 산과 숲 그림을 어둡게 눌러 하늘과 어울리게 한다.
const SPRITE_TONE: Record<SkyMood, string> = {
  dusk: '',
  glow: '',
  night: 'brightness-50',
}

// 해: 행마다 너비가 다른 사각형을 쌓아 둥글게 보이게 한다(산 그림 뒤에 놓인다).
const SCALE = 2
const COLUMNS = 48 * SCALE
const ROWS = 16 * SCALE
const SUN_CENTER_X = 17 * SCALE
const SUN_TOP_ROW = 4 * SCALE
const SUN_ROW_WIDTHS = [2, 4, 6, 6, 4, 2].map((width) => width * SCALE)

const STARS = [
  { top: '6%', left: '10%' },
  { top: '14%', left: '72%' },
  { top: '22%', left: '34%' },
  { top: '9%', left: '52%' },
  { top: '30%', left: '88%' },
  { top: '34%', left: '18%' },
  { top: '18%', left: '92%' },
]

/** 그림을 이어 붙일 개수. 아주 넓은 화면(4K)까지 채우도록 넉넉히 잡는다. */
const TILE_COUNT = 9

interface SpriteRowProps {
  src: string
  /** 한 장의 가로 크기. 화면이 넓어도 그림이 늘어나 깨지지 않도록 화면 너비와 상관없이 고정한다 */
  widthClass: string
  className?: string
}

/**
 * 같은 그림을 가운데부터 좌우로 이어 붙여 화면 아래를 채운다.
 * 한 장씩 좌우를 뒤집어 놓아서 이음새에서 산 모양이 끊기지 않고 이어진다.
 */
function SpriteRow({ src, widthClass, className = '' }: SpriteRowProps) {
  return (
    <div className={`absolute inset-x-0 flex justify-center overflow-hidden ${className}`}>
      {Array.from({ length: TILE_COUNT }, (_, index) => (
        <img
          key={index}
          src={src}
          alt=""
          draggable={false}
          className={`pixelated h-auto shrink-0 ${widthClass} ${index % 2 === 1 ? '-scale-x-100' : ''}`}
        />
      ))}
    </div>
  )
}

interface Props {
  mood: SkyMood
}

export function SkyBackdrop({ mood }: Props) {
  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 flex flex-col overflow-hidden">
      {BANDS[mood].map((band, index) => (
        <div key={index} className={`flex-1 transition-colors duration-700 ${band}`} />
      ))}

      {mood === 'night' &&
        STARS.map((star, index) => (
          <span
            key={index}
            className="absolute size-1 bg-pix-paper animate-pix-blink"
            style={{ ...star, animationDelay: `${index * 0.3}s` }}
          />
        ))}

      {mood !== 'night' && (
        <svg
          viewBox={`0 0 ${COLUMNS} ${ROWS}`}
          preserveAspectRatio="xMidYMax slice"
          shapeRendering="crispEdges"
          className="absolute inset-x-0 bottom-0 h-1/3 w-full"
        >
          {SUN_ROW_WIDTHS.map((width, row) => (
            <rect
              key={row}
              x={SUN_CENTER_X - width / 2}
              y={SUN_TOP_ROW + row * SCALE}
              width={width}
              height={SCALE}
              className="fill-pix-sun"
            />
          ))}
        </svg>
      )}

      {/* Figma 스프라이트: 멀리 산 → 앞쪽 숲 순서로 아래에 깐다 */}
      {/* 휴대폰은 아래 고정 버튼 위로 봉우리가 보이도록 높게, PC(md 이상)는 더 아래로 내린다. */}
      <SpriteRow src={mountainSrc} widthClass="w-144" className={`bottom-16 md:bottom-8 ${SPRITE_TONE[mood]}`} />
      <SpriteRow src={forestSrc} widthClass="w-140" className={`bottom-0 ${SPRITE_TONE[mood]}`} />
    </div>
  )
}
