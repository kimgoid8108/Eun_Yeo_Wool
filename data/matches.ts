export interface Match {
  id: string;
  date: string; // YYYY-MM-DD
  score: string; // 예: "3-2"
  momPlayerId: string | null; // MOM(Most Outstanding Player)
}

export const matches: Match[] = [
  { id: '1', date: '2024-01-15', score: '3-2', momPlayerId: '1' },
  { id: '2', date: '2024-01-22', score: '2-1', momPlayerId: '2' },
  { id: '3', date: '2024-01-29', score: '1-1', momPlayerId: null },
  { id: '4', date: '2024-02-05', score: '4-0', momPlayerId: '5' },
  { id: '5', date: '2024-02-12', score: '2-3', momPlayerId: '3' },
];
