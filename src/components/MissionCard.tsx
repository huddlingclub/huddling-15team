import { PixelCard } from './PixelCard.tsx'

interface Props {
  /** 첫 번째 미션(안전하게 하산하기)을 달성(또는 달성 가능) 상태로 보여줄지 */
  done: boolean
  /** 카드 아래에 붙는 한 줄 설명 */
  note?: string
  className?: string
}

function Mission({ label, checked, dim = false }: { label: string; checked: boolean; dim?: boolean }) {
  return (
    <li className={`flex items-center gap-3 ${dim ? 'text-pix-ink-soft' : ''}`}>
      <span
        aria-hidden="true"
        className={`size-6 shrink-0 border-4 border-pix-ink ${checked ? 'bg-pix-green' : 'bg-pix-paper'}`}
      />
      <span className="font-pix-display text-pix-body font-bold">{label}</span>
      <span className="sr-only">{checked ? '달성' : '아직'}</span>
    </li>
  )
}

/** 오늘의 미션 카드. 미션은 정상 정복이 아니라 안전한 귀환이다. */
export function MissionCard({ done, note, className = '' }: Props) {
  return (
    <PixelCard tag="오늘의 미션" className={className}>
      <ul className="mt-2 flex flex-col gap-3">
        <Mission label="안전하게 하산하기" checked={done} />
        <Mission label="정상에 오르기 (보너스)" checked={false} dim />
      </ul>
      {note && <p className="mt-3 text-pix-caption">{note}</p>}
    </PixelCard>
  )
}
