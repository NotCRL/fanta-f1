import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { NotificationBellComponent } from '../../../shared/components/notification-bell/notification-bell.component';
import { NgbDropdownModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    NotificationBellComponent,
    NgbDropdownModule,
    NgbModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  user: any = null;
  private isBrowser: boolean;
  private userSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.user = this.authService.getCurrentUserSync();
      this.isLoggedIn = this.authService.isLoggedIn();

      this.userSubscription = this.authService.currentUser.subscribe(user => {
        this.user = user;
        this.isLoggedIn = !!user;
      });
    }
  }

  onLogout() {
    if (this.isBrowser) {
      //('[NavbarComponent] Logout requested');
      this.authService.logout();
    }
  }

  isActive(route: string): boolean {
    if (!this.isBrowser) return false;
    return this.router.isActive(route, {
      paths: 'exact',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored'
    });
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
}
