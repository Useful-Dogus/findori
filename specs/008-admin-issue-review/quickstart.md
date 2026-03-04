# Quickstart: Admin 이슈 편집/순서조정/승인·반려 (Feature 008)

**Generated**: 2026-03-04
**Branch**: `008-admin-issue-review`

---

## 구현 개요

이 기능은 3개 우선순위로 순차 구현한다:

| 우선순위 | 스토리 | 핵심 작업 |
|---------|--------|----------|
| P1 | 이슈 승인·반려 | PATCH 핸들러 + 승인/반려 버튼 UI |
| P2 | 카드 텍스트 수정 | PUT 핸들러 + 카드 인라인 편집 UI |
| P3 | 카드 순서 조정 | 위/아래 이동 버튼 + 저장 (PUT 재사용) |

---

## 파일 변경 목록

### 신규 생성

```
src/lib/admin/issues.ts            # updateIssueStatus, updateIssueCards
src/components/features/admin/IssueStatusActions.tsx  # 승인/반려 버튼
src/components/features/admin/CardEditForm.tsx        # 카드 인라인 편집 폼
tests/unit/lib/admin/issues.test.ts
tests/unit/api/admin/issues-patch.test.ts
tests/unit/api/admin/issues-put.test.ts
```

### 수정

```
src/app/api/admin/issues/[id]/route.ts  # PATCH + PUT 구현 (스텁 교체)
src/components/features/admin/IssueListItem.tsx  # 상태 버튼 + 카드 편집 통합
```

---

## 구현 순서 (P1 → P2 → P3)

### Step 1: 서버 레이어 (src/lib/admin/issues.ts)

```typescript
import { createClient } from '@/lib/supabase/server'
import type { Card } from '@/types/cards'

export async function updateIssueStatus(
  id: string,
  status: 'draft' | 'approved' | 'rejected',
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('issues')
    .update({ status })
    .eq('id', id)
  if (error) throw new Error(`status 업데이트 실패: ${error.message}`)
}

export async function updateIssueCards(
  id: string,
  cards: Card[],
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('issues')
    .update({ cards_data: cards })
    .eq('id', id)
  if (error) throw new Error(`cards 업데이트 실패: ${error.message}`)
}
```

### Step 2: API Route Handlers (route.ts 구현)

**PATCH 핸들러 패턴**:
1. `requireAdminSession` 인증 확인
2. Zod로 body 파싱 (`{ status: z.enum(['draft', 'approved', 'rejected']) }`)
3. `updateIssueStatus(id, status)` 호출
4. 200 `{ id, status }` 반환

**PUT 핸들러 패턴**:
1. `requireAdminSession` 인증 확인
2. body에서 `cards` 필드 추출
3. `parseCards(cards)` 검증 (기존 함수 재사용)
4. 실패 시 400, 성공 시 `updateIssueCards(id, cards)` 호출
5. 200 `{ id, cards }` 반환

### Step 3: 상태 변경 UI (P1)

`IssueListItem.tsx` 수정:
- `localStatus` state 추가 (초기값: `issue.status`)
- `isStatusChanging` state 추가
- 헤더에 `IssueStatusActions` 컴포넌트 삽입

`IssueStatusActions.tsx` 신규:
- 승인 버튼 (currentStatus !== 'approved' 시 활성)
- 반려 버튼 (currentStatus !== 'rejected' 시 활성)
- `isChanging` 시 양쪽 버튼 비활성 + 로딩 표시

### Step 4: 카드 편집 UI (P2)

`IssueListItem.tsx` 수정:
- `cardsState` state 추가 (초기값: `issue.cardsData`)
- `editingCardId` state 추가
- 카드 행에 편집 버튼 추가
- `CardEditForm` 컴포넌트로 편집 모드 전환

`CardEditForm.tsx` 신규:
- 카드 타입별 텍스트 필드 렌더링
- 저장/취소 버튼
- 필수 필드 빈값 방지 클라이언트 검증

### Step 5: 카드 순서 변경 (P3)

`IssueListItem.tsx` 수정:
- 카드 행에 위/아래 버튼 추가
- 첫번째 카드: 위 버튼 비활성, 마지막 카드: 아래 버튼 비활성
- 이동 후 "저장" 버튼으로 확정 (`PUT` 호출)

---

## 디자인 컨벤션

프로젝트 Tailwind 다크테마 기준:
- 배경: `bg-slate-900/60`, `bg-surface-raised`
- 텍스트: `text-slate-50` (제목), `text-slate-300` (본문), `text-slate-400` (부제)
- 버튼 승인: `bg-emerald-600 hover:bg-emerald-500`
- 버튼 반려: `bg-rose-700 hover:bg-rose-600`
- 버튼 비활성: `opacity-50 cursor-not-allowed`
- 오류 박스: `bg-rose-950/40 text-rose-100`
- 성공 알림: `bg-emerald-950/40 text-emerald-100`

---

## 로컬 개발 실행

```bash
npm run dev          # 개발 서버
npm run validate     # type-check + lint + format
npm run test         # Vitest 단위 테스트
```

---

## 테스트 체크리스트

| 케이스 | 방법 |
|--------|------|
| 미인증 접근 401 | `requireAdminSession` 없이 요청 |
| 잘못된 status → 400 | body `{ status: 'invalid' }` |
| 정상 status 변경 → 200 | draft → approved |
| 잘못된 cards → 400 | `parseCards` 실패 케이스 |
| 정상 cards 저장 → 200 | 유효한 Card[] |
| UI 낙관적 업데이트 | 버튼 클릭 즉시 badge 변경 확인 |
| 중복 클릭 방지 | 처리 중 버튼 비활성 확인 |
| 취소 시 상태 복원 | 편집 중 취소 → 이전 값 표시 |
