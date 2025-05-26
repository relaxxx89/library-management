import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Book } from '../models/book.interface';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class BooksService {
  private books: Book[] = [];
  private booksSubject = new BehaviorSubject<Book[]>([]);
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.loadInitialData();
  }

  private loadInitialData() {
    if (this.isBrowser) {
      const savedBooks = localStorage.getItem('books');
      if (savedBooks) {
        this.books = JSON.parse(savedBooks);
        this.updateBooks();
      }
    }
  }

  getBooks(): Observable<Book[]> {
    return this.booksSubject.asObservable();
  }

  addBook(book: Book): void {
    const newBook = {
      ...book,
      id: Math.max(0, ...this.books.map(b => b.id ?? 0)) + 1,
      available: true
    };
    this.books = [...this.books, newBook];
    this.updateBooks();
  }

  updateBook(updatedBook: Book): void {
    this.books = this.books.map(book => 
      book.id === updatedBook.id ? updatedBook : book
    );
    this.updateBooks();
  }

  deleteBook(id: number): void {
    this.books = this.books.filter(book => book.id !== id);
    this.updateBooks();
  }

  private updateBooks(): void {
    if (this.isBrowser) {
      localStorage.setItem('books', JSON.stringify(this.books));
    }
    this.booksSubject.next(this.books);
  }
}
