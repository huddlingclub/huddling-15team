import { useEffect, useState } from 'react';
import { PixelArt } from './PixelArt';

export type PenguinMood = 'normal' | 'happy' | 'curious' | 'sleep';

// 펭산이 원본 형태: 검정·흰 몸, 노란 부리·발, 하늘색 삼각 스카프 (22 x 21)
const PENGUIN_BASE = [
  '......KKKKKKKKKK......',
  '....KKKKKKKKKKKKKK....',
  '...KKKKKKKKKKKKKKKK...',
  '..KKKKWWWWKKWWWWKKKK..',
  '..KKKWWWWWWWWWWWWKKK..',
  '.KKKWWWWWWWWWWWWWWKKK.',
  '.KKKWWWWWWWWWWWWWWKKK.',
  '.KKKWPWWWYYYYWWWPWKKK.',
  '.KKKWWWWWWOOWWWWWWKKK.',
  '..KKKWWWWWWWWWWWWKKK..',
  '..BBBBBBBBBBBBBBBBBB..',
  '..DBBBBBBBBBBBBBBBBD..',
  '.KKBBBDWWWWWWWWWWWKKK.',
  'KKKBBDWWWWWWWWWWWWWKKK',
  'KK.KBDWWWWWWWWWWWWK.KK',
  'K..KWWWWWWWWWWWWWWK..K',
  '...KWWWWWWWWWWWWWWK...',
  '...KKWWWWWWWWWWWWKK...',
  '....KKKWWWWWWWWKKK....',
  '.....KKKKKKKKKKKK.....',
  '....YYYY......YYYY....',
];

const FEET_STEP = '.....YYYY....YYYY.....';

const PENGUIN_PALETTE = {
  K: '#1d1b33',
  W: '#fffaf0',
  Y: '#ffc83d',
  O: '#f08c00',
  B: '#8fd8ff',
  D: '#3fa9f5',
  P: '#ffa8b8',
  E: '#1d1b33',
};

type Px = [number, number]; // [row, col]

function set(grid: string[][], pts: Px[], c: string) {
  pts.forEach(([r, col]) => {
    if (grid[r] && col >= 0 && col < grid[r].length) grid[r][col] = c;
  });
}

function buildRows(mood: PenguinMood, step: boolean): string[] {
  const g = PENGUIN_BASE.map((r) => r.split(''));
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
  return g.map((r) => r.join(''));
}

interface PenguinProps {
  mood?: PenguinMood;
  px?: number;
  walking?: boolean;
  className?: string;
}

export function Penguin({ mood = 'normal', px = 4, walking = false, className }: PenguinProps) {
  const [step, setStep] = useState(false);
  useEffect(() => {
    if (!walking) return;
    const id = window.setInterval(() => setStep((s) => !s), 220);
    return () => window.clearInterval(id);
  }, [walking]);
  return (
    <PixelArt
      rows={buildRows(mood, walking && step)}
      palette={PENGUIN_PALETTE}
      px={px}
      className={className}
      title="펭산이"
    />
  );
}
