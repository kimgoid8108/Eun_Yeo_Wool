export interface Day {
  id: number;
  date: string;
  location: string;
  // ... 다른 속성들
  players?: any[];
}

// 기존 날짜 배열 생성 함수(예시)
function generateSaturdayDates(): Day[] {
  const saturdays: Day[] = [];
  const startDate = new Date(2026, 0, 1);
  startDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentDate = new Date(startDate);

  // 첫 번째 토요일로 이동
  const firstDayOfWeek = currentDate.getDay();
  const daysUntilFirstSaturday = (6 - firstDayOfWeek + 7) % 7;
  if (daysUntilFirstSaturday > 0) {
    currentDate.setDate(currentDate.getDate() + daysUntilFirstSaturday);
  }

  // 오늘까지의 모든 토요일 추가
  while (currentDate <= today) {
    const dateId = currentDate.getTime();
    const formattedDate = currentDate.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });

    saturdays.push({
      id: dateId,
      date: formattedDate,
      location: "경기장", // 필요시 location 채워넣으세요
      // players는 생략 가능
    });

    currentDate.setDate(currentDate.getDate() + 7);
  }

  return saturdays.sort((a, b) => a.id - b.id);
}

export const days = generateSaturdayDates();
