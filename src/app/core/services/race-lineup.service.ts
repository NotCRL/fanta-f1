import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { FantasyDriverService } from './fantasy-driver.service';
import { TeamService } from './team.service';

interface RaceLineup {
  id: number;
  teamId: number;
  raceId: number;
  pilotiTitolari: number[]; // Array di fantasyDriverId
  pilotiRiserva: number[]; // Array di fantasyDriverId (max 1)
  puntiTotali: number;
  bonusPilotaDelGiorno: boolean;
  bonusCostruttoreDelGiorno: boolean;
  dataConferma: string;
  ultimaModifica: string;
}

@Injectable({
  providedIn: 'root'
})
export class RaceLineupService {
  private apiUrl = `${environment.apiUrl}/raceLineups`;

  constructor(
    private http: HttpClient,
    @Inject(FantasyDriverService) private fantasyDriverService: FantasyDriverService,
    @Inject(TeamService) private teamService: TeamService
  ) {}

  /**
   * Crea una nuova formazione per una gara
   */
  createLineup(teamId: number, raceId: number, titolari: number[], riserve: number[] = []): Observable<RaceLineup | null> {
    if (titolari.length === 0) {
      console.error('Devi selezionare almeno un pilota titolare');
      return of(null);
    }

    const newLineup: Omit<RaceLineup, 'id'> = {
      teamId,
      raceId,
      pilotiTitolari: [...titolari],
      pilotiRiserva: [...riserve],
      puntiTotali: 0,
      bonusPilotaDelGiorno: false,
      bonusCostruttoreDelGiorno: false,
      dataConferma: new Date().toISOString(),
      ultimaModifica: new Date().toISOString()
    };

    return this.http.post<RaceLineup>(this.apiUrl, newLineup).pipe(
      catchError(error => {
        console.error('Errore nella creazione della formazione:', error);
        return of(null);
      })
    );
  }

  /**
   * Aggiorna una formazione esistente
   */
  updateLineup(
    lineupId: number, 
    updates: Partial<Omit<RaceLineup, 'id' | 'teamId' | 'raceId' | 'dataConferma'>>
  ): Observable<RaceLineup | null> {
    // Aggiorna la data di modifica
    const updatedData = {
      ...updates,
      ultimaModifica: new Date().toISOString()
    };

    return this.http.patch<RaceLineup>(`${this.apiUrl}/${lineupId}`, updatedData).pipe(
      catchError(error => {
        console.error('Errore nell\'aggiornamento della formazione:', error);
        return of(null);
      })
    );
  }

  /**
   * Ottieni la formazione di una squadra per una specifica gara
   */
  getTeamLineup(teamId: number, raceId: number): Observable<RaceLineup | null> {
    return this.http.get<RaceLineup[]>(`${this.apiUrl}/lineups?teamId=${teamId}&raceId=${raceId}`).pipe(
      map((lineups: RaceLineup[]) => lineups[0] || null),
      catchError(() => of(null))
    );
  }

  /**
   * Conferma o aggiorna una formazione per una gara
   */
  confirmLineup(teamId: number, raceId: number, titolari: number[], riserve: number[] = []): Observable<boolean> {
    // Verifica che i piloti selezionati appartengano alla squadra
    return this.fantasyDriverService.getDriversByTeam(teamId).pipe(
      switchMap((drivers: any[]) => {
        const driverIds = drivers.map(d => d.id);
        const allSelected = [...titolari, ...riserve];
        
        // Verifica che tutti i piloti selezionati appartengano alla squadra
        const invalidDrivers = allSelected.filter(id => !driverIds.includes(id));
        if (invalidDrivers.length > 0) {
          console.error('Alcuni piloti selezionati non appartengono alla squadra');
          return of(false);
        }

        // Cerca una formazione esistente
        return this.getTeamLineup(teamId, raceId).pipe(
          switchMap(existingLineup => {
            if (existingLineup) {
              // Aggiorna la formazione esistente
              return this.updateLineup(existingLineup.id, {
                pilotiTitolari: [...titolari],
                pilotiRiserva: [...riserve],
                ultimaModifica: new Date().toISOString()
              });
            } else {
              // Crea una nuova formazione
              return this.createLineup(teamId, raceId, titolari, riserve);
            }
          }),
          map(result => !!result)
        );
      }),
      catchError(error => {
        console.error('Errore nella conferma della formazione:', error);
        return of(false);
      })
    );
  }

  /**
   * Sostituisci un pilota durante la gara
   */
  substituteDriver(
    lineupId: number, 
    driverOutId: number, 
    driverInId: number, 
    isTitolare: boolean
  ): Observable<boolean> {
    return this.http.get<RaceLineup>(`${this.apiUrl}/${lineupId}`).pipe(
      switchMap(lineup => {
        if (!lineup) return of(false);

        let updatedLineup = { ...lineup };
        
        if (isTitolare) {
          // Sostituzione tra titolari e riserve
          const titolareIndex = lineup.pilotiTitolari.indexOf(driverOutId);
          if (titolareIndex === -1) return of(false);
          
          updatedLineup.pilotiTitolari = [...lineup.pilotiTitolari];
          updatedLineup.pilotiTitolari[titolareIndex] = driverInId;
          
          // Rimuovi il pilota dai riserve se presente
          updatedLineup.pilotiRiserva = lineup.pilotiRiserva.filter(id => id !== driverInId);
          
          // Aggiungi il pilota sostituito ai riserve
          updatedLineup.pilotiRiserva.push(driverOutId);
        } else {
          // Sostituzione tra riserve (se necessario)
          const riservaIndex = lineup.pilotiRiserva.indexOf(driverOutId);
          if (riservaIndex === -1) return of(false);
          
          updatedLineup.pilotiRiserva = [...lineup.pilotiRiserva];
          updatedLineup.pilotiRiserva[riservaIndex] = driverInId;
        }

        return this.updateLineup(lineupId, updatedLineup).pipe(
          map(result => !!result)
        );
      }),
      catchError(error => {
        console.error('Errore nella sostituzione del pilota:', error);
        return of(false);
      })
    );
  }

  /**
   * Calcola i punti per una formazione in base ai risultati della gara
   */
  calculatePoints(lineup: RaceLineup, raceResults: { drivers: Array<{ id: number; punti?: number; polePosition?: boolean; fastestLap?: boolean }> }): number {
    if (!lineup || !raceResults) return 0;
    
    let points = 0;
    
    // Punti per i piloti titolari
    lineup.pilotiTitolari.forEach(driverId => {
      const driver = raceResults.drivers.find(d => d.id === driverId);
      if (driver) {
        points += driver.punti || 0;
        if (driver.polePosition) points += 2;
        if (driver.fastestLap) points += 1;
      }
    });
    
    // Punti per i piloti riserve (sostituti)
    lineup.pilotiRiserva.forEach(driverId => {
      const driver = raceResults.drivers.find(d => d.id === driverId);
      if (driver) {
        points += (driver.punti || 0) * 0.5; // Metà punti per i riserve
      }
    });
    
    return points;
  }

  /**
   * Verifica se una formazione è valida per la gara
   */
  validateLineup(teamId: number, raceId: number): Observable<{ valid: boolean; message: string }> {
    return this.getTeamLineup(teamId, raceId).pipe(
      switchMap(lineup => {
        if (!lineup) {
          return of({
            valid: false,
            message: 'Nessuna formazione trovata per questa gara'
          });
        }

        // Verifica che ci sia almeno un pilota titolare
        if (lineup.pilotiTitolari.length === 0) {
          return of({
            valid: false,
            message: 'Devi selezionare almeno un pilota titolare'
          });
        }

        // Verifica che i piloti selezionati appartengano alla squadra
        return this.fantasyDriverService.getDriversByTeam(teamId).pipe(
          map(drivers => {
            const driverIds = drivers.map(d => d.id);
            const allSelected = [...lineup.pilotiTitolari, ...(lineup.pilotiRiserva || [])];
            
            // Verifica che tutti i piloti selezionati appartengano alla squadra
            const invalidDrivers = allSelected.filter(id => !driverIds.includes(id));
            if (invalidDrivers.length > 0) {
              return {
                valid: false,
                message: `Alcuni piloti selezionati non appartengono alla tua squadra`
              };
            }

            // Tutto ok
            return {
              valid: true,
              message: 'Formazione valida'
            };
          })
        );
      }),
      catchError(error => {
        console.error('Errore nella validazione della formazione:', error);
        return of({
          valid: false,
          message: 'Si è verificato un errore durante la validazione della formazione'
        });
      })
    );
  }
}
