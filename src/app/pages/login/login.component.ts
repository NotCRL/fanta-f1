import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
  username = '';
  password = '';
  loading = false;
  error = '';
  private isBrowser: boolean;
  private authSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    // Only check auth status on the browser
    if (this.isBrowser) {
      // Redirect to home if already logged in
      if (this.authService.isLoggedIn()) {
        this.router.navigate(['/home']);
      }

      // Subscribe to auth state changes
      this.authSubscription = this.authService.currentUser.subscribe(user => {
        if (user) {
          this.router.navigate(['/home']);
        }
      });
    }
  }

  async onSubmit() {
    if (!this.isBrowser) return;
    
    this.loading = true;
    this.error = '';

    try {
      const success = this.authService.login(this.username, this.password);
      if (!success) {
        this.error = 'Invalid username or password';
      }
    } catch (error) {
      console.error('Login error:', error);
      this.error = 'An error occurred during login';
    } finally {
      this.loading = false;
    }
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
