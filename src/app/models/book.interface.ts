export interface Book {
  id?: number;
  title: string;
  author: string;
  year: number;
  genre: string;
  isbn: string;
  available?: boolean;
} 