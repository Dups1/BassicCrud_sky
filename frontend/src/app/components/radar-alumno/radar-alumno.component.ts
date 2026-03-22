import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RadarService } from '../../services/radar.service';
import { CategoriaService } from '../../services/categoria.service';
import { CatalogoService } from '../../services/catalogo.service';
import { ComentarioService } from '../../services/comentario.service';
import { AuthService } from '../../services/auth.service';
import { Radar } from '../../models/radar.model';
import { Categoria } from '../../models/categoria.model';
import { Catalogo } from '../../models/catalogo.model';
import { Comentario } from '../../models/comentario.model';

@Component({
  selector: 'app-radar-alumno',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './radar-alumno.component.html'
})
export class RadarAlumnoComponent implements OnInit {
  private radarService = inject(RadarService);
  private categoriaService = inject(CategoriaService);
  private cataloService = inject(CatalogoService);
  private comentarioService = inject(ComentarioService);
  private authService = inject(AuthService);
  private router = inject(Router);

  lugares = signal<Radar[]>([]);
  categorias = signal<Categoria[]>([]);
  catalogosPorLugar = signal<Map<number, Catalogo[]>>(new Map());
  comentariosPorLugar = signal<Map<number, Comentario[]>>(new Map());
  mostrarComentarios = signal<number | null>(null);
  mostrarFormComentario = signal<number | null>(null);
  nuevoComentario: Comentario = this.comentarioVacio(0);
  enviandoComentario = signal(false);
  editandoComentario = signal<Comentario | null>(null);

  filtroTexto = signal('');
  filtroCategoriaId = signal<number | null>(null);
  soloFavoritos = signal(false);
  soloPatrocinados = signal(false);
  precioMaxStr = signal('');
  califMinStr = signal('');

  lugaresFiltrados = computed(() => {
    let list = [...this.lugares()];

    // Construir mapa DENTRO del computed para que el signal de categorias() sea trackeado
    const catPorId = new Map<number, string>();
    for (const c of this.categorias()) {
      const id = this.normIdCategoria(c.id_categoria);
      if (id != null) catPorId.set(id, String(c.categoria ?? ''));
    }

    const q = String(this.filtroTexto() ?? '').trim().toLowerCase();
    if (q) {
      const incluye = (v: string | number | null | undefined) =>
        String(v ?? '').toLowerCase().includes(q);
      list = list.filter((l) => {
        const idL = this.normIdCategoria(l.id_categoria);
        const nombrePorId = idL != null ? catPorId.get(idL) ?? '' : '';
        return (
          incluye(l.nombre) ||
          incluye(l.direccion) ||
          incluye(l.nota) ||
          incluye(l.categoria) ||
          incluye(nombrePorId)
        );
      });
    }

    const catId = this.filtroCategoriaId();
    const nSel = catId != null ? this.normIdCategoria(catId) : null;
    if (nSel != null) {
      const nombreSel = (catPorId.get(nSel) ?? '').trim().toLowerCase();
      list = list.filter((l) => {
        const idL = this.normIdCategoria(l.id_categoria);
        if (idL != null && idL === nSel) return true;
        const txt = (l.categoria ?? '').trim().toLowerCase();
        if (nombreSel && txt === nombreSel) return true;
        const nombreLDesdeId = idL != null ? (catPorId.get(idL) ?? '').trim().toLowerCase() : '';
        if (nombreSel && nombreLDesdeId === nombreSel) return true;
        return false;
      });
    }
    if (this.soloFavoritos()) {
      list = list.filter((l) => !!l.favorito);
    }
    if (this.soloPatrocinados()) {
      list = list.filter((l) => !!l.patrocinado);
    }
    const pmaxRaw = String(this.precioMaxStr() ?? '').trim();
    if (pmaxRaw !== '') {
      const pmax = parseFloat(pmaxRaw.replace(',', '.'));
      if (!Number.isNaN(pmax)) {
        list = list.filter((l) => Number(l.precio) <= pmax);
      }
    }
    const cminRaw = String(this.califMinStr() ?? '').trim();
    if (cminRaw !== '') {
      const cmin = parseFloat(cminRaw.replace(',', '.'));
      if (!Number.isNaN(cmin)) {
        list = list.filter((l) => {
          const c = l.calificacion;
          return c != null && Number(c) >= cmin;
        });
      }
    }
    return list;
  });

  /** IDs de MySQL/JSON suelen venir como string; parseInt es mas robusto que Number() */
  private normIdCategoria(v: unknown): number | null {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    if (s === '') return null;
    const n = parseInt(s, 10);
    return Number.isNaN(n) ? null : n;
  }

  cargando = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.cargarLugares();
    this.categoriaService.getAll().subscribe({
      next: (data) => this.categorias.set(data),
      error: () => {}
    });
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

  getCatalogo(idRadar: number): Catalogo[] {
    return this.catalogosPorLugar().get(idRadar) ?? [];
  }

  getComentarios(idRadar: number): Comentario[] {
    return this.comentariosPorLugar().get(idRadar) ?? [];
  }

  cargarComentarios(lugares: Radar[]) {
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

  toggleComentarios(idRadar: number) {
    this.mostrarComentarios.set(this.mostrarComentarios() === idRadar ? null : idRadar);
  }

  abrirFormComentario(idRadar: number) {
    const usuario = this.authService.getSesion();
    const nombreUsuario = usuario?.nombre || '';
    this.nuevoComentario = this.comentarioVacio(idRadar);
    this.nuevoComentario.nombre_estudiante = nombreUsuario;
    this.mostrarFormComentario.set(idRadar);
  }

  cerrarFormComentario() {
    this.mostrarFormComentario.set(null);
  }

  guardarComentario() {
    if (!this.nuevoComentario.nombre_estudiante.trim() || !this.nuevoComentario.opinion.trim()) {
      alert('Por favor completa nombre y opinion');
      return;
    }
    this.enviandoComentario.set(true);
    
    if (this.editandoComentario()) {
      // Actualizar
      this.comentarioService.update(this.editandoComentario()!.id_comentario!, this.editandoComentario()!).subscribe({
        next: () => {
          this.cargarComentarios(this.lugares());
          this.cerrarFormComentario();
          this.enviandoComentario.set(false);
          this.editandoComentario.set(null);
        },
        error: () => {
          alert('Error al actualizar comentario');
          this.enviandoComentario.set(false);
        }
      });
    } else {
      // Crear
      this.comentarioService.create(this.nuevoComentario).subscribe({
        next: () => {
          this.cargarComentarios(this.lugares());
          this.cerrarFormComentario();
          this.enviandoComentario.set(false);
        },
        error: () => {
          alert('Error al guardar comentario');
          this.enviandoComentario.set(false);
        }
      });
    }
  }

  editarComentario(com: Comentario) {
    this.editandoComentario.set(com);
    this.nuevoComentario = { ...com };
    this.mostrarFormComentario.set(com.id_radar);
  }

  eliminarComentario(idComentario: number, idRadar: number) {
    if (!confirm('Eliminar tu comentario?')) return;
    this.comentarioService.delete(idComentario).subscribe({
      next: () => this.cargarComentarios(this.lugares()),
      error: () => alert('Error al eliminar comentario')
    });
  }

  private comentarioVacio(idRadar: number): Comentario {
    return { id_radar: idRadar, nombre_estudiante: '', calificacion: 5, opinion: '' };
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

  limpiarFiltros() {
    this.filtroTexto.set('');
    this.filtroCategoriaId.set(null);
    this.soloFavoritos.set(false);
    this.soloPatrocinados.set(false);
    this.precioMaxStr.set('');
    this.califMinStr.set('');
  }

  /** Zoneless: evitar NgModel; (input) dispara CD y actualiza signals */
  onBuscarInput(ev: Event) {
    const v = (ev.target as HTMLInputElement).value;
    this.filtroTexto.set(v);
  }

  /** ngModel de inputs number puede emitir number | null; el computed usa trim sobre string */
  setPrecioMaxStr(v: unknown) {
    this.precioMaxStr.set(v == null || v === '' ? '' : String(v));
  }

  setCalifMinStr(v: unknown) {
    this.califMinStr.set(v == null || v === '' ? '' : String(v));
  }

  onPrecioMaxInput(ev: Event) {
    this.setPrecioMaxStr((ev.target as HTMLInputElement).value);
  }

  onCalifMinInput(ev: Event) {
    this.setCalifMinStr((ev.target as HTMLInputElement).value);
  }

  seleccionarCategoria(id: number | string) {
    const n = this.normIdCategoria(id);
    if (n != null) this.filtroCategoriaId.set(n);
  }

  categoriaActiva(id: number | string): boolean {
    const cur = this.filtroCategoriaId();
    if (cur == null) return false;
    const a = this.normIdCategoria(cur);
    const b = this.normIdCategoria(id);
    return a != null && b != null && a === b;
  }

  cerrarSesion() {
    if (confirm('¿Cerrar sesión?')) {
      this.authService.cerrarSesion();
      this.router.navigate(['/login']);
    }
  }
}
