import { VERDICT_META } from '../constants';
import type { JudgeResult } from '../lib/time';
import { formatDuration, minToHm } from '../lib/time';
import { Penguin } from '../components/Penguin';
import { Icon } from '../components/PixelArt';
import { SunsetScene } from '../components/Scenery';
import { Bubble, Card, Disclaimer, ErrorCard, FormulaCard, Gauge, Header, LoadingCard, PxButton, TitleBanner, TrafficLamp } from '../components/ui';

interface ResultScreenProps {
  phase: 'loading' | 'error' | 'ready';
  result: JudgeResult | null;
  summary: string;
  usingManual: boolean;
  shorterLabel: string | null;
  canTomorrow: boolean;
  animKey: number;
  onBack: () => void;
  onShare: () => void;
  onShorter: () => void;
  onTomorrow: () => void;
  onOtherMountain: () => void;
  onGuide: () => void;
  onRetry: () => void;
  onManualSunset: (hm: string) => void;
}

function InfoRow({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between border-b-2 border-dashed border-[#e5d3a8] py-2.5 last:border-b-0">
      <span className="flex items-center gap-1.5 text-[13px] font-bold text-[#4a4270]">
        <span className="w-4 text-center text-[11px]" style={{ color: color ?? '#e8590c' }}>
          {icon}
        </span>
        {label}
      </span>
      <span
        className={/^-?\d{2}:\d{2}$/.test(value) ? 'font-pixel text-[12px]' : 'text-[16px] font-black'}
        style={{ color: color ?? '#2a2350' }}
      >
        {value}
      </span>
    </div>
  );
}

export function ResultScreen(p: ResultScreenProps) {
  const r = p.result;
  const verdict = r?.verdict ?? 'green';
  const meta = VERDICT_META[verdict];
  const chip = p.phase === 'ready' && r ? meta.chip : p.phase === 'error' ? 'RESULT · ERROR' : 'RESULT · ···';

  return (
    <div className="screen-enter">
      <Header chip={chip} tone={p.phase === 'ready' ? verdict : 'quest'} onBack={p.onBack} />
      <TitleBanner>펭산이의 하산 판정!</TitleBanner>

      {p.phase === 'loading' && (
        <div className="mt-4">
          <LoadingCard />
        </div>
      )}

      {p.phase === 'error' && (
        <div className="mt-4 space-y-4">
          <ErrorCard onRetry={p.onRetry} onManual={p.onManualSunset} />
          <PxButton variant="lav" onClick={p.onOtherMountain}>
            다른 산 선택하기
          </PxButton>
        </div>
      )}

      {p.phase === 'ready' && r && (
        <div key={p.animKey}>
          {/* 1. 신호등 판정 */}
          <Card className="verdict-pop mt-4 px-3 py-3.5 text-center">
            <div className="flex items-center justify-center gap-3">
              <TrafficLamp verdict={verdict} />
              <span className="text-[26px] font-black tracking-tight" style={{ color: meta.dark }}>
                {meta.title}
              </span>
            </div>
            <p className="mt-1.5 text-[13.5px] font-bold text-[#4a4270]">
              {r.alreadyDark ? '이미 해가 졌어요! 오늘은 쉬고 다음에 도전하자!' : meta.line}
            </p>
          </Card>

          {/* 2. 펭산이 + 말풍선 */}
          <div className="scene-frame relative mt-4 h-[150px] overflow-hidden">
            <SunsetScene verdict={verdict} />
            {verdict === 'green' ? (
              <div className="absolute inset-0 flex items-end justify-center pb-3">
                <span className="sparkle absolute left-[18%] top-[30%]"><Icon name="sparkle" px={3} /></span>
                <span className="sparkle absolute right-[20%] top-[22%]" style={{ animationDelay: '.4s' }}><Icon name="sparkle" px={3} /></span>
                <span className="sparkle absolute left-[34%] top-[10%]" style={{ animationDelay: '.8s' }}><Icon name="sparkle" px={2} /></span>
                <span className="absolute left-[56%] top-[10%] font-pixel text-[14px] text-[#ffd43b] drop-shadow-[2px_2px_0_#2a2350]">!!</span>
                <div className="jump">
                  <Penguin mood="happy" px={4.4} />
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-end gap-1 px-3 pb-3">
                <div className={`relative shrink-0 ${verdict === 'yellow' ? 'tilt' : 'doze'}`}>
                  <span
                    className="mark absolute -top-5 right-0 font-pixel text-[14px] drop-shadow-[2px_2px_0_#2a2350]"
                    style={{ color: verdict === 'yellow' ? '#8fd8ff' : '#dcd7ff' }}
                  >
                    {verdict === 'yellow' ? '?' : 'zZ'}
                  </span>
                  <Penguin mood={verdict === 'yellow' ? 'curious' : 'sleep'} px={4} />
                </div>
                {meta.bubble && <Bubble text={meta.bubble} className="mb-10 flex-1 px-3 py-2.5" />}
              </div>
            )}
          </div>

          {/* 3. 정보 카드 */}
          <Card className="mt-4 px-3.5 py-1">
            <InfoRow icon="▶" label="예상 하산" value={minToHm(r.descentMin)} />
            <InfoRow icon="☀" label="일몰 시각" value={minToHm(r.sunsetMin)} color={undefined} />
            <InfoRow icon="◷" label="여유 시간" value={formatDuration(r.marginMin)} color={meta.dark} />
            <InfoRow icon="⚑" label="권장 하산 마감" value={minToHm(r.cutoffMin)} />
          </Card>
          {p.usingManual && (
            <p className="mt-1.5 text-right text-[11px] font-bold text-[#cfc8ff]">* 직접 입력한 일몰 시각 기준</p>
          )}

          {/* 4. 게이지 */}
          <div className="mt-4">
            <Gauge startMin={r.startMin} descentMin={r.descentMin} sunsetMin={r.sunsetMin} verdict={verdict} />
          </div>

          {/* 5. 버튼 */}
          <div className="mt-5 space-y-3.5">
            {verdict === 'green' && (
              <>
                <PxButton onClick={p.onShare}>카카오톡으로 결과 공유</PxButton>
                <p className="px-1 text-center text-[11px] text-[#cfc8ff]">“{p.summary}”</p>
              </>
            )}
            {verdict === 'yellow' && (
              <>
                <PxButton variant="lav" onClick={p.onShorter} disabled={!p.shorterLabel}>
                  {p.shorterLabel ? '짧은 코스로 다시 계산' : '이미 가장 짧은 코스예요'}
                </PxButton>
                <PxButton variant="lav" onClick={p.onOtherMountain}>
                  다른 산 선택하기
                </PxButton>
              </>
            )}
            {verdict === 'red' && (
              <>
                <PxButton onClick={p.onTomorrow} disabled={!p.canTomorrow}>
                  내일 산행으로 다시 계산
                </PxButton>
                <PxButton variant="lav" onClick={p.onOtherMountain}>
                  다른 산 선택하기
                </PxButton>
              </>
            )}
            <button
              type="button"
              onClick={p.onGuide}
              className="guide-link flex min-h-[48px] w-full items-center justify-center gap-2 text-[14px] font-black text-sunny"
            >
              🛡 안전 가이드 보기 ▶
            </button>
          </div>

          <Disclaimer />
          <div className="mt-4">
            <FormulaCard />
          </div>
        </div>
      )}
    </div>
  );
}
