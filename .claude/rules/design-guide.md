---
globs: ["**/*.tsx", "**/*.css"]
---

# CMP 디자인 가이드

## 선택 팔레트: Teal Dusk (B안)

의료 전문 시스템의 신뢰감과 "재활·요양·회복병원" 케어 이미지를 동시에 표현.
채도를 낮춘 딥 틸로 침착하고 전문적인 인상을 준다.

### 후보 팔레트 전체 (기억용)

| 팔레트 | 컨셉 | primary | 비고 |
|---|---|---|---|
| A. Warm Slate | 따뜻한 행정 툴 | `#B45309` 앰버 700 | 친근·대기 상태 연결 |
| **B. Teal Dusk** | **의료 전문 신뢰** | **`#0F766E` 틸 700** | **현재 적용** |
| C. Forest Admin | 상태 흐름 직관 | `#166534` 그린 800 | 완료율 시각화 강점 |

---

## 색상 토큰 (Teal Dusk)

```css
--primary:            #0F766E;  /* Teal 700  — 주요 CTA, 활성 스텝 */
--primary-foreground: #F0FDFA;  /* Teal 50   — primary 위 텍스트 */
--secondary:          #475569;  /* Slate 600 — 보조 버튼, 라벨 */
--background:         #F8FAFC;  /* Slate 50  — 전체 배경 */
--foreground:         #0F172A;  /* Slate 950 — 본문 텍스트 */
--muted:              #F1F5F9;  /* Slate 100 — 카드 배경, 비활성 영역 */
--muted-foreground:   #475569;  /* Slate 600 — 보조 설명 텍스트 */
--border:             #94A3B8;  /* Slate 400 — 테이블·카드 경계 */
--destructive:        #DC2626;  /* Red 600   — REJECTED 상태 */
--success:            #0D9488;  /* Teal 600  — ACCEPTED/COMPLETED 상태 */
```

---

## 상태별 색상 규칙

회송 요청 상태(ReferralStatus)마다 색상을 고정해 일관성을 유지한다.

| 상태 | 색상 | Tailwind 클래스 예시 |
|---|---|---|
| `REQUESTED` | 앰버 | `bg-amber-100 text-amber-700` |
| `CONFIRMED` | 블루 | `bg-blue-100 text-blue-700` |
| `ACCEPTED` | 틸 | `bg-teal-100 text-teal-700` |
| `COMPLETED` | 슬레이트 | `bg-slate-100 text-slate-600` |
| `REJECTED` | destructive (레드) | `bg-red-100 text-red-700` |

---

## 컴포넌트 가이드라인

### 버튼

- **주요 액션** (요청 등록, 수용): `variant="default"` — primary(`#0F766E`) 배경
- **불가 액션**: `variant="destructive"` — `#DC2626` 배경
- **완료 처리**: `variant="outline"` + `text-teal-600`
- **취소/보조**: `variant="outline"` 또는 `variant="ghost"`

### 카드

- 기본 배경: `bg-background` (`#F8FAFC`)
- 선택된 카드: `border-primary ring-1 ring-primary/20 bg-primary/5`
- 호버: `hover:border-primary/50 hover:shadow-sm transition-all`

### 뱃지

상태 뱃지는 shadcn `<Badge>` 대신 인라인 클래스로 직접 색을 지정한다.

```tsx
// 예시
const STATUS_CLASS = {
  REQUESTED:  "bg-amber-100 text-amber-700",
  CONFIRMED:  "bg-teal-100 text-teal-700",
  ACCEPTED:   "bg-teal-100 text-teal-600",
  COMPLETED:  "bg-slate-100 text-slate-600",
  REJECTED:   "bg-red-100 text-red-700",
}
```

### 알림 배지 (NotificationBell)

- 미확인 요청 존재 시: `bg-destructive` (`#DC2626`) 빨간 원형 배지
- 숫자: 9 초과면 `"9+"` 표시

### 타임라인 (StatusTimeline)

- 완료 스텝 원: `bg-primary text-primary-foreground` + 체크 아이콘
- 현재 스텝 원: `border-2 border-primary bg-primary/10 text-primary`
- 미도달 스텝 원: `bg-muted border-muted-foreground/50 text-muted-foreground`
- 연결선 완료 구간: `bg-primary`
- 연결선 미도달 구간: `bg-muted`
- REJECTED: 스텝바 대신 `bg-red-100 text-red-700` 인라인 뱃지로 교체

### 히어로 헤더 (페이지 상단 다크 배너)

리스트 페이지 상단에는 다크 배너로 컨텍스트(병원명·통계)를 표시한다.

- 배경: `bg-slate-900 text-white`
- 레이아웃 패딩 상쇄(전폭 블리드): `-mx-4` — 좌우 `px-4` 를 취소해 전폭 노출
- **보더·라운드 없음** — 사각 처리로 단단한 인상 유지
- 통계 스트립: `border-t border-slate-700` + `divide-x divide-slate-700`
- 통계 숫자는 상태별 색상 (`text-amber-400` / `text-teal-400` / `text-slate-400` / `text-red-400`)

### 테이블 섹션 패턴 (리스트 페이지)

컬럼 헤더와 행의 그리드 정렬을 공유하는 패턴.

```tsx
// ✅ 그리드 정의를 상수로 분리 — 헤더와 행에서 동시 참조
const COLS = "grid grid-cols-[...] gap-4 items-center";

// 섹션 타이틀 — border-b 한 줄만 (bg 없음)
<div className="flex items-baseline gap-2.5 border-b pb-2">
  <h2 className="text-sm font-semibold uppercase tracking-wider ...">제목</h2>
  <span className="text-sm font-bold tabular-nums ...">카운트</span>
</div>

// 컬럼 헤더 — 옅은 muted 배경 + border-b
<div className={`${COLS} px-3 py-2.5 border-b bg-muted/40`}>
  <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">...</span>
</div>

// 행 — divide-y 로 구분 (border 래퍼 없음)
<div className="divide-y">
  {children}
</div>
```

- `rounded-xl border` 래퍼로 전체를 감싸는 방식 ❌ — `divide-y` 패턴 사용
- 행 호버: `hover:bg-muted/30 transition-colors`

### ❌ opacity 변형 금지

`text-muted-foreground/N` 처럼 opacity 를 낮춰 텍스트를 흐리게 만드는 패턴은 **사용 금지**.

```
❌ text-muted-foreground/60
❌ text-muted-foreground/70
❌ text-muted-foreground/40
❌ text-muted-foreground/50  (텍스트에)

✅ text-muted-foreground     (보조 설명)
✅ text-foreground           (본문)
✅ text-slate-700            (값·메타 정보 — L2 계층)
```

아이콘 등 비텍스트 요소에서 `/50` 정도는 허용하되, 텍스트에는 절대 적용하지 않는다.

---

## 텍스트 계층 구조

페이지 내 정보 우선순위를 3단계로 나눈다.

| 계층 | 용도 | 클래스 | 대비비 (vs white) |
|---|---|---|---|
| L1 Primary | 제목, 환자 이니셜, 핵심 값 | `text-foreground` | 15.4:1 |
| L2 Secondary | 병원명, 날짜, 메타 값 | `text-slate-700` | 8.5:1 |
| L3 Muted | 그룹 라벨, 힌트, 보조 설명 | `text-muted-foreground` | 5.6:1 |

라벨과 값이 나란히 있을 때는 라벨을 L3, 값을 L2로 구분한다.

```tsx
// ✅ 라벨(L3) + 값(L2) 분리
<span className="text-muted-foreground">희망일:</span>
<span className="text-slate-700">{date}</span>

// ❌ 둘 다 muted-foreground 로 동일 처리 — 계층 없음
<span className="text-muted-foreground">희망일: {date}</span>
```

---

## 타이포그래피

- 폰트: Geist Sans (`--font-geist-sans`)
- 페이지 제목: `text-xl font-bold`
- 섹션 제목: `text-base font-semibold`
- 카드 제목: `text-base font-medium`
- 보조 텍스트: `text-sm text-muted-foreground`
- 그룹 레이블: `text-sm font-semibold uppercase tracking-wider text-muted-foreground`

### ❌ text-xs 사용 금지

`text-xs` (12px)는 **사용 금지**. 최소 `text-sm` (14px) 이상만 허용한다.

- shadcn/ui 내부(`badge.tsx`, `button.tsx`, `select.tsx` 등) 라이브러리 소스는 예외
- 직접 작성하는 모든 컴포넌트·페이지에서 `text-xs` 클래스 추가 금지

---

## 레이아웃 원칙

- 최대 너비: `max-w-5xl mx-auto` (네비·본문 공통)
- 좌우 패딩: `px-4`
- 본문 상하 여백: `py-8`
- 카드 간격: `space-y-3`
- 섹션 간격: `space-y-6`
- 반응형: 1024px 이상에서 정상 동작 필수 (MVP 범위 — 모바일 최적화 배제)
