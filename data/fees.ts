export type FeeType = 'INCOME' | 'EXPENSE';

export interface Fee {
  id: string;
  date: string; // YYYY-MM-DD
  type: FeeType;
  title: string;
  amount: number;
  payer?: string; // 납부자 (수입인 경우)
}

export const fees: Fee[] = [
  { id: '1', date: '2024-01-01', type: 'INCOME', title: '1월 회비', amount: 500000, payer: '김철수' },
  { id: '2', date: '2024-01-01', type: 'INCOME', title: '1월 회비', amount: 500000, payer: '이영희' },
  { id: '3', date: '2024-01-01', type: 'INCOME', title: '1월 회비', amount: 500000, payer: '박민수' },
  { id: '4', date: '2024-01-01', type: 'INCOME', title: '1월 회비', amount: 500000, payer: '최지영' },
  { id: '5', date: '2024-01-01', type: 'INCOME', title: '1월 회비', amount: 500000, payer: '정대현' },
  { id: '6', date: '2024-01-05', type: 'EXPENSE', title: '경기장 대여료', amount: 100000 },
  { id: '7', date: '2024-01-10', type: 'EXPENSE', title: '심판 비용', amount: 50000 },
  { id: '8', date: '2024-01-15', type: 'EXPENSE', title: '물품 구매', amount: 30000 },
  { id: '9', date: '2024-02-01', type: 'INCOME', title: '2월 회비', amount: 500000, payer: '김철수' },
  { id: '10', date: '2024-02-01', type: 'INCOME', title: '2월 회비', amount: 500000, payer: '이영희' },
  { id: '11', date: '2024-02-01', type: 'INCOME', title: '2월 회비', amount: 500000, payer: '박민수' },
  { id: '12', date: '2024-02-05', type: 'EXPENSE', title: '경기장 대여료', amount: 100000 },
  { id: '13', date: '2024-02-10', type: 'EXPENSE', title: '심판 비용', amount: 50000 },
];
