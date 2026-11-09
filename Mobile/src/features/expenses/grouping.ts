// Harcama listesinin güne göre gruplanması (liste tarihe göre yeniden eskiye gelir). Saf; testlidir.
// Gün toplamı yalnızca yüklenmiş kayıtlardan hesaplanır (yemek kartı dahil; satırların toplamı).

import { daysBetween } from '@/lib/format/period';

import type { Expense } from './types';

export type DayRelation = 'today' | 'yesterday' | null;

export interface DayHeaderItem {
  type: 'header';
  key: string;
  /** 'YYYY-MM-DD' */
  date: string;
  relation: DayRelation;
  total: number;
}

export interface ExpenseRowItem {
  type: 'row';
  key: string;
  expense: Expense;
}

export type ExpenseListItem = DayHeaderItem | ExpenseRowItem;

export function dayRelation(date: string, today: string): DayRelation {
  const diff = daysBetween(date, today);
  if (diff === 0) return 'today';
  if (diff === 1) return 'yesterday';
  return null;
}

/** Ardışık aynı tarihli kayıtları gün başlığı + satırlar olarak düzleştirir (FlashList için). */
export function groupExpensesByDay(expenses: Expense[], today: string): ExpenseListItem[] {
  const items: ExpenseListItem[] = [];
  let header: DayHeaderItem | null = null;
  for (const expense of expenses) {
    const date = expense.date.slice(0, 10);
    if (!header || header.date !== date) {
      header = { type: 'header', key: `d-${date}`, date, relation: dayRelation(date, today), total: 0 };
      items.push(header);
    }
    items.push({ type: 'row', key: `e-${expense.id}`, expense });
    header.total = Math.round((header.total + expense.amount) * 100) / 100;
  }
  return items;
}
