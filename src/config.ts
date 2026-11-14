export type Verdict = 'green' | 'yellow' | 'red'
export type CourseId = 'short' | 'normal' | 'long'
export type MountainId = 'bukhan' | 'gwanak' | 'inwang'

export interface Thresholds {
  /** 여유 시간(분)이 이 값 이상이면 초록 */
  greenMin: number
  /** 여유 시간(분)이 이 값 이상 greenMin 미만이면 노랑, 미만이면 빨강 */
  yellowMin: number
}

/** 판정 기준. 팀에서 숫자를 바꾸면 이 한 곳만 고치면 된다. */
export const JUDGE_THRESHOLDS: Thresholds = { greenMin: 60, yellowMin: 20 }

/** 예상 하산 시각에 더하는 휴식 시간(분). 정상에서 쉬는 시간을 감안한다. */
export const REST_MIN = 20

/** 권장 하산 마감 = 일몰 - 이 값(분). 해 지기 전에 여유 있게 내려오기 위한 기준선이다. */
export const SAFE_FINISH_BEFORE_SUNSET_MIN = 80

export type DayOffset = 'today' | 'tomorrow'

/** 내일 산행으로 볼 때 입산 시간 칸에 미리 채워 주는 시각(자정부터 분). 09:00 */
export const TOMORROW_DEFAULT_DEPART_MIN = 9 * 60

export const TIMEZONE = 'Asia/Seoul'

/** 계산 중 화면을 최소 이 시간(ms) 동안은 보여준다. 로딩 연출이 깜빡이듯 지나가지 않게 하려는 값. */
export const MIN_LOADING_MS = 1400

/**
 * 직접 입력한 일몰 시각으로 받아들이는 범위(자정부터 분). 한국의 일몰은 대략 16:50~19:55라서
 * 여유를 두고 16:00~21:00으로 잡는다. 05:00처럼 오타가 난 값이 판정에 쓰이지 않게 막는 용도다.
 */
export const MANUAL_SUNSET_RANGE_MIN = { from: 16 * 60, to: 21 * 60 } as const

export const SUNSET_API = {
  baseUrl: 'https://api.open-meteo.com/v1/forecast',
  timeoutMs: 8000,
} as const

export interface Course {
  id: CourseId
  label: string
}

export const COURSES: readonly Course[] = [
  { id: 'short', label: '짧은 코스' },
  { id: 'normal', label: '보통 코스' },
  { id: 'long', label: '긴 코스' },
]

export interface Mountain {
  id: MountainId
  name: string
  summit: string
  elevationM: number
  latitude: number
  longitude: number
  /** 들머리(등산 시작 지점) 목록. 예시 데이터라 팀에서 실제 이름을 확인해야 한다. */
  trailheads: readonly string[]
  /** MVP용 고정 예시 데이터: 코스별 왕복 소요 시간(분) */
  roundTripMin: Record<CourseId, number>
}

export const MOUNTAINS: readonly Mountain[] = [
  {
    id: 'bukhan',
    name: '북한산',
    summit: '백운대',
    elevationM: 836,
    latitude: 37.6591,
    longitude: 126.9774,
    trailheads: ['북한산성 탐방지원센터', '우이 탐방안내소', '정릉 탐방지원센터'],
    roundTripMin: { short: 150, normal: 240, long: 360 },
  },
  {
    id: 'gwanak',
    name: '관악산',
    summit: '연주대',
    elevationM: 629,
    latitude: 37.444,
    longitude: 126.964,
    trailheads: ['과천 관악산 입구', '서울대 입구'],
    roundTripMin: { short: 120, normal: 210, long: 300 },
  },
  {
    id: 'inwang',
    name: '인왕산',
    summit: '정상',
    elevationM: 338,
    latitude: 37.5849,
    longitude: 126.9578,
    trailheads: ['무악재 하늘다리', '사직공원'],
    roundTripMin: { short: 60, normal: 100, long: 150 },
  },
]
