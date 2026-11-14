import type { DayOffset, Verdict } from './config.ts'

export const SLOGAN = '지금 올라가면, 해 지기 전에 내려올 수 있을까?'

export const DISCLAIMER = '참고용 결과예요. 실제 안전을 보장하지 않으니 날씨와 체력, 현장 상황을 꼭 함께 확인해요.'

export type PenguinMood = 'idle' | 'happy' | 'cheer' | 'worried' | 'sad'

interface VerdictCopy {
  badge: string
  bubble: string
  /** 펭귄 장면 말풍선(Figma 와이어프레임 문구). 초록은 말풍선 없이 펭귄만 보여준다. */
  scene: string | null
  mood: PenguinMood
  guide: string
}

/** 판정별 문구. 말풍선 문구는 기획서 원문 그대로 쓴다. */
export const VERDICT_COPY: Record<Verdict, VerdictCopy> = {
  green: {
    badge: '도전 가능!',
    bubble: '해 지기 전에 내려올 수 있어!',
    scene: null,
    mood: 'happy',
    guide: '여유가 있어도 방심은 금물이에요. 하산을 시작할 시각을 미리 정하고, 그 시각이 되면 어디서든 내려와요.',
  },
  yellow: {
    badge: '주의 필요!',
    bubble: '시간이 빠듯해! 짧은 코스는 어때?',
    scene: '정상보다 안전한 귀환이 더 중요해!',
    mood: 'worried',
    guide: '정상까지 가지 말고 중간에서 내려오는 걸 추천해요. 정해둔 하산 시각을 넘기지 않는 게 가장 중요해요.',
  },
  red: {
    badge: '오늘은 비추천!',
    bubble: '오늘은 쉬고 다음에 도전하자!',
    scene: '해가 진 뒤 산길은 위험해. 다음 기회를 준비하자!',
    mood: 'sad',
    guide: '오늘은 해가 지기 전에 내려오기 어려워요. 무리하지 말고 다음에 더 이른 시각에 출발해요.',
  },
}

/** 내일 판정에서 빨강이면 "오늘"이 들어간 문구 대신 쓴다. */
const RED_TOMORROW_COPY: Pick<VerdictCopy, 'badge' | 'bubble' | 'guide'> = {
  badge: '내일은 비추천!',
  bubble: '내일 이 시각은 무리야! 더 일찍 출발하자!',
  guide: '내일 이 시각에 출발하면 해가 지기 전에 내려오기 어려워요. 입산 시각을 앞당기거나 더 짧은 코스를 골라요.',
}

/** 판정과 날짜(오늘/내일)에 맞는 문구 */
export function verdictCopy(verdict: Verdict, day: DayOffset): VerdictCopy {
  const copy = VERDICT_COPY[verdict]
  return verdict === 'red' && day === 'tomorrow' ? { ...copy, ...RED_TOMORROW_COPY } : copy
}

export interface ChecklistItem {
  id: string
  label: string
  hint: string
}

export const CHECKLIST: readonly ChecklistItem[] = [
  { id: 'lantern', label: '랜턴', hint: '해가 진 뒤에도 길을 밝혀줘요' },
  { id: 'battery', label: '배터리', hint: '휴대폰과 랜턴 모두 충전해요' },
  { id: 'water', label: '물', hint: '넉넉하게 챙겨요' },
  { id: 'contact', label: '비상 연락처', hint: '119와 가족·지인 번호를 저장해요' },
]
