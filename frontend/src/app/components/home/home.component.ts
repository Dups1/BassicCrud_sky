import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);

  ubicacionEstado = signal<'pendiente' | 'obtenida' | 'denegada'>('pendiente');
  direccionActual = signal<string | null>(null);

  get usuario() {
    return this.authService.getSesion();
  }

  ngOnInit() {
    this.pedirUbicacion();
  }

  pedirUbicacion() {
    if (!navigator.geolocation) {
      this.ubicacionEstado.set('denegada');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        localStorage.setItem('ubicacion', JSON.stringify({ lat, lng }));
        this.ubicacionEstado.set('obtenida');

        const sesion = this.authService.getSesion();
        if (sesion?.id_usuario) {
          this.authService.guardarUbicacion(sesion.id_usuario, lat, lng).subscribe();
        }

        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`;
        this.http.get<any>(url, { headers: { 'Accept-Language': 'es' } }).subscribe(res => {
          this.direccionActual.set(res.display_name ?? null);
        });
      },
      () => {
        this.ubicacionEstado.set('denegada');
      }
    );
  }

  cerrarSesion() {
    if (confirm('¿Deseas cerrar sesión?')) {
      this.authService.cerrarSesion();
      this.router.navigate(['/login']);
    }
  }
}
