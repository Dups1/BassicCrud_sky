import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RadarService } from '../../services/radar.service';
import { AuthService } from '../../services/auth.service';
import { Radar } from '../../models/radar.model';

@Component({
  selector: 'app-radar-alumno',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './radar-alumno.component.html'
})
export class RadarAlumnoComponent implements OnInit {
  private radarService = inject(RadarService);
  private authService = inject(AuthService);

  lugares = signal<Radar[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.cargarLugares();
  }

  cargarLugares() {
    this.cargando.set(true);
    this.error.set(null);
    this.radarService.getAll().subscribe({
      next: (data) => { this.lugares.set(data); this.cargando.set(false); },
      error: (err) => { this.error.set(`Error: ${err.status}`); this.cargando.set(false); }
    });
  }

  toggleFavorito(lugar: Radar) {
    const actualizado = { ...lugar, favorito: !lugar.favorito };
    this.radarService.update(lugar.id_radar!, actualizado).subscribe({
      next: () => this.cargarLugares(),
      error: () => alert('Error al actualizar favorito')
    });
  }

  getMapsUrl(direccion: string): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`;
  }
}
