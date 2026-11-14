import { COURSE_COLOR, COURSE_LABEL, COURSE_ORDER, MOUNTAINS } from '../constants';
import type { CourseKey } from '../constants';
import type { DateOption } from '../lib/time';
import { formatDuration, hmToMin, minToHm, minToKorean } from '../lib/time';
import { Penguin } from '../components/Penguin';
import { Icon } from '../components/PixelArt';
import { Card, Header, Logo, PxButton, TitleBanner } from '../components/ui';

export type SunStatus =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; sunriseMin: number; sunsetMin: number }
  | { status: 'error' };

interface SelectScreenProps {
  mountainId: string | null;
  trailheadId: string;
  courseKey: CourseKey | null;
  dateIdx: number;
  startHm: string;
  dateOptions: DateOption[];
  sun: SunStatus;
  manualSunsetMin: number | null;
  onMountain: (id: string) => void;
  onTrailhead: (id: string) => void;
  onCourse: (key: CourseKey) => void;
  onDate: (idx: number) => void;
  onStart: (hm: string) => void;
  onSubmit: () => void;
}

export function SelectScreen(p: SelectScreenProps) {
  const mountain = MOUNTAINS.find((m) => m.id === p.mountainId) ?? null;
  const ready = Boolean(mountain && p.trailheadId && p.courseKey && p.startHm);
  const missing = [!mountain && '산', !p.trailheadId && '들머리', !p.courseKey && '코스'].filter(Boolean).join(' · ');

  return (
    <div className="screen-enter">
      <Logo />
      <Header chip="QUEST 01" tone="quest" />
      <TitleBanner>오늘은 어느 산에 갈까?</TitleBanner>

      {/* 펭산이 소개 */}
      <Card className="mt-4 flex items-center gap-3 px-3 py-3">
        <div className="bob shrink-0">
          <Penguin px={3} />
        </div>
        <div>
          <p className="text-[14px] font-black leading-snug text-ink">
            펭산이와 안전하게
            <br />
            돌아올 산행을 준비해요!
          </p>
          <p className="mt-1 text-[11.5px] font-bold text-[#7c5cc4]">해가 지기 전, 우리의 산행.</p>
        </div>
      </Card>

      {/* 산 목록 */}
      <ul className="mt-4 space-y-2.5" aria-label="산 선택">
        {MOUNTAINS.map((m) => {
          const on = m.id === p.mountainId;
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => p.onMountain(m.id)}
                aria-pressed={on}
                className={`px-select flex min-h-[48px] w-full items-center gap-3 px-3 text-left ${on ? 'is-on' : ''}`}
              >
                <Icon name="mountain" px={3} />
                <span className="flex-1 text-[15px] font-black text-ink">{m.name}</span>
                <span className={`text-[11px] font-bold ${on ? 'text-ink' : 'text-[#7d7699]'}`}>
                  {on ? '선택됨 ▶' : `${m.region} ›`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* 들머리 / 날짜 */}
      <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
        <label className="px-field relative block px-3 pb-1.5 pt-1.5">
          <span className="block text-[11px] text-[#8a7f63]">들머리</span>
          <select
            value={p.trailheadId}
            onChange={(e) => p.onTrailhead(e.target.value)}
            disabled={!mountain}
            className="px-select-native h-8 w-full truncate pr-5 text-[14px] font-black text-ink disabled:text-[#a59d86]"
          >
            <option value="">{mountain ? '들머리를 선택하세요' : '산을 먼저 골라요'}</option>
            {mountain?.trailheads.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <span className="caret">▾</span>
        </label>
        <label className="px-field relative block w-[118px] px-3 pb-1.5 pt-1.5">
          <span className="block text-[11px] text-[#8a7f63]">날짜</span>
          <select
            value={p.dateIdx}
            onChange={(e) => p.onDate(Number(e.target.value))}
            className="px-select-native h-8 w-full pr-5 text-[14px] font-black text-ink"
          >
            {p.dateOptions.map((d, i) => (
              <option key={d.iso} value={i}>
                {d.label}
              </option>
            ))}
          </select>
          <span className="caret">▾</span>
        </label>
      </div>

      {/* 입산 시간 */}
      <label className="px-field relative mt-3 block px-3 pb-1.5 pt-1.5">
        <span className="flex justify-between text-[11px] text-[#8a7f63]">
          <span>입산 시간</span>
          <span>{p.startHm ? minToKorean(hmToMin(p.startHm)) : ''}</span>
        </span>
        <input
          type="time"
          value={p.startHm}
          onChange={(e) => p.onStart(e.target.value)}
          className="h-9 w-full bg-transparent text-[16px] font-black text-ink outline-none"
          aria-label="입산 시간"
        />
      </label>

      {/* 코스 */}
      <p className="mt-4 text-[13px] font-bold text-white">코스 선택 · 왕복 소요 시간</p>
      <div className="mt-2 grid grid-cols-3 gap-2.5" role="radiogroup" aria-label="코스 선택">
        {COURSE_ORDER.map((key) => {
          const on = key === p.courseKey;
          const mins = mountain?.courses[key];
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={!mountain}
              onClick={() => p.onCourse(key)}
              className={`px-select flex min-h-[64px] flex-col items-center justify-center gap-0.5 px-1 py-2 ${on ? 'is-on' : ''}`}
            >
              <span className="flex items-center gap-1.5 text-[14px] font-black text-ink">
                <Icon name="boot" px={2} color={COURSE_COLOR[key]} />
                {COURSE_LABEL[key]}
              </span>
              <span className="text-[11px] font-bold text-[#6b6390]">{mins ? formatDuration(mins) : '—'}</span>
            </button>
          );
        })}
      </div>

      {/* API 안내 */}
      <div className="px-card-lav mt-4 px-3 py-2">
        <p className="text-[12px] font-bold text-ink">☀ Open-Meteo 일몰 · 일출 조회</p>
        <p className="mt-0.5 text-[11px] text-[#6b6390]">
          {p.manualSunsetMin != null
            ? `직접 입력한 일몰 ${minToHm(p.manualSunsetMin)} 사용 중`
            : p.sun.status === 'ok'
              ? `${p.dateOptions[p.dateIdx]?.full} 일출 ${minToHm(p.sun.sunriseMin)} · 일몰 ${minToHm(p.sun.sunsetMin)}`
              : p.sun.status === 'loading'
                ? '일몰 시각을 불러오는 중…'
                : p.sun.status === 'error'
                  ? '조회 실패 · 결과 화면에서 일몰 시각을 직접 입력할 수 있어요'
                  : '실패 시 일몰 시각 직접 입력'}
        </p>
      </div>

      <PxButton className="mt-5" disabled={!ready} onClick={p.onSubmit}>
        하산 가능 여부 확인하기 ▶
      </PxButton>
      {!ready && <p className="mt-2 text-center text-[11.5px] font-bold text-[#cfc8ff]">{missing}을(를) 골라 주세요</p>}
    </div>
  );
}
