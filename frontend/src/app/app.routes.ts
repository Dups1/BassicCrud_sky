import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { RadarComponent } from './components/radar/radar.component';
import { AuthComponent } from './components/auth/auth.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [authGuard] },
  { path: 'radar', component: RadarComponent, canActivate: [authGuard] },
  { path: 'login', component: AuthComponent },
  { path: '**', redirectTo: '' }
];
