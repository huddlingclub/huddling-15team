import greenSrc from '../assets/sprites/light-green.png'
import yellowSrc from '../assets/sprites/light-yellow.png'
import redSrc from '../assets/sprites/light-red.png'
import type { DayOffset, Verdict } from '../config.ts'

// Figma 신호등 스프라이트(램프 + 판정 라벨 말풍선이 한 장에 들어 있다)
const SPRITE: Record<Verdict, string> = {
  green: greenSrc,
  yellow: yellowSrc,
  red: redSrc,
}

const LABEL: Record<Verdict, string> = {
  green: '초록불, 해 지기 전에 하산할 수 있어요',
  yellow: '노란불, 시간이 빠듯해요',
  red: '빨간불, 오늘은 쉬는 걸 추천해요',
}

const RED_TOMORROW_LABEL = '빨간불, 내일 이 시각은 추천하지 않아요'

interface Props {
  verdict: Verdict
  day: DayOffset
}

/** 판정에 맞는 신호등 그림 하나를 통통 튀며 보여준다. */
export function TrafficLight({ verdict, day }: Props) {
  return (
    <img
      src={SPRITE[verdict]}
      alt={verdict === 'red' && day === 'tomorrow' ? RED_TOMORROW_LABEL : LABEL[verdict]}
      draggable={false}
      className="pixelated h-40 w-auto select-none animate-pix-pop"
    />
  )
}
