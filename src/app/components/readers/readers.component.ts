import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule, Sort } from '@angular/material/sort';
import { Reader } from '../../models/reader.interface';
import { ReadersService } from '../../services/readers.service';
import { Subscription } from 'rxjs';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-readers',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatSortModule
  ],
  templateUrl: './readers.component.html',
  styleUrl: './readers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReadersComponent implements OnInit, OnDestroy {
  readers: Reader[] = [];
  readerForm: FormGroup;
  isEditing = false;
  editingReaderId: number | null = null;
  currentReader: Reader | null = null;
  displayedColumns: string[] = ['firstName', 'lastName', 'email', 'phone', 'registrationDate', 'active', 'actions'];
  isLoading = false;
  private subscription: Subscription = new Subscription();

  constructor(
    private readersService: ReadersService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.readerForm = this.initializeForm();
  }

  private initializeForm(reader?: Reader): FormGroup {
    return this.fb.group({
      firstName: [reader?.firstName ?? '', [Validators.required, Validators.minLength(2)]],
      lastName: [reader?.lastName ?? '', [Validators.required, Validators.minLength(2)]],
      email: [reader?.email ?? '', [Validators.required, Validators.email]],
      phone: [reader?.phone ?? '', [
        Validators.required,
        Validators.pattern(/^\+?[0-9\s-()]{10,}$/)
      ]],
      registrationDate: [
        reader ? new Date(reader.registrationDate) : new Date(),
        [Validators.required]
      ]
    });
  }

  ngOnInit(): void {
    this.loadReaders();
  }

  private loadReaders(): void {
    this.isLoading = true;
    this.subscription.add(
      this.readersService.getReaders().subscribe({
        next: (readers) => {
          this.readers = readers;
          this.isLoading = false;
        },
        error: () => {
          this.showError('Ошибка при загрузке читателей');
          this.isLoading = false;
        }
      })
    );
  }

  onSubmit(): void {
    if (this.readerForm.valid) {
      this.isLoading = true;
      const formValue = this.readerForm.value;
      
      try {
        if (this.isEditing && this.editingReaderId && this.currentReader) {
          this.readersService.updateReader({
            ...this.currentReader,
            ...formValue,
            id: this.editingReaderId
          });
          this.showSuccess('Читатель успешно обновлен');
        } else {
          this.readersService.addReader(formValue);
          this.showSuccess('Читатель успешно добавлен');
        }
        this.resetForm();
      } catch {
        this.showError('Ошибка при сохранении читателя');
      } finally {
        this.isLoading = false;
      }
    }
  }

  editReader(reader: Reader): void {
    this.isEditing = true;
    this.editingReaderId = reader.id ?? null;
    this.currentReader = { ...reader };
    this.readerForm = this.initializeForm(reader);
  }

  deleteReader(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Подтверждение', message: 'Вы уверены, что хотите удалить этого читателя?' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        try {
          this.readersService.deleteReader(id);
          this.showSuccess('Читатель успешно удален');
        } catch {
          this.showError('Ошибка при удалении читателя');
        } finally {
          this.isLoading = false;
        }
      }
    });
  }

  resetForm(): void {
    this.isEditing = false;
    this.editingReaderId = null;
    this.currentReader = null;
    this.readerForm = this.initializeForm();
  }

  sortData(sort: Sort): void {
    this.readers = [...this.readers].sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'firstName': return this.compare(a.firstName, b.firstName, isAsc);
        case 'lastName': return this.compare(a.lastName, b.lastName, isAsc);
        case 'email': return this.compare(a.email, b.email, isAsc);
        case 'phone': return this.compare(a.phone, b.phone, isAsc);
        case 'registrationDate': return this.compare(a.registrationDate, b.registrationDate, isAsc);
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

  trackByReaderId(index: number, reader: Reader): number {
    return reader.id ?? -1;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
