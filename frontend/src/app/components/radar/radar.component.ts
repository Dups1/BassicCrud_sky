import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UbicacionService } from '../../services/ubicacion.service';
import { CloudinaryService } from '../../services/cloudinary.service';
import { RadarService } from '../../services/radar.service';
import { HorarioService } from '../../services/horario.service';
import { AuthService } from '../../services/auth.service';
import { CategoriaService } from '../../services/categoria.service';
import { Radar } from '../../models/radar.model';
import { Horario } from '../../models/horario.model';
import { Categoria } from '../../models/categoria.model';

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

  toggleModoDir() {
    const auto = !this.modoAutoDir();
    this.modoAutoDir.set(auto);
    if (auto) {
      this.cargandoDir.set(true);
      this.ubicacionService.getDireccionActual().subscribe({
        next: (dir) => { this.nuevoLugar.direccion = dir; this.cargandoDir.set(false); },
        error: () => { alert('No se pudo obtener la ubicación'); this.modoAutoDir.set(false); this.cargandoDir.set(false); }
      });
    } else {
      this.nuevoLugar.direccion = '';
    }
  }
  private radarService = inject(RadarService);
  private horarioService = inject(HorarioService);
  private authService = inject(AuthService);
  private categoriaService = inject(CategoriaService);
  private ubicacionService = inject(UbicacionService);
  private cloudinaryService = inject(CloudinaryService);

  lugares = signal<Radar[]>([]);
  categorias = signal<Categoria[]>([]);
  modoAutoDir = signal(false);
  cargandoDir = signal(false);
  fotoPreview = signal<string | null>(null);
  subiendoFoto = signal(false);
  private fotoFile: File | null = null;
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
    this.categoriaService.getAll().subscribe(data => this.categorias.set(data));
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

  onFotoChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.fotoFile = file;
    const reader = new FileReader();
    reader.onload = () => this.fotoPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  guardar() {
    if (this.fotoFile) {
      this.subiendoFoto.set(true);
      this.cloudinaryService.uploadImage(this.fotoFile).subscribe({
        next: (url) => {
          this.nuevoLugar.foto = url;
          this.fotoFile = null;
          this.subiendoFoto.set(false);
          this.guardarLugar();
        },
        error: () => { alert('Error al subir la imagen'); this.subiendoFoto.set(false); }
      });
    } else {
      this.guardarLugar();
    }
  }

  private guardarLugar() {
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
      if (sesion?.id_usuario) this.nuevoLugar.id_usuario = sesion.id_usuario;
      this.radarService.create(this.nuevoLugar).subscribe({
        next: (res) => {
          const id = res.id;
          this.guardarHorarios(id, () => { this.cargarLugares(); this.nuevoLugar = this.lugarVacio(); this.horariosForm = this.horariosDefault(); this.mostrarFormulario.set(false); });
        },
        error: () => alert('Error al crear')
      });
    }
  }

  cancelar() {
    this.nuevoLugar = this.lugarVacio();
    this.horariosForm = this.horariosDefault();
    this.modoEdicion.set(false);
    this.lugarSeleccionado.set(null);
    this.mostrarFormulario.set(false);
    this.modoAutoDir.set(false);
    this.fotoPreview.set(null);
    this.fotoFile = null;
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
      id_categoria: 0,
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
