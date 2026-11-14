import { CHECKLIST_ITEMS, RULES } from '../constants';
import { minToHm } from '../lib/time';
import { Penguin } from '../components/Penguin';
import { Icon } from '../components/PixelArt';
import { Card, Disclaimer, FormulaCard, Header, PxButton, TitleBanner } from '../components/ui';

interface GuideScreenProps {
  checks: Record<string, boolean>;
  cutoffInfo: { mountain: string; cutoffMin: number } | null;
  canShorter: boolean;
  onToggle: (id: string) => void;
  onShorter: () => void;
  onOtherMountain: () => void;
  onBack: () => void;
}

export function GuideScreen(p: GuideScreenProps) {
  const done = CHECKLIST_ITEMS.filter((i) => p.checks[i.id]).length;
  return (
    <div className="screen-enter">
      <Header chip="SAFETY GUIDE" tone="guide" onBack={p.onBack} />
      <TitleBanner>펭산이의 안전 귀환 작전</TitleBanner>

      <div className="scene-frame guide-scene relative mt-4 flex items-end gap-2 overflow-hidden px-3 pb-3 pt-6">
        <div className="relative shrink-0 bob">
          <span className="sparkle absolute -right-1 -top-4"><Icon name="sparkle" px={3} /></span>
          <Penguin mood="happy" px={4} />
        </div>
        <div className="bubble mb-6 flex-1 px-3 py-2.5 text-ink">
          <p className="text-[13px] font-black leading-snug">
            오늘도 무리하지 않고
            <br />
            안전하게 다녀오자!
          </p>
          <p className="mt-1 text-[11px] font-bold text-[#7c5cc4]">미션 성공 = 안전한 귀환</p>
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <p className="text-[14px] font-black text-white">출발 전 체크리스트</p>
        <p className="font-pixel text-[9px] text-sunny">
          {done}/{CHECKLIST_ITEMS.length}
        </p>
      </div>
      <Card className="mt-2 px-3 py-1.5">
        <ul>
          {CHECKLIST_ITEMS.map((item) => {
            const on = Boolean(p.checks[item.id]);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => p.onToggle(item.id)}
                  className="flex min-h-[52px] w-full items-center gap-3 border-b-2 border-dashed border-[#e5d3a8] text-left last:border-b-0"
                >
                  <span className={`px-check ${on ? 'is-on' : ''}`} aria-hidden>
                    {on ? '✔' : ''}
                  </span>
                  <span className="flex w-7 justify-center">
                    <Icon name={item.icon} px={2.6} />
                  </span>
                  <span className={`text-[14px] font-bold ${on ? 'text-ink' : 'text-[#6b6390]'}`}>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="px-card-lav mt-4 px-3 py-2.5">
        <p className="text-[12px] font-black text-ink">안전 팁</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-[#4a4270]">
          산속은 평지보다 빨리 어두워져요.
          <br />
          권장 하산 시각은 일몰 {RULES.SAFE_BUFFER_MIN}분 전입니다.
        </p>
        {p.cutoffInfo && (
          <p className="mt-1 text-[12px] font-black text-[#c2410c]">
            ⚑ {p.cutoffInfo.mountain} 권장 하산 마감 {minToHm(p.cutoffInfo.cutoffMin)}
          </p>
        )}
      </div>

      <div className="mt-5 space-y-3.5">
        <PxButton variant="lav" onClick={p.onShorter} disabled={!p.canShorter}>
          {p.canShorter ? '짧은 코스로 다시 계산' : '더 짧은 코스가 없어요'}
        </PxButton>
        <PxButton variant="lav" onClick={p.onOtherMountain}>
          다른 산 선택하기
        </PxButton>
      </div>
      <Disclaimer />
      <div className="mt-4">
        <FormulaCard />
      </div>
    </div>
  );
}
