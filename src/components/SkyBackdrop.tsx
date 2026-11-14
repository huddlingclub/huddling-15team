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

interface Props {
  mood: SkyMood
}

export function SkyBackdrop({ mood }: Props) {
  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 flex flex-col">
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
      <img
        src={mountainSrc}
        alt=""
        draggable={false}
        className={`pixelated absolute inset-x-0 bottom-0 w-full ${SPRITE_TONE[mood]}`}
      />
      <img
        src={forestSrc}
        alt=""
        draggable={false}
        className={`pixelated absolute inset-x-0 bottom-0 w-full ${SPRITE_TONE[mood]}`}
      />
    </div>
  )
}
