import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { joinClock, splitClock, type Meridiem } from '../lib/time.ts'
import { PANEL_BASE, TRIGGER_BASE } from './PixelSelect.tsx'

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const
// 입산 시각은 5분 단위로 고른다.
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] as const

interface Props {
  label: string
  /** 자정부터 분 */
  value: number
  onChange: (minutes: number) => void
  className?: string
}

const MERIDIEM_LABEL: Record<Meridiem, string> = { am: '오전', pm: '오후' }

function Choice({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-11 cursor-pointer border-4 border-pix-ink font-pix-display text-pix-body font-bold focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-pix-orange ${
        selected ? 'bg-pix-sun' : 'bg-pix-paper'
      }`}
    >
      {children}
    </button>
  )
}

/** 픽셀 톤 시간 선택창. 기본 시간 입력 대신 오전/오후, 시, 분을 눌러서 고른다. */
export function PixelTimePicker({ label, value, onChange, className = '' }: Props) {
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const { meridiem, hour12, minute } = splitClock(value)

  // 바깥을 누르면 닫는다.
  useEffect(() => {
    if (!open) return
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && open) {
      event.stopPropagation()
      setOpen(false)
    }
  }

  const minuteText = String(minute).padStart(2, '0')

  return (
    <div ref={rootRef} onKeyDown={onKeyDown} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen((prev) => !prev)}
        className={`${TRIGGER_BASE} ${open ? 'bg-pix-sun' : 'bg-pix-paper'}`}
      >
        <span className="block text-pix-caption">{label}</span>
        <span className="mt-1 flex min-h-8 items-center justify-between gap-2">
          <span className="font-pix-display text-pix-body font-bold">
            {MERIDIEM_LABEL[meridiem]} {hour12}:{minuteText}
          </span>
          <span aria-hidden="true" className={`font-pix-display text-pix-caption ${open ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </span>
      </button>

      {open && (
        <div id={`${id}-panel`} role="dialog" aria-label={label} className={`${PANEL_BASE} flex flex-col gap-3 p-3`}>
          <div className="grid grid-cols-2 gap-2">
            {(['am', 'pm'] as const).map((m) => (
              <Choice key={m} selected={meridiem === m} onClick={() => onChange(joinClock(m, hour12, minute))}>
                {MERIDIEM_LABEL[m]}
              </Choice>
            ))}
          </div>

          <div>
            <p className="mb-1 text-pix-caption">시</p>
            <div className="grid grid-cols-6 gap-2">
              {HOURS.map((h) => (
                <Choice key={h} selected={hour12 === h} onClick={() => onChange(joinClock(meridiem, h, minute))}>
                  {String(h)}
                </Choice>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-pix-caption">분</p>
            <div className="grid grid-cols-6 gap-2">
              {MINUTES.map((m) => (
                <Choice key={m} selected={minute === m} onClick={() => onChange(joinClock(meridiem, hour12, m))}>
                  {String(m).padStart(2, '0')}
                </Choice>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="min-h-11 cursor-pointer border-4 border-pix-ink bg-pix-ink font-pix-display text-pix-body font-bold text-pix-paper focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-pix-orange"
          >
            확인
          </button>
        </div>
      )}
    </div>
  )
}
