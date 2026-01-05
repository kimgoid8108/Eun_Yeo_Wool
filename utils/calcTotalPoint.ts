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
