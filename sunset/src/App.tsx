import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { COURSE_LABEL, COURSE_ORDER, DISCLAIMER, MIN_LOADING_MS, MOUNTAINS, VERDICT_META } from './constants';
import type { CourseKey } from './constants';
import { buildDateOptions, hmToMin, judge, minToHm, nowRoundedHm } from './lib/time';
import { fetchSunTimes } from './lib/sunset';
import { shareText } from './lib/share';
import { Scenery, Stars } from './components/Scenery';
import { Toast } from './components/ui';
import { SelectScreen } from './screens/SelectScreen';
import type { SunStatus } from './screens/SelectScreen';
import { ResultScreen } from './screens/ResultScreen';
import { GuideScreen } from './screens/GuideScreen';

type Screen = 'select' | 'result' | 'guide';

export default function App() {
  const dateOptions = useMemo(() => buildDateOptions(), []);
  const [screen, setScreen] = useState<Screen>('select');
  const [mountainId, setMountainId] = useState<string | null>(null);
  const [trailheadId, setTrailheadId] = useState('');
  const [courseKey, setCourseKey] = useState<CourseKey | null>(null);
  const [dateIdx, setDateIdx] = useState(0);
  const [startHm, setStartHm] = useState(() => nowRoundedHm());
  const [sunCache, setSunCache] = useState<Record<string, SunStatus>>({});
  const [manualSunset, setManualSunset] = useState<Record<string, number>>({});
  const [animating, setAnimating] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);
  const inflight = useRef(new Set<string>());
  const animTimer = useRef<number | undefined>(undefined);
  const toastTimer = useRef<number | undefined>(undefined);

  const mountain = MOUNTAINS.find((m) => m.id === mountainId) ?? null;
  const dateIso = dateOptions[dateIdx]?.iso ?? '';
  const sunKey = mountain ? `${mountain.id}|${dateIso}` : '';
  const sun: SunStatus = (sunKey && sunCache[sunKey]) || { status: 'idle' };
  const manualMin = sunKey && manualSunset[sunKey] != null ? manualSunset[sunKey] : null;

  // ── Open-Meteo 일몰 조회 (산·날짜 단위 캐시) ──
  useEffect(() => {
    if (!mountain || !dateIso || sunCache[sunKey] || inflight.current.has(sunKey)) return;
    const key = sunKey;
    inflight.current.add(key);
    setSunCache((c) => ({ ...c, [key]: { status: 'loading' } }));
    fetchSunTimes(mountain.lat, mountain.lon, dateIso)
      .then((t) => setSunCache((c) => ({ ...c, [key]: { status: 'ok', ...t } })))
      .catch(() => setSunCache((c) => ({ ...c, [key]: { status: 'error' } })))
      .finally(() => inflight.current.delete(key));
  }, [mountain, dateIso, sunKey, sunCache]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [screen]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  /** 계산 로딩 연출 (펭산이 걷기) */
  const runCalc = useCallback(() => {
    setAnimating(true);
    setAnimKey((k) => k + 1);
    window.clearTimeout(animTimer.current);
    animTimer.current = window.setTimeout(() => setAnimating(false), MIN_LOADING_MS);
  }, []);

  // ── 판정 (입력이 바뀌면 자동 재계산) ──
  const sunsetMin = manualMin ?? (sun.status === 'ok' ? sun.sunsetMin : null);
  const result = useMemo(() => {
    if (!mountain || !courseKey || !startHm || sunsetMin == null) return null;
    return judge({ startMin: hmToMin(startHm), courseMin: mountain.courses[courseKey], sunsetMin });
  }, [mountain, courseKey, startHm, sunsetMin]);

  const phase: 'loading' | 'error' | 'ready' =
    animating || (manualMin == null && (sun.status === 'loading' || sun.status === 'idle'))
      ? 'loading'
      : manualMin == null && sun.status === 'error'
        ? 'error'
        : result
          ? 'ready'
          : 'loading';

  const summary =
    result && mountain && courseKey
      ? `${mountain.name} · ${COURSE_LABEL[courseKey]} · 예상 하산 ${minToHm(result.descentMin)} · 일몰 ${minToHm(result.sunsetMin)} · ${VERDICT_META[result.verdict].shareLabel}`
      : '';

  const courseIdx = courseKey ? COURSE_ORDER.indexOf(courseKey) : -1;
  const shorterKey = courseIdx > 0 ? COURSE_ORDER[courseIdx - 1] : null;

  // ── 핸들러 ──
  const handleMountain = (id: string) => {
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
    setSunCache((c) => {
      const next = { ...c };
      delete next[sunKey];
      return next;
    });
    runCalc();
  };

  const handleManual = (hm: string) => {
    if (!sunKey) return;
    setManualSunset((m) => ({ ...m, [sunKey]: hmToMin(hm) }));
    runCalc();
  };

  const handleShare = async () => {
    if (!summary) return;
    const text = `[산셋 SUNSET] ${summary}\n${DISCLAIMER}\n해가 지기 전, 우리의 산행.`;
    const outcome = await shareText('산셋 SUNSET · 펭산이의 하산 판정', text);
    if (outcome === 'copied') showToast('공유 문구를 복사했어요! 카카오톡에 붙여넣어 주세요.');
    else if (outcome === 'failed') showToast('공유에 실패했어요. 다시 시도해 주세요.');
  };

  const toSelect = () => setScreen('select');

  return (
    <div className="min-h-[100dvh] w-full bg-[#14122a] sm:py-6">
      <main className="app-shell relative mx-auto min-h-[100dvh] w-full max-w-[420px] overflow-hidden bg-night sm:min-h-[880px]">
        <Stars />
        <Scenery />
        <div className="relative z-10 px-4 pb-[200px]">
          {screen === 'select' && (
            <SelectScreen
              mountainId={mountainId}
              trailheadId={trailheadId}
              courseKey={courseKey}
              dateIdx={dateIdx}
              startHm={startHm}
              dateOptions={dateOptions}
              sun={sun}
              manualSunsetMin={manualMin}
              onMountain={handleMountain}
              onTrailhead={setTrailheadId}
              onCourse={setCourseKey}
              onDate={setDateIdx}
              onStart={setStartHm}
              onSubmit={handleSubmit}
            />
          )}
          {screen === 'result' && (
            <ResultScreen
              phase={phase}
              result={result}
              summary={summary}
              usingManual={manualMin != null}
              shorterLabel={shorterKey ? COURSE_LABEL[shorterKey] : null}
              canTomorrow={dateIdx < dateOptions.length - 1}
              animKey={animKey}
              onBack={toSelect}
              onShare={handleShare}
              onShorter={handleShorter}
              onTomorrow={handleTomorrow}
              onOtherMountain={toSelect}
              onGuide={() => setScreen('guide')}
              onRetry={handleRetry}
              onManualSunset={handleManual}
            />
          )}
          {screen === 'guide' && (
            <GuideScreen
              checks={checks}
              cutoffInfo={mountain && result ? { mountain: mountain.name, cutoffMin: result.cutoffMin } : null}
              canShorter={Boolean(shorterKey)}
              onToggle={(id) => setChecks((c) => ({ ...c, [id]: !c[id] }))}
              onShorter={handleShorter}
              onOtherMountain={toSelect}
              onBack={() => setScreen(result ? 'result' : 'select')}
            />
          )}
        </div>
      </main>
      <Toast message={toast} />
    </div>
  );
}
