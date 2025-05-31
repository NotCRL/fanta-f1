import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export interface User {
  id: number;
  username: string;
  password: string;
  role: string;
  email: string;
}

export interface Team {
  id: number;
  name: string;
  points: number;
  color: string;
}

export interface Driver {
  id: number;
  name: string;
  teamId: number;
  points: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private users: User[] = [
    { id: 1, username: 'admin', password: 'admin', role: 'admin', email: 'admin@fanta-f1.com' },
    { id: 2, username: 'user', password: 'user', role: 'user', email: 'user@fanta-f1.com' }
  ];
  
  private teams: Team[] = [
    { id: 1, name: 'Mercedes', points: 0, color: '#00D2BE' },
    { id: 2, name: 'Ferrari', points: 0, color: '#DC0000' },
    { id: 3, name: 'Red Bull', points: 0, color: '#0600EF' },
    { id: 4, name: 'McLaren', points: 0, color: '#FF8700' },
    { id: 5, name: 'Aston Martin', points: 0, color: '#006F62' },
    { id: 6, name: 'Alpine', points: 0, color: '#0090FF' },
    { id: 7, name: 'Williams', points: 0, color: '#005AFF' },
    { id: 8, name: 'AlphaTauri', points: 0, color: '#2B4562' },
    { id: 9, name: 'Alfa Romeo', points: 0, color: '#900000' },
    { id: 10, name: 'Haas', points: 0, color: '#FFFFFF' }
  ];

  private drivers: Driver[] = [
    { id: 1, name: 'Lewis Hamilton', teamId: 1, points: 0, number: 44 },
    { id: 2, name: 'George Russell', teamId: 1, points: 0, number: 63 },
    { id: 3, name: 'Charles Leclerc', teamId: 2, points: 0, number: 16 },
    { id: 4, name: 'Carlos Sainz', teamId: 2, points: 0, number: 55 },
    { id: 5, name: 'Max Verstappen', teamId: 3, points: 0, number: 1 },
    { id: 6, name: 'Sergio Perez', teamId: 3, points: 0, number: 11 },
    { id: 7, name: 'Lando Norris', teamId: 4, points: 0, number: 4 },
    { id: 8, name: 'Oscar Piastri', teamId: 4, points: 0, number: 81 },
    { id: 9, name: 'Fernando Alonso', teamId: 5, points: 0, number: 14 },
    { id: 10, name: 'Lance Stroll', teamId: 5, points: 0, number: 18 },
    { id: 11, name: 'Esteban Ocon', teamId: 6, points: 0, number: 31 },
    { id: 12, name: 'Pierre Gasly', teamId: 6, points: 0, number: 10 },
    { id: 13, name: 'Alex Albon', teamId: 7, points: 0, number: 23 },
    { id: 14, name: 'Logan Sargeant', teamId: 7, points: 0, number: 2 },
    { id: 15, name: 'Yuki Tsunoda', teamId: 8, points: 0, number: 22 },
    { id: 16, name: 'Daniel Ricciardo', teamId: 8, points: 0, number: 3 },
    { id: 17, name: 'Valtteri Bottas', teamId: 9, points: 0, number: 77 },
    { id: 18, name: 'Zhou Guanyu', teamId: 9, points: 0, number: 24 },
    { id: 19, name: 'Kevin Magnussen', teamId: 10, points: 0, number: 20 },
    { id: 20, name: 'Nico Hülkenberg', teamId: 10, points: 0, number: 27 }
  ];

  constructor(private http: HttpClient) {}

  // Metodi per gli utenti
  login(username: string, password: string): Observable<User | null> {
    const user = this.users.find(u => u.username === username && u.password === password);
    return of(user || null);
  }

  register(username: string, email: string, password: string): Observable<User | null> {
    // Verifica se l'utente esiste già
    const userExists = this.users.some(u => u.username === username || u.email === email);
    
    if (userExists) {
      return of(null);
    }

    // Crea un nuovo utente
    const newUser: User = {
      id: Math.max(...this.users.map(u => u.id)) + 1,
      username,
      email,
      password,
      role: 'user' // Di default gli utenti registrati avranno ruolo 'user'
    };

    // Aggiungi il nuovo utente all'array
    this.users.push(newUser);
    console.log('[ApiService] New user registered:', newUser);
    
    return of(newUser);
  }

  getUserById(id: number): Observable<User | undefined> {
    const user = this.users.find(u => u.id === id);
    return of(user);
  }

  // Metodi per i team
  getTeams(): Observable<Team[]> {
    return of([...this.teams]);
  }

  getTeam(id: number): Observable<Team | undefined> {
    const team = this.teams.find(t => t.id === id);
    return of(team);
  }

  // Metodi per i piloti
  getDrivers(): Observable<Driver[]> {
    return of([...this.drivers]);
  }

  getDriver(id: number): Observable<Driver | undefined> {
    const driver = this.drivers.find(d => d.id === id);
    return of(driver);
  }


  getDriversByTeam(teamId: number): Observable<Driver[]> {
    const teamDrivers = this.drivers.filter(driver => driver.teamId === teamId);
    return of(teamDrivers);
  }

  // Metodi per aggiornare i dati
  updateDriverPoints(driverId: number, points: number): Observable<Driver | undefined> {
    const driver = this.drivers.find(d => d.id === driverId);
    if (driver) {
      driver.points = points;
      // Aggiorna anche i punti del team
      this.updateTeamPoints(driver.teamId);
    }
    return of(driver);
  }

  private updateTeamPoints(teamId: number): void {
    const teamDrivers = this.drivers.filter(d => d.teamId === teamId);
    const totalPoints = teamDrivers.reduce((sum, driver) => sum + driver.points, 0);
    
    const team = this.teams.find(t => t.id === teamId);
    if (team) {
      team.points = totalPoints;
    }
  }
}
