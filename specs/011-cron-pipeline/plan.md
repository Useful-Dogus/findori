# Implementation Plan: Cron 파이프라인 엔드포인트

**Branch**: `011-cron-pipeline` | **Date**: 2026-03-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/011-cron-pipeline/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command.

## Summary

매일 KST 22:00 Vercel Cron이 `/api/cron/pipeline`을 호출하면, 등록된 활성 매체의 RSS를 수집하고 Claude API(`tool_use`)로 이슈 카드 초안을 생성하여 Supabase에 `draft` 상태로 저장한다. 파이프라인은 부분 실패를 허용하고, 모든 실행 결과를 `pipeline_logs` 테이블에 기록한다. Admin은 Admin UI 또는 API로 파이프라인을 수동 재실행할 수 있다.

## Technical Context

**Language/Version**: TypeScript 5.4+ / Node.js 20+
**Primary Dependencies**: `@anthropic-ai/sdk` (신규 추가), `rss-parser` (신규 추가), `@supabase/supabase-js` ^2.0, `zod` ^4.3
**Storage**: Supabase PostgreSQL — `pipeline_logs`(신규), `feeds`, `issues`, `media_sources` (기존)
**Testing**: Vitest (기존 설정 사용)
**Target Platform**: Vercel (Node.js runtime, `maxDuration: 300`)
**Project Type**: Web service — Next.js 15 App Router Route Handler
**Performance Goals**: 파이프라인 전체 완료 300초 이내; 매체별 RSS fetch 타임아웃 30초
**Constraints**: Vercel Hobby 최대 실행 시간 300초; `CRON_SECRET` 필수 인증; Service Role 키 서버 전용
**Scale/Scope**: 활성 매체 ~10개, 일 수집 기사 ~50건, 1회/일 자동 실행

## Constitution Check

*GATE: 구현 전 통과 필수*

| 원칙 | 평가 | 조치 |
|------|------|------|
| I. Code Quality | ✅ | 파이프라인 단계별 모듈 분리(`collect`, `generate`, `store`, `log`) |
| II. Tests | ✅ | 각 단계 unit test + 통합 테스트 의무화 |
| III. UX Consistency | ✅ | API 응답 형식을 기존 Admin API 패턴과 동일하게 |
| IV. Performance | ✅ | 매체별 30초 타임아웃, 전체 300초 한도 명시 |
| V. Small Delivery | ✅ | 인증 → DB 연결 → RSS 수집 → AI 생성 → 저장 순서로 점진 구현 |

**Constitution Check 결과: 통과** — 복잡성 추적 테이블 불필요

## Project Structure

### Documentation (this feature)

```text
specs/011-cron-pipeline/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── contracts/
│   └── api-endpoints.md # Phase 1 output
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit.tasks 명령으로 생성)
```

### Source Code (repository root)

```text
src/
├── app/api/
│   ├── cron/pipeline/
│   │   └── route.ts              # 기존 스켈레톤 → 실제 로직 구현
│   └── admin/pipeline/
│       ├── run/route.ts          # 기존 501 스텁 → Admin 수동 트리거 구현
│       └── logs/route.ts         # 기존 빈 응답 스텁 → 로그 조회 구현
├── lib/
│   └── pipeline/                 # 신규 디렉터리
│       ├── index.ts              # 파이프라인 오케스트레이터
│       ├── collect.ts            # RSS 수집 모듈
│       ├── generate.ts           # Claude API 카드 생성 모듈
│       ├── store.ts              # Supabase 저장 모듈
│       └── log.ts                # pipeline_logs CRUD
└── types/
    └── pipeline.ts               # 신규: 파이프라인 내부 타입 정의

supabase/migrations/
└── 20260303000000_add_pipeline_logs.sql  # 신규: pipeline_logs 테이블
```

**Structure Decision**: 기존 `src/app/api/cron/` 및 `src/app/api/admin/pipeline/` 구조를 유지하고, 파이프라인 비즈니스 로직을 `src/lib/pipeline/` 아래 분리된 모듈로 구현. 각 Route Handler는 인증 처리 후 `src/lib/pipeline/index.ts`의 오케스트레이터 함수를 호출한다.

## Complexity Tracking

*Constitution Check 통과 — 위반 없음*

---

## Phase 0: Research (완료)

→ [`research.md`](./research.md) 참조

**핵심 결정 사항**:
1. RSS 파싱: `rss-parser` npm 패키지
2. AI 카드 생성: `@anthropic-ai/sdk` + `tool_use` 강제 출력
3. 중복 실행 방지: `pipeline_logs` DB 상태 체크 (Redis 불필요)
4. 기사 그룹화: 전체 기사를 Claude에 한 번 전달, Claude가 이슈 단위 분류

---

## Phase 1: Design (완료)

### 데이터 모델 변경
→ [`data-model.md`](./data-model.md) 참조

- **신규 테이블**: `pipeline_logs` (실행 이력 + 중복 실행 방지)
- **기존 테이블 무수정**: `feeds`, `issues`, `media_sources`

### API 계약
→ [`contracts/api-endpoints.md`](./contracts/api-endpoints.md) 참조

| 엔드포인트 | 메서드 | 인증 | 역할 |
|-----------|--------|------|------|
| `/api/cron/pipeline` | GET | `CRON_SECRET` Bearer | 자동 파이프라인 트리거 |
| `/api/admin/pipeline/run` | POST | 세션 쿠키 | Admin 수동 트리거 |
| `/api/admin/pipeline/logs` | GET | 세션 쿠키 | 실행 로그 조회 |

### 구현 순서 (의존성 기준)

```
1. DB Migration (pipeline_logs 테이블)
   ↓
2. src/lib/pipeline/log.ts (DB CRUD)
   ↓
3. src/lib/pipeline/collect.ts (RSS 수집)
   ↓
4. src/lib/pipeline/generate.ts (Claude API 카드 생성)
   ↓
5. src/lib/pipeline/store.ts (Supabase 저장)
   ↓
6. src/lib/pipeline/index.ts (오케스트레이터)
   ↓
7. Route Handlers 구현
   ├── src/app/api/cron/pipeline/route.ts
   ├── src/app/api/admin/pipeline/run/route.ts
   └── src/app/api/admin/pipeline/logs/route.ts
   ↓
8. 테스트 작성
   ├── tests/unit/pipeline/collect.test.ts
   ├── tests/unit/pipeline/generate.test.ts
   ├── tests/unit/pipeline/store.test.ts
   └── tests/integration/pipeline/run.test.ts
```

### 신규 패키지 설치

```bash
npm install @anthropic-ai/sdk rss-parser
npm install -D @types/rss-parser
```
