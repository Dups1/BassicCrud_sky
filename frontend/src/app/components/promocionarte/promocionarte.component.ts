import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RadarService } from '../../services/radar.service';
import { HorarioService } from '../../services/horario.service';
import { AuthService } from '../../services/auth.service';
import { CategoriaService } from '../../services/categoria.service';
import { TarjetaService } from '../../services/tarjeta.service';
import { PromocionService } from '../../services/promocion.service';
import { Radar } from '../../models/radar.model';
import { Horario } from '../../models/horario.model';
import { Categoria } from '../../models/categoria.model';
import { Tarjeta } from '../../models/tarjeta.model';
import { Promocion } from '../../models/promocion.model';

@Component({
  selector: 'app-promocionarte',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './promocionarte.component.html'
})
export class PromocionarteComponent implements OnInit {
  private radarService = inject(RadarService);
  private horarioService = inject(HorarioService);
  private authService = inject(AuthService);
  private categoriaService = inject(CategoriaService);
  private tarjetaService = inject(TarjetaService);
  private promocionService = inject(PromocionService);

  lugares = signal<Radar[]>([]);
  categorias = signal<Categoria[]>([]);
  tarjetas = signal<Tarjeta[]>([]);
  promociones = signal<Promocion[]>([]);
  mostrarModalTarjeta = signal(false);
  mostrarModalPromocion = signal(false);
  lugarAPromocionar = signal<Radar | null>(null);
  tarjetaForm: Tarjeta = this.tarjetaVacia();
  promocionForm: Promocion = this.promocionVacia();
  lugarSeleccionado = signal<Radar | null>(null);
  modoEdicion = signal(false);
  cargando = signal(true);
  error = signal<string | null>(null);
  mostrarFormulario = signal(false);

  nuevoLugar: Radar = this.lugarVacio();
  horariosForm: Horario[] = this.horariosDefault();

  readonly diasSemana = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

  private get idUsuario(): number {
    return this.authService.getSesion()?.id_usuario ?? 0;
  }

  ngOnInit() {
    this.cargarLugares();
    this.categoriaService.getAll().subscribe(data => this.categorias.set(data));
    this.cargarTarjetas();
    this.cargarPromociones();
  }

  cargarPromociones() {
    this.promocionService.getByUsuario(this.idUsuario).subscribe({
      next: (data) => this.promociones.set(data),
      error: () => {}
    });
  }

  guardarPromocion() {
    this.promocionForm.id_usuario = this.idUsuario;
    this.promocionForm.id_radar = this.lugarAPromocionar()!.id_radar!;
    this.promocionService.create(this.promocionForm).subscribe({
      next: () => {
        this.cargarPromociones();
        this.mostrarModalPromocion.set(false);
        this.promocionForm = this.promocionVacia();
        this.lugarAPromocionar.set(null);
      },
      error: () => alert('Error al crear la promoción')
    });
  }

  cancelarPromocion() {
    this.mostrarModalPromocion.set(false);
    this.promocionForm = this.promocionVacia();
    this.lugarAPromocionar.set(null);
  }

  private promocionVacia(): Promocion {
    return { id_tarjeta: 0, id_radar: 0, fecha_inicio: '', fecha_fin: '', precio: 0 };
  }

  cargarTarjetas() {
    this.tarjetaService.getByUsuario(this.idUsuario).subscribe({
      next: (data) => this.tarjetas.set(data),
      error: () => {}
    });
  }

  guardarTarjeta() {
    this.tarjetaForm.id_usuario = this.idUsuario;
    this.tarjetaService.create(this.tarjetaForm).subscribe({
      next: () => {
        this.cargarTarjetas();
        this.mostrarModalTarjeta.set(false);
        this.tarjetaForm = this.tarjetaVacia();
      },
      error: () => alert('Error al guardar tarjeta')
    });
  }

  eliminarTarjeta(id: number) {
    if (confirm('¿Eliminar esta tarjeta?')) {
      this.tarjetaService.delete(id).subscribe({
        next: () => this.cargarTarjetas(),
        error: () => alert('Error al eliminar tarjeta')
      });
    }
  }

  private tarjetaVacia(): Tarjeta {
    return { numero_tarjeta: '', fecha_vencimiento: '', cvv: '', nombre_titular: '' };
  }

  cargarLugares() {
    this.cargando.set(true);
    this.error.set(null);
    this.radarService.getByUsuario(this.idUsuario).subscribe({
      next: (data) => { this.lugares.set(data); this.cargando.set(false); },
      error: (err) => { this.error.set(`Error: ${err.status}`); this.cargando.set(false); }
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
        next: () => { this.guardarHorarios(id, () => { this.cargarLugares(); this.cancelar(); }); },
        error: () => alert('Error al actualizar')
      });
    } else {
      this.nuevoLugar.id_usuario = this.idUsuario;
      this.radarService.create(this.nuevoLugar).subscribe({
        next: (res) => {
          const id = res.id;
          this.guardarHorarios(id, () => {
            this.cargarLugares();
            this.nuevoLugar = this.lugarVacio();
            this.horariosForm = this.horariosDefault();
            this.mostrarFormulario.set(false);
          });
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

  getMapsUrl(direccion: string): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`;
  }

  abrirModalPromocion(lugar: Radar) {
    this.lugarAPromocionar.set(lugar);
    this.promocionForm = this.promocionVacia();
    this.mostrarModalPromocion.set(true);
  }

  private horariosDefault(): Horario[] {
    return ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'].map(dia => ({
      dia,
      horarioapertura: '09:00',
      horariocierre: '18:00'
    }));
  }

  private lugarVacio(): Radar {
    return { id_categoria: 0, nombre: '', direccion: '', walkMin: null, driveMin: null, calificacion: null, precio: 0, nota: null };
  }
}
