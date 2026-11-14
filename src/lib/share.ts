import { formatClock } from './time.ts'

interface ShareInput {
  mountainName: string
  courseLabel: string
  finishMin: number
  sunsetMin: number
  /** 판정 제목(예: 도전 가능!) */
  verdictTitle: string
}

/** 공유 문구: "북한산 · 보통 코스 · 예상 하산 17:20 · 일몰 18:42 · 도전 가능" */
export function buildShareText(input: ShareInput): string {
  const title = input.verdictTitle.replace(/!$/, '')
  return [
    input.mountainName,
    input.courseLabel,
    `예상 하산 ${formatClock(input.finishMin)}`,
    `일몰 ${formatClock(input.sunsetMin)}`,
    title,
  ].join(' · ')
}

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed'

/**
 * 휴대폰에서는 공유 창(카카오톡 포함)을 띄우고, 지원하지 않는 기기에서는 문구를 복사한다.
 * 카카오 SDK(키 필요)는 쓰지 않는다.
 */
export async function shareText(text: string): Promise<ShareOutcome> {
  try {
    if (typeof navigator.share === 'function') {
      await navigator.share({ text })
      return 'shared'
    }
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch (error) {
    // 공유 창을 사용자가 닫은 경우는 실패가 아니라 취소다.
    if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
    return 'failed'
  }
}
