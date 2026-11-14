import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'

/** 닫힌 상태의 선택 카드 모양. 시간 선택창(PixelTimePicker)과 같은 모양을 쓰려고 내보낸다. */
export const TRIGGER_BASE =
  'block w-full cursor-pointer border-4 border-pix-ink px-3 py-2 text-left shadow-pix-sm focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-pix-orange disabled:cursor-not-allowed disabled:bg-pix-paper-shade disabled:text-pix-ink-soft disabled:shadow-none'

/** 열린 목록 상자. 선택 카드 바로 아래에 붙도록 -mt-1로 테두리를 살짝 겹친다. */
export const PANEL_BASE = 'absolute inset-x-0 top-full z-20 -mt-1 border-4 border-pix-ink bg-pix-paper shadow-pix animate-pix-pop'

export interface PixelOption {
  value: string
  label: string
}

interface Props {
  label: string
  value: string
  options: readonly PixelOption[]
  onChange: (value: string) => void
  disabled?: boolean
  /** 선택값이 없을 때 보여 줄 글자 */
  placeholder?: string
  className?: string
}

/**
 * 픽셀 톤 드롭다운. 기본 select 상자는 목록 모양을 바꿀 수 없어서 직접 만들었다.
 * 키보드(↑ ↓ Enter Esc)와 스크린리더는 select-only combobox 패턴을 따른다.
 */
export function PixelSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
  placeholder = '선택해줘',
  className = '',
}: Props) {
  const id = useId()
  const listId = `${id}-list`
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const selectedIndex = options.findIndex((option) => option.value === value)
  const [active, setActive] = useState(Math.max(selectedIndex, 0))

  // 바깥을 누르면 닫는다.
  useEffect(() => {
    if (!open) return
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  const openList = () => {
    setActive(Math.max(selectedIndex, 0))
    setOpen(true)
  }

  const choose = (index: number) => {
    const option = options[index]
    if (option) onChange(option.value)
    setOpen(false)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault()
        if (!open) return openList()
        const step = event.key === 'ArrowDown' ? 1 : -1
        setActive((index) => (index + step + options.length) % options.length)
        return
      }
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (open) choose(active)
        else openList()
        return
      case 'Escape':
        if (open) {
          event.preventDefault()
          setOpen(false)
        }
        return
      case 'Tab':
        setOpen(false)
    }
  }

  const current = options[selectedIndex]

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${id}-option-${active}` : undefined}
        aria-labelledby={`${id}-label ${id}-value`}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={`${TRIGGER_BASE} ${open ? 'bg-pix-sun' : 'bg-pix-paper'}`}
      >
        <span id={`${id}-label`} className="block text-pix-caption">
          {label}
        </span>
        <span className="mt-1 flex min-h-8 items-center justify-between gap-2">
          <span id={`${id}-value`} className="font-pix-display text-pix-body font-bold">
            {current?.label ?? placeholder}
          </span>
          <span
            aria-hidden="true"
            className={`font-pix-display text-pix-caption ${open ? 'rotate-180' : ''}`}
          >
            ▼
          </span>
        </span>
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className={PANEL_BASE}
        >
          {options.map((option, index) => {
            const selected = index === selectedIndex
            return (
              <li
                key={option.value}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={selected}
                onPointerEnter={() => setActive(index)}
                onClick={() => choose(index)}
                className={`flex min-h-11 cursor-pointer items-center gap-2 border-pix-ink px-3 py-2 font-pix-display text-pix-body font-bold ${
                  index > 0 ? 'border-t-4' : ''
                } ${index === active ? 'bg-pix-sun' : ''}`}
              >
                <span aria-hidden="true" className="w-3 shrink-0 text-pix-caption">
                  {selected ? '▶' : ''}
                </span>
                {option.label}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
