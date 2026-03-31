# findori Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-31

## Active Technologies
- TypeScript 5 (strict mode) + Next.js 15 App Router, Anthropic SDK (`@anthropic-ai/sdk`), Zod, Supabase JS (092-card-type-redesign)
- Supabase PostgreSQL — `cards_data` 컬럼은 `jsonb` 타입이므로 DB 마이그레이션 불필요 (092-card-type-redesign)
- TypeScript 5 (strict mode), Next.js 15 App Router + Anthropic SDK (`@anthropic-ai/sdk`), Zod, Tailwind CSS v4 (093-image-category-system)
- `/public/images/cards/` (WebP 정적 파일), DB는 `cards_data` jsonb 컬럼 그대로 사용 (마이그레이션 불필요) (093-image-category-system)

- TypeScript 5 / Next.js 15 (App Router) + Anthropic SDK (`@anthropic-ai/sdk`), Supabase JS, Zod (054-pipeline-cost-opt)

## Project Structure

```text
src/
├── app/
│   ├── (admin)/admin/          # Admin UI (피드·매체·파이프라인 관리)
│   ├── api/admin/              # Admin API (pipeline/run, logs, feeds, issues, sources)
│   ├── api/cron/pipeline/      # Vercel cron 엔드포인트 (매일 22:00 KST)
│   └── api/feeds|issues|og/    # 공개 피드 API
├── lib/
│   ├── pipeline/               # 파이프라인 핵심 로직
│   │   ├── collect.ts          # RSS 수집 (소스당 최대 30건, content 500자)
│   │   ├── filter.ts           # Haiku 1차 필터 (투자 관련 상위 10건)
│   │   ├── generate.ts         # Sonnet 카드 생성 (최대 3개 이슈, max_tokens 8192)
│   │   ├── log.ts              # 실행 로그 (토큰/비용 포함)
│   │   ├── store.ts            # draft feed/issue DB 저장
│   │   └── index.ts            # 파이프라인 오케스트레이터
│   ├── cards/                  # 카드 타입 파서/검증
│   └── supabase/               # Supabase 클라이언트 (admin/server/client)
├── components/features/admin/  # Admin UI 컴포넌트
└── types/                      # TypeScript 타입 (pipeline, cards, database.types)

supabase/migrations/            # DB 마이그레이션 (배포 전 적용 필요)
specs/                          # 기능별 설계 문서 (히스토리)
```

## Commands

```bash
npm run dev      # 로컬 개발 서버
npm run build    # 프로덕션 빌드 (품질 게이트)
npx tsc --noEmit # 타입 검사
npm run lint     # 린트
```

## Code Style

TypeScript 5 / Next.js 15 (App Router): Follow standard conventions

## Recent Changes
- 093-image-category-system: Added TypeScript 5 (strict mode), Next.js 15 App Router + Anthropic SDK (`@anthropic-ai/sdk`), Zod, Tailwind CSS v4
- 092-card-type-redesign: Added TypeScript 5 (strict mode) + Next.js 15 App Router, Anthropic SDK (`@anthropic-ai/sdk`), Zod, Supabase JS

- 054-pipeline-cost-opt: Added TypeScript 5 / Next.js 15 (App Router) + Anthropic SDK (`@anthropic-ai/sdk`), Supabase JS, Zod

<!-- MANUAL ADDITIONS START -->
## 운영 규칙

- **브랜치 보호**: main 직접 push 불가. PR 필수.
- **DB 마이그레이션**: `supabase/migrations/`에 파일 추가 시 배포 전 Supabase Dashboard SQL Editor에서 직접 실행 필요.
- **파이프라인 구조**: collect → filter(Haiku) → generate(Sonnet) → store. 이슈 최대 3개, 비용 로깅 포함.
- **Vercel cron**: `vercel.json` — 매일 UTC 13:00 (KST 22:00) 자동 실행.
<!-- MANUAL ADDITIONS END -->
