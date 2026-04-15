# terarium-tutorial

Terarium 에이전트를 처음 생성하는 튜토리얼 웹 앱입니다. 운영 주소는 `https://tutorial.team-doob.com`입니다.

## 역할

- 사용자의 이름, 나이, 외형 입력을 받아 에이전트를 생성합니다.
- LLM을 사용해 연애 관점의 페르소나와 하루 루틴을 생성합니다.
- 생성된 에이전트는 PostgreSQL의 `agent_profiles`, `agent_appearances`, `agent_states` 등에 직접 저장됩니다.
- 세션 ID 개념은 사용하지 않고, 생성된 UUID를 `agent_id`로 사용합니다.

## 주요 구성

| 경로 | 설명 |
| --- | --- |
| `src/` | React/Vite 튜토리얼 UI |
| `server.js` | 튜토리얼 API, LLM 호출, PostgreSQL 저장 처리 |
| `src/persona_interview_prompts.json` | 페르소나/루틴 생성 프롬프트 데이터 |
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

## 배포

이 레포에 push하면 `DESKTOP-3B84I03` self-hosted runner가 `VILAB` 로그인 세션에서 `D:\doob`의 로컬 레포들을 pull한 뒤 `terarium-deploy`의 Compose 스택을 직접 재빌드/재기동합니다.

## 관련 레포

| 레포 | 역할 |
| --- | --- |
| `terarium-deploy` | Docker Compose, PostgreSQL, Cloudflared, admin/API |
| `terarium-social-web` | 소셜 미디어 웹 |
| `terarium-world-server` | 월드 시뮬레이션과 LLM 판단 서버 |
| `terarium-world-viewer` | 월드 시각화 클라이언트 |

