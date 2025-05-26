import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule, Sort } from '@angular/material/sort';
import { Book } from '../../models/book.interface';
import { BooksService } from '../../services/books.service';
import { Subscription } from 'rxjs';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-books',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatSortModule
  ],
  templateUrl: './books.component.html',
  styleUrl: './books.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BooksComponent implements OnInit, OnDestroy {
  books: Book[] = [];
  bookForm: FormGroup;
  isEditing = false;
  editingBookId: number | null = null;
  currentBook: Book | null = null;
  displayedColumns: string[] = ['title', 'author', 'year', 'genre', 'isbn', 'available', 'actions'];
  isLoading = false;
  private subscription: Subscription = new Subscription();

  constructor(
    private booksService: BooksService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.bookForm = this.initializeForm();
  }

  private initializeForm(book?: Book): FormGroup {
    return this.fb.group({
      title: [book?.title ?? '', [Validators.required, Validators.minLength(2)]],
      author: [book?.author ?? '', [Validators.required, Validators.minLength(2)]],
      year: [book?.year ?? '', [
        Validators.required,
        Validators.min(1000),
        Validators.max(new Date().getFullYear())
      ]],
      genre: [book?.genre ?? '', [Validators.required]],
      isbn: [book?.isbn ?? '', [
        Validators.required,
        Validators.pattern(/^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/)
      ]]
    });
  }

  ngOnInit(): void {
    this.loadBooks();
  }

  private loadBooks(): void {
    this.isLoading = true;
    this.subscription.add(
      this.booksService.getBooks().subscribe({
        next: (books) => {
          this.books = books;
          this.isLoading = false;
        },
        error: () => {
          this.showError('Ошибка при загрузке книг');
          this.isLoading = false;
        }
      })
    );
  }

  onSubmit(): void {
    if (this.bookForm.valid) {
      this.isLoading = true;
      const formValue = this.bookForm.value;
      
      try {
        if (this.isEditing && this.editingBookId && this.currentBook) {
          this.booksService.updateBook({
            ...this.currentBook,
            ...formValue,
            id: this.editingBookId
          });
          this.showSuccess('Книга успешно обновлена');
        } else {
          this.booksService.addBook(formValue);
          this.showSuccess('Книга успешно добавлена');
        }
        this.resetForm();
      } catch {
        this.showError('Ошибка при сохранении книги');
      } finally {
        this.isLoading = false;
      }
    }
  }

  editBook(book: Book): void {
    this.isEditing = true;
    this.editingBookId = book.id ?? null;
    this.currentBook = { ...book };
    this.bookForm = this.initializeForm(book);
  }

  deleteBook(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Подтверждение', message: 'Вы уверены, что хотите удалить эту книгу?' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        try {
          this.booksService.deleteBook(id);
          this.showSuccess('Книга успешно удалена');
        } catch {
          this.showError('Ошибка при удалении книги');
        } finally {
          this.isLoading = false;
        }
      }
    });
  }

  resetForm(): void {
    this.isEditing = false;
    this.editingBookId = null;
    this.currentBook = null;
    this.bookForm = this.initializeForm();
  }

  sortData(sort: Sort): void {
    this.books = [...this.books].sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'title': return this.compare(a.title, b.title, isAsc);
        case 'author': return this.compare(a.author, b.author, isAsc);
        case 'year': return this.compare(a.year, b.year, isAsc);
        case 'genre': return this.compare(a.genre, b.genre, isAsc);
        case 'isbn': return this.compare(a.isbn, b.isbn, isAsc);
        default: return 0;
      }
    });
  }

  private compare(a: any, b: any, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'OK', { duration: 3000 });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'OK', { 
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  trackByBookId(index: number, book: Book): number {
    return book.id ?? -1;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
