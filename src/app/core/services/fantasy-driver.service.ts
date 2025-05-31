import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DriverService } from '../../modules/services/driver.service';
import { TeamService } from './team.service';

export interface FantasyDriver {
  id: number;
  teamId: number;
  driverId: number;
  isTitolare: boolean;
  acquistatoPer: number;
  valoreAttuale: number;
  puntiTotali: number;
  puntiUltimaGara: number;
  vittorie: number;
  podi: number;
  puntiPolePosition: number;
  puntiGiroVeloce: number;
  dataAcquisto: string;
  // Dati aggiuntivi dal pilota reale (popolati al volo)
  driverDetails?: {
    name: string;
    teamName: string;
    number: number;
    country: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class FantasyDriverService {
  private apiUrl = `${environment.apiUrl}/fantasyTeamDrivers`;

  constructor(
    private http: HttpClient,
    @Inject(DriverService) private driverService: DriverService,
    @Inject(TeamService) private teamService: TeamService
  ) {}

  /**
   * Aggiunge un pilota a una squadra
   */
  addDriverToTeam(teamId: number, driverId: number, acquistatoPer: number, isTitolare: boolean): Observable<FantasyDriver | null> {
    const newDriver: Omit<FantasyDriver, 'id'> = {
      teamId,
      driverId,
      isTitolare,
      acquistatoPer,
      valoreAttuale: acquistatoPer, // All'inizio il valore è uguale al prezzo di acquisto
      puntiTotali: 0,
      puntiUltimaGara: 0,
      vittorie: 0,
      podi: 0,
      puntiPolePosition: 0,
      puntiGiroVeloce: 0,
      dataAcquisto: new Date().toISOString()
    };

    return this.http.post<FantasyDriver>(this.apiUrl, newDriver).pipe(
      catchError(error => {
        console.error('Errore nell\'aggiunta del pilota alla squadra:', error);
        return of(null);
      })
    );
  }

  /**
   * Rimuove un pilota da una squadra
   */
  removeDriverFromTeam(fantasyDriverId: number): Observable<boolean> {
    return this.http.delete(`${this.apiUrl}/${fantasyDriverId}`).pipe(
      map(() => true),
      catchError(error => {
        console.error('Errore nella rimozione del pilota dalla squadra:', error);
        return of(false);
      })
    );
  }

  /**
   * Aggiorna lo stato di un pilota (es. titolare/riserva)
   */
  updateDriverStatus(fantasyDriverId: number, updates: Partial<FantasyDriver>): Observable<FantasyDriver | null> {
    return this.http.patch<FantasyDriver>(`${this.apiUrl}/${fantasyDriverId}`, updates).pipe(
      catchError(error => {
        console.error('Errore nell\'aggiornamento dello stato del pilota:', error);
        return of(null);
      })
    );
  }

  /**
   * Ottiene i dettagli di un pilota fantasy
   */
  getDriverDetails(fantasyDriverId: number): Observable<FantasyDriver | null> {
    return this.http.get<FantasyDriver>(`${this.apiUrl}/${fantasyDriverId}`).pipe(
      catchError(error => {
        console.error('Errore nel recupero dei dettagli del pilota:', error);
        return of(null);
      })
    );
  }

  /**
   * Ottiene tutti i piloti di una squadra
   */
  getDriversByTeam(teamId: number, includeDetails: boolean = false): Observable<FantasyDriver[]> {
    return this.http.get<FantasyDriver[]>(`${this.apiUrl}?teamId=${teamId}`).pipe(
      switchMap(drivers => {
        if (!includeDetails) {
          return of(drivers);
        }
        
        // Aggiungi i dettagli dei piloti
        return forkJoin(
          drivers.map(driver => 
            this.driverService.getDriverDetails(driver.driverId).pipe(
              map(driverDetails => ({
                ...driver,
                driverDetails: {
                  name: driverDetails?.name,
                  teamName: driverDetails?.team?.name,
                  number: driverDetails?.number,
                  country: driverDetails?.country
                }
              }))
            )
          )
        );
      }),
      catchError(() => {
        console.error(`Errore nel recupero dei piloti del team ${teamId}`);
        return of([]);
      })
    );
  }

  /**
   * Aggiorna i punti di un pilota dopo una gara
   */
  updateDriverPoints(
    fantasyDriverId: number, 
    pointsToAdd: number, 
    isPolePosition: boolean = false, 
    isFastestLap: boolean = false,
    isPodium: boolean = false,
    isWin: boolean = false
  ): Observable<boolean> {
    return this.http.get<FantasyDriver>(`${this.apiUrl}/${fantasyDriverId}`).pipe(
      switchMap(driver => {
        if (!driver) return of(false);
        
        const updates: Partial<FantasyDriver> = {
          puntiTotali: driver.puntiTotali + pointsToAdd,
          puntiUltimaGara: pointsToAdd,
          puntiPolePosition: isPolePosition ? driver.puntiPolePosition + 1 : driver.puntiPolePosition,
          puntiGiroVeloce: isFastestLap ? driver.puntiGiroVeloce + 1 : driver.puntiGiroVeloce,
          podi: isPodium ? driver.podi + 1 : driver.podi,
          vittorie: isWin ? driver.vittorie + 1 : driver.vittorie
        };
        
        // Aggiorna anche il valore del pilota in base alle prestazioni
        updates.valoreAttuale = this.calculateNewValue(driver, updates);
        
        return this.updateDriverStatus(fantasyDriverId, updates).pipe(
          map(updatedDriver => !!updatedDriver)
        );
      }),
      catchError(error => {
        console.error('Errore nell\'aggiornamento dei punti del pilota:', error);
        return of(false);
      })
    );
  }

  /**
   * Calcola il nuovo valore di un pilota in base alle prestazioni
   */
  private calculateNewValue(driver: FantasyDriver, updates: Partial<FantasyDriver>): number {
    // Esempio di logica per il ricalcolo del valore
    let newValue = driver.valoreAttuale;
    
    // Aumenta il valore in base ai punti fatti nell'ultima gara
    if (updates.puntiUltimaGara && updates.puntiUltimaGara > 0) {
      newValue += Math.floor(updates.puntiUltimaGara * 0.1); // +10% dei punti fatti
    }
    
    // Bonus per vittorie e podi
    if (updates.vittorie && updates.vittorie > driver.vittorie) {
      newValue += 5; // +5 per ogni vittoria
    } else if (updates.podi && updates.podi > driver.podi) {
      newValue += 2; // +2 per ogni podio
    }
    
    // Il valore non può scendere sotto l'80% del prezzo di acquisto
    const minValue = driver.acquistatoPer * 0.8;
    return Math.max(minValue, newValue);
  }

  /**
   * Scambia due piloti tra di loro (es. titolare con riserva)
   */
  swapDrivers(teamId: number, driver1Id: number, driver2Id: number): Observable<boolean> {
    return forkJoin([
      this.http.get<FantasyDriver>(`${this.apiUrl}/${driver1Id}`),
      this.http.get<FantasyDriver>(`${this.apiUrl}/${driver2Id}`)
    ]).pipe(
      switchMap(([driver1, driver2]) => {
        if (!driver1 || !driver2 || driver1.teamId !== teamId || driver2.teamId !== teamId) {
          return of(false);
        }
        
        // Scambia lo stato tra i due piloti
        const driver1Updates = { isTitolare: driver2.isTitolare };
        const driver2Updates = { isTitolare: driver1.isTitolare };
        
        return forkJoin([
          this.updateDriverStatus(driver1Id, driver1Updates),
          this.updateDriverStatus(driver2Id, driver2Updates)
        ]).pipe(
          map(([updated1, updated2]) => !!updated1 && !!updated2)
        );
      }),
      catchError(error => {
        console.error('Errore nello scambio dei piloti:', error);
        return of(false);
      })
    );
  }
}
