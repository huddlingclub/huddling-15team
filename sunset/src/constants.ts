// ─────────────────────────────────────────────────────────────
// 산셋 SUNSET · MVP 고정 데이터 & 판정 기준 상수
// 산/들머리/코스 시간, 판정 기준은 모두 여기서만 수정하세요.
// ─────────────────────────────────────────────────────────────

export type CourseKey = 'short' | 'normal' | 'long';
export type Verdict = 'green' | 'yellow' | 'red';

export interface Trailhead {
  id: string;
  name: string;
}

export interface Mountain {
  id: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
  trailheads: Trailhead[];
  /** 코스별 왕복 소요 시간(분) */
  courses: Record<CourseKey, number>;
}

/** 판정 기준 (분) */
export const RULES = {
  /** 휴식 시간: 예상 하산 = 입산 + 왕복 + 휴식 */
  REST_MIN: 20,
  /** 권장 하산 마감 = 일몰 − 이 값 */
  SAFE_BUFFER_MIN: 80,
  /** 여유 시간이 이 값 이상이면 🟢 */
  GREEN_MIN: 60,
  /** 여유 시간이 이 값 이상이면 🟡, 미만이면 🔴 */
  YELLOW_MIN: 20,
} as const;

export const API_CONFIG = {
  BASE_URL: 'https://api.open-meteo.com/v1/forecast',
  TIMEZONE: 'Asia/Seoul',
  TIMEOUT_MS: 8000,
} as const;

/** 날짜 드롭다운에 보여줄 일 수 (오늘 포함) */
export const DATE_RANGE_DAYS = 7;
/** 게이지 칸 수 */
export const GAUGE_SEGMENTS = 12;
/** 로딩 애니메이션 최소 노출 시간(ms) */
export const MIN_LOADING_MS = 1100;

export const COURSE_ORDER: CourseKey[] = ['short', 'normal', 'long'];

export const COURSE_LABEL: Record<CourseKey, string> = {
  short: '짧은 코스',
  normal: '보통 코스',
  long: '긴 코스',
};

export const COURSE_COLOR: Record<CourseKey, string> = {
  short: '#37b24d',
  normal: '#f59f00',
  long: '#e8590c',
};

export const MOUNTAINS: Mountain[] = [
  {
    id: 'bukhansan',
    name: '북한산',
    region: '서울',
    lat: 37.6584,
    lon: 126.9779,
    trailheads: [
      { id: 'bukhansanseong', name: '북한산성 탐방지원센터' },
      { id: 'ui', name: '우이 탐방지원센터' },
      { id: 'gugi', name: '구기 탐방지원센터' },
    ],
    courses: { short: 90, normal: 160, long: 240 },
  },
  {
    id: 'gwanaksan',
    name: '관악산',
    region: '서울',
    lat: 37.4446,
    lon: 126.9637,
    trailheads: [
      { id: 'gwanak-park', name: '관악산공원 입구' },
      { id: 'sadang', name: '사당역 들머리' },
      { id: 'gwacheon', name: '과천향교 들머리' },
    ],
    courses: { short: 80, normal: 150, long: 220 },
  },
  {
    id: 'inwangsan',
    name: '인왕산',
    region: '서울',
    lat: 37.5852,
    lon: 126.9583,
    trailheads: [
      { id: 'sajikdan', name: '사직단 들머리' },
      { id: 'suseongdong', name: '수성동계곡 들머리' },
      { id: 'dongnimmun', name: '독립문 들머리' },
    ],
    courses: { short: 50, normal: 80, long: 120 },
  },
];

export interface VerdictMeta {
  chip: string;
  title: string;
  line: string;
  bubble: string | null;
  shareLabel: string;
  color: string;
  dark: string;
  icon: string;
}

export const VERDICT_META: Record<Verdict, VerdictMeta> = {
  green: {
    chip: 'RESULT · GREEN',
    title: '도전 가능!',
    line: '해 지기 전에 내려올 수 있어!',
    bubble: null,
    shareLabel: '도전 가능',
    color: '#2fb344',
    dark: '#1b7a2c',
    icon: '●',
  },
  yellow: {
    chip: 'RESULT · YELLOW',
    title: '주의 필요!',
    line: '시간이 빠듯해! 짧은 코스는 어때?',
    bubble: '정상보다 안전한\n귀환이 더 중요해!',
    shareLabel: '주의 필요',
    color: '#f2a900',
    dark: '#a86f00',
    icon: '▲',
  },
  red: {
    chip: 'RESULT · RED',
    title: '오늘은 비추천!',
    line: '오늘은 쉬고 다음에 도전하자!',
    bubble: '해가 진 뒤 산길은 위험해.\n다음 기회를 준비하자!',
    shareLabel: '비추천',
    color: '#e03131',
    dark: '#9b1c1c',
    icon: '■',
  },
};

export const CHECKLIST_ITEMS = [
  { id: 'lantern', label: '랜턴 또는 헤드랜턴', icon: 'lantern' },
  { id: 'battery', label: '보조 배터리', icon: 'battery' },
  { id: 'water', label: '충분한 물과 간식', icon: 'water' },
  { id: 'contact', label: '비상 연락처 저장', icon: 'phone' },
] as const;

export const DISCLAIMER = '※ 예상치이며 실제 안전을 보장하지 않는 참고용 결과입니다.';
