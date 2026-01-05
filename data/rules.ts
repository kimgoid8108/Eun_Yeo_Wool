export interface ScoringRules {
  attendance: number;
  goal: number;
  assist: number;
  cleanSheet: number;
  win: number;
  draw: number;
  lose: number;
  mom: number; // MOM 점수
}

export const scoringRules: ScoringRules = {
  attendance: 1, // 출석 1점
  goal: 1, // 골 1점
  assist: 1, // 어시스트 1점
  cleanSheet: 1, // 클린시트 2점 (GK: 1명, DF: 4명에게만 부여)
  win: 0, // 승무패는 총점에 포함하지 않는다
  draw: 0, // 승무패는 총점에 포함하지 않는다
  lose: 0, // 승무패는 총점에 포함하지 않는다
  mom: 1, // MOM 1점
};
