import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private isBrowser: boolean;

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  canActivate(): boolean {
    console.log('[AuthGuard] canActivate called');
    if (!this.isBrowser) {
      console.log('[AuthGuard] Not in browser environment, allowing access');
      return true;
    }

    const isLoggedIn = this.authService.isLoggedIn();
    console.log('[AuthGuard] isLoggedIn:', isLoggedIn);

    if (isLoggedIn) {
      console.log('[AuthGuard] User is authenticated, allowing access');
      return true;
    }
    
    console.log('[AuthGuard] User not authenticated, redirecting to login');
    this.router.navigate(['/login']).then(navResult => {
      console.log('[AuthGuard] Navigation to /login result:', navResult);
    });
    return false;
  }
}
