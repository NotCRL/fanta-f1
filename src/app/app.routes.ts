import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { ClassificaComponent } from './pages/classifica/classifica.component';


export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'classifica', component: ClassificaComponent },
];
