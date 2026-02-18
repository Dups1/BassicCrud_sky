import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { HotelesComponent } from './components/hoteles/hoteles.component';
import { ClientesComponent } from './components/clientes/clientes.component';
import { ServiciosComponent } from './components/servicios/servicios.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'hoteles', component: HotelesComponent },
  { path: 'clientes', component: ClientesComponent },
  { path: 'servicios', component: ServiciosComponent }
];
