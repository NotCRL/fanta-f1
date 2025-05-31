import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, interval, timer, BehaviorSubject, forkJoin } from 'rxjs';
import { catchError, map, switchMap, takeUntil, tap, finalize, takeWhile } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TeamService } from './team.service';
import { FantasyDriverService } from './fantasy-driver.service';
import { NotificationService } from './notification.service';

interface Auction {
  id: number;
  leagueId: number;
  driverId: number;
  stato: 'programmata' | 'in_corso' | 'conclusa';
  offertaAttuale: number;
  offerenteAttualeId: number | null;
  dataInizio: string;
  dataFine: string;
  offerte: Array<{
    teamId: number;
    importo: number;
    data: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class AuctionService {
  private apiUrl = `${environment.apiUrl}/auctions`;
  private countdownInterval = 1000; // 1 secondo

  constructor(
    private http: HttpClient,
    @Inject(TeamService) private teamService: TeamService,
    @Inject(FantasyDriverService) private fantasyDriverService: FantasyDriverService,
    @Inject(NotificationService) private notificationService: NotificationService
  ) {}

  /**
   * Crea una nuova asta per un pilota
   */
  createAuction(leagueId: number, driverId: number, startBid: number, durationMinutes: number): Observable<Auction | null> {
    const now = new Date();
    const endTime = new Date(now.getTime() + durationMinutes * 60000);
    
    const newAuction: Omit<Auction, 'id'> = {
      leagueId,
      driverId,
      stato: 'programmata',
      offertaAttuale: startBid,
      offerenteAttualeId: null,
      dataInizio: now.toISOString(),
      dataFine: endTime.toISOString(),
      offerte: []
    };

    return this.http.post<Auction>(this.apiUrl, newAuction).pipe(
      tap(auction => {
        // Avvia il countdown per l'asta
        this.startAuctionCountdown(auction.id);
      }),
      catchError(error => {
        console.error('Errore nella creazione dell\'asta:', error);
        return of(null);
      })
    );
  }

  /**
   * Avvia il countdown per un'asta
   */
  private startAuctionCountdown(auctionId: number): void {
    this.getAuction(auctionId).subscribe(auction => {
      if (!auction) return;

      const endTime = new Date(auction.dataFine).getTime();
      
      interval(this.countdownInterval).pipe(
        takeWhile(() => new Date().getTime() < endTime)
      ).subscribe({
        next: () => {
          // Aggiorna lo stato ogni secondo
          const now = new Date().getTime();
          const timeLeft = endTime - now;
          
          // Se il tempo è scaduto, termina l'asta
          if (timeLeft <= 0) {
            this.endAuction(auctionId).subscribe();
          }
        },
        complete: () => {
          // L'asta è terminata
          this.endAuction(auctionId).subscribe();
        }
      });
    });
  }

  /**
   * Ottieni i dettagli di un'asta
   */
  getAuction(auctionId: number): Observable<Auction | null> {
    return this.http.get<Auction>(`${this.apiUrl}/${auctionId}`).pipe(
      catchError(() => {
        console.error(`Errore nel recupero dell'asta ${auctionId}`);
        return of(null);
      })
    );
  }

  /**
   * Ottieni tutte le aste di una lega
   */
  getAuctionsByLeague(leagueId: number, includeEnded: boolean = false): Observable<Auction[]> {
    return this.http.get<Auction[]>(`${this.apiUrl}?leagueId=${leagueId}`).pipe(
      map(auctions => {
        if (includeEnded) return auctions;
        return auctions.filter(auction => auction.stato !== 'conclusa');
      }),
      catchError(() => {
        console.error(`Errore nel recupero delle aste della lega ${leagueId}`);
        return of([]);
      })
    );
  }

  /**
   * Fai un'offerta per un'asta
   */
  placeBid(auctionId: number, teamId: number, amount: number): Observable<boolean> {
    return forkJoin([
      this.getAuction(auctionId),
      this.teamService.getTeam(teamId)
    ]).pipe(
      switchMap(([auction, team]) => {
        if (!auction || !team || auction.stato !== 'in_corso') {
          return of(false);
        }

        // Verifica che l'offerta sia valida
        if (amount <= auction.offertaAttuale || amount > team.budget) {
          return of(false);
        }

        // Crea la nuova offerta
        const newBid = {
          teamId,
          importo: amount,
          data: new Date().toISOString()
        };

        // Aggiorna l'asta con la nuova offerta
        const updatedAuction: Partial<Auction> = {
          offertaAttuale: amount,
          offerenteAttualeId: teamId,
          offerte: [...(auction.offerte || []), newBid]
        };

        // Notifica gli altri partecipanti
        if (auction.offerenteAttualeId && auction.offerenteAttualeId !== teamId) {
          this.notificationService.createNotification({
            userId: auction.offerenteAttualeId,
            tipo: 'offerta_superata',
            titolo: 'Offerta superata!',
            messaggio: `La tua offerta per il pilota è stata superata da un altro team.`,
            link: `/auction/${auctionId}`
          }).subscribe();
        }

        return this.http.patch<Auction>(`${this.apiUrl}/${auctionId}`, updatedAuction).pipe(
          map(updatedAuction => {
            // Rinnova il countdown se mancano meno di 30 secondi
            const timeLeft = new Date(updatedAuction.dataFine).getTime() - new Date().getTime();
            if (timeLeft < 30000) { // 30 secondi
              const newEndTime = new Date();
              newEndTime.setSeconds(newEndTime.getSeconds() + 30); // Aggiungi 30 secondi
              this.updateAuction(auctionId, { dataFine: newEndTime.toISOString() }).subscribe();
            }
            return true;
          })
        );
      }),
      catchError(error => {
        console.error('Errore durante il piazzamento dell\'offerta:', error);
        return of(false);
      })
    );
  }

  /**
   * Termina un'asta
   */
  endAuction(auctionId: number): Observable<boolean> {
    return this.getAuction(auctionId).pipe(
      switchMap(auction => {
        if (!auction || auction.stato === 'conclusa') {
          return of(false);
        }

        // Se c'è un vincitore, gestisci l'assegnazione del pilota
        if (auction.offerenteAttualeId) {
          return this.teamService.updateTeamBudget(
            auction.offerenteAttualeId, 
            auction.offertaAttuale, 
            'subtract'
          ).pipe(
            switchMap(success => {
              if (!success) return of(false);
              
              // Aggiungi il pilota alla squadra vincitrice
              return this.fantasyDriverService.addDriverToTeam(
                auction.offerenteAttualeId!,
                auction.driverId,
                auction.offertaAttuale,
                true // Imposta come titolare di default
              ).pipe(
                map(driver => !!driver)
              );
            })
          );
        }
        
        return of(true);
      }),
      switchMap(success => {
        if (!success) return of(false);
        
        // Aggiorna lo stato dell'asta a conclusa
        return this.updateAuction(auctionId, { stato: 'conclusa' });
      }),
      catchError(error => {
        console.error('Errore durante la chiusura dell\'asta:', error);
        return of(false);
      })
    );
  }

  /**
   * Aggiorna i dettagli di un'asta
   */
  private updateAuction(auctionId: number, updates: Partial<Auction>): Observable<boolean> {
    return this.http.patch<Auction>(`${this.apiUrl}/${auctionId}`, updates).pipe(
      map(() => true),
      catchError(error => {
        console.error('Errore nell\'aggiornamento dell\'asta:', error);
        return of(false);
      })
    );
  }

  /**
   * Avvia un'asta programmata
   */
  startAuction(auctionId: number): Observable<boolean> {
    return this.getAuction(auctionId).pipe(
      switchMap(auction => {
        if (!auction || auction.stato !== 'programmata') {
          return of(false);
        }

        const now = new Date();
        const endTime = new Date(now.getTime() + 5 * 60000); // 5 minuti di asta
        
        return this.updateAuction(auctionId, {
          stato: 'in_corso',
          dataInizio: now.toISOString(),
          dataFine: endTime.toISOString()
        }).pipe(
          tap(success => {
            if (success) {
              this.startAuctionCountdown(auctionId);
            }
          })
        );
      })
    );
  }
}
