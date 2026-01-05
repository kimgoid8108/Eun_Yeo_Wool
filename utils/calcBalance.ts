import { fees } from '@/data/fees';

export function calcBalance(): number {
  return fees.reduce((balance, fee) => {
    if (fee.type === 'INCOME') {
      return balance + fee.amount;
    } else {
      return balance - fee.amount;
    }
  }, 0);
}
