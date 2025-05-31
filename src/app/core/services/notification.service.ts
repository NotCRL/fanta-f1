import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ToastService } from './toast.service';

export interface Notification {
  id: number;
  userId: number;
  tipo: string;
  titolo: string;
  messaggio: string;
  letta: boolean;
  data: string;
  link?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;

  constructor(
    private http: HttpClient,
    private toastService: ToastService
  ) {}

  /**
   * Crea una nuova notifica
   */
  createNotification(notification: Omit<Notification, 'id' | 'data' | 'letta'>): Observable<Notification | null> {
    const newNotification: Omit<Notification, 'id'> = {
      ...notification,
      letta: false,
      data: new Date().toISOString()
    };

    return this.http.post<Notification>(this.apiUrl, newNotification).pipe(
      tap(() => {
        // Mostra un toast di successo quando la notifica viene creata
        this.toastService.info(notification.messaggio, notification.titolo);
      }),
      catchError(error => {
        const errorMsg = 'Errore nella creazione della notifica';
        this.toastService.error(errorMsg, 'Errore');
        console.error(errorMsg, error);
        return of(null);
      })
    );
  }

  /**
   * Ottieni una notifica specifica
   */
  getNotification(id: number): Observable<Notification | null> {
    return this.http.get<Notification>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`Errore nel recupero della notifica ${id}:`, error);
        return of(null);
      })
    );
  }

  /**
   * Ottieni tutte le notifiche di un utente
   */
  getUserNotifications(userId: number, unreadOnly: boolean = false): Observable<Notification[]> {
    let url = `${this.apiUrl}?userId=${userId}`;
    if (unreadOnly) {
      url += '&letta=false';
    }
    
    return this.http.get<Notification[]>(url).pipe(
      map(notifications => 
        notifications.sort((a, b) => 
          new Date(b.data).getTime() - new Date(a.data).getTime()
        )
      ),
      catchError(() => {
        console.error(`Errore nel recupero delle notifiche per l'utente ${userId}`);
        return of([]);
      })
    );
  }

  /**
   * Aggiorna una notifica esistente
   */
  updateNotification(notificationId: number, updates: Partial<Omit<Notification, 'id'>>): Observable<boolean> {
    return this.http.patch<Notification>(`${this.apiUrl}/${notificationId}`, updates).pipe(
      map(() => true),
      catchError(error => {
        console.error('Errore nell\'aggiornamento della notifica:', error);
        return of(false);
      })
    );
  }

  /**
   * Segna una notifica come letta
   */
  markAsRead(notificationId: number): Observable<boolean> {
    return this.updateNotification(notificationId, { letta: true });
  }

  /**
   * Segna tutte le notifiche come lette
   */
  markAllAsRead(userId: number): Observable<boolean> {
    return this.getUserNotifications(userId, true).pipe(
      switchMap((notifications: Notification[]) => {
        const updateRequests = notifications.map(notification => 
          this.updateNotification(notification.id, { letta: true })
        );
        
        if (updateRequests.length === 0) {
          return of(true);
        }
        
        return forkJoin(updateRequests).pipe(
          map((results: (boolean | null)[]) => results.every(Boolean))
        );
      }),
      catchError(() => of(false))
    );
  }

  /**
   * Elimina una notifica
   */
  deleteNotification(notificationId: number): Observable<boolean> {
    return this.http.delete(`${this.apiUrl}/${notificationId}`).pipe(
      map(() => true),
      catchError(error => {
        console.error('Errore nell\'eliminazione della notifica:', error);
        return of(false);
      })
    );
  }

  /**
   * Elimina tutte le notifiche di un utente
   */
  clearAllNotifications(userId: number): Observable<boolean> {
    return this.getUserNotifications(userId).pipe(
      switchMap((notifications: Notification[]) => {
        const deleteRequests = notifications.map(notification => 
          this.deleteNotification(notification.id)
        );
        
        if (deleteRequests.length === 0) {
          return of(true);
        }
        
        return forkJoin(deleteRequests).pipe(
          map((results: boolean[]) => results.every(Boolean))
        );
      }),
      catchError(() => of(false))
    );
  }

  /**
   * Elimina tutte le notifiche lette di un utente
   */
  deleteAllRead(userId: number): Observable<boolean> {
    return this.getUserNotifications(userId).pipe(
      switchMap((notifications: Notification[]) => {
        const readNotifications = notifications.filter(n => n.letta);
        const deleteRequests = readNotifications.map(notification =>
          this.deleteNotification(notification.id)
        );
        
        if (deleteRequests.length === 0) {
          return of(true);
        }
        
        return forkJoin(deleteRequests).pipe(
          map((results: boolean[]) => results.every(Boolean))
        );
      }),
      catchError(() => of(false))
    );
  }

  /**
   * Invia una notifica di sistema
   */
  sendSystemNotification(userIds: number[], titolo: string, messaggio: string, link?: string): Observable<boolean> {
    const notifications = userIds.map(userId => ({
      userId,
      tipo: 'sistema',
      titolo,
      messaggio,
      letta: false,
      data: new Date().toISOString(),
      link
    }));

    // Invia una richiesta per ogni notifica
    const requests = notifications.map(notification => 
      this.http.post<Notification>(this.apiUrl, notification)
    );

    return forkJoin(requests).pipe(
      map(() => true),
      catchError(error => {
        console.error('Errore nell\'invio delle notifiche di sistema:', error);
        return of(false);
      })
    );
  }

  /**
   * Invia una notifica di aggiornamento classifica
   */
  sendStandingsUpdate(leagueId: number, message: string): Observable<boolean> {
    // Qui dovresti implementare la logica per ottenere tutti gli ID utente della lega
    // Per ora usiamo un array vuoto come esempio
    const userIds: number[] = [];
    
    return this.sendSystemNotification(
      userIds,
      'Aggiornamento Classifica',
      message,
      `/leagues/${leagueId}/standings`
    );
  }
}
