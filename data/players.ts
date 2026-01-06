export interface Player {
  id: string;
  name: string;
  position: string;
  isExecutive: boolean;
}

export const players: Player[] = [
  { id: "1", name: "김철수", position: "FW", isExecutive: true },
  { id: "2", name: "이영철", position: "MF", isExecutive: true },
  { id: "3", name: "박민수", position: "DF", isExecutive: false },
  { id: "4", name: "최지영", position: "GK", isExecutive: true },
  { id: "5", name: "정대현", position: "FW", isExecutive: false },
  { id: "6", name: "강수진", position: "MF", isExecutive: false },
  { id: "7", name: "윤성호", position: "DF", isExecutive: false },
  { id: "8", name: "오정우", position: "MF", isExecutive: false },
  { id: "9", name: "전수효", position: "FW", isExecutive: false },
  { id: "10", name: "김수호", position: "FW", isExecutive: false },
  { id: "11", name: "이성수", position: "FW", isExecutive: false },
  { id: "12", name: "박성민", position: "FW", isExecutive: false },
  { id: "13", name: "김도현", position: "FW", isExecutive: false },
  { id: "14", name: "이재훈", position: "MF", isExecutive: false },
  { id: "15", name: "최민수", position: "DF", isExecutive: false },
  { id: "16", name: "정우진", position: "GK", isExecutive: false },
  { id: "17", name: "한지훈", position: "FW", isExecutive: false },
  { id: "18", name: "오승현", position: "MF", isExecutive: false },
  { id: "19", name: "류시원", position: "DF", isExecutive: false },
  { id: "20", name: "민경훈", position: "MF", isExecutive: false },
  { id: "21", name: "홍성우", position: "FW", isExecutive: false },
  { id: "22", name: "윤정호", position: "FW", isExecutive: false },
  { id: "23", name: "강준호", position: "FW", isExecutive: false },
  { id: "24", name: "백승민", position: "FW", isExecutive: false },
];
