import {
  GAUGE_FULL_MARGIN_MIN,
  JUDGE_THRESHOLDS,
  REST_MIN,
  SAFE_FINISH_BEFORE_SUNSET_MIN,
  type Thresholds,
  type Verdict,
} from '../config.ts'

export interface JudgeInput {
  /** 입산(출발) 시각(자정부터 분) */
  nowMin: number
  /** 코스 왕복 소요 시간(분) */
  roundTripMin: number
  /** 일몰 시각(자정부터 분) */
  sunsetMin: number
}

export interface JudgeResult {
  /** 예상 하산 시각(자정부터 분). 자정을 넘으면 1440 이상 */
  finishMin: number
  /** 권장 하산 마감 시각(자정부터 분) = 일몰 - 80분 */
  recommendedFinishMin: number
  /** 여유 시간(분) = 일몰 - 예상 하산. 일몰보다 늦으면 음수 */
  marginMin: number
  verdict: Verdict
}

export function verdictFromMargin(marginMin: number, thresholds: Thresholds = JUDGE_THRESHOLDS): Verdict {
  if (marginMin >= thresholds.greenMin) return 'green'
  if (marginMin >= thresholds.yellowMin) return 'yellow'
  return 'red'
}

/** 예상 하산 = 입산 + 왕복 + 휴식 20분, 여유 = 일몰 - 예상 하산, 권장 하산 마감 = 일몰 - 80분 */
export function judgeDescent(input: JudgeInput, thresholds: Thresholds = JUDGE_THRESHOLDS): JudgeResult {
  const finishMin = input.nowMin + input.roundTripMin + REST_MIN
  const marginMin = input.sunsetMin - finishMin
  return {
    finishMin,
    recommendedFinishMin: input.sunsetMin - SAFE_FINISH_BEFORE_SUNSET_MIN,
    marginMin,
    verdict: verdictFromMargin(marginMin, thresholds),
  }
}

/** '일몰까지 남은 시간' 막대 길이(0~100%). GAUGE_FULL_MARGIN_MIN 이상이면 가득, 일몰 뒤 하산이면 0. */
export function marginPercent(marginMin: number): number {
  return Math.min(100, Math.max(0, (marginMin / GAUGE_FULL_MARGIN_MIN) * 100))
}
