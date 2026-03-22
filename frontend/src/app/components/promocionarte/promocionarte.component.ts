import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { UbicacionService } from '../../services/ubicacion.service';
import { CloudinaryService } from '../../services/cloudinary.service';
import { RadarService } from '../../services/radar.service';
import { HorarioService } from '../../services/horario.service';
import { AuthService } from '../../services/auth.service';
import { CategoriaService } from '../../services/categoria.service';
import { TarjetaService } from '../../services/tarjeta.service';
import { PromocionService } from '../../services/promocion.service';
import { CatalogoService } from '../../services/catalogo.service';
import { ComentarioService } from '../../services/comentario.service';
import { TransferenciaService } from '../../services/transferencia.service';
import { Radar } from '../../models/radar.model';
import { Horario } from '../../models/horario.model';
import { Categoria } from '../../models/categoria.model';
import { Tarjeta } from '../../models/tarjeta.model';
import { Promocion } from '../../models/promocion.model';
import { Catalogo } from '../../models/catalogo.model';
import { Comentario } from '../../models/comentario.model';

@Component({
  selector: 'app-promocionarte',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './promocionarte.component.html'
})
export class PromocionarteComponent implements OnInit {
  private radarService = inject(RadarService);
  private horarioService = inject(HorarioService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private categoriaService = inject(CategoriaService);
  private tarjetaService = inject(TarjetaService);
  private promocionService = inject(PromocionService);
  private ubicacionService = inject(UbicacionService);
  private cloudinaryService = inject(CloudinaryService);
  private cataloService = inject(CatalogoService);
  private comentarioService = inject(ComentarioService);
  private transferenciaService = inject(TransferenciaService);

  lugares = signal<Radar[]>([]);
  categorias = signal<Categoria[]>([]);
  tarjetas = signal<Tarjeta[]>([]);
  promociones = signal<Promocion[]>([]);
  catalogosPorLugar = signal<Map<number, Catalogo[]>>(new Map());
  comentariosPorLugar = signal<Map<number, Comentario[]>>(new Map());
  mostrarComentarios = signal<number | null>(null);

  // CRUD catalogo
  mostrarFormCatalogo = signal<number | null>(null); // id_radar activo
  nuevoCatalogo: Catalogo = this.catalogoVacio(0);
  editandoCatalogo = signal<Catalogo | null>(null);
  subiendoFotoCatalogo = signal(false);
  fotoCatalogoPreview = signal<string | null>(null);
  private fotoCatalogoFile: File | null = null;

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
  readonly PRECIO_DIA = 50;
  modoAutoDir = signal(false);
  cargandoDir = signal(false);
  fotoPreview = signal<string | null>(null);
  subiendoFoto = signal(false);
  private fotoFile: File | null = null;

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

  calcularDias(): number {
    const inicio = new Date(this.promocionForm.fecha_inicio);
    const fin = new Date(this.promocionForm.fecha_fin);
    if (!this.promocionForm.fecha_inicio || !this.promocionForm.fecha_fin || fin <= inicio) return 0;
    return Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
  }

  calcularPrecio(): number {
    return this.calcularDias() * this.PRECIO_DIA;
  }
 
  guardarPromocion() {
    this.promocionForm.id_usuario = this.idUsuario;
    this.promocionForm.id_radar = this.lugarAPromocionar()!.id_radar!;
    this.promocionForm.precio = this.calcularPrecio();
    
    this.promocionService.create(this.promocionForm).subscribe({
      next: (resp) => {
        // Crear transferencia
        const dias = this.calcularDias();
        const usuario = this.authService.getSesion();
        this.transferenciaService.create({
          id_usuario: this.idUsuario,
          nombre_usuario: usuario?.nombre || '',
          id_promocion: resp.id || 0,
          nombre_lugar: this.lugarAPromocionar()!.nombre,
          monto: this.promocionForm.precio,
          dias: dias
        }).subscribe({
          next: () => {
            this.cargarPromociones();
            this.mostrarModalPromocion.set(false);
            this.promocionForm = this.promocionVacia();
            this.lugarAPromocionar.set(null);
          },
          error: () => alert('Error al registrar transferencia')
        });
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
      next: (data) => {
        this.lugares.set(data);
        this.cargando.set(false);
        this.cargarCatalogos(data);
        this.cargarComentarios(data);
      },
      error: (err) => { this.error.set(`Error: ${err.status}`); this.cargando.set(false); }
    });
  }

  private cargarCatalogos(lugares: Radar[]) {
    const mapa = new Map<number, Catalogo[]>();
    let pendientes = lugares.length;
    if (pendientes === 0) { this.catalogosPorLugar.set(mapa); return; }
    lugares.forEach((l) => {
      this.cataloService.getByRadar(l.id_radar!).subscribe({
        next: (items) => {
          mapa.set(l.id_radar!, items);
          pendientes--;
          if (pendientes === 0) this.catalogosPorLugar.set(new Map(mapa));
        },
        error: () => {
          mapa.set(l.id_radar!, []);
          pendientes--;
          if (pendientes === 0) this.catalogosPorLugar.set(new Map(mapa));
        }
      });
    });
  }

  private cargarComentarios(lugares: Radar[]) {
    const mapa = new Map<number, Comentario[]>();
    let pendientes = lugares.length;
    if (pendientes === 0) { this.comentariosPorLugar.set(mapa); return; }
    lugares.forEach((l) => {
      this.comentarioService.getByRadar(l.id_radar!).subscribe({
        next: (items) => {
          mapa.set(l.id_radar!, items);
          pendientes--;
          if (pendientes === 0) this.comentariosPorLugar.set(new Map(mapa));
        },
        error: () => {
          mapa.set(l.id_radar!, []);
          pendientes--;
          if (pendientes === 0) this.comentariosPorLugar.set(new Map(mapa));
        }
      });
    });
  }

  getComentarios(idRadar: number): Comentario[] {
    return this.comentariosPorLugar().get(idRadar) ?? [];
  }

  toggleComentarios(idRadar: number) {
    this.mostrarComentarios.set(this.mostrarComentarios() === idRadar ? null : idRadar);
  }

  getCatalogo(idRadar: number): Catalogo[] {
    return this.catalogosPorLugar().get(idRadar) ?? [];
  }

  getPrecioPromedio(idRadar: number): number {
    const catalogo = this.getCatalogo(idRadar);
    if (catalogo.length === 0) return 0;
    const suma = catalogo.reduce((acc, p) => acc + (Number(p.precio) || 0), 0);
    const promedio = suma / catalogo.length;
    return isNaN(promedio) ? 0 : Math.round(promedio * 100) / 100;
  }

  getCalificacionPromedio(idRadar: number): number {
    const comentarios = this.getComentarios(idRadar);
    if (comentarios.length === 0) return 0;
    const suma = comentarios.reduce((acc, c) => acc + (Number(c.calificacion) || 0), 0);
    const promedio = suma / comentarios.length;
    return isNaN(promedio) ? 0 : Math.round(promedio * 100) / 100;
  }

  abrirFormCatalogo(idRadar: number) {
    this.nuevoCatalogo = this.catalogoVacio(idRadar);
    this.editandoCatalogo.set(null);
    this.fotoCatalogoPreview.set(null);
    this.fotoCatalogoFile = null;
    this.mostrarFormCatalogo.set(idRadar);
  }

  cerrarFormCatalogo() {
    this.mostrarFormCatalogo.set(null);
    this.editandoCatalogo.set(null);
    this.fotoCatalogoPreview.set(null);
    this.fotoCatalogoFile = null;
  }

  iniciarEditarProducto(p: Catalogo) {
    this.editandoCatalogo.set({ ...p });
    this.fotoCatalogoPreview.set(p.foto ?? null);
    this.fotoCatalogoFile = null;
    this.mostrarFormCatalogo.set(p.id_radar);
  }

  onFotoCatalogoChange(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.fotoCatalogoFile = file;
    const reader = new FileReader();
    reader.onload = () => this.fotoCatalogoPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  guardarProducto() {
    const subir = (onDone: (url: string | null) => void) => {
      if (this.fotoCatalogoFile) {
        this.subiendoFotoCatalogo.set(true);
        this.cloudinaryService.uploadImage(this.fotoCatalogoFile).subscribe({
          next: (url) => { this.subiendoFotoCatalogo.set(false); onDone(url); },
          error: () => { alert('Error al subir imagen'); this.subiendoFotoCatalogo.set(false); }
        });
      } else {
        onDone(null);
      }
    };

    const editando = this.editandoCatalogo();
    if (editando) {
      subir((url) => {
        const payload: Partial<Catalogo> = { ...editando };
        if (url) payload.foto = url;
        this.cataloService.update(editando.id_catalogo!, payload).subscribe({
          next: () => { this.cargarCatalogos(this.lugares()); this.cerrarFormCatalogo(); },
          error: () => alert('Error al actualizar producto')
        });
      });
    } else {
      subir((url) => {
        const payload: Catalogo = { ...this.nuevoCatalogo };
        if (url) payload.foto = url;
        this.cataloService.create(payload).subscribe({
          next: () => { this.cargarCatalogos(this.lugares()); this.cerrarFormCatalogo(); },
          error: () => alert('Error al crear producto')
        });
      });
    }
  }

  eliminarProducto(p: Catalogo) {
    if (!confirm('Eliminar producto?')) return;
    this.cataloService.delete(p.id_catalogo!).subscribe({
      next: () => this.cargarCatalogos(this.lugares()),
      error: () => alert('Error al eliminar producto')
    });
  }

  private catalogoVacio(idRadar: number): Catalogo {
    return { id_radar: idRadar, nombre: '', descripcion: '', precio: 0, foto: null };
  }

  agregarHorario() {
    this.horariosForm.push({ dia: 'Lunes', horarioapertura: '09:00', horariocierre: '18:00' });
  }

  quitarHorario(index: number) {
    this.horariosForm.splice(index, 1);
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

  onFotoChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.fotoFile = file;
    const reader = new FileReader();
    reader.onload = () => this.fotoPreview.set(reader.result as string);
    reader.readAsDataURL(file);
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

  cerrarSesion() {
    if (confirm('¿Cerrar sesión?')) {
      this.authService.cerrarSesion();
      this.router.navigate(['/login']);
    }
  }
}
