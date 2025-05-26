import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Reader } from '../models/reader.interface';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ReadersService {
  private readers: Reader[] = [];
  private readersSubject = new BehaviorSubject<Reader[]>([]);
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.loadInitialData();
  }

  private loadInitialData() {
    if (this.isBrowser) {
      const savedReaders = localStorage.getItem('readers');
      if (savedReaders) {
        this.readers = JSON.parse(savedReaders, (key, value) => {
          if (key === 'registrationDate') {
            return new Date(value);
          }
          return value;
        });
        this.updateReaders();
      }
    }
  }

  getReaders(): Observable<Reader[]> {
    return this.readersSubject.asObservable();
  }

  addReader(reader: Reader): void {
    const newReader = {
      ...reader,
      id: Math.max(0, ...this.readers.map(r => r.id ?? 0)) + 1,
      active: true
    };
    this.readers = [...this.readers, newReader];
    this.updateReaders();
  }

  updateReader(updatedReader: Reader): void {
    this.readers = this.readers.map(reader => 
      reader.id === updatedReader.id ? updatedReader : reader
    );
    this.updateReaders();
  }

  deleteReader(id: number): void {
    this.readers = this.readers.filter(reader => reader.id !== id);
    this.updateReaders();
  }

  private updateReaders(): void {
    if (this.isBrowser) {
      localStorage.setItem('readers', JSON.stringify(this.readers));
    }
    this.readersSubject.next(this.readers);
  }
}
