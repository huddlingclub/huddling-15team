# 평산이의 하산 대작전 — 에셋 카탈로그

픽셀 UI 제작에 사용하는 SVG 및 PNG 컴포넌트를 한곳에 정리한 문서입니다.

## 구성

| 형식 | 수량 | 위치 | 설명 |
|---|---:|---|---|
| SVG | 41개 | [`assets/svg`](assets/svg/) | 원본 스프라이트에서 분리한 개별 에셋 |
| PNG | 5개 | [`assets/png`](assets/png/) | 버튼, 패널, 말풍선 UI 컴포넌트 |
| 원본 | 2개 | [`assets/source`](assets/source/) | 전달받은 SVG 시트와 2048×2048 스프라이트 |

SVG 전체 미리보기는 [`assets/index.html`](assets/index.html)에서 확인할 수 있으며, 크기와 원본 패턴 정보는 [`assets/manifest.csv`](assets/manifest.csv)에 정리되어 있습니다.

## PNG 컴포넌트

### 라벤더 버튼

- 파일: [`button_lavender.png`](assets/png/button_lavender.png)
- 크기: 1658 × 362 px
- 형식: RGBA PNG
- 용도: 보조 액션, 이전 단계, 다시 선택하기

![라벤더 픽셀 버튼](assets/png/button_lavender.png)

### 노란색 버튼

- 파일: [`button_yellow.png`](assets/png/button_yellow.png)
- 크기: 1658 × 272 px
- 형식: RGBA PNG
- 용도: 주요 액션, 확인, 다음 단계

![노란색 픽셀 버튼](assets/png/button_yellow.png)

### 라벤더 패널

- 파일: [`panel_lavender.png`](assets/png/panel_lavender.png)
- 크기: 1600 × 1859 px
- 형식: RGBA PNG
- 용도: 설정, 선택지, 체크리스트 등 세로형 콘텐츠

![라벤더 픽셀 패널](assets/png/panel_lavender.png)

### 크림 패널

- 파일: [`panel_cream.png`](assets/png/panel_cream.png)
- 크기: 1600 × 1147 px
- 형식: RGBA PNG
- 용도: 결과, 안내, 미션 등 가로형 콘텐츠

![크림 픽셀 패널](assets/png/panel_cream.png)

### 말풍선

- 파일: [`speech_bubble.png`](assets/png/speech_bubble.png)
- 크기: 1600 × 1034 px
- 형식: RGBA PNG
- 용도: 캐릭터 대사, 도움말, 상태 안내

![크림색 픽셀 말풍선](assets/png/speech_bubble.png)

## SVG 에셋

개별 파일은 `asset-01.svg`부터 `asset-41.svg`까지 일련번호로 관리합니다. 각 SVG는 공통 파일인 [`sprite-sheet.png`](assets/source/sprite-sheet.png)를 상대 경로로 참조하므로, 배포하거나 이동할 때 `assets/svg`와 `assets/source`의 폴더 관계를 유지해야 합니다.

- [`asset-01.svg`](assets/svg/asset-01.svg) — 415 × 214
- [`asset-02.svg`](assets/svg/asset-02.svg) ~ [`asset-10.svg`](assets/svg/asset-10.svg)
- [`asset-11.svg`](assets/svg/asset-11.svg) ~ [`asset-20.svg`](assets/svg/asset-20.svg)
- [`asset-21.svg`](assets/svg/asset-21.svg) ~ [`asset-30.svg`](assets/svg/asset-30.svg)
- [`asset-31.svg`](assets/svg/asset-31.svg) ~ [`asset-40.svg`](assets/svg/asset-40.svg)
- [`asset-41.svg`](assets/svg/asset-41.svg)

## 사용 가이드

- 버튼과 패널 PNG에는 텍스트가 포함되어 있지 않으므로, 실제 문구는 별도의 텍스트 레이어로 올립니다.
- 픽셀 테두리가 흐려지지 않도록 가능하면 원본 비율을 유지하고 정수 배율로 축소·확대합니다.
- 패널 내부 콘텐츠는 장식 테두리와 충분한 간격을 두어 배치합니다.
- PNG의 투명 배경을 유지하려면 JPG로 변환하지 않습니다.
- 웹에서 사용할 때는 이미지에 의미 있는 대체 텍스트를 지정합니다.

## 원본 및 재생성

- 원본 SVG: [`design-assets.svg`](assets/source/design-assets.svg)
- 원본 스프라이트: [`sprite-sheet.png`](assets/source/sprite-sheet.png)
- 추출 도구: [`extract_assets.py`](tools/extract_assets.py)

```sh
python3 tools/extract_assets.py
```
