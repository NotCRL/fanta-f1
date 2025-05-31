import { Component, OnInit, ViewChild, ElementRef, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'] // changed styleUrl to styleUrls
})
export class RegisterComponent implements OnInit {
  @ViewChild('bgVideo') videoElement!: ElementRef<HTMLVideoElement>;
  
  username: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  loading: boolean = false;
  error: string = '';
  isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthService,
    private router: Router
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      // Verifica se l'utente è già loggato
      if (this.authService.isLoggedIn()) {
        this.router.navigate(['/home']);
      }
      
      // Gestisci l'autoplay del video
      this.handleVideoAutoplay();
    }
  }

  private handleVideoAutoplay(): void {
    if (!this.isBrowser || !this.videoElement?.nativeElement) return;
    
    const video = this.videoElement.nativeElement;
    
    // Prova a far partire il video
    const playPromise = video.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.log('Autoplay non consentito, verrà attivato al primo click');
        // Aggiungi un gestore di eventi per il primo click sulla pagina
        const playOnClick = () => {
          video.play().then(() => {
            document.removeEventListener('click', playOnClick);
          }).catch(e => console.error('Errore nella riproduzione del video:', e));
        };
        document.addEventListener('click', playOnClick);
      });
    }
  }

  onSubmit(form: NgForm): void {
    console.log('[Register] onSubmit called');
    
    if (!this.isBrowser || !form.valid) {
      console.log('[Register] Form not valid or not in browser environment');
      return;
    }
    
    // Verifica che le password corrispondano
    if (this.password !== this.confirmPassword) {
      this.error = 'Le password non corrispondono';
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    console.log('[Register] Calling authService.register');
    this.authService.register(this.username, this.email, this.password).subscribe({
      next: (success) => {
        console.log('[Register] authService.register response:', success);
        if (success) {
          console.log('[Register] Registration successful, redirecting to /home');
          this.router.navigate(['/home']).then(navResult => {
            if (!navResult) {
              console.error('[Register] Navigation to /home failed');
              this.error = 'Impossibile accedere alla home';
              this.loading = false;
            }
          });
        } else {
          console.log('[Register] Registration failed: username or email already exists');
          this.error = 'Username o email già in uso';
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('[Register] Registration error:', error);
        this.error = 'Si è verificato un errore durante la registrazione';
        this.loading = false;
      }
    });
  }
}
