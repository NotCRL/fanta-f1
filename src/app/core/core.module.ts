import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

// Servizi
import { ApiService } from './services/api.service';
import { AuthService } from './services/auth.service';
import { DriverService } from '../modules/services/driver.service';
import { LeagueService } from './services/league.service';
import { TeamService } from './services/team.service';
import { FantasyDriverService } from './services/fantasy-driver.service';
import { AuctionService } from './services/auction.service';
import { RaceLineupService } from './services/race-lineup.service';
import { NotificationService } from './services/notification.service';
import { TransferService } from './services/transfer.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HttpClientModule
  ],
  providers: [
    ApiService,
    AuthService,
    DriverService,
    LeagueService,
    TeamService,
    FantasyDriverService,
    AuctionService,
    RaceLineupService,
    NotificationService,
    TransferService
  ]
})
export class CoreModule { }
