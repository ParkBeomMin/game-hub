# Game Hub

BeomMin Park의 오리지널 브라우저 게임을 모아 두는 허브입니다.

- 라이브: https://parkbeommin.github.io/game-hub/
- 저장소: https://github.com/ParkBeomMin/game-hub

허브 페이지에는 섹션 사이 반응형 AdSense 디스플레이 배너가 있습니다. 지금은 테스트 모드(`data-adtest="on"`)와 비맞춤 요청(`requestNonPersonalizedAds=1`)입니다. 슬롯은 추천(신작) 영역 아래(`3931053754`), 게임 카드 목록 아래(`7076091848`), 푸터 위(`6340052688`)입니다. 실광고 전환과 EU/UK 방문자를 위한 동의 화면(CMP)은 별도 확인이 필요합니다. 모든 게임과 에셋은 직접 제작한 것입니다.

## 새 게임 추가하는 법

데이터는 루트의 [`games.json`](games.json) 한 파일만 수정하면 됩니다. `games` 배열에 객체를 하나 추가하세요.

| 필드 | 설명 |
| --- | --- |
| `id` | 영문 소문자 식별자 (`trayora`, `swingloom` 같은 값) |
| `name.ko` / `name.en` | 표시 이름 |
| `shortDescription.ko` / `shortDescription.en` | 카드에 들어갈 짧은 소개 |
| `thumbnail` | 카드 표지 이미지 경로 (16:9 webp/png, 약 150KB 이하 권장). `assets/games/`에 파일을 넣습니다. |
| `screenshots` | 선택. 지금 디자인에서는 쓰지 않지만 기록용으로 남겨 둡니다. |
| `tags.ko` / `tags.en` | 장르 태그 배열 |
| `status` | `"live"` 또는 `"coming soon"` |
| `playMode` | `"self"`(우리가 호스팅한 플레이 URL) 또는 `"portal"`(Poki 등 포털 페이지 URL) |
| `url` | 플레이 링크. 아직 없으면 `null`. `status`가 `"coming soon"`이면 버튼이 비활성화됩니다. |
| `released` | 공개일 `"YYYY-MM-DD"`(서울 시간 기준, 게임 저장소를 처음 공개한 날). 카드·출시 기록·'최근 7일' 필터에 쓰이고, 신작 순서와 `No.0N` 번호도 이 날짜로 정합니다. 새 게임을 추가할 때 **꼭 함께 넣어 주세요.** 없으면 공개일이 "—"로 보이고 배열 순서(뒤쪽 = 최신)로 정렬합니다. |
| `featured` | 선택. `true`면 큰 신작 카드·NEW 도장·모바일 하단 바에 고정합니다. 없으면 가장 최신(맨 뒤) 게임이 들어갑니다. |

예시:

```json
{
  "id": "new-game",
  "name": { "ko": "새 게임", "en": "New Game" },
  "shortDescription": { "ko": "한 줄 소개.", "en": "One-line pitch." },
  "thumbnail": "assets/games/new-game-thumb.webp",
  "screenshots": [],
  "tags": { "ko": ["퍼즐"], "en": ["Puzzle"] },
  "status": "live",
  "released": "2026-11-23",
  "playMode": "self",
  "url": "https://parkbeommin.github.io/new-game/"
}
```

Poki 독점처럼 포털로만 플레이하게 바꿀 때는 해당 항목만 이렇게 바꿉니다.

```json
"status": "live",
"playMode": "portal",
"url": "https://poki.com/en/g/your-game"
```

### 카드 미니 미리보기와 카드 색 (6번째 게임부터 꼭)

카드와 큰 신작 카드 안의 작은 화면은 이미지가 아니라 [`js/hub.js`](js/hub.js)가 캔버스에 직접 그리는 장면입니다(240×180 논리 픽셀, 화면에 보일 때만 약 30fps로 움직이고, 동작 줄이기 설정이면 멈춘 한 장면만 그립니다). 함수가 없으면 `thumbnail` 이미지로 대신 보여 주니 깨지지는 않지만, 새 게임을 올릴 때 아래 세 군데를 같이 추가하세요.

1. `js/hub.js`의 `DRAW` 객체에 게임 `id`와 같은 이름의 함수를 추가합니다. `(c, t)`를 받아 `c`(2D 컨텍스트)에 `t`(초) 시점의 장면을 그립니다. 처음에 `W×H` 전체를 배경색으로 칠하고, 3~5초 주기로 반복되는 게임의 핵심 동작 하나(놓기, 점프, 따먹기 등)를 보여 주면 됩니다. 원작 게임의 그림을 따라 그리지 말고 우리 게임의 색과 모양만 씁니다.
   ```js
   "new-game"(c, t) {
     c.fillStyle = "#18203a"; c.fillRect(0, 0, W, H);
     const k = (t % 4) / 4;           // 0→1 반복
     c.fillStyle = "#ffd84d"; rr(c, 20 + k * 180, 80, 24, 24, 6);
   },
   ```
2. 같은 파일의 `TONES`에 카드 파스텔 배경색(`"new-game": "#e3f1c8"` 처럼 밝은 파스텔), `DOTS`에 게임팩 라벨 점 색(게임의 대표색)을 추가합니다. 없으면 `id`에서 색을 자동으로 정합니다.
3. [`tools/build-og.py`](tools/build-og.py)의 `TONES`에도 같은 파스텔을 넣고 `python3 tools/build-og.py`를 실행합니다.

확인: `python3 -m http.server 8080` 후 http://localhost:8080/?lang=ko 에서 새 카드가 맨 앞에 NEW 도장과 함께 나오고, 큰 신작 카드와 모바일 하단 바가 새 게임을 가리키는지 봅니다.

언어는 `navigator.language`가 `ko`로 시작하면 한국어, 아니면 영어이며, 선택은 `localStorage` 키 `gamehub.lang.v1`에 저장됩니다. 주소에 `?lang=ko`나 `?lang=en`을 붙이면 그 언어로 고정해서 엽니다.

OG 이미지(`assets/og-image.png`)와 앱 아이콘(`assets/icons/*.png`)은 `python3 tools/build-og.py`로 다시 만듭니다. 최신 게임의 `thumbnail`과 나머지 게임 번호 칩을 쓰니, 새 게임을 올린 뒤 꼭 실행하세요. `assets/favicon.svg`는 같은 마크를 손으로 적은 SVG입니다. 트레이오라·스윙룸 표지는 `python3 tools/build-assets.py`로 만듭니다(원본은 로컬 작업 폴더의 스크린샷, 아이콘은 더 이상 만들지 않음).

## 구조

- `index.html`: 밝은 종이 배경의 두뇌 게임 사이트형 레이아웃. 큰 제목 → 큰 신작 카드 + 이용 방법·출시 기록 → 게임 카드 그리드(전체/최근 7일 필터) → FAQ. 신작 카드 아래·게임 목록 아래·푸터 앞에 반응형 디스플레이 광고 슬롯 3곳. 모바일은 신작으로 가는 하단 바.
- `js/hub.js`: `games.json` 로드, 언어 전환, 정렬, 화면 그리기, 카드 미니 미리보기(`DRAW`)
- `css/hub.css`: 스타일(404 페이지 포함). 폰트는 Pretendard(jsDelivr)와 IBM Plex Mono(Google Fonts), 둘 다 OFL
- `404.html`: 같은 스타일의 없는 주소 안내
- `preview/`: 새 디자인 시안을 보던 주소. 지금은 루트로 바로 넘겨 줍니다.
- `css/style.css`, `js/app.js`, `js/core.js`: 2026-11-26 이전 디자인(레거시). 어떤 페이지도 불러오지 않으며, 예전 페이지를 캐시한 방문자를 위해 잠시 남겨 둡니다. 다음 정리 때 지워도 됩니다.

## 로컬에서 보기

정적 파일이므로 아무 HTTP 서버나 됩니다.

```bash
python3 -m http.server 8080
```

브라우저에서 http://localhost:8080/ 을 엽니다. 광고 슬롯이 비어 숨겨질 때 자리만 보려면 http://localhost:8080/?ads=preview 를 씁니다. `file://`로 열면 `games.json`을 불러오지 못할 수 있습니다.

## Pages

GitHub Pages는 `main` 브랜치 루트를 사용합니다. 프로젝트 사이트 주소는 `/game-hub/` 입니다. `parkbeommin.github.io` 사용자 사이트 저장소는 건드리지 마세요(ads.txt 보관용).
