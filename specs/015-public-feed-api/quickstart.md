# Quickstart: 공개 피드 API 구현

## 전제 조건

- 기존 Admin 파이프라인이 동작하여 `feeds` + `issues` 테이블에 `published`/`approved` 데이터 존재
- 또는 Supabase 대시보드에서 테스트 데이터 직접 삽입

## 새로 생성하는 파일

```
src/lib/public/feeds.ts                          # 공개 피드 데이터 접근 함수
tests/unit/lib/public-feeds.test.ts              # lib 함수 단위 테스트
tests/unit/api/public-feeds-latest-route.test.ts  # /api/feeds/latest 라우트 테스트
tests/unit/api/public-feeds-date-route.test.ts    # /api/feeds/[date] 라우트 테스트
tests/unit/api/public-issues-id-route.test.ts     # /api/issues/[id] 라우트 테스트
```

## 수정하는 파일 (스텁 교체)

```
src/app/api/feeds/latest/route.ts     # TODO(#15) 스텁 → 실제 구현
src/app/api/feeds/[date]/route.ts     # TODO(#15) 스텁 → 실제 구현
src/app/api/issues/[id]/route.ts      # TODO(#15) 스텁 → 실제 구현
```

## 구현 순서

1. `src/lib/public/feeds.ts` 작성 (데이터 접근 함수 3개)
2. Route Handler 3개 스텁 교체
3. 단위 테스트 작성 + `npm run test` 통과
4. `npm run validate` 통과

## 수동 테스트

```bash
# 개발 서버 실행
npm run dev

# 최신 발행 날짜 조회
curl http://localhost:3000/api/feeds/latest

# 특정 날짜 피드 조회 (발행된 날짜로 교체)
curl http://localhost:3000/api/feeds/2026-03-12

# 잘못된 날짜 형식
curl http://localhost:3000/api/feeds/20260312
# → 400

# 없는 날짜
curl http://localhost:3000/api/feeds/2000-01-01
# → 404

# 이슈 직접 조회 (실제 approved 이슈 ID로 교체)
curl http://localhost:3000/api/issues/<uuid>
```
