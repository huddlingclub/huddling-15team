import assert from 'node:assert/strict'
import { test } from 'node:test'
import { judgeDescent, verdictFromMargin } from './judge.ts'
import { EMPTY_STAMPS, grantBadge, parseStamps, recordMountain } from './badges.ts'
import { buildShareText } from './share.ts'
import { verdictCopy } from '../content.ts'
import {
  formatClock,
  formatDuration,
  isNextDay,
  isPlausibleSunset,
  joinClock,
  parseClock,
  parseOpenMeteoLocal,
  seoulDateKey,
  seoulMinutes,
  splitClock,
  targetDateKey,
} from './time.ts'

test('판정 경계: 60분 이상 초록, 20~59분 노랑, 20분 미만 빨강', () => {
  assert.equal(verdictFromMargin(61), 'green')
  assert.equal(verdictFromMargin(60), 'green')
  assert.equal(verdictFromMargin(59), 'yellow')
  assert.equal(verdictFromMargin(20), 'yellow')
  assert.equal(verdictFromMargin(19), 'red')
  assert.equal(verdictFromMargin(0), 'red')
  assert.equal(verdictFromMargin(-45), 'red')
})

test('기준값은 인자로 바꿀 수 있다', () => {
  assert.equal(verdictFromMargin(45, { greenMin: 40, yellowMin: 10 }), 'green')
})

test('예상 하산 = 입산 + 왕복 + 휴식 20분, 여유 = 일몰 - 예상 하산', () => {
  // 14:00 입산, 왕복 4시간 + 휴식 20분 → 18:20 하산. 일몰 17:20이면 60분 늦음.
  const late = judgeDescent({ nowMin: 14 * 60, roundTripMin: 240, sunsetMin: 17 * 60 + 20 })
  assert.equal(late.finishMin, 18 * 60 + 20)
  assert.equal(late.marginMin, -60)
  assert.equal(late.verdict, 'red')

  // 10:00 입산, 왕복 2시간 30분 + 휴식 → 12:50 하산. 일몰 17:20이면 270분 여유.
  const early = judgeDescent({ nowMin: 10 * 60, roundTripMin: 150, sunsetMin: 17 * 60 + 20 })
  assert.equal(early.finishMin, 12 * 60 + 50)
  assert.equal(early.marginMin, 270)
  assert.equal(early.verdict, 'green')
})

test('권장 하산 마감 = 일몰 - 80분', () => {
  const result = judgeDescent({ nowMin: 10 * 60, roundTripMin: 150, sunsetMin: 18 * 60 + 42 })
  assert.equal(result.recommendedFinishMin, 17 * 60 + 22)
})

test('같은 시각이라도 코스가 길어지면 판정이 나빠진다', () => {
  const base = { nowMin: 13 * 60, sunsetMin: 17 * 60 + 20 }
  assert.equal(judgeDescent({ ...base, roundTripMin: 150 }).verdict, 'green') // 여유 90
  assert.equal(judgeDescent({ ...base, roundTripMin: 200 }).verdict, 'yellow') // 여유 40
  assert.equal(judgeDescent({ ...base, roundTripMin: 300 }).verdict, 'red') // 여유 -60
})

test('한국 시간 기준 분 계산은 기기 시간대와 무관하다', () => {
  // 2026-11-14 08:05 UTC = 17:05 KST
  assert.equal(seoulMinutes(new Date('2026-11-14T08:05:00Z')), 17 * 60 + 5)
  // UTC 날짜는 14일 16:00이지만 한국은 이미 15일 01:00
  assert.equal(seoulDateKey(new Date('2026-11-14T16:00:00Z')), '2026-11-15')
  assert.equal(seoulMinutes(new Date('2026-11-14T16:00:00Z')), 60)
})

test('내일 날짜 키는 한국 날짜 기준으로 하루 뒤다', () => {
  // UTC 11-14 16:00 = 한국 11-15 01:00 → 내일은 11-16
  const now = new Date('2026-11-14T16:00:00Z')
  assert.equal(targetDateKey('today', now), '2026-11-15')
  assert.equal(targetDateKey('tomorrow', now), '2026-11-16')
})

test('공유 문구', () => {
  const text = buildShareText({
    mountainName: '북한산',
    courseLabel: '보통 코스',
    finishMin: 17 * 60 + 20,
    sunsetMin: 18 * 60 + 42,
    verdictTitle: '도전 가능!',
  })
  assert.equal(text, '북한산 · 보통 코스 · 예상 하산 17:20 · 일몰 18:42 · 도전 가능')
})

test('내일 산행 공유 문구는 앞에 "내일"이 붙는다', () => {
  const text = buildShareText({
    mountainName: '북한산',
    courseLabel: '짧은 코스',
    finishMin: 12 * 60,
    sunsetMin: 17 * 60 + 20,
    verdictTitle: '도전 가능!',
    day: 'tomorrow',
  })
  assert.equal(text, '내일 북한산 · 짧은 코스 · 예상 하산 12:00 · 일몰 17:20 · 도전 가능')
})

test('직접 입력한 일몰 시각은 16:00~21:00만 받는다', () => {
  assert.equal(isPlausibleSunset(5 * 60), false)
  assert.equal(isPlausibleSunset(16 * 60 - 1), false)
  assert.equal(isPlausibleSunset(16 * 60), true)
  assert.equal(isPlausibleSunset(17 * 60 + 20), true)
  assert.equal(isPlausibleSunset(21 * 60), true)
  assert.equal(isPlausibleSunset(21 * 60 + 1), false)
})

test('배지는 한 번만 받고, 처음 받은 날짜가 유지된다', () => {
  const first = grantBadge(EMPTY_STAMPS, 'green-light', '2026-11-14')
  assert.equal(first.earned['green-light'], '2026-11-14')
  const again = grantBadge(first, 'green-light', '2026-11-20')
  assert.equal(again, first)
  assert.equal(again.earned['green-light'], '2026-11-14')
})

test('확인한 산은 중복 없이 기록한다', () => {
  let state = recordMountain(EMPTY_STAMPS, 'bukhan')
  state = recordMountain(state, 'bukhan')
  state = recordMountain(state, 'inwang')
  assert.deepEqual(state.mountains, ['bukhan', 'inwang'])
})

test('저장된 글자가 이상해도 안전하게 읽는다', () => {
  assert.deepEqual(parseStamps(null), EMPTY_STAMPS)
  assert.deepEqual(parseStamps('깨진 글자'), EMPTY_STAMPS)
  const parsed = parseStamps(
    JSON.stringify({ earned: { ready: '2026-11-14', hacked: 'x' }, mountains: ['bukhan', 'bukhan', 'everest'] }),
  )
  assert.deepEqual(parsed.earned, { ready: '2026-11-14' })
  assert.deepEqual(parsed.mountains, ['bukhan'])
})

test('12시간제 변환: 오전 12시는 0시, 오후 12시는 12시', () => {
  assert.deepEqual(splitClock(0), { meridiem: 'am', hour12: 12, minute: 0 })
  assert.deepEqual(splitClock(12 * 60 + 45), { meridiem: 'pm', hour12: 12, minute: 45 })
  assert.deepEqual(splitClock(15 * 60), { meridiem: 'pm', hour12: 3, minute: 0 })
  assert.equal(joinClock('am', 12, 0), 0)
  assert.equal(joinClock('pm', 12, 45), 12 * 60 + 45)
  assert.equal(joinClock('pm', 3, 5), 15 * 60 + 5)
  // 모든 분에서 되돌려도 같은 값이 나온다.
  for (let minutes = 0; minutes < 1440; minutes++) {
    const { meridiem, hour12, minute } = splitClock(minutes)
    assert.equal(joinClock(meridiem, hour12, minute), minutes)
  }
})

test('시각 파싱', () => {
  assert.equal(parseClock('17:23'), 17 * 60 + 23)
  assert.equal(parseClock('7:05'), 7 * 60 + 5)
  assert.equal(parseClock('24:00'), null)
  assert.equal(parseClock('12:60'), null)
  assert.equal(parseClock('abc'), null)
  assert.equal(parseOpenMeteoLocal('2026-11-14T17:20'), 17 * 60 + 20)
  assert.equal(parseOpenMeteoLocal('invalid'), null)
})

test('시각·시간 표시', () => {
  assert.equal(formatClock(17 * 60 + 5), '17:05')
  assert.equal(formatClock(1500), '01:00')
  assert.equal(isNextDay(1500), true)
  assert.equal(isNextDay(1439), false)
  assert.equal(formatDuration(0), '0분')
  assert.equal(formatDuration(59), '59분')
  assert.equal(formatDuration(120), '2시간')
  assert.equal(formatDuration(75), '1시간 15분')
  assert.equal(formatDuration(-40), '40분')
})

test('내일 판정이 빨강이면 "오늘" 대신 "내일" 문구를 쓴다', () => {
  assert.equal(verdictCopy('red', 'today').badge, '이 시간 비추천!')
  assert.equal(verdictCopy('red', 'tomorrow').badge, '이 시간 비추천!')
  assert.ok(!verdictCopy('red', 'tomorrow').bubble.includes('오늘'))
  assert.ok(!verdictCopy('red', 'tomorrow').guide.includes('오늘'))
  assert.equal(verdictCopy('green', 'tomorrow').badge, '도전 가능!')
  assert.equal(verdictCopy('yellow', 'tomorrow').badge, '주의 필요!')
})
