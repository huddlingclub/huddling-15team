import { Penguin } from '../components/Penguin.tsx'

const BLOCKS = 8
const BLOCK_STEP_S = 0.15

interface Props {
  mountainName: string
}

export function CalculatingScreen({ mountainName }: Props) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-96 flex-col items-center justify-center gap-8">
      <h1 className="sr-only">계산 중</h1>
      <Penguin mood="happy" size="lg" />
      <div className="flex gap-1" aria-hidden="true">
        {Array.from({ length: BLOCKS }, (_, index) => (
          <span
            key={index}
            className="size-4 border-4 border-pix-ink bg-pix-sun animate-pix-block"
            style={{ animationDelay: `${index * BLOCK_STEP_S}s` }}
          />
        ))}
      </div>
      <p className="border-4 border-pix-ink bg-pix-ink px-3 py-2 text-center text-pix-paper shadow-pix">
        {mountainName}의 일몰 시각을 확인하는 중
        <span aria-hidden="true" className="animate-pix-blink">
          ...
        </span>
      </p>
    </div>
  )
}
