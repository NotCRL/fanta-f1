import { Component, OnInit, AfterViewInit, OnDestroy, Inject, PLATFORM_ID, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('bgVideo') bgVideo!: ElementRef<HTMLVideoElement>;
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

  ngAfterViewInit() {
    if (this.isBrowser && this.bgVideo) {
      // Assicura che il video venga riprodotto correttamente su tutti i browser
      const video = this.bgVideo.nativeElement;
      video.muted = true;
      video.play().catch((error: Error) => {
        console.warn('Auto-play was prevented:', error);
        // Riprova con un gestore di interazione utente
        const playOnClick = () => {
          video.play().then(() => {
            document.removeEventListener('click', playOnClick);
          });
        };
        document.addEventListener('click', playOnClick);
      });
    }
  }

  ngOnInit() {
    if (this.isBrowser) {
      
      if (this.authService.isLoggedIn()) {
        this.router.navigate(['/home']);
      }

      this.authSubscription = this.authService.currentUser.subscribe(user => {
        if (user) {
          this.router.navigate(['/home']);
        }
      });
    }
  }

  onSubmit() {
    console.log('[Login] onSubmit called');
    if (!this.isBrowser) {
      console.log('[Login] Not in browser environment');
      return;
    }
    
    this.loading = true;
    this.error = '';
    console.log('[Login] Calling authService.login');

    this.authService.login(this.username, this.password).subscribe({
      next: (success) => {
        console.log('[Login] authService.login response:', success);
        if (success) {
          console.log('[Login] Login successful, navigating to /home');
          // Naviga alla home dopo il login riuscito
          this.router.navigate(['/home']).then(navResult => {
            console.log('[Login] Navigation result:', navResult);
            if (!navResult) {
              console.error('[Login] Navigation failed');
              this.error = 'Impossibile accedere alla home';
            }
          });
        } else {
          console.log('[Login] Login failed: invalid credentials');
          this.error = 'Username o password non validi';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('[Login] Login error:', error);
        this.error = 'Si è verificato un errore durante il login';
        this.loading = false;
      }
    });
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
