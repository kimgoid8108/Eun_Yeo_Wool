# 은여울FC 대시보드

조기축구 팀 관리 대시보드 애플리케이션입니다.

## 프로젝트 구조

### 앱 라우터 (app/)

- `app/page.tsx` - 대시보드 메인 페이지
- `app/records/page.tsx` - 경기 기록 페이지
- `app/executives/page.tsx` - 회원명단 페이지
- `app/fees/page.tsx` - 회비 기록 페이지
- `app/fees/history/page.tsx` - 회비 사용내역 페이지
- `app/space/page.tsx` - 필요한 공간 페이지
- `app/layout.tsx` - 전체 레이아웃 (Header, Sidebar 포함)

### 컴포넌트 (components/)

#### 대시보드 컴포넌트 (components/dashboard/)

- `OverviewCard.tsx` - 통계 정보 카드 (사용처: app/page.tsx)
- `RecentMatchCard.tsx` - 최근 경기 카드 (사용처: app/page.tsx)
- `MiniChart.tsx` - 미니 차트 (사용처: app/page.tsx)

#### 레이아웃 컴포넌트 (components/layout/)

- `Header.tsx` - 상단 헤더 (사용처: app/layout.tsx)
- `Sidebar.tsx` - 사이드바 네비게이션 (사용처: app/layout.tsx)

#### 기록 컴포넌트 (components/records/)

- `AttendanceTable.tsx` - 출석 테이블 (사용처: app/records/page.tsx)
- `DateNavigation.tsx` - 날짜 네비게이션 (사용처: app/records/page.tsx)
- `ViewModeToggle.tsx` - 보기 모드 토글 (사용처: app/records/page.tsx)
- `EmptyTeamMessage.tsx` - 빈 팀 메시지 (사용처: app/records/page.tsx)
- `MatchResultView.tsx` - 경기 결과 뷰 (사용처: app/records/page.tsx)
- `InitialSetup.tsx` - 초기 설정 모달 (사용처: app/records/page.tsx)
- `AddDateModal.tsx` - 날짜 추가 모달 (사용처: app/records/page.tsx)
- `AddMatchModal.tsx` - 경기 추가 모달 (사용처: components/records/MatchResultView.tsx)
- `MemberSelection.tsx` - 회원 선택 컴포넌트 (사용처: components/records/InitialSetup.tsx)
- `PlayerList.tsx` - 선수 목록 컴포넌트 (사용처: components/records/InitialSetup.tsx)

#### 회비 컴포넌트 (components/fees/)

- `FeeSummaryCard.tsx` - 회비 요약 카드 (사용처: app/fees/page.tsx)
- `FeeTable.tsx` - 회비 테이블 (사용처: app/fees/page.tsx)
- `ExpenseTable.tsx` - 지출 내역 테이블 (사용처: app/fees/history/page.tsx)

#### 임원 컴포넌트 (components/executives/)

- `ExecutiveCard.tsx` - 임원 카드 (사용처: app/executives/page.tsx)
- `MemberCard.tsx` - 회원 카드 (사용처: app/executives/page.tsx)

### 커스텀 훅 (hooks/)

- `useSwipeGesture.ts` - 스와이프 제스처 처리 (사용처: app/records/page.tsx)
- `useDateManagement.ts` - 날짜 관리 (사용처: app/records/page.tsx)
- `useRecordsData.ts` - 기록 데이터 관리 (사용처: app/records/page.tsx)
- `useMatchOperations.ts` - 경기 CRUD 작업 (사용처: app/records/page.tsx)
- `usePlayerIdMap.ts` - 선수 ID 매핑 관리 (사용처: components/records/AttendanceTable.tsx)
- `usePlayerStats.ts` - 선수 통계 데이터 관리 (사용처: components/records/AttendanceTable.tsx)
- `useAttendanceManagement.ts` - 출석 관리 (사용처: components/records/AttendanceTable.tsx)
- `usePlayerStatsEditing.ts` - 선수 통계 편집 관리 (사용처: components/records/AttendanceTable.tsx)
- `usePlayerStatsSave.ts` - 선수 통계 저장 관리 (사용처: components/records/AttendanceTable.tsx)

### 유틸리티 함수 (utils/)

- `calcBalance.ts` - 회비 잔액 계산 (사용처: app/page.tsx, components/fees/FeeSummaryCard.tsx)
- `calcTotalPoint.ts` - 선수 총점 계산 (현재 미사용, 향후 사용 예정)
- `groupFeesByMonth.ts` - 회비 데이터 월별 그룹화 (사용처: components/fees/FeeTable.tsx)
- `playerStatsUtils.ts` - 선수 통계 유틸리티 함수 (사용처: components/records/AttendanceTable.tsx, hooks/)

### 서비스 (services/)

- `playersService.ts` - 선수 API 서비스 (사용처: app/records/page.tsx, components/records/AttendanceTable.tsx, components/records/InitialSetup.tsx)
- `recordsService.ts` - 기록 API 서비스 (사용처: app/records/page.tsx, components/records/AttendanceTable.tsx)

### 타입 정의 (types/)

- `api.ts` - API 관련 타입 정의
- `records.ts` - 기록 관련 타입 정의
- `playerStats.ts` - 선수 통계 관련 타입 정의 (사용처: components/records/AttendanceTable.tsx, hooks/)

### 라이브러리 (lib/)

- `api.ts` - API 클라이언트 설정 (사용처: 모든 서비스 모듈에서 간접 사용)

### 데이터 (data/)

- `days.ts` - 날짜 데이터
- `players.ts` - 선수 데이터
- `matches.ts` - 경기 데이터
- `records.ts` - 기록 데이터
- `fees.ts` - 회비 데이터
- `executives.ts` - 임원 데이터
- `rules.ts` - 점수 규칙 데이터

## 주요 기능

### 대시보드

- 오늘 경기 요약
- 출석 인원 통계
- 회비 잔액 표시
- 월별 출석 통계 그래프
- 최근 경기 결과

### 경기 기록

- 날짜별 경기 기록 관리
- 팀 추가 및 선수 등록
- 출석 체크 및 통계 입력
- 경기 결과 추가/수정/삭제
- 스와이프 제스처로 날짜 이동

### 회비 관리

- 회비 수입/지출 기록
- 월별 회비 요약
- 회비 사용내역 조회

### 회원 관리

- 회원명단 조회
- 임원 정보 표시

## 기술 스택

- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **상태 관리**: React Hooks (useState, useEffect, useCallback, useMemo)
- **API 통신**: Fetch API

## 시작하기

### 개발 서버 실행

```bash
npm run dev

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```

NEXT_PUBLIC_API_BASE_URL=https://jochukback-production.up.railway.app

```

환경 변수 변경 후 개발 서버를 재시작해야 합니다.

## 프로젝트 구조 설명

### 컴포넌트화 전략
- 재사용 가능한 컴포넌트는 `components/` 디렉토리에 분리
- 복잡한 로직은 커스텀 훅으로 분리하여 재사용성 향상
- 유틸리티 함수는 `utils/` 디렉토리에 분리
- 타입 정의는 `types/` 디렉토리에 중앙화

### 코드 구조
- 각 파일 상단에 사용처 주석 추가
- 주요 함수 및 컴포넌트에 JSDoc 주석 추가
- 명확한 파일명과 디렉토리 구조로 가독성 향상

## 배포

이 프로젝트는 [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)에서 쉽게 배포할 수 있습니다.

자세한 내용은 [Next.js 배포 문서](https://nextjs.org/docs/app/building-your-application/deploying)를 참조하세요.

## 라이선스

이 프로젝트는 개인 프로젝트입니다.
```
