export interface Walker {
  id: number;
  name: string;
  color: string;
  position: number;
}

export interface DayAssignment {
  date: string;
  walkerId: number | null;
}

export interface WeightEntry {
  id: number;
  date: string;
  kg: number;
}

export interface Pet {
  name: string;
  birthDate: string | null;
  photoUrl: string | null;
}

export type Tab = 'home' | 'month' | 'weight' | 'pet';
