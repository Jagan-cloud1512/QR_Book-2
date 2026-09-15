export type BookStatus = 'Available' | 'Reserved' | 'Out of Stock';

export interface BookItem {
  bookId: string;
  title: string;
  author?: string;
  isbn?: string;
  row: number;
  col: string; // e.g. "1-3" or "4"
  qty: number;
  section: string;
  status: BookStatus;
  reservedBy: string | null; // e.g. "admin_demo" or user uid
  holdExpiresAt?: number | null; // epoch timestamp in ms for 5-min timer
  queue: string[]; // array of usernames/uids waiting
  updatedAt: string;
  description?: string;
  floor?: string;
}

export interface ShelfMatrixMeta {
  rows: number;
  cols: number;
  sectionName?: string;
  tableName?: string;
  updatedAt?: string;
}

export interface QRPayload {
  tableName: string;
  action: string;
  generatedAt: string;
  shelfLabel?: string;
}

export interface PatronUser {
  uid: string;
  displayName: string;
  email?: string;
  role?: 'patron' | 'librarian';
  avatarColor?: string;
}

export type NavTab = 'scan' | 'search' | 'library' | 'account' | 'auth';
