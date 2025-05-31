import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';

// Servizi
import { ApiService } from './core/services/api.service';
import { AuthService } from './core/services/auth.service';
import { DriverService } from './modules/services/driver.service';
import { LeagueService } from './core/services/league.service';
import { TeamService } from './core/services/team.service';
import { FantasyDriverService } from './core/services/fantasy-driver.service';
import { AuctionService } from './core/services/auction.service';
import { RaceLineupService } from './core/services/race-lineup.service';
import { NotificationService } from './core/services/notification.service';
import { TransferService } from './core/services/transfer.service';
import { ToastService } from './core/services/toast.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(), // Required for Toastr
    provideToastr({
      timeOut: 5000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      progressBar: true,
      closeButton: true,
      tapToDismiss: true,
      newestOnTop: true,
      maxOpened: 5
    }),
    importProvidersFrom(BrowserModule, BrowserAnimationsModule),
    // Fornisci tutti i servizi
    ApiService,
    AuthService,
    DriverService,
    LeagueService,
    TeamService,
    FantasyDriverService,
    AuctionService,
    RaceLineupService,
    NotificationService,
    TransferService,
    ToastService
  ]
};
