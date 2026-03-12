# Research: 공개 피드 API

## 1. 기존 스텁 파일 현황

**Decision**: 세 Route Handler 파일이 스텁으로 이미 존재함. 교체 방식으로 구현.

| 파일 | 상태 |
|------|------|
| `src/app/api/feeds/latest/route.ts` | `{ date: null }` 고정 스텁 |
| `src/app/api/feeds/[date]/route.ts` | 빈 issues 배열 스텁 |
| `src/app/api/issues/[id]/route.ts` | 501 Not Implemented 스텁 |

**Rationale**: 파일 삭제 후 재생성이 아닌, 내용 교체(Edit) 방식.

---

## 2. DB 컬럼 이름 확인

**Decision**: SRS 문서의 `order` 필드는 실제 DB에서 `display_order`로 생성되어 있음.

- `database.types.ts` Row 타입 확인: `display_order: number`
- `src/lib/admin/feeds.ts`에서도 `.order('display_order', { ascending: true })` 사용 중

**Rationale**: 실제 타입 파일 기준으로 구현. SRS의 `order` 표기는 논리적 의미이며 물리 컬럼명과 다름.

---

## 3. 태그 조회 전략

**Decision**: N+1 방지를 위해 이슈 조회 후 별도 쿼리로 태그를 일괄 조회(batch fetch) 후 메모리에서 매핑.

- Supabase JS SDK는 `issue_tags(tags(name))` 형태의 중첩 join select를 지원하지만, 타입 안전성이 낮음
- Admin 코드 패턴(2-step: feed → issues)과 일관성 유지를 위해 명시적 2-step 채택
- 이슈 ID 목록으로 `issue_tags`를 한 번에 조회, `tags` 테이블과 조인

**Rationale**: 기존 Admin 패턴과의 일관성, 타입 안전성, N+1 방지를 모두 만족.

---

## 4. `isValidDate` 재사용 여부

**Decision**: `src/lib/admin/feeds.ts`의 `isValidDate`를 `src/lib/utils.ts`로 이동하지 않고, 공개 피드 lib 파일에서 직접 동일 구현을 둔다.

**Rationale**: admin/feeds.ts 변경 없이 독립적으로 구현 가능. 단순 정규식 검증이므로 중복 허용 범위 내. 향후 리팩토링 이슈에서 utils 통합 가능.

---

## 5. 공개 API의 Supabase 클라이언트

**Decision**: `src/lib/supabase/server.ts`의 `createClient()`를 그대로 사용.

- Admin API와 동일한 서버 Supabase 클라이언트 사용
- RLS 정책이 공개 읽기를 허용하거나, service role이 아닌 anon key 기반 RLS를 통해 `published`/`approved` 데이터만 노출되어야 함
- 구현 레이어에서는 명시적 `eq('status', 'published')` 필터를 코드에 포함하여 DB 레이어 의존 없이 안전성 보장

**Rationale**: 코드 레이어에서 명시적 필터 → RLS가 변경되어도 안전.

---

## 6. 응답 구조 (`/api/feeds/latest` 빈 피드)

**Decision**: `{ "date": null }` with status 200.

- spec.md Assumptions에서 명시적으로 결정됨
- 프론트엔드에서 null 체크로 빈 상태 처리 가능

**Rationale**: 404보다 프론트엔드 처리가 단순하고 명확한 의도 전달.

---

## 7. 테스트 전략

**Decision**: `tests/unit/lib/public-feeds.test.ts` (lib 함수), `tests/unit/api/public-feeds-route.test.ts` (route handler) 패턴 적용.

- Admin 테스트 패턴(`vi.mock('@/lib/supabase/server')`) 동일하게 사용
- Route handler 테스트는 lib 함수를 mock하여 HTTP 응답 코드/구조 검증에 집중
