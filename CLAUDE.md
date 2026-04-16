@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

---

## 프로젝트 개요

**CMP (Care Management Platform)** — 환자 회송 관리 플랫폼 MVP

- **목적:** 상급종합병원 → 협력병원 환자 회송 프로세스를 전화·팩스에서 웹 클릭으로 전환하는 최소 검증 버전
- **용도:** 고객(병원 담당자) 시연 및 피드백 수집용 프로토타입
- **시연 방식:** 배포 URL 1개 + 같은 브라우저 탭 2개로 양측 플로우 동시 시연
- **PRD:** `docs/PRD.md` 참고

### 비목표 (건드리지 말 것)

- 실제 인증/로그인 — sessionStorage 기반 병원 선택으로 대체
- EMR 연동, 의료기록 저장
- 결제, 정산, 통계 대시보드
- 복잡한 RBAC / RLS 정책

---

## 테스트 규칙 (필수)

- **각 Phase 완료 시 반드시 Playwright MCP로 테스트**를 실행한다. 예외 없음.
- 테스트 대상은 해당 Phase의 `docs/ROADMAP.md` 체크리스트에 명시된 테스트 케이스 전체.
- 에러 발생 시 수정 → 재테스트를 **통과할 때까지 반복**한다.
- 테스트가 즉시 가능한 상황이라면 Playwright MCP를 항상 사용한다.

### 테스트 순서

1. Phase 기능 구현 완료
2. `npx tsc --noEmit` + `pnpm lint` 통과 확인
3. Playwright MCP로 해당 Phase 테스트 케이스 실행
4. 실패 시 → 수정 → 2번부터 반복
5. 전체 통과 시 → `docs/ROADMAP.md` 체크리스트 업데이트 → 다음 Phase 진행

---

## Commands

```bash
pnpm dev          # 개발 서버 시작
pnpm build        # 프로덕션 빌드
pnpm start        # 프로덕션 서버 시작
pnpm lint         # ESLint 실행
npx tsc --noEmit  # TypeScript 타입 검사
```

---

## Tech Stack

| 레이어 | 기술 | 버전 |
|---|---|---|
| Framework | Next.js (App Router) | 16.x |
| UI | React | 19.x |
| Language | TypeScript strict | 5.x |
| Styling | Tailwind CSS | 4.x |
| UI Kit | shadcn/ui | latest |
| Server State | TanStack React Query | 5.x |
| DB / Realtime | Supabase (Auth 미사용) | JS SDK v2 |
| Form | react-hook-form + zod | latest |
| 배포 | Vercel | — |

---

## Architecture

Next.js 16 App Router 기반. `src/app/` 디렉터리가 라우팅 기준이며, 모든 컴포넌트는 기본적으로 Server Component다.

경로 별칭: `@/*` → `./src/*`

### 폴더 구조

```
src/
  app/
    layout.tsx                  # QueryClientProvider + 네비 (HospitalSwitcher, NotificationBell)
    page.tsx                    # 병원 선택 화면 (/)
    sender/
      page.tsx                  # 보낸 요청 리스트
      new/page.tsx              # 요청 등록 폼
      hospitals/page.tsx        # 협력병원 선택
    receiver/
      page.tsx                  # 받은 요청함
      [id]/page.tsx             # 상세 + 수용/불가
  components/
    ui/                         # shadcn/ui 기본 컴포넌트
    hospital-switcher.tsx       # 현재 병원 표시 + 전환 버튼
    status-timeline.tsx         # 가로 스텝바 (REQUESTED→COMPLETED)
    notification-bell.tsx       # 🔔 배지 + 드롭다운
    providers.tsx               # React Query Provider
  lib/
    supabase/
      client.ts                 # 브라우저 클라이언트 (createBrowserClient)
      server.ts                 # 서버 클라이언트 (createServerClient)
    queries/
      referrals.ts              # useQuery / useMutation 훅
      hospitals.ts              # 병원 목록 훅
    hooks/
      use-current-hospital.ts   # sessionStorage 래퍼
  types/
    index.ts                    # DB 타입 정의
```

---

## 핵심 도메인 개념

### 역할

| 역할 | 소속 | 진입 경로 | 주 행동 |
|---|---|---|---|
| 회송 코디네이터 | 상급종합병원 (TERTIARY) | `/sender` | 회송 요청 등록, 수용 여부 확인 |
| 병상 관리자 | 협력병원 (PARTNER) | `/receiver` | 요청 수신, 수용/불가 클릭 |

### 로그인 없는 역할 전환

- `/` 진입 → 병원 선택 카드 (상급 1개 + 협력 3개)
- 선택 시 `sessionStorage`의 `cmp_current_hospital` 키에 저장 후 라우팅
- 상단바 `[병원 전환]` → sessionStorage clear → `/` 이동
- **탭별 sessionStorage 독립** → 탭 A / 탭 B 에서 다른 병원 선택 가능

### 회송 요청 상태 흐름

```
REQUESTED → CONFIRMED → ACCEPTED → COMPLETED
                    ↘ REJECTED (종결)
```

### 알림 구현 방식

- **1차 (필수):** React Query `refetchInterval: 5000` 폴링
- **2차 (여유 시):** Supabase Realtime `postgres_changes` on `referrals`

---

## 데이터 모델

### hospitals

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid | PK |
| name | text | 병원명 |
| type | text | `TERTIARY` / `PARTNER` |
| total_beds | int | 전체 병상 |
| available_beds | int | 가용 병상 (seed 고정값) |
| tags | text[] | `['재활','산소','격리']` |

### referrals

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid | PK |
| from_hospital_id | uuid | 상급병원 FK |
| to_hospital_id | uuid | 협력병원 FK (nullable) |
| patient_initial | text | 예: "K.M.H" |
| age | int | |
| gender | text | `M` / `F` |
| diagnosis | text | 주상병 |
| adl | text | `INDEPENDENT` / `PARTIAL` / `DEPENDENT` |
| needs_oxygen | boolean | |
| needs_isolation | boolean | |
| note | text | 특이사항 |
| preferred_date | date | 희망 회송일 |
| status | text | 5단계 상태 |
| reject_reason | text | 불가 사유 |

> **RLS 비활성** (데모용). 프로덕션 전환 시 hospital_id 기반 정책 필수.

---

## Supabase 설정

- Auth **미사용** — DB와 Realtime만 사용
- 환경변수 (`.env.local`):
  ```
  NEXT_PUBLIC_SUPABASE_URL=...
  NEXT_PUBLIC_SUPABASE_ANON_KEY=...
  ```
- 클라이언트 컴포넌트: `@/lib/supabase/client.ts` (`createBrowserClient`)
- 서버 컴포넌트 / Server Action: `@/lib/supabase/server.ts` (`createServerClient`)

---

## Next.js 16 Breaking Changes (필수 숙지)

### Middleware → Proxy 파일 컨벤션 변경

Next.js 16부터 `middleware.ts` 파일 컨벤션은 **deprecated**. 반드시 `proxy.ts`를 사용한다.

```
❌ src/middleware.ts  +  export function middleware(request) { ... }
✅ src/proxy.ts      +  export function proxy(request) { ... }
```

- `config.matcher` 등 나머지 API는 동일
- 헬퍼 파일(예: `src/lib/supabase/middleware.ts`)은 Next.js 파일 컨벤션과 무관하므로 그대로 사용 가능

### 기타

- `params` / `searchParams` 는 **Promise 형태** — `await params` 필수
- Tailwind v4: `@import "tailwindcss"` 방식, `tailwind.config.js` 없음
- ESLint 9: flat config (`eslint.config.mjs`)
