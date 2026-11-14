import type { MountainId } from '../config.ts'

/**
 * 스탬프 배지. 이 앱은 출발 "전"에 계획을 보는 앱이라 실제 귀환 여부는 알 수 없다.
 * 그래서 배지는 안전하게 계획하는 행동에만 준다(귀환 인증이 아니다).
 */
export type BadgeId = 'first-check' | 'green-light' | 'three-mountains' | 'short-saver' | 'wise-choice' | 'ready'

export interface BadgeInfo {
  id: BadgeId
  name: string
  /** 획득 조건 설명 */
  hint: string
}

export const BADGES: readonly BadgeInfo[] = [
  { id: 'first-check', name: '첫 출발 준비', hint: '처음으로 하산 가능 여부를 확인했어요' },
  { id: 'green-light', name: '초록불 획득', hint: '초록불 판정을 받았어요' },
  { id: 'three-mountains', name: '세 산 탐험가', hint: '세 산을 모두 확인했어요' },
  { id: 'short-saver', name: '코스 줄이기 달인', hint: '코스를 줄여서 초록불을 만들었어요' },
  { id: 'wise-choice', name: '쉬어가는 용기', hint: '빨간불에 무리하지 않고 내일로 미뤘어요' },
  { id: 'ready', name: '준비물 완벽', hint: '준비물을 모두 챙겼어요' },
]

export interface StampState {
  /** 배지 id → 획득한 날짜(YYYY-MM-DD) */
  earned: Partial<Record<BadgeId, string>>
  /** 판정을 확인해 본 산 */
  mountains: MountainId[]
}

export const EMPTY_STAMPS: StampState = { earned: {}, mountains: [] }

const STORAGE_KEY = 'pengsan-stamps-v1'
const BADGE_IDS = new Set<string>(BADGES.map((badge) => badge.id))
const MOUNTAIN_IDS = new Set<string>(['bukhan', 'gwanak', 'inwang'])

/** 배지를 새로 얻었으면 새 상태를, 이미 가지고 있으면 같은 상태를 돌려준다. */
export function grantBadge(state: StampState, id: BadgeId, dateKey: string): StampState {
  if (state.earned[id]) return state
  return { ...state, earned: { ...state.earned, [id]: dateKey } }
}

export function recordMountain(state: StampState, id: MountainId): StampState {
  if (state.mountains.includes(id)) return state
  return { ...state, mountains: [...state.mountains, id] }
}

/** 저장된 글자를 읽어 상태로 바꾼다. 형식이 틀리거나 모르는 값은 버린다. */
export function parseStamps(raw: string | null): StampState {
  if (!raw) return EMPTY_STAMPS
  try {
    const data: unknown = JSON.parse(raw)
    if (typeof data !== 'object' || data === null) return EMPTY_STAMPS
    const { earned, mountains } = data as { earned?: unknown; mountains?: unknown }

    const cleanEarned: StampState['earned'] = {}
    if (typeof earned === 'object' && earned !== null) {
      for (const [id, date] of Object.entries(earned)) {
        if (BADGE_IDS.has(id) && typeof date === 'string') cleanEarned[id as BadgeId] = date
      }
    }
    const cleanMountains = Array.isArray(mountains)
      ? mountains.filter((id): id is MountainId => typeof id === 'string' && MOUNTAIN_IDS.has(id))
      : []
    return { earned: cleanEarned, mountains: [...new Set(cleanMountains)] }
  } catch {
    return EMPTY_STAMPS
  }
}

// 사생활 보호 모드 등에서 저장소가 막혀 있어도 앱은 그대로 동작해야 한다.
export function loadStamps(): StampState {
  try {
    return parseStamps(localStorage.getItem(STORAGE_KEY))
  } catch {
    return EMPTY_STAMPS
  }
}

export function saveStamps(state: StampState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // 저장에 실패해도 이번 방문 동안은 화면에 보인다.
  }
}
