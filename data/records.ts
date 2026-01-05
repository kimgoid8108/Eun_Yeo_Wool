export type MatchResult = 'WIN' | 'DRAW' | 'LOSE';

export interface Record {
  playerId: string;
  matchId: string;
  attendance: boolean;
  goals: number;
  assists: number;
  cleanSheet: boolean; // GK만 적용
  result: MatchResult | null; // 해당 경기 결과
  isMOM: boolean; // MOM 여부
}

export const records: Record[] = [
  // Match 1
  { playerId: '1', matchId: '1', attendance: true, goals: 2, assists: 0, cleanSheet: false, result: 'WIN', isMOM: true },
  { playerId: '2', matchId: '1', attendance: true, goals: 1, assists: 1, cleanSheet: false, result: 'WIN', isMOM: false },
  { playerId: '3', matchId: '1', attendance: true, goals: 0, assists: 0, cleanSheet: false, result: 'WIN', isMOM: false },
  { playerId: '4', matchId: '1', attendance: true, goals: 0, assists: 0, cleanSheet: false, result: 'WIN', isMOM: false },
  { playerId: '5', matchId: '1', attendance: false, goals: 0, assists: 0, cleanSheet: false, result: null, isMOM: false },
  // Match 2
  { playerId: '1', matchId: '2', attendance: true, goals: 1, assists: 0, cleanSheet: false, result: 'WIN', isMOM: false },
  { playerId: '2', matchId: '2', attendance: true, goals: 1, assists: 0, cleanSheet: false, result: 'WIN', isMOM: true },
  { playerId: '3', matchId: '2', attendance: true, goals: 0, assists: 1, cleanSheet: false, result: 'WIN', isMOM: false },
  { playerId: '4', matchId: '2', attendance: false, goals: 0, assists: 0, cleanSheet: false, result: null, isMOM: false },
  { playerId: '6', matchId: '2', attendance: true, goals: 0, assists: 0, cleanSheet: false, result: 'WIN', isMOM: false },
  // Match 3
  { playerId: '1', matchId: '3', attendance: true, goals: 0, assists: 1, cleanSheet: false, result: 'DRAW', isMOM: false },
  { playerId: '3', matchId: '3', attendance: true, goals: 1, assists: 0, cleanSheet: false, result: 'DRAW', isMOM: false },
  { playerId: '4', matchId: '3', attendance: true, goals: 0, assists: 0, cleanSheet: false, result: 'DRAW', isMOM: false },
  { playerId: '7', matchId: '3', attendance: true, goals: 0, assists: 0, cleanSheet: false, result: 'DRAW', isMOM: false },
  // Match 4
  { playerId: '1', matchId: '4', attendance: true, goals: 2, assists: 1, cleanSheet: false, result: 'WIN', isMOM: false },
  { playerId: '5', matchId: '4', attendance: true, goals: 1, assists: 1, cleanSheet: false, result: 'WIN', isMOM: true },
  { playerId: '4', matchId: '4', attendance: true, goals: 0, assists: 0, cleanSheet: true, result: 'WIN', isMOM: false },
  { playerId: '8', matchId: '4', attendance: true, goals: 1, assists: 0, cleanSheet: false, result: 'WIN', isMOM: false },
  // Match 5
  { playerId: '2', matchId: '5', attendance: true, goals: 1, assists: 0, cleanSheet: false, result: 'LOSE', isMOM: false },
  { playerId: '3', matchId: '5', attendance: true, goals: 1, assists: 0, cleanSheet: false, result: 'LOSE', isMOM: true },
  { playerId: '6', matchId: '5', attendance: true, goals: 0, assists: 1, cleanSheet: false, result: 'LOSE', isMOM: false },
  { playerId: '7', matchId: '5', attendance: true, goals: 0, assists: 0, cleanSheet: false, result: 'LOSE', isMOM: false },
];
