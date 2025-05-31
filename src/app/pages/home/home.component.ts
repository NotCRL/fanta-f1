import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LeagueService, League } from '../../core/services/league.service';
import { AuthService } from '../../core/services/auth.service';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, NgbTooltipModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  leagues: League[] = [];
  isLoading = true;
  error: string | null = null;
  
  constructor(
    private leagueService: LeagueService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserLeagues();
  }

  loadUserLeagues(): void {
    this.isLoading = true;
    this.error = null;
    
    // Qui dovresti avere un metodo nel servizio per ottenere le leghe dell'utente corrente
    // Per ora usiamo tutte le leghe come esempio
    this.leagueService.getLeagues().subscribe({
      next: (leagues) => {
        this.leagues = leagues;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Errore nel caricamento delle competizioni:', error);
        this.error = 'Si è verificato un errore nel caricamento delle tue competizioni.';
        this.isLoading = false;
      }
    });
  }

  getLeagueStatusClass(status: string): string {
    switch (status) {
      case 'in_corso':
        return 'status-in-progress';
      case 'concluso':
        return 'status-finished';
      case 'draft':
      default:
        return 'status-draft';
    }
  }

  getLeagueStatusText(status: string): string {
    switch (status) {
      case 'in_corso':
        return 'In Corso';
      case 'concluso':
        return 'Concluso';
      case 'draft':
      default:
        return 'In Preparazione';
    }
  }

  navigateToLeague(leagueId: number): void {
    this.router.navigate(['/lega', leagueId]);
  }

  createNewLeague(): void {
    this.router.navigate(['/crea-lega']);
  }
}
