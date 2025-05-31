import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LeagueService, League } from '../../core/services/league.service';
import { NgbAlertModule, NgbNavModule, NgbProgressbarModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-league-details',
  standalone: true,
  imports: [CommonModule, NgbAlertModule, NgbNavModule, NgbProgressbarModule],
  templateUrl: './league-details.component.html',
  styleUrls: ['./league-details.component.scss']
})
export class LeagueDetailsComponent implements OnInit {
  league: League | null = null;
  isLoading = true;
  error: string | null = null;
  activeTab: string = 'info';
  isAdmin = false;
  currentUserId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private leagueService: LeagueService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Ottieni l'ID della lega dalla route
    const leagueId = this.route.snapshot.paramMap.get('id');

    if (leagueId) {
      this.loadLeagueDetails(+leagueId);
    } else {
      this.error = 'ID lega non valido';
      this.isLoading = false;
    }

    // Ottieni l'ID dell'utente corrente
    this.currentUserId = this.authService.getCurrentUserSync()?.id || null;
  }

  private loadLeagueDetails(leagueId: number): void {
    this.isLoading = true;
    this.error = null;

    this.leagueService.getLeagueDetails(leagueId).subscribe({
      next: (league) => {
        this.league = league;
        this.isAdmin = league?.adminId === this.currentUserId;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Errore nel caricamento della lega:', error);
        this.error = 'Impossibile caricare i dettagli della lega. Riprova più tardi.';
        this.isLoading = false;
      }
    });
  }

  // Formatta la data in formato leggibile
  formatDate(dateString: string): string {
    if (!dateString) return 'Non specificata';
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('it-IT', options);
  }

  // Calcola i giorni mancanti alla fine del campionato
  getDaysToEnd(): { days: number, percentage: number } | null {
    if (!this.league?.fineCampionato) return null;

    const endDate = new Date(this.league.fineCampionato);
    const today = new Date();
    const startDate = new Date(this.league.inizioCampionato || today);

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    const percentage = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));

    return { days: daysLeft, percentage };
  }

  // Ottieni la classe del badge in base allo stato
  getStatusBadgeClass(): string {
    switch (this.league?.stato) {
      case 'in_corso':
        return 'bg-success';
      case 'concluso':
        return 'bg-secondary';
      case 'draft':
      default:
        return 'bg-warning';
    }
  }

  // Ottieni il testo dello stato
  getStatusText(): string {
    switch (this.league?.stato) {
      case 'in_corso':
        return 'In corso';
      case 'concluso':
        return 'Concluso';
      case 'draft':
      default:
        return 'In preparazione';
    }
  }

  // Azioni
  editLeague(): void {
    if (this.league) {
      this.router.navigate(['/modifica-lega', this.league.id]);
    }
  }

  startChampionship(): void {
    if (this.league) {
      if (confirm('Sei sicuro di voler avviare il campionato? Questa azione non può essere annullata.')) {
        this.leagueService.startChampionship(this.league.id).subscribe({
          next: (success) => {
            if (success && this.league) {
              this.league.stato = 'in_corso';
            }
          },
          error: (error) => {
            console.error('Errore nell\'avvio del campionato:', error);
            alert('Impossibile avviare il campionato. Riprova più tardi.');
          }
        });
      }
    }
  }

  endChampionship(): void {
    if (this.league) {
      if (confirm('Sei sicuro di voler terminare il campionato? Questa azione non può essere annullata.')) {
        this.leagueService.endChampionship(this.league.id).subscribe({
          next: (success) => {
            if (success && this.league) {
              this.league.stato = 'concluso';
            }
          },
          error: (error) => {
            console.error('Errore nella chiusura del campionato:', error);
            alert('Impossibile terminare il campionato. Riprova più tardi.');
          }
        });
      }
    }
  }

  // Copia il codice invito negli appunti
  copyInviteCode(): void {
    if (this.league?.inviteCode) {
      navigator.clipboard.writeText(this.league.inviteCode)
        .then(() => {
          // Mostra un messaggio di successo (potresti usare un toast)
          console.log('Codice copiato negli appunti');
        })
        .catch(err => {
          console.error('Errore nella copia del codice:', err);
        });
    }
  }
}
