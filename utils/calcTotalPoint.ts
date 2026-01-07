/**
 * 선수 총점 계산 유틸리티 함수
 *
 * 특정 선수의 모든 경기 기록을 기반으로 총점을 계산합니다.
 * 출석, 골, 어시스트, 클린시트, 경기 결과, MOM 등 다양한 요소를 점수화합니다.
 *
 * @param {string} playerId - 선수 ID
 * @returns {number} 계산된 총점
 *
 * 사용처:
 * - 현재 사용되지 않음 (향후 선수 통계 페이지에서 사용 예정)
 * - components/records/AttendanceTable.tsx에서 선수 통계 계산 시 활용 가능
 */
import { records } from '@/data/records';
import { scoringRules } from '@/data/rules';

export function calcTotalPoint(playerId: string): number {
  const playerRecords = records.filter(record => record.playerId === playerId);

  let totalPoints = 0;

  playerRecords.forEach(record => {
    // 출석 점수
    if (record.attendance) {
      totalPoints += scoringRules.attendance;
    }

    // 골 점수
    totalPoints += record.goals * scoringRules.goal;

    // 어시스트 점수
    totalPoints += record.assists * scoringRules.assist;

    // 클린시트 점수
    if (record.cleanSheet) {
      totalPoints += scoringRules.cleanSheet;
    }

    // 경기 결과 점수
    if (record.result === 'WIN') {
      totalPoints += scoringRules.win;
    } else if (record.result === 'DRAW') {
      totalPoints += scoringRules.draw;
    } else if (record.result === 'LOSE') {
      totalPoints += scoringRules.lose;
    }

    // MOM 점수
    if (record.isMOM) {
      totalPoints += scoringRules.mom;
    }
  });

  return totalPoints;
}
