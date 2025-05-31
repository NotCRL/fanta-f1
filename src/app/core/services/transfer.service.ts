import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TeamService } from './team.service';
import { FantasyDriverService } from './fantasy-driver.service';
import { NotificationService } from './notification.service';

interface Transfer {
  id: number;
  leagueId: number;
  tipo: 'acquisto' | 'vendita' | 'scambio';
  stato: 'in_attesa' | 'approvato' | 'rifiutato' | 'completato' | 'fallito';
  teamId: number;
  driverId: number;
  importo: number;
  data: string;
  approvatoDa: number[];
  richiedeApprovazione: boolean;
  dettagliScambio?: {
    team2Id: number;
    driver2Id: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class TransferService {
  private apiUrl = `${environment.apiUrl}/transfers`;

  constructor(
    private http: HttpClient,
    @Inject(TeamService) private teamService: TeamService,
    @Inject(FantasyDriverService) private fantasyDriverService: FantasyDriverService,
    @Inject(NotificationService) private notificationService: NotificationService
  ) {}

  /**
   * Crea una nuova richiesta di trasferimento
   */
  createTransfer(transfer: Omit<Transfer, 'id' | 'stato' | 'data' | 'approvatoDa'>): Observable<Transfer | null> {
    const newTransfer: Omit<Transfer, 'id'> = {
      ...transfer,
      stato: 'in_attesa',
      data: new Date().toISOString(),
      approvatoDa: []
    };

    return this.http.post<Transfer>(this.apiUrl, newTransfer).pipe(
      catchError(error => {
        console.error('Errore nella creazione della richiesta di trasferimento:', error);
        return of(null);
      })
    );
  }

  /**
   * Ottieni tutti i trasferimenti di una lega
   */
  getTransfersByLeague(leagueId: number): Observable<Transfer[]> {
    return this.http.get<Transfer[]>(`${this.apiUrl}?leagueId=${leagueId}`).pipe(
      map(transfers => 
        transfers.sort((a, b) => 
          new Date(b.data).getTime() - new Date(a.data).getTime()
        )
      ),
      catchError(() => {
        console.error(`Errore nel recupero dei trasferimenti per la lega ${leagueId}`);
        return of([]);
      })
    );
  }

  /**
   * Ottieni tutti i trasferimenti di una squadra
   */
  getTransfersByTeam(teamId: number): Observable<Transfer[]> {
    return this.http.get<Transfer[]>(`${this.apiUrl}?teamId=${teamId}`).pipe(
      map(transfers => 
        transfers.sort((a, b) => 
          new Date(b.data).getTime() - new Date(a.data).getTime()
        )
      ),
      catchError(() => {
        console.error(`Errore nel recupero dei trasferimenti per il team ${teamId}`);
        return of([]);
      })
    );
  }

  /**
   * Approva una richiesta di trasferimento
   */
  approveTransfer(transferId: number, adminId: number): Observable<boolean> {
    return this.getTransfer(transferId).pipe(
      switchMap(transfer => {
        if (!transfer) return of(false);

        // Verifica se il trasferimento è già stato approvato da questo admin
        if (transfer.approvatoDa.includes(adminId)) {
          return of(true); // Già approvato
        }

        // Aggiorna la lista degli approvatori
        const updatedApprovals = [...transfer.approvatoDa, adminId];
        
        // Se non richiede ulteriori approvazioni o ha abbastanza approvazioni, completa il trasferimento
        if (!transfer.richiedeApprovazione || updatedApprovals.length >= this.getRequiredApprovals(transfer.leagueId)) {
          return this.completeTransfer(transferId);
        }

        // Altrimenti, aggiorna solo gli approvatori
        return this.updateTransfer(transferId, { approvatoDa: updatedApprovals });
      }),
      catchError(error => {
        console.error('Errore nell\'approvazione del trasferimento:', error);
        return of(false);
      })
    );
  }

  /**
   * Rifiuta una richiesta di trasferimento
   */
  rejectTransfer(transferId: number): Observable<boolean> {
    return this.updateTransfer(transferId, { stato: 'rifiutato' });
  }

  /**
   * Completa un trasferimento approvato
   */
  private completeTransfer(transferId: number): Observable<boolean> {
    return this.getTransfer(transferId).pipe(
      switchMap(transfer => {
        if (!transfer || transfer.stato !== 'in_attesa') {
          return of(false);
        }

        // Aggiorna lo stato a "completato"
        return this.updateTransfer(transferId, { stato: 'completato' }).pipe(
          switchMap(updatedTransfer => {
            if (!updatedTransfer) return of(false);

            // Esegui l'operazione di trasferimento
            switch (transfer.tipo) {
              case 'acquisto':
                return this.processPurchase(transfer);
              case 'vendita':
                return this.processSale(transfer);
              case 'scambio':
                return this.processSwap(transfer);
              default:
                return of(false);
            }
          })
        );
      }),
      catchError(error => {
        console.error('Errore nel completamento del trasferimento:', error);
        return of(false);
      })
    );
  }

  /**
   * Elabora un acquisto di un pilota
   */
  private processPurchase(transfer: any): Observable<boolean> {
    return forkJoin([
      this.teamService.getTeam(transfer.teamId),
      this.fantasyDriverService.getDriverDetails(transfer.driverId)
    ]).pipe(
      switchMap(([team, driver]: [any, any]) => {
        if (!team || !driver) {
          return of(false);
        }

        // Verifica che la squadra abbia abbastanza budget
        if (team.budget < transfer.importo) {
          return of(false);
        }

        // Sottrai il costo dal budget della squadra
        return this.teamService.updateTeamBudget(transfer.teamId, transfer.importo, 'subtract').pipe(
          switchMap(() => {
            // Aggiungi il pilota alla squadra
            return this.fantasyDriverService.addDriverToTeam(
              transfer.teamId,
              transfer.driverId,
              transfer.importo,
              true // Imposta come titolare
            ).pipe(
              map(addedDriver => {
                if (!addedDriver) {
                  // Se non è stato possibile aggiungere il pilota, ripristina il budget
                  this.teamService.updateTeamBudget(transfer.teamId, transfer.importo, 'add').subscribe();
                  return false;
                }
                return true;
              })
            );
          })
        );
      })
    ) as Observable<boolean>;
  }

  /**
   * Elabora una vendita di un pilota
   */
  private processSale(transfer: any): Observable<boolean> {
    return this.fantasyDriverService.getDriversByTeam(transfer.teamId).pipe(
      switchMap(drivers => {
        const driverToSell = drivers.find(d => d.driverId === transfer.driverId);
        if (!driverToSell) return of(false);

        // Rimuovi il pilota dalla squadra
        return this.fantasyDriverService.removeDriverFromTeam(driverToSell.id).pipe(
          switchMap(() => {
            // Aggiungi il ricavato al budget della squadra
            return this.teamService.updateTeamBudget(transfer.teamId, transfer.importo, 'add');
          })
        );
      })
    );
  }

  /**
   * Elabora uno scambio di piloti tra due squadre
   */
  private processSwap(transfer: any): Observable<boolean> {
    // Ottieni i dettagli di entrambi i piloti coinvolti nello scambio
    return forkJoin([
      this.teamService.getTeam(transfer.teamId),
      this.teamService.getTeam(transfer.team2Id),
      this.fantasyDriverService.getDriverDetails(transfer.driverId),
      this.fantasyDriverService.getDriverDetails(transfer.driver2Id)
    ]).pipe(
      switchMap(([team1, team2, driver1, driver2]: [any, any, any, any]) => {
        if (!team1 || !team2 || !driver1 || !driver2) {
          return of(false);
        }

        // Verifica che i piloti appartengano alle squadre corrette
        if (driver1.teamId !== team1.id || driver2.teamId !== team2.id) {
          return of(false);
        }

        // Calcola la differenza di valore tra i piloti
        const valueDifference = driver1.valoreAttuale - driver2.valoreAttuale;
        const budgetAdjustment = Math.abs(valueDifference);

        // Verifica che il team che riceve il pilota di valore più alto abbia abbastanza budget
        if (valueDifference > 0 && team2.budget < budgetAdjustment) {
          return of(false); // Team 2 non ha abbastanza budget
        } else if (valueDifference < 0 && team1.budget < budgetAdjustment) {
          return of(false); // Team 1 non ha abbastanza budget
        }

        // Prepara gli aggiornamenti per entrambe le squadre
        const team1Update = this.teamService.updateTeam(team1.id, {
          budget: team1.budget + (valueDifference > 0 ? 0 : budgetAdjustment) - (valueDifference < 0 ? budgetAdjustment : 0)
        });

        const team2Update = this.teamService.updateTeam(team2.id, {
          budget: team2.budget - (valueDifference > 0 ? budgetAdjustment : 0) + (valueDifference < 0 ? 0 : budgetAdjustment)
        });

        // Aggiorna i team e poi scambia i piloti
        return forkJoin([team1Update, team2Update]).pipe(
          switchMap(() => {
            // Rimuovi i piloti dalle rispettive squadre
            return forkJoin([
              this.fantasyDriverService.removeDriverFromTeam(driver1.id),
              this.fantasyDriverService.removeDriverFromTeam(driver2.id)
            ]);
          }),
          switchMap(() => {
            // Aggiungi i piloti alle nuove squadre
            return forkJoin([
              this.fantasyDriverService.addDriverToTeam(team2.id, driver2.driverId, driver2.valoreAttuale, true),
              this.fantasyDriverService.addDriverToTeam(team1.id, driver1.driverId, driver1.valoreAttuale, true)
            ]);
          }),
          map(() => true),
          catchError(() => of(false))
        );
      })
    ) as Observable<boolean>;
  }

  /**
   * Ottieni i dettagli di un trasferimento
   */
  private getTransfer(transferId: number): Observable<Transfer | null> {
    return this.http.get<Transfer>(`${this.apiUrl}/${transferId}`).pipe(
      catchError(() => {
        console.error(`Errore nel recupero del trasferimento ${transferId}`);
        return of(null);
      })
    );
  }

  /**
   * Aggiorna un trasferimento esistente
   */
  private updateTransfer(transferId: number, updates: Partial<Transfer>): Observable<boolean> {
    return this.http.patch<Transfer>(`${this.apiUrl}/${transferId}`, updates).pipe(
      map(() => true),
      catchError(error => {
        console.error('Errore nell\'aggiornamento del trasferimento:', error);
        return of(false);
      })
    );
  }

  /**
   * Calcola il numero di approvazioni richieste per una lega
   */
  private getRequiredApprovals(leagueId: number): number {
    // Implementa la logica per determinare il numero di approvazioni richieste
    // Ad esempio, potrebbe essere basato sul numero di squadre nella lega
    return 1; // Per ora restituiamo 1 come valore predefinito
  }

  /**
   * Richiedi un trasferimento di un pilota
   */
  requestTransfer(
    leagueId: number,
    teamId: number,
    driverId: number,
    amount: number,
    type: 'acquisto' | 'vendita' | 'scambio',
    targetTeamId?: number,
    targetDriverId?: number
  ): Observable<boolean> {
    const transferData: Omit<Transfer, 'id' | 'stato' | 'data' | 'approvatoDa'> = {
      leagueId,
      teamId,
      driverId,
      importo: amount,
      tipo: type,
      richiedeApprovazione: type !== 'acquisto', // Solo gli acquisti non richiedono approvazione
      ...(type === 'scambio' && targetTeamId && targetDriverId ? {
        dettagliScambio: {
          team2Id: targetTeamId,
          driver2Id: targetDriverId
        }
      } : {})
    };

    return this.createTransfer(transferData).pipe(
      switchMap(transfer => {
        if (!transfer) return of(false);

        // Invia notifiche agli amministratori se richiesto
        if (transfer.richiedeApprovazione) {
          // Qui dovresti implementare la logica per inviare notifiche agli amministratori
          // Per ora restituiamo true
          return of(true);
        }

        return of(true);
      })
    );
  }
}
