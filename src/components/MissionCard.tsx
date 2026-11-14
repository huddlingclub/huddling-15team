import { PixelCard } from './PixelCard.tsx'

interface Props {
  /** 첫 번째 미션(안전하게 하산하기)이 달성 가능(또는 준비 완료) 상태인지 */
  done: boolean
  /** done일 때 붙는 표시 글자 */
  doneLabel?: string
  /** 카드 아래에 붙는 한 줄 설명 */
  note?: string
  className?: string
}

type Tone = 'goal' | 'done' | 'bonus'

// 눌러서 체크하는 칸처럼 보이지 않도록 네모 체크박스 대신 글자 표시(칩)로 상태를 알린다.
const CHIP: Record<Tone, string> = {
  goal: 'bg-pix-ink text-pix-sun',
  done: 'bg-pix-green text-pix-ink',
  bonus: 'bg-pix-paper-shade text-pix-ink-soft',
}

function Mission({ label, chip, tone }: { label: string; chip: string; tone: Tone }) {
  return (
    <li className={`flex items-center gap-3 ${tone === 'bonus' ? 'text-pix-ink-soft' : ''}`}>
      <span
        className={`w-20 shrink-0 border-4 border-pix-ink px-1 py-0.5 text-center font-pix-display text-pix-caption font-bold ${CHIP[tone]}`}
      >
        {chip}
      </span>
      <span className="font-pix-display text-pix-body font-bold">{label}</span>
    </li>
  )
}

/** 오늘의 미션 카드. 미션은 정상 정복이 아니라 안전한 귀환이다. 눌러서 바꾸는 카드가 아니라 상태를 보여주는 카드다. */
export function MissionCard({ done, doneLabel = '달성 가능!', note, className = '' }: Props) {
  return (
    <PixelCard tag="오늘의 미션" className={className}>
      <ul className="mt-2 flex flex-col gap-3">
        <Mission label="안전하게 하산하기" chip={done ? doneLabel : '목표'} tone={done ? 'done' : 'goal'} />
        <Mission label="정상에 오르기" chip="보너스" tone="bonus" />
      </ul>
      {note && <p className="mt-3 text-pix-caption">{note}</p>}
    </PixelCard>
  )
}
