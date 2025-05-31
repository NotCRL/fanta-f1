import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface FantasyTeam {
  id: number;
  name: string;
  ownerId: number;
  leagueId: number;
  budget: number;
  puntiTotali: number;
  puntiUltimaGara: number;
  posizioneClassifica: number;
  vittorie: number;
  podi: number;
  puntiPolePosition: number;
  puntiGiroVeloce: number;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private apiUrl = `${environment.apiUrl}/fantasyTeams`;

  constructor(private http: HttpClient) {}

  /**
   * Crea una nuova squadra
   */
  createTeam(team: Omit<FantasyTeam, 'id' | 'createdAt' | 'puntiTotali' | 'puntiUltimaGara' | 'posizioneClassifica' | 'vittorie' | 'podi' | 'puntiPolePosition' | 'puntiGiroVeloce'>): Observable<FantasyTeam | null> {
    const newTeam: FantasyTeam = {
      ...team,
      id: Date.now(), // ID temporaneo
      puntiTotali: 0,
      puntiUltimaGara: 0,
      posizioneClassifica: 0,
      vittorie: 0,
      podi: 0,
      puntiPolePosition: 0,
      puntiGiroVeloce: 0,
      createdAt: new Date().toISOString()
    };

    return this.http.post<FantasyTeam>(this.apiUrl, newTeam).pipe(
      catchError(error => {
        console.error('Errore nella creazione del team:', error);
        return of(null);
      })
    );
  }

  /**
   * Ottiene una squadra per ID
   */
  getTeam(teamId: number): Observable<FantasyTeam | null> {
    return this.http.get<FantasyTeam>(`${this.apiUrl}/${teamId}`).pipe(
      catchError(() => {
        console.error(`Errore nel recupero del team ${teamId}`);
        return of(null);
      })
    );
  }

  /**
   * Aggiorna i dati di una squadra
   */
  updateTeam(teamId: number, updates: Partial<FantasyTeam>): Observable<FantasyTeam | null> {
    return this.http.patch<FantasyTeam>(`${this.apiUrl}/${teamId}`, updates).pipe(
      catchError(error => {
        console.error(`Errore nell'aggiornamento del team ${teamId}:`, error);
        return of(null);
      })
    );
  }

  /**
   * Ottiene tutte le squadre di una lega
   */
  getTeamsByLeague(leagueId: number): Observable<FantasyTeam[]> {
    return this.http.get<FantasyTeam[]>(`${this.apiUrl}?leagueId=${leagueId}`).pipe(
      catchError(() => {
        console.error(`Errore nel recupero delle squadre della lega ${leagueId}`);
        return of([]);
      })
    );
  }

  /**
   * Aggiorna il budget di una squadra
   */
  updateTeamBudget(teamId: number, amount: number, operation: 'add' | 'subtract' = 'subtract'): Observable<boolean> {
    return this.getTeam(teamId).pipe(
      switchMap(team => {
        if (!team) return of(false);
        
        const newBudget = operation === 'add' 
          ? team.budget + amount 
          : team.budget - amount;
        
        if (newBudget < 0) {
          console.error('Budget insufficiente');
          return of(false);
        }
        
        return this.updateTeam(teamId, { budget: newBudget }).pipe(
          map(updatedTeam => !!updatedTeam)
        );
      })
    );
  }

  /**
   * Aggiorna la classifica di una squadra
   */
  updateTeamStandings(teamId: number, pointsToAdd: number, isPodium: boolean, isWin: boolean): Observable<boolean> {
    return this.getTeam(teamId).pipe(
      switchMap(team => {
        if (!team) return of(false);
        
        const updates: Partial<FantasyTeam> = {
          puntiTotali: team.puntiTotali + pointsToAdd,
          puntiUltimaGara: pointsToAdd,
          podi: isPodium ? team.podi + 1 : team.podi,
          vittorie: isWin ? team.vittorie + 1 : team.vittorie
        };
        
        return this.updateTeam(teamId, updates).pipe(
          map(updatedTeam => !!updatedTeam)
        );
      })
    );
  }

  /**
   * Ottieni tutte le squadre di un utente
   */
  getTeamsByUserId(userId: number): Observable<FantasyTeam[]> {
    return this.http.get<FantasyTeam[]>(`${this.apiUrl}?ownerId=${userId}`).pipe(
      catchError(() => {
        console.error(`Errore nel recupero delle squadre per l'utente ${userId}`);
        return of([]);
      })
    );
  }

  /**
   * Calcola la classifica della lega
   */
  calculateLeagueStandings(leagueId: number): Observable<FantasyTeam[]> {
    return this.http.get<FantasyTeam[]>(`${this.apiUrl}?leagueId=${leagueId}`).pipe(
      map(teams => {
        // Ordina le squadre per punti totali (in ordine decrescente)
        return [...teams].sort((a, b) => b.puntiTotali - a.puntiTotali)
          .map((team, index) => ({
            ...team,
            posizioneClassifica: index + 1
          }));
      }),
      catchError(() => {
        console.error(`Errore nel calcolo della classifica per la lega ${leagueId}`);
        return of([]);
      })
    );
  }

  /**
   * Calcola la classifica aggiornata per una lega
   */
  updateLeagueStandings(leagueId: number): Observable<boolean> {
    return this.getTeamsByLeague(leagueId).pipe(
      switchMap(teams => {
        // Ordina le squadre per punti totali (in ordine decrescente)
        const sortedTeams = [...teams].sort((a, b) => b.puntiTotali - a.puntiTotali);
        
        // Prepara gli aggiornamenti per ogni squadra
        const updates = sortedTeams.map((team, index) => {
          return this.updateTeam(team.id, { posizioneClassifica: index + 1 });
        });
        
        return forkJoin(updates).pipe(
          map(() => true),
          catchError(error => {
            console.error('Errore nell\'aggiornamento della classifica:', error);
            return of(false);
          })
        );
      })
    );
  }
}
