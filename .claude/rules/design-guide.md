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
--secondary:          #64748B;  /* Slate 500 — 보조 버튼, 라벨 */
--background:         #F8FAFC;  /* Slate 50  — 전체 배경 */
--foreground:         #0F172A;  /* Slate 950 — 본문 텍스트 */
--muted:              #E2E8F0;  /* Slate 200 — 카드 배경, 비활성 영역 */
--muted-foreground:   #64748B;  /* Slate 500 — 보조 설명 텍스트 */
--border:             #CBD5E1;  /* Slate 300 — 테이블·카드 경계 */
--destructive:        #DC2626;  /* Red 600   — REJECTED 상태 */
--success:            #0D9488;  /* Teal 600  — ACCEPTED/COMPLETED 상태 */
```

---

## 상태별 색상 규칙

회송 요청 상태(ReferralStatus)마다 색상을 고정해 일관성을 유지한다.

| 상태 | 색상 | Tailwind 클래스 예시 |
|---|---|---|
| `REQUESTED` | 앰버 | `bg-amber-100 text-amber-700` |
| `CONFIRMED` | primary (틸) | `bg-teal-100 text-teal-700` |
| `ACCEPTED` | success (틸 600) | `bg-teal-100 text-teal-600` |
| `COMPLETED` | 슬레이트 (흐릿) | `bg-slate-100 text-slate-500` |
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
  COMPLETED:  "bg-slate-100 text-slate-500",
  REJECTED:   "bg-red-100 text-red-700",
}
```

### 알림 배지 (NotificationBell)

- 미확인 요청 존재 시: `bg-destructive` (`#DC2626`) 빨간 원형 배지
- 숫자: 9 초과면 `"9+"` 표시

### 타임라인 (StatusTimeline)

- 완료 스텝 원: `bg-primary text-primary-foreground` + 체크 아이콘
- 현재 스텝 원: `border-2 border-primary bg-primary/10 text-primary`
- 미도달 스텝 원: `bg-muted border-muted-foreground/30 text-muted-foreground`
- 연결선 완료 구간: `bg-primary`
- 연결선 미도달 구간: `bg-muted`
- REJECTED: 스텝바 대신 `bg-red-100 text-red-700` 인라인 뱃지로 교체

---

## 타이포그래피

- 폰트: Geist Sans (`--font-geist-sans`)
- 페이지 제목: `text-xl font-bold`
- 섹션 제목: `text-base font-semibold`
- 카드 제목: `text-base font-medium`
- 보조 텍스트: `text-sm text-muted-foreground`
- 그룹 레이블: `text-xs font-semibold uppercase tracking-wider text-muted-foreground`

---

## 레이아웃 원칙

- 최대 너비: `max-w-5xl mx-auto` (네비·본문 공통)
- 좌우 패딩: `px-4`
- 본문 상하 여백: `py-8`
- 카드 간격: `space-y-3`
- 섹션 간격: `space-y-6`
- 반응형: 1024px 이상에서 정상 동작 필수 (MVP 범위 — 모바일 최적화 배제)
