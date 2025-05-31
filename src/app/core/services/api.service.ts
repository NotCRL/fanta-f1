import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, map, switchMap, forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: number;
  username: string;
  password: string;
  role: string;
  email: string;
  createdAt?: string;
}

export interface Team {
  id: number;
  name: string;
  base?: string;
  teamChief?: string;
  championships?: number;
  points: number;
  color: string;
  logo?: string;
}

export interface Driver {
  id: number;
  name: string;
  teamId: number;
  number: number;
  country?: string;
  podiums?: number;
  points: number;
  worldChampionships?: number;
  highestRaceFinish?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  image?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Metodi per gli utenti
  login(username: string, password: string): Observable<User | null> {
    return this.http.get<User[]>(
      `${this.apiUrl}/users?username=${username}&password=${password}`
    ).pipe(
      map(users => users.length > 0 ? users[0] : null),
      catchError(() => of(null))
    );
  }

  register(username: string, email: string, password: string): Observable<User | null> {
    // Prima verifichiamo se l'utente esiste già
    return this.http.get<User[]>(
      `${this.apiUrl}/users?username=${username}&email=${email}`
    ).pipe(
      switchMap(users => {
        if (users.length > 0) {
          // Utente già esistente
          return of(null);
        }
        
        // Crea un nuovo utente
        const newUser: User = {
          id: 0, // L'ID verrà generato automaticamente da json-server
          username,
          email,
          password,
          role: 'user',
          createdAt: new Date().toISOString()
        };
        
        // Effettua la richiesta POST per creare il nuovo utente
        return this.http.post<User>(`${this.apiUrl}/users`, newUser);
      }),
      catchError(() => of(null))
    );
  }

  getUserById(id: number): Observable<User | undefined> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`).pipe(
      catchError(() => of(undefined))
    );
  }

  // Metodi per i team
  getTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(`${this.apiUrl}/teams`).pipe(
      catchError(() => of([]))
    );
  }

  getTeamById(id: number): Observable<Team | undefined> {
    return this.http.get<Team>(`${this.apiUrl}/teams/${id}`).pipe(
      catchError(() => of(undefined))
    );
  }

  // Metodi per i piloti
  getDrivers(): Observable<Driver[]> {
    return this.http.get<Driver[]>(`${this.apiUrl}/drivers`).pipe(
      catchError(() => of([]))
    );
  }

  getDriverById(id: number): Observable<Driver | undefined> {
    return this.http.get<Driver>(`${this.apiUrl}/drivers/${id}`).pipe(
      catchError(() => of(undefined))
    );
  }

  getDriversByTeam(teamId: number): Observable<Driver[]> {
    return this.http.get<Driver[]>(`${this.apiUrl}/drivers?teamId=${teamId}`).pipe(
      catchError(() => of([]))
    );
  }

  // Metodi per il calcolo dei punti
  getTotalPointsForTeam(teamId: number): Observable<number> {
    return this.getDriversByTeam(teamId).pipe(
      map(drivers => drivers.reduce((sum, driver) => sum + (driver.points || 0), 0)),
      catchError(() => of(0))
    );
  }

  getTeamStandings(): Observable<{team: Team, points: number}[]> {
    return this.getTeams().pipe(
      switchMap(teams => {
        const teamObservables = teams.map(team => 
          this.getTotalPointsForTeam(team.id).pipe(
            map(points => ({ team, points }))
          )
        );
        return teamObservables.length > 0 ? forkJoin(teamObservables) : of([]);
      }),
      map(standings => {
        // Ordina in base ai punti (dal più alto al più basso)
        return [...standings].sort((a, b) => b.points - a.points);
      }),
      catchError(() => of([]))
    );
  }

  updateDriverPoints(driverId: number, points: number): Observable<Driver | undefined> {
    return this.http.patch<Driver>(`${this.apiUrl}/drivers/${driverId}`, { points }).pipe(
      catchError(() => of(undefined))
    );
  }

  private updateTeamPoints(teamId: number): void {
    this.getTotalPointsForTeam(teamId).subscribe(points => {
      this.http.patch<Team>(`${this.apiUrl}/teams/${teamId}`, { points }).subscribe();
    });
  }
}
