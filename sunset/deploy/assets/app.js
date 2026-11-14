(function(){
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
const {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback
} = React;
// ---- src/constants.ts ----
// ─────────────────────────────────────────────────────────────
// 산셋 SUNSET · MVP 고정 데이터 & 판정 기준 상수
// 산/들머리/코스 시간, 판정 기준은 모두 여기서만 수정하세요.
// ─────────────────────────────────────────────────────────────

/** 판정 기준 (분) */
const RULES = {
  /** 휴식 시간: 예상 하산 = 입산 + 왕복 + 휴식 */
  REST_MIN: 20,
  /** 권장 하산 마감 = 일몰 − 이 값 */
  SAFE_BUFFER_MIN: 80,
  /** 여유 시간이 이 값 이상이면 🟢 */
  GREEN_MIN: 60,
  /** 여유 시간이 이 값 이상이면 🟡, 미만이면 🔴 */
  YELLOW_MIN: 20
};
const API_CONFIG = {
  BASE_URL: 'https://api.open-meteo.com/v1/forecast',
  TIMEZONE: 'Asia/Seoul',
  TIMEOUT_MS: 8000
};

/** 날짜 드롭다운에 보여줄 일 수 (오늘 포함) */
const DATE_RANGE_DAYS = 7;
/** 게이지 칸 수 */
const GAUGE_SEGMENTS = 12;
/** 로딩 애니메이션 최소 노출 시간(ms) */
const MIN_LOADING_MS = 1100;
const COURSE_ORDER = ['short', 'normal', 'long'];
const COURSE_LABEL = {
  short: '짧은 코스',
  normal: '보통 코스',
  long: '긴 코스'
};
const COURSE_COLOR = {
  short: '#37b24d',
  normal: '#f59f00',
  long: '#e8590c'
};
const MOUNTAINS = [{
  id: 'bukhansan',
  name: '북한산',
  region: '서울',
  lat: 37.6584,
  lon: 126.9779,
  trailheads: [{
    id: 'bukhansanseong',
    name: '북한산성 탐방지원센터'
  }, {
    id: 'ui',
    name: '우이 탐방지원센터'
  }, {
    id: 'gugi',
    name: '구기 탐방지원센터'
  }],
  courses: {
    short: 90,
    normal: 160,
    long: 240
  }
}, {
  id: 'gwanaksan',
  name: '관악산',
  region: '서울',
  lat: 37.4446,
  lon: 126.9637,
  trailheads: [{
    id: 'gwanak-park',
    name: '관악산공원 입구'
  }, {
    id: 'sadang',
    name: '사당역 들머리'
  }, {
    id: 'gwacheon',
    name: '과천향교 들머리'
  }],
  courses: {
    short: 80,
    normal: 150,
    long: 220
  }
}, {
  id: 'inwangsan',
  name: '인왕산',
  region: '서울',
  lat: 37.5852,
  lon: 126.9583,
  trailheads: [{
    id: 'sajikdan',
    name: '사직단 들머리'
  }, {
    id: 'suseongdong',
    name: '수성동계곡 들머리'
  }, {
    id: 'dongnimmun',
    name: '독립문 들머리'
  }],
  courses: {
    short: 50,
    normal: 80,
    long: 120
  }
}];
const VERDICT_META = {
  green: {
    chip: 'RESULT · GREEN',
    title: '도전 가능!',
    line: '해 지기 전에 내려올 수 있어!',
    bubble: null,
    shareLabel: '도전 가능',
    color: '#2fb344',
    dark: '#1b7a2c',
    icon: '●'
  },
  yellow: {
    chip: 'RESULT · YELLOW',
    title: '주의 필요!',
    line: '시간이 빠듯해! 짧은 코스는 어때?',
    bubble: '정상보다 안전한\n귀환이 더 중요해!',
    shareLabel: '주의 필요',
    color: '#f2a900',
    dark: '#a86f00',
    icon: '▲'
  },
  red: {
    chip: 'RESULT · RED',
    title: '오늘은 비추천!',
    line: '오늘은 쉬고 다음에 도전하자!',
    bubble: '해가 진 뒤 산길은 위험해.\n다음 기회를 준비하자!',
    shareLabel: '비추천',
    color: '#e03131',
    dark: '#9b1c1c',
    icon: '■'
  }
};
const CHECKLIST_ITEMS = [{
  id: 'lantern',
  label: '랜턴 또는 헤드랜턴',
  icon: 'lantern'
}, {
  id: 'battery',
  label: '보조 배터리',
  icon: 'battery'
}, {
  id: 'water',
  label: '충분한 물과 간식',
  icon: 'water'
}, {
  id: 'contact',
  label: '비상 연락처 저장',
  icon: 'phone'
}];
const DISCLAIMER = '※ 예상치이며 실제 안전을 보장하지 않는 참고용 결과입니다.';
// ---- src/lib/time.ts ----

const SEOUL = 'Asia/Seoul';
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** "HH:MM" → 자정 기준 분 */
function hmToMin(hm) {
  const [h, m] = hm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** 분 → "HH:MM" (24시간) */
function minToHm(min) {
  const v = (Math.round(min) % 1440 + 1440) % 1440;
  const h = Math.floor(v / 60);
  const m = v % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** 분 → "오후 3:00" */
function minToKorean(min) {
  const v = (Math.round(min) % 1440 + 1440) % 1440;
  const h = Math.floor(v / 60);
  const m = v % 60;
  const ampm = h < 12 ? '오전' : '오후';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${ampm} ${h12}:${String(m).padStart(2, '0')}`;
}

/** 분 → "1시간 22분" / "37분" / "-28분" */
function formatDuration(min) {
  const sign = min < 0 ? '-' : '';
  const abs = Math.abs(Math.round(min));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return `${sign}${m}분`;
  if (m === 0) return `${sign}${h}시간`;
  return `${sign}${h}시간 ${m}분`;
}

/** "2026-11-14T17:22" → 분 */
function isoToMin(iso) {
  const t = iso.split('T')[1] ?? '00:00';
  return hmToMin(t.slice(0, 5));
}
function seoulParts(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SEOUL,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(date);
  const get = t => parts.find(p => p.type === t)?.value ?? '00';
  return {
    y: get('year'),
    mo: get('month'),
    d: get('day'),
    h: Number(get('hour')) % 24,
    mi: Number(get('minute'))
  };
}
/** 오늘부터 DATE_RANGE_DAYS일치 날짜 옵션 (서울 기준) */
function buildDateOptions() {
  let now = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Date();
  const out = [];
  for (let i = 0; i < DATE_RANGE_DAYS; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    const p = seoulParts(d);
    const iso = `${p.y}-${p.mo}-${p.d}`;
    const wd = WEEKDAYS[new Date(`${iso}T12:00:00+09:00`).getUTCDay()];
    const md = `${Number(p.mo)}/${Number(p.d)} (${wd})`;
    const label = i === 0 ? '오늘' : i === 1 ? '내일' : md;
    out.push({
      iso,
      label,
      full: `${label === md ? '' : `${label} · `}${md}`
    });
  }
  return out;
}

/** 현재 서울 시각을 10분 단위로 올림한 "HH:MM" */
function nowRoundedHm() {
  let now = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Date();
  const p = seoulParts(now);
  let min = p.h * 60 + p.mi;
  min = Math.ceil(min / 10) * 10;
  if (min >= 1440) min = 1430;
  return minToHm(min);
}
/**
 * 예상 하산 = 입산 + 왕복 + 휴식
 * 권장 하산 마감 = 일몰 − 80분
 * 여유 시간 = 일몰 − 예상 하산
 * 🟢 ≥ 60분 / 🟡 ≥ 20분 / 🔴 < 20분 (출발이 일몰 이후면 무조건 🔴)
 */
function judge(_ref) {
  let {
    startMin,
    courseMin,
    sunsetMin
  } = _ref;
  const descentMin = startMin + courseMin + RULES.REST_MIN;
  const cutoffMin = sunsetMin - RULES.SAFE_BUFFER_MIN;
  const marginMin = sunsetMin - descentMin;
  const alreadyDark = startMin >= sunsetMin;
  let verdict;
  if (alreadyDark) verdict = 'red';else if (marginMin >= RULES.GREEN_MIN) verdict = 'green';else if (marginMin >= RULES.YELLOW_MIN) verdict = 'yellow';else verdict = 'red';
  return {
    startMin,
    courseMin,
    sunsetMin,
    descentMin,
    cutoffMin,
    marginMin,
    verdict,
    alreadyDark
  };
}
// ---- src/lib/sunset.ts ----

/** Open-Meteo로 해당 좌표·날짜의 일출/일몰 시각 조회 (API 키 불필요) */
async function fetchSunTimes(lat, lon, dateIso) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: 'sunrise,sunset',
    timezone: API_CONFIG.TIMEZONE,
    start_date: dateIso,
    end_date: dateIso
  });
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);
  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}?${params.toString()}`, {
      signal: controller.signal
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const sunset = json?.daily?.sunset?.[0];
    const sunrise = json?.daily?.sunrise?.[0];
    if (!sunset || !sunrise) throw new Error('일몰 데이터 없음');
    return {
      sunriseMin: isoToMin(sunrise),
      sunsetMin: isoToMin(sunset)
    };
  } finally {
    window.clearTimeout(timer);
  }
}
// ---- src/lib/share.ts ----

/** 휴대폰 기본 공유(Web Share API) → 미지원 시 클립보드 복사 */
async function shareText(title, text) {
  const nav = navigator;
  if (typeof nav.share === 'function') {
    try {
      await nav.share({
        title,
        text
      });
      return 'shared';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
      // 공유 실패 시 복사로 대체
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok ? 'copied' : 'failed';
    } catch {
      return 'failed';
    }
  }
}
// ---- src/components/PixelArt.tsx ----

/** 문자열 격자를 픽셀 SVG로 그립니다. '.' 은 투명. 같은 색 가로 연속은 하나의 rect로 합칩니다. */
function PixelArt(_ref2) {
  let {
    rows,
    palette,
    px = 3,
    className,
    title
  } = _ref2;
  const h = rows.length;
  const w = Math.max(...rows.map(r => r.length));
  const rects = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      let run = 1;
      while (x + run < row.length && row[x + run] === c) run++;
      const fill = palette[c];
      if (c !== '.' && fill) {
        rects.push( /*#__PURE__*/React.createElement("rect", {
          key: `${x}-${y}`,
          x: x,
          y: y,
          width: run,
          height: 1.04,
          fill: fill
        }));
      }
      x += run;
    }
  });
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${w} ${h}`,
    width: w * px,
    height: h * px,
    shapeRendering: "crispEdges",
    className: className,
    role: title ? 'img' : undefined,
    "aria-label": title,
    "aria-hidden": title ? undefined : true
  }, rects);
}
const OUT = '#231d45';
const ICONS = {
  mountain: {
    rows: ['....W....', '...WPW...', '..LPPPP..', '.LLPPPPP.', 'LLLPPPPPP'],
    palette: {
      W: '#ffffff',
      P: '#6d5bd0',
      L: '#9d8cf0'
    }
  },
  lantern: {
    rows: ['......KKK.', 'KKKKKKGGGY', 'KRRRRKGGGY', 'KKKKKKGGGY', '......KKK.'],
    palette: {
      K: OUT,
      G: '#a5a9c4',
      R: '#e8590c',
      Y: '#ffe066'
    }
  },
  battery: {
    rows: ['..KK..', 'KKKKKK', 'KYYYYK', 'KYWYYK', 'KYYYYK', 'KOOOOK', 'KOOOOK', 'KKKKKK'],
    palette: {
      K: OUT,
      Y: '#ffd43b',
      O: '#f08c00',
      W: '#fff7cc'
    }
  },
  water: {
    rows: ['..KK..', '..KK..', '.KBBK.', 'KBLBBK', 'KBLBBK', 'KBBBBK', 'KBBBBK', 'KKKKKK'],
    palette: {
      K: OUT,
      B: '#4dabf7',
      L: '#d0ebff'
    }
  },
  phone: {
    rows: ['KKKKKK', 'KRRRRK', 'KRWWRK', 'KRWWRK', 'KRRRRK', 'KRWRWK', 'KRRRRK', 'KKKKKK'],
    palette: {
      K: OUT,
      R: '#f03e3e',
      W: '#ffe3e3'
    }
  },
  boot: {
    rows: ['.KKK...', '.KCK...', '.KCK...', '.KCCKK.', '.KCCCCK', '.KKKKKK'],
    palette: {
      K: OUT,
      C: '#37b24d'
    }
  },
  sparkle: {
    rows: ['..Y..', '..Y..', 'YYWYY', '..Y..', '..Y..'],
    palette: {
      Y: '#ffe066',
      W: '#ffffff'
    }
  }
};
function Icon(_ref3) {
  let {
    name,
    px = 3,
    color,
    className
  } = _ref3;
  const icon = ICONS[name];
  if (!icon) return null;
  const palette = color ? {
    ...icon.palette,
    C: color
  } : icon.palette;
  return /*#__PURE__*/React.createElement(PixelArt, {
    rows: icon.rows,
    palette: palette,
    px: px,
    className: className
  });
}
// ---- src/components/Penguin.tsx ----

// 펭산이 원본 형태: 검정·흰 몸, 노란 부리·발, 하늘색 삼각 스카프 (22 x 21)
const PENGUIN_BASE = ['......KKKKKKKKKK......', '....KKKKKKKKKKKKKK....', '...KKKKKKKKKKKKKKKK...', '..KKKKWWWWKKWWWWKKKK..', '..KKKWWWWWWWWWWWWKKK..', '.KKKWWWWWWWWWWWWWWKKK.', '.KKKWWWWWWWWWWWWWWKKK.', '.KKKWPWWWYYYYWWWPWKKK.', '.KKKWWWWWWOOWWWWWWKKK.', '..KKKWWWWWWWWWWWWKKK..', '..BBBBBBBBBBBBBBBBBB..', '..DBBBBBBBBBBBBBBBBD..', '.KKBBBDWWWWWWWWWWWKKK.', 'KKKBBDWWWWWWWWWWWWWKKK', 'KK.KBDWWWWWWWWWWWWK.KK', 'K..KWWWWWWWWWWWWWWK..K', '...KWWWWWWWWWWWWWWK...', '...KKWWWWWWWWWWWWKK...', '....KKKWWWWWWWWKKK....', '.....KKKKKKKKKKKK.....', '....YYYY......YYYY....'];
const FEET_STEP = '.....YYYY....YYYY.....';
const PENGUIN_PALETTE = {
  K: '#1d1b33',
  W: '#fffaf0',
  Y: '#ffc83d',
  O: '#f08c00',
  B: '#8fd8ff',
  D: '#3fa9f5',
  P: '#ffa8b8',
  E: '#1d1b33'
};
// [row, col]

function set(grid, pts, c) {
  pts.forEach(_ref4 => {
    let [r, col] = _ref4;
    if (grid[r] && col >= 0 && col < grid[r].length) grid[r][col] = c;
  });
}
function buildRows(mood, step) {
  const g = PENGUIN_BASE.map(r => r.split(''));
  // 눈
  if (mood === 'happy') {
    // ^ ^
    set(g, [[6, 6], [5, 7], [5, 8], [6, 9], [6, 12], [5, 13], [5, 14], [6, 15]], 'E');
  } else if (mood === 'sleep') {
    // ‿ ‿ 감은 눈
    set(g, [[5, 6], [6, 7], [6, 8], [5, 9], [5, 12], [6, 13], [6, 14], [5, 15]], 'E');
  } else {
    set(g, [[5, 7], [5, 8], [6, 7], [6, 8], [5, 13], [5, 14], [6, 13], [6, 14]], 'E');
  }
  // 기쁠 땐 날개를 위로
  if (mood === 'happy') {
    set(g, [[13, 0], [13, 1], [14, 0], [14, 1], [15, 0], [13, 20], [13, 21], [14, 20], [14, 21], [15, 21]], '.');
    set(g, [[9, 0], [10, 0], [10, 1], [11, 1], [12, 1], [9, 21], [10, 21], [10, 20], [11, 20], [12, 20]], 'K');
  }
  if (step) g[20] = FEET_STEP.split('');
  return g.map(r => r.join(''));
}
function Penguin(_ref5) {
  let {
    mood = 'normal',
    px = 4,
    walking = false,
    className
  } = _ref5;
  const [step, setStep] = useState(false);
  useEffect(() => {
    if (!walking) return;
    const id = window.setInterval(() => setStep(s => !s), 220);
    return () => window.clearInterval(id);
  }, [walking]);
  return /*#__PURE__*/React.createElement(PixelArt, {
    rows: buildRows(mood, walking && step),
    palette: PENGUIN_PALETTE,
    px: px,
    className: className,
    title: "\uD3AD\uC0B0\uC774"
  });
}
// ---- src/components/Scenery.tsx ----

function rangeHeights(width, peaks, slope, step) {
  const out = [];
  for (let x = 0; x < width; x++) {
    let h = 0;
    peaks.forEach(_ref6 => {
      let [px, ph] = _ref6;
      const v = ph - Math.floor(Math.abs(x - px) / step) * step * slope;
      if (v > h) h = v;
    });
    out.push(Math.max(0, Math.round(h)));
  }
  return out;
}
function nearestPeak(x, peaks) {
  let best = peaks[0];
  peaks.forEach(p => {
    if (Math.abs(p[0] - x) < Math.abs(best[0] - x)) best = p;
  });
  return best;
}

/** 화면 하단의 노을 + 보라 산 + 초록 숲 픽셀 배경 */
function Scenery() {
  const W = 100;
  const H = 72;
  const rects = [];
  let k = 0;
  const r = (x, y, w, h, fill) => rects.push( /*#__PURE__*/React.createElement("rect", {
    key: k++,
    x: x,
    y: y,
    width: w,
    height: h + 0.05,
    fill: fill
  }));

  // 노을 띠 (위에서 아래로)
  const bands = ['#2c2558', '#3b2f6e', '#57408a', '#80509f', '#b4649f', '#e0819f', '#f3a08e', '#ffbf86'];
  bands.forEach((c, i) => r(0, 6 + i * 4, W, 4, c));
  r(0, 38, W, H - 38, '#ffbf86');

  // 별
  [[8, 2], [23, 5], [41, 1], [63, 4], [77, 2], [92, 6], [33, 8], [85, 10]].forEach(_ref7 => {
    let [x, y] = _ref7;
    return r(x, y, 1, 1, '#fff6d6');
  });

  // 해 (반쯤 산 뒤로)
  const sx = 70,
    sy = 34,
    sr = 5;
  for (let dy = -sr; dy <= sr; dy++) {
    const half = Math.floor(Math.sqrt(sr * sr - dy * dy));
    r(sx - half, sy + dy, half * 2 + 1, 1, dy < -2 ? '#fff3b0' : '#ffd166');
  }

  // 뒷산
  const backPeaks = [[14, 44], [46, 52], [82, 46]];
  const back = rangeHeights(W, backPeaks, 1, 2);
  back.forEach((h, x) => {
    if (h <= 0) return;
    const [px, ph] = nearestPeak(x, backPeaks);
    r(x, H - h, 1, h, x <= px ? '#9d8ff0' : '#7a6bd0');
    if (h > ph - 6) r(x, H - h, 1, Math.min(3, h - (ph - 9)), '#f4f1ff');
  });

  // 앞산
  const frontPeaks = [[0, 30], [28, 36], [60, 31], [94, 37]];
  const front = rangeHeights(W, frontPeaks, 1.5, 2);
  front.forEach((h, x) => {
    if (h <= 0) return;
    const [px] = nearestPeak(x, frontPeaks);
    r(x, H - h, 1, h, x <= px ? '#5e4ca8' : '#4a3a8f');
  });

  // 나무
  const base = H - 11;
  for (let i = 0; i < 26; i++) {
    const tx = i * 4 + i % 2;
    const th = 7 + i * 7 % 5;
    for (let row = 0; row < th; row++) {
      const half = Math.floor(row / 2);
      const y = base - th + row;
      r(tx - half, y, half + 1, 1, '#37b24d');
      if (half > 0) r(tx + 1, y, half, 1, '#237a35');
    }
    r(tx, base, 1, 2, '#5c3b1e');
  }

  // 풀밭
  r(0, H - 10, W, 2, '#8ce99a');
  r(0, H - 8, W, 5, '#2f9e44');
  for (let x = 1; x < W; x += 6) r(x, H - 7 + x % 3, 2, 1, '#237a35');
  for (let x = 3; x < W; x += 9) r(x, H - 11, 1, 1, '#8ce99a');
  r(0, H - 3, W, 3, '#3a2d6b');
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${W} ${H}`,
    preserveAspectRatio: "xMidYMax slice",
    shapeRendering: "crispEdges",
    className: "pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[300px] w-full",
    "aria-hidden": true
  }, rects);
}
const SCENE_BANDS = {
  green: ['#6c5bb5', '#9a63b3', '#cf78ac', '#ef94a3', '#f8b08f', '#ffcb87'],
  yellow: ['#55448f', '#8a55a3', '#c66e9f', '#ea8a99', '#f5a585', '#fcbd7c'],
  red: ['#221f4a', '#302a62', '#463679', '#64438a', '#8d5296', '#b9629a']
};
const SUN_Y = {
  green: 13,
  yellow: 20,
  red: 26
};

/** 판정 화면의 노을 배경 (판정별로 해의 높이·하늘색이 달라짐) */
function SunsetScene(_ref8) {
  let {
    verdict
  } = _ref8;
  const W = 80;
  const H = 32;
  const rects = [];
  let k = 0;
  const r = (x, y, w, h, fill) => rects.push( /*#__PURE__*/React.createElement("rect", {
    key: k++,
    x: x,
    y: y,
    width: w,
    height: h + 0.05,
    fill: fill
  }));
  SCENE_BANDS[verdict].forEach((c, i) => r(0, i * 4, W, 4, c));
  r(0, 24, W, 8, SCENE_BANDS[verdict][5]);
  if (verdict === 'red') {
    [[6, 2], [15, 6], [27, 3], [52, 2], [63, 7], [74, 4], [40, 9], [70, 12]].forEach(_ref9 => {
      let [x, y] = _ref9;
      return r(x, y, 1, 1, '#fff6d6');
    });
  }

  // 해
  const sx = verdict === 'green' ? 66 : 50,
    sy = SUN_Y[verdict],
    sr = 5;
  for (let dy = -sr; dy <= sr; dy++) {
    const half = Math.floor(Math.sqrt(sr * sr - dy * dy));
    r(sx - half, sy + dy, half * 2 + 1, 1, verdict === 'red' ? '#ff8a5c' : dy < -1 ? '#fff3b0' : '#ffd166');
  }

  // 구름
  const cloud = (x, y) => {
    r(x + 2, y, 6, 1, '#ffe3ec');
    r(x, y + 1, 11, 1, '#ffd0de');
    r(x + 1, y + 2, 13, 1, '#f7b2c8');
  };
  cloud(4, 5);
  cloud(60, 3);
  cloud(30, 15);

  // 언덕
  const hills = rangeHeights(W, [[8, 9], [36, 7], [66, 10]], 1, 3);
  hills.forEach((h, x) => r(x, H - h, 1, h, verdict === 'red' ? '#2b2457' : '#4a3a8f'));
  r(0, H - 3, W, 3, verdict === 'red' ? '#1d1a3a' : '#3b2f75');
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${W} ${H}`,
    preserveAspectRatio: "xMidYMax slice",
    shapeRendering: "crispEdges",
    className: "absolute inset-0 h-full w-full",
    "aria-hidden": true
  }, rects);
}

/** 상단 밤하늘의 반짝이는 별 */
function Stars() {
  const stars = Array.from({
    length: 26
  }, (_, i) => ({
    left: i * 37 % 100,
    top: i * 53 % 46,
    size: i % 4 === 0 ? 3 : 2,
    delay: i % 7 * 0.4
  }));
  return /*#__PURE__*/React.createElement("div", {
    className: "pointer-events-none absolute inset-x-0 top-0 z-0 h-[460px]",
    "aria-hidden": true
  }, stars.map((s, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: "star absolute bg-[#fff6d6]",
    style: {
      left: `${s.left}%`,
      top: `${s.top}%`,
      width: s.size,
      height: s.size,
      animationDelay: `${s.delay}s`
    }
  })));
}
// ---- src/components/ui.tsx ----

/* ── 타이틀 로고: 펭산이의 하산 대작전 ── */
function Logo() {
  return /*#__PURE__*/React.createElement("div", {
    className: "logo relative mx-auto mb-1 mt-1 flex w-fit select-none flex-col items-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute -top-1 left-1/2 -translate-x-1/2 opacity-90"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "mountain",
    px: 6
  })), /*#__PURE__*/React.createElement("div", {
    className: "relative z-10 mt-5 flex items-end gap-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "logo-small"
  }, "\uD3AD\uC0B0\uC774\uC758"), /*#__PURE__*/React.createElement(Penguin, {
    px: 1.6,
    mood: "happy",
    className: "mb-0.5"
  })), /*#__PURE__*/React.createElement("div", {
    className: "logo-big relative z-10"
  }, "\uD558\uC0B0 \uB300\uC791\uC804"));
}

/* ── 상단 상태 칩 + SUNSET 표기 ── */
const CHIP_COLOR = {
  quest: '#ff8a5c',
  green: '#51cf66',
  yellow: '#ffd43b',
  red: '#ff6b6b',
  guide: '#ffd43b'
};
function Header(_ref10) {
  let {
    chip,
    tone,
    onBack
  } = _ref10;
  return /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between gap-2 pt-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, onBack && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onBack,
    className: "px-back flex h-12 w-12 items-center justify-center font-pixel text-[12px] text-white",
    "aria-label": "\uB4A4\uB85C \uAC00\uAE30"
  }, "\u25C0"), /*#__PURE__*/React.createElement("span", {
    className: "px-chip font-pixel text-[9px]",
    style: {
      color: CHIP_COLOR[tone],
      borderColor: CHIP_COLOR[tone]
    }
  }, chip)), /*#__PURE__*/React.createElement("span", {
    className: "font-pixel text-[11px] tracking-wider text-white"
  }, "SUNSET"));
}
function TitleBanner(_ref11) {
  let {
    children
  } = _ref11;
  return /*#__PURE__*/React.createElement("h1", {
    className: "px-banner mt-3 py-2.5 text-center text-[18px] font-black tracking-tight text-ink"
  }, children);
}
function Card(_ref12) {
  let {
    children,
    className = ''
  } = _ref12;
  return /*#__PURE__*/React.createElement("div", {
    className: `px-card ${className}`
  }, children);
}
function PxButton(_ref13) {
  let {
    variant = 'yellow',
    className = '',
    children,
    ...rest
  } = _ref13;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button"
  }, rest, {
    className: `px-btn px-btn-${variant} min-h-[52px] w-full px-4 text-[16px] font-black text-ink ${className}`
  }), children);
}

/* ── 말풍선 ── */
function Bubble(_ref14) {
  let {
    text,
    className = ''
  } = _ref14;
  return /*#__PURE__*/React.createElement("div", {
    className: `bubble whitespace-pre-line text-center text-[12.5px] font-bold leading-snug text-ink ${className}`
  }, text);
}

/* ── 신호등 아이콘: 색 + 기호 + 텍스트 ── */
const LAMP_SYMBOL = {
  green: '✓',
  yellow: '!',
  red: '✕'
};
function TrafficLamp(_ref15) {
  let {
    verdict,
    size = 44
  } = _ref15;
  const meta = VERDICT_META[verdict];
  return /*#__PURE__*/React.createElement("span", {
    className: "lamp-box inline-flex shrink-0 items-center justify-center",
    style: {
      width: size,
      height: size
    },
    "aria-label": `신호등 ${meta.shareLabel}`,
    role: "img"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lamp flex items-center justify-center font-black text-white",
    style: {
      background: meta.color,
      boxShadow: `0 0 12px 2px ${meta.color}`,
      width: size * 0.62,
      height: size * 0.62,
      fontSize: size * 0.34
    }
  }, LAMP_SYMBOL[verdict]));
}

/* ── 일몰까지 남은 시간 게이지 ── */
function Gauge(_ref16) {
  let {
    startMin,
    descentMin,
    sunsetMin,
    verdict
  } = _ref16;
  const meta = VERDICT_META[verdict];
  const total = sunsetMin - startMin;
  const ratio = total <= 0 ? 1 : Math.min(1, Math.max(0, (descentMin - startMin) / total));
  const filled = Math.max(1, Math.round(ratio * GAUGE_SEGMENTS));
  const overrun = descentMin > sunsetMin;
  const cutoffRatio = total <= 0 ? 0 : (sunsetMin - RULES.SAFE_BUFFER_MIN - startMin) / total;
  return /*#__PURE__*/React.createElement("div", {
    className: "px-card-lav px-3 pb-2.5 pt-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-baseline justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[13px] font-bold text-ink"
  }, "\uC77C\uBAB0\uAE4C\uC9C0 \uB0A8\uC740 \uC2DC\uAC04"), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] font-bold",
    style: {
      color: meta.dark
    }
  }, overrun ? '하산 전 해가 져요' : `산행 ${Math.round(ratio * 100)}% · 남는 해 ${100 - Math.round(ratio * 100)}%`)), /*#__PURE__*/React.createElement("div", {
    className: "relative mt-1.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gauge-track flex gap-[3px] p-[3px]",
    role: "meter",
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    "aria-valuenow": Math.round(ratio * 100),
    "aria-label": "\uC77C\uBAB0\uAE4C\uC9C0 \uC0B0\uD589\uC774 \uCC28\uC9C0\uD558\uB294 \uBE44\uC728"
  }, Array.from({
    length: GAUGE_SEGMENTS
  }, (_, i) => {
    const on = i < filled;
    return /*#__PURE__*/React.createElement("span", {
      key: i,
      className: `h-[14px] flex-1 ${on ? 'seg-on' : ''} ${on && overrun && i === GAUGE_SEGMENTS - 1 ? 'seg-blink' : ''}`,
      style: {
        background: on ? meta.color : '#e7e4f7',
        boxShadow: on ? `inset 0 -3px 0 ${meta.dark}` : 'inset 0 -3px 0 #cfcaea',
        animationDelay: `${i * 70}ms`
      }
    });
  })), cutoffRatio > 0 && cutoffRatio < 1 && /*#__PURE__*/React.createElement("span", {
    className: "absolute -top-1 h-[26px] w-[2px] bg-ink",
    style: {
      left: `calc(${cutoffRatio * 100}% )`
    },
    title: "\uAD8C\uC7A5 \uD558\uC0B0 \uB9C8\uAC10",
    "aria-hidden": true
  })), /*#__PURE__*/React.createElement("div", {
    className: "mt-1.5 flex justify-between text-[11px] text-[#6b6390]"
  }, /*#__PURE__*/React.createElement("span", null, "\uC785\uC0B0 ", /*#__PURE__*/React.createElement("b", {
    className: "font-pixel text-[9px]"
  }, minToHm(startMin))), /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-1 text-[10px]"
  }, /*#__PURE__*/React.createElement("i", {
    className: "inline-block h-3 w-[2px] bg-ink"
  }), "\uAD8C\uC7A5 \uD558\uC0B0 \uB9C8\uAC10"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-ink"
  }, "\uC77C\uBAB0 ", /*#__PURE__*/React.createElement("b", {
    className: "font-pixel text-[9px]"
  }, minToHm(sunsetMin)))));
}

/* ── 상태 카드들 ── */
function LoadingCard() {
  return /*#__PURE__*/React.createElement(Card, {
    className: "overflow-hidden px-4 py-4"
  }, /*#__PURE__*/React.createElement("p", {
    className: "font-pixel text-[11px] text-ink"
  }, "LOADING", /*#__PURE__*/React.createElement("span", {
    className: "loading-dots"
  })), /*#__PURE__*/React.createElement("p", {
    className: "mt-2 text-[13px] font-bold text-[#4a4270]"
  }, "\uC77C\uBAB0 \uC2DC\uAC01\uACFC \uD558\uC0B0 \uC2DC\uAC04\uC744 \uACC4\uC0B0 \uC911\uC774\uC5D0\uC694."), /*#__PURE__*/React.createElement("div", {
    className: "relative mt-3 h-[70px] border-b-4 border-dashed border-[#c9b98f]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "walker absolute bottom-0"
  }, /*#__PURE__*/React.createElement(Penguin, {
    px: 3,
    walking: true
  }))));
}
function ErrorCard(_ref17) {
  let {
    onRetry,
    onManual
  } = _ref17;
  const [hm, setHm] = useState('17:30');
  return /*#__PURE__*/React.createElement(Card, {
    className: "px-4 py-4"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-[15px] font-black text-stop"
  }, "API \uC870\uD68C\uC5D0 \uC2E4\uD328\uD588\uC5B4\uC694"), /*#__PURE__*/React.createElement("p", {
    className: "mt-1 text-[13px] font-bold text-[#4a4270]"
  }, "\uC77C\uBAB0 \uC2DC\uAC01\uC744 \uC9C1\uC811 \uC785\uB825\uD558\uAC70\uB098 \uB2E4\uC2DC \uC2DC\uB3C4\uD560 \uC218 \uC788\uC5B4\uC694."), /*#__PURE__*/React.createElement("label", {
    className: "px-field mt-3 block px-3 py-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "block text-[11px] text-[#8a7f63]"
  }, "\uC77C\uBAB0 \uC2DC\uAC01 \uC9C1\uC811 \uC785\uB825"), /*#__PURE__*/React.createElement("input", {
    type: "time",
    value: hm,
    onChange: e => setHm(e.target.value),
    className: "mt-0.5 h-9 w-full bg-transparent text-[16px] font-black text-ink outline-none"
  })), /*#__PURE__*/React.createElement("div", {
    className: "mt-3 grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement(PxButton, {
    onClick: () => hm && onManual(hm),
    disabled: !hm
  }, "\uC774 \uC2DC\uAC01\uC73C\uB85C \uACC4\uC0B0"), /*#__PURE__*/React.createElement(PxButton, {
    variant: "lav",
    onClick: onRetry
  }, "\uB2E4\uC2DC \uC2DC\uB3C4")));
}
function FormulaCard() {
  return /*#__PURE__*/React.createElement("div", {
    className: "px-card-lav px-3 py-2.5"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-[12px] font-black text-ink"
  }, "\uD310\uC815 \uACF5\uC2DD"), /*#__PURE__*/React.createElement("p", {
    className: "mt-0.5 text-[11.5px] leading-relaxed text-[#4a4270]"
  }, "\uC608\uC0C1 \uD558\uC0B0 = \uC785\uC0B0 + \uC655\uBCF5 \uC18C\uC694 + \uD734\uC2DD ", RULES.REST_MIN, "\uBD84 \xB7 \uAD8C\uC7A5 \uD558\uC0B0 = \uC77C\uBAB0 \u2212 ", RULES.SAFE_BUFFER_MIN, "\uBD84", /*#__PURE__*/React.createElement("br", null), "\uC5EC\uC720 ", RULES.GREEN_MIN, "\uBD84\u2191 \uD83D\uDFE2 \xB7 ", RULES.YELLOW_MIN, "~", RULES.GREEN_MIN, "\uBD84 \uD83D\uDFE1 \xB7 ", RULES.YELLOW_MIN, "\uBD84 \uBBF8\uB9CC \uD83D\uDD34"));
}
function Disclaimer() {
  return /*#__PURE__*/React.createElement("p", {
    className: "disclaimer mt-3 px-2 py-1.5 text-center text-[11px] text-[#d9d4ff]"
  }, DISCLAIMER);
}
function Toast(_ref18) {
  let {
    message
  } = _ref18;
  if (!message) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "toast fixed bottom-6 left-1/2 z-50 w-[90vw] max-w-[340px] -translate-x-1/2 px-4 py-3 text-center text-[13px] font-bold text-white",
    role: "status"
  }, message);
}
// ---- src/screens/SelectScreen.tsx ----

function SelectScreen(p) {
  const mountain = MOUNTAINS.find(m => m.id === p.mountainId) ?? null;
  const ready = Boolean(mountain && p.trailheadId && p.courseKey && p.startHm);
  const missing = [!mountain && '산', !p.trailheadId && '들머리', !p.courseKey && '코스'].filter(Boolean).join(' · ');
  return /*#__PURE__*/React.createElement("div", {
    className: "screen-enter"
  }, /*#__PURE__*/React.createElement(Logo, null), /*#__PURE__*/React.createElement(Header, {
    chip: "QUEST 01",
    tone: "quest"
  }), /*#__PURE__*/React.createElement(TitleBanner, null, "\uC624\uB298\uC740 \uC5B4\uB290 \uC0B0\uC5D0 \uAC08\uAE4C?"), /*#__PURE__*/React.createElement(Card, {
    className: "mt-4 flex items-center gap-3 px-3 py-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bob shrink-0"
  }, /*#__PURE__*/React.createElement(Penguin, {
    px: 3
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "text-[14px] font-black leading-snug text-ink"
  }, "\uD3AD\uC0B0\uC774\uC640 \uC548\uC804\uD558\uAC8C", /*#__PURE__*/React.createElement("br", null), "\uB3CC\uC544\uC62C \uC0B0\uD589\uC744 \uC900\uBE44\uD574\uC694!"), /*#__PURE__*/React.createElement("p", {
    className: "mt-1 text-[11.5px] font-bold text-[#7c5cc4]"
  }, "\uD574\uAC00 \uC9C0\uAE30 \uC804, \uC6B0\uB9AC\uC758 \uC0B0\uD589."))), /*#__PURE__*/React.createElement("ul", {
    className: "mt-4 space-y-2.5",
    "aria-label": "\uC0B0 \uC120\uD0DD"
  }, MOUNTAINS.map(m => {
    const on = m.id === p.mountainId;
    return /*#__PURE__*/React.createElement("li", {
      key: m.id
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => p.onMountain(m.id),
      "aria-pressed": on,
      className: `px-select flex min-h-[48px] w-full items-center gap-3 px-3 text-left ${on ? 'is-on' : ''}`
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "mountain",
      px: 3
    }), /*#__PURE__*/React.createElement("span", {
      className: "flex-1 text-[15px] font-black text-ink"
    }, m.name), /*#__PURE__*/React.createElement("span", {
      className: `text-[11px] font-bold ${on ? 'text-ink' : 'text-[#7d7699]'}`
    }, on ? '선택됨 ▶' : `${m.region} ›`)));
  })), /*#__PURE__*/React.createElement("div", {
    className: "mt-4 grid grid-cols-[1fr_auto] gap-3"
  }, /*#__PURE__*/React.createElement("label", {
    className: "px-field relative block px-3 pb-1.5 pt-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "block text-[11px] text-[#8a7f63]"
  }, "\uB4E4\uBA38\uB9AC"), /*#__PURE__*/React.createElement("select", {
    value: p.trailheadId,
    onChange: e => p.onTrailhead(e.target.value),
    disabled: !mountain,
    className: "px-select-native h-8 w-full truncate pr-5 text-[14px] font-black text-ink disabled:text-[#a59d86]"
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, mountain ? '들머리를 선택하세요' : '산을 먼저 골라요'), mountain?.trailheads.map(t => /*#__PURE__*/React.createElement("option", {
    key: t.id,
    value: t.id
  }, t.name))), /*#__PURE__*/React.createElement("span", {
    className: "caret"
  }, "\u25BE")), /*#__PURE__*/React.createElement("label", {
    className: "px-field relative block w-[118px] px-3 pb-1.5 pt-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "block text-[11px] text-[#8a7f63]"
  }, "\uB0A0\uC9DC"), /*#__PURE__*/React.createElement("select", {
    value: p.dateIdx,
    onChange: e => p.onDate(Number(e.target.value)),
    className: "px-select-native h-8 w-full pr-5 text-[14px] font-black text-ink"
  }, p.dateOptions.map((d, i) => /*#__PURE__*/React.createElement("option", {
    key: d.iso,
    value: i
  }, d.label))), /*#__PURE__*/React.createElement("span", {
    className: "caret"
  }, "\u25BE"))), /*#__PURE__*/React.createElement("label", {
    className: "px-field relative mt-3 block px-3 pb-1.5 pt-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "flex justify-between text-[11px] text-[#8a7f63]"
  }, /*#__PURE__*/React.createElement("span", null, "\uC785\uC0B0 \uC2DC\uAC04"), /*#__PURE__*/React.createElement("span", null, p.startHm ? minToKorean(hmToMin(p.startHm)) : '')), /*#__PURE__*/React.createElement("input", {
    type: "time",
    value: p.startHm,
    onChange: e => p.onStart(e.target.value),
    className: "h-9 w-full bg-transparent text-[16px] font-black text-ink outline-none",
    "aria-label": "\uC785\uC0B0 \uC2DC\uAC04"
  })), /*#__PURE__*/React.createElement("p", {
    className: "mt-4 text-[13px] font-bold text-white"
  }, "\uCF54\uC2A4 \uC120\uD0DD \xB7 \uC655\uBCF5 \uC18C\uC694 \uC2DC\uAC04"), /*#__PURE__*/React.createElement("div", {
    className: "mt-2 grid grid-cols-3 gap-2.5",
    role: "radiogroup",
    "aria-label": "\uCF54\uC2A4 \uC120\uD0DD"
  }, COURSE_ORDER.map(key => {
    const on = key === p.courseKey;
    const mins = mountain?.courses[key];
    return /*#__PURE__*/React.createElement("button", {
      key: key,
      type: "button",
      role: "radio",
      "aria-checked": on,
      disabled: !mountain,
      onClick: () => p.onCourse(key),
      className: `px-select flex min-h-[64px] flex-col items-center justify-center gap-0.5 px-1 py-2 ${on ? 'is-on' : ''}`
    }, /*#__PURE__*/React.createElement("span", {
      className: "flex items-center gap-1.5 text-[14px] font-black text-ink"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "boot",
      px: 2,
      color: COURSE_COLOR[key]
    }), COURSE_LABEL[key]), /*#__PURE__*/React.createElement("span", {
      className: "text-[11px] font-bold text-[#6b6390]"
    }, mins ? formatDuration(mins) : '—'));
  })), /*#__PURE__*/React.createElement("div", {
    className: "px-card-lav mt-4 px-3 py-2"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-[12px] font-bold text-ink"
  }, "\u2600 Open-Meteo \uC77C\uBAB0 \xB7 \uC77C\uCD9C \uC870\uD68C"), /*#__PURE__*/React.createElement("p", {
    className: "mt-0.5 text-[11px] text-[#6b6390]"
  }, p.manualSunsetMin != null ? `직접 입력한 일몰 ${minToHm(p.manualSunsetMin)} 사용 중` : p.sun.status === 'ok' ? `${p.dateOptions[p.dateIdx]?.full} 일출 ${minToHm(p.sun.sunriseMin)} · 일몰 ${minToHm(p.sun.sunsetMin)}` : p.sun.status === 'loading' ? '일몰 시각을 불러오는 중…' : p.sun.status === 'error' ? '조회 실패 · 결과 화면에서 일몰 시각을 직접 입력할 수 있어요' : '실패 시 일몰 시각 직접 입력')), /*#__PURE__*/React.createElement(PxButton, {
    className: "mt-5",
    disabled: !ready,
    onClick: p.onSubmit
  }, "\uD558\uC0B0 \uAC00\uB2A5 \uC5EC\uBD80 \uD655\uC778\uD558\uAE30 \u25B6"), !ready && /*#__PURE__*/React.createElement("p", {
    className: "mt-2 text-center text-[11.5px] font-bold text-[#cfc8ff]"
  }, missing, "\uC744(\uB97C) \uACE8\uB77C \uC8FC\uC138\uC694"));
}
// ---- src/screens/ResultScreen.tsx ----

function InfoRow(_ref19) {
  let {
    icon,
    label,
    value,
    color
  } = _ref19;
  return /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between border-b-2 border-dashed border-[#e5d3a8] py-2.5 last:border-b-0"
  }, /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-1.5 text-[13px] font-bold text-[#4a4270]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-4 text-center text-[11px]",
    style: {
      color: color ?? '#e8590c'
    }
  }, icon), label), /*#__PURE__*/React.createElement("span", {
    className: /^-?\d{2}:\d{2}$/.test(value) ? 'font-pixel text-[12px]' : 'text-[16px] font-black',
    style: {
      color: color ?? '#2a2350'
    }
  }, value));
}
function ResultScreen(p) {
  const r = p.result;
  const verdict = r?.verdict ?? 'green';
  const meta = VERDICT_META[verdict];
  const chip = p.phase === 'ready' && r ? meta.chip : p.phase === 'error' ? 'RESULT · ERROR' : 'RESULT · ···';
  return /*#__PURE__*/React.createElement("div", {
    className: "screen-enter"
  }, /*#__PURE__*/React.createElement(Header, {
    chip: chip,
    tone: p.phase === 'ready' ? verdict : 'quest',
    onBack: p.onBack
  }), /*#__PURE__*/React.createElement(TitleBanner, null, "\uD3AD\uC0B0\uC774\uC758 \uD558\uC0B0 \uD310\uC815!"), p.phase === 'loading' && /*#__PURE__*/React.createElement("div", {
    className: "mt-4"
  }, /*#__PURE__*/React.createElement(LoadingCard, null)), p.phase === 'error' && /*#__PURE__*/React.createElement("div", {
    className: "mt-4 space-y-4"
  }, /*#__PURE__*/React.createElement(ErrorCard, {
    onRetry: p.onRetry,
    onManual: p.onManualSunset
  }), /*#__PURE__*/React.createElement(PxButton, {
    variant: "lav",
    onClick: p.onOtherMountain
  }, "\uB2E4\uB978 \uC0B0 \uC120\uD0DD\uD558\uAE30")), p.phase === 'ready' && r && /*#__PURE__*/React.createElement("div", {
    key: p.animKey
  }, /*#__PURE__*/React.createElement(Card, {
    className: "verdict-pop mt-4 px-3 py-3.5 text-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-center gap-3"
  }, /*#__PURE__*/React.createElement(TrafficLamp, {
    verdict: verdict
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-[26px] font-black tracking-tight",
    style: {
      color: meta.dark
    }
  }, meta.title)), /*#__PURE__*/React.createElement("p", {
    className: "mt-1.5 text-[13.5px] font-bold text-[#4a4270]"
  }, r.alreadyDark ? '이미 해가 졌어요! 오늘은 쉬고 다음에 도전하자!' : meta.line)), /*#__PURE__*/React.createElement("div", {
    className: "scene-frame relative mt-4 h-[150px] overflow-hidden"
  }, /*#__PURE__*/React.createElement(SunsetScene, {
    verdict: verdict
  }), verdict === 'green' ? /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 flex items-end justify-center pb-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sparkle absolute left-[18%] top-[30%]"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkle",
    px: 3
  })), /*#__PURE__*/React.createElement("span", {
    className: "sparkle absolute right-[20%] top-[22%]",
    style: {
      animationDelay: '.4s'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkle",
    px: 3
  })), /*#__PURE__*/React.createElement("span", {
    className: "sparkle absolute left-[34%] top-[10%]",
    style: {
      animationDelay: '.8s'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkle",
    px: 2
  })), /*#__PURE__*/React.createElement("span", {
    className: "absolute left-[56%] top-[10%] font-pixel text-[14px] text-[#ffd43b] drop-shadow-[2px_2px_0_#2a2350]"
  }, "!!"), /*#__PURE__*/React.createElement("div", {
    className: "jump"
  }, /*#__PURE__*/React.createElement(Penguin, {
    mood: "happy",
    px: 4.4
  }))) : /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 flex items-end gap-1 px-3 pb-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: `relative shrink-0 ${verdict === 'yellow' ? 'tilt' : 'doze'}`
  }, /*#__PURE__*/React.createElement("span", {
    className: "mark absolute -top-5 right-0 font-pixel text-[14px] drop-shadow-[2px_2px_0_#2a2350]",
    style: {
      color: verdict === 'yellow' ? '#8fd8ff' : '#dcd7ff'
    }
  }, verdict === 'yellow' ? '?' : 'zZ'), /*#__PURE__*/React.createElement(Penguin, {
    mood: verdict === 'yellow' ? 'curious' : 'sleep',
    px: 4
  })), meta.bubble && /*#__PURE__*/React.createElement(Bubble, {
    text: meta.bubble,
    className: "mb-10 flex-1 px-3 py-2.5"
  }))), /*#__PURE__*/React.createElement(Card, {
    className: "mt-4 px-3.5 py-1"
  }, /*#__PURE__*/React.createElement(InfoRow, {
    icon: "\u25B6",
    label: "\uC608\uC0C1 \uD558\uC0B0",
    value: minToHm(r.descentMin)
  }), /*#__PURE__*/React.createElement(InfoRow, {
    icon: "\u2600",
    label: "\uC77C\uBAB0 \uC2DC\uAC01",
    value: minToHm(r.sunsetMin),
    color: undefined
  }), /*#__PURE__*/React.createElement(InfoRow, {
    icon: "\u25F7",
    label: "\uC5EC\uC720 \uC2DC\uAC04",
    value: formatDuration(r.marginMin),
    color: meta.dark
  }), /*#__PURE__*/React.createElement(InfoRow, {
    icon: "\u2691",
    label: "\uAD8C\uC7A5 \uD558\uC0B0 \uB9C8\uAC10",
    value: minToHm(r.cutoffMin)
  })), p.usingManual && /*#__PURE__*/React.createElement("p", {
    className: "mt-1.5 text-right text-[11px] font-bold text-[#cfc8ff]"
  }, "* \uC9C1\uC811 \uC785\uB825\uD55C \uC77C\uBAB0 \uC2DC\uAC01 \uAE30\uC900"), /*#__PURE__*/React.createElement("div", {
    className: "mt-4"
  }, /*#__PURE__*/React.createElement(Gauge, {
    startMin: r.startMin,
    descentMin: r.descentMin,
    sunsetMin: r.sunsetMin,
    verdict: verdict
  })), /*#__PURE__*/React.createElement("div", {
    className: "mt-5 space-y-3.5"
  }, verdict === 'green' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PxButton, {
    onClick: p.onShare
  }, "\uCE74\uCE74\uC624\uD1A1\uC73C\uB85C \uACB0\uACFC \uACF5\uC720"), /*#__PURE__*/React.createElement("p", {
    className: "px-1 text-center text-[11px] text-[#cfc8ff]"
  }, "\u201C", p.summary, "\u201D")), verdict === 'yellow' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PxButton, {
    variant: "lav",
    onClick: p.onShorter,
    disabled: !p.shorterLabel
  }, p.shorterLabel ? '짧은 코스로 다시 계산' : '이미 가장 짧은 코스예요'), /*#__PURE__*/React.createElement(PxButton, {
    variant: "lav",
    onClick: p.onOtherMountain
  }, "\uB2E4\uB978 \uC0B0 \uC120\uD0DD\uD558\uAE30")), verdict === 'red' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PxButton, {
    onClick: p.onTomorrow,
    disabled: !p.canTomorrow
  }, "\uB0B4\uC77C \uC0B0\uD589\uC73C\uB85C \uB2E4\uC2DC \uACC4\uC0B0"), /*#__PURE__*/React.createElement(PxButton, {
    variant: "lav",
    onClick: p.onOtherMountain
  }, "\uB2E4\uB978 \uC0B0 \uC120\uD0DD\uD558\uAE30")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: p.onGuide,
    className: "guide-link flex min-h-[48px] w-full items-center justify-center gap-2 text-[14px] font-black text-sunny"
  }, "\uD83D\uDEE1 \uC548\uC804 \uAC00\uC774\uB4DC \uBCF4\uAE30 \u25B6")), /*#__PURE__*/React.createElement(Disclaimer, null), /*#__PURE__*/React.createElement("div", {
    className: "mt-4"
  }, /*#__PURE__*/React.createElement(FormulaCard, null))));
}
// ---- src/screens/GuideScreen.tsx ----

function GuideScreen(p) {
  const done = CHECKLIST_ITEMS.filter(i => p.checks[i.id]).length;
  return /*#__PURE__*/React.createElement("div", {
    className: "screen-enter"
  }, /*#__PURE__*/React.createElement(Header, {
    chip: "SAFETY GUIDE",
    tone: "guide",
    onBack: p.onBack
  }), /*#__PURE__*/React.createElement(TitleBanner, null, "\uD3AD\uC0B0\uC774\uC758 \uC548\uC804 \uADC0\uD658 \uC791\uC804"), /*#__PURE__*/React.createElement("div", {
    className: "scene-frame guide-scene relative mt-4 flex items-end gap-2 overflow-hidden px-3 pb-3 pt-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative shrink-0 bob"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sparkle absolute -right-1 -top-4"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkle",
    px: 3
  })), /*#__PURE__*/React.createElement(Penguin, {
    mood: "happy",
    px: 4
  })), /*#__PURE__*/React.createElement("div", {
    className: "bubble mb-6 flex-1 px-3 py-2.5 text-ink"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-[13px] font-black leading-snug"
  }, "\uC624\uB298\uB3C4 \uBB34\uB9AC\uD558\uC9C0 \uC54A\uACE0", /*#__PURE__*/React.createElement("br", null), "\uC548\uC804\uD558\uAC8C \uB2E4\uB140\uC624\uC790!"), /*#__PURE__*/React.createElement("p", {
    className: "mt-1 text-[11px] font-bold text-[#7c5cc4]"
  }, "\uBBF8\uC158 \uC131\uACF5 = \uC548\uC804\uD55C \uADC0\uD658"))), /*#__PURE__*/React.createElement("div", {
    className: "mt-4 flex items-baseline justify-between"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-[14px] font-black text-white"
  }, "\uCD9C\uBC1C \uC804 \uCCB4\uD06C\uB9AC\uC2A4\uD2B8"), /*#__PURE__*/React.createElement("p", {
    className: "font-pixel text-[9px] text-sunny"
  }, done, "/", CHECKLIST_ITEMS.length)), /*#__PURE__*/React.createElement(Card, {
    className: "mt-2 px-3 py-1.5"
  }, /*#__PURE__*/React.createElement("ul", null, CHECKLIST_ITEMS.map(item => {
    const on = Boolean(p.checks[item.id]);
    return /*#__PURE__*/React.createElement("li", {
      key: item.id
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      role: "checkbox",
      "aria-checked": on,
      onClick: () => p.onToggle(item.id),
      className: "flex min-h-[52px] w-full items-center gap-3 border-b-2 border-dashed border-[#e5d3a8] text-left last:border-b-0"
    }, /*#__PURE__*/React.createElement("span", {
      className: `px-check ${on ? 'is-on' : ''}`,
      "aria-hidden": true
    }, on ? '✔' : ''), /*#__PURE__*/React.createElement("span", {
      className: "flex w-7 justify-center"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: item.icon,
      px: 2.6
    })), /*#__PURE__*/React.createElement("span", {
      className: `text-[14px] font-bold ${on ? 'text-ink' : 'text-[#6b6390]'}`
    }, item.label)));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "px-card-lav mt-4 px-3 py-2.5"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-[12px] font-black text-ink"
  }, "\uC548\uC804 \uD301"), /*#__PURE__*/React.createElement("p", {
    className: "mt-0.5 text-[12px] leading-relaxed text-[#4a4270]"
  }, "\uC0B0\uC18D\uC740 \uD3C9\uC9C0\uBCF4\uB2E4 \uBE68\uB9AC \uC5B4\uB450\uC6CC\uC838\uC694.", /*#__PURE__*/React.createElement("br", null), "\uAD8C\uC7A5 \uD558\uC0B0 \uC2DC\uAC01\uC740 \uC77C\uBAB0 ", RULES.SAFE_BUFFER_MIN, "\uBD84 \uC804\uC785\uB2C8\uB2E4."), p.cutoffInfo && /*#__PURE__*/React.createElement("p", {
    className: "mt-1 text-[12px] font-black text-[#c2410c]"
  }, "\u2691 ", p.cutoffInfo.mountain, " \uAD8C\uC7A5 \uD558\uC0B0 \uB9C8\uAC10 ", minToHm(p.cutoffInfo.cutoffMin))), /*#__PURE__*/React.createElement("div", {
    className: "mt-5 space-y-3.5"
  }, /*#__PURE__*/React.createElement(PxButton, {
    variant: "lav",
    onClick: p.onShorter,
    disabled: !p.canShorter
  }, p.canShorter ? '짧은 코스로 다시 계산' : '더 짧은 코스가 없어요'), /*#__PURE__*/React.createElement(PxButton, {
    variant: "lav",
    onClick: p.onOtherMountain
  }, "\uB2E4\uB978 \uC0B0 \uC120\uD0DD\uD558\uAE30")), /*#__PURE__*/React.createElement(Disclaimer, null), /*#__PURE__*/React.createElement("div", {
    className: "mt-4"
  }, /*#__PURE__*/React.createElement(FormulaCard, null)));
}
// ---- src/App.tsx ----

function App() {
  const dateOptions = useMemo(() => buildDateOptions(), []);
  const [screen, setScreen] = useState('select');
  const [mountainId, setMountainId] = useState(null);
  const [trailheadId, setTrailheadId] = useState('');
  const [courseKey, setCourseKey] = useState(null);
  const [dateIdx, setDateIdx] = useState(0);
  const [startHm, setStartHm] = useState(() => nowRoundedHm());
  const [sunCache, setSunCache] = useState({});
  const [manualSunset, setManualSunset] = useState({});
  const [animating, setAnimating] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [checks, setChecks] = useState({});
  const [toast, setToast] = useState(null);
  const inflight = useRef(new Set());
  const animTimer = useRef(undefined);
  const toastTimer = useRef(undefined);
  const mountain = MOUNTAINS.find(m => m.id === mountainId) ?? null;
  const dateIso = dateOptions[dateIdx]?.iso ?? '';
  const sunKey = mountain ? `${mountain.id}|${dateIso}` : '';
  const sun = sunKey && sunCache[sunKey] || {
    status: 'idle'
  };
  const manualMin = sunKey && manualSunset[sunKey] != null ? manualSunset[sunKey] : null;

  // ── Open-Meteo 일몰 조회 (산·날짜 단위 캐시) ──
  useEffect(() => {
    if (!mountain || !dateIso || sunCache[sunKey] || inflight.current.has(sunKey)) return;
    const key = sunKey;
    inflight.current.add(key);
    setSunCache(c => ({
      ...c,
      [key]: {
        status: 'loading'
      }
    }));
    fetchSunTimes(mountain.lat, mountain.lon, dateIso).then(t => setSunCache(c => ({
      ...c,
      [key]: {
        status: 'ok',
        ...t
      }
    }))).catch(() => setSunCache(c => ({
      ...c,
      [key]: {
        status: 'error'
      }
    }))).finally(() => inflight.current.delete(key));
  }, [mountain, dateIso, sunKey, sunCache]);
  useEffect(() => {
    window.scrollTo({
      top: 0
    });
  }, [screen]);
  const showToast = useCallback(msg => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  /** 계산 로딩 연출 (펭산이 걷기) */
  const runCalc = useCallback(() => {
    setAnimating(true);
    setAnimKey(k => k + 1);
    window.clearTimeout(animTimer.current);
    animTimer.current = window.setTimeout(() => setAnimating(false), MIN_LOADING_MS);
  }, []);

  // ── 판정 (입력이 바뀌면 자동 재계산) ──
  const sunsetMin = manualMin ?? (sun.status === 'ok' ? sun.sunsetMin : null);
  const result = useMemo(() => {
    if (!mountain || !courseKey || !startHm || sunsetMin == null) return null;
    return judge({
      startMin: hmToMin(startHm),
      courseMin: mountain.courses[courseKey],
      sunsetMin
    });
  }, [mountain, courseKey, startHm, sunsetMin]);
  const phase = animating || manualMin == null && (sun.status === 'loading' || sun.status === 'idle') ? 'loading' : manualMin == null && sun.status === 'error' ? 'error' : result ? 'ready' : 'loading';
  const summary = result && mountain && courseKey ? `${mountain.name} · ${COURSE_LABEL[courseKey]} · 예상 하산 ${minToHm(result.descentMin)} · 일몰 ${minToHm(result.sunsetMin)} · ${VERDICT_META[result.verdict].shareLabel}` : '';
  const courseIdx = courseKey ? COURSE_ORDER.indexOf(courseKey) : -1;
  const shorterKey = courseIdx > 0 ? COURSE_ORDER[courseIdx - 1] : null;

  // ── 핸들러 ──
  const handleMountain = id => {
    if (id !== mountainId) setTrailheadId('');
    setMountainId(id);
  };
  const handleSubmit = () => {
    setScreen('result');
    runCalc();
  };
  const handleShorter = () => {
    if (!shorterKey) return;
    setCourseKey(shorterKey);
    setScreen('result');
    runCalc();
    showToast(`${COURSE_LABEL[shorterKey]}로 다시 계산했어요`);
  };
  const handleTomorrow = () => {
    if (dateIdx >= dateOptions.length - 1) return;
    setDateIdx(dateIdx + 1);
    runCalc();
  };
  const handleRetry = () => {
    if (!sunKey) return;
    setSunCache(c => {
      const next = {
        ...c
      };
      delete next[sunKey];
      return next;
    });
    runCalc();
  };
  const handleManual = hm => {
    if (!sunKey) return;
    setManualSunset(m => ({
      ...m,
      [sunKey]: hmToMin(hm)
    }));
    runCalc();
  };
  const handleShare = async () => {
    if (!summary) return;
    const text = `[산셋 SUNSET] ${summary}\n${DISCLAIMER}\n해가 지기 전, 우리의 산행.`;
    const outcome = await shareText('산셋 SUNSET · 펭산이의 하산 판정', text);
    if (outcome === 'copied') showToast('공유 문구를 복사했어요! 카카오톡에 붙여넣어 주세요.');else if (outcome === 'failed') showToast('공유에 실패했어요. 다시 시도해 주세요.');
  };
  const toSelect = () => setScreen('select');
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-[100dvh] w-full bg-[#14122a] sm:py-6"
  }, /*#__PURE__*/React.createElement("main", {
    className: "app-shell relative mx-auto min-h-[100dvh] w-full max-w-[420px] overflow-hidden bg-night sm:min-h-[880px]"
  }, /*#__PURE__*/React.createElement(Stars, null), /*#__PURE__*/React.createElement(Scenery, null), /*#__PURE__*/React.createElement("div", {
    className: "relative z-10 px-4 pb-[200px]"
  }, screen === 'select' && /*#__PURE__*/React.createElement(SelectScreen, {
    mountainId: mountainId,
    trailheadId: trailheadId,
    courseKey: courseKey,
    dateIdx: dateIdx,
    startHm: startHm,
    dateOptions: dateOptions,
    sun: sun,
    manualSunsetMin: manualMin,
    onMountain: handleMountain,
    onTrailhead: setTrailheadId,
    onCourse: setCourseKey,
    onDate: setDateIdx,
    onStart: setStartHm,
    onSubmit: handleSubmit
  }), screen === 'result' && /*#__PURE__*/React.createElement(ResultScreen, {
    phase: phase,
    result: result,
    summary: summary,
    usingManual: manualMin != null,
    shorterLabel: shorterKey ? COURSE_LABEL[shorterKey] : null,
    canTomorrow: dateIdx < dateOptions.length - 1,
    animKey: animKey,
    onBack: toSelect,
    onShare: handleShare,
    onShorter: handleShorter,
    onTomorrow: handleTomorrow,
    onOtherMountain: toSelect,
    onGuide: () => setScreen('guide'),
    onRetry: handleRetry,
    onManualSunset: handleManual
  }), screen === 'guide' && /*#__PURE__*/React.createElement(GuideScreen, {
    checks: checks,
    cutoffInfo: mountain && result ? {
      mountain: mountain.name,
      cutoffMin: result.cutoffMin
    } : null,
    canShorter: Boolean(shorterKey),
    onToggle: id => setChecks(c => ({
      ...c,
      [id]: !c[id]
    })),
    onShorter: handleShorter,
    onOtherMountain: toSelect,
    onBack: () => setScreen(result ? 'result' : 'select')
  }))), /*#__PURE__*/React.createElement(Toast, {
    message: toast
  }));
}
ReactDOM.createRoot(document.getElementById("root")).render( /*#__PURE__*/React.createElement(App, null));
})();