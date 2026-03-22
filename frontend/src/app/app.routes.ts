import { Routes } from '@angular/router';
import { RadarComponent } from './components/radar/radar.component';
import { RadarAlumnoComponent } from './components/radar-alumno/radar-alumno.component';
import { PromocionarteComponent } from './components/promocionarte/promocionarte.component';
import { AuthComponent } from './components/auth/auth.component';
import { authGuard } from './guards/auth.guard';

const rolGuard = (roles: string[]) => {
  return () => {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    return roles.includes(usuario.rol || 'estudiante');
  };
};

export const routes: Routes = [
  { path: '', redirectTo: 'radar-alumno', pathMatch: 'full' },
  { path: 'radar', component: RadarComponent, canActivate: [authGuard, () => rolGuard(['admin'])() ? true : false] },
  { path: 'radar-alumno', component: RadarAlumnoComponent, canActivate: [authGuard, () => rolGuard(['estudiante'])() ? true : false] },
  { path: 'promocionarte', component: PromocionarteComponent, canActivate: [authGuard, () => rolGuard(['comerciante'])() ? true : false] },
  { path: 'login', component: AuthComponent },
  { path: '**', redirectTo: 'radar-alumno' }
];
