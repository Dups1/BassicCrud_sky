import { Component, OnInit, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { UbicacionService } from '../../services/ubicacion.service';
import { CloudinaryService } from '../../services/cloudinary.service';
import { RadarService } from '../../services/radar.service';
import { HorarioService } from '../../services/horario.service';
import { CategoriaService } from '../../services/categoria.service';
import { CatalogoService } from '../../services/catalogo.service';
import { ComentarioService } from '../../services/comentario.service';
import { TransferenciaService } from '../../services/transferencia.service';
import { AuthService } from '../../services/auth.service';
import { Radar } from '../../models/radar.model';
import { Horario } from '../../models/horario.model';
import { Categoria } from '../../models/categoria.model';
import { Catalogo } from '../../models/catalogo.model';
import { Comentario } from '../../models/comentario.model';
import { Transferencia } from '../../models/transferencia.model';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-radar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './radar.component.html'
})
export class RadarComponent implements OnInit {
  @ViewChild('csvInput') private csvInput?: ElementRef<HTMLInputElement>;

  private radarService = inject(RadarService);
  private horarioService = inject(HorarioService);
  private categoriaService = inject(CategoriaService);
  private cataloService = inject(CatalogoService);
  private comentarioService = inject(ComentarioService);
  private transferenciaService = inject(TransferenciaService);
  private ubicacionService = inject(UbicacionService);
  private cloudinaryService = inject(CloudinaryService);
  private authService = inject(AuthService);
  private router = inject(Router);

  importandoCsv = signal(false);
  lugares = signal<Radar[]>([]);
  catalogosPorLugar = signal<Map<number, Catalogo[]>>(new Map());
  comentariosPorLugar = signal<Map<number, Comentario[]>>(new Map());
  mostrarComentarios = signal<number | null>(null);

  // CRUD catalogo
  mostrarFormCatalogo = signal<number | null>(null);
  nuevoCatalogo: Catalogo = this.catalogoVacio(0);
  editandoCatalogo = signal<Catalogo | null>(null);
  subiendoFotoCatalogo = signal(false);
  fotoCatalogoPreview = signal<string | null>(null);
  private fotoCatalogoFile: File | null = null;

  abrirCsv() {
    this.csvInput?.nativeElement.click();
  }

  async onCsvFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.importandoCsv.set(true);
    try {
      const ext = (file.name.split('.').pop() ?? '').toLowerCase();
      const matrix =
        ext === 'csv' ? this.parseCsv(await this.leerArchivoTexto(file)) : await this.parseXlsx(file);
      if (matrix.length < 2) throw new Error('Archivo sin datos');

      const header = matrix[0].map((h) => String(h ?? '').trim());
      const idx = new Map<string, number>();
      header.forEach((h, i) => idx.set(h.toLowerCase(), i));

      const get = (row: string[], key: string) => {
        const i = idx.get(key.toLowerCase());
        return i == null ? '' : (row[i] ?? '').trim();
      };

      const requiredKeys = ['id_categoria', 'nombre', 'direccion'];
      const missing = requiredKeys.filter((k) => idx.get(k.toLowerCase()) == null);
      if (missing.length > 0) {
        throw new Error(`CSV faltan columnas: ${missing.join(', ')}`);
      }

      const sesion = this.authService.getSesion();
      const idUsuario = sesion?.id_usuario;

      const filas = matrix.slice(1);

      let ok = 0;
      let fail = 0;

      await Promise.allSettled(
        filas.map(async (row) => {
          const idCategoria = Number(get(row, 'id_categoria'));
          if (Number.isNaN(idCategoria)) throw new Error('id_categoria invalido');

          const lugar: Radar = this.lugarVacio();
          lugar.id_categoria = idCategoria;
          lugar.nombre = get(row, 'nombre');
          lugar.direccion = get(row, 'direccion');
          lugar.precio = 0;
          lugar.walkMin = this.parseNullableNumber(get(row, 'walkMin'));
          lugar.driveMin = this.parseNullableNumber(get(row, 'driveMin'));
          lugar.calificacion = null;
          lugar.nota = (() => {
            const n = get(row, 'nota');
            return n === '' ? null : n;
          })();

          lugar.patrocinado = this.parseBoolean(get(row, 'patrocinado'));
          lugar.favorito = this.parseBoolean(get(row, 'favorito'));
          if (idUsuario) lugar.id_usuario = idUsuario;

          const res = await this.crearRadar(lugar);
          const idRadar = res?.id;
          if (!idRadar) throw new Error('No se pudo crear el lugar (id faltante)');

          await this.crearHorariosPorDefecto(Number(idRadar));
          ok++;
        })
      );

      // allSettled no nos da ok/fail directo por cada promesa
      // el ok/fail lo acumulamos por sus cierres; fail queda calculado mas abajo
      // (sera recalculado con un segundo pass de errores)
      fail = filas.length - ok;

      this.cargarLugares();
      alert(`CSV importado. Ok: ${ok}, errores: ${fail}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error importando CSV';
      alert(msg);
    } finally {
      this.importandoCsv.set(false);
      input.value = '';
    }
  }

  private leerArchivoTexto(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  // CSV basic: separa por coma y soporta comillas dobles para campos con comas.
  private parseCsv(text: string): string[][] {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l !== '');
    if (lines.length === 0) return [];
    return lines.map((line) => this.splitCsvLine(line));
  }

  private parseXlsx(file: File): Promise<string[][]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = reader.result;
          if (!(data instanceof ArrayBuffer)) throw new Error('No se pudo leer el archivo');
          const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });

          const sheetName = workbook.SheetNames.includes('CSV') ? 'CSV' : workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true }) as unknown[][];

          const matrix = rows.map((r) => r.map((cell) => (cell == null ? '' : String(cell).trim())));
          resolve(matrix);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  private splitCsvLine(line: string): string[] {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        const next = line[i + 1];
        if (inQuotes && next === '"') {
          cur += '"';
          i++;
          continue;
        }
        inQuotes = !inQuotes;
        continue;
      }

      if (ch === ',' && !inQuotes) {
        out.push(cur);
        cur = '';
        continue;
      }
      cur += ch;
    }
    out.push(cur);
    return out.map((v) => v.trim());
  }

  private parseNullableNumber(value: string): number | null {
    const s = value.trim();
    if (s === '') return null;
    const n = parseFloat(s.replace(',', '.'));
    return Number.isNaN(n) ? null : n;
  }

  private parseBoolean(value: string): boolean {
    const s = value.trim().toLowerCase();
    if (s === '') return false;
    return s === '1' || s === 'true' || s === 'si' || s === 's';
  }

  private crearRadar(lugar: Radar): Promise<any> {
    return new Promise((resolve, reject) => {
      this.radarService.create(lugar).subscribe({
        next: (res) => resolve(res),
        error: (err) => reject(err)
      });
    });
  }

  private crearHorariosPorDefecto(idRadar: number): Promise<void> {
    const horarios = this.horariosDefault();
    let pendientes = horarios.length;
    if (pendientes === 0) return Promise.resolve();

    return new Promise((resolve) => {
      horarios.forEach((h) => {
        this.horarioService.create({ ...h, id_radar: idRadar }).subscribe({
          next: () => {
            pendientes--;
            if (pendientes === 0) resolve();
          },
          error: () => {
            pendientes--;
            if (pendientes === 0) resolve();
          }
        });
      });
    });
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
  mostrarIngresos = signal(false);
  transferencias = signal<Transferencia[]>([]);

  nuevoLugar: Radar = this.lugarVacio();
  horariosForm: Horario[] = this.horariosDefault();

  readonly diasSemana = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

  ngOnInit() {
    this.cargarLugares();
    this.categoriaService.getAll().subscribe({
      next: (data) => {
        console.log('Categorias cargadas:', data);
        this.categorias.set(data);
      },
      error: (err) => console.error('Error cargando categorias:', err)
    });
    this.cargarTransferencias();
  }

  cargarTransferencias() {
    this.transferenciaService.getAllAdmin().subscribe({
      next: (data) => this.transferencias.set(data),
      error: () => {}
    });
  }

  montoTotalIngresos(): string {
    const total = this.transferencias().reduce((sum, t) => sum + (Number(t.monto) || 0), 0);
    return total.toFixed(2);
  }

  cargarLugares() {
    this.cargando.set(true);
    this.error.set(null);

    this.radarService.getAll().subscribe({
      next: (data) => {
        this.lugares.set(data);
        this.cargando.set(false);
        this.cargarCatalogos(data);
        this.cargarComentarios(data);
      },
      error: (err) => {
        this.error.set(`Error: ${err.status} - ${err.message}`);
        this.cargando.set(false);
      }
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

  eliminarComentario(idComentario: number, idRadar: number) {
    if (!confirm('Eliminar este comentario?')) return;
    this.comentarioService.delete(idComentario).subscribe({
      next: () => this.cargarComentarios(this.lugares()),
      error: () => alert('Error al eliminar comentario')
    });
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

  cerrarSesion() {
    if (confirm('¿Cerrar sesión?')) {
      this.authService.cerrarSesion();
      this.router.navigate(['/login']);
    }
  }
}
