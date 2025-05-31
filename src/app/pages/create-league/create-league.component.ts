import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LeagueService } from '../../core/services/league.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgbAlertModule, NgbCollapse } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-create-league',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbAlertModule, NgbCollapse],
  templateUrl: './create-league.component.html',
  styleUrls: ['./create-league.component.scss']
})
export class CreateLeagueComponent implements OnInit {
  leagueForm: FormGroup;
  isLoading = false;
  error: string | null = null;
  success = false;

  today = new Date().toISOString().split('T')[0];
  showAdvanced = false;
  
  constructor(
    private fb: FormBuilder,
    private leagueService: LeagueService,
    private authService: AuthService,
    private router: Router
  ) {
    this.leagueForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(500)]],
      maxTeams: [10, [Validators.required, Validators.min(2), Validators.max(20)]],
      budgetIniziale: [100, [Validators.required, Validators.min(50), Validators.max(1000)]],
      isPrivate: [false],
      inizioCampionato: ['', [Validators.required]],
      fineCampionato: ['', [Validators.required]],
      // Regole avanzate
      puntiPolePosition: [5, [Validators.required, Validators.min(0)]],
      puntiGiroVeloce: [2, [Validators.required, Validators.min(0)]],
      puntiPoleSprint: [3, [Validators.required, Validators.min(0)]],
      puntiPodioSprint: [[5, 3, 1], [Validators.required]],
      puntiPosizioneGara: [[25, 18, 15, 12, 10, 8, 6, 4, 2, 1], [Validators.required]],
      puntiGiroVeloceGara: [1, [Validators.required, Validators.min(0)]],
      bonusPoleELapida: [3, [Validators.required, Validators.min(0)]],
      bonusPilotaDelGiorno: [5, [Validators.required, Validators.min(0)]],
      bonusCostruttoreDelGiorno: [5, [Validators.required, Validators.min(0)]],
      sosteObbligatorie: [true],
      danniMeccanici: [true],
      sanzioni: [true]
    });
  }

  ngOnInit(): void {
    // Imposta la data di inizio predefinita a domani
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.leagueForm.patchValue({
      inizioCampionato: tomorrow.toISOString().split('T')[0]
    });
    
    // Imposta la data di fine predefinita a 8 mesi dopo
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 8);
    this.leagueForm.patchValue({
      fineCampionato: endDate.toISOString().split('T')[0]
    });
  }

  updatePuntiPosizione(event: any, index: number): void {
    const punti = event.target.valueAsNumber;
    const puntiArray = [...this.leagueForm.get('puntiPosizioneGara')?.value];
    puntiArray[index] = isNaN(punti) ? 0 : punti;
    this.leagueForm.get('puntiPosizioneGara')?.setValue(puntiArray);
  }

  onSubmit(): void {
    if (this.leagueForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    const currentUser = this.authService.getCurrentUserSync();
    if (!currentUser) {
      this.error = 'Utente non autenticato';
      this.isLoading = false;
      this.router.navigate(['/login']);
      return;
    }

    const formValue = this.leagueForm.value;
    const leagueData = {
      name: formValue.name,
      description: formValue.description || '',
      maxTeams: Number(formValue.maxTeams),
      budgetIniziale: Number(formValue.budgetIniziale),
      isPrivate: Boolean(formValue.isPrivate),
      inizioCampionato: formValue.inizioCampionato,
      fineCampionato: formValue.fineCampionato,
      adminId: currentUser.id,
      stato: 'draft' as const,
      regole: {
        puntiPolePosition: Number(formValue.puntiPolePosition),
        puntiGiroVeloce: Number(formValue.puntiGiroVeloce),
        puntiPoleSprint: Number(formValue.puntiPoleSprint),
        puntiPodioSprint: formValue.puntiPodioSprint.map((p: any) => Number(p)),
        puntiPosizioneGara: formValue.puntiPosizioneGara.map((p: any) => Number(p)),
        puntiGiroVeloceGara: Number(formValue.puntiGiroVeloceGara),
        bonusPoleELapida: Number(formValue.bonusPoleELapida),
        bonusPilotaDelGiorno: Number(formValue.bonusPilotaDelGiorno),
        bonusCostruttoreDelGiorno: Number(formValue.bonusCostruttoreDelGiorno),
        sosteObbligatorie: Boolean(formValue.sosteObbligatorie),
        danniMeccanici: Boolean(formValue.danniMeccanici),
        sanzioni: Boolean(formValue.sanzioni)
      }
    };
    
    // Aggiungi campi mancanti richiesti dall'interfaccia
    const completeLeagueData = {
      ...leagueData,
      id: 0, // Sarà sovrascritto dal server
      inviteCode: '', // Sarà generato dal server
      createdAt: new Date().toISOString()
    };

    this.leagueService.createLeague(completeLeagueData).subscribe({
      next: (league) => {
        if (league) {
          this.success = true;
          // Reindirizza alla pagina della lega dopo 2 secondi
          setTimeout(() => {
            this.router.navigate(['/lega', league.id]);
          }, 2000);
        } else {
          this.error = 'Si è verificato un errore durante la creazione della lega.';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Errore nella creazione della lega:', error);
        this.error = error.message || 'Si è verificato un errore durante la creazione della lega.';
        this.isLoading = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/home']);
  }
}
