import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DriverStanding {
  position: number;
  points: number;
  wins: number;
  Driver: {
    driverId: string;
    permanentNumber: string;
    code: string;
    url: string;
    givenName: string;
    familyName: string;
    dateOfBirth: string;
    nationality: string;
  };
  Constructors: Array<{
    constructorId: string;
    url: string;
    name: string;
    nationality: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class DriverService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Ottiene la classifica piloti per un determinato anno
   * @param year Anno della stagione (opzionale, se non specificato usa l'anno corrente)
   */
  getDriverStandings(year?: number): Observable<DriverStanding[]> {
    const currentYear = year || new Date().getFullYear();
    
    // Se l'anno richiesto è l'anno corrente, restituisci i dati dal JSON Server
    if (currentYear === new Date().getFullYear()) {
      return this.http.get<DriverStanding[]>(`${this.apiUrl}/driverStandings`).pipe(
        catchError(() => {
          console.error('Errore nel recupero della classifica piloti dal JSON Server');
          return of([]);
        })
      );
    } else {
      // Per gli anni precedenti, potresti voler usare un'API esterna
      // o avere un set di dati storici nel tuo JSON Server
      return this.http.get<DriverStanding[]>(`${this.apiUrl}/driverStandings?year=${currentYear}`).pipe(
        catchError(() => {
          console.error(`Dati non disponibili per l'anno ${currentYear}`);
          return of([]);
        })
      );
    }
  }

  /**
   * Ottiene i dettagli di un pilota specifico
   * @param driverId ID univoco del pilota
   */
  getDriverDetails(driverId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/drivers/${driverId}`).pipe(
      catchError(() => {
        console.error('Errore nel recupero dei dettagli del pilota');
        return of(null);
      })
    );
  }

  /**
   * Aggiorna i punti di un pilota
   * @param driverId ID del pilota
   * @param points Nuovo punteggio
   */
  updateDriverPoints(driverId: number, points: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/drivers/${driverId}`, { points }).pipe(
      catchError(error => {
        console.error('Errore nell\'aggiornamento dei punti del pilota:', error);
        throw error;
      })
    );
  }
}
