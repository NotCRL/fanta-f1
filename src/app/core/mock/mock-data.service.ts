import { Injectable } from '@angular/core';
import { InMemoryDbService } from 'angular-in-memory-web-api';

@Injectable({
  providedIn: 'root'
})
export class MockDataService implements InMemoryDbService {
  createDb() {
    // Dati utenti di esempio
    const users = [
      { id: 1, username: 'admin', password: 'admin', role: 'admin', email: 'admin@fanta-f1.com' },
      { id: 2, username: 'user', password: 'user', role: 'user', email: 'user@fanta-f1.com' }
    ];
    
    // Dati squadre di esempio
    const teams = [
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

    // Dati piloti di esempio
    const drivers = [
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

    return { users, teams, drivers };
  }

  // Override per generare ID in modo incrementale
  genId<T extends { id: number }>(collection: T[], collectionName: string): number {
    return collection.length > 0 ? Math.max(...collection.map(item => item.id)) + 1 : 1;
  }
}
