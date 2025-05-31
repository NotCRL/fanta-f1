import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from "./core/components/navbar/navbar.component";
import { FooterComponent } from "./core/components/footer/footer.component";
import { AuthService } from './core/services/auth.service';
import { LeagueService } from './core/services/league.service';
import { TeamService } from './core/services/team.service';
import { FantasyDriverService } from './core/services/fantasy-driver.service';
import { NotificationService } from './core/services/notification.service';
import { Subscription, forkJoin, of, interval } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  isLogging = false;
  userData: any = null;
  isLoading = true;
  unreadNotificationsCount = 0;
  
  private isBrowser: boolean;
  private userSubscription?: Subscription;
  private notificationSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private leagueService: LeagueService,
    private teamService: TeamService,
    private fantasyDriverService: FantasyDriverService,
    private notificationService: NotificationService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      // Sottoscrivi ai cambiamenti dell'utente autenticato
      this.userSubscription = this.authService.currentUser.subscribe(user => {
        this.isLogging = !!user;
        this.userData = user;
        
        if (user) {
          // Carica i dati iniziali
          this.loadInitialData();
          
          // Sottoscrivi alle notifiche
          this.subscribeToNotifications();
        } else {
          // Annulla la sottoscrizione alle notifiche se l'utente si disconnette
          this.unsubscribeFromNotifications();
        }
      });
    }
  }

  /**
   * Carica i dati iniziali necessari all'applicazione
   */
  private loadInitialData(): void {
    if (!this.userData) return;
    
    this.isLoading = true;
    
    forkJoin([
      // Carica le leghe dell'utente
      this.leagueService.getLeagues().pipe(
        catchError(() => of([]))
      ),
      // Carica le squadre dell'utente
      this.teamService.getTeamsByUserId(this.userData.id).pipe(
        catchError(() => of([]))
      )
    ]).subscribe({
      next: () => {
        // Dati caricati con successo
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Errore nel caricamento dei dati iniziali:', error);
        this.isLoading = false;
      }
    });
  }
  
  /**
   * Sottoscrivi alle notifiche dell'utente
   */
  private subscribeToNotifications(): void {
    if (!this.userData) return;
    
    // Carica il conteggio delle notifiche non lette
    this.updateUnreadNotificationsCount();
    
    // Imposta un intervallo per aggiornare periodicamente le notifiche (es. ogni 30 secondi)
    this.notificationSubscription = interval(30000).subscribe(() => {
      this.updateUnreadNotificationsCount();
    });
  }
  
  /**
   * Aggiorna il contatore delle notifiche non lette
   */
  private updateUnreadNotificationsCount(): void {
    if (!this.userData) return;
    
    this.notificationService.getUserNotifications(this.userData.id, true).subscribe({
      next: (notifications) => {
        this.unreadNotificationsCount = notifications.length;
      },
      error: (error) => {
        console.error('Errore nel recupero delle notifiche:', error);
      }
    });
  }
  
  /**
   * Annulla la sottoscrizione alle notifiche
   */
  private unsubscribeFromNotifications(): void {
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
      this.notificationSubscription = undefined;
    }
    this.unreadNotificationsCount = 0;
  }
  
  ngOnDestroy() {
    // Annulla tutte le sottoscrizioni
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    this.unsubscribeFromNotifications();
  }
}
