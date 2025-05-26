import { Routes } from '@angular/router';
import { BooksComponent } from './components/books/books.component';
import { ReadersComponent } from './components/readers/readers.component';

export const routes: Routes = [
  { path: '', redirectTo: '/books', pathMatch: 'full' },
  { path: 'books', component: BooksComponent },
  { path: 'readers', component: ReadersComponent }
];
