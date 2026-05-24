# terarium-tutorial

Terarium 에이전트를 처음 생성하는 튜토리얼 웹 앱입니다. 운영 주소는 `https://tutorial.team-doob.com`입니다.

## 역할

- 사용자의 이름, 나이, 외형 입력을 받아 에이전트를 생성합니다.
- LLM을 사용해 사회적 상호작용에 필요한 페르소나만 생성합니다.
- 루틴은 더 이상 생성하지 않습니다. 월드 서버는 현재 스냅샷과 기억을 바탕으로 행동을 결정합니다.
- 생성된 에이전트는 PostgreSQL의 `agent_profiles`, `agent_appearances`, `agent_states` 등에 직접 저장됩니다.
- 세션 ID 개념은 사용하지 않고, 생성된 UUID를 `agent_id`로 사용합니다.

## 주요 구성

| 경로 | 설명 |
| --- | --- |
| `src/` | React/Vite 튜토리얼 UI |
| `server.js` | 튜토리얼 API, LLM 호출, PostgreSQL 저장 처리 |
| `src/persona_interview_prompts.json` | 페르소나 생성 프롬프트 데이터 |
| `Dockerfile` | 클라이언트 빌드와 Node 런타임 이미지 구성 |
| `.env.example` | 로컬 실행용 환경 변수 예시 |
| `.github/workflows/` | GHCR 이미지 빌드/푸시 워크플로 |

## 로컬 개발

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

로컬 개발 시 `.env`에는 LLM 키와 PostgreSQL 접속 정보를 넣어야 합니다. 운영 배포에서는 `terarium-deploy/env/tutorial.env`와 `terarium-deploy/env/postgres.env`가 주입됩니다.

## 빌드

```powershell
npm run build
```

Docker 이미지 빌드:

```powershell
docker build -t doob-terarium-tutorial:local .
```

## 관련 레포

| 레포 | 역할 |
| --- | --- |
| `terarium-deploy` | Docker Compose, PostgreSQL, Cloudflared, admin/API |
| `terarium-social-web` | 소셜 미디어 웹 |
| `terarium-world-server` | 월드 시뮬레이션과 LLM 판단 서버 |
| `terarium-world-viewer` | 월드 시각화 클라이언트 |

