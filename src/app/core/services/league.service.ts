import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface League {
  id: number;
  name: string;
  description: string;
  maxTeams: number;
  budgetIniziale: number;
  adminId: number;
  isPrivate: boolean;
  inviteCode: string;
  stato: 'draft' | 'in_corso' | 'concluso';
  regole: {
    puntiPolePosition: number;
    puntiGiroVeloce: number;
    puntiPoleSprint: number;
    puntiPodioSprint: number[];
    puntiPosizioneGara: number[];
    puntiGiroVeloceGara: number;
    bonusPoleELapida: number;
    bonusPilotaDelGiorno: number;
    bonusCostruttoreDelGiorno: number;
    sosteObbligatorie: boolean;
    danniMeccanici: boolean;
    sanzioni: boolean;
  };
  createdAt: string;
  inizioCampionato: string;
  fineCampionato: string;
}

@Injectable({
  providedIn: 'root'
})
export class LeagueService {
  private apiUrl = `${environment.apiUrl}/fantasyLeagues`;

  constructor(private http: HttpClient) { }

  /**
   * Ottiene tutte le leghe disponibili
   */
  getLeagues(): Observable<League[]> {
    return this.http.get<League[]>(this.apiUrl).pipe(
      catchError((error) => {
        console.error('Errore nel recupero delle leghe:', error);
        return of([]);
      })
    );
  }

  /**
   * Ottiene le leghe a cui partecipa l'utente corrente
   */
  getUserLeagues(userId: number): Observable<League[]> {
    return this.http.get<League[]>(`${this.apiUrl}/user/${userId}`).pipe(
      catchError((error) => {
        console.error('Errore nel recupero delle leghe dell\'utente:', error);
        return of([]);
      })
    );
  }

  /**
   * Ottiene i dettagli di una singola lega
   */
  getLeagueDetails(leagueId: number): Observable<League | null> {
    return this.http.get<League>(`${this.apiUrl}/${leagueId}`).pipe(
      catchError((error) => {
        console.error(`Errore nel recupero della lega ${leagueId}:`, error);
        return of(null);
      })
    );
  }

  /**
   * Ottiene una lega specifica
   * @param id ID della lega
   */
  getLeague(id: number): Observable<League | null> {
    return this.getLeagueDetails(id); // Usa il metodo esistente
  }

  /**
   * Crea una nuova lega
   * @param league Dati della lega
   */
  createLeague(league: Omit<League, 'id' | 'createdAt' | 'inviteCode'>): Observable<League | null> {
    // Genera un codice invito casuale
    const inviteCode = `F1-${Date.now().toString(36).toUpperCase()}`;
    const newLeague = {
      ...league,
      id: Date.now(), // ID temporaneo, verrà sovrascritto dal server
      inviteCode,
      createdAt: new Date().toISOString(),
      stato: 'draft' as const
    };

    return this.http.post<League>(this.apiUrl, newLeague).pipe(
      catchError(error => {
        console.error('Errore nella creazione della lega:', error);
        return of(null);
      })
    );
  }

  /**
   * Aggiorna una lega esistente
   * @param id ID della lega
   * @param updates Campi da aggiornare
   */
  updateLeague(id: number, updates: Partial<League>): Observable<League | null> {
    return this.http.patch<League>(`${this.apiUrl}/${id}`, updates).pipe(
      catchError(error => {
        console.error(`Errore nell'aggiornamento della lega ${id}:`, error);
        return of(null);
      })
    );
  }

  /**
   * Partecipa a una lega tramite codice invito
   * @param inviteCode Codice invito
   * @param userId ID dell'utente
   */
  joinLeague(inviteCode: string, userId: number): Observable<boolean> {
    return this.http.get<League[]>(`${this.apiUrl}?inviteCode=${inviteCode}`).pipe(
      map(leagues => {
        if (leagues.length === 0) {
          throw new Error('Codice invito non valido');
        }
        const league = leagues[0];
        // Qui dovresti implementare la logica per aggiungere l'utente alla lega
        // utilizzando il servizio LeagueMembersService
        return true;
      }),
      catchError(error => {
        console.error('Errore durante la partecipazione alla lega:', error);
        return of(false);
      })
    );
  }

  /**
   * Avvia il campionato
   * @param leagueId ID della lega
   */
  startChampionship(leagueId: number): Observable<boolean> {
    return this.updateLeague(leagueId, { stato: 'in_corso' }).pipe(
      map(league => !!league)
    );
  }

  /**
   * Termina il campionato
   * @param leagueId ID della lega
   */
  endChampionship(leagueId: number): Observable<boolean> {
    return this.updateLeague(leagueId, { stato: 'concluso' }).pipe(
      map(league => !!league)
    );
  }
}
