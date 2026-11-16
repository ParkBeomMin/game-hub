# Game Hub

BeomMin Park의 오리지널 브라우저 게임을 모아 두는 허브입니다.

- 라이브: https://parkbeommin.github.io/game-hub/
- 저장소: https://github.com/ParkBeomMin/game-hub

광고 스크립트는 넣지 않았습니다. 모든 게임과 에셋은 직접 제작한 것입니다.

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

표지·OG 이미지를 다시 만들 때는 `python3 tools/build-assets.py`를 실행하세요. 원본은 이 저장소가 아니라 로컬 작업 폴더의 제출용 스크린샷을 읽습니다.

## 로컬에서 보기

정적 파일이므로 아무 HTTP 서버나 됩니다.

```bash
python3 -m http.server 8080
```

브라우저에서 http://localhost:8080/ 을 엽니다. `file://`로 열면 `games.json`을 불러오지 못할 수 있습니다.

## Pages

GitHub Pages는 `main` 브랜치 루트를 사용합니다. 프로젝트 사이트 주소는 `/game-hub/` 입니다. `parkbeommin.github.io` 사용자 사이트 저장소는 건드리지 마세요(ads.txt 보관용).
