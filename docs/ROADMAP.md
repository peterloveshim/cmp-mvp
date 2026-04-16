# ROADMAP.md

> 마지막 업데이트: 2026-04-16  
> 기반 문서: `docs/PRD.md` v3.1 (Final)

## 프로젝트 개요

환자 회송 관리 플랫폼(CMP) MVP. 상급종합병원 → 협력병원 환자 회송 프로세스를 전화/팩스에서 웹 클릭으로 전환하는 최소 검증 버전이다. 배포 URL 1개 + 브라우저 탭 2개로 양측(상급병원/협력병원) 플로우를 동시 시연할 수 있는 것이 핵심이다.

**목표**: 요청 → 수용 → 완료까지 3클릭 이내, 상태 변경 5초 이내 반영, PRD 없이 화면만으로 플로우 이해 가능

---

## 전체 로드맵 요약

| Phase | 목표 | 예상 기간 | 상태 |
|-------|------|----------|------|
| Phase 0 | 프로젝트 환경설정 및 초기 세팅 | 1일 | ✅ 완료 |
| Phase 1 | 기반 구조 (타입, DB, Supabase, 공통 컴포넌트) | 2-3일 | ✅ 완료 |
| Phase 2 | 핵심 기능 (송신, 수신, 상태 변경) | 3-4일 | ✅ 완료 |
| Phase 3 | 실시간 알림 및 폴리싱 | 2-3일 | ⬜ 예정 |
| Phase 4 | 배포 및 시연 마무리 | 1-2일 | ⬜ 예정 |

---

## Phase 0: 프로젝트 환경설정

**목표**: Next.js 16 + 기술 스택 초기 세팅 완료  
**기간**: 1일  
**완료 기준**: `pnpm dev`로 로컬 실행 가능, shadcn/ui 컴포넌트 렌더링 확인

### 0.1 프로젝트 초기화

#### 환경 구성
- [x] Next.js 16 + TypeScript strict 프로젝트 생성 `(S)`
- [x] Tailwind CSS v4 설정 (`globals.css`에 `@import "tailwindcss"`) `(S)`
- [x] shadcn/ui 설치 및 기본 컴포넌트 추가 (button, card, badge, dialog, input, label, select, separator, switch, textarea) `(M)`
- [x] TanStack React Query v5 설치 및 `Providers` 래퍼 생성 (`src/components/providers.tsx`) `(S)`
- [x] react-hook-form + zod 설치 `(S)`
- [x] 경로 별칭 `@/*` → `./src/*` 설정 `(S)`

#### 폴더 구조
- [x] `src/app/sender/`, `src/app/receiver/` 라우트 디렉터리 생성 `(S)`
- [x] `src/lib/supabase/`, `src/lib/queries/`, `src/lib/hooks/` 디렉터리 구성 `(S)`
- [x] `src/types/index.ts` 타입 정의 파일 생성 `(S)`

### Phase 0 마일스톤
- [x] 마일스톤: `pnpm dev` 실행 시 기본 페이지 렌더링 정상 동작

---

## Phase 1: 기반 구조

**목표**: Supabase DB 연동, 타입 정의, 공통 훅/컴포넌트 완성  
**기간**: 2-3일  
**완료 기준**: Supabase에 테이블/시드 데이터 존재, `useCurrentHospital` 훅으로 병원 선택/전환 동작, 병원 선택 화면(`/`) 정상 작동

### 1.1 타입 & 스키마

#### 타입 정의
- [x] `src/types/index.ts`에 `Hospital`, `Referral`, `ReferralInsert`, `CurrentHospital` 등 DB 타입 정의 `(S)`
- [x] `HospitalType`, `AdlType`, `ReferralStatus`, `RejectReason` 유니온 타입 정의 `(S)`

### 1.2 Supabase 설정 & DB

#### Supabase 클라이언트
- [x] `src/lib/supabase/client.ts` — 브라우저용 Supabase 클라이언트 생성 `(S)`
- [x] `src/lib/supabase/server.ts` — 서버용 Supabase 클라이언트 생성 (cookies 기반) `(S)`

#### DB 마이그레이션 & 시드
- [x] Supabase 프로젝트 생성 및 URL/anon key 확보 `(S)`
- [x] `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정 `(S)`
- [x] `hospitals` 테이블 생성 (SQL 마이그레이션) `(S)`
- [x] `referrals` 테이블 생성 (FK, check constraint, status 기본값) `(M)`
- [x] `updated_at` 자동갱신 트리거 생성 (`set_updated_at` 함수) `(S)`
- [x] Realtime 활성화: `alter publication supabase_realtime add table referrals` `(S)`
- [x] RLS 비활성화 (MVP 데모용 — 프로덕션 전환 시 필수 활성화) `(S)`
- [x] 시드 데이터 삽입: 병원 4개 (상급 1 + 협력 3) `(S)`

#### DB 테스트 (Playwright MCP)
- [x] 정상 케이스: 병원 선택 화면에서 시드 데이터 4개 카드가 정상 렌더링되는지 확인 `(S)`
- [ ] 에러 케이스: Supabase 연결 실패 시 로딩 상태가 유지되거나 에러 메시지 표시 확인 `(S)`
- [ ] 엣지 케이스: 빈 hospitals 테이블일 때 빈 목록 UI 정상 표시 확인 `(S)`

### 1.3 공통 훅 & 컴포넌트

#### 세션 관리 훅
- [x] `src/lib/hooks/use-current-hospital.ts` — `sessionStorage` 기반 병원 선택/전환/초기화 훅 `(M)`

#### React Query 훅
- [x] `src/lib/queries/hospitals.ts` — `useHospitals()`, `usePartnerHospitals()` `(S)`
- [x] `src/lib/queries/referrals.ts` — `useReceivedReferrals()`, `useSentReferrals()`, `useReferral()`, `useCreateReferral()`, `useAssignHospital()`, `useUpdateReferralStatus()`, `useUnreadCount()` `(M)`

#### 공통 UI 컴포넌트
- [x] `src/components/providers.tsx` — QueryClientProvider 래퍼 `(S)`
- [x] `src/components/hospital-switcher.tsx` — 상단바 병원 전환 버튼 `(S)`
- [x] `src/components/notification-bell.tsx` — 알림 벨 아이콘 + 드롭다운 (협력병원 전용) `(M)`
- [x] `src/components/status-timeline.tsx` — 5단계 상태 가로 스텝바 `(M)`

#### 레이아웃
- [x] `src/app/layout.tsx` — 루트 레이아웃 (Providers, 상단 네비, HospitalSwitcher, NotificationBell) `(M)`

### 1.4 병원 선택 화면

#### UI 구현
- [x] `src/app/page.tsx` — 병원 선택 카드 4개 (상급/협력 분류), 선택 시 sessionStorage 저장 후 역할별 라우팅 `(M)`

#### UI 테스트 (Playwright MCP)
- [x] 정상 케이스: 병원 카드 클릭 → sessionStorage 저장 → 올바른 경로로 이동 (상급→`/sender`, 협력→`/receiver`) `(S)`
- [ ] 에러 케이스: sessionStorage 접근 불가 상황에서의 fallback 동작 `(S)`
- [x] 엣지 케이스: 이미 병원 선택된 상태에서 `/` 재접속 시 자동 리다이렉트 `(S)`

### Phase 1 마일스톤
- [x] 마일스톤 1: Supabase에 `hospitals`, `referrals` 테이블 존재, 시드 데이터 4개 병원 확인
- [x] 마일스톤 2: 병원 선택(`/`) → 역할별 대시보드 이동 → 병원 전환 버튼 정상 동작

---

## Phase 2: 핵심 기능 (송신/수신/상태 변경)

**목표**: 상급병원 회송 요청 등록 → 협력병원 수용/불가 → 완료까지 전체 플로우 구현  
**기간**: 3-4일  
**완료 기준**: 탭 2개로 요청→수용→완료 3클릭 이내 완수, 5초 이내 상태 반영

### 2.1 상급병원: 회송 요청 등록 (`/sender/new`)

#### UI 구현
- [x] `src/app/sender/new/page.tsx` — 9개 필드 폼 (react-hook-form + zod 검증), 제출 시 `referrals` insert → 협력병원 선택 화면 이동 `(L)`

#### 폼 테스트 (Playwright MCP)
- [ ] 정상 케이스: 모든 필드 입력 → 제출 → Supabase에 `status=REQUESTED` 레코드 생성 확인 `(S)`
- [ ] 에러 케이스: 필수 필드 누락 시 Zod 검증 에러 메시지 표시 확인 `(S)`
- [ ] 엣지 케이스: 나이 필드에 0 또는 150 입력, 특이사항 빈 값 제출 `(S)`

### 2.2 상급병원: 협력병원 선택 (`/sender/hospitals`)

#### UI 구현
- [x] `src/app/sender/hospitals/page.tsx` — 카드형 협력병원 리스트 (병원명, 가용병상, 태그), 가용병상 내림차순 정렬 `(M)`
- [x] URL 쿼리 파라미터 `referralId`로 직전 요청 식별, 카드 선택 시 `to_hospital_id` 업데이트 후 `/sender`로 이동 `(M)`

#### UI 테스트 (Playwright MCP)
- [x] 정상 케이스: 협력병원 3개 카드 렌더링 + 가용병상 내림차순 정렬 확인 `(S)`
- [x] 정상 케이스: 병원 카드 클릭 → `referrals.to_hospital_id` 업데이트 → `/sender` 리다이렉트 확인 `(S)`
- [x] 에러 케이스: `referralId` 쿼리 파라미터 없이 접근 시 `/sender`로 리다이렉트 `(S)`
- [ ] 엣지 케이스: 가용병상 0인 병원도 목록에 표시되는지 확인 `(S)`

### 2.3 상급병원: 보낸 요청 대시보드 (`/sender`)

#### UI 구현
- [x] `src/app/sender/page.tsx` — 보낸 요청 리스트 (상태 뱃지, 타임라인, 완료 버튼, 협력병원 선택 링크) `(L)`

#### UI 테스트 (Playwright MCP)
- [ ] 정상 케이스: 요청 목록이 최신순 정렬로 표시, 각 카드에 상태 뱃지 + 타임라인 렌더링 `(S)`
- [ ] 정상 케이스: `ACCEPTED` 상태에서 `[완료]` 버튼 클릭 → `COMPLETED` 전환 확인 `(S)`
- [ ] 엣지 케이스: 요청 0건일 때 빈 상태 UI + "첫 요청 등록" 버튼 표시 확인 `(S)`

### 2.4 협력병원: 받은 요청함 (`/receiver`)

#### UI 구현
- [x] `src/app/receiver/page.tsx` — 수신 요청 리스트 (`status=REQUESTED` 우선 정렬), 카드 클릭 시 상세 페이지 이동 `(L)`

#### UI 테스트 (Playwright MCP)
- [x] 정상 케이스: 해당 병원 앞으로 온 요청만 필터링되어 표시 확인 `(S)`
- [x] 정상 케이스: `REQUESTED` 상태 요청이 상단에 우선 정렬 확인 `(S)`
- [x] 엣지 케이스: 수신 요청 0건일 때 빈 상태 UI 표시 `(S)`

### 2.5 협력병원: 요청 상세 및 수용/불가 (`/receiver/[id]`)

#### UI 구현
- [x] `src/app/receiver/[id]/page.tsx` — 환자 정보 상세 표시 + 타임라인 + `[수용]`/`[불가]` 버튼 `(L)`
- [x] 불가 선택 시 사유 select (병상 없음 / 중증도 부적합 / 기타) `(M)`
- [x] 수용 시 `status=ACCEPTED`, 불가 시 `status=REJECTED` + `reject_reason` 업데이트 `(M)`

#### 수용/불가 테스트 (Playwright MCP)
- [x] 정상 케이스: `[수용]` 클릭 → `status` REQUESTED→ACCEPTED 전환 확인 `(S)`
- [x] 정상 케이스: `[불가]` 클릭 → 사유 선택 → `status` REQUESTED→REJECTED + `reject_reason` 저장 확인 `(S)`
- [ ] 에러 케이스: 존재하지 않는 referral ID로 접근 시 404 또는 에러 처리 `(S)`
- [x] 엣지 케이스: 이미 ACCEPTED/REJECTED 상태인 요청의 버튼 비활성화 확인 `(S)`

### 2.6 비즈니스 로직 단위 테스트 (Vitest)

- [ ] Zod 스키마 검증 테스트: 유효/무효 입력값 검증 (나이 범위, 필수 필드, enum 값) `(S)`
- [ ] `STATUS_ORDER` 기반 타임라인 렌더링 로직 테스트 `(S)`
- [ ] 날짜 포맷, 상태 라벨 매핑 유틸 테스트 `(S)`

### Phase 2 마일스톤
- [x] 마일스톤 1: 상급병원 탭에서 회송 요청 등록 → 협력병원 선택 → 요청 전송 완료 — Playwright MCP로 검증
- [x] 마일스톤 2: 협력병원 탭에서 요청 수신 → 상세 확인 → 수용/불가 처리 완료 — Playwright MCP로 검증
- [x] 마일스톤 3: 상급병원 탭에서 상태 변경(수용/불가) 5초 이내 반영 확인 (폴링) — Playwright MCP로 검증
- [x] 마일스톤 4: ACCEPTED 상태에서 `[완료]` 처리 → COMPLETED 확인 — Playwright MCP로 검증

---

## Phase 3: 실시간 알림 및 폴리싱

**목표**: Supabase Realtime 적용, UI 완성도 향상, 시연 경험 최적화  
**기간**: 2-3일  
**완료 기준**: Realtime 구독으로 상태 변경 즉시 반영, UI 완성도 시연 수준 달성

### 3.1 Supabase Realtime 구독 (선택적 — 여유 시 구현)

#### 구현
- [ ] `src/lib/hooks/use-realtime-referrals.ts` — `postgres_changes` 구독 훅 생성 (`referrals` 테이블 INSERT/UPDATE) `(M)`
- [ ] Realtime 이벤트 수신 시 React Query 캐시 `invalidateQueries` 호출 `(S)`
- [ ] 컴포넌트 unmount 시 채널 구독 해제 (`supabase.removeChannel`) `(S)`
- [ ] `/receiver` 페이지에 Realtime 구독 적용 — 새 요청 즉시 반영 `(M)`
- [ ] `/sender` 페이지에 Realtime 구독 적용 — 상태 변경 즉시 반영 `(M)`

#### Realtime 테스트 (Playwright MCP)
- [ ] 정상 케이스: 탭 A에서 요청 전송 → 탭 B에서 실시간 목록 갱신 확인 (5초 이내) `(M)`
- [ ] 정상 케이스: 탭 B에서 수용 클릭 → 탭 A에서 상태 변경 즉시 반영 확인 `(M)`
- [ ] 에러 케이스: Realtime 연결 실패 시 폴링 폴백 동작 확인 `(S)`

### 3.2 알림 기능 강화

#### 구현
- [ ] 알림 벨 드롭다운에서 요청 클릭 시 해당 상세 페이지로 이동 `(S)`
- [ ] 새 요청 수신 시 배지 카운트 즉시 증가 (Realtime 연동) `(S)`

### 3.3 UI 폴리싱 & UX 개선

#### 구현
- [ ] 로딩 스켈레톤 UI 추가 (목록 페이지, 상세 페이지) `(M)`
- [ ] 토스트 알림: 요청 등록 성공, 수용/불가 처리 완료 시 사용자 피드백 `(M)`
- [ ] 반응형 레이아웃 검증 (데스크톱 좌우 분할 시연 기준) `(S)`
- [ ] 에러 바운더리 추가 (Supabase 쿼리 실패 시 사용자 안내) `(M)`
- [ ] `sender/page.tsx`의 `CompleteButton` 컴포넌트 require() 호출을 정적 import로 리팩터링 `(S)`

#### UI 테스트 (Playwright MCP)
- [ ] 로딩 스켈레톤 표시 후 데이터 렌더링 전환 확인 `(S)`
- [ ] 토스트 메시지 표시 및 자동 소멸 확인 `(S)`
- [ ] 브라우저 창 좌우 분할 상태에서 레이아웃 깨짐 없는지 확인 `(S)`

### Phase 3 마일스톤
- [ ] 마일스톤 1: (Realtime 적용 시) 폴링 대신 Realtime으로 상태 동기화 — 탭 2개 시연으로 확인
- [ ] 마일스톤 2: 로딩/에러/토스트 등 UX 완성도 시연 수준 달성 — Playwright MCP로 검증

---

## Phase 4: 배포 및 시연 마무리

**목표**: Vercel 배포, 시드 데이터 검증, 시연 시나리오 리허설  
**기간**: 1-2일  
**완료 기준**: 배포 URL에서 PRD 8절 데모 시나리오 전체 흐름 정상 동작

### 4.1 Vercel 배포

#### 구현
- [ ] Vercel 프로젝트 연결 (GitHub 레포 연동) `(S)`
- [ ] 환경변수 설정: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` `(S)`
- [ ] 프로덕션 빌드 검증 (`pnpm build` 성공 확인) `(S)`
- [ ] 배포 URL 접속 확인 `(S)`

### 4.2 시드 데이터 & 데이터 초기화

#### 구현
- [ ] 배포 환경 Supabase에 시드 데이터 존재 확인 (병원 4개) `(S)`
- [ ] 시연 전 `referrals` 테이블 초기화 스크립트 또는 대시보드 SQL 준비 `(S)`

### 4.3 E2E 시연 시나리오 검증

#### 전체 플로우 테스트 (Playwright MCP)
- [ ] [탭 1] `/` → "서울상급병원" 선택 → `/sender` 이동 확인 `(S)`
- [ ] [탭 2] `/` → "강남재활병원" 선택 → `/receiver` 이동 확인 `(S)`
- [ ] [탭 1] "새 요청 등록" → 9개 필드 입력 → 제출 → 협력병원 리스트 이동 `(S)`
- [ ] [탭 1] "강남재활병원" 선택 → 요청 전송 완료 → `/sender` 리다이렉트 `(S)`
- [ ] [탭 2] 알림 배지 카운트 증가 확인 → 요청 상세 확인 → `[수용]` 클릭 `(S)`
- [ ] [탭 1] 타임라인 REQUESTED → ACCEPTED 자동 반영 확인 `(S)`
- [ ] [탭 1] `[완료]` 처리 → 양쪽 상태 COMPLETED 확인 `(S)`

### 4.4 typecheck & lint 최종 확인

#### 검증
- [ ] `npx tsc --noEmit` — TypeScript 타입 에러 0건 `(S)`
- [ ] `pnpm lint` — ESLint 에러 0건 `(S)`

### Phase 4 마일스톤
- [ ] 마일스톤 1: Vercel 배포 URL에서 PRD 8절 데모 시나리오 전체 동작 확인 — Playwright MCP로 검증
- [ ] 마일스톤 2: typecheck + lint 통과

---

## 기술 부채 & 리스크

### 알려진 리스크

| 리스크 | 심각도 | 완화 전략 |
|--------|--------|----------|
| Next.js 16 / Tailwind 4 / shadcn 호환성 이슈 | Medium | 막히면 즉시 Next 15 + Tailwind 3으로 다운그레이드 |
| Supabase Realtime 세팅 지연 | Low | 1차 폴링(5초 간격)으로 대체, Realtime은 여유 시간에 적용 |
| UI 완성도 부족으로 시연 임팩트 감소 | Low | shadcn 기본 컴포넌트 그대로 사용, 커스터마이징 최소화 |
| 시드 데이터 누락으로 시연 실패 | High | 배포 직후 대시보드에서 데이터 존재 육안 확인 필수 |
| `sender/page.tsx` CompleteButton의 `require()` 동적 호출 | Low | Phase 3에서 정적 import로 리팩터링 예정 |

### 기술 부채 항목
- RLS 비활성화 상태 (MVP 데모용) — 프로덕션 전환 시 `hospital_id` 기반 RLS 정책 필수 적용
- Supabase Auth 미사용 (sessionStorage 기반 역할 전환) — 프로덕션 전환 시 이메일 매직링크 인증 도입
- 병상 현황 시드 고정값 — 협력병원 측 직접 업데이트 UI 필요
- `supabase gen types` 미적용 (수동 타입 정의 사용 중) — 프로덕션 전환 시 자동생성 타입으로 교체

---

## 의존성 & 전제조건

### 외부 의존성
- **Supabase**: 프로젝트 생성 + URL/anon key 확보 필수 (Phase 1 시작 전)
- **Vercel**: GitHub 레포 연동 + 환경변수 설정 (Phase 4)

### Phase 간 의존성
- Phase 1 (Supabase DB 셋업) → Phase 2 (모든 CRUD 기능이 DB에 의존)
- Phase 2 (핵심 플로우 완성) → Phase 3 (Realtime 구독 대상 존재)
- Phase 2 (핵심 플로우 완성) → Phase 4 (배포 및 시연 검증)
- Phase 3 (UI 폴리싱)은 Phase 4와 병렬 진행 가능

### 가정사항 (Assumptions)
- PRD에서 `CONFIRMED` 상태의 트리거 조건이 명시되지 않음 — 현재 구현에서는 `REQUESTED → ACCEPTED`로 직접 전환하며, `CONFIRMED`는 향후 확장 시 사용 예정
- 불가 사유는 3개 고정 (병상 없음 / 중증도 부적합 / 기타) — PRD 3.4절 기반
- 알림은 협력병원(PARTNER) 전용 — 상급병원 측은 폴링으로 상태 변경 감지

---

## 복잡도 기준

| 레이블 | 예상 공수 |
|--------|----------|
| S (Small) | 0.5일 이하 |
| M (Medium) | 1-2일 |
| L (Large) | 3-5일 |
| XL (Extra Large) | 1주 이상, 분할 검토 |
