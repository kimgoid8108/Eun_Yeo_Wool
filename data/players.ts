export interface Player {
  id: string;
  name: string;
  position: string;
  isExecutive: boolean;
}

export const players: Player[] = [
  { id: "1", name: "김철수", position: "FW", isExecutive: true },
  { id: "2", name: "이영희", position: "MF", isExecutive: true },
  { id: "3", name: "박민수", position: "DF", isExecutive: false },
  { id: "4", name: "최지영", position: "GK", isExecutive: true },
  { id: "5", name: "정대현", position: "FW", isExecutive: false },
  { id: "6", name: "강수진", position: "MF", isExecutive: false },
  { id: "7", name: "윤성호", position: "DF", isExecutive: false },
  { id: "8", name: "오정우", position: "MF", isExecutive: false },
];
