import { useState } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { GAUGE_SEGMENTS, RULES, VERDICT_META, DISCLAIMER } from '../constants';
import type { Verdict } from '../constants';
import { minToHm } from '../lib/time';
import { Penguin } from './Penguin';
import { Icon } from './PixelArt';

/* ── 타이틀 로고: 펭산이의 하산 대작전 ── */
export function Logo() {
  return (
    <div className="logo relative mx-auto mb-1 mt-1 flex w-fit select-none flex-col items-center">
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 opacity-90">
        <Icon name="mountain" px={6} />
      </div>
      <div className="relative z-10 mt-5 flex items-end gap-1">
        <span className="logo-small">펭산이의</span>
        <Penguin px={1.6} mood="happy" className="mb-0.5" />
      </div>
      <div className="logo-big relative z-10">하산 대작전</div>
    </div>
  );
}

/* ── 상단 상태 칩 + SUNSET 표기 ── */
const CHIP_COLOR: Record<string, string> = {
  quest: '#ff8a5c',
  green: '#51cf66',
  yellow: '#ffd43b',
  red: '#ff6b6b',
  guide: '#ffd43b',
};

export function Header({ chip, tone, onBack }: { chip: string; tone: keyof typeof CHIP_COLOR; onBack?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 pt-3">
      <div className="flex items-center gap-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="px-back flex h-12 w-12 items-center justify-center font-pixel text-[12px] text-white"
            aria-label="뒤로 가기"
          >
            ◀
          </button>
        )}
        <span className="px-chip font-pixel text-[9px]" style={{ color: CHIP_COLOR[tone], borderColor: CHIP_COLOR[tone] }}>
          {chip}
        </span>
      </div>
      <span className="font-pixel text-[11px] tracking-wider text-white">SUNSET</span>
    </div>
  );
}

export function TitleBanner({ children }: { children: ReactNode }) {
  return (
    <h1 className="px-banner mt-3 py-2.5 text-center text-[18px] font-black tracking-tight text-ink">{children}</h1>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`px-card ${className}`}>{children}</div>;
}

type BtnVariant = 'yellow' | 'lav';

export function PxButton({
  variant = 'yellow',
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  return (
    <button
      type="button"
      {...rest}
      className={`px-btn px-btn-${variant} min-h-[52px] w-full px-4 text-[16px] font-black text-ink ${className}`}
    >
      {children}
    </button>
  );
}

/* ── 말풍선 ── */
export function Bubble({ text, className = '' }: { text: string; className?: string }) {
  return (
    <div className={`bubble whitespace-pre-line text-center text-[12.5px] font-bold leading-snug text-ink ${className}`}>
      {text}
    </div>
  );
}

/* ── 신호등 아이콘: 색 + 기호 + 텍스트 ── */
const LAMP_SYMBOL: Record<Verdict, string> = { green: '✓', yellow: '!', red: '✕' };

export function TrafficLamp({ verdict, size = 44 }: { verdict: Verdict; size?: number }) {
  const meta = VERDICT_META[verdict];
  return (
    <span
      className="lamp-box inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={`신호등 ${meta.shareLabel}`}
      role="img"
    >
      <span
        className="lamp flex items-center justify-center font-black text-white"
        style={{ background: meta.color, boxShadow: `0 0 12px 2px ${meta.color}`, width: size * 0.62, height: size * 0.62, fontSize: size * 0.34 }}
      >
        {LAMP_SYMBOL[verdict]}
      </span>
    </span>
  );
}

/* ── 일몰까지 남은 시간 게이지 ── */
export function Gauge({
  startMin,
  descentMin,
  sunsetMin,
  verdict,
}: {
  startMin: number;
  descentMin: number;
  sunsetMin: number;
  verdict: Verdict;
}) {
  const meta = VERDICT_META[verdict];
  const total = sunsetMin - startMin;
  const ratio = total <= 0 ? 1 : Math.min(1, Math.max(0, (descentMin - startMin) / total));
  const filled = Math.max(1, Math.round(ratio * GAUGE_SEGMENTS));
  const overrun = descentMin > sunsetMin;
  const cutoffRatio = total <= 0 ? 0 : (sunsetMin - RULES.SAFE_BUFFER_MIN - startMin) / total;
  return (
    <div className="px-card-lav px-3 pb-2.5 pt-2">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-bold text-ink">일몰까지 남은 시간</span>
        <span className="text-[11px] font-bold" style={{ color: meta.dark }}>
          {overrun ? '하산 전 해가 져요' : `산행 ${Math.round(ratio * 100)}% · 남는 해 ${100 - Math.round(ratio * 100)}%`}
        </span>
      </div>
      <div className="relative mt-1.5">
        <div className="gauge-track flex gap-[3px] p-[3px]" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(ratio * 100)} aria-label="일몰까지 산행이 차지하는 비율">
          {Array.from({ length: GAUGE_SEGMENTS }, (_, i) => {
            const on = i < filled;
            return (
              <span
                key={i}
                className={`h-[14px] flex-1 ${on ? 'seg-on' : ''} ${on && overrun && i === GAUGE_SEGMENTS - 1 ? 'seg-blink' : ''}`}
                style={{
                  background: on ? meta.color : '#e7e4f7',
                  boxShadow: on ? `inset 0 -3px 0 ${meta.dark}` : 'inset 0 -3px 0 #cfcaea',
                  animationDelay: `${i * 70}ms`,
                }}
              />
            );
          })}
        </div>
        {cutoffRatio > 0 && cutoffRatio < 1 && (
          <span
            className="absolute -top-1 h-[26px] w-[2px] bg-ink"
            style={{ left: `calc(${cutoffRatio * 100}% )` }}
            title="권장 하산 마감"
            aria-hidden
          />
        )}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-[#6b6390]">
        <span>
          입산 <b className="font-pixel text-[9px]">{minToHm(startMin)}</b>
        </span>
        <span className="flex items-center gap-1 text-[10px]">
          <i className="inline-block h-3 w-[2px] bg-ink" />
          권장 하산 마감
        </span>
        <span className="font-bold text-ink">
          일몰 <b className="font-pixel text-[9px]">{minToHm(sunsetMin)}</b>
        </span>
      </div>
    </div>
  );
}

/* ── 상태 카드들 ── */
export function LoadingCard() {
  return (
    <Card className="overflow-hidden px-4 py-4">
      <p className="font-pixel text-[11px] text-ink">
        LOADING<span className="loading-dots" />
      </p>
      <p className="mt-2 text-[13px] font-bold text-[#4a4270]">일몰 시각과 하산 시간을 계산 중이에요.</p>
      <div className="relative mt-3 h-[70px] border-b-4 border-dashed border-[#c9b98f]">
        <div className="walker absolute bottom-0">
          <Penguin px={3} walking />
        </div>
      </div>
    </Card>
  );
}

export function ErrorCard({ onRetry, onManual }: { onRetry: () => void; onManual: (hm: string) => void }) {
  const [hm, setHm] = useState('17:30');
  return (
    <Card className="px-4 py-4">
      <p className="text-[15px] font-black text-stop">API 조회에 실패했어요</p>
      <p className="mt-1 text-[13px] font-bold text-[#4a4270]">일몰 시각을 직접 입력하거나 다시 시도할 수 있어요.</p>
      <label className="px-field mt-3 block px-3 py-2">
        <span className="block text-[11px] text-[#8a7f63]">일몰 시각 직접 입력</span>
        <input
          type="time"
          value={hm}
          onChange={(e) => setHm(e.target.value)}
          className="mt-0.5 h-9 w-full bg-transparent text-[16px] font-black text-ink outline-none"
        />
      </label>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <PxButton onClick={() => hm && onManual(hm)} disabled={!hm}>
          이 시각으로 계산
        </PxButton>
        <PxButton variant="lav" onClick={onRetry}>
          다시 시도
        </PxButton>
      </div>
    </Card>
  );
}

export function FormulaCard() {
  return (
    <div className="px-card-lav px-3 py-2.5">
      <p className="text-[12px] font-black text-ink">판정 공식</p>
      <p className="mt-0.5 text-[11.5px] leading-relaxed text-[#4a4270]">
        예상 하산 = 입산 + 왕복 소요 + 휴식 {RULES.REST_MIN}분 · 권장 하산 = 일몰 − {RULES.SAFE_BUFFER_MIN}분
        <br />
        여유 {RULES.GREEN_MIN}분↑ 🟢 · {RULES.YELLOW_MIN}~{RULES.GREEN_MIN}분 🟡 · {RULES.YELLOW_MIN}분 미만 🔴
      </p>
    </div>
  );
}

export function Disclaimer() {
  return <p className="disclaimer mt-3 px-2 py-1.5 text-center text-[11px] text-[#d9d4ff]">{DISCLAIMER}</p>;
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="toast fixed bottom-6 left-1/2 z-50 w-[90vw] max-w-[340px] -translate-x-1/2 px-4 py-3 text-center text-[13px] font-bold text-white" role="status">
      {message}
    </div>
  );
}
