import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { HomeComponent } from './pages/home/home.component';
import { ClassificaComponent } from './pages/classifica/classifica.component';
import { LoginComponent } from './pages/login/login.component';
import { AuthGuard } from './core/guards/auth.guard';
import { AuthService } from './core/services/auth.service';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: 'login', 
    pathMatch: 'full' 
  },
  { 
    path: 'home', 
    component: HomeComponent, 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'classifica', 
    component: ClassificaComponent, 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'login', 
    component: LoginComponent,
    canActivate: [() => {
      const authService = inject(AuthService);
      const router = inject(Router);
      if (authService.isLoggedIn()) {
        router.navigate(['/home']);
        return false;
      }
      return true;
    }]
  },
  { 
    path: '**', 
    redirectTo: 'login' 
  }
];
