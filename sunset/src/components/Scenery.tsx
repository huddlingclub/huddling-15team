import type { ReactElement } from 'react';
import type { Verdict } from '../constants';

function rangeHeights(width: number, peaks: [number, number][], slope: number, step: number): number[] {
  const out: number[] = [];
  for (let x = 0; x < width; x++) {
    let h = 0;
    peaks.forEach(([px, ph]) => {
      const v = ph - Math.floor(Math.abs(x - px) / step) * step * slope;
      if (v > h) h = v;
    });
    out.push(Math.max(0, Math.round(h)));
  }
  return out;
}

function nearestPeak(x: number, peaks: [number, number][]) {
  let best = peaks[0];
  peaks.forEach((p) => {
    if (Math.abs(p[0] - x) < Math.abs(best[0] - x)) best = p;
  });
  return best;
}

/** 화면 하단의 노을 + 보라 산 + 초록 숲 픽셀 배경 */
export function Scenery() {
  const W = 100;
  const H = 72;
  const rects: ReactElement[] = [];
  let k = 0;
  const r = (x: number, y: number, w: number, h: number, fill: string) =>
    rects.push(<rect key={k++} x={x} y={y} width={w} height={h + 0.05} fill={fill} />);

  // 노을 띠 (위에서 아래로)
  const bands = ['#2c2558', '#3b2f6e', '#57408a', '#80509f', '#b4649f', '#e0819f', '#f3a08e', '#ffbf86'];
  bands.forEach((c, i) => r(0, 6 + i * 4, W, 4, c));
  r(0, 38, W, H - 38, '#ffbf86');

  // 별
  [[8, 2], [23, 5], [41, 1], [63, 4], [77, 2], [92, 6], [33, 8], [85, 10]].forEach(([x, y]) => r(x, y, 1, 1, '#fff6d6'));

  // 해 (반쯤 산 뒤로)
  const sx = 70, sy = 34, sr = 5;
  for (let dy = -sr; dy <= sr; dy++) {
    const half = Math.floor(Math.sqrt(sr * sr - dy * dy));
    r(sx - half, sy + dy, half * 2 + 1, 1, dy < -2 ? '#fff3b0' : '#ffd166');
  }

  // 뒷산
  const backPeaks: [number, number][] = [[14, 44], [46, 52], [82, 46]];
  const back = rangeHeights(W, backPeaks, 1, 2);
  back.forEach((h, x) => {
    if (h <= 0) return;
    const [px, ph] = nearestPeak(x, backPeaks);
    r(x, H - h, 1, h, x <= px ? '#9d8ff0' : '#7a6bd0');
    if (h > ph - 6) r(x, H - h, 1, Math.min(3, h - (ph - 9)), '#f4f1ff');
  });

  // 앞산
  const frontPeaks: [number, number][] = [[0, 30], [28, 36], [60, 31], [94, 37]];
  const front = rangeHeights(W, frontPeaks, 1.5, 2);
  front.forEach((h, x) => {
    if (h <= 0) return;
    const [px] = nearestPeak(x, frontPeaks);
    r(x, H - h, 1, h, x <= px ? '#5e4ca8' : '#4a3a8f');
  });

  // 나무
  const base = H - 11;
  for (let i = 0; i < 26; i++) {
    const tx = i * 4 + (i % 2);
    const th = 7 + ((i * 7) % 5);
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
  for (let x = 1; x < W; x += 6) r(x, H - 7 + (x % 3), 2, 1, '#237a35');
  for (let x = 3; x < W; x += 9) r(x, H - 11, 1, 1, '#8ce99a');
  r(0, H - 3, W, 3, '#3a2d6b');

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      shapeRendering="crispEdges"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[300px] w-full"
      aria-hidden
    >
      {rects}
    </svg>
  );
}

const SCENE_BANDS: Record<Verdict, string[]> = {
  green: ['#6c5bb5', '#9a63b3', '#cf78ac', '#ef94a3', '#f8b08f', '#ffcb87'],
  yellow: ['#55448f', '#8a55a3', '#c66e9f', '#ea8a99', '#f5a585', '#fcbd7c'],
  red: ['#221f4a', '#302a62', '#463679', '#64438a', '#8d5296', '#b9629a'],
};

const SUN_Y: Record<Verdict, number> = { green: 13, yellow: 20, red: 26 };

/** 판정 화면의 노을 배경 (판정별로 해의 높이·하늘색이 달라짐) */
export function SunsetScene({ verdict }: { verdict: Verdict }) {
  const W = 80;
  const H = 32;
  const rects: ReactElement[] = [];
  let k = 0;
  const r = (x: number, y: number, w: number, h: number, fill: string) =>
    rects.push(<rect key={k++} x={x} y={y} width={w} height={h + 0.05} fill={fill} />);

  SCENE_BANDS[verdict].forEach((c, i) => r(0, i * 4, W, 4, c));
  r(0, 24, W, 8, SCENE_BANDS[verdict][5]);

  if (verdict === 'red') {
    [[6, 2], [15, 6], [27, 3], [52, 2], [63, 7], [74, 4], [40, 9], [70, 12]].forEach(([x, y]) =>
      r(x, y, 1, 1, '#fff6d6'),
    );
  }

  // 해
  const sx = verdict === 'green' ? 66 : 50, sy = SUN_Y[verdict], sr = 5;
  for (let dy = -sr; dy <= sr; dy++) {
    const half = Math.floor(Math.sqrt(sr * sr - dy * dy));
    r(sx - half, sy + dy, half * 2 + 1, 1, verdict === 'red' ? '#ff8a5c' : dy < -1 ? '#fff3b0' : '#ffd166');
  }

  // 구름
  const cloud = (x: number, y: number) => {
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

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      shapeRendering="crispEdges"
      className="absolute inset-0 h-full w-full"
      aria-hidden
    >
      {rects}
    </svg>
  );
}

/** 상단 밤하늘의 반짝이는 별 */
export function Stars() {
  const stars = Array.from({ length: 26 }, (_, i) => ({
    left: (i * 37) % 100,
    top: (i * 53) % 46,
    size: i % 4 === 0 ? 3 : 2,
    delay: (i % 7) * 0.4,
  }));
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[460px]" aria-hidden>
      {stars.map((s, i) => (
        <span
          key={i}
          className="star absolute bg-[#fff6d6]"
          style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s` }}
        />
      ))}
    </div>
  );
}
