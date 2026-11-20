# Game Hub

BeomMin Park의 오리지널 브라우저 게임을 모아 두는 허브입니다.

- 라이브: https://parkbeommin.github.io/game-hub/
- 저장소: https://github.com/ParkBeomMin/game-hub

허브 페이지에는 섹션 사이 반응형 AdSense 디스플레이 배너가 있습니다. 지금은 테스트 모드(`data-adtest="on"`)와 비맞춤 요청(`requestNonPersonalizedAds=1`)입니다. 슬롯은 추천 게임 아래(`3931053754`), 둘러보기 아래(`7076091848`), 푸터 위(`6340052688`)입니다. 실광고 전환과 EU/UK 방문자를 위한 동의 화면(CMP)은 별도 확인이 필요합니다. 모든 게임과 에셋은 직접 제작한 것입니다.

## 새 게임 추가하는 법

데이터는 루트의 [`games.json`](games.json) 한 파일만 수정하면 됩니다. `games` 배열에 객체를 하나 추가하세요.

| 필드 | 설명 |
| --- | --- |
| `id` | 영문 소문자 식별자 (`trayora`, `swingloom` 같은 값) |
| `name.ko` / `name.en` | 표시 이름 |
| `shortDescription.ko` / `shortDescription.en` | 카드에 들어갈 짧은 소개 |
| `thumbnail` | 카드 표지 이미지 경로 (16:9 webp/png, 약 150KB 이하 권장). `assets/games/`에 파일을 넣습니다. |
| `screenshots` | 선택. 카드 아래 갤러리에 쓰일 이미지 경로 배열 |
| `tags.ko` / `tags.en` | 장르 태그 배열 |
| `status` | `"live"` 또는 `"coming soon"` |
| `playMode` | `"self"`(우리가 호스팅한 플레이 URL) 또는 `"portal"`(Poki 등 포털 페이지 URL) |
| `url` | 플레이 링크. 아직 없으면 `null`. `status`가 `"coming soon"`이면 버튼이 비활성화됩니다. |
| `released` | 공개일 `"YYYY-MM-DD"`(서울 시간 기준, 게임 저장소를 처음 공개한 날). 상세 패널·목록·출시 기록에 표시되고, 신작 순서도 이 날짜로 정합니다. 새 게임을 추가할 때 **꼭 함께 넣어 주세요.** 없으면 공개일이 "—"로 보이고 배열 순서(뒤쪽 = 최신)로 정렬합니다. |
| `featured` | 선택. `true`면 추천 캐러셀 첫 장에 고정합니다. 없으면 가장 최신 게임이 첫 장입니다. |
| `platforms` | 선택. `{ "ko": "...", "en": "..." }` 형태의 지원 기기 문구. 없으면 "휴대폰 · PC (브라우저)"로 표시합니다. |

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

언어는 `navigator.language`가 `ko`로 시작하면 한국어, 아니면 영어이며, 선택은 `localStorage` 키 `gamehub.lang.v1`에 저장됩니다.

OG 이미지는 `python3 tools/build-og.py`로 다시 만듭니다. `games.json`의 공개일 기준 최신 게임 3개 썸네일을 쓰니, 새 게임을 올린 뒤 실행하세요. 트레이오라·스윙룸 표지와 아이콘은 `python3 tools/build-assets.py`로 만듭니다(원본은 로컬 작업 폴더의 스크린샷).

## 구조

- `index.html`: 스토어형 레이아웃(추천 캐러셀, 바로 플레이 카드, 신작/모든 게임/장르별 탭과 상세 패널, 장르 타일, 출시 기록, FAQ). 추천 배너 뒤·둘러보기와 장르 사이·푸터 앞에 반응형 디스플레이 광고 슬롯 3곳.
- `js/core.js`: `games.json` 로드, 언어 전환, 정렬
- `js/app.js`: 화면 그리기
- `css/style.css`: 스타일. 폰트는 Google Fonts의 Black Han Sans와 IBM Plex Sans KR(둘 다 OFL)

## 로컬에서 보기

정적 파일이므로 아무 HTTP 서버나 됩니다.

```bash
python3 -m http.server 8080
```

브라우저에서 http://localhost:8080/ 을 엽니다. 광고 슬롯이 비어 숨겨질 때 자리만 보려면 http://localhost:8080/?ads=preview 를 씁니다. `file://`로 열면 `games.json`을 불러오지 못할 수 있습니다.

## Pages

GitHub Pages는 `main` 브랜치 루트를 사용합니다. 프로젝트 사이트 주소는 `/game-hub/` 입니다. `parkbeommin.github.io` 사용자 사이트 저장소는 건드리지 마세요(ads.txt 보관용).
