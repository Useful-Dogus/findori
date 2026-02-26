# 핀도리 (Findori) MVP SRS

> 문서 버전: v1.0
> 최종 수정일: 2026-02-26
> 목적: MVP 구현에 필요한 시스템 요구사항, 기술 결정, 데이터 모델, API, 파이프라인을 정의한다.
> 참고 문서: `prd.md`, `feature-spec.md`, `design-guidelines.md`

---

## 1. 개요

본 문서는 핀도리 MVP의 소프트웨어 요구사항 명세(SRS)다.
PRD/Feature Spec이 "무엇을 만드는가"를 정의한다면, SRS는 "어떻게 만드는가"의 기술 기준을 정의한다.

### 1.1 용어/상태 정합 기준

- 사용자 노출 최소 단위는 `이슈 카드`다.
- 일일 발행 단위는 `이슈 카드 스트림`이다.
- 상태 세트는 `loading`, `empty`, `error`로 고정한다.

---

## 2. 시스템 아키텍처 및 기술 스택

### 2.1 결정 컨텍스트

- 개발 주체: 1인 개발자 + AI 에이전트 중심 개발
- 초기 사용자 규모: 수십 명 이하
- 우선 조건: 운영 부담 최소화, 에이전트 친화적 코드베이스, 비용 효율

### 2.2 기술 스택

| 레이어            | 기술                                 | 비고                            |
| ----------------- | ------------------------------------ | ------------------------------- |
| 프레임워크        | Next.js 15 (App Router) + TypeScript | Full-stack 단일 코드베이스      |
| 스타일링          | Tailwind CSS v4                      | 디자인 토큰 → utility 직결      |
| 데이터베이스      | Supabase (PostgreSQL)                | 관리형, TypeScript SDK          |
| API               | Next.js Route Handlers               | 별도 서버 불필요                |
| 배포              | Vercel                               | 제로 설정, git push → 자동 배포 |
| 콘텐츠 파이프라인 | Claude API (Anthropic)               | 뉴스 → cards[] JSON 생성        |

### 2.3 아키텍처 결정 근거

- **Next.js SSR**: 공유 링크 진입 시 즉시 렌더링 (NFR: 공유 링크 응답성)
- **Supabase**: SQL 스키마 기반 — 에이전트가 구조를 그대로 읽고 쿼리 생성 가능
- **단일 레포**: 프론트엔드, API, 파이프라인 스크립트를 하나의 레포에서 관리
- **Vercel 무료 티어**: 수십 명 규모에서 인프라 비용 없음

---

## 3. 콘텐츠 파이프라인

### 3.1 개요

장 마감 후 매일 오후 10시에 자동 실행되는 반자동 파이프라인이다.
AI가 이슈 카드 초안을 생성하고, 운영자가 Admin UI에서 검토·수정·승인 후 이슈 카드 스트림에 발행한다.

### 3.2 파이프라인 흐름

```
[Vercel Cron: 매일 22:00]
  → 1. 화이트리스트 매체에서 신규 기사 수집
  → 2. Claude API로 사전 정의된 카드 스키마에 맞게 카드 데이터 생성
  → 3. Supabase에 draft 상태로 저장
  → 4. 운영자가 Admin UI에서 검토/수정
  → 5. 승인 시 published 상태 전환 → 피드 노출
```

### 3.3 뉴스 수집 (Step 1)

- 운영자가 화이트리스트 매체 목록(RSS URL 또는 사이트맵 URL)을 DB에 등록
- Cron 실행 시 각 매체에서 당일 신규 기사 목록을 수집
- 수집 대상: 포털 금융 뉴스, 주요 경제지, 경제 전문 매체, 증권사 공개 리포트
- 중복 기사 판별: URL 기준 deduplication

### 3.4 Claude API 카드 생성 (Step 2)

**사용 모델:** Claude API (Anthropic)

**호출 방식:** tool_use (structured output) — 스키마를 tool 정의로 강제하여 형식 오류 방지

**프롬프트 구성:**
```
[시스템 프롬프트]
- 사전 정의된 cards[] 스키마 (카드 타입 목록, 각 타입의 필드 구조)
- 콘텐츠 규칙 (투자 유도 금지, 출처 필수, hex 색상값만 허용)
- 카드 수 제약 (3~7장, 마지막은 source 타입)

[유저 프롬프트]
- 수집된 기사 본문 (당일 이슈 관련)
- 대상 엔티티 정보 (종목명, 지수, 환율)
```

Claude는 스키마 내에서 이슈에 맞는 카드 타입을 선택하고, 각 필드에 데이터를 채운다. 스키마 구조 자체는 변경하지 않는다.

**출력:** `cards[]` JSON — `issues.cards_data`에 저장

**처리 단위:**
- 종목/테마 이슈: 기사 묶음 → 이슈 1개 → cards[] 1세트
- 지수/환율 맥락 카드 (코스피, 나스닥, USD/KRW): 별도 호출로 생성

**tool_use 스키마 이점:**
- cards[] 배열 형식 강제 — JSON 파싱 오류 없음
- `visual.bg_*` hex 값 형식 검증
- sources 필드 누락 감지

### 3.5 Admin 검토 및 발행 (Step 4~5)

- 생성된 이슈 카드 초안을 Admin UI에서 열람
- 운영자가 텍스트 수정, 카드 순서 조정, 출처 보완 가능
- 승인 액션 시 상태를 `published`로 전환, 즉시 피드에 노출
- 반려 시 `rejected` 상태로 전환, 재생성 또는 삭제 가능

### 3.6 실행 환경

- 기본: Vercel Cron Jobs
- 폴백: 개인 PC 서버 (Vercel Cron 비용 이슈 발생 시 전환)

### 3.7 예외 처리

| 상황           | 처리                                        |
| -------------- | ------------------------------------------- |
| 매체 수집 실패 | 해당 매체 스킵, 운영 로그 기록              |
| AI 구조화 실패 | draft 저장 생략, 운영 알림                  |
| 출처 누락      | draft 상태로 저장, Admin에서 보완 필요 표시 |
| Cron 실행 누락 | 수동 재실행 API 제공                        |

상태/예외 노출 기준:
- loading: 파이프라인 또는 피드 데이터 준비 중
- empty: 발행 가능한 이슈 카드가 없는 날짜
- error: 파이프라인 실행/조회 실패로 사용자 복구 경로가 필요한 상태

---

## 4. 데이터 모델

### 4.1 핵심 원칙

- **카드 스키마는 사전 정의된다.** Claude API는 이 스키마에 맞는 데이터를 생성한다. 스키마 구조를 AI가 임의로 변경하지 않는다.
- 백엔드가 생성된 카드 데이터를 저장하고, Admin 승인 후 프론트엔드에서 조회한다.
- 카드(슬라이드)는 프론트엔드에서 React 컴포넌트로 렌더링된다. 사전 생성 이미지가 아니다.
- 이미지·애니메이션 삽입 가능 — React 컴포넌트이므로 CSS 제약 없음.
- 모든 이슈는 동일한 DB 엔티티 구조를 공유한다 (entity_type 필드로 종목/지수/환율/테마 구분).

**채널 개념 (MVP 이후 확장 계획):**
카드 스키마의 단위를 "채널"이라 부른다. 채널마다 다른 스키마, 감성, 디자인, 콘텐츠 방향을 가질 수 있다. MVP는 채널 1개(현재 정의된 스키마)로 시작하며, 시스템은 채널 추가를 고려한 확장 가능한 구조로 설계한다. 다만 채널 기능 자체는 MVP 범위에 포함되지 않는다.

### 4.2 카드 스키마 (채널 1 — MVP)

MVP에서 사용하는 cards[] 스키마다. Claude API는 이 스키마의 구조에 맞게 데이터를 생성한다.
Claude는 이슈 성격에 따라 아래 카드 타입 중 적절한 것을 선택하고, 각 필드에 데이터를 채운다.

#### 카드 타입 정의 (스키마 고정)

| type        | 용도                       |
| ----------- | -------------------------- |
| `cover`     | 이슈 첫 장, 핵심 수치 강조 |
| `reason`    | 변동 이유 설명             |
| `bullish`   | 상승 논거                  |
| `bearish`   | 하락·리스크 논거           |
| `community` | 커뮤니티·시장 반응         |
| `stats`     | 수치 중심 정보             |
| `source`    | 출처 목록 + 공유           |

#### cards[] JSON 구조

```json
[
  {
    "id": 1,
    "type": "cover",
    "tag": "속보",
    "title": "삼성전자\n오늘 최고\n+6.9% 급등",
    "sub": "신고가 217,500원 돌파 · 2026.02.26",
    "visual": {
      "bg_from": "#0f172a",
      "bg_via": "#1e3a5f",
      "bg_to": "#0f172a",
      "accent": "#3B82F6"
    }
  },
  {
    "id": 2,
    "type": "reason",
    "tag": "원인 ①",
    "title": "엔비디아가\n불을 질렀다",
    "body": "전날 밤 엔비디아가 분기 매출 681억 달러를 발표하며 시장 예상을 상회했다.",
    "stat": "엔비디아 매출 +73% YoY",
    "visual": {
      "bg_from": "#0f172a",
      "bg_via": "#052e16",
      "bg_to": "#0f172a",
      "accent": "#22C55E"
    },
    "sources": [{ "title": "기사 제목", "url": "https://...", "domain": "reuters.com" }]
  },
  {
    "id": 7,
    "type": "community",
    "tag": "커뮤니티 반응",
    "title": "디씨 분위기는?",
    "quotes": [
      { "text": "삼전 시총이 애플 1/5인데 아직도 싼 거 아님?", "mood": "🔥" },
      { "text": "AI 끝물 아님? 버블 아님?", "mood": "😂" }
    ],
    "visual": {
      "bg_from": "#0f172a",
      "bg_via": "#1e293b",
      "bg_to": "#0f172a",
      "accent": "#94A3B8"
    }
  }
]
```

#### 스키마 제약 규칙

- `visual.bg_*`: 유효한 hex 색상값만 허용 (Tailwind 클래스 문자열 금지)
- `sources`: 변동 이유·수치 관련 카드에 최소 1개 필수
- 카드 수: 3~7장
- 첫 번째 카드는 반드시 `cover` 타입
- 마지막 카드는 반드시 `source` 타입
- 투자 유도 표현 금지 (프롬프트 레벨 제약)
- Claude는 스키마 필드 구조를 변경하지 않는다. 데이터만 채운다.

### 4.3 테이블 구조

```
feeds
- id: uuid
- date: date (unique)
- status: 'draft' | 'published'
- published_at: timestamptz

issues
- id: uuid
- feed_id: uuid (→ feeds)
- channel: string (카드 스키마 식별자, MVP 기본값: 'v1')
- entity_type: 'stock' | 'index' | 'fx' | 'theme'
- entity_id: string (종목코드, 지수명 등)
- entity_name: string
- title: string (Claude 생성, 피드 목록 및 OG 이미지용)
- change_value: string (OG 이미지용, 예: "+6.9%")
- status: 'draft' | 'approved' | 'rejected'
- order: int (피드 내 노출 순서)
- cards_data: jsonb (Claude 생성 cards[] 배열, channel 스키마에 맞는 구조)
- created_at: timestamptz

tags
- id: uuid
- name: string (unique)
- created_by: 'ai' | 'operator'

issue_tags
- issue_id: uuid
- tag_id: uuid

media_sources (화이트리스트 매체)
- id: uuid
- name: string
- rss_url: string
- active: boolean
```

별도 `cards` 테이블 없음. 카드 전체 데이터는 `issues.cards_data` JSONB로 관리.
`channel` 필드는 MVP 이후 채널 추가 시 스키마를 구분하기 위한 확장 포인트다. MVP에서는 `'v1'` 고정.

### 4.4 카드 렌더링 방식

**메인 피드: React 컴포넌트 (브라우저 렌더링)**

- 백엔드에서 `issues.cards_data`를 API로 조회
- 프론트엔드는 `cards_data[]`를 순회하며 `type`별 React 컴포넌트로 렌더링
- `channel` 값에 따라 렌더러를 선택 (MVP: `'v1'` 채널 렌더러 고정)
- CSS 제약 없음 — 그라디언트, 애니메이션, 이미지 삽입 모두 가능
- 사전 이미지 생성 파이프라인 없음

**OG 이미지 (SNS 공유 썸네일)**

| 상황                                  | OG 이미지                        |
| ------------------------------------- | -------------------------------- |
| 이슈 공유 (`/feed/[date]/issue/[id]`) | `/api/og/issue/[id]` — 동적 생성 |
| 일반 피드 공유                        | `/og-default.png` — 정적 파일    |

`/api/og/issue/[id]` 구현:

- Satori를 OG 전용으로 한정 사용 (메인 카드 렌더링과 무관)
- `issues.title`, `entity_name`, `change_value`, `cards_data[0].visual` 값으로 커버 스타일 OG 이미지 생성
- 해상도: 1200×630 (OG 표준)

### 4.5 카드 수 범위

- 이슈당 카드 수: 3~7장
- 일일 피드 생성 이슈 수: 최대 10개
- 운영자가 Admin에서 배포할 이슈를 선택하여 발행

---

## 5. Admin UI

### 5.1 접근 대상

운영자 1인 전용. 별도 인증 방식은 추후 결정 (MVP에서는 기본 보호 수준 적용).

### 5.2 기능 목록

| 기능                 | 설명                                                    |
| -------------------- | ------------------------------------------------------- |
| 피드 목록            | 날짜별 피드 상태 확인 (`draft` / `published`)           |
| 이슈 목록            | 당일 생성된 이슈 목록, 이미지 미리보기                  |
| 이슈 검토            | 카드 이미지 확인, 텍스트 수정, 순서 조정                |
| 이슈 승인/반려       | 개별 이슈 단위로 승인(`approved`) 또는 반려(`rejected`) |
| 피드 발행            | 승인된 이슈들을 묶어 해당 날짜 피드로 발행              |
| 화이트리스트 관리    | 매체 URL 추가 / 비활성화                                |
| 파이프라인 수동 실행 | Cron 외 수동으로 수집·생성 트리거                       |

---

## 6. 라우팅 구조

### 6.1 사용자 화면 (공개)

```
/                         → 오늘 피드 (최신 발행 날짜로 redirect)
/feed/[date]              → 날짜별 피드 (예: /feed/2026-02-26)
/feed/[date]/issue/[id]   → 특정 이슈 공유 링크 진입
```

- `[date]`: `YYYY-MM-DD` 형식
- `[id]`: issue UUID (또는 slug)
- 공유 링크 진입 시 SSR로 즉시 렌더링 (비로그인 열람 지원)
- 존재하지 않는 날짜/이슈: 404 → 홈으로 유도 CTA

### 6.2 Admin 화면 (운영자 전용)

```
/admin                    → 피드 목록 (날짜별 상태 일람)
/admin/feed/[date]        → 당일 이슈 목록 및 검토
/admin/sources            → 화이트리스트 매체 관리
```

---

## 7. API 명세

모든 API는 Next.js Route Handlers로 구현한다. 응답 형식은 JSON.

### 7.1 공개 API (인증 불필요)

| 메서드 | 경로                | 설명                                |
| ------ | ------------------- | ----------------------------------- |
| `GET`  | `/api/feeds/latest` | 최신 발행 피드 날짜 조회            |
| `GET`  | `/api/feeds/[date]` | 날짜별 피드 (이슈 목록 + 카드 목록) |
| `GET`  | `/api/issues/[id]`  | 특정 이슈 조회 (공유 링크 진입용)   |

**`GET /api/feeds/[date]` 응답 예시:**

```json
{
  "date": "2026-02-26",
  "issues": [
    {
      "id": "uuid",
      "template_type": "stock_issue",
      "entity_type": "stock",
      "entity_name": "삼성전자",
      "title": "삼성전자, 외국인 순매도로 -2.1%",
      "tags": ["반도체", "외국인"],
      "cards": [
        {
          "id": "uuid",
          "order": 1,
          "image_url": "https://blob.vercel.com/...",
          "sources": [{ "title": "기사 제목", "url": "https://...", "domain": "hankyung.com" }]
        }
      ]
    }
  ]
}
```

### 7.2 Admin API (세션 쿠키 인증 필요)

**인증**

| 메서드 | 경로                     | 설명                           |
| ------ | ------------------------ | ------------------------------ |
| `POST` | `/api/admin/auth/login`  | 비밀번호 검증 → 세션 쿠키 발급 |
| `POST` | `/api/admin/auth/logout` | 세션 쿠키 삭제                 |

**피드 / 이슈 관리**

| 메서드  | 경로                              | 설명                                     |
| ------- | --------------------------------- | ---------------------------------------- |
| `GET`   | `/api/admin/feeds`                | 피드 목록 (날짜, 상태)                   |
| `GET`   | `/api/admin/feeds/[date]`         | 날짜별 이슈 목록 (draft 포함)            |
| `POST`  | `/api/admin/feeds/[date]/publish` | 해당 날짜 피드 발행                      |
| `PATCH` | `/api/admin/issues/[id]`          | 이슈 상태 변경 (`approved` / `rejected`) |
| `PUT`   | `/api/admin/issues/[id]`          | 이슈 내용 수정 (텍스트, 순서)            |

**화이트리스트 매체**

| 메서드  | 경로                      | 설명             |
| ------- | ------------------------- | ---------------- |
| `GET`   | `/api/admin/sources`      | 매체 목록        |
| `POST`  | `/api/admin/sources`      | 매체 추가        |
| `PATCH` | `/api/admin/sources/[id]` | 매체 활성/비활성 |

**파이프라인**

| 메서드 | 경로                       | 설명                      |
| ------ | -------------------------- | ------------------------- |
| `POST` | `/api/admin/pipeline/run`  | 수집·생성 수동 트리거     |
| `GET`  | `/api/admin/pipeline/logs` | 파이프라인 실행 로그 목록 |

### 7.3 내부 Cron 엔드포인트

| 메서드 | 경로                 | 설명                               |
| ------ | -------------------- | ---------------------------------- |
| `GET`  | `/api/cron/pipeline` | Vercel Cron 자동 호출 (매일 22:00) |

- Vercel Cron 요청 검증: `CRON_SECRET` 헤더 인증, 환경변수로 관리

---

## 8. 비기능 요구사항 (기술 기준)

### 7.1 성능 목표

| 항목                | 기준           | 비고                          |
| ------------------- | -------------- | ----------------------------- |
| 피드 첫 화면 LCP    | 2.5초 이하     | Lighthouse / Vercel Analytics |
| 공유 링크 진입 TTFB | 1초 이하       | SSR 응답 시간                 |
| 카드 이미지 로드    | 체감 지연 없음 | Vercel CDN 캐시               |
| 카드 스와이프 응답  | 즉각           | 클라이언트 사이드 처리        |

초기 사용자 수십 명 규모에서는 기본 Vercel 인프라로 달성 가능한 수치다.

### 8.2 반응형 지원

- 모바일 기준폭: 360~430px
- 데스크톱 콘텐츠 최대폭: 960px
- 동일 데이터, 동일 이슈 순서, 동일 정보 구조를 양쪽 환경에서 보장

### 8.3 접근성 최소 기준

- 텍스트 대비 4.5:1 이상
- 인터랙티브 요소 최소 44×44px
- 이미지 요소 대체 텍스트 제공
- 키보드 탐색 시 포커스 링 표시

---

## 9. 보안 및 컴플라이언스

### 9.1 Admin 인증

방식: 환경변수 기반 단순 비밀번호 + Next.js Middleware 세션 쿠키

동작 흐름:

```
/admin/* 접근
  → Middleware: 세션 쿠키 유효성 확인
  → 쿠키 없음 / 만료 → /admin/login 리다이렉트
  → 로그인 화면: 알럿 스타일 미니멀 UI, 비밀번호 입력
  → 비밀번호 일치(환경변수 비교) → httpOnly 세션 쿠키 발급
  → /admin 진입
```

구현 규칙:

- 비밀번호는 환경변수(`ADMIN_PASSWORD`)로 관리, 코드에 하드코딩 금지
- 세션 쿠키: `httpOnly`, `Secure`, `SameSite=Strict`
- 쿠키 만료: 7일 (운영자 재로그인 주기)
- 로그인 실패 횟수 제한은 MVP 제외 (운영자 1인, 공개 어택 면이 낮음)

### 9.2 사용자 화면 보안

- 로그인 없음, 인증 불필요
- 공유 링크는 이슈 ID 기반 — 순차 탐색을 막기 위해 UUID 사용
- 출처 링크는 새 탭으로 열기 (`rel="noopener noreferrer"`)

### 9.3 콘텐츠 컴플라이언스

- 투자 자문 아님 고지: 피드 상단, 공유 랜딩 상단 노출 필수
- 매수/매도/목표가 유도 표현: AI 프롬프트 수준에서 생성 금지, Admin 검토에서 2차 확인
- 출처 링크: 카드당 최소 1개 필수, 누락 시 발행 불가

---

## 10. 배포 및 운영

### 10.1 환경 구성

- 환경: Production 단일 운영 (MVP 기간)
- 배포 트리거: `main` 브랜치 push → Vercel 자동 배포
- Vercel Preview URL은 Vercel 기본 기능으로 제공되나 별도 관리 환경으로 취급하지 않음

### 10.2 환경변수 관리

| 변수명                          | 용도                                   |
| ------------------------------- | -------------------------------------- |
| `ADMIN_PASSWORD`                | Admin 로그인 비밀번호                  |
| `ADMIN_SESSION_SECRET`          | 세션 쿠키 서명 키                      |
| `SUPABASE_URL`                  | Supabase 프로젝트 URL                  |
| `SUPABASE_SERVICE_ROLE_KEY`     | 서버 사이드 DB 접근 키                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 클라이언트 사이드 DB 접근 키           |
| `ANTHROPIC_API_KEY`             | Claude API 인증 키                     |

모든 환경변수는 Vercel 대시보드에서 관리하며 코드에 하드코딩 금지.

### 10.3 로그 및 모니터링

- 에러 로그: Vercel 기본 로그 (별도 에러 트래킹 도구 없음)
- 파이프라인 실행 결과: DB 운영 로그 테이블에 기록 (성공/실패/스킵 매체)
- 알림: MVP 기간 없음 (로그 직접 확인)

### 10.4 Analytics

- Vercel Analytics: 기본 활성화 (페이지뷰, 방문자)
- 커스텀 이벤트(`feed_opened`, `card_swiped` 등): 추후 Google Analytics / Mixpanel 연동 시 추가
- MVP 기간: Vercel Analytics 수준으로 운영
