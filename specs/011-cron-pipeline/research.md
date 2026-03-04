# Research: Cron 파이프라인 엔드포인트

**Branch**: `011-cron-pipeline` | **Date**: 2026-03-03

---

## 1. RSS 파싱 라이브러리 선택

**Decision**: `rss-parser` npm 패키지 사용 (`npm install rss-parser`)

**Rationale**:
- Node.js 서버 환경(Next.js Route Handler)에서 검증된 RSS/Atom 파싱 지원
- TypeScript 타입 정의 내장 (`@types/rss-parser` 불필요)
- 단순 API: `const parser = new Parser(); const feed = await parser.parseURL(url)`
- 타임아웃, 커스텀 헤더 설정 지원

**Alternatives considered**:
- `fast-xml-parser`: 더 범용적이나 RSS 구조 파싱을 직접 구현해야 함 → 오버헤드
- `node-fetch + DOMParser`: 브라우저 DOMParser가 서버 환경에서 미지원 → 불가
- `feedparser`: 스트림 기반 API로 복잡도 증가

---

## 2. Claude API 구조화 출력(cards[] 생성)

**Decision**: `@anthropic-ai/sdk` 패키지 + `tool_use` 방식으로 cards[] JSON 강제 생성 (`npm install @anthropic-ai/sdk`)

**Rationale**:
- SRS § 3.4: "tool_use (structured output) — 스키마를 tool 정의로 강제하여 형식 오류 방지"
- `tool_use`는 Claude가 반드시 tool 호출 형식(JSON Schema 준수)으로 응답하도록 강제
- `src/lib/cards.ts`의 Zod 스키마를 JSON Schema로 변환하여 tool 정의에 활용
- API 호출 시 `tool_choice: { type: 'tool', name: 'generate_cards' }` 설정으로 반드시 카드 생성 강제

**Tool 정의 패턴**:
```
tool name: "generate_cards"
input_schema: {
  type: "object",
  properties: {
    issues: {
      type: "array",
      items: {
        properties: { entity_name, entity_type, title, cards[] }
      }
    }
  }
}
```

**Alternatives considered**:
- JSON 모드(프롬프트만): 형식 오류 발생 가능, cards[] 배열 구조 검증 불가
- Streaming: 파이프라인 특성상 완성된 응답이 필요하므로 불필요

---

## 3. 중복 실행 방지(Idempotency)

**Decision**: `pipeline_logs` 테이블의 `status='running'` + `date=오늘` 레코드 존재 여부로 판단

**Rationale**:
- 외부 분산 락(Redis 등) 불필요 — Supabase DB 조회만으로 충분
- 실행 시작 시 `pipeline_logs` INSERT → 완료 시 UPDATE로 상태 전환
- 동시 요청이 들어오면 INSERT 직전 SELECT로 'running' 상태 확인 후 409 반환
- MVP 규모(일 1회 실행)에서 충분한 방식

**Alternatives considered**:
- DB advisory lock (`pg_try_advisory_lock`): Supabase에서 직접 SQL 실행이 복잡
- 외부 Redis 락: 추가 인프라 비용, MVP 규모 대비 과도

**주의**: 파이프라인이 300초 타임아웃으로 비정상 종료 시 `status='running'`이 고착될 수 있음. 해결: 시작 시 `started_at + 360초` 이전의 'running' 상태는 `stale`로 간주하고 새 실행 허용.

---

## 4. 기사 그룹화 전략(이슈 단위 생성)

**Decision**: 수집된 기사 전체를 Claude에 한 번에 전달, Claude가 이슈 단위로 그룹화·생성

**Rationale**:
- MVP 단계: 기사 수십 건/일 규모에서 단일 Claude 호출로 충분
- 기사 내용 기반 자동 그룹화 → 종목별, 테마별, 지수/환율별 이슈 자동 분류
- Claude tool_use에서 `issues[]` 배열로 복수 이슈 동시 생성 가능

**Alternatives considered**:
- 사전 엔티티 매핑(종목 리스트 하드코딩): 유지보수 부담, 신규 종목 대응 불가
- 기사별 개별 호출: API 비용 폭증, Vercel 타임아웃 위험

---

## 5. 기존 코드 분석 요약

**현재 상태** (`src/app/api/cron/pipeline/route.ts`):
- CRON_SECRET 인증 로직 완료 ✅
- `maxDuration = 300` 설정 완료 ✅
- 파이프라인 실제 로직 전무 (TODO #11-#14)

**활용 가능한 기존 자산**:
- `src/lib/supabase/admin.ts`: Service Role Supabase 클라이언트 (RLS 우회)
- `src/lib/cards.ts`: `parseCards()` Zod 검증 함수 — 생성된 cards[] 검증에 활용
- `src/types/database.types.ts`: `media_sources`, `issues`, `feeds` 테이블 타입
- `src/lib/env.ts`: `ANTHROPIC_API_KEY`, `CRON_SECRET` 환경변수 검증

**추가 필요한 npm 패키지**:
- `rss-parser` (RSS 파싱)
- `@anthropic-ai/sdk` (Claude API)

**추가 필요한 DB 테이블**:
- `pipeline_logs` (파이프라인 실행 로그)
