# 산셋 SUNSET · 펭산이의 하산 대작전

해가 지기 전, 우리의 산행. — 입산 시각·코스·일몰 시각으로 **일몰 전 안전 하산 가능 여부**를 신호등으로 알려주는 모바일 웹앱.

## 배포

### A. 바로 배포 (빌드 불필요) — `deploy/` 폴더

`deploy/`는 이미 컴파일된 정적 사이트입니다 (index.html + assets/app.js + assets/style.css + favicon.svg).

- **Netlify Drop**: https://app.netlify.com/drop 에 `deploy` 폴더를 끌어다 놓으면 즉시 URL 발급
- **Vercel / Cloudflare Pages / GitHub Pages / 아무 정적 호스팅**: `deploy` 폴더 내용을 그대로 업로드
- HTTPS로 배포해야 휴대폰 공유(Web Share)·클립보드 복사가 정상 동작합니다.
- React는 cdnjs, 폰트는 Google Fonts에서 불러옵니다.

### B. 소스에서 빌드 (Git 연동 배포)

GitHub에 올린 뒤 Netlify/Vercel에서 저장소를 연결하면 `netlify.toml` / `vercel.json` 설정대로
`npm run build` → `dist/`가 자동 배포됩니다. (`vite.config.ts`의 `base: './'`로 하위 경로에서도 동작)

```bash
npm install
npm run dev        # http://localhost:5173 (휴대폰은 같은 Wi-Fi에서 표시되는 Network 주소로 접속)
npm run build      # dist/ 정적 배포 파일
```

### deploy/ 다시 만들기 (Node 없이)

1. `scripts/build-preview.ps1` → `preview.html` 생성
2. `scripts/serve.ps1` 실행 후 http://localhost:5180 접속, 브라우저 콘솔에서 `scripts/compile-in-browser.js`를 실행해 `build/app.js`, `build/tailwind.css` 저장 (Babel·Tailwind CDN으로 브라우저에서 컴파일)
3. `scripts/build-deploy.ps1` → `deploy/` 생성

Node가 있다면 그냥 B 방식(`npm run build`)을 쓰는 게 가장 간단합니다.

## 구조

| 파일 | 역할 |
| --- | --- |
| `src/constants.ts` | 산·좌표·들머리·코스 시간, 판정 기준(60/20분), 휴식 20분, 권장 여유 80분 |
| `src/lib/time.ts` | 시간 변환, 날짜 옵션, **판정 로직 `judge()`** |
| `src/lib/sunset.ts` | Open-Meteo 일출·일몰 조회 (Asia/Seoul, 키 불필요) |
| `src/lib/share.ts` | Web Share API → 미지원 시 클립보드 복사 |
| `src/components/` | 픽셀 펭산이, 픽셀 아이콘, 노을·산·숲 배경, 공통 UI |
| `src/screens/` | S1 산·코스 선택 / S2 하산 판정 / S3 안전 가이드 |

## 계산 기준

- 예상 하산 = 입산 + 왕복 소요 + 휴식 20분
- 권장 하산 마감 = 일몰 − 80분
- 여유 시간 = 일몰 − 예상 하산 → 🟢 60분 이상 / 🟡 20~60분 / 🔴 20분 미만 (입산이 일몰 이후면 🔴 + "이미 해가 졌어요")

※ 예상치이며 실제 안전을 보장하지 않는 참고용 결과입니다.
