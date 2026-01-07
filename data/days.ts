export interface Day {
  id: string;
  day: string;
  dateId: number; // 백엔드 dateId (숫자)
}

/**
 * 토요일만 경기가 있으므로, 2026년 1월 1일부터 최근 12주간의 토요일 날짜 생성
 */
function generateSaturdayDates(): Day[] {
  const saturdays: Day[] = [];

  // 2026년 1월 1일부터 시작
  const startDate = new Date(2026, 0, 1); // 2026년 1월 1일
  startDate.setHours(0, 0, 0, 0);

  // 오늘 날짜
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 2026년 1월 1일부터 오늘까지의 모든 토요일 찾기
  const currentDate = new Date(startDate);

  // 첫 번째 토요일 찾기
  const firstDayOfWeek = currentDate.getDay();
  const daysUntilFirstSaturday = (6 - firstDayOfWeek + 7) % 7;
  if (daysUntilFirstSaturday > 0) {
    currentDate.setDate(currentDate.getDate() + daysUntilFirstSaturday);
  }

  // 오늘까지의 모든 토요일 추가
  while (currentDate <= today) {
    const dateId = currentDate.getTime();

    const formattedDate = currentDate.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });

    saturdays.push({
      id: String(dateId),
      day: formattedDate,
      dateId: dateId,
    });

    // 다음 토요일로 이동 (7일 후)
    currentDate.setDate(currentDate.getDate() + 7);
  }

  // 날짜 순서대로 정렬 (오래된 날짜가 먼저, 최신 날짜가 마지막)
  return saturdays.sort((a, b) => a.dateId - b.dateId);
}

export const days = generateSaturdayDates();
