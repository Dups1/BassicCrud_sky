import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RadarService } from '../../services/radar.service';
import { HorarioService } from '../../services/horario.service';
import { AuthService } from '../../services/auth.service';
import { Radar } from '../../models/radar.model';
import { Horario } from '../../models/horario.model';

@Component({
  selector: 'app-radar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './radar.component.html'
})
export class RadarComponent implements OnInit {
  getMapsUrl(direccion: string): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`;
  }
  private radarService = inject(RadarService);
  private horarioService = inject(HorarioService);
  private authService = inject(AuthService);

  lugares = signal<Radar[]>([]);
  lugarSeleccionado = signal<Radar | null>(null);
  modoEdicion = signal(false);
  cargando = signal(true);
  error = signal<string | null>(null);
  mostrarFormulario = signal(false);

  nuevoLugar: Radar = this.lugarVacio();
  horariosForm: Horario[] = this.horariosDefault();

  readonly diasSemana = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

  ngOnInit() {
    this.cargarLugares();
  }

  cargarLugares() {
    this.cargando.set(true);
    this.error.set(null);

    this.radarService.getAll().subscribe({
      next: (data) => {
        this.lugares.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(`Error: ${err.status} - ${err.message}`);
        this.cargando.set(false);
      }
    });
  }

  agregarHorario() {
    this.horariosForm.push({ dia: 'Lunes', horarioapertura: '09:00', horariocierre: '18:00' });
  }

  quitarHorario(index: number) {
    this.horariosForm.splice(index, 1);
  }

  guardar() {
    if (this.modoEdicion()) {
      const id = this.lugarSeleccionado()!.id_radar!;
      this.radarService.update(id, this.nuevoLugar).subscribe({
        next: () => {
          this.guardarHorarios(id, () => { this.cargarLugares(); this.cancelar(); });
        },
        error: () => alert('Error al actualizar')
      });
    } else {
      const sesion = this.authService.getSesion();
      if (sesion?.id_usuario) {
        this.nuevoLugar.id_usuario = sesion.id_usuario;
      }
      this.radarService.create(this.nuevoLugar).subscribe({
        next: (res) => {
          const id = res.id;
          this.guardarHorarios(id, () => { this.cargarLugares(); this.nuevoLugar = this.lugarVacio(); this.horariosForm = this.horariosDefault(); this.mostrarFormulario.set(false); });
        },
        error: () => alert('Error al crear')
      });
    }
  }

  private guardarHorarios(idRadar: number, onDone: () => void) {
    if (this.horariosForm.length === 0) { onDone(); return; }

    if (this.modoEdicion()) {
      this.horarioService.deleteByRadar(idRadar).subscribe({
        next: () => this.crearHorarios(idRadar, onDone),
        error: () => this.crearHorarios(idRadar, onDone)
      });
    } else {
      this.crearHorarios(idRadar, onDone);
    }
  }

  private crearHorarios(idRadar: number, onDone: () => void) {
    let pendientes = this.horariosForm.length;
    this.horariosForm.forEach(h => {
      this.horarioService.create({ ...h, id_radar: idRadar }).subscribe({
        next: () => { if (--pendientes === 0) onDone(); },
        error: () => { if (--pendientes === 0) onDone(); }
      });
    });
  }

  editar(lugar: Radar) {
    this.lugarSeleccionado.set(lugar);
    this.nuevoLugar = { ...lugar };
    this.modoEdicion.set(true);
    this.mostrarFormulario.set(true);
    this.horariosForm = [];

    this.horarioService.getByRadar(lugar.id_radar!).subscribe({
      next: (data) => {
        this.horariosForm = data.map(h => ({
          dia: h.dia,
          horarioapertura: h.horarioapertura,
          horariocierre: h.horariocierre
        }));
      }
    });
  }

  toggleFavorito(lugar: Radar) {
    const actualizado = { ...lugar, favorito: !lugar.favorito };
    this.radarService.update(lugar.id_radar!, actualizado).subscribe({
      next: () => this.cargarLugares(),
      error: () => alert('Error al actualizar favorito')
    });
  }

  eliminar(id: number) {
    if (confirm('¿Eliminar este lugar?')) {
      this.radarService.delete(id).subscribe({
        next: () => this.cargarLugares(),
        error: () => alert('Error al eliminar')
      });
    }
  }

  cancelar() {
    this.nuevoLugar = this.lugarVacio();
    this.horariosForm = this.horariosDefault();
    this.modoEdicion.set(false);
    this.lugarSeleccionado.set(null);
    this.mostrarFormulario.set(false);
  }

  private horariosDefault(): Horario[] {
    return ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'].map(dia => ({
      dia,
      horarioapertura: '09:00',
      horariocierre: '18:00'
    }));
  }

  private lugarVacio(): Radar {
    return {
      categoria: '',
      nombre: '',
      direccion: '',
      walkMin: null,
      driveMin: null,
      calificacion: null,
      precio: 0,
      nota: null
    };
  }
}
