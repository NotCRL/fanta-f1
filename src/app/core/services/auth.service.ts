import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { ApiService, User } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isBrowser: boolean;
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser = this.currentUserSubject.asObservable();

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private router: Router,
    private apiService: ApiService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    if (this.isBrowser) {
      const user = this.getCurrentUser();
      if (user) {
        this.currentUserSubject.next(user);
      }
    }
  }

  private getLocalStorage(): Storage | null {
    return this.isBrowser ? localStorage : null;
  }

  login(username: string, password: string): Observable<boolean> {
    console.log('[AuthService] login called with:', { username });
    if (!this.isBrowser) {
      console.log('[AuthService] Not in browser environment');
      return new Observable(subscriber => subscriber.next(false));
    }
    
    return new Observable(subscriber => {
      console.log('[AuthService] Calling API service login');
      this.apiService.login(username, password).subscribe({
        next: (user) => {
          console.log('[AuthService] API response:', user ? 'User found' : 'User not found');
          if (user) {
            console.log('[AuthService] Setting current user:', user);
            this.setCurrentUser(user);
            subscriber.next(true);
          } else {
            console.log('[AuthService] Invalid credentials');
            subscriber.next(false);
          }
          subscriber.complete();
        },
        error: (error) => {
          console.error('[AuthService] Login error:', error);
          subscriber.next(false);
          subscriber.complete();
        }
      });
    });
  }

  logout(): void {
    if (!this.isBrowser) return;
    
    this.clearCurrentUser();
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    if (!this.isBrowser) return false;
    const isLoggedIn = !!localStorage.getItem('currentUser');
    console.log('[AuthService] isLoggedIn:', isLoggedIn);
    return isLoggedIn;
  }

  getCurrentUserSync(): User | null {
    return this.currentUserSubject.value;
  }

  private getCurrentUser(): User | null {
    if (!this.isBrowser) return null;
    
    const user = this.getLocalStorage()?.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  private setCurrentUser(user: User): void {
    console.log('[AuthService] Setting current user in subject and localStorage');
    this.currentUserSubject.next(user);
    if (this.isBrowser) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      console.log('[AuthService] User saved to localStorage');
    }
  }

  private clearCurrentUser(): void {
    this.currentUserSubject.next(null);
    if (this.isBrowser) {
      localStorage.removeItem('currentUser');
    }
  }

  register(username: string, email: string, password: string): Observable<boolean> {
    console.log('[AuthService] register called with:', { username, email });
    if (!this.isBrowser) {
      console.log('[AuthService] Not in browser environment');
      return new Observable(subscriber => subscriber.next(false));
    }
    
    return new Observable(subscriber => {
      console.log('[AuthService] Calling API service register');
      this.apiService.register(username, email, password).subscribe({
        next: (user) => {
          if (user) {
            console.log('[AuthService] Registration successful, user:', user);
            this.setCurrentUser(user);
            subscriber.next(true);
          } else {
            console.log('[AuthService] Registration failed: username or email already exists');
            subscriber.next(false);
          }
          subscriber.complete();
        },
        error: (error) => {
          console.error('[AuthService] Registration error:', error);
          subscriber.next(false);
          subscriber.complete();
        }
      });
    });
  }
}
