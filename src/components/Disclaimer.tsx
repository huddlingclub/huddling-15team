import { DISCLAIMER } from '../content.ts'

export function Disclaimer() {
  return (
    <p className="border-4 border-pix-ink bg-pix-ink px-3 py-2 text-pix-body text-pix-paper">
      <span aria-hidden="true">※ </span>
      {DISCLAIMER}
    </p>
  )
}
