import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { RadarComponent } from './components/radar/radar.component';
import { RadarAlumnoComponent } from './components/radar-alumno/radar-alumno.component';
import { PromocionarteComponent } from './components/promocionarte/promocionarte.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { AuthComponent } from './components/auth/auth.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [authGuard] },
  { path: 'radar', component: RadarComponent, canActivate: [authGuard] },
  { path: 'radar-alumno', component: RadarAlumnoComponent, canActivate: [authGuard] },
  { path: 'promocionarte', component: PromocionarteComponent, canActivate: [authGuard] },
  { path: 'admin-dashboard', component: AdminDashboardComponent, canActivate: [authGuard] },
  { path: 'login', component: AuthComponent },
  { path: '**', redirectTo: '' }
];
