import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { HomeComponent } from './pages/home/home.component';
import { ClassificaComponent } from './pages/classifica/classifica.component';
import { LoginComponent } from './pages/login/login.component';
import { AuthGuard } from './core/guards/auth.guard';
import { AuthService } from './core/services/auth.service';
import { LeagueDetailsComponent } from './pages/league-details/league-details.component';
import { CreateLeagueComponent } from './pages/create-league/create-league.component';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: 'home', 
    pathMatch: 'full' 
  },
  { 
    path: 'home', 
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent), 
    canActivate: [AuthGuard] 
  },
  {
    path: 'lega/:id',
    loadComponent: () => import('./pages/league-details/league-details.component').then(m => m.LeagueDetailsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'crea-lega',
    loadComponent: () => import('./pages/create-league/create-league.component').then(m => m.CreateLeagueComponent),
    canActivate: [AuthGuard]
  },
  { 
    path: 'classifica', 
    component: ClassificaComponent, 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'login', 
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    canActivate: [() => {
      const authService = inject(AuthService);
      const router = inject(Router);
      
      if (authService.isLoggedIn()) {
        return router.navigate(['/home']);
      }
      return true;
    }]
  },
  { 
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent),
    canActivate: [() => {
      const authService = inject(AuthService);
      const router = inject(Router);
      
      if (authService.isLoggedIn()) {
        return router.navigate(['/home']);
      }
      return true;
    }]
  },
  { 
    path: '**', 
    redirectTo: 'home' 
  }
];
