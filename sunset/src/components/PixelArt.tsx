import type { ReactElement } from 'react';

export type Palette = Record<string, string>;

interface PixelArtProps {
  rows: string[];
  palette: Palette;
  /** 픽셀 1칸의 화면 크기(px) */
  px?: number;
  className?: string;
  title?: string;
}

/** 문자열 격자를 픽셀 SVG로 그립니다. '.' 은 투명. 같은 색 가로 연속은 하나의 rect로 합칩니다. */
export function PixelArt({ rows, palette, px = 3, className, title }: PixelArtProps) {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const rects: ReactElement[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      let run = 1;
      while (x + run < row.length && row[x + run] === c) run++;
      const fill = palette[c];
      if (c !== '.' && fill) {
        rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={run} height={1.04} fill={fill} />);
      }
      x += run;
    }
  });
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w * px}
      height={h * px}
      shapeRendering="crispEdges"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {rects}
    </svg>
  );
}

const OUT = '#231d45';

export const ICONS: Record<string, { rows: string[]; palette: Palette }> = {
  mountain: {
    rows: ['....W....', '...WPW...', '..LPPPP..', '.LLPPPPP.', 'LLLPPPPPP'],
    palette: { W: '#ffffff', P: '#6d5bd0', L: '#9d8cf0' },
  },
  lantern: {
    rows: ['......KKK.', 'KKKKKKGGGY', 'KRRRRKGGGY', 'KKKKKKGGGY', '......KKK.'],
    palette: { K: OUT, G: '#a5a9c4', R: '#e8590c', Y: '#ffe066' },
  },
  battery: {
    rows: ['..KK..', 'KKKKKK', 'KYYYYK', 'KYWYYK', 'KYYYYK', 'KOOOOK', 'KOOOOK', 'KKKKKK'],
    palette: { K: OUT, Y: '#ffd43b', O: '#f08c00', W: '#fff7cc' },
  },
  water: {
    rows: ['..KK..', '..KK..', '.KBBK.', 'KBLBBK', 'KBLBBK', 'KBBBBK', 'KBBBBK', 'KKKKKK'],
    palette: { K: OUT, B: '#4dabf7', L: '#d0ebff' },
  },
  phone: {
    rows: ['KKKKKK', 'KRRRRK', 'KRWWRK', 'KRWWRK', 'KRRRRK', 'KRWRWK', 'KRRRRK', 'KKKKKK'],
    palette: { K: OUT, R: '#f03e3e', W: '#ffe3e3' },
  },
  boot: {
    rows: ['.KKK...', '.KCK...', '.KCK...', '.KCCKK.', '.KCCCCK', '.KKKKKK'],
    palette: { K: OUT, C: '#37b24d' },
  },
  sparkle: {
    rows: ['..Y..', '..Y..', 'YYWYY', '..Y..', '..Y..'],
    palette: { Y: '#ffe066', W: '#ffffff' },
  },
};

export function Icon({ name, px = 3, color, className }: { name: string; px?: number; color?: string; className?: string }) {
  const icon = ICONS[name];
  if (!icon) return null;
  const palette = color ? { ...icon.palette, C: color } : icon.palette;
  return <PixelArt rows={icon.rows} palette={palette} px={px} className={className} />;
}
