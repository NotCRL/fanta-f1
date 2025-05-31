import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TEST_USERNAME = 'test';
  private readonly TEST_PASSWORD = 'test123';
  private isBrowser: boolean;
  
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser = this.currentUserSubject.asObservable();

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private router: Router
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    // Initialize user from localStorage if available
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

  login(username: string, password: string): boolean {
    if (username === this.TEST_USERNAME && password === this.TEST_PASSWORD) {
      const user = {
        username: username,
        role: 'user'
      };
      this.currentUserSubject.next(user);
      if (this.isBrowser) {
        localStorage.setItem('user', JSON.stringify(user));
      }
      return true;
    }
    return false;
  }

  logout() {
    this.currentUserSubject.next(null);
    if (this.isBrowser) {
      localStorage.removeItem('user');
    }
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    if (!this.isBrowser) return false;
    return !!localStorage.getItem('user');
  }

  getCurrentUser(): any {
    if (!this.isBrowser) return null;
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (e) {
      console.error('Error parsing user data:', e);
      return null;
    }
  }
}
