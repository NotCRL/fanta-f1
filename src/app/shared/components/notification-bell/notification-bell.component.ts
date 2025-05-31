import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';

// Interfaccia per il tipo di notifica
export interface Notification {
  id: number;
  titolo: string;
  messaggio: string;
  data: Date;
  tipo: 'info' | 'warning' | 'success' | 'error';
  link?: string;
  letta: boolean;
}

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss']
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  // Stato del componente
  showNotifications = false;
  notifications: Notification[] = [];
  isLoading = false;
  error: string | null = null;
  unreadCount = 0;
  
  // Sottoscrizioni
  private refreshSubscription?: Subscription;
  private clickSubscription?: () => void;

  // Dati mock per le notifiche (da sostituire con chiamate al servizio reale)
  private mockNotifications: Notification[] = [
    {
      id: 1,
      titolo: 'Benvenuto in Fanta F1!',
      messaggio: 'Grazie per esserti registrato. Inizia subito a giocare!',
      data: new Date(),
      tipo: 'info',
      letta: false,
      link: '/welcome'
    },
    {
      id: 2,
      titolo: 'Prossima gara: Gran Premio di Monza',
      messaggio: 'La prossima gara è prevista per domenica alle 15:00',
      data: new Date(Date.now() - 3600000 * 2), // 2 ore fa
      tipo: 'warning',
      letta: false,
      link: '/calendar'
    },
    {
      id: 3,
      titolo: 'Aggiornamento completato',
      messaggio: 'Il tuo team è stato aggiornato con successo',
      data: new Date(Date.now() - 86400000), // 1 giorno fa
      tipo: 'success',
      letta: true,
      link: '/my-team'
    }
  ];

  constructor(
    private elementRef: ElementRef,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.setupAutoRefresh();
  }

  ngOnDestroy(): void {
    this.cleanupSubscriptions();
  }

  // Gestisce il click esterno per chiudere il dropdown
  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showNotifications = false;
    }
  }

  // Carica le notifiche (mock)
  loadNotifications(): void {
    this.isLoading = true;
    this.error = null;
    
    // Simula una chiamata API
    setTimeout(() => {
      try {
        // In un'app reale, qui andrebbe una chiamata al servizio
        this.notifications = [...this.mockNotifications];
        this.updateUnreadCount();
      } catch (err) {
        this.error = 'Impossibile caricare le notifiche. Riprova più tardi.';
        console.error('Errore nel caricamento delle notifiche:', err);
      } finally {
        this.isLoading = false;
      }
    }, 500);
  }

  // Imposta l'aggiornamento automatico delle notifiche
  private setupAutoRefresh(): void {
    // Aggiorna le notifiche ogni 5 minuti
    this.refreshSubscription = interval(5 * 60 * 1000).subscribe(() => {
      this.loadNotifications();
    });
  }

  // Pulisce le sottoscrizioni
  private cleanupSubscriptions(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
    if (this.clickSubscription) {
      this.clickSubscription();
    }
  }

  // Aggiorna il contatore delle notifiche non lette
  private updateUnreadCount(): void {
    this.unreadCount = this.notifications.filter(n => !n.letta).length;
  }

  // Alterna la visualizzazione delle notifiche
  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.loadNotifications();
    }
  }

  // Marca una notifica come letta
  markAsRead(notification: Notification): void {
    if (!notification.letta) {
      notification.letta = true;
      this.unreadCount--;
      
      // Qui andrebbe la chiamata al servizio per segnare come letta
      // this.notificationService.markAsRead(notification.id).subscribe(...);
      
      // Mostra un toast di conferma
      this.toastService.info('Notifica segnata come letta');
    }
  }

  // Marca tutte le notifiche come lette
  markAllAsRead(): void {
    if (this.unreadCount === 0) return;
    
    const previouslyUnread = this.notifications.filter(n => !n.letta);
    previouslyUnread.forEach(n => n.letta = true);
    this.updateUnreadCount();
    
    // In un'app reale, qui andrebbe una chiamata al servizio
    // this.notificationService.markAllAsRead().subscribe(...);
    
    this.toastService.success('Tutte le notifiche sono state segnate come lette', 'Fatto!');
  }

  // Elimina una notifica
  deleteNotification(notificationId: number, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.updateUnreadCount();
    
    // In un'app reale, qui andrebbe una chiamata al servizio
    // this.notificationService.delete(notificationId).subscribe(...);
    
    this.toastService.info('Notifica eliminata');
  }

  // Pulisce tutte le notifiche già lette
  clearReadNotifications(): void {
    this.notifications = this.notifications.filter(n => !n.letta);
    this.updateUnreadCount();
    
    // In un'app reale, qui andrebbe una chiamata al servizio
    // this.notificationService.clearRead().subscribe(...);
    
    this.toastService.info('Notifiche lette rimosse');
  }

  // Pulisce tutte le notifiche
  clearAll(): void {
    this.notifications = [];
    this.unreadCount = 0;
    
    // In un'app reale, qui andrebbe una chiamata al servizio
    // this.notificationService.clearAll().subscribe(...);
    
    this.toastService.info('Tutte le notifiche sono state rimosse');
  }

  // Funzione di tracciamento per migliorare le prestazioni di *ngFor
  trackByNotificationId(index: number, notification: Notification): number {
    return notification.id;
  }

  // Getter per verificare se ci sono notifiche non lette
  get hasUnreadNotifications(): boolean {
    return this.unreadCount > 0;
  }
}
